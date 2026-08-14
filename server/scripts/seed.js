// Seeds realistic sample data across every schema so the app has something
// to look at beyond an empty state. Safe by design:
// - Never modifies or deletes existing users — only adds new teacher
//   accounts and enrolls existing students into courses.
// - Bails out early (no writes at all) if courses already exist, so
//   running it twice by accident can't create duplicates.
//
// Usage: node scripts/seed.js   (from the server/ directory)

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../src/models/user");
const TeacherProfile = require("../src/models/teacherProfile");
const Course = require("../src/models/course");
const Enrollment = require("../src/models/enrollment");
const Review = require("../src/models/review");
const Testimonial = require("../src/models/testimonial");
const FAQ = require("../src/models/faq");
const ContactForm = require("../src/models/contactForm");
const Material = require("../src/models/material");
const { uploadBuffer } = require("../src/utils/cloudinaryUpload");

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to", mongoose.connection.name);

  const existingCourseCount = await Course.countDocuments();
  if (existingCourseCount > 0) {
    console.log(
      `Found ${existingCourseCount} existing course(s) — assuming this DB is already seeded. ` +
        "Aborting without writing anything. Delete existing courses first if you really want to reseed.",
    );
    await mongoose.disconnect();
    return;
  }

  // ---- Teachers ------------------------------------------------------
  const passwordHash = await bcrypt.hash("Teacher@123", 10);

  const priyaUser = await User.create({
    name: "Priya Singh",
    email: "priya.singh@mkai2tech.com",
    password: passwordHash,
    role: "teacher",
    isVerified: true,
  });
  const rajeshUser = await User.create({
    name: "Rajesh Verma",
    email: "rajesh.verma@mkai2tech.com",
    password: passwordHash,
    role: "teacher",
    isVerified: true,
  });

  const priyaProfile = await TeacherProfile.create({
    user: priyaUser._id,
    qualification: "M.Tech in Computer Science Engineering",
    experience: "8 Years",
    experienceYears: 8,
    specialization: ["MERN Stack", "Python", "Web Development"],
    bio: "Senior software engineer turned educator, passionate about building strong programming foundations through hands-on projects.",
  });
  const rajeshProfile = await TeacherProfile.create({
    user: rajeshUser._id,
    qualification: "M.Sc Physics, B.Ed",
    experience: "10 Years",
    experienceYears: 10,
    specialization: ["NEET Physics", "IIT-JEE Physics", "Mechanics"],
    bio: "Dedicated physics educator with a decade of experience preparing students for NEET and IIT-JEE.",
  });

  console.log("Created 2 teacher accounts + profiles");

  // ---- Courses ---------------------------------------------------------
  const courseData = [
    {
      title: "NEET Foundation & Crash Course",
      description:
        "Comprehensive NEET preparation covering Physics, Chemistry, and Biology with weekly mock tests.",
      category: "Competitive Exams",
      mode: "Offline",
      fees: 25000,
      isFeatured: true,
      instructor: rajeshProfile._id,
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop",
      syllabus: [
        { title: "Physics Fundamentals", topics: ["Mechanics", "Thermodynamics", "Optics"] },
        { title: "Biology Core", topics: ["Cell Biology", "Genetics", "Human Physiology"] },
      ],
    },
    {
      title: "IIT-JEE Complete Program",
      description: "Full-length JEE Main + Advanced preparation with problem-solving workshops.",
      category: "Competitive Exams",
      mode: "Offline",
      fees: 32000,
      instructor: rajeshProfile._id,
      image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop",
      syllabus: [
        { title: "Physics Advanced", topics: ["Electrodynamics", "Modern Physics"] },
        { title: "Mathematics", topics: ["Calculus", "Algebra", "Coordinate Geometry"] },
      ],
    },
    {
      title: "MERN Stack Development",
      description:
        "Build and deploy full-stack web applications using MongoDB, Express, React, and Node.js.",
      category: "Programming",
      mode: "Hybrid",
      fees: 18000,
      isFeatured: true,
      instructor: priyaProfile._id,
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
      syllabus: [
        { title: "Frontend with React", topics: ["Components", "Hooks", "State Management"] },
        {
          title: "Backend with Node & Express",
          topics: ["REST APIs", "Authentication", "MongoDB"],
        },
      ],
    },
    {
      title: "Python Programming - Basics to Advanced",
      description: "From Python syntax fundamentals to object-oriented programming and libraries.",
      category: "Programming",
      mode: "Online",
      fees: 8000,
      instructor: priyaProfile._id,
      image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=600&fit=crop",
      syllabus: [
        { title: "Python Fundamentals", topics: ["Syntax", "Data Types", "Control Flow"] },
        { title: "Advanced Python", topics: ["OOP", "File Handling", "Libraries"] },
      ],
    },
    {
      title: "ADCA - Advanced Diploma in Computer Applications",
      description: "Practical computer literacy program covering office tools and internet basics.",
      category: "Computer Courses",
      mode: "Offline",
      fees: 6000,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
      syllabus: [
        { title: "Office Applications", topics: ["MS Word", "Excel", "PowerPoint"] },
        { title: "Internet & Tally", topics: ["Internet Basics", "Tally ERP"] },
      ],
    },
    {
      title: "Digital Marketing Mastery",
      description: "Learn SEO, social media marketing, and paid advertising from the ground up.",
      category: "Professional Skills",
      mode: "Offline",
      fees: 12000,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop",
      syllabus: [
        { title: "SEO & Content", topics: ["Keyword Research", "On-page SEO"] },
        { title: "Social & Paid Ads", topics: ["Social Media Marketing", "Google Ads"] },
      ],
    },
  ];

  const courses = await Course.insertMany(courseData);
  const [neetCourse, jeeCourse, mernCourse, pythonCourse, adcaCourse, dmCourse] = courses;
  console.log(`Created ${courses.length} courses`);

  // ---- Enrollments (enroll existing real students where sensible) ------
  const students = await User.find({ role: "student" }).select("_id email");
  const findStudent = (email) => students.find((s) => s.email === email)?._id;

  const rishabh = findStudent("rishabh@gmail.com");
  const abhishek = findStudent("abhishek@gmail.com");
  const ashutosh = findStudent("ashutosh@gmail.com");
  const dhoni = findStudent("dhoni@gmail.com");
  const ownerAccount = findStudent("hrishabho40@gmail.com");

  const enrollmentsIn = (course, ...ids) =>
    ids
      .filter(Boolean)
      .map((id, i) => ({ student: id, course: course._id, enrolledAt: daysAgo(25 - i * 4) }));

  const enrollmentData = [
    ...enrollmentsIn(neetCourse, abhishek),
    ...enrollmentsIn(jeeCourse, dhoni),
    ...enrollmentsIn(mernCourse, rishabh, ownerAccount),
    ...enrollmentsIn(pythonCourse, rishabh),
    ...enrollmentsIn(adcaCourse, ownerAccount),
    ...enrollmentsIn(dmCourse, ashutosh),
  ];

  const enrollments = await Enrollment.insertMany(enrollmentData);
  console.log(`Created ${enrollments.length} enrollments`);

  // ---- Reviews -----------------------------------------------------
  const reviewData = [
    {
      course: mernCourse._id,
      student: rishabh,
      rating: 5,
      comment: "The MERN stack course is amazing — learned to build full projects from scratch.",
    },
    {
      course: neetCourse._id,
      student: abhishek,
      rating: 4,
      comment: "Great teaching for physics, wish there were more mock tests.",
    },
    {
      course: adcaCourse._id,
      student: ownerAccount,
      rating: 5,
      comment: "Very practical — helped me get comfortable with computers quickly.",
    },
  ].filter((r) => r.student);

  await Review.insertMany(reviewData);
  console.log(`Created ${reviewData.length} reviews`);

  // ---- Testimonials --------------------------------------------------
  const testimonialData = [
    {
      student: rishabh,
      name: "Rishabh",
      position: "Software Developer",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      testimonial:
        "The MERN stack program gave me the confidence and skills to land my first developer job. The hands-on projects made all the difference.",
      shortQuote: "Landed my first dev job thanks to this course!",
      course: mernCourse._id,
      result: "Placed as Software Developer",
      isApproved: true,
      isFeatured: true,
    },
    {
      student: abhishek,
      name: "Abhishek",
      position: "NEET Aspirant",
      photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
      testimonial:
        "The structured approach to NEET prep, especially the weekly mock tests, helped me track my progress and improve steadily.",
      shortQuote: "Steady improvement, week over week.",
      course: neetCourse._id,
      isApproved: true,
      isFeatured: false,
    },
    {
      student: ashutosh,
      name: "Ashutosh",
      position: "Small Business Owner",
      photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop",
      testimonial:
        "Still finishing the digital marketing course, but I've already started applying the SEO basics to my own business page.",
      shortQuote: "Applying what I learn immediately.",
      course: dmCourse._id,
      isApproved: false,
      isFeatured: false,
    },
  ].filter((t) => t.student);

  await Testimonial.insertMany(testimonialData);
  console.log(
    `Created ${testimonialData.length} testimonials (${testimonialData.filter((t) => t.isApproved).length} approved, rest pending)`,
  );

  // ---- FAQs -----------------------------------------------------------
  const faqData = [
    {
      question: "What are the class timings?",
      answer:
        "We offer morning, evening, and weekend batches to fit around school, college, or work schedules.",
      category: "General",
      displayOrder: 1,
    },
    {
      question: "Do I need to pay the full fee upfront?",
      answer:
        "No, we offer installment options for most courses. Speak with our admissions team for details.",
      category: "Enrollment",
      displayOrder: 2,
    },
    {
      question: "Can I switch batches after enrolling?",
      answer:
        "Yes, subject to seat availability in your preferred batch. Contact us to arrange a switch.",
      category: "Enrollment",
      displayOrder: 3,
    },
    {
      question: "Do I need my own laptop for programming courses?",
      answer:
        "It's recommended but not mandatory — our computer lab is available during class hours for students who need it.",
      category: "Technical",
      displayOrder: 4,
    },
    {
      question: "Is there a refund policy?",
      answer:
        "We offer a partial refund if you withdraw within the first week of a batch starting. Contact admissions for specifics.",
      category: "General",
      displayOrder: 5,
    },
    {
      question: "How is NEET/JEE coaching different from school tuition?",
      answer:
        "Our competitive exam batches follow an exam-focused curriculum with regular mock tests, unlike general school tuition.",
      category: "Competitive Exams",
      displayOrder: 6,
    },
  ];

  await FAQ.insertMany(faqData);
  console.log(`Created ${faqData.length} FAQs`);

  // ---- Contact form inquiries -----------------------------------------
  const contactData = [
    {
      name: "Neha Gupta",
      email: "neha.gupta@example.com",
      phone: "9012345678",
      message:
        "Hi, I'm interested in the MERN Stack course. Can you share the fee structure and batch timings?",
      status: "new",
    },
    {
      name: "Vikram Rathore",
      email: "vikram.rathore@example.com",
      message: "Does the NEET batch include weekly mock tests? My daughter is in class 12.",
      status: "responded",
    },
    {
      name: "Simran Kaur",
      email: "simran.kaur@example.com",
      phone: "9123456780",
      message: "I want to enroll in ADCA. What documents do I need to bring?",
      status: "new",
    },
    {
      name: "Arjun Mehta",
      email: "arjun.mehta@example.com",
      message:
        "Interested in the digital marketing course for my small business. Do you offer weekend batches?",
      status: "archived",
    },
  ];

  await ContactForm.insertMany(contactData);
  console.log(`Created ${contactData.length} contact form inquiries`);

  // ---- Materials (real small files, so downloads actually work) -------
  const materialFiles = [
    {
      title: "Module 1 - React Basics Notes",
      module: "Frontend with React",
      content:
        "React Basics\n\n- Components are reusable building blocks\n- Hooks (useState, useEffect) manage state and side effects\n- Props pass data from parent to child components\n",
    },
    {
      title: "Module 2 - Node.js Setup Guide",
      module: "Backend with Node & Express",
      content:
        "Node.js + Express Setup\n\n1. npm init\n2. npm install express mongoose\n3. Create app.js with your routes\n4. Connect to MongoDB with mongoose.connect()\n",
    },
  ];

  for (const m of materialFiles) {
    const buffer = Buffer.from(m.content, "utf-8");
    const uploaded = await uploadBuffer(buffer, {
      folder: "mkai2tech/materials",
      resourceType: "raw",
    });

    await Material.create({
      course: mernCourse._id,
      title: m.title,
      module: m.module,
      storedFileName: uploaded.public_id,
      fileUrl: uploaded.secure_url,
      originalFileName: `${m.title}.txt`,
      fileType: "txt",
      fileSize: buffer.length,
      uploadedBy: priyaUser._id,
    });
  }
  console.log(`Created ${materialFiles.length} course materials (uploaded to Cloudinary)`);

  console.log("\nSeed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
