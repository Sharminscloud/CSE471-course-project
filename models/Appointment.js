const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'Rescheduled', 'In-Progress', 'Served'],
    required: true,
  },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
});

const appointmentSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: false,
    },

    serviceType: { type: String, required: true },

    date: { type: Date, required: true },

    timeSlot: { type: String, required: true },

    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },

    tokenNumber: { type: Number },

    servedAt: { type: Date },

    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled', 'Rescheduled', 'In-Progress', 'Served'],
      default: 'Confirmed',
    },

    history: [historySchema],
  },
  { timestamps: true }
);

// Indexes for performance
appointmentSchema.index({ serviceType: 1, date: 1, timeSlot: 1 });
appointmentSchema.index({ branch: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
