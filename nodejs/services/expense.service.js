const ExpenseTracker = require("../models/expense");

const getExpensesService = async (userId) => {
  try {
    return await ExpenseTracker.find({ userId });
  } catch (e) {
    throw new Error("Error fetching expenses");
  }
};

const createExpenseService = async (data, userId) => {
  const { name, amount, category, date } = data;

  if (!name || !amount || !category || !date) {
    throw new Error(
      "Missing required fields: name, amount, category, and date."
    );
  }

  if (isNaN(amount)) {
    throw new Error("Amount must be a number.");
  }

  const newExpense = new ExpenseTracker({
    userId: userId,
    name,
    amount,
    category,
    date,
  });

  return await newExpense.save();
};

const editExpenseService = async (data, expenseId, userId) => {
  const { name, amount, category, date } = data;
  const expense = await ExpenseTracker.findById(expenseId);

  if (!expense) {
    throw new Error("Expense not found.");
  }

  if (expense.userId.toString() !== userId.toString()) {
    throw new Error("You are not authorized to edit this expense.");
  }

  return await ExpenseTracker.findByIdAndUpdate(
    expenseId,
    {
      userId,
      name,
      amount,
      category,
      date,
    },
    { new: true }
  );
};

const deleteExpenseService = async (expenseId, userId) => {
  const expense = await ExpenseTracker.findOne({ _id: expenseId, userId });

  if (!expense) {
    throw new Error("Expense not found or you're not authorized to delete it.");
  }

  return await ExpenseTracker.findByIdAndDelete(expenseId);
};

module.exports = {
  getExpensesService,
  createExpenseService,
  editExpenseService,
  deleteExpenseService,
};
