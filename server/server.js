import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import dataRoutes from "./src/routes/dataRoutes.js";
import tokenRoutes from "./src/routes/tokenRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Queue System API is running" });
});

app.use("/api/data", dataRoutes);
app.use("/api/tokens", tokenRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});