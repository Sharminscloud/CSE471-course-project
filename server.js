const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// [21301163] SHARMIN
const branchRoutes = require("./routes/branchRoutes");
const waitingRoutes = require("./routes/waitingRoutes");
const authRoutes = require("./routes/authRoutes");

// [22201001] SUNEHRA
const serviceRoutes = require("./routes/serviceRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// [23301695] JAKIA
const tokenRoutes = require("./routes/tokenRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { startReminderScheduler } = require("./utils/reminderScheduler");

// [22301187] SHAHRIN
const appointmentRoutes = require("./routes/appointmentRoutes");
const slotRoutes = require("./routes/slotRoutes");
const queueLoadRoutes = require("./routes/queueLoadRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 1163;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EQueue backend is running");
});

// [21301163] SHARMIN
app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/waiting", waitingRoutes);

// [22201001] SUNEHRA
app.use("/api/services", serviceRoutes);
app.use("/api/analytics", analyticsRoutes);

// [23301695] JAKIA
app.use("/api/tokens", tokenRoutes);
app.use("/api/notifications", notificationRoutes);

// [22301187] SHAHRIN
app.use("/api/appointments", appointmentRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/branches", queueLoadRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startReminderScheduler();
});
