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

// The admin tables all page through the same { page, limit, total, pages }
// contract, so these cover the endpoints behind them.
describe("Paginated admin lists", () => {
  it("pages through the user list", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin1@example.com",
      role: "admin",
    });
    // The admin above counts as a user too, so 4 more makes 5 in total.
    for (let i = 0; i < 4; i += 1) {
      await createUserAndLogin({ email: `pageuser1${i}@example.com`, role: "student" });
    }

    const firstPage = await request(app)
      .get("/api/users")
      .query({ page: 1, limit: 2 })
      .set("Cookie", adminCookie);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.users).toHaveLength(2);
    expect(firstPage.body.pagination).toMatchObject({ page: 1, limit: 2, total: 5, pages: 3 });

    const lastPage = await request(app)
      .get("/api/users")
      .query({ page: 3, limit: 2 })
      .set("Cookie", adminCookie);

    expect(lastPage.body.users).toHaveLength(1);
    // Pages must not overlap.
    const firstIds = firstPage.body.users.map((u) => u._id);
    expect(firstIds).not.toContain(lastPage.body.users[0]._id);
  });

  it("searches users across every page, not just the loaded one", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin2@example.com",
      role: "admin",
    });
    await createUserAndLogin({ email: "findme@example.com", name: "Findable Person" });
    for (let i = 0; i < 3; i += 1) {
      await createUserAndLogin({ email: `pageuser2${i}@example.com`, name: "Someone Else" });
    }

    const res = await request(app)
      .get("/api/users")
      .query({ search: "findable", limit: 2 })
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.users[0].email).toBe("findme@example.com");
  });

  it("does not break on regex characters in the search box", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin3@example.com",
      role: "admin",
    });

    const res = await request(app)
      .get("/api/users")
      .query({ search: "a(b[c" })
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(0);
  });

  it("reports one page for an empty list", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin4@example.com",
      role: "admin",
    });

    const res = await request(app).get("/api/enrollment-applications").set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ total: 0, pages: 1 });
  });

  it("searches enrolment forms by applicant, account email and course", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin7@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "applicant-searchable@example.com",
      name: "Searchable Student",
      role: "student",
    });
    const { cookie: otherCookie } = await createUserAndLogin({
      email: "applicant-other@example.com",
      name: "Unrelated Student",
      role: "student",
    });

    const courseRes = await request(app)
      .post("/api/courses")
      .set("Cookie", adminCookie)
      .send({ title: "Robotics Bootcamp", category: "Test", fees: 500 });
    const courseId = courseRes.body.course._id;

    const otherCourseRes = await request(app)
      .post("/api/courses")
      .set("Cookie", adminCookie)
      .send({ title: "Spoken English", category: "Test", fees: 500 });

    await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ name: "Ravi Kumar", contactNo: "9998887770" });

    await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", otherCookie)
      .field("courseId", otherCourseRes.body.course._id)
      .field({ name: "Someone Else", contactNo: "9111111110" });

    const expectOnlyRavi = async (search) => {
      const res = await request(app)
        .get("/api/enrollment-applications")
        .query({ search })
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.applications[0].name).toBe("Ravi Kumar");
    };

    // The name written on the form...
    await expectOnlyRavi("ravi");
    // ...the phone number on the form...
    await expectOnlyRavi("9998887770");
    // ...the course applied for...
    await expectOnlyRavi("robotics");
    // ...and the account's own name and email, which live on the User document.
    await expectOnlyRavi("Searchable Student");
    await expectOnlyRavi("applicant-searchable@example.com");
  });

  it("pages a filtered enrolment-form search rather than the whole list", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin8@example.com",
      role: "admin",
    });
    const courseRes = await request(app)
      .post("/api/courses")
      .set("Cookie", adminCookie)
      .send({ title: "Paged Search Course", category: "Test", fees: 500 });

    for (let i = 0; i < 3; i += 1) {
      const { cookie } = await createUserAndLogin({
        email: `pagedapplicant${i}@example.com`,
        role: "student",
      });
      await request(app)
        .post("/api/enrollment-applications/draft")
        .set("Cookie", cookie)
        .field("courseId", courseRes.body.course._id)
        .field({ name: i === 0 ? "Unique Applicant" : `Common Applicant ${i}` });
    }

    const res = await request(app)
      .get("/api/enrollment-applications")
      .query({ search: "common", page: 1, limit: 1 })
      .set("Cookie", adminCookie);

    expect(res.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2, pages: 2 });
  });

  it("pages through FAQs", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin5@example.com",
      role: "admin",
    });

    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post("/api/faqs")
        .set("Cookie", adminCookie)
        .send({ question: `Question ${i}?`, answer: "Answer", category: "General" });
    }

    const res = await request(app).get("/api/faqs").query({ page: 2, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.faqs).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 2, total: 3, pages: 2 });
  });

  it("caps the page size so a caller can't ask for the whole collection", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "pageadmin6@example.com",
      role: "admin",
    });

    const res = await request(app)
      .get("/api/users")
      .query({ limit: 5000 })
      .set("Cookie", adminCookie);

    expect(res.body.pagination.limit).toBe(100);
  });
});
