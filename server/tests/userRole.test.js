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

describe("Role management", () => {
  it("lets an admin promote a student to admin", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "roleadmin1@example.com",
      role: "admin",
    });
    const { user: student } = await createUserAndLogin({
      email: "rolestudent1@example.com",
      role: "student",
    });

    const res = await request(app)
      .patch(`/api/users/${student._id}/role`)
      .set("Cookie", adminCookie)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
  });

  it("forbids a student from promoting themselves", async () => {
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "rolestudent2@example.com",
      role: "student",
    });

    const res = await request(app)
      .patch(`/api/users/${student._id}/role`)
      .set("Cookie", studentCookie)
      .send({ role: "admin" });

    expect(res.status).toBe(403);
  });

  it("stops an admin changing their own role, so a last admin can't lock everyone out", async () => {
    const { user: admin, cookie: adminCookie } = await createUserAndLogin({
      email: "roleadmin3@example.com",
      role: "admin",
    });

    const res = await request(app)
      .patch(`/api/users/${admin._id}/role`)
      .set("Cookie", adminCookie)
      .send({ role: "student" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot change your own role/i);
  });

  it("rejects a role outside the allowed set", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "roleadmin4@example.com",
      role: "admin",
    });
    const { user: student } = await createUserAndLogin({
      email: "rolestudent4@example.com",
      role: "student",
    });

    const res = await request(app)
      .patch(`/api/users/${student._id}/role`)
      .set("Cookie", adminCookie)
      .send({ role: "superuser" });

    expect(res.status).toBe(400);
  });

  it("still refuses role changes through the general user update", async () => {
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "rolestudent5@example.com",
      role: "student",
    });

    const res = await request(app)
      .patch(`/api/users/${student._id}`)
      .set("Cookie", studentCookie)
      .send({ role: "admin" });

    expect(res.status).toBe(400);

    const meRes = await request(app).get("/api/users/me").set("Cookie", studentCookie);
    expect(meRes.body.user.role).toBe("student");
  });
});
