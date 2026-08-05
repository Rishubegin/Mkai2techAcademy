const request = require("supertest");
const { app, connectTestDB, disconnectTestDB, clearCollections } = require("./testUtils");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Auth", () => {
  const validUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "StrongPass123!",
  };

  it("registers a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("rejects registration with a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects registration with a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, email: "weak@example.com", password: "weak" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("logs in with correct credentials and sets a cookie", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects login with the wrong password", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "WrongPass123!" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects /api/users/me without a token", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("allows /api/users/me with a valid session cookie", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app).get("/api/users/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
  });
});
