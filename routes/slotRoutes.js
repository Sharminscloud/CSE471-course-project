const express = require("express");
const Appointment = require("../models/Appointment");
const Branch = require("../models/Branch");

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

router.get("/", (req, res) => {
  res.json({
    message: "Slot route is working",
  });
});

// [23301695] JAKIA — Advanced Search and Filtering
// GET /api/slots/search?branchId=&serviceType=&date=&timeSlot=&maxQueueLength=&page=&limit=
router.get("/search", async (req, res) => {
  try {
    const {
      branchId,
      serviceType,
      date,
      timeSlot,
      maxQueueLength,
    } = req.query;

    const searchDate = date || new Date().toISOString().split("T")[0];

    const branchQuery = {
      status: "Active",
    };

    if (branchId) {
      branchQuery._id = branchId;
    }

    const branches = await Branch.find(branchQuery).sort({ name: 1 });

    const results = [];

    for (const branch of branches) {
      const appointmentQuery = {
        branch: branch._id,
        status: { $in: ["Confirmed", "Rescheduled"] },
      };

      if (serviceType) {
        appointmentQuery.serviceType = serviceType;
      }

      const allAppointments = await Appointment.find(appointmentQuery);

      const filteredAppointments = allAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
          .toISOString()
          .split("T")[0];

        return appointmentDate === searchDate;
      });

      const currentQueueLength = filteredAppointments.length;

      if (maxQueueLength && currentQueueLength > Number(maxQueueLength)) {
        continue;
      }

      const bookedSlots = filteredAppointments.map(
        (appointment) => appointment.timeSlot
      );

      const availableSlots = SLOT_OPTIONS.filter((slot) => {
        if (timeSlot) {
          return slot === timeSlot && !bookedSlots.includes(slot);
        }

        return !bookedSlots.includes(slot);
      });

      if (availableSlots.length === 0) {
        continue;
      }

      results.push({
        branchId: branch._id,
        branchName: branch.name,
        address: branch.address,
        serviceType: serviceType || "Any available service",
        date: searchDate,
        currentQueueLength,
        availableSlots,
      });
    }

    res.json({
      success: true,
      totalResults: results.length,
      results,
    });
  } catch (error) {
    console.error("Advanced search error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to perform advanced search",
    });
  }
});

// [22301187] SHAHRIN — Slot Availability
// GET /api/slots/availability?serviceType=X&date=YYYY-MM-DD
router.get("/availability", async (req, res) => {
  try {
    const { serviceType, date } = req.query;

    if (!serviceType || !date) {
      return res.status(400).json({
        error: "serviceType and date are required",
      });
    }

    const bookingDate = getDateOnly(date);

    const booked = await Appointment.find({
      serviceType,
      date: bookingDate,
      status: { $in: ["Confirmed", "Rescheduled"] },
    });

    const bookedSlots = booked.map((appointment) => appointment.timeSlot);

    const availableSlots = SLOT_OPTIONS.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.json({
      serviceType,
      date,
      availableSlots,
      bookedSlots,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to check slot availability",
    });
  }
});

module.exports = router;
