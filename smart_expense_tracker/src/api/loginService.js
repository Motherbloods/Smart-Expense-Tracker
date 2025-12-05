// src/api/loginService.js
import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

// ✅ Login - Tidak perlu cache (selalu fresh)
export const loginToDashboard = async (telegramId) => {
  try {
    const response = await axiosInstance.post("/login", { telegramId });
    console.log("✅ Login successful");
    return response.data;
  } catch (error) {
    console.error("❌ Login failed:", error);
    throw new Error("Login failed. Please try again.");
  }
};

// ✅ Update Budget - Invalidate user cache setelah update
export const updateMonthlyBudget = async (budget, telegramId) => {
  try {
    const response = await axiosInstance.patch("/update-budget", {
      telegramId,
      budget,
    });

    // Invalidate user data cache karena budget berubah
    apiCache.invalidate(`user_${telegramId}`);

    console.log("✅ Budget updated, cache invalidated");
    return response.data;
  } catch (error) {
    console.error("❌ Failed to update budget:", error);
    throw new Error("Failed to update budget. Please try again.");
  }
};

// ✅ Get User Data dengan caching (10 menit - data jarang berubah)
export const getUserData = (telegramId) => {
  return cachedAPICall(
    `user_${telegramId}`,
    async () => {
      const response = await axiosInstance.get(`/getUser/${telegramId}`);
      console.log("🔥 Fetched user data from API");
      return response;
    },
    10 * 60 * 1000 // Cache 10 menit (user data jarang berubah)
  );
};

// ✅ FIXED: Logout yang lebih aman dengan prevent race condition
export const logoutUser = (telegramId) => {
  return new Promise((resolve) => {
    try {
      console.log("🚪 Logout initiated");

      // ✅ Invalidate semua cache DULU sebelum clear localStorage
      if (telegramId) {
        apiCache.invalidate(`user_${telegramId}`);
        apiCache.invalidate(`expenses_${telegramId}`);
        apiCache.invalidate(`summary_${telegramId}`);
      }

      // ✅ Clear localStorage
      localStorage.removeItem("telegramId");
      localStorage.removeItem("userData");
      localStorage.removeItem("token");

      console.log("✅ Logout successful, all data cleared");

      // ✅ Resolve after clearing
      resolve(true);
    } catch (error) {
      console.error("❌ Logout error:", error);
      // ✅ Tetap resolve meski error (fallback)
      resolve(false);
    }
  });
};
