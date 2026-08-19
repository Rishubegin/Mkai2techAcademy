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

describe("Discount codes", () => {
  it("rejects creation from a non-admin", async () => {
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "discountstudent1@example.com",
      role: "student",
    });

    const res = await request(app)
      .post("/api/discounts")
      .set("Cookie", studentCookie)
      .send({ code: "STUD10", type: "percent", value: 10 });

    expect(res.status).toBe(403);
  });

  it("creates a percent discount code as admin", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "discountadmin1@example.com",
      role: "admin",
    });

    const res = await request(app)
      .post("/api/discounts")
      .set("Cookie", adminCookie)
      .send({ code: "early bird", type: "percent", value: 20, description: "Early bird offer" });

    expect(res.status).toBe(201);
    expect(res.body.discount.code).toBe("EARLY BIRD");
    expect(res.body.discount.isActive).toBe(true);
  });

  it("rejects a percent value over 100", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "discountadmin2@example.com",
      role: "admin",
    });

    const res = await request(app)
      .post("/api/discounts")
      .set("Cookie", adminCookie)
      .send({ code: "TOOBIG", type: "percent", value: 150 });

    expect(res.status).toBe(400);
  });

  it("rejects a duplicate code", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "discountadmin3@example.com",
      role: "admin",
    });

    await request(app)
      .post("/api/discounts")
      .set("Cookie", adminCookie)
      .send({ code: "DUPE10", type: "flat", value: 500 });

    const res = await request(app)
      .post("/api/discounts")
      .set("Cookie", adminCookie)
      .send({ code: "DUPE10", type: "flat", value: 500 });

    expect(res.status).toBe(400);
    expect(res.body.Error).toBe("This code already exists");
  });

  it("updates and deletes a discount code", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "discountadmin7@example.com",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/discounts")
      .set("Cookie", adminCookie)
      .send({ code: "TEMP10", type: "flat", value: 100 });

    const updateRes = await request(app)
      .patch(`/api/discounts/${createRes.body.discount._id}`)
      .set("Cookie", adminCookie)
      .send({ value: 200 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.discount.value).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/discounts/${createRes.body.discount._id}`)
      .set("Cookie", adminCookie);

    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get("/api/discounts").set("Cookie", adminCookie);
    expect(listRes.body.discounts).toHaveLength(0);
  });

  it("rejects an update with a disallowed field", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "discountadmin8@example.com",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/discounts")
      .set("Cookie", adminCookie)
      .send({ code: "LOCKED10", type: "flat", value: 100 });

    const res = await request(app)
      .patch(`/api/discounts/${createRes.body.discount._id}`)
      .set("Cookie", adminCookie)
      .send({ code: "HACKED" });

    expect(res.status).toBe(400);
  });
});
