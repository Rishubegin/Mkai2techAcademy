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

describe("Testimonials", () => {
  it("hides an unapproved testimonial from the public list", async () => {
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "testimonialstudent1@example.com",
      role: "student",
    });

    await request(app)
      .post("/api/testimonials")
      .set("Cookie", studentCookie)
      .send({ testimonial: "This course changed everything for me." });

    const res = await request(app).get("/api/testimonials");

    expect(res.status).toBe(200);
    expect(res.body.testimonials).toHaveLength(0);
  });

  it("shows an approved testimonial publicly after admin approval", async () => {
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "testimonialstudent2@example.com",
      role: "student",
    });
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "testimonialadmin2@example.com",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/testimonials")
      .set("Cookie", studentCookie)
      .send({ testimonial: "This course changed everything for me." });

    await request(app)
      .patch(`/api/testimonials/${createRes.body.testimonial._id}`)
      .set("Cookie", adminCookie)
      .send({ isApproved: true });

    const res = await request(app).get("/api/testimonials");

    expect(res.status).toBe(200);
    expect(res.body.testimonials).toHaveLength(1);
  });

  it("rejects testimonial approval from a non-admin", async () => {
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "testimonialstudent3@example.com",
      role: "student",
    });

    const createRes = await request(app)
      .post("/api/testimonials")
      .set("Cookie", studentCookie)
      .send({ testimonial: "Another great experience here." });

    const res = await request(app)
      .patch(`/api/testimonials/${createRes.body.testimonial._id}`)
      .set("Cookie", studentCookie)
      .send({ isApproved: true });

    expect(res.status).toBe(403);
  });
});
