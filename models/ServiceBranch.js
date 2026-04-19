const mongoose = require("mongoose");

// [22201001] SUNEHRA — Service Branch Link Model

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
      type: Number,
    },
    capacityPerDay: {
      type: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ServiceBranch", serviceBranchSchema);
