const mongoose = require("mongoose");

const expenseTrackerSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  name: { type: String, required: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, maxlength: 50 },
  date: { type: Date, default: Date.now },
  incomeId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeTracker" },
  source: { type: String, enum: ["website", "telegram"], default: "website" },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1,
  },
});

expenseTrackerSchema.index({ userId: 1, date: -1 });
expenseTrackerSchema.index({ incomeId: 1 });
expenseTrackerSchema.index({ date: -1 });

const ExpenseTracker = mongoose.model("ExpenseTracker", expenseTrackerSchema);

module.exports = ExpenseTracker;
