import Rule from "../models/Rule.js";

export async function getCurrentRule() {
  let rule = await Rule.findOne();
  if (!rule) rule = await Rule.create({ name: "Default earning rule", spendAmount: 100, pointsAwarded: 1, welcomeBonus: 20 });
  return rule;
}

export function membershipFor(points) {
  if (points >= 1000) return "Gold";
  if (points >= 300) return "Silver";
  return "Bronze";
}
