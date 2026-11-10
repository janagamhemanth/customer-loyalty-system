import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
type: { type: String, enum: ["purchase", "redemption", "welcome_bonus", "admin_award"], required: true },
  points: { type: Number, required: true },
  description: { type: String, required: true },
  amount: { type: Number, default: 0 },
  reward: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", default: null }
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
