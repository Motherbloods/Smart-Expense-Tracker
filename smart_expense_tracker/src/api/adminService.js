// src/api/adminService.js
import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

// Get all users data (admin only)
export const getAllUsers = async () => {
  return cachedAPICall(
    `admin_users`,
    async () => {
      const response = await axiosInstance.get("/admin/users");
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
};
