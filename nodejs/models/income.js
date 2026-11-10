const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  name: { type: String, required: true, maxlength: 100 },
  source: { type: String, required: true, maxlength: 100 },
  notes: { type: String, maxlength: 200 },
  amount: { type: Number, required: true, min: 0 },
  remainingAmount: {
    type: Number,
    min: 0,
    default: function () {
      return this.amount;
    },
  },
  date: { type: Date, default: Date.now },
  sourceIncome: {
    type: String,
    enum: ["website", "telegram"],
    default: "website",
  },
});

incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ date: -1 });

const Income = mongoose.model("IncomeTracker", incomeSchema);

module.exports = Income;
