const ExpenseTracker = require("../models/expense");
const Income = require("../models/income");
const { createActivityLog } = require("./activity.service");

const getExpensesService = async (userId) => {
  try {
    return await ExpenseTracker.find({ userId })
      .populate("incomeId", "name")
      .sort({ date: -1, createdAt: -1 });
  } catch (e) {
    console.log("Error fetching expenses");
    return [];
  }
};

const createExpenseService = async (data, userId, source = "website") => {
  const { name, amount, category, date, sourceIncomeId, confidence } = data; // ✅ Tambahkan confidence
  console.log("🔥 Input Data:", data);

  let incomeId = sourceIncomeId;
  if (!incomeId) {
    console.log("🔍 Mencari income yang tersedia...");
    try {
      const availableIncome = await Income.findOne({
        userId,
        remainingAmount: { $gte: amount },
      }).sort({ date: -1 });

      if (!availableIncome) {
        console.log(
          "⚠️ Tidak ada income yang cukup untuk menutup amount:",
          amount,
        );
        return null;
      }

      console.log("✅ Income ditemukan:", availableIncome._id.toString());
      incomeId = availableIncome._id;
    } catch (error) {
      console.log("❌ Error saat mencari income:", error);
      return null;
    }
  } else {
    console.log("👉 Menggunakan incomeId dari request:", incomeId);
  }

  if (!name || !amount || !category || !date) {
    console.log("⚠️ Field wajib kosong:", { name, amount, category, date });
    return null;
  }

  if (isNaN(amount) || amount <= 0) {
    console.log("⚠️ Amount tidak valid:", amount);
    return null;
  }

  console.log("🔍 Cari income berdasarkan incomeId:", incomeId);
  const income = await Income.findById(incomeId);
  if (!income) {
    console.log("❌ Income tidak ditemukan untuk id:", incomeId);
    return null;
  }

  if (income.userId.toString() !== userId.toString()) {
    console.log("❌ Income tidak milik user:", {
      incomeUser: income.userId,
      currentUser: userId,
    });
    return null;
  }

  if (income.remainingAmount < amount) {
    console.log(
      "⚠️ Sisa income tidak cukup. Remaining:",
      income.remainingAmount,
      "| Dibutuhkan:",
      amount,
    );
    return null;
  }

  console.log(
    "✏️ Update sisa income:",
    income.remainingAmount,
    "->",
    income.remainingAmount - amount,
  );
  income.remainingAmount -= amount;
  await income.save();
  console.log("✅ Income berhasil diupdate.");

  // ✅ Simpan expense dengan confidence
  const newExpense = new ExpenseTracker({
    userId: userId,
    name,
    amount,
    category,
    date,
    incomeId: incomeId,
    source,
    confidence: confidence !== undefined ? confidence : 1, // ✅ Default 1 jika tidak ada
  });

  let savedExpense = await newExpense.save();
  console.log("💾 Expense berhasil disimpan:", savedExpense);

  savedExpense = await savedExpense.populate("incomeId", "name");

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "expense",
    action: "create",
    entityId: savedExpense._id,
    entityName: name,
    amount,
    category,
    description: `Pengeluaran ${name} sebesar Rp ${amount.toLocaleString(
      "id-ID",
    )}`,
    metadata: {
      incomeSource: income.name,
      date,
      confidence: confidence, // ✅ Tambahkan ke metadata
    },
    sourceUser: source === "telegram" ? "Telegram Bot" : "Website",
  });

  return savedExpense;
};

