const mongoose = require("mongoose");

// [22301187] SHAHRIN — Appointment Model

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
  },
  { _id: false },
);

const appointmentSchema = new mongoose.Schema(
  {
    // Shahrin's branch field
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
    },
    serviceType: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true },
    userPhone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Confirmed", "Rescheduled", "Cancelled"],
      default: "Confirmed",
    },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
