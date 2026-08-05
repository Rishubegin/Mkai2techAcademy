const request = require("supertest");
const {
  app,
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createUserAndLogin,
} = require("./testUtils");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectTestDB();
});

const enrollAndComplete = async (adminCookie, studentCookie, studentId) => {
  const courseRes = await request(app)
    .post("/api/courses")
    .set("Cookie", adminCookie)
    .send({ title: "Certificate Test Course", category: "Test", fees: 1000 });

  const batchRes = await request(app)
    .post("/api/batches")
    .set("Cookie", adminCookie)
    .send({ batchName: "Certificate Test Batch", course: courseRes.body.course._id, capacity: 5 });

  await request(app)
    .post(`/api/batches/${batchRes.body.batch._id}/enroll`)
    .set("Cookie", studentCookie);

  await request(app)
    .patch(`/api/batches/${batchRes.body.batch._id}/students/${studentId}/progress`)
    .set("Cookie", adminCookie)
    .send({ progressPercent: 100 });

  return { courseId: courseRes.body.course._id, batchId: batchRes.body.batch._id };
};

describe("Certificates", () => {
  it("rejects issuance for a student who hasn't completed the batch", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin1@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent1@example.com",
      role: "student",
    });

    const courseRes = await request(app)
      .post("/api/courses")
      .set("Cookie", adminCookie)
      .send({ title: "Incomplete Course", category: "Test", fees: 1000 });

    const batchRes = await request(app)
      .post("/api/batches")
      .set("Cookie", adminCookie)
      .send({ batchName: "Incomplete Batch", course: courseRes.body.course._id, capacity: 5 });

    await request(app)
      .post(`/api/batches/${batchRes.body.batch._id}/enroll`)
      .set("Cookie", studentCookie);

    const res = await request(app)
      .post(`/api/certificates/${batchRes.body.batch._id}/${student._id}`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(400);
  });

  it("rejects issuance from a non-admin", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin2@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent2@example.com",
      role: "student",
    });

    const { batchId } = await enrollAndComplete(adminCookie, studentCookie, student._id);

    const res = await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(403);
  });

  it("issues a certificate once a student has completed the batch", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin3@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent3@example.com",
      role: "student",
    });

    const { batchId } = await enrollAndComplete(adminCookie, studentCookie, student._id);

    const res = await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(201);
    expect(res.body.certificate.certificateId).toMatch(/^MKAI-\d{4}-[0-9A-F]{8}$/);
  });

  it("is idempotent — re-issuing returns the same certificate instead of erroring", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin4@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent4@example.com",
      role: "student",
    });

    const { batchId } = await enrollAndComplete(adminCookie, studentCookie, student._id);

    const firstRes = await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", adminCookie);

    const secondRes = await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", adminCookie);

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.certificate.certificateId).toBe(
      firstRes.body.certificate.certificateId,
    );
  });

  it("lists a student's own certificates", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin5@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent5@example.com",
      role: "student",
    });

    const { batchId } = await enrollAndComplete(adminCookie, studentCookie, student._id);
    await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", adminCookie);

    const res = await request(app).get("/api/certificates/my").set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.certificates).toHaveLength(1);
  });

  it("verifies a valid certificate publicly without exposing contact details", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin6@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent6@example.com",
      role: "student",
      name: "Public Verify Student",
    });

    const { batchId } = await enrollAndComplete(adminCookie, studentCookie, student._id);
    const issueRes = await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", adminCookie);

    const res = await request(app).get(
      `/api/certificates/verify/${issueRes.body.certificate.certificateId}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.studentName).toBe("Public Verify Student");
    expect(res.body.email).toBeUndefined();
  });

  it("returns 404 for an unknown certificate id on verify", async () => {
    const res = await request(app).get("/api/certificates/verify/MKAI-2026-DEADBEEF");

    expect(res.status).toBe(404);
    expect(res.body.valid).toBe(false);
  });

  it("allows the owning student to download their certificate as a PDF", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin7@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent7@example.com",
      role: "student",
    });

    const { batchId } = await enrollAndComplete(adminCookie, studentCookie, student._id);
    const issueRes = await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", adminCookie);

    const res = await request(app)
      .get(`/api/certificates/${issueRes.body.certificate.certificateId}/download`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });

  it("rejects downloading someone else's certificate", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "certadmin8@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "certstudent8@example.com",
      role: "student",
    });
    const { cookie: outsiderCookie } = await createUserAndLogin({
      email: "certoutsider8@example.com",
      role: "student",
    });

    const { batchId } = await enrollAndComplete(adminCookie, studentCookie, student._id);
    const issueRes = await request(app)
      .post(`/api/certificates/${batchId}/${student._id}`)
      .set("Cookie", adminCookie);

    const res = await request(app)
      .get(`/api/certificates/${issueRes.body.certificate.certificateId}/download`)
      .set("Cookie", outsiderCookie);

    expect(res.status).toBe(403);
  });
});
