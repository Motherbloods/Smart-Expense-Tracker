const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  name: { type: String, required: true },
  source: { type: String, required: true },
  notes: { type: String },
  amount: { type: Number, required: true },
  remainingAmount: {
    type: Number,
    default: function () {
      return this.amount; // awalnya sama dengan jumlah income
    },
  },
  date: { type: Date, default: Date.now },
  sourceIncome: {
    type: String,
    enum: ["website", "telegram"],
    default: "website",
  },
});

const Income = mongoose.model("IncomeTracker", incomeSchema);

module.exports = Income;
