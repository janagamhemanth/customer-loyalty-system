import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { getCurrentRule } from "../utils/getRule.js";
import { protect } from "../middleware/auth.js";

const router = Router();

function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || "development_secret_change_me", { expiresIn: "7d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });
    if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword, role: "customer" });
    const rule = await getCurrentRule();

    if (rule.welcomeBonus > 0) {
      user.pointsBalance = rule.welcomeBonus;
      await user.save();
      await Transaction.create({
        user: user._id,
        type: "welcome_bonus",
        points: rule.welcomeBonus,
        description: "Welcome bonus"
      });
    }

    res.status(201).json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, pointsBalance: user.pointsBalance, membership: user.membership }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    res.json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, pointsBalance: user.pointsBalance, membership: user.membership }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, pointsBalance: req.user.pointsBalance, membership: req.user.membership } });
});

export default router;
