import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./src/routes/authRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Customer Loyalty API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/customer_loyalty");
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
  process.exit(1);
}
