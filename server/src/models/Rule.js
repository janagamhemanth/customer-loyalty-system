import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
  name: { type: String, default: "Default earning rule" },
  spendAmount: { type: Number, default: 100, min: 1 },
  pointsAwarded: { type: Number, default: 1, min: 1 },
  welcomeBonus: { type: Number, default: 20, min: 0 }
}, { timestamps: true });

export default mongoose.model("Rule", ruleSchema);
