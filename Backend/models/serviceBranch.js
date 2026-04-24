const mongoose = require("mongoose");

const serviceBranchSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    customProcessingTime: {
      type: Number, // override
    },
    capacityPerDay: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceBranch", serviceBranchSchema);