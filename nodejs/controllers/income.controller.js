const {
  createIncomeService,
  editIncomeService,
  deleteIncomeService,
  getIncomesService,
} = require("../services/income.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");

const getIncomes = async (req, res) => {
  try {
    const incomes = await getIncomesService(req.user.telegramId);
    return res.status(200).json({
      success: true,
      message: "Incomes retrieved successfully",
      data: incomes,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching incomes", e);
  }
};

const createIncome = async (req, res) => {
  try {
    const newIncome = await createIncomeService(req.body, req.user.telegramId);
    if (!newIncome) {
      return res.status(400).json({
        success: false,
        message: "Data pemasukan tidak valid",
      });
    }
    return res.status(201).json({
      success: true,
      message: "Income created successfully",
      data: newIncome,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error creating income", e);
  }
};

const editIncome = async (req, res) => {
  try {
    const updatedIncome = await editIncomeService(req.params.id, req.body, req.user.telegramId);

    if (!updatedIncome) {
      return res.status(404).json({
        success: false,
        message: "Income not found, invalid data, or amount lower than the amount already used",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Income updated successfully",
      data: updatedIncome,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error updating income", e);
  }
};

const deleteIncome = async (req, res) => {
  try {
    const deletedIncome = await deleteIncomeService(req.params.id, req.user.telegramId);

    if (!deletedIncome) {
      return res.status(400).json({
        success: false,
        message: "Income tidak ditemukan atau sudah dipakai pada pengeluaran",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Income berhasil dihapus",
      data: deletedIncome,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error deleting income", e);
  }
};

module.exports = { getIncomes, editIncome, createIncome, deleteIncome };
