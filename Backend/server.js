const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load .env file
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools and any localhost frontend dev port (Vite may auto-increment ports).
      const isLocalhost =
        typeof origin === "string" &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (!origin || isLocalhost) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Routes
const serviceRoutes = require("./routes/serviceRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const queueRoutes = require("./routes/queueRoutes");
app.use("/api/services", serviceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/queue", queueRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "🔥 Backend is running..." });
});

// Start server
const PORT = process.env.PORT || 1001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});