const mongoose = require("mongoose");

const queueDaySchema = new mongoose.Schema(
  {
    preferredDate: {
      type: String,
      required: true,
    },
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
    isPriority: {
      type: Boolean,
      default: false,
    },
    lastNumber: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

queueDaySchema.index(
  { preferredDate: 1, branch: 1, service: 1, isPriority: 1 },
  { unique: true },
);

module.exports = mongoose.model("QueueDay", queueDaySchema);
//
