import ContactMessage from "../models/ContactMessage.js";
import { sendEmail } from "../utils/emailService.js";

export const sendContactMessage = async (req, res) => {
  try {
    const {
      name = "",
      email,
      subject = "New contact message",
      message,
    } = req.body;

    if (!email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "email and message are required" });
    }

    const contact = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    // Send notification to admin email (use ADMIN_EMAIL env var fallback)
    const adminEmail = process.env.ADMIN_EMAIL || "flamesnepal@gmail.com";

    const html = `
      <h3>New contact message</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <div>${message.replace(/\n/g, "<br />")}</div>
    `;

    let emailResult = null;
    try {
      emailResult = await sendEmail({
        to: adminEmail,
        bcc: process.env.SMTP_USER || undefined,
        subject: `New contact message: ${subject}`,
        html,
        text: `${name} <${email}>\n\n${message}`,
      });
    } catch (err) {
      console.error("Failed to send contact notification email:", err.message);
    }

    const respPayload = { success: true, message: "Message saved", contact };
    respPayload.emailSent = Boolean(
      emailResult && emailResult.info && emailResult.info.messageId,
    );
    if (
      emailResult &&
      emailResult.previewUrl &&
      process.env.NODE_ENV !== "production"
    ) {
      respPayload.emailPreviewUrl = emailResult.previewUrl;
    }
    if (!respPayload.emailSent) {
      respPayload.emailNote =
        "Email notification was not sent; check SMTP configuration or server logs.";
    }
    if (emailResult && emailResult.info) {
      const { messageId, accepted, rejected } = emailResult.info;
      respPayload.emailInfo = { messageId, accepted, rejected };
    }

    return res.status(201).json(respPayload);
  } catch (err) {
    console.error("sendContactMessage error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
