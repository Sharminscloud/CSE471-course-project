const express = require("express");
const Branch = require("../models/Branch");

const router = express.Router();

const DEFAULT_AVG_PROCESSING_TIME = 15;

function timeToMinutes(time) {
  const parts = time.split(":").map(Number);

  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return null;
  }

  return parts[0] * 60 + parts[1];
}

function getFeasibleCapacity(branch) {
  if (
    !branch.workingHours ||
    !branch.workingHours.open ||
    !branch.workingHours.close
  ) {
    return null;
  }

  const openMinutes = timeToMinutes(branch.workingHours.open);
  const closeMinutes = timeToMinutes(branch.workingHours.close);

  if (openMinutes === null || closeMinutes === null) {
    return null;
  }

  const workingMinutes = closeMinutes - openMinutes;

  if (workingMinutes <= 0) {
    return null;
  }

  return Math.floor(
    (workingMinutes / DEFAULT_AVG_PROCESSING_TIME) * branch.activeCounters,
  );
}

function buildCapacityInfo(branch) {
  const feasibleCapacity = getFeasibleCapacity(branch);

  if (feasibleCapacity === null) {
    return {
      feasibleCapacity: null,
      warning:
        "Could not calculate feasible capacity. Please check working hours.",
    };
  }

  if (branch.dailyCapacity > feasibleCapacity) {
    return {
      feasibleCapacity,
      warning: `Configured dailyCapacity (${branch.dailyCapacity}) is higher than feasible capacity (${feasibleCapacity}) using default average service time of ${DEFAULT_AVG_PROCESSING_TIME} minutes.`,
    };
  }

  return {
    feasibleCapacity,
    warning: null,
  };
}

// Create a branch
router.post("/", async (req, res) => {
  try {
    const branch = await Branch.create(req.body);

    res.status(201).json({
      message: "Branch created successfully",
      branch,
      capacityInfo: buildCapacityInfo(branch),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all branches with optional search and filter
router.get("/", async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    const branches = await Branch.find(query).sort({ createdAt: -1 });

    res.json(branches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single branch by id
router.get("/:id", async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (err) {
    res.status(400).json({ message: "Invalid branch id" });
  }
});

// Update branch by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({
      message: "Branch updated successfully",
      branch: updated,
      capacityInfo: buildCapacityInfo(updated),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete branch by id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Branch.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid branch id" });
  }
});

module.exports = router;
