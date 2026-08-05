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

describe("Gallery", () => {
  it("blocks unauthenticated upload", async () => {
    const res = await request(app)
      .post("/api/gallery")
      .field("title", "Test Photo")
      .attach("image", fakeImage, "test.jpg");

    expect(res.status).toBe(401);
  });

  it("blocks a student from uploading", async () => {
    const { cookie } = await createUserAndLogin({
      email: "gallerystudent1@example.com",
      role: "student",
    });

    const res = await request(app)
      .post("/api/gallery")
      .set("Cookie", cookie)
      .field("title", "Test Photo")
      .attach("image", fakeImage, "test.jpg");

    expect(res.status).toBe(403);
  });

  it("lets an admin upload, list, feature, and delete a photo", async () => {
    const { cookie } = await createUserAndLogin({
      email: "galleryadmin1@example.com",
      role: "admin",
    });

    const uploadRes = await request(app)
      .post("/api/gallery")
      .set("Cookie", cookie)
      .field("title", "Workshop Day")
      .field("category", "Training")
      .attach("image", fakeImage, "test.jpg");

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.photo.image).toMatch(/^https:\/\/res\.cloudinary\.com\//);

    const listRes = await request(app).get("/api/gallery");
    expect(listRes.status).toBe(200);
    expect(listRes.body.photos).toHaveLength(1);

    const photoId = uploadRes.body.photo._id;

    const featureRes = await request(app)
      .patch(`/api/gallery/${photoId}/feature`)
      .set("Cookie", cookie);
    expect(featureRes.status).toBe(200);
    expect(featureRes.body.photo.isFeatured).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/gallery/${photoId}`)
      .set("Cookie", cookie);
    expect(deleteRes.status).toBe(200);

    const listAfterDelete = await request(app).get("/api/gallery");
    expect(listAfterDelete.body.photos).toHaveLength(0);
  });

  it("rejects an upload with no image file", async () => {
    const { cookie } = await createUserAndLogin({
      email: "galleryadmin2@example.com",
      role: "admin",
    });

    const res = await request(app)
      .post("/api/gallery")
      .set("Cookie", cookie)
      .field("title", "No Image");

    expect(res.status).toBe(400);
  });
});
