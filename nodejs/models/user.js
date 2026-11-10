const mongoose = require("mongoose");

const userExpenseTrackerSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    photoUrl: { type: String },
    authDate: { type: Date },
    budgetMontly: { type: Number, default: 0, min: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const UserExpenseTracker = mongoose.model("UserExpenseTracker", userExpenseTrackerSchema);

module.exports = UserExpenseTracker;
