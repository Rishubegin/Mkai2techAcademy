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

describe("Notices", () => {
  it("blocks a student from creating a notice", async () => {
    const { cookie } = await createUserAndLogin({
      email: "noticestudent1@example.com",
      role: "student",
    });

    const res = await request(app)
      .post("/api/notices")
      .set("Cookie", cookie)
      .send({ title: "Unauthorized", message: "nope" });

    expect(res.status).toBe(403);
  });

  it("shows a student notices targeted at 'all' and their own role, not other roles", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "noticeadmin1@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "noticestudent2@example.com",
      role: "student",
    });

    await request(app)
      .post("/api/notices")
      .set("Cookie", adminCookie)
      .send({ title: "For everyone", message: "m1", targetRole: "all" });
    await request(app)
      .post("/api/notices")
      .set("Cookie", adminCookie)
      .send({ title: "For students", message: "m2", targetRole: "student" });
    await request(app)
      .post("/api/notices")
      .set("Cookie", adminCookie)
      .send({ title: "For teachers", message: "m3", targetRole: "teacher" });

    const res = await request(app).get("/api/notices").set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.notices).toHaveLength(2);
    expect(res.body.notices.map((n) => n.title).sort()).toEqual([
      "For everyone",
      "For students",
    ]);
  });

  it("hides expired notices from the default (non-admin) view", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "noticeadmin2@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "noticestudent3@example.com",
      role: "student",
    });

    await request(app)
      .post("/api/notices")
      .set("Cookie", adminCookie)
      .send({
        title: "Expired notice",
        message: "old",
        targetRole: "all",
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });

    const res = await request(app).get("/api/notices").set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.notices).toHaveLength(0);
  });

  it("rejects ?all=true from a non-admin but allows it for an admin", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "noticeadmin3@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "noticestudent4@example.com",
      role: "student",
    });

    await request(app)
      .post("/api/notices")
      .set("Cookie", adminCookie)
      .send({
        title: "Inactive notice",
        message: "hidden",
        targetRole: "all",
        isActive: false,
      });

    const studentRes = await request(app)
      .get("/api/notices")
      .query({ all: true })
      .set("Cookie", studentCookie);
    expect(studentRes.status).toBe(403);

    const adminRes = await request(app)
      .get("/api/notices")
      .query({ all: true })
      .set("Cookie", adminCookie);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.notices).toHaveLength(1);
  });

  it("lets an admin update and delete a notice", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "noticeadmin4@example.com",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/notices")
      .set("Cookie", adminCookie)
      .send({ title: "Original", message: "m", targetRole: "all" });
    const noticeId = createRes.body.notice._id;

    const updateRes = await request(app)
      .patch(`/api/notices/${noticeId}`)
      .set("Cookie", adminCookie)
      .send({ title: "Updated" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.notice.title).toBe("Updated");

    const deleteRes = await request(app)
      .delete(`/api/notices/${noticeId}`)
      .set("Cookie", adminCookie);
    expect(deleteRes.status).toBe(200);
  });
});
