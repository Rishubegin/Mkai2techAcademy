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

// Multer's fileFilter only inspects the filename extension, so a plain
// buffer with a ".jpg" name satisfies it without needing a real image.
const fakeImage = Buffer.from("fake-image-bytes");

const createCourse = async (adminCookie) => {
  const res = await request(app)
    .post("/api/courses")
    .set("Cookie", adminCookie)
    .send({ title: "Image Test Course", category: "Test", fees: 1000 });

  return res.body.course._id;
};

describe("Course image upload", () => {
  it("uploads an image and stores the Cloudinary URL on the course", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "courseimgadmin1@example.com",
      role: "admin",
    });
    const courseId = await createCourse(adminCookie);

    const res = await request(app)
      .patch(`/api/courses/${courseId}/image`)
      .set("Cookie", adminCookie)
      .attach("image", fakeImage, "course.jpg");

    expect(res.status).toBe(200);
    expect(res.body.course.image).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(res.body.course.imagePublicId).toBeTruthy();
  });

  it("rejects a request with no file attached", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "courseimgadmin2@example.com",
      role: "admin",
    });
    const courseId = await createCourse(adminCookie);

    const res = await request(app)
      .patch(`/api/courses/${courseId}/image`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/image file is required/i);
  });

  it("rejects a non-image file type", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "courseimgadmin3@example.com",
      role: "admin",
    });
    const courseId = await createCourse(adminCookie);

    const res = await request(app)
      .patch(`/api/courses/${courseId}/image`)
      .set("Cookie", adminCookie)
      .attach("image", Buffer.from("not-an-image"), "notes.pdf");

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects a non-admin", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "courseimgadmin4@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "courseimgstudent@example.com",
      role: "student",
    });
    const courseId = await createCourse(adminCookie);

    const res = await request(app)
      .patch(`/api/courses/${courseId}/image`)
      .set("Cookie", studentCookie)
      .attach("image", fakeImage, "course.jpg");

    expect(res.status).toBe(403);
  });
});
