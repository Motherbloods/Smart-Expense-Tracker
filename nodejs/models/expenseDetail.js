const mongoose = require("mongoose");

const expenseDetailSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  name: { type: String, required: true },
  sourceIncomeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IncomeTracker",
    required: true,
  },
  sourceIncomeName: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now },
});

const ExpenseDetail = mongoose.model("ExpenseDetail", expenseDetailSchema);

module.exports = ExpenseDetail;
