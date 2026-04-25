const express = require("express");
const Appointment = require("../models/Appointment");
const Token = require("../models/Token");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      email,
      serviceType,
      branch,
      status,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 5,
    } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Citizen email is required",
      });
    }

    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const cleanEmail = email.trim();

    const appointmentQuery = {
      userEmail: { $regex: `^${cleanEmail}$`, $options: "i" },
    };

    if (serviceType) {
      appointmentQuery.serviceType = { $regex: `^${serviceType.trim()}$`, $options: "i" };
    }

    if (status) {
      appointmentQuery.status = { $regex: `^${status.trim()}$`, $options: "i" };
    }

    if (startDate || endDate) {
      appointmentQuery.date = {};
      if (startDate) appointmentQuery.date.$gte = startDate;
      if (endDate) appointmentQuery.date.$lte = endDate;
    }

    const appointments = await Appointment.find(appointmentQuery)
      .populate("branch")
      .sort({ date: -1, createdAt: -1 });

    const tokenQuery = {
      email: { $regex: `^${cleanEmail}$`, $options: "i" },
    };

    if (status) {
      tokenQuery.status = { $regex: `^${status.trim()}$`, $options: "i" };
    }

    if (startDate || endDate) {
      tokenQuery.preferredDate = {};
      if (startDate) tokenQuery.preferredDate.$gte = startDate;
      if (endDate) tokenQuery.preferredDate.$lte = endDate;
    }

    const tokens = await Token.find(tokenQuery)
      .populate("branch")
      .populate("service")
      .sort({ preferredDate: -1, createdAt: -1 });

    let history = [];

    appointments.forEach((appt) => {
      history.push({
        type: "Appointment",
        recordId: appt._id,
        serviceName: appt.serviceType,
        branchName: appt.branch?.name || "N/A",
        date: appt.date,
        timeSlot: appt.timeSlot,
        status: appt.status,
        citizenName: appt.userName,
        email: appt.userEmail,
        phone: appt.userPhone,
        createdAt: appt.createdAt,
      });
    });

    tokens.forEach((token) => {
      history.push({
        type: "Token",
        recordId: token._id,
        tokenNumber: token.tokenNumber,
        serviceName: token.service?.name || "N/A",
        branchName: token.branch?.name || "N/A",
        date: token.preferredDate,
        timeSlot: token.timeSlot || "",
        status: token.status,
        citizenName: token.citizenName,
        email: token.email,
        phone: token.phone,
        isPriority: token.isPriority,
        createdAt: token.createdAt,
      });
    });

    if (branch) {
      history = history.filter((item) =>
        item.branchName?.toLowerCase().includes(branch.toLowerCase())
      );
    }

    if (search) {
      history = history.filter((item) => {
        const searchableText = `
          ${item.tokenNumber || ""}
          ${item.serviceName || ""}
          ${item.branchName || ""}
          ${item.status || ""}
          ${item.type || ""}
        `.toLowerCase();

        return searchableText.includes(search.toLowerCase());
      });
    }

    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalRecords = history.length;

    res.json({
      success: true,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / limitNumber) || 1,
      totalRecords,
      history: history.slice(skip, skip + limitNumber),
    });
  } catch (error) {
    console.error("Citizen activity history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load citizen activity history",
    });
  }
});

module.exports = router;