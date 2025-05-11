const {
  createExpenseService,
  editExpenseService,
  deleteExpenseService,
  getExpensesService,
} = require("../services/expense.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");

const getExpenses = async (req, res) => {
  try {
    const expenses = await getExpensesService();
    return res.status(200).json({
      success: true,
      message: "Expenses retrieved successfully",
      data: expenses,
    });
  } catch (e) {
    console.error("Error fetching expenses:", e.message);
    return handleErrorResponse(res, "Error fetching expenses", e);
  }
};

const createExpense = async (req, res) => {
  try {
    const newExpense = await createExpenseService(
      req.body,
      req.user.telegramId
    );
    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: newExpense,
    });
  } catch (e) {
    console.error("Error creating expense:", e.message);
    return handleErrorResponse(res, "Error creating expense", e);
  }
};

const editExpense = async (req, res) => {
  try {
    const updatedExpense = await editExpenseService(
      req.body,
      req.params.id,
      req.user.telegramId
    );
    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (e) {
    console.error("Error updating expense:", e.message);
    return handleErrorResponse(res, "Error updating expense", e);
  }
};

const deleteExpense = async (req, res) => {
  console.log("deletedExpense", req.user);
  try {
    const deletedExpense = await deleteExpenseService(
      req.params.id,
      req.user.telegramId
    );
    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: deletedExpense,
    });
  } catch (e) {
    console.error("Error deleting expense:", e.message);
    return handleErrorResponse(res, "Error deleting expense", e);
  }
};

module.exports = { getExpenses, editExpense, createExpense, deleteExpense };
