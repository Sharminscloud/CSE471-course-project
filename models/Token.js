const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: { type: String, required: true },
    queueNumber: { type: Number, required: true },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    preferredDate: { type: String, required: true },
    isPriority: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Waiting", "Serving", "Completed", "Cancelled"],
      default: "Waiting",
    },
    issuedAt: { type: Date, default: Date.now },

    // [23301695] JAKIA — for notification system
    citizenName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    queueAlertSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Token", tokenSchema);
