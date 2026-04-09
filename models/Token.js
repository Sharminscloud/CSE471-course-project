const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: { type: Number, required: true }, // 1,2,3... per branch per day
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    status: {
      type: String,
      enum: ["Waiting", "Serving", "Completed", "Cancelled"],
      default: "Waiting",
    },

    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Token", tokenSchema);
