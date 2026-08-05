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

const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const createEvent = async (adminCookie, maxAttendees = 1) => {
  const res = await request(app)
    .post("/api/events")
    .set("Cookie", adminCookie)
    .field("title", "MERN Workshop")
    .field("description", "A hands-on MERN workshop")
    .field("date", futureDate())
    .field("location", "Main Hall")
    .field("maxAttendees", maxAttendees);

  return res.body.event._id;
};

describe("Events", () => {
  it("blocks a student from creating an event", async () => {
    const { cookie } = await createUserAndLogin({
      email: "eventstudent1@example.com",
      role: "student",
    });

    const res = await request(app)
      .post("/api/events")
      .set("Cookie", cookie)
      .field("title", "Unauthorized Event")
      .field("description", "desc")
      .field("date", futureDate())
      .field("location", "Nowhere")
      .field("maxAttendees", 10);

    expect(res.status).toBe(403);
  });

  it("lets a student register for an event", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "eventadmin1@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "eventstudent2@example.com",
      role: "student",
    });
    const eventId = await createEvent(adminCookie, 2);

    const res = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.event.attendees).toHaveLength(1);
  });

  it("prevents duplicate registration", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "eventadmin2@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "eventstudent3@example.com",
      role: "student",
    });
    const eventId = await createEvent(adminCookie, 2);

    await request(app).post(`/api/events/${eventId}/register`).set("Cookie", studentCookie);
    const res = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/already registered/i);
  });

  it("rejects registration once an event is at full capacity", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "eventadmin3@example.com",
      role: "admin",
    });
    const { cookie: student1Cookie } = await createUserAndLogin({
      email: "eventstudent4a@example.com",
      role: "student",
    });
    const { cookie: student2Cookie } = await createUserAndLogin({
      email: "eventstudent4b@example.com",
      role: "student",
    });
    const eventId = await createEvent(adminCookie, 1);

    const firstRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set("Cookie", student1Cookie);
    const secondRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set("Cookie", student2Cookie);

    expect(firstRes.status).toBe(200);
    expect(secondRes.status).toBe(400);
    expect(secondRes.body.Error).toMatch(/full capacity/i);
  });

  it("lets a student unregister", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "eventadmin4@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "eventstudent5@example.com",
      role: "student",
    });
    const eventId = await createEvent(adminCookie, 2);

    await request(app).post(`/api/events/${eventId}/register`).set("Cookie", studentCookie);
    const res = await request(app)
      .delete(`/api/events/${eventId}/register`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.event.attendees).toHaveLength(0);
  });
});
