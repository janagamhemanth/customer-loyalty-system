import { Router } from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Reward from "../models/Reward.js";
import Rule from "../models/Rule.js";
import Transaction from "../models/Transaction.js";
import { getCurrentRule, membershipFor } from "../utils/getRule.js";

const router = Router();
router.use(protect, adminOnly);

router.get("/overview", async (req, res, next) => {
  try {
    const [customers, rewards, transactions, points, redemptions, recentTransactions] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      Reward.countDocuments(),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { points: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$points" } } }
      ]),
      Transaction.countDocuments({ type: "redemption" }),
      Transaction.find()
        .populate("user", "name email")
        .populate("reward", "title")
        .sort({ createdAt: -1 })
        .limit(8)
    ]);

    const rule = await getCurrentRule();

    res.json({
      stats: {
        customers,
        rewards,
        transactions,
        pointsIssued: points[0]?.total || 0,
        redemptions
      },
      rule,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
});

router.get("/customers", async (req, res, next) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

router.post("/customers/:id/award-points", async (req, res, next) => {
  try {
    const points = Number(req.body.points);
    const reason = String(req.body.reason || "").trim();

    if (!Number.isInteger(points) || points < 1 || points > 1000000) {
      return res.status(400).json({
        message: "Enter a valid points amount."
      });
    }

    if (!reason) {
      return res.status(400).json({
        message: "Please provide a reason."
      });
    }

    const customer = await User.findOne({
      _id: req.params.id,
      role: "customer"
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found."
      });
    }

    customer.pointsBalance += points;
customer.membership = membershipFor(customer.pointsBalance);
await customer.save();

    await Transaction.create({
      user: customer._id,
      type: "admin_award",
      points,
      description: `Admin awarded points: ${reason}`
    });

    res.json({
      message: `${points} points awarded successfully.`,
      customer
    });
  } catch (error) {
    next(error);
  }
});

router.get("/rewards", async (req, res, next) => {
  try {
    const rewards = await Reward.find().sort({ createdAt: -1 });
    res.json({ rewards });
  } catch (error) {
    next(error);
  }
});

router.post("/rewards", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "Voucher").trim();
    const pointsCost = Number(req.body.pointsCost);

    if (!title || !Number.isInteger(pointsCost) || pointsCost < 1) {
      return res.status(400).json({
        message: "A title and a positive whole-number points cost are required."
      });
    }
const reward = await Reward.create({
  title,
  description,
  category,
  pointsCost,
  imageUrl: String(req.body.imageUrl || "").trim(),
  active: req.body.active !== false
});
    res.status(201).json({ reward });
  } catch (error) {
    next(error);
  }
});

router.put("/rewards/:id", async (req, res, next) => {
  try {
    const update = {};

    if (req.body.title !== undefined) update.title = String(req.body.title).trim();
    if (req.body.description !== undefined) update.description = String(req.body.description).trim();
    if (req.body.category !== undefined) update.category = String(req.body.category).trim();
    if (req.body.imageUrl !== undefined) update.imageUrl = String(req.body.imageUrl).trim();
    if (req.body.active !== undefined) update.active = Boolean(req.body.active);

    if (req.body.pointsCost !== undefined) {
      const pointsCost = Number(req.body.pointsCost);

      if (!Number.isInteger(pointsCost) || pointsCost < 1) {
        return res.status(400).json({
          message: "Points cost must be a positive whole number."
        });
      }

      update.pointsCost = pointsCost;
    }

    const reward = await Reward.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!reward) {
      return res.status(404).json({ message: "Reward not found." });
    }

    res.json({ reward });
  } catch (error) {
    next(error);
  }
});

router.delete("/rewards/:id", async (req, res, next) => {
  try {
    const reward = await Reward.findByIdAndDelete(req.params.id);

    if (!reward) {
      return res.status(404).json({ message: "Reward not found." });
    }

    res.json({ message: "Reward deleted." });
  } catch (error) {
    next(error);
  }
});

router.put("/rule", async (req, res, next) => {
  try {
    const spendAmount = Number(req.body.spendAmount);
    const pointsAwarded = Number(req.body.pointsAwarded);
    const welcomeBonus = Number(req.body.welcomeBonus);

    if (
      !Number.isFinite(spendAmount) ||
      spendAmount < 1 ||
      !Number.isInteger(pointsAwarded) ||
      pointsAwarded < 1 ||
      !Number.isInteger(welcomeBonus) ||
      welcomeBonus < 0
    ) {
      return res.status(400).json({
        message: "Spend amount must be at least 1, points awarded must be a positive whole number, and welcome bonus cannot be negative."
      });
    }

    let rule = await Rule.findOne();

    if (!rule) rule = new Rule();

    rule.name = "Default earning rule";
    rule.spendAmount = spendAmount;
    rule.pointsAwarded = pointsAwarded;
    rule.welcomeBonus = welcomeBonus;

    await rule.save();

    res.json({
      message: "Reward rule updated.",
      rule
    });
  } catch (error) {
    next(error);
  }
});

export default router;