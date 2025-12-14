import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

// ✅ Login - Backend akan handle cookie cleanup
export const loginToDashboard = async (telegramId) => {
  try {
    console.log("🔐 Starting login process...");

    // ✅ Call backend login (backend akan clear old cookies dan set new ones)
    const response = await axiosInstance.post("/login", { telegramId });

    // ✅ Simpan data non-sensitif ke localStorage
    if (response.data.success) {
      localStorage.setItem("telegramId", telegramId);
      localStorage.setItem("userData", JSON.stringify(response.data.user));
      console.log("✅ Login successful, data saved");
    }

    return response.data;
  } catch (error) {
    console.error("❌ Login failed:", error);
    throw new Error("Login failed. Please try again.");
  }
};

// ✅ Update Budget
export const updateMonthlyBudget = async (budget, telegramId) => {
  try {
    const response = await axiosInstance.patch("/update-budget", {
      telegramId,
      budget,
    });

    apiCache.invalidate(`user_${telegramId}`);
    console.log("✅ Budget updated, cache invalidated");
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
      console.log("📥 Fetched user data from API");
      return response;
    },
    10 * 60 * 1000
  );
};

// ✅ Logout - Backend handle cookie cleanup
export const logoutUser = async (telegramId) => {
  try {
    console.log("🚪 Logout initiated");

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

    console.log("✅ Logout successful");
    return true;
  } catch (error) {
    console.error("❌ Logout error:", error);

    // ✅ Fallback: tetap clear localStorage
    localStorage.removeItem("telegramId");
    localStorage.removeItem("userData");

    return false;
  }
};
