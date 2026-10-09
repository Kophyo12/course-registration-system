const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const advisorRoutes = require("./routes/advisorRoutes");
const studentRoutes = require("./routes/studentRoutes");

dotenv.config();

const app = express();

app.use(
  cors({
    origin:
      process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

connectDB();

app.get("/api/health", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/advisor", advisorRoutes);
app.use("/api/student", studentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});