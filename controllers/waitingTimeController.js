const Branch = require("../models/Branch");
const Token = require("../models/Token");

const getWaitingTime = async (req, res) => {
  const { branchId } = req.params;
  const date = req.query.date || new Date().toISOString().split("T")[0];

  // 1. Find the branch
  const branch = await Branch.findById(branchId);
  if (!branch) return res.status(404).json({ message: "Branch not found" });

  // 2. Block if branch is not active
  if (branch.status === "Inactive" || branch.status === "Maintenance") {
    return res
      .status(400)
      .json({ message: `Branch is ${branch.status}. Cannot estimate.` });
  }

  // 3. Count waiting tokens for this branch on this date
  const waitingCount = await Token.countDocuments({
    branch: branchId,
    preferredDate: date,
    status: "Waiting",
  });

  // 4. Simple formula: (waiting people / counters) * 15 minutes each
  const counters = branch.activeCounters || 1;
  const estimatedMinutes =
    waitingCount === 0 ? 0 : Math.ceil((waitingCount / counters) * 15);

  // 5. Send response
  res.json({
    branchName: branch.name,
    date: date,
    waitingPeople: waitingCount,
    activeCounters: branch.activeCounters,
    estimatedWaitMinutes: estimatedMinutes,
  });
};

module.exports = { getWaitingTime };
