const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportName: {
      type: String,
      required: true,
    },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: false, // if null, it's an all-branch report
    },
    metrics: {
      totalUsersServed: { type: Number, default: 0 },
      averageWaitTime: { type: Number, default: 0 }, // in minutes
      queuePerformanceScore: { type: String }, // e.g. 'Excellent', 'Good', 'Poor'
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
