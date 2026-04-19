const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    requiredDocuments: [{ type: String }],
    avgProcessingTime: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);
