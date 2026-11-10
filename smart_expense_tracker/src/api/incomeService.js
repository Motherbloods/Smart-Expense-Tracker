import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

const getTelegramId = () => localStorage.getItem("telegramId");

// ✅ Helper untuk retry dengan delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryRequest = async (requestFn, maxRetries = 2, delayMs = 300) => {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Jangan retry jika bukan network/timeout error
      if (error.response?.status && error.response.status !== 401) {
        throw error;
      }

      if (i < maxRetries) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
};

// ✅ Get Incomes dengan caching dan retry
export const getIncomes = () => {
  const telegramId = getTelegramId();

  return cachedAPICall(
    `incomes_${telegramId}`,
    async () => {

      // Retry logic untuk handle race condition
      return await retryRequest(
        () => axiosInstance.get("/incomes"),
        2, // max 2 retries
        300 // 300ms delay
      );
    },
    3 * 60 * 1000 // Cache 3 menit
  );
};

// ✅ Create Income
export const createIncome = async (incomeData, telegramId = getTelegramId()) => {
  try {
    const response = await axiosInstance.post("/incomes/create", incomeData);

    // Invalidate cache
    apiCache.invalidate(`incomes_${telegramId}`);

    return response.data;
  } catch (error) {
    console.error("❌ Failed to create income:", error);
    throw error;
  }
};

// ✅ Edit Income
export const editIncome = async (incomeId, incomeData, telegramId = getTelegramId()) => {
  try {
    const response = await axiosInstance.put(
      `/incomes/${incomeId}`,
      incomeData
    );

    // Invalidate cache
    apiCache.invalidate(`incomes_${telegramId}`);

    return response;
  } catch (error) {
    console.error("❌ Failed to edit income:", error);
    throw error;
  }
};

// ✅ Delete Income - dengan better error handling
export const deleteIncome = async (incomeId, telegramId = getTelegramId()) => {
  try {
    const response = await axiosInstance.delete(`/incomes/${incomeId}`);

    // Invalidate cache hanya jika berhasil
    if (response.data.success) {
      apiCache.invalidate(`incomes_${telegramId}`);
    }

    return response;
  } catch (error) {
    console.error("❌ Failed to delete income:", error);
    throw error; // Re-throw untuk ditangani di Dashboard
  }
};
