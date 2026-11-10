import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import Reward from "../src/models/Reward.js";
import Rule from "../src/models/Rule.js";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/customer_loyalty");
  let admin = await User.findOne({ email: "admin@example.com" });
  if (!admin) {
    admin = await User.create({
      name: "System Admin",
      email: "admin@example.com",
      password: await bcrypt.hash("Admin@12345", 12),
      role: "admin"
    });
    console.log("Demo admin created: admin@example.com / Admin@12345");
  } else {
    console.log("Admin already exists; no changes made.");
  }

  if (!(await Rule.findOne())) {
    await Rule.create({ name: "Default earning rule", spendAmount: 100, pointsAwarded: 1, welcomeBonus: 20 });
    console.log("Default earning rule created.");
  }

  if (!(await Reward.countDocuments())) {
    await Reward.insertMany([
      { title: "₹50 Shopping Coupon", description: "A demo coupon for your next eligible purchase.", pointsCost: 50, category: "Coupon", active: true },
      { title: "₹100 Shopping Coupon", description: "Save on a future purchase.", pointsCost: 100, category: "Coupon", active: true },
      { title: "Premium Gift", description: "A sample gift reward managed by the admin.", pointsCost: 250, category: "Gift", active: true }
    ]);
    console.log("Demo rewards created.");
  }
  await mongoose.disconnect();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
