const { Resend } = require("resend");
const nodemailer = require("nodemailer");

// Uses Resend if RESEND_API_KEY is configured in .env. Otherwise falls back
// to a throwaway Ethereal test inbox — nothing is delivered to a real
// address; each send logs a preview URL to the console instead. Swapping in
// Resend later is just an env change.
let resendClient = null;
let etherealTransporterPromise = null;

const getResendClient = () => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const getEtherealTransporter = () => {
  if (etherealTransporterPromise) return etherealTransporterPromise;

  etherealTransporterPromise = nodemailer.createTestAccount().then((testAccount) => {
    console.log(
      "No RESEND_API_KEY configured — using an Ethereal test inbox " +
        "(emails are NOT delivered to real addresses; a preview link is logged per send).",
    );
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  });

  return etherealTransporterPromise;
};

const sendMail = async ({ to, subject, html, text }) => {
  // Under test, skip real sending entirely: hitting a live mail provider on
  // every register/enroll call slows the suite down and leaves dangling
  // async work that stops Jest from exiting cleanly (mirrors the rate-limit
  // skip in app.js for the same reason).
  if (process.env.NODE_ENV === "test") {
    return { messageId: "test-skipped" };
  }

  const from = process.env.EMAIL_FROM || "M Kai² Tech Academy <onboarding@resend.dev>";

  if (process.env.RESEND_API_KEY) {
    const { data, error } = await getResendClient().emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return data;
  }

  const transporter = await getEtherealTransporter();
  const info = await transporter.sendMail({ from, to, subject, html, text });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Email preview (Ethereal, not a real delivery): ${previewUrl}`);
  }

  return info;
};

const sendWelcomeEmail = (user) =>
  sendMail({
    to: user.email,
    subject: "Welcome to M Kai² Tech Academy",
    html: `<p>Hi ${user.name},</p><p>Welcome to M Kai² Tech Academy! Your account has been created successfully.</p><p>Browse our courses and enroll whenever you're ready.</p>`,
    text: `Hi ${user.name}, welcome to M Kai² Tech Academy! Your account has been created successfully.`,
  });

const sendEnrollmentConfirmation = ({ user, courseTitle }) =>
  sendMail({
    to: user.email,
    subject: `Enrollment confirmed: ${courseTitle}`,
    html: `<p>Hi ${user.name},</p><p>You're enrolled in <strong>${courseTitle}</strong>.</p><p>Check your dashboard for course details.</p>`,
    text: `Hi ${user.name}, you're enrolled in ${courseTitle}.`,
  });

module.exports = { sendMail, sendWelcomeEmail, sendEnrollmentConfirmation };
