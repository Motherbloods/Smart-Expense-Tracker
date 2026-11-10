import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

// ✅ Login - Backend akan handle cookie cleanup
export const loginToDashboard = async (telegramId, code) => {
  try {

    // ✅ Call backend login (backend akan clear old cookies dan set new ones)
    const response = await axiosInstance.post("/login", { telegramId, code });

    // ✅ Simpan data non-sensitif ke localStorage
    if (response.data.success) {
      localStorage.setItem("telegramId", telegramId);
      localStorage.setItem("userData", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      throw new Error("Terlalu banyak percobaan. Coba lagi beberapa menit lagi.");
    }
    if (status === 401 || status === 400) {
      throw new Error("ID Telegram atau kode login tidak valid atau sudah kedaluwarsa.");
    }
    throw new Error("Tidak dapat masuk saat ini. Silakan coba lagi.");
  }
};

// ✅ Update Budget
export const updateMonthlyBudget = async (budget, telegramId) => {
  try {
    const response = await axiosInstance.patch("/update-budget", { budget });

    apiCache.invalidate(`user_${telegramId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to update budget:", error);
    throw new Error("Failed to update budget. Please try again.");
  }
};

// ✅ Get User Data
export const getUserData = (telegramId) => {
  return cachedAPICall(
    `user_${telegramId}`,
    async () => {
      const response = await axiosInstance.get(`/getUser/${telegramId}`);
      return response;
    },
    10 * 60 * 1000
  );
};

// ✅ Logout - Backend handle cookie cleanup
export const logoutUser = async (telegramId) => {
  try {

    // ✅ Call backend logout (akan clear cookies di backend)
    await axiosInstance.post("/logout");

    // ✅ Invalidate cache
    if (telegramId) {
      apiCache.invalidate(`user_${telegramId}`);
      apiCache.invalidate(`expenses_${telegramId}`);
      apiCache.invalidate(`incomes_${telegramId}`);
      apiCache.invalidate(`summary_${telegramId}`);
    }

    // ✅ Clear localStorage
    localStorage.removeItem("telegramId");
    localStorage.removeItem("userData");

    return true;
  } catch (error) {
    console.error("❌ Logout error:", error);

    // ✅ Fallback: tetap clear localStorage
    localStorage.removeItem("telegramId");
    localStorage.removeItem("userData");

    return false;
  }
};
