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

const enrollStudentInNewCourse = async (adminCookie, studentId) => {
  const courseRes = await request(app)
    .post("/api/courses")
    .set("Cookie", adminCookie)
    .send({ title: "Review Test Course", category: "Test", fees: 1000 });

  await enrollStudent(studentId, courseRes.body.course._id);

  return courseRes.body.course._id;
};

describe("Reviews", () => {
  it("rejects a review from a student not enrolled in the course", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "reviewadmin1@example.com",
      role: "admin",
    });
    const { cookie: outsiderCookie } = await createUserAndLogin({
      email: "reviewoutsider1@example.com",
      role: "student",
    });

    const courseRes = await request(app)
      .post("/api/courses")
      .set("Cookie", adminCookie)
      .send({ title: "Unenrolled Course", category: "Test", fees: 1000 });

    const res = await request(app)
      .post("/api/reviews")
      .set("Cookie", outsiderCookie)
      .send({ courseId: courseRes.body.course._id, rating: 5 });

    expect(res.status).toBe(403);
  });

  it("allows a review from an enrolled student and computes the average rating", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "reviewadmin2@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "reviewstudent2@example.com",
      role: "student",
    });

    const courseId = await enrollStudentInNewCourse(adminCookie, student._id);

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Cookie", studentCookie)
      .send({ courseId, rating: 4, comment: "Solid course" });

    expect(createRes.status).toBe(201);

    const listRes = await request(app).get(`/api/reviews/course/${courseId}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.stats.averageRating).toBe(4);
    expect(listRes.body.stats.totalReviews).toBe(1);
  });

  it("rejects a second review from the same student for the same course", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "reviewadmin3@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "reviewstudent3@example.com",
      role: "student",
    });

    const courseId = await enrollStudentInNewCourse(adminCookie, student._id);

    await request(app)
      .post("/api/reviews")
      .set("Cookie", studentCookie)
      .send({ courseId, rating: 5 });

    const res = await request(app)
      .post("/api/reviews")
      .set("Cookie", studentCookie)
      .send({ courseId, rating: 3 });

    expect(res.status).toBe(409);
  });
});
