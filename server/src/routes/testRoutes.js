const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");

router.get("/test", (req, res) => {
  res.json({ message: "API is working" });
});

router.post("/add-branch", async (req, res) => {
  try {
    const branch = await Branch.create({
      name: "Manual Branch",
      dailyCapacity: 25,
      serviceStartHour: 9,
      serviceEndHour: 17,
    });

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;