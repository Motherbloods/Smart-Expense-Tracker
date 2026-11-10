const {
  getAllUsersService,
  getAllExpensesService,
  getAllIncomesService,
  getAdminSummaryService,
} = require("../services/admin.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");
const { parseMonthYear } = require("../utils/validators");

const invalidPeriod = (res) =>
  res.status(400).json({ success: false, message: "Invalid month or year" });

const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching users", e);
  }
};

const getAllExpenses = async (req, res) => {
  const period = parseMonthYear(req.query.month, req.query.year);
  if (!period.ok) return invalidPeriod(res);

  try {
    const expenses = await getAllExpensesService(period.range);
    return res.status(200).json({
      success: true,
      message: "All expenses retrieved successfully",
      data: expenses,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching all expenses", e);
  }
};

const getAllIncomes = async (req, res) => {
  const period = parseMonthYear(req.query.month, req.query.year);
  if (!period.ok) return invalidPeriod(res);

  try {
    const incomes = await getAllIncomesService(period.range);
    return res.status(200).json({
      success: true,
      message: "All incomes retrieved successfully",
      data: incomes,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching all incomes", e);
  }
};

const getAdminSummary = async (req, res) => {
  const period = parseMonthYear(req.query.month, req.query.year);
  if (!period.ok) return invalidPeriod(res);

  try {
    const summary = await getAdminSummaryService(period.range);
    return res.status(200).json({
      success: true,
      message: "Admin summary retrieved successfully",
      data: summary,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching admin summary", e);
  }
};

module.exports = {
  getAllUsers,
  getAllExpenses,
  getAllIncomes,
  getAdminSummary,
};
