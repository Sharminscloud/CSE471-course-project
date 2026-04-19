const express = require("express");
const router = express.Router();
const {
  createService,
  getServices,
  updateService,
  deleteService,
  linkServiceToBranch,
} = require("../controllers/serviceController");

router.post("/", createService);
router.get("/", getServices);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

// linking
router.post("/link", linkServiceToBranch);

module.exports = router;
