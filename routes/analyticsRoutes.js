const express = require("express");
const router = express.Router();

const {
  compareBranches,
  leastCrowdedBranch,
} = require("../controllers/analyticsController");

router.get("/compare", compareBranches);
router.get("/least-crowded", leastCrowdedBranch);

module.exports = router;
