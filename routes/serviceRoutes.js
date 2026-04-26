const express = require("express");
const router = express.Router();
const {
  createService,
  getServices,
  getBranches,
  updateService,
  deleteService,
  linkServiceToBranch,
  getServiceBranches,
  syncServiceBranches,
} = require("../controllers/serviceController");

router.post("/", createService);
router.get("/", getServices);
router.get("/branches", getBranches);
router.get("/:serviceId/branches", getServiceBranches);
router.put("/:serviceId/branches", syncServiceBranches);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

// linking
router.post("/link", linkServiceToBranch);

module.exports = router;