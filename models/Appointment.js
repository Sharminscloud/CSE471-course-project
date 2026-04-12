const mongoose = require("mongoose");

const appointmentHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const appointmentSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
    },
    userPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Rescheduled", "Cancelled"],
      default: "Confirmed",
    },
    history: {
      type: [appointmentHistorySchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
