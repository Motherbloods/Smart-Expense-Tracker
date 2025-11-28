// src/api/expenseService.js
import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

const getTelegramId = () => localStorage.getItem("telegramId");

// ✅ GET dengan caching (2 menit)
export const getExpenses = async () => {
  const telegramId = getTelegramId();

  return cachedAPICall(
    `expenses_${telegramId}`,
    async () => {
      const response = await axiosInstance.get("/expenses");
      console.log("📥 Fetched expenses from API");
      return response;
    },
    2 * 60 * 1000 // Cache 2 menit
  );
};

// ✅ CREATE - Invalidate cache setelah create
export const createExpense = async (data) => {
  try {
    const response = await axiosInstance.post("/create", data);
    const telegramId = getTelegramId();

    // Invalidate cache karena ada data baru
    apiCache.invalidate(`expenses_${telegramId}`);
    apiCache.invalidate(`incomes_${telegramId}`);

    console.log("✅ Expense created, cache invalidated");
    return response;
  } catch (error) {
    console.error("❌ Error creating expense:", error);
    throw error;
  }
};

// ✅ UPDATE - Invalidate cache setelah update
export const editExpense = async (data, id) => {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    const telegramId = getTelegramId();

    // Invalidate cache
    apiCache.invalidate(`expenses_${telegramId}`);
    apiCache.invalidate(`incomes_${telegramId}`);

    console.log("✅ Expense updated, cache invalidated");
    return response;
  } catch (error) {
    console.error("❌ Error updating expense:", error);
    throw error;
  }
};

// ✅ DELETE - Invalidate cache setelah delete
export const deleteExpense = async (id) => {
  try {
    const response = await axiosInstance.delete(`/${id}`);
    const telegramId = getTelegramId();

    // Invalidate cache
    apiCache.invalidate(`expenses_${telegramId}`);
    apiCache.invalidate(`incomes_${telegramId}`);

    console.log("✅ Expense deleted, cache invalidated");
    return response;
  } catch (error) {
    console.error("❌ Error deleting expense:", error);
    throw error;
  }
};

export default axiosInstance;
