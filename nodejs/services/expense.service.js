const ExpenseTracker = require("../models/expense");
const Income = require("../models/income");
const { createActivityLog } = require("./activity.service");
const {
  isObjectId,
  parseAmount,
  parseDate,
  parseConfidence,
  sanitizeText,
} = require("../utils/validators");

const MAX_EXPENSES_PER_REQUEST = 5000;

const getExpensesService = async (userId) =>
  ExpenseTracker.find({ userId })
    .populate("incomeId", "name")
    .sort({ date: -1, _id: -1 })
    .limit(MAX_EXPENSES_PER_REQUEST)
    .lean();

const reserveIncome = async (userId, amount, incomeId) => {
  const filter = { userId, remainingAmount: { $gte: amount } };
  if (incomeId) filter._id = incomeId;
  return Income.findOneAndUpdate(
    filter,
    { $inc: { remainingAmount: -amount } },
    { new: true, sort: { date: -1 } }
  );
};

const releaseIncome = async (userId, incomeId, amount) => {
  if (!incomeId) return null;
  return Income.updateOne({ _id: incomeId, userId }, { $inc: { remainingAmount: amount } });
};

const createExpenseService = async (data, userId, source = "website") => {
  const name = sanitizeText(data?.name, 100);
  const category = sanitizeText(data?.category, 50);
  const amount = parseAmount(data?.amount);
  const date = parseDate(data?.date);
  const confidence = parseConfidence(data?.confidence);
  const requestedIncomeId = data?.sourceIncomeId ? String(data.sourceIncomeId) : null;

  if (!name || !category || !amount || !date) return null;
  if (requestedIncomeId && !isObjectId(requestedIncomeId)) return null;

  const income = await reserveIncome(userId, amount, requestedIncomeId);
  if (!income) return null;

  let savedExpense;
  try {
    savedExpense = await ExpenseTracker.create({
      userId,
      name,
      amount,
      category,
      date,
      incomeId: income._id,
      source: source === "telegram" ? "telegram" : "website",
      confidence,
    });
  } catch (error) {
    await releaseIncome(userId, income._id, amount);
    throw error;
  }

  const populated = await savedExpense.populate("incomeId", "name");

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "expense",
    action: "create",
    entityId: savedExpense._id,
    entityName: name,
    amount,
    category,
    description: `Pengeluaran ${name} sebesar Rp ${amount.toLocaleString("id-ID")}`,
    metadata: { incomeSource: income.name, date, confidence },
    sourceUser: source === "telegram" ? "Telegram Bot" : "Website",
  });

  return populated;
};

const editExpenseService = async (data, expenseId, userId) => {
  if (!isObjectId(String(expenseId))) return null;

  const expense = await ExpenseTracker.findOne({ _id: expenseId, userId });
  if (!expense) return null;

  const hasAmount = data?.amount !== undefined && data?.amount !== null && data?.amount !== "";
  const newAmount = hasAmount ? parseAmount(data.amount) : expense.amount;
  if (!newAmount) return null;

  const requestedIncomeId = data?.sourceIncomeId ? String(data.sourceIncomeId) : null;
  if (requestedIncomeId && !isObjectId(requestedIncomeId)) return null;

  const name = data?.name !== undefined ? sanitizeText(data.name, 100) : expense.name;
  const category = data?.category !== undefined ? sanitizeText(data.category, 50) : expense.category;
  const date = data?.date !== undefined && data?.date !== "" ? parseDate(data.date) : expense.date;
  if (!name || !category || !date) return null;

  if (!expense.incomeId && !requestedIncomeId) return null;

  const oldAmount = expense.amount;
  const oldIncomeId = expense.incomeId;
  const newIncomeId = requestedIncomeId || String(oldIncomeId);
  const sameIncome = Boolean(oldIncomeId) && String(oldIncomeId) === newIncomeId;
  const delta = newAmount - oldAmount;

  if (sameIncome) {
    if (delta > 0) {
      const reserved = await reserveIncome(userId, delta, newIncomeId);
      if (!reserved) return null;
    } else if (delta < 0) {
      await releaseIncome(userId, newIncomeId, -delta);
    }
  } else {
    const reserved = await reserveIncome(userId, newAmount, newIncomeId);
    if (!reserved) return null;
  }

  let updatedExpense = null;
  try {
    updatedExpense = await ExpenseTracker.findOneAndUpdate(
      { _id: expenseId, userId, amount: oldAmount, incomeId: oldIncomeId },
      {
        $set: {
          name,
          amount: newAmount,
          category,
          date,
          incomeId: newIncomeId,
          confidence:
            data?.confidence !== undefined ? parseConfidence(data.confidence) : expense.confidence,
        },
      },
      { new: true }
    ).lean();
  } catch (error) {
    updatedExpense = null;
  }

  if (!updatedExpense) {
    if (sameIncome) {
      if (delta > 0) await releaseIncome(userId, newIncomeId, delta);
      else if (delta < 0) await Income.updateOne({ _id: newIncomeId, userId }, { $inc: { remainingAmount: delta } });
    } else {
      await releaseIncome(userId, newIncomeId, newAmount);
    }
    return null;
  }

  if (!sameIncome) {
    await releaseIncome(userId, oldIncomeId, oldAmount);
  }

  const targetIncome = await Income.findOne({ _id: newIncomeId, userId }).select("name").lean();

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "expense",
    action: "update",
    entityId: updatedExpense._id,
    entityName: updatedExpense.name,
    amount: newAmount,
    category: updatedExpense.category,
    description: `Pengeluaran ${updatedExpense.name} diupdate menjadi Rp ${newAmount.toLocaleString("id-ID")}`,
    metadata: {
      oldAmount,
      newAmount,
      date: updatedExpense.date,
      confidence: updatedExpense.confidence,
    },
    sourceUser: "Website",
  });

  return {
    ...updatedExpense,
    sourceIncomeName: targetIncome ? targetIncome.name : null,
  };
};

const deleteExpenseService = async (expenseId, userId) => {
  if (!isObjectId(String(expenseId))) return null;

  const expense = await ExpenseTracker.findOneAndDelete({ _id: expenseId, userId });
  if (!expense) return null;

  await releaseIncome(userId, expense.incomeId, expense.amount);

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "expense",
    action: "delete",
    entityId: expense._id,
    entityName: expense.name,
    amount: expense.amount,
    category: expense.category,
    description: `Pengeluaran ${expense.name} sebesar Rp ${expense.amount.toLocaleString("id-ID")} dihapus`,
    metadata: { deletedAt: new Date(), confidence: expense.confidence },
    sourceUser: "Website",
  });

  return expense;
};

module.exports = {
  getExpensesService,
  createExpenseService,
  editExpenseService,
  deleteExpenseService,
};
