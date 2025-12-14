// src/api/adminService.js
import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

// Get all users data (admin only)
export const getAllUsers = async () => {
  return cachedAPICall(
    `admin_users`,
    async () => {
      const response = await axiosInstance.get("/admin/users");
      console.log("📥 Fetched all users from API");
      return response;
    },
    2 * 60 * 1000 // Cache 2 menit
  );
};

// Get all expenses (admin only)
export const getAllExpenses = async (month, year) => {
  const cacheKey = `admin_expenses_${month}_${year}`;

  return cachedAPICall(
    cacheKey,
    async () => {
      const response = await axiosInstance.get("/admin/expenses", {
        params: { month, year },
      });
      console.log("📥 Fetched all expenses from API");
      return response;
    },
    2 * 60 * 1000 // Cache 2 menit
  );
};

// Get all incomes (admin only)
export const getAllIncomes = async (month, year) => {
  const cacheKey = `admin_incomes_${month}_${year}`;

  return cachedAPICall(
    cacheKey,
    async () => {
      const response = await axiosInstance.get("/admin/incomes", {
        params: { month, year },
      });
      console.log("📥 Fetched all incomes from API");
      return response;
    },
    2 * 60 * 1000 // Cache 2 menit
  );
};

// Get admin summary statistics
export const getAdminSummary = async (month, year) => {
  const cacheKey = `admin_summary_${month}_${year}`;

  return cachedAPICall(
    cacheKey,
    async () => {
      const response = await axiosInstance.get("/admin/summary", {
        params: { month, year },
      });
      console.log("📥 Fetched admin summary from API");
      return response;
    },
    2 * 60 * 1000 // Cache 2 menit
  );
};

// Invalidate all admin caches
export const invalidateAdminCache = () => {
  apiCache.invalidate("admin_users");
  apiCache.invalidate("admin_expenses");
  apiCache.invalidate("admin_incomes");
  apiCache.invalidate("admin_summary");
  console.log("✅ Admin cache invalidated");
};
