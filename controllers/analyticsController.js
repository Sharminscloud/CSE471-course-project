const Token = require("../models/Token");
const Branch = require("../models/Branch");

// GET /api/analytics/compare?branchAId=X&branchBId=Y
exports.compareBranches = async (req, res) => {
  try {
    const { branchAId, branchBId } = req.query;
    const today = new Date().toISOString().split("T")[0];

    const branchA = await Branch.findById(branchAId);
    const branchB = await Branch.findById(branchBId);

    const countA = await Token.countDocuments({
      branch: branchAId,
      preferredDate: today,
      status: "Waiting",
    });
    const countB = await Token.countDocuments({
      branch: branchBId,
      preferredDate: today,
      status: "Waiting",
    });

    res.json({
      branchA: { name: branchA.name, waiting: countA },
      branchB: { name: branchB.name, waiting: countB },
      recommendation: countA <= countB ? branchA.name : branchB.name,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to compare branches" });
  }
};

// GET /api/analytics/least-crowded
exports.leastCrowdedBranch = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const branches = await Branch.find({ status: "Active" });

    const result = await Promise.all(
      branches.map(async (branch) => {
        const waiting = await Token.countDocuments({
          branch: branch._id,
          preferredDate: today,
          status: "Waiting",
        });
        return { name: branch.name, address: branch.address, waiting };
      }),
    );

    result.sort((a, b) => a.waiting - b.waiting);

    res.json({
      leastCrowded: result[0],
      allBranches: result,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get least crowded branch" });
  }
};
