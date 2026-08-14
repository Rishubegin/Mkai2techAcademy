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

const fakeImage = Buffer.from("fake-image-bytes");

const createCourse = async (adminCookie) => {
  const courseRes = await request(app)
    .post("/api/courses")
    .set("Cookie", adminCookie)
    .send({ title: "Enrollment Form Test Course", category: "Test", fees: 1000 });

  return { courseId: courseRes.body.course._id };
};

const baseFields = {
  name: "Test Applicant",
  fatherName: "Father Name",
  motherName: "Mother Name",
  dob: "2005-01-01",
  category: "General",
  gender: "Male",
  address: "123 Test Street",
  pincode: "226016",
  class: "12th",
  board: "CBSE",
  contactNo: "9876543210",
  declarationAccepted: "true",
};

describe("Enrollment applications", () => {
  it("rejects submission from a non-student", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin1@example.com",
      role: "admin",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", adminCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(res.status).toBe(403);
  });

  it("rejects submission without accepting the declaration", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin2@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent2@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ ...baseFields, declarationAccepted: "false" })
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/declaration/i);
  });

  it("rejects submission without a photo", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin3@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent3@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("signature", fakeImage, "signature.jpg");

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/photo/i);
  });

  it("submits an application and enrolls the student in the course", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin4@example.com",
      role: "admin",
    });
    const { user: student, cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent4@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(res.status).toBe(201);
    expect(res.body.application.photo).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(res.body.application.course.toString()).toBe(courseId);

    const rosterRes = await request(app)
      .get(`/api/courses/${courseId}/enrollments`)
      .set("Cookie", adminCookie);
    expect(
      rosterRes.body.enrollments.some(
        (e) => (e.student._id || e.student) === student._id.toString(),
      ),
    ).toBe(true);
  });

  it("resubmitting for the same course updates the existing application instead of duplicating enrollment", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin5@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent5@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    const secondRes = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ ...baseFields, name: "Updated Name" })
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(secondRes.status).toBe(201);
    expect(secondRes.body.application.name).toBe("Updated Name");

    const rosterRes = await request(app)
      .get(`/api/courses/${courseId}/enrollments`)
      .set("Cookie", adminCookie);
    expect(rosterRes.body.enrollments).toHaveLength(1);
  });

  it("lists a student's own applications", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin7@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent7@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    const res = await request(app).get("/api/enrollment-applications/my").set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
  });

  it("rejects a non-admin listing all applications", async () => {
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent8@example.com",
      role: "student",
    });

    const res = await request(app).get("/api/enrollment-applications").set("Cookie", studentCookie);
    expect(res.status).toBe(403);
  });

  it("rejects a different student viewing someone else's application", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin9@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent9a@example.com",
      role: "student",
    });
    const { cookie: outsiderCookie } = await createUserAndLogin({
      email: "enrollformstudent9b@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const submitRes = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    const res = await request(app)
      .get(`/api/enrollment-applications/${submitRes.body.application._id}`)
      .set("Cookie", outsiderCookie);

    expect(res.status).toBe(403);
  });

  it("lets an admin edit an application", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin10@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent10@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const submitRes = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    const editRes = await request(app)
      .patch(`/api/enrollment-applications/${submitRes.body.application._id}`)
      .set("Cookie", adminCookie)
      .send({ class: "11th" });

    expect(editRes.status).toBe(200);
    expect(editRes.body.application.class).toBe("11th");
  });

  it("allows the owner to download the application PDF", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin11@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent11@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const submitRes = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    const res = await request(app)
      .get(`/api/enrollment-applications/${submitRes.body.application._id}/download`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });
});
