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

const sampleCourse = {
  title: "Test Course",
  category: "Programming",
  mode: "Offline",
  fees: 5000,
};

describe("Courses", () => {
  it("lists courses publicly without authentication", async () => {
    const res = await request(app).get("/api/courses");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.courses)).toBe(true);
  });

  it("rejects course creation without authentication", async () => {
    const res = await request(app).post("/api/courses").send(sampleCourse);

    expect(res.status).toBe(401);
  });

  it("rejects course creation from a student (authorize gate)", async () => {
    const { cookie } = await createUserAndLogin({
      email: "student@example.com",
      role: "student",
    });

    const res = await request(app)
      .post("/api/courses")
      .set("Cookie", cookie)
      .send(sampleCourse);

    expect(res.status).toBe(403);
  });

  it("allows course creation from an admin", async () => {
    const { cookie } = await createUserAndLogin({
      email: "admin@example.com",
      role: "admin",
    });

    const res = await request(app)
      .post("/api/courses")
      .set("Cookie", cookie)
      .send(sampleCourse);

    expect(res.status).toBe(201);
    expect(res.body.course.title).toBe(sampleCourse.title);
  });

  it("fetches a single course after creation", async () => {
    const { cookie } = await createUserAndLogin({
      email: "admin2@example.com",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/courses")
      .set("Cookie", cookie)
      .send(sampleCourse);

    const courseId = createRes.body.course._id;
    const res = await request(app).get(`/api/courses/${courseId}`);

    expect(res.status).toBe(200);
    expect(res.body.course.title).toBe(sampleCourse.title);
  });

  it("returns 404 for a nonexistent course", async () => {
    const res = await request(app).get("/api/courses/000000000000000000000000");

    expect(res.status).toBe(404);
  });

  it("rejects course deletion from a student", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "admin3@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "student3@example.com",
      role: "student",
    });

    const createRes = await request(app)
      .post("/api/courses")
      .set("Cookie", adminCookie)
      .send(sampleCourse);

    const courseId = createRes.body.course._id;
    const res = await request(app)
      .delete(`/api/courses/${courseId}`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(403);
  });

  it("allows course deletion from an admin", async () => {
    const { cookie } = await createUserAndLogin({
      email: "admin4@example.com",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/courses")
      .set("Cookie", cookie)
      .send(sampleCourse);

    const courseId = createRes.body.course._id;
    const res = await request(app).delete(`/api/courses/${courseId}`).set("Cookie", cookie);

    expect(res.status).toBe(200);
  });
});
