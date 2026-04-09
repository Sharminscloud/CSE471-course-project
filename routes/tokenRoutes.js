const express = require("express");
const Token = require("../models/Token");
const Branch = require("../models/Branch");

const router = express.Router();

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Create a token (auto tokenNumber)
router.post("/", async (req, res) => {
  try {
    const { branch } = req.body;

    if (!branch) {
      return res.status(400).json({ message: "branch is required" });
    }

    const branchDoc = await Branch.findById(branch);

    if (!branchDoc) {
      return res.status(404).json({ message: "Branch not found" });
    }

    if (branchDoc.status === "Inactive") {
      return res.status(400).json({
        message: "Branch is inactive. New token requests are blocked.",
      });
    }

    if (branchDoc.status === "Maintenance") {
      return res.status(400).json({
        message: "Branch is under maintenance. New token requests are blocked.",
      });
    }

    const { start, end } = getTodayRange();

    const todayTokenCount = await Token.countDocuments({
      branch,
      issuedAt: { $gte: start, $lte: end },
      status: { $ne: "Cancelled" },
    });

    if (todayTokenCount >= branchDoc.dailyCapacity) {
      return res.status(400).json({
        message: `Daily capacity reached for this branch. Maximum allowed tokens today: ${branchDoc.dailyCapacity}`,
      });
    }

    const lastToken = await Token.findOne({ branch }).sort({ tokenNumber: -1 });
    const nextNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const token = await Token.create({
      branch,
      tokenNumber: nextNumber,
      status: "Waiting",
    });

    res.status(201).json({
      message: "Token created successfully",
      token,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all tokens
router.get("/", async (req, res) => {
  try {
    const tokens = await Token.find()
      .populate("branch", "name address status dailyCapacity activeCounters")
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
    );

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
