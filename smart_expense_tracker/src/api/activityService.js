// src/api/activityService.js
import axiosInstance from "./axiosInstance";
import { cachedAPICall, apiCache } from "../utils/apiCache";

const getTelegramId = () => localStorage.getItem("telegramId");

// ✅ GET activities dengan caching (1 menit)
export const getActivities = async (filters = {}) => {
  const telegramId = getTelegramId();
  const cacheKey = `activities_${telegramId}_${JSON.stringify(filters)}`;

  return cachedAPICall(
    cacheKey,
    async () => {
      const params = new URLSearchParams();

      if (filters.type && filters.type !== "all") {
        params.append("type", filters.type);
      }
      if (filters.action) {
        params.append("action", filters.action);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.limit) {
        params.append("limit", filters.limit);
      }

      const response = await axiosInstance.get(
        `/activities?${params.toString()}`
      );
      console.log("🔥 Fetched activities from API");
      return response;
    },
    1 * 60 * 1000 // Cache 1 menit
  );
};

// ✅ GET activity statistics
export const getActivityStats = async () => {
  const telegramId = getTelegramId();

  return cachedAPICall(
    `activity_stats_${telegramId}`,
    async () => {
      const response = await axiosInstance.get("/activities/stats");
      console.log("📊 Fetched activity stats from API");
      return response;
    },
    2 * 60 * 1000 // Cache 2 menit
  );
};

// ✅ Invalidate activity cache
export const invalidateActivityCache = () => {
  const telegramId = getTelegramId();
  // Invalidate semua cache yang berhubungan dengan activities
  Object.keys(apiCache.cache).forEach((key) => {
    if (key.startsWith(`activities_${telegramId}`)) {
      apiCache.invalidate(key);
    }
  });
  apiCache.invalidate(`activity_stats_${telegramId}`);
  console.log("✅ Activity cache invalidated");
};

export default axiosInstance;
