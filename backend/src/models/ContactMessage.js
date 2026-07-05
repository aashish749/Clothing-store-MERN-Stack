import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, required: true },
    subject: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, required: true },
  },
  { timestamps: true },
);

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
