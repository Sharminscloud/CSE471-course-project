const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { startReminderScheduler } = require("./utils/reminderScheduler");

dotenv.config();

const app = express();

connectDB();

startReminderScheduler();

const allowedOrigins = [
  "http://localhost:5173",
  "https://sharminscloud.github.io",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "EQueue backend is running",
    project:
      "Government Service Queue Transparency and Smart Slot Management System",
    port: process.env.PORT || 1163,
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/tokens", require("./routes/tokenRoutes"));
app.use("/api/waiting", require("./routes/waitingRoutes"));
app.use("/api/queue", require("./routes/queueRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/activity", require("./routes/activityRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 1163;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
