const IncomeTracker = require("../models/income");
const ExpenseTracker = require("../models/expense");
const { createActivityLog } = require("./activity.service");
const { isObjectId, parseAmount, parseDate, sanitizeText } = require("../utils/validators");

const MAX_INCOMES_PER_REQUEST = 5000;

const getIncomesService = async (userId) =>
  IncomeTracker.find({ userId }).sort({ date: -1, _id: -1 }).limit(MAX_INCOMES_PER_REQUEST).lean();

const createIncomeService = async (data, userId, sourceIncome = "website") => {
  try {
    const name = sanitizeText(data?.name, 100);
    const source = sanitizeText(data?.source, 100);
    const notes = sanitizeText(data?.notes, 200);
    const amount = parseAmount(data?.amount);
    const date = data?.date ? parseDate(data.date) : new Date();

    if (!name || !source || !amount || !date) return null;

    const savedIncome = await IncomeTracker.create({
      userId,
      name,
      amount,
      remainingAmount: amount,
      source,
      notes,
      date,
      sourceIncome: sourceIncome === "telegram" ? "telegram" : "website",
    });

    await createActivityLog({
      userId,
      telegramId: userId,
      type: "income",
      action: "create",
      entityId: savedIncome._id,
      entityName: name,
      amount,
      source,
      notes,
      description: `Pemasukan ${name} sebesar Rp ${amount.toLocaleString("id-ID")}`,
      metadata: { date: savedIncome.date, remainingAmount: savedIncome.remainingAmount },
      sourceUser: sourceIncome === "telegram" ? "Telegram Bot" : "Website",
    });

    return savedIncome;
  } catch (error) {
    console.error("Error creating income:", error.message);
    return null;
  }
};

const editIncomeService = async (incomeId, data, userId) => {
  if (!isObjectId(String(incomeId))) return null;

  const income = await IncomeTracker.findOne({ _id: incomeId, userId });
  if (!income) return null;

  const hasAmount = data?.amount !== undefined && data?.amount !== null && data?.amount !== "";
  const newAmount = hasAmount ? parseAmount(data.amount) : income.amount;
  if (!newAmount) return null;

  const changes = { amount: newAmount };

  if (data?.name !== undefined) {
    const name = sanitizeText(data.name, 100);
    if (!name) return null;
    changes.name = name;
  }
  if (data?.source !== undefined) {
    const source = sanitizeText(data.source, 100);
    if (!source) return null;
    changes.source = source;
  }
  if (data?.notes !== undefined) {
    changes.notes = sanitizeText(data.notes, 200);
  }
  if (data?.date !== undefined && data?.date !== "") {
    const date = parseDate(data.date);
    if (!date) return null;
    changes.date = date;
  }

  const oldAmount = income.amount;
  const amountDifference = newAmount - oldAmount;

  const updatedIncome = await IncomeTracker.findOneAndUpdate(
    {
      _id: incomeId,
      userId,
      amount: oldAmount,
      remainingAmount: { $gte: -amountDifference },
    },
    { $set: changes, $inc: { remainingAmount: amountDifference } },
    { new: true }
  );

  if (!updatedIncome) return null;

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "income",
    action: "update",
    entityId: updatedIncome._id,
    entityName: updatedIncome.name,
    amount: updatedIncome.amount,
    source: updatedIncome.source,
    notes: updatedIncome.notes,
    description: `Pemasukan ${updatedIncome.name} diupdate menjadi Rp ${updatedIncome.amount.toLocaleString("id-ID")}`,
    metadata: {
      oldAmount,
      newAmount,
      oldRemainingAmount: income.remainingAmount,
      newRemainingAmount: updatedIncome.remainingAmount,
      amountDifference,
      date: updatedIncome.date,
    },
    sourceUser: "Website",
  });

  return updatedIncome;
};

const deleteIncomeService = async (incomeId, userId) => {
  if (!isObjectId(String(incomeId))) return null;

  const income = await IncomeTracker.findOne({ _id: incomeId, userId });
  if (!income) return null;

  const inUse = await ExpenseTracker.exists({ incomeId, userId });
  if (inUse) return null;

  const deleted = await IncomeTracker.findOneAndDelete({ _id: incomeId, userId });
  if (!deleted) return null;

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "income",
    action: "delete",
    entityId: deleted._id,
    entityName: deleted.name,
    amount: deleted.amount,
    source: deleted.source,
    notes: deleted.notes,
    description: `Pemasukan ${deleted.name} sebesar Rp ${deleted.amount.toLocaleString("id-ID")} dihapus`,
    metadata: { deletedAt: new Date() },
    sourceUser: "Website",
  });

  return deleted;
};

module.exports = {
  getIncomesService,
  createIncomeService,
  editIncomeService,
  deleteIncomeService,
};
