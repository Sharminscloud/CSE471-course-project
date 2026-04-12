const express = require("express");
const Token = require("../models/Token");
const {
  getBranches,
  getServices,
  createToken,
} = require("../controllers/tokenController");

const router = express.Router();

// New token feature routes
router.get("/branches", getBranches);
router.get("/services", getServices);
router.post("/", createToken);

// Get all tokens
router.get("/", async (req, res) => {
  try {
    const tokens = await Token.find()
      .populate("branch", "name address status dailyCapacity activeCounters")
      .populate("service", "name")
      .sort({ createdAt: -1 });

    res.json(tokens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update token status by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Token.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true },
    )
      .populate("branch", "name")
      .populate("service", "name");

    if (!updated) {
      return res.status(404).json({ message: "Token not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete token by id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Token.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Token not found" });
    }

    res.json({ message: "Token deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid token id" });
  }
});

module.exports = router;
