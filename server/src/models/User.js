import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  pointsBalance: { type: Number, default: 0, min: 0 },
  membership: { type: String, enum: ["Bronze", "Silver", "Gold"], default: "Bronze" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
