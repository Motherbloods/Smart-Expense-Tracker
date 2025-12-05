const ExpenseTracker = require("../models/expense");
const Income = require("../models/income");

const getExpensesService = async (userId) => {
  try {
    return await ExpenseTracker.find({ userId }).populate("incomeId", "name");
  } catch (e) {
    console.log("Error fetching expenses");
    return [];
  }
};

const createExpenseService = async (data, userId, source = "website") => {
  const { name, amount, category, date, sourceIncomeId } = data;
  console.log("📥 Input Data:", data);

  // Jika sourceIncomeId tidak disediakan, cari income pertama yang tersedia
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
          amount
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

  // Validasi field
  if (!name || !amount || !category || !date) {
    console.log("⚠️ Field wajib kosong:", { name, amount, category, date });
    return null;
  }

  if (isNaN(amount) || amount <= 0) {
    console.log("⚠️ Amount tidak valid:", amount);
    return null;
  }

  // Cari income
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
      amount
    );
    return null;
  }

  // Update remaining amount
  console.log(
    "✏️ Update sisa income:",
    income.remainingAmount,
    "->",
    income.remainingAmount - amount
  );
  income.remainingAmount -= amount;
  await income.save();
  console.log("✅ Income berhasil diupdate.");

  // Simpan expense
  const newExpense = new ExpenseTracker({
    userId: userId,
    name,
    amount,
    category,
    date,
    incomeId: incomeId,
    source,
  });

  let savedExpense = await newExpense.save();
  console.log("💾 Expense berhasil disimpan:", savedExpense);

  savedExpense = await savedExpense.populate("incomeId", "name");

  return savedExpense;
};

const editExpenseService = async (data, expenseId, userId) => {
  const { name, amount, category, date, sourceIncomeId } = data;
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

  // Jika income ID berubah
  if (oldIncomeId.toString() !== newIncomeId.toString()) {
    // Kembalikan amount ke income lama
    const oldIncome = await Income.findById(oldIncomeId);
    if (oldIncome) {
      oldIncome.remainingAmount += oldAmount;
      await oldIncome.save();
    }

    // Kurangi amount dari income baru
    const newIncome = await Income.findById(newIncomeId);
    if (!newIncome) {
      console.log("New income source not found");
      return null;
    }

    if (newIncome.remainingAmount < newAmount) {
      console.log("Not enough remaining amount in the new income source.");
      // Kembalikan amount ke income lama karena transaksi gagal
      if (oldIncome) {
        oldIncome.remainingAmount -= oldAmount;
        await oldIncome.save();
      }
      return null;
    }

    newIncome.remainingAmount -= newAmount;
    await newIncome.save();
  }
  // Jika income ID sama tapi amount berubah
  else if (oldAmount !== newAmount) {
    const income = await Income.findById(oldIncomeId);
    if (!income) {
      console.log("Income source not found");
      return null;
    }

    // Hitung selisih amount
    const amountDifference = newAmount - oldAmount;

    // Cek apakah saldo mencukupi jika amount bertambah
    if (amountDifference > 0 && income.remainingAmount < amountDifference) {
      console.log("Not enough remaining amount for the increased expense.");
      return null;
    }

    // Update remaining amount
    income.remainingAmount -= amountDifference;
    await income.save();
  }

  // Update expense
  const updatedExpense = await ExpenseTracker.findByIdAndUpdate(
    expenseId,
    {
      userId,
      name: name || expense.name,
      amount: newAmount,
      category: category || expense.category,
      date: date || expense.date,
      incomeId: newIncomeId,
    },
    { new: true }
  );

  return updatedExpense;
};

const deleteExpenseService = async (expenseId, userId) => {
  const expense = await ExpenseTracker.findOne({ _id: expenseId, userId });

  if (!expense) {
    console.log("Expense not found or you're not authorized to delete it.");
    return null;
  }

  // Kembalikan amount ke income source saat delete
  const income = await Income.findById(expense.incomeId);
  if (income) {
    income.remainingAmount += expense.amount;
    await income.save();
  }

  return await ExpenseTracker.findByIdAndDelete(expenseId);
};

module.exports = {
  getExpensesService,
  createExpenseService,
  editExpenseService,
  deleteExpenseService,
};
