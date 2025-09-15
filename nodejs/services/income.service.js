const IncomeTracker = require("../models/income");

const getIncomesService = async (userId) => {
  try {
    return await IncomeTracker.find({ userId });
  } catch (e) {
    console.log("Error fetching incomes");
    return [];
  }
};

const createIncomeService = async (data, userId) => {
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
      // remainingAmount akan diset otomatis oleh middleware di model
    });

    const savedIncome = await newIncome.save();
    return savedIncome;
  } catch (error) {
    console.error("Error creating income:", error);
    return null;
  }
};

const editIncomeService = async (data, incomeId, userId) => {
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

  return await IncomeTracker.findByIdAndUpdate(
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
};

// const deleteIncomeService = async (incomeId, userId) => {
//   const income = await IncomeTracker.findOne({ _id: incomeId, userId });

//   if (!income) {
//     console.log("Income not found or you're not authorized to delete it.");
//     return null;
//   }

//   return await IncomeTracker.findByIdAndDelete(incomeId);
// };

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
