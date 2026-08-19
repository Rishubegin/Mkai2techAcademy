const request = require("supertest");
const {
  app,
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createUserAndLogin,
  enrollStudent,
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

const createCourse = async (adminCookie) => {
  const res = await request(app)
    .post("/api/courses")
    .set("Cookie", adminCookie)
    .send({ title: "Enrollment Test Course", category: "Test", fees: 1000 });

  return res.body.course._id;
};

describe("Enrollment removal is admin-only", () => {
  it("forbids a student from removing their own enrollment", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrolladmin2@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "enrollstudent2@example.com",
      role: "student",
    });
    const courseId = await createCourse(adminCookie);

    await enrollStudent(student._id, courseId);

    const res = await request(app)
      .delete(`/api/courses/${courseId}/enrollments/${student._id}`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(403);

    // The enrollment must survive the rejected attempt.
    const listRes = await request(app)
      .get(`/api/students/${student._id}/enrollments`)
      .set("Cookie", studentCookie);
    expect(listRes.body.enrollments).toHaveLength(1);
  });

  it("lets an admin remove a student's enrollment", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrolladmin3@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "enrollstudent3@example.com",
      role: "student",
    });
    const courseId = await createCourse(adminCookie);

    await enrollStudent(student._id, courseId);

    const res = await request(app)
      .delete(`/api/courses/${courseId}/enrollments/${student._id}`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);

    const listRes = await request(app)
      .get(`/api/students/${student._id}/enrollments`)
      .set("Cookie", adminCookie);
    expect(listRes.body.enrollments).toHaveLength(0);
  });

});
