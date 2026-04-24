const ServiceBranch = require("../models/serviceBranch");

// COMPARE BRANCHES — returns all service-branch assignments grouped by branch
exports.compareBranches = async (req, res) => {
  try {
    const data = await ServiceBranch.find()
      .populate("serviceId", "name avgProcessingTime fee priority")
      .populate("branchId", "name location");

    // Group by branch
    const grouped = {};
    data.forEach((entry) => {
      const bId = entry.branchId?._id?.toString() || "unknown";
      if (!grouped[bId]) {
        grouped[bId] = {
          branch: entry.branchId,
          services: [],
          totalCapacity: 0,
        };
      }
      grouped[bId].services.push(entry);
      grouped[bId].totalCapacity += entry.capacityPerDay || 0;
    });

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LEAST CROWDED BRANCH — branch with the lowest total capacityPerDay across its services
exports.leastCrowdedBranch = async (req, res) => {
  try {
    const data = await ServiceBranch.find()
      .populate("branchId", "name location");

    // Aggregate capacity per branch
    const capacityMap = {};
    data.forEach((entry) => {
      const bId = entry.branchId?._id?.toString() || "unknown";
      if (!capacityMap[bId]) {
        capacityMap[bId] = { branch: entry.branchId, totalCapacity: 0, count: 0 };
      }
      capacityMap[bId].totalCapacity += entry.capacityPerDay || 0;
      capacityMap[bId].count += 1;
    });

    const branches = Object.values(capacityMap);
    if (branches.length === 0) {
      return res.json({ message: "No branch assignments found" });
    }

    // Least crowded = lowest totalCapacity
    const least = branches.reduce((min, b) =>
      b.totalCapacity < min.totalCapacity ? b : min
    );

    res.json(least);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
