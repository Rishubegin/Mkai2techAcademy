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
  educationLevel: "School",
  schoolName: "Test Public School",
  class: "12th",
  board: "CBSE Board",
  contactNo: "9876543210",
  declarationAccepted: "true",
};

const universityFields = {
  ...baseFields,
  educationLevel: "University",
  schoolName: "",
  class: "",
  board: "",
  universityName: "Test University",
  universityCourse: "B.Tech",
  specialization: "Computer Science",
  passingYear: "2027",
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

  it("rejects submission without an education level", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin6a@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent6a@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ ...baseFields, educationLevel: "" })
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/school or a university/i);
  });

  it("rejects a school application missing its board", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin6b@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent6b@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ ...baseFields, board: "" })
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(res.status).toBe(400);
    expect(res.body.Error).toMatch(/board/i);
  });

  it("stores university fields and clears the school ones", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin6c@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent6c@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    // Fill in the school branch first, then switch to university.
    await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ educationLevel: "School", schoolName: "Old School", class: "12th" });

    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(universityFields)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(res.status).toBe(201);
    expect(res.body.application.universityName).toBe("Test University");
    expect(res.body.application.passingYear).toBe("2027");
    expect(res.body.application.schoolName).toBe("");
    expect(res.body.application.class).toBe("");
  });

  it("saves a section as a draft without documents or a declaration", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin12@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent12@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      // Blank date and blank dropdowns are what an untouched section sends.
      .field({ name: "Half Filled", fatherName: "Father Name", dob: "", gender: "", category: "" });

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe("draft");
    expect(res.body.application.name).toBe("Half Filled");
    expect(res.body.application.declarationAccepted).toBe(false);

    // A draft is not an enrollment.
    const rosterRes = await request(app)
      .get(`/api/courses/${courseId}/enrollments`)
      .set("Cookie", adminCookie);
    expect(rosterRes.body.enrollments).toHaveLength(0);
  });

  it("keeps earlier sections when a later section is saved", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin13@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent13@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ name: "Section One", fatherName: "Father Name" });

    await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ address: "123 Test Street", contactNo: "9876543210" });

    const res = await request(app)
      .get(`/api/enrollment-applications/my/${courseId}`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.application.name).toBe("Section One");
    expect(res.body.application.address).toBe("123 Test Street");
  });

  it("submits using documents uploaded in an earlier section save", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin14@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent14@example.com",
      role: "student",
    });
    const { courseId } = await createCourse(adminCookie);

    const draftRes = await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .attach("photo", fakeImage, "photo.jpg")
      .attach("signature", fakeImage, "signature.jpg");

    expect(draftRes.status).toBe(200);
    expect(draftRes.body.application.photo).toMatch(/^https:\/\/res\.cloudinary\.com\//);

    // No files attached here — the submit reuses the ones already uploaded.
    const res = await request(app)
      .post("/api/enrollment-applications")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field(baseFields);

    expect(res.status).toBe(201);
    expect(res.body.application.status).toBe("submitted");
    expect(res.body.application.photo).toBe(draftRes.body.application.photo);
  });

  it("keeps a submitted application submitted when a section is saved again", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin15@example.com",
      role: "admin",
    });
    const { cookie: studentCookie } = await createUserAndLogin({
      email: "enrollformstudent15@example.com",
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

    const res = await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", studentCookie)
      .field("courseId", courseId)
      .field({ name: "Corrected Name" });

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe("submitted");
    expect(res.body.application.name).toBe("Corrected Name");
  });

  it("rejects a draft save from a non-student", async () => {
    const { cookie: adminCookie } = await createUserAndLogin({
      email: "enrollformadmin16@example.com",
      role: "admin",
    });
    const { courseId } = await createCourse(adminCookie);

    const res = await request(app)
      .post("/api/enrollment-applications/draft")
      .set("Cookie", adminCookie)
      .field("courseId", courseId)
      .field({ name: "Not A Student" });

    expect(res.status).toBe(403);
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

});
