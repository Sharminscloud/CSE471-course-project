const express = require("express");
const { getWaitingTime } = require("../controllers/waitingTimeController");
const { checkHoliday } = require("../controllers/holidayController");

const router = express.Router();

router.get("/holiday/check", checkHoliday);
router.get("/:branchId", getWaitingTime);

module.exports = router;
