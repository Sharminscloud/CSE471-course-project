const express = require("express");
const { getWaitingTime } = require("../controllers/waitingTimeController");
const { checkHoliday } = require("../controllers/holidayController");

const router = express.Router();

// Holiday routes must come BEFORE /:branchId
// (otherwise Express reads "holiday" as a branchId)
router.get("/holiday/check", checkHoliday);

// Waiting time for a branch
router.get("/:branchId", getWaitingTime);

module.exports = router;
