// src/api/incomeService.js
import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

const getTelegramId = () => localStorage.getItem("telegramId");

// ✅ GET dengan caching (2 menit)
export const getIncomes = async () => {
  const telegramId = getTelegramId();

  return cachedAPICall(
    `incomes_${telegramId}`,
    async () => {
      const response = await axiosInstance.get("/incomes");
      console.log("📥 Fetched incomes from API");
      return response;
    },
    2 * 60 * 1000 // Cache 2 menit
  );
};

// ✅ CREATE - Invalidate cache setelah create
export const createIncome = async (data) => {
  try {
    const response = await axiosInstance.post("/incomes/create", data);
    const telegramId = getTelegramId();

    // Invalidate cache karena ada data baru
    apiCache.invalidate(`incomes_${telegramId}`);

    console.log("✅ Income created, cache invalidated");
    return response;
  } catch (error) {
    console.error("❌ Error creating income:", error);
    throw error;
  }
};

// ✅ UPDATE - Invalidate cache setelah update
export const editIncome = async (data, id) => {
  try {
    const response = await axiosInstance.put(`/incomes/${id}`, data);
    const telegramId = getTelegramId();

    // Invalidate cache
    apiCache.invalidate(`incomes_${telegramId}`);

    console.log("✅ Income updated, cache invalidated");
    return response;
  } catch (error) {
    console.error("❌ Error updating income:", error);
    throw error;
  }
};

// ✅ DELETE - Invalidate cache setelah delete
export const deleteIncome = async (id) => {
  try {
    const response = await axiosInstance.delete(`/incomes/${id}`);
    const telegramId = getTelegramId();

    // Invalidate cache
    apiCache.invalidate(`incomes_${telegramId}`);

    console.log("✅ Income deleted, cache invalidated");
    return response;
  } catch (error) {
    console.error("❌ Error deleting income:", error);
    throw error;
  }
};

export default axiosInstance;