const editExpenseService = async (data, expenseId, userId) => {
  const { name, amount, category, date, sourceIncomeId, confidence } = data; // ✅ Tambahkan confidence
  const expense = await ExpenseTracker.findById(expenseId);
  if (!expense) {
    console.log("Expense not found.");
    return null;
  }
  if (expense.userId.toString() !== userId.toString()) {
    console.log("You are not authorized to edit this expense.");
    return null;
  }
  const oldAmount = expense.amount;
  const oldIncomeId = expense.incomeId;
  const newAmount = amount || oldAmount;
  const newIncomeId = sourceIncomeId || oldIncomeId;

  if (oldIncomeId.toString() !== newIncomeId.toString()) {
    const oldIncome = await Income.findById(oldIncomeId);
    if (oldIncome) {
      oldIncome.remainingAmount += oldAmount;
      await oldIncome.save();
    }

    const newIncome = await Income.findById(newIncomeId);
    if (!newIncome) {
      console.log("New income source not found");
      if (oldIncome) {
        oldIncome.remainingAmount -= oldAmount;
        await oldIncome.save();
      }
      return null;
    }

    if (newIncome.remainingAmount < newAmount) {
      console.log("Not enough remaining amount in the new income source.");
      // Rollback old income
      if (oldIncome) {
        oldIncome.remainingAmount -= oldAmount;
        await oldIncome.save();
      }
      return null;
    }

    newIncome.remainingAmount -= newAmount; // Kurangi dengan amount baru
    await newIncome.save();
  } else if (oldAmount !== newAmount) {
    // Kasus: Same income, beda amount
    const income = await Income.findById(oldIncomeId);
    if (!income) {
      console.log("Income source not found");
      return null;
    }

    income.remainingAmount += oldAmount;

    if (income.remainingAmount < newAmount) {
      console.log("Not enough remaining amount for the new expense amount.");
      income.remainingAmount -= oldAmount;
      await income.save();
      return null;
    }

    income.remainingAmount -= newAmount;
    await income.save();
  }

  // ✅ Update expense dengan confidence
  const updatedExpense = await ExpenseTracker.findByIdAndUpdate(
    expenseId,
    {
      userId,
      name: name || expense.name,
      amount: newAmount,
      category: category || expense.category,
      date: date || expense.date,
      incomeId: newIncomeId,
      confidence: confidence !== undefined ? confidence : expense.confidence, // ✅ Update confidence jika ada
    },
    { new: true },
  );

  const newIncome = await Income.findById(newIncomeId);
  const sourceIncomeName = newIncome ? newIncome.name : null;

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "expense",
    action: "update",
    entityId: updatedExpense._id,
    entityName: updatedExpense.name,
    amount: newAmount,
    category: updatedExpense.category,
    description: `Pengeluaran ${
      updatedExpense.name
    } diupdate menjadi Rp ${newAmount.toLocaleString("id-ID")}`,
    metadata: {
      oldAmount,
      newAmount,
      date: updatedExpense.date,
      confidence: updatedExpense.confidence, // ✅ Tambahkan ke metadata
    },
    sourceUser: "Website",
  });

  return {
    ...updatedExpense.toObject(),
    sourceIncomeName,
  };
};

const deleteExpenseService = async (expenseId, userId) => {
  const expense = await ExpenseTracker.findOne({ _id: expenseId, userId });

  if (!expense) {
    console.log("Expense not found or you're not authorized to delete it.");
    return null;
  }

  const income = await Income.findById(expense.incomeId);
  if (income) {
    income.remainingAmount += expense.amount;
    await income.save();
  }

  await createActivityLog({
    userId,
    telegramId: userId,
    type: "expense",
    action: "delete",
    entityId: expense._id,
    entityName: expense.name,
    amount: expense.amount,
    category: expense.category,
    description: `Pengeluaran ${
      expense.name
    } sebesar Rp ${expense.amount.toLocaleString("id-ID")} dihapus`,
    metadata: {
      deletedAt: new Date(),
      confidence: expense.confidence, // ✅ Tambahkan ke metadata
    },
    sourceUser: "Website",
  });

  return await ExpenseTracker.findByIdAndDelete(expenseId);
};

module.exports = {
  getExpensesService,
  createExpenseService,
  editExpenseService,
  deleteExpenseService,
};
