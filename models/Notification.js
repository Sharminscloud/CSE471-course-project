const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
      default: null,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    type: {
      type: String,
      enum: ["QUEUE_ALERT", "SLOT_REMINDER"],
      required: true,
    },
    channel: { type: String, enum: ["EMAIL", "SMS"], required: true },
    recipientEmail: { type: String, default: "" },
    recipientPhone: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["SENT", "FAILED"], required: true },
    sentAt: { type: Date, default: Date.now },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
