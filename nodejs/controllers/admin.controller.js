const {
  getAllUsersService,
  getAllExpensesService,
  getAllIncomesService,
  getAdminSummaryService,
} = require("../services/admin.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (e) {
    console.error("Error fetching users:", e.message);
    return handleErrorResponse(res, "Error fetching users", e);
  }
};

// Get all expenses with optional month/year filter (admin only)
const getAllExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;
    const expenses = await getAllExpensesService(month, year);
    return res.status(200).json({
      success: true,
      message: "All expenses retrieved successfully",
      data: expenses,
    });
  } catch (e) {
    console.error("Error fetching all expenses:", e.message);
    return handleErrorResponse(res, "Error fetching all expenses", e);
  }
};

// Get all incomes with optional month/year filter (admin only)
const getAllIncomes = async (req, res) => {
  try {
    const { month, year } = req.query;
    const incomes = await getAllIncomesService(month, year);
    return res.status(200).json({
      success: true,
      message: "All incomes retrieved successfully",
      data: incomes,
    });
  } catch (e) {
    console.error("Error fetching all incomes:", e.message);
    return handleErrorResponse(res, "Error fetching all incomes", e);
  }
};

// Get admin summary statistics (admin only)
const getAdminSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const summary = await getAdminSummaryService(month, year);
    return res.status(200).json({
      success: true,
      message: "Admin summary retrieved successfully",
      data: summary,
    });
  } catch (e) {
    console.error("Error fetching admin summary:", e.message);
    return handleErrorResponse(res, "Error fetching admin summary", e);
  }
};

module.exports = {
  getAllUsers,
  getAllExpenses,
  getAllIncomes,
  getAdminSummary,
};
