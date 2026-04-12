const express = require("express");
const Appointment = require("../models/Appointment");

const router = express.Router();

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

const getDateOnly = (dateString) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
};

router.get("/availability", async (req, res) => {
  try {
    const { serviceType, date } = req.query;

    if (!serviceType || !date) {
      return res
        .status(400)
        .json({ error: "serviceType and date are required" });
    }

    const bookingDate = getDateOnly(date);

    const booked = await Appointment.find({
      serviceType,
      date: bookingDate,
      status: { $in: ["Confirmed", "Rescheduled"] },
    });

    const usedSlots = booked.map((appt) => appt.timeSlot);
    const availableSlots = SLOT_OPTIONS.filter(
      (slot) => !usedSlots.includes(slot),
    );

    res.json({
      date: bookingDate.toISOString().split("T")[0],
      serviceType,
      availableSlots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch slot availability" });
  }
});

module.exports = router;
