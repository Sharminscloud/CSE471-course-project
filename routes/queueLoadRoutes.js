const express = require("express");
const Appointment = require("../models/Appointment");
const router = express.Router();

// [22301187] SHAHRIN — Queue Load per Branch

const SLOT_OPTIONS = [
  "09:00 - 09:30",
  "09:30 - 10:00",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "14:00 - 14:30",
  "14:30 - 15:00",
  "15:00 - 15:30",
  "15:30 - 16:00",
];

const classifyCrowdLevel = (count) => {
  if (count <= 3) return "Low";
  if (count <= 7) return "Medium";
  return "High";
};

// GET /api/branches/:id/queue-load?date=YYYY-MM-DD
router.get("/:id/queue-load", async (req, res) => {
  try {
    const { id: branchId } = req.params;
    const { date } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      branch: branchId,
      date: queryDate,
      status: { $in: ["Confirmed", "Rescheduled"] },
    });

    const slotCounts = {};
    SLOT_OPTIONS.forEach((slot) => {
      slotCounts[slot] = 0;
    });
    appointments.forEach((appt) => {
      if (slotCounts.hasOwnProperty(appt.timeSlot)) {
        slotCounts[appt.timeSlot]++;
      }
    });

    const queueData = SLOT_OPTIONS.map((slot) => ({
      timeSlot: slot,
      queueCount: slotCounts[slot],
      crowdLevel: classifyCrowdLevel(slotCounts[slot]),
    }));

    const totalQueueLength = appointments.length;

    res.json({
      branchId,
      date: queryDate.toISOString().split("T")[0],
      overallCrowdLevel: classifyCrowdLevel(
        Math.ceil(totalQueueLength / SLOT_OPTIONS.length),
      ),
      totalQueueLength,
      estimatedWaitTime: totalQueueLength * 10,
      slots: queueData,
    });
  } catch (error) {
    console.error("Queue load error:", error);
    res.status(500).json({ error: "Failed to calculate queue load" });
  }
});

module.exports = router;
