const express = require('express');
const Appointment = require('../models/Appointment');
const Branch = require('../models/Branch');

const router = express.Router();

/* =========================
   SLOT CHECK FUNCTION
========================= */
const isSlotAvailable = async (
  serviceType,
  date,
  timeSlot,
  branchId,
  excludeAppointmentId = null
) => {
  const query = {
    serviceType,
    date,
    timeSlot,
    branch: branchId || null,
    status: { $in: ['Confirmed', 'Rescheduled'] },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflict = await Appointment.findOne(query);
  return !conflict;
};

/* =========================
   CREATE APPOINTMENT
========================= */
router.post('/', async (req, res) => {
  try {
    const { serviceType, date, timeSlot, userName, userEmail, userPhone, branch } = req.body;

    if (!serviceType || !date || !timeSlot || !userName || !userEmail || !userPhone) {
      return res.status(400).json({ error: 'All booking fields are required' });
    }

    let branchId = branch || null;

    // Validate branch
    if (branchId) {
      const branchDoc = await Branch.findById(branchId);
      if (!branchDoc) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      if (!branchDoc.availableServices.includes(serviceType)) {
        return res.status(400).json({ error: 'Service not available at this branch' });
      }
    }

    const appointmentDate = new Date(date);

    const available = await isSlotAvailable(serviceType, appointmentDate, timeSlot, branchId);
    if (!available) {
      return res.status(409).json({ error: 'Slot not available' });
    }

    // Generate token
    const count = await Appointment.countDocuments({
      branch: branchId,
      date: appointmentDate,
    });

    const appointment = await Appointment.create({
      serviceType,
      date: appointmentDate,
      timeSlot,
      userName,
      userEmail,
      userPhone,
      branch: branchId,
      tokenNumber: count + 1,
      status: 'Confirmed',
      history: [
        {
          status: 'Confirmed',
          date: appointmentDate,
          timeSlot,
        },
      ],
    });

    req.app.get('io')?.emit('queueUpdated', { branchId });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/* =========================
   GET ALL
========================= */
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('branch')
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/* =========================
   GET ONE
========================= */
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(appointment);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

/* =========================
   CANCEL
========================= */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ error: 'Not found' });

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ error: 'Already cancelled' });
    }

    if (appointment.status === 'Served') {
      return res.status(400).json({ error: 'Cannot cancel completed appointment' });
    }

    appointment.status = 'Cancelled';

    appointment.history.push({
      status: 'Cancelled',
      date: appointment.date,
      timeSlot: appointment.timeSlot,
    });

    await appointment.save();

    req.app.get('io')?.emit('queueUpdated', { branchId: appointment.branch });

    res.json({ message: 'Cancelled', appointment });
  } catch {
    res.status(500).json({ error: 'Cancel failed' });
  }
});

/* =========================
   RESCHEDULE (FINAL FIXED)
========================= */
router.patch('/:id/reschedule', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ error: 'Not found' });

    if (appointment.status === 'Served') {
      return res.status(400).json({ error: 'Cannot reschedule completed appointment' });
    }

    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'Date and timeSlot required' });
    }

    const newDate = new Date(date);

    const available = await isSlotAvailable(
      appointment.serviceType,
      newDate,
      timeSlot,
      appointment.branch,
      appointment._id
    );

    if (!available) {
      return res.status(409).json({ error: 'Slot not available' });
    }

    appointment.date = newDate;
    appointment.timeSlot = timeSlot;

    // 👉 Clean logic: after reschedule → confirmed again
    appointment.status = 'Confirmed';

    appointment.history.push({
      status: 'Rescheduled',
      date: newDate,
      timeSlot,
    });

    await appointment.save();

    req.app.get('io')?.emit('queueUpdated', { branchId: appointment.branch });

    res.json({ message: 'Rescheduled successfully', appointment });
  } catch {
    res.status(500).json({ error: 'Reschedule failed' });
  }
});

/* =========================
   STATUS UPDATE
========================= */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['In-Progress', 'Served'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Not found' });

    appointment.status = status;

    if (status === 'Served') {
      appointment.servedAt = new Date();
    }

    appointment.history.push({
      status,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
    });

    await appointment.save();

    req.app.get('io')?.emit('queueUpdated', { branchId: appointment.branch });

    res.json({ message: 'Status updated', appointment });
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;

