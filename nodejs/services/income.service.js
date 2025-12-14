const IncomeTracker = require("../models/income");
const { createActivityLog } = require("./activity.service");

const getIncomesService = async (userId) => {
  try {
    return await IncomeTracker.find({ userId });
  } catch (e) {
    console.log("Error fetching incomes");
    return [];
  }
};

const createIncomeService = async (data, userId, sourceIncome = "website") => {
  try {
    const { name, amount, source, notes, date } = data;

    // Validasi required fields
    if (!name || !amount || !source) {
      console.log(
        "Missing required fields: name, amount, and source are required."
      );
      return null;
    }

    // Validasi amount
    if (isNaN(amount) || amount <= 0) {
      console.log("Amount must be a positive number.");
      return null;
    }

    // Validasi panjang input
    if (name.length > 100) {
      console.log("Name is too long (max 100 characters).");
      return null;
    }

    if (source.length > 100) {
      console.log("Source is too long (max 100 characters).");
      return null;
    }

    if (notes && notes.length > 200) {
      console.log("Notes is too long (max 200 characters).");
      return null;
    }

    const newIncome = new IncomeTracker({
      userId: userId,
      name,
      amount,
      source,
      notes: notes || "",
      date: date || new Date(),
      sourceIncome,
    });

    const savedIncome = await newIncome.save();

    // 🆕 Log activity
    await createActivityLog({
      userId,
      telegramId: userId,
      type: "income",
      action: "create",
      entityId: savedIncome._id,
      entityName: name,
      amount,
      source,
      notes,
      description: `Pemasukan ${name} sebesar Rp ${amount.toLocaleString(
        "id-ID"
      )}`,
      metadata: {
        date: savedIncome.date,
        remainingAmount: savedIncome.remainingAmount,
      },
      sourceUser: sourceIncome === "telegram" ? "Telegram Bot" : "Website",
    });

    return savedIncome;
  } catch (error) {
    console.error("Error creating income:", error);
    return null;
  }
};

// ✅ FIXED - Parameter order: (incomeId, data, userId)
const editIncomeService = async (incomeId, data, userId) => {
  try {
    const { name, source, amount, notes, date } = data;

    const income = await IncomeTracker.findById(incomeId);

    if (!income) {
      console.log("Income not found.");
      return null;
    }

    if (income.userId.toString() !== userId.toString()) {
      console.log("You are not authorized to edit this income.");
      return null;
    }

    const updatedIncome = await IncomeTracker.findByIdAndUpdate(
      incomeId,
      {
        userId,
        name,
        source,
        amount,
        notes,
        date,
      },
      { new: true }
    );

    // 🆕 Log activity
    await createActivityLog({
      userId,
      telegramId: userId,
      type: "income",
      action: "update",
      entityId: updatedIncome._id,
      entityName: updatedIncome.name,
      amount: updatedIncome.amount,
      source: updatedIncome.source,
      notes: updatedIncome.notes,
      description: `Pemasukan ${
        updatedIncome.name
      } diupdate menjadi Rp ${updatedIncome.amount.toLocaleString("id-ID")}`,
      metadata: {
        oldAmount: income.amount,
        newAmount: updatedIncome.amount,
        date: updatedIncome.date,
      },
      sourceUser: "Website",
    });

    return updatedIncome;
  } catch (error) {
    console.error("Error in editIncomeService:", error);
    throw error;
  }
};

const deleteIncomeService = async (incomeId, userId) => {
  try {
    const income = await IncomeTracker.findOne({ _id: incomeId, userId });

    if (!income) {
      console.log("Income not found or you're not authorized to delete it.");
      return null;
    }

    // Cek apakah ada expense yang menggunakan income ini
    const ExpenseTracker = require("../models/expense");
    const relatedExpenses = await ExpenseTracker.find({ incomeId: incomeId });

    if (relatedExpenses.length > 0) {
      console.log("Cannot delete income with related expenses.");
      return null;
    }

    // 🆕 Log activity sebelum delete
    await createActivityLog({
      userId,
      telegramId: userId,
      type: "income",
      action: "delete",
      entityId: income._id,
      entityName: income.name,
      amount: income.amount,
      source: income.source,
      notes: income.notes,
      description: `Pemasukan ${
        income.name
      } sebesar Rp ${income.amount.toLocaleString("id-ID")} dihapus`,
      metadata: {
        deletedAt: new Date(),
      },
      sourceUser: "Website",
    });

    return await IncomeTracker.findByIdAndDelete(incomeId);
  } catch (error) {
    console.error("Error deleting income:", error);
    return null;
  }
};

module.exports = {
  getIncomesService,
  createIncomeService,
  editIncomeService,
  deleteIncomeService,
};
