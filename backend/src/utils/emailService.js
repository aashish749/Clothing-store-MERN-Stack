import nodemailer from "nodemailer";

let cachedTransporter = null;
let cachedTestAccount = null;

const buildTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // Fallback to Ethereal test account for development if SMTP not configured
  try {
    if (!cachedTestAccount) {
      // createTestAccount is async
      cachedTestAccount = await nodemailer.createTestAccount();
    }

    cachedTransporter = nodemailer.createTransport({
      host: cachedTestAccount.smtp.host,
      port: cachedTestAccount.smtp.port,
      secure: cachedTestAccount.smtp.secure,
      auth: {
        user: cachedTestAccount.user,
        pass: cachedTestAccount.pass,
      },
    });

    console.warn(
      "SMTP not configured — using Ethereal test account. Emails will not be delivered to real inboxes.",
    );
    return cachedTransporter;
  } catch (err) {
    throw new Error(
      "Failed to create fallback test email account: " + err.message,
    );
  }
};

export const sendEmail = async ({ to, subject, html, text, bcc }) => {
  const transporter = await buildTransporter();

  const info = await transporter.sendMail({
    from:
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER ||
      (cachedTestAccount && cachedTestAccount.user),
    to,
    bcc,
    subject,
    html,
    text,
  });

  // If using ethereal, provide a preview URL to help with development
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  return { info, previewUrl };
};
