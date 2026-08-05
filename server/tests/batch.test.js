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

const createCourseAndBatch = async (adminCookie, capacity = 1) => {
  const courseRes = await request(app)
    .post("/api/courses")
    .set("Cookie", adminCookie)
    .send({ title: "Batch Test Course", category: "Test", fees: 1000 });

  const batchRes = await request(app)
    .post("/api/batches")
    .set("Cookie", adminCookie)
    .send({ batchName: "Test Batch", course: courseRes.body.course._id, capacity });

  return batchRes.body.batch._id;
};

describe("Batch self-enrollment", () => {
  it("lets a student enroll themselves in a batch", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "batchadmin1@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "batchstudent1@example.com",
      role: "student",
    });
    const batchId = await createCourseAndBatch(adminCookie, 2);

    const res = await request(app)
      .post(`/api/batches/${batchId}/enroll`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.batch.students).toHaveLength(1);
    expect(res.body.batch.students[0]).toHaveProperty("enrolledAt");
  });

  it("prevents duplicate enrollment in the same batch", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "batchadmin2@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "batchstudent2@example.com",
      role: "student",
    });
    const batchId = await createCourseAndBatch(adminCookie, 2);

    await request(app).post(`/api/batches/${batchId}/enroll`).set("Cookie", studentCookie);
    const res = await request(app)
      .post(`/api/batches/${batchId}/enroll`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/already enrolled/i);
  });

  it("rejects enrollment once a batch is at full capacity", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "batchadmin3@example.com",
      role: "admin",
    });
    const { cookie: student1Cookie } = await createUserAndLogin({
      email: "batchstudent3a@example.com",
      role: "student",
    });
    const { cookie: student2Cookie } = await createUserAndLogin({
      email: "batchstudent3b@example.com",
      role: "student",
    });
    const batchId = await createCourseAndBatch(adminCookie, 1);

    const firstRes = await request(app)
      .post(`/api/batches/${batchId}/enroll`)
      .set("Cookie", student1Cookie);
    const secondRes = await request(app)
      .post(`/api/batches/${batchId}/enroll`)
      .set("Cookie", student2Cookie);

    expect(firstRes.status).toBe(200);
    expect(secondRes.status).toBe(400);
    expect(secondRes.body.Error).toMatch(/full capacity/i);
  });

  it("rejects admin-only add-student route when called by a student", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "batchadmin4@example.com",
      role: "admin",
    });
    const { cookie: studentCookie, user: student } = await createUserAndLogin({
      email: "batchstudent4@example.com",
      role: "student",
    });
    const batchId = await createCourseAndBatch(adminCookie, 2);

    const res = await request(app)
      .post(`/api/batches/${batchId}/students`)
      .set("Cookie", studentCookie)
      .send({ studentId: student._id.toString() });

    expect(res.status).toBe(403);
  });

  it("lets a student unenroll themselves", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "batchadmin5@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "batchstudent5@example.com",
      role: "student",
    });
    const batchId = await createCourseAndBatch(adminCookie, 2);

    await request(app).post(`/api/batches/${batchId}/enroll`).set("Cookie", studentCookie);
    const res = await request(app)
      .delete(`/api/batches/${batchId}/enroll`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.batch.students).toHaveLength(0);
  });
});
