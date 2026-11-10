const User = require("../models/user");
const ExpenseTracker = require("../models/expense");
const IncomeTracker = require("../models/income");

const MAX_ROWS = 10000;

const dateFilterFor = (range) => (range ? { date: range } : {});

const getAllUsersService = async () =>
  User.find({ role: { $ne: "admin" } })
    .select("telegramId username firstName lastName createdAt")
    .sort({ createdAt: -1 })
    .limit(MAX_ROWS)
    .lean();

const getAllExpensesService = async (range) => {
  const expenses = await ExpenseTracker.find(dateFilterFor(range))
    .populate("incomeId", "name amount")
    .sort({ date: -1 })
    .limit(MAX_ROWS)
    .lean();

  return expenses.map((expense) => ({
    ...expense,
    telegramId: expense.telegramId || expense.userId,
  }));
};

const getAllIncomesService = async (range) => {
  const incomes = await IncomeTracker.find(dateFilterFor(range))
    .sort({ date: -1 })
    .limit(MAX_ROWS)
    .lean();

  return incomes.map((income) => ({
    ...income,
    telegramId: income.telegramId || income.userId,
  }));
};

const getAdminSummaryService = async (range) => {
  const dateFilter = dateFilterFor(range);

  const [totalUsers, expensesAgg, incomesAgg, categoryBreakdown, topUsers] = await Promise.all([
    User.countDocuments(),
    ExpenseTracker.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    IncomeTracker.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    ExpenseTracker.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    IncomeTracker.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$userId", totalIncome: { $sum: "$amount" } } },
      { $sort: { totalIncome: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalExpenses = expensesAgg[0]?.totalAmount || 0;
  const totalIncomes = incomesAgg[0]?.totalAmount || 0;

  return {
    totalUsers,
    totalExpenses,
    totalIncomes,
    expenseCount: expensesAgg[0]?.count || 0,
    incomeCount: incomesAgg[0]?.count || 0,
    netIncome: totalIncomes - totalExpenses,
    averageIncomePerUser: totalUsers > 0 ? totalIncomes / totalUsers : 0,
    categoryBreakdown,
    topUsers,
  };
};

module.exports = {
  getAllUsersService,
  getAllExpensesService,
  getAllIncomesService,
  getAdminSummaryService,
};
