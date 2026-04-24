const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    requiredDocuments: [
      {
        type: String,
      },
    ],
    avgProcessingTime: {
      type: Number, // in minutes
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);