import { Router } from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import Reward from "../models/Reward.js";
import Transaction from "../models/Transaction.js";
import { getCurrentRule, membershipFor } from "../utils/getRule.js";

const router = Router();
router.use(protect);

router.get("/dashboard", async (req, res, next) => {
  try {
    const [user, rewards, transactions] = await Promise.all([
      User.findById(req.user._id).select("-password"),
      Reward.find({ active: true }).sort({ pointsCost: 1 }),
      Transaction.find({ user: req.user._id }).populate("reward", "title").sort({ createdAt: -1 }).limit(10)
    ]);
    res.json({ user, rewards, transactions });
  } catch (error) { next(error); }
});

router.get("/transactions", async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).populate("reward", "title").sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (error) { next(error); }
});

router.post("/purchase", async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
      return res.status(400).json({ message: "Enter a valid purchase amount greater than zero." });
    }

    const rule = await getCurrentRule();
    const points = Math.floor(amount / rule.spendAmount) * rule.pointsAwarded;
    if (points < 1) return res.status(400).json({ message: `This purchase does not meet the minimum earning amount of ₹${rule.spendAmount}.` });

    const user = await User.findById(req.user._id);
    user.pointsBalance += points;
    user.membership = membershipFor(user.pointsBalance);
    await user.save();

    const transaction = await Transaction.create({
      user: user._id,
      type: "purchase",
      points,
      amount,
      description: `Demo purchase of ₹${amount.toFixed(2)}`
    });

    res.status(201).json({ message: `Purchase recorded. You earned ${points} points.`, user, transaction });
  } catch (error) { next(error); }
});


router.post("/redeem/:rewardId", async (req, res, next) => {
  let deductedUser = null;
  let rewardCost = 0;
  try {
    const reward = await Reward.findOne({ _id: req.params.rewardId, active: true });
    if (!reward) return res.status(404).json({ message: "This reward is not available." });

    rewardCost = reward.pointsCost;
    deductedUser = await User.findOneAndUpdate(
      { _id: req.user._id, pointsBalance: { $gte: rewardCost } },
      { $inc: { pointsBalance: -rewardCost } },
      { new: true }
    );

    if (!deductedUser) {
      return res.status(400).json({ message: "You do not have enough points for this reward." });
    }

    deductedUser.membership = membershipFor(deductedUser.pointsBalance);
    await deductedUser.save();

    const transaction = await Transaction.create({
      user: deductedUser._id,
      type: "redemption",
      points: -rewardCost,
      description: `Redeemed reward: ${reward.title}`,
      reward: reward._id
    });

    res.json({ message: `Successfully redeemed ${reward.title}.`, user: deductedUser, transaction });
  } catch (error) {
    if (deductedUser && rewardCost > 0) {
      await User.updateOne({ _id: deductedUser._id }, { $inc: { pointsBalance: rewardCost } }).catch(() => {});
    }
    next(error);
  }
});

export default router;
