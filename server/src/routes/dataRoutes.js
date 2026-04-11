import express from "express";
import { getBranches, getServices } from "../controllers/tokenController.js";

const router = express.Router();

router.get("/branches", getBranches);
router.get("/services", getServices);

export default router;