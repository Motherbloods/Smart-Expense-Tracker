const {
  createIncomeService,
  editIncomeService,
  deleteIncomeService,
  getIncomesService,
} = require("../services/income.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");
const ExpenseTracker = require("../models/expense");

const getIncomes = async (req, res) => {
  try {
    const incomes = await getIncomesService(req.user.telegramId);
    return res.status(200).json({
      success: true,
      message: "Incomes retrieved successfully",
      data: incomes,
    });
  } catch (e) {
    console.error("Error fetching incomes:", e.message);
    return handleErrorResponse(res, "Error fetching incomes", e);
  }
};

const createIncome = async (req, res) => {
  try {
    const newIncome = await createIncomeService(req.body, req.user.telegramId);
    return res.status(201).json({
      success: true,
      message: "Income created successfully",
      data: newIncome,
    });
  } catch (e) {
    console.error("Error creating income:", e.message);
    return handleErrorResponse(res, "Error creating income", e);
  }
};

const editIncome = async (req, res) => {
  try {
    const updatedIncome = await editIncomeService(
      req.body,
      req.params.id,
      req.user.telegramId
    );
    return res.status(200).json({
      success: true,
      message: "Income updated successfully",
      data: updatedIncome,
    });
  } catch (e) {
    console.error("Error updating income:", e.message);
    return handleErrorResponse(res, "Error updating income", e);
  }
};

const deleteIncome = async (req, res) => {
  try {
    const incomeId = req.params.id;

    // Cek apakah income dipakai di expense
    const usedInExpense = await ExpenseTracker.findOne({
      incomeId: incomeId,
    });

    if (usedInExpense) {
      return res.status(400).json({
        success: false,
        message:
          "Income tidak bisa dihapus karena sudah dipakai pada pengeluaran",
      });
    }

    // Kalau tidak dipakai, hapus income
    const deletedIncome = await deleteIncomeService(
      incomeId,
      req.user.telegramId
    );

    return res.status(200).json({
      success: true,
      message: "Income berhasil dihapus",
      data: deletedIncome,
    });
  } catch (e) {
    console.error("Error deleting income:", e.message);
    return handleErrorResponse(res, "Error deleting income", e);
  }
};

module.exports = { getIncomes, editIncome, createIncome, deleteIncome };
