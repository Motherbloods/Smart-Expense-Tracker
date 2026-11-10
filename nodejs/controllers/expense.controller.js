const {
  createExpenseService,
  editExpenseService,
  deleteExpenseService,
  getExpensesService,
} = require("../services/expense.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");

const getExpenses = async (req, res) => {
  try {
    const expenses = await getExpensesService(req.user.telegramId);
    return res.status(200).json({
      success: true,
      message: "Expenses retrieved successfully",
      data: expenses,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching expenses", e);
  }
};

const createExpense = async (req, res) => {
  try {
    const newExpense = await createExpenseService(req.body, req.user.telegramId);
    if (!newExpense) {
      return res.status(400).json({
        success: false,
        message: "Data pengeluaran tidak valid atau sisa pemasukan tidak mencukupi",
      });
    }
    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: newExpense,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error creating expense", e);
  }
};

const editExpense = async (req, res) => {
  try {
    const updatedExpense = await editExpenseService(req.body, req.params.id, req.user.telegramId);
    if (!updatedExpense) {
      return res.status(400).json({
        success: false,
        message: "Pengeluaran tidak ditemukan, data tidak valid, atau sisa pemasukan tidak mencukupi",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error updating expense", e);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const deletedExpense = await deleteExpenseService(req.params.id, req.user.telegramId);
    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: deletedExpense,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error deleting expense", e);
  }
};

module.exports = { getExpenses, editExpense, createExpense, deleteExpense };
