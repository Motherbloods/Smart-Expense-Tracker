const User = require("../models/user");
const ExpenseTracker = require("../models/expense");
const IncomeTracker = require("../models/income");

// Get all users
const getAllUsersService = async () => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("telegramId name username email createdAt")
      .sort({ createdAt: -1 });
    return users;
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

// Get all expenses with optional month/year filter
const getAllExpensesService = async (month, year) => {
  try {
    let filter = {};

    // Jika ada filter bulan dan tahun
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      filter.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const expenses = await ExpenseTracker.find(filter)
      .populate("incomeId", "name amount")
      .sort({ date: -1 });

    // Pastikan semua expense memiliki telegramId
    return expenses.map((expense) => ({
      ...expense.toObject(),
      telegramId: expense.telegramId || expense.userId,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }
};

// Get all incomes with optional month/year filter
const getAllIncomesService = async (month, year) => {
  try {
    let filter = {};

    // Jika ada filter bulan dan tahun
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      filter.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const incomes = await IncomeTracker.find(filter).sort({ date: -1 });

    // Pastikan semua income memiliki telegramId
    return incomes.map((income) => ({
      ...income.toObject(),
      telegramId: income.telegramId || income.userId,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch incomes: ${error.message}`);
  }
};

// Get admin summary statistics
const getAdminSummaryService = async (month, year) => {
  try {
    let dateFilter = {};

    // Filter berdasarkan bulan dan tahun jika ada
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // Hitung total users
    const totalUsers = await User.countDocuments();

    // Hitung total expenses
    const expensesAgg = await ExpenseTracker.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Hitung total incomes
    const incomesAgg = await IncomeTracker.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Category breakdown
    const categoryBreakdown = await ExpenseTracker.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    // Top users by income
    const topUsers = await IncomeTracker.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$telegramId",
          totalIncome: { $sum: "$amount" },
        },
      },
      { $sort: { totalIncome: -1 } },
      { $limit: 5 },
    ]);

    const totalExpenses = expensesAgg[0]?.totalAmount || 0;
    const totalIncomes = incomesAgg[0]?.totalAmount || 0;
    const expenseCount = expensesAgg[0]?.count || 0;
    const incomeCount = incomesAgg[0]?.count || 0;

    return {
      totalUsers,
      totalExpenses,
      totalIncomes,
      expenseCount,
      incomeCount,
      netIncome: totalIncomes - totalExpenses,
      averageIncomePerUser: totalUsers > 0 ? totalIncomes / totalUsers : 0,
      categoryBreakdown,
      topUsers,
    };
  } catch (error) {
    throw new Error(`Failed to fetch admin summary: ${error.message}`);
  }
};

module.exports = {
  getAllUsersService,
  getAllExpensesService,
  getAllIncomesService,
  getAdminSummaryService,
};
