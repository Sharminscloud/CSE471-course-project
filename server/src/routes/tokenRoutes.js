import express from "express";
import { createToken } from "../controllers/tokenController.js";

const router = express.Router();

router.post("/", createToken);

export default router;