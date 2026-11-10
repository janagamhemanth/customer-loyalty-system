import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 500 },
  pointsCost: { type: Number, required: true, min: 1 },
  category: { type: String, default: "Voucher", trim: true },
  imageUrl: { type: String, default: "", trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Reward", rewardSchema);