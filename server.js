const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const branchRoutes = require("./routes/branchRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const slotRoutes = require("./routes/slotRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 1163;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EQueue backend is running");
});

app.use("/api/branches", branchRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/slots", slotRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
