const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const branchRoutes = require("./routes/branchRoutes");
const waitingRoutes = require("./routes/waitingRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const serviceRoutes = require("./routes/serviceRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 1163;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EQueue backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/waiting", waitingRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/services", serviceRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
