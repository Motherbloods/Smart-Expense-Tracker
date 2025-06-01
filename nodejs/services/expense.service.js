const ExpenseTracker = require("../models/expense");

const getExpensesService = async (userId) => {
  try {
    return await ExpenseTracker.find({ userId });
  } catch (e) {
    console.log("Error fetching expenses");
    return [];
  }
};

const createExpenseService = async (data, userId) => {
  const { name, amount, category, date } = data;
  if (!name || !amount || !category || !date) {
    console.log("Missing required fields: name, amount, category, and date.");
    return null;
  }

  if (isNaN(amount)) {
    console.log("Amount must be a number.");
    return null;
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
    console.log("Expense not found.");
    return null;
  }

  if (expense.userId.toString() !== userId.toString()) {
    console.log("You are not authorized to edit this expense.");
    return null;
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
    console.log("Expense not found or you're not authorized to delete it.");
    return null;
  }

  return await ExpenseTracker.findByIdAndDelete(expenseId);
};

module.exports = {
  getExpensesService,
  createExpenseService,
  editExpenseService,
  deleteExpenseService,
};
