const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const branchRoutes = require("./routes/branchRoutes");
const waitingRoutes = require("./routes/waitingRoutes");
const authRoutes = require("./routes/authRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const slotRoutes = require("./routes/slotRoutes");
const queueLoadRoutes = require("./routes/queueLoadRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const queueRoutes = require("./routes/queueRoutes");

const { startReminderScheduler } = require("./utils/reminderScheduler");

connectDB();

const app = express();
const PORT = process.env.PORT || 1163;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EQueue backend is running");
});
app.use("/api/queue", queueRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/waiting", waitingRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/queue-loads", queueLoadRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

startReminderScheduler();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
