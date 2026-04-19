const express = require("express");
const Appointment = require("../models/Appointment");
const Branch = require("../models/Branch");

const router = express.Router();

// [22301187] SHAHRIN — Appointment & Slot Management

const isSlotAvailable = async (
  serviceType,
  date,
  timeSlot,
  branchId,
  excludeAppointmentId = null,
) => {
  const query = {
    serviceType,
    date,
    timeSlot,
    status: { $in: ["Confirmed", "Rescheduled"] },
  };
  if (branchId) query.branch = branchId;
  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };
  const conflict = await Appointment.findOne(query);
  return !conflict;
};

// POST /api/appointments — Book appointment
router.post("/", async (req, res) => {
  try {
    const {
      serviceType,
      date,
      timeSlot,
      userName,
      userEmail,
      userPhone,
      branch,
    } = req.body;

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

    let branchId = branch;
    if (branchId) {
      const branchDoc = await Branch.findById(branchId);
      if (!branchDoc) {
        return res.status(404).json({ error: "Branch not found" });
      }
      if (
        branchDoc.availableServices &&
        branchDoc.availableServices.length > 0
      ) {
        if (!branchDoc.availableServices.includes(serviceType)) {
          return res
            .status(400)
            .json({ error: "Selected branch does not offer this service" });
        }
      }
      if (
        branchDoc.status === "Inactive" ||
        branchDoc.status === "Maintenance"
      ) {
        return res
          .status(400)
          .json({ error: `Branch is currently ${branchDoc.status}` });
      }
    }

    const appointmentDate = new Date(date);
    const available = await isSlotAvailable(
      serviceType,
      appointmentDate,
      timeSlot,
      branchId,
    );
    if (!available) {
      return res.status(409).json({ error: "Selected slot is not available" });
    }

    const appointmentData = {
      serviceType,
      date: appointmentDate,
      timeSlot,
      userName,
      userEmail,
      userPhone,
      status: "Confirmed",
      history: [{ status: "Confirmed", date: appointmentDate, timeSlot }],
    };

    if (branchId) appointmentData.branch = branchId;

    const appointment = await Appointment.create(appointmentData);
    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

// GET /api/appointments — Get all appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "branch",
        select: "name address status",
        strictPopulate: false,
      })
      .sort({ date: 1, timeSlot: 1 });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// GET /api/appointments/:id — Get single appointment
router.get("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: "branch",
      select: "name address",
      strictPopulate: false,
    });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

// PATCH /api/appointments/:id/cancel — Cancel appointment
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

// PATCH /api/appointments/:id/reschedule — Reschedule appointment
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
      appointment.branch,
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
