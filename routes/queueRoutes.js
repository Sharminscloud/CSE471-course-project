const express = require("express");
const router = express.Router();
const {
  createToken,
  getTokens,
  getTokenPosition,
  updateTokenStatus,
} = require("../controllers/queueController");

router.post("/tokens", createToken);
router.get("/tokens", getTokens);
router.get("/tokens/:id/position", getTokenPosition);
router.patch("/tokens/:id/status", updateTokenStatus);

module.exports = router;
