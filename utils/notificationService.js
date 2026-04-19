const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("Email sent to:", to);
    return { success: true };
  } catch (error) {
    console.error("Email failed:", error.message);
    return { success: false, error: error.message };
  }
};

const sendSMS = async ({ to, text }) => {
  console.log("SMS to:", to, "| Message:", text);
  return { success: true };
};

const sendQueueAlertNotification = async (token) => {
  const message = `Dear ${token.citizenName || "User"}, your token ${token.tokenNumber} is approaching. Please be ready.`;

  if (token.email) {
    const result = await sendEmail({
      to: token.email,
      subject: "Queue Alert — EQueue",
      text: message,
    });
    await Notification.create({
      token: token._id,
      type: "QUEUE_ALERT",
      channel: "EMAIL",
      recipientEmail: token.email,
      message,
      status: result.success ? "SENT" : "FAILED",
      errorMessage: result.success ? "" : result.error,
    });
  }

  if (token.phone) {
    const result = await sendSMS({ to: token.phone, text: message });
    await Notification.create({
      token: token._id,
      type: "QUEUE_ALERT",
      channel: "SMS",
      recipientPhone: token.phone,
      message,
      status: result.success ? "SENT" : "FAILED",
      errorMessage: result.success ? "" : result.error,
    });
  }
};

const sendSlotReminderNotification = async (appointment) => {
  const message = `Reminder: your appointment is at ${new Date(appointment.date).toLocaleString()}.`;

  if (appointment.email) {
    const result = await sendEmail({
      to: appointment.email,
      subject: "Appointment Reminder — EQueue",
      text: message,
    });
    await Notification.create({
      appointment: appointment._id,
      type: "SLOT_REMINDER",
      channel: "EMAIL",
      recipientEmail: appointment.email,
      message,
      status: result.success ? "SENT" : "FAILED",
      errorMessage: result.success ? "" : result.error,
    });
  }

  if (appointment.phone) {
    const result = await sendSMS({ to: appointment.phone, text: message });
    await Notification.create({
      appointment: appointment._id,
      type: "SLOT_REMINDER",
      channel: "SMS",
      recipientPhone: appointment.phone,
      message,
      status: result.success ? "SENT" : "FAILED",
      errorMessage: result.success ? "" : result.error,
    });
  }
};

module.exports = { sendQueueAlertNotification, sendSlotReminderNotification };
