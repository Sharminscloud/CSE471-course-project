const express = require("express");
const Appointment = require("../models/Appointment");

const router = express.Router();

const isSlotAvailable = async (
  serviceType,
  date,
  timeSlot,
  excludeAppointmentId = null,
) => {
  const query = {
    serviceType,
    date,
    timeSlot,
    status: { $in: ["Confirmed", "Rescheduled"] },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflict = await Appointment.findOne(query);
  return !conflict;
};

router.post("/", async (req, res) => {
  try {
    const { serviceType, date, timeSlot, userName, userEmail, userPhone } =
      req.body;

    if (
      !serviceType ||
      !date ||
      !timeSlot ||
      !userName ||
      !userEmail ||
      !userPhone
    ) {
      return res.status(400).json({ error: "All booking fields are required" });
    }

    const appointmentDate = new Date(date);
    const available = await isSlotAvailable(
      serviceType,
      appointmentDate,
      timeSlot,
    );

    if (!available) {
      return res.status(409).json({ error: "Selected slot is not available" });
    }

    const appointment = await Appointment.create({
      serviceType,
      date: appointmentDate,
      timeSlot,
      userName,
      userEmail,
      userPhone,
      status: "Confirmed",
      history: [{ status: "Confirmed", date: appointmentDate, timeSlot }],
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      date: 1,
      timeSlot: 1,
    });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.status === "Cancelled") {
      return res
        .status(400)
        .json({ error: "Appointment is already cancelled" });
    }

    appointment.status = "Cancelled";
    appointment.history.push({
      status: "Cancelled",
      date: appointment.date,
      timeSlot: appointment.timeSlot,
    });

    await appointment.save();

    res.json({ message: "Appointment cancelled", appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
});

router.patch("/:id/reschedule", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res
        .status(400)
        .json({ error: "New date and timeSlot are required" });
    }

    const newDate = new Date(date);
    const available = await isSlotAvailable(
      appointment.serviceType,
      newDate,
      timeSlot,
      appointment._id,
    );

    if (!available) {
      return res
        .status(409)
        .json({ error: "Requested new slot is not available" });
    }

    appointment.date = newDate;
    appointment.timeSlot = timeSlot;
    appointment.status = "Rescheduled";
    appointment.history.push({
      status: "Rescheduled",
      date: newDate,
      timeSlot,
    });

    await appointment.save();

    res.json({ message: "Appointment rescheduled", appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reschedule appointment" });
  }
});

module.exports = router;
