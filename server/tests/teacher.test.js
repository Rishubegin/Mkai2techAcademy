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

const createProfileFor = async (cookie, userId) => {
  const res = await request(app)
    .post("/api/teacher-profiles")
    .set("Cookie", cookie)
    .send({ user: userId, qualification: "M.Sc Physics" });

  return res.body.profile._id;
};

describe("Teacher photo upload", () => {
  it("uploads a photo and stores the Cloudinary URL on the profile", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "teacherphotoadmin1@example.com",
      role: "admin",
    });
    const { user: teacher } = await createUserAndLogin({
      email: "teacherphoto1@example.com",
      role: "teacher",
    });
    const profileId = await createProfileFor(adminCookie, teacher._id);

    const res = await request(app)
      .patch(`/api/teacher-profiles/${profileId}/photo`)
      .set("Cookie", adminCookie)
      .attach("photo", fakeImage, "photo.jpg");

    expect(res.status).toBe(200);
    expect(res.body.profile.photo).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(res.body.profile.photoPublicId).toBeTruthy();
  });

  it("rejects a request with no file attached", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "teacherphotoadmin2@example.com",
      role: "admin",
    });
    const { user: teacher } = await createUserAndLogin({
      email: "teacherphoto2@example.com",
      role: "teacher",
    });
    const profileId = await createProfileFor(adminCookie, teacher._id);

    const res = await request(app)
      .patch(`/api/teacher-profiles/${profileId}/photo`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/photo file is required/i);
  });

  it("rejects a non-image file type", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "teacherphotoadmin3@example.com",
      role: "admin",
    });
    const { user: teacher } = await createUserAndLogin({
      email: "teacherphoto3@example.com",
      role: "teacher",
    });
    const profileId = await createProfileFor(adminCookie, teacher._id);

    const res = await request(app)
      .patch(`/api/teacher-profiles/${profileId}/photo`)
      .set("Cookie", adminCookie)
      .attach("photo", Buffer.from("not-an-image"), "resume.pdf");

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects an unrelated user who is neither the owner nor an admin", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "teacherphotoadmin4@example.com",
      role: "admin",
    });
    const { user: teacher } = await createUserAndLogin({
      email: "teacherphoto4@example.com",
      role: "teacher",
    });
    const { cookie: strangerCookie } = await createUserAndLogin({
      email: "teacherphotostranger@example.com",
      role: "student",
    });
    const profileId = await createProfileFor(adminCookie, teacher._id);

    const res = await request(app)
      .patch(`/api/teacher-profiles/${profileId}/photo`)
      .set("Cookie", strangerCookie)
      .attach("photo", fakeImage, "photo.jpg");

    expect(res.status).toBe(403);
  });
});
