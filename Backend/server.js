const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load .env file
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Routes
const serviceRoutes = require("./routes/serviceRoutes");
app.use("/api/services", serviceRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "🔥 Backend is running..." });
});

// Start server
const PORT = process.env.PORT || 1001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});