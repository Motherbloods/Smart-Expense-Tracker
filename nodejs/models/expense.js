const mongoose = require("mongoose");

const expenseTrackerSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  incomeId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeTracker" },
});

const ExpenseTracker = mongoose.model("ExpenseTracker", expenseTrackerSchema);

module.exports = ExpenseTracker;
