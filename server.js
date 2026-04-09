const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const branchRoutes = require("./routes/branchRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/branches", branchRoutes);
app.get("/", (req, res) => {
  res.send("EQueue backend is running");
});
app.use("/api/tokens", tokenRoutes);
connectDB();

const PORT = process.env.PORT || 1163;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});