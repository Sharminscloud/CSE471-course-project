const mongoose = require("mongoose");

const queueTokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    citizenName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Waiting", "Serving", "Completed", "Skipped", "Cancelled"],
      default: "Waiting",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Normal", "Priority"],
      default: "Normal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueueToken", queueTokenSchema);
