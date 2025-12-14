const Activity = require("../models/activity");
const UserExpenseTracker = require("../models/user");

// Helper function untuk membuat log aktivitas
const createActivityLog = async ({
  userId,
  telegramId,
  type,
  action,
  entityId,
  entityName,
  amount,
  category = null,
  source = null,
  description = null,
  notes = null,
  metadata = {},
  sourceUser = "Telegram Bot",
}) => {
  try {
    // Ambil userName dari database
    const user = await UserExpenseTracker.findOne({ telegramId });
    const userName = user ? user.username || "Unknown User" : "Unknown User";

    const activity = new Activity({
      userId,
      telegramId,
      userName,
      type,
      action,
      entityId,
      entityName,
      amount,
      category,
      source,
      description,
      notes,
      metadata,
      sourceUser,
    });

    await activity.save();
    console.log(`✅ Activity log created: ${type} ${action}`);
    return activity;
  } catch (error) {
    console.error("❌ Error creating activity log:", error);
    return null;
  }
};

// Get activities dengan filter
// Get activities dengan filter
const getActivitiesService = async (userId, filters = {}) => {
  try {
    console.log("🔥 [SERVICE] getActivitiesService DIPANGGIL");
    console.log("👤 User ID:", userId);
    console.log("📋 Filters diterima:", filters);

    const query = {};

    // Hanya tambahkan filter userId jika userId ada dan bukan null
    if (userId !== null && userId !== undefined) {
      query.userId = userId;
      console.log("🔒 Filter by userId:", userId);
    } else {
      console.log("👑 Admin mode: Mengambil semua data tanpa filter userId");
    }

    // Filter berdasarkan type (expense/income)
    if (filters.type && filters.type !== "all") {
      query.type = filters.type;
      console.log("📌 Filter type:", filters.type);
    }

    // Filter berdasarkan action
    if (filters.action) {
      query.action = filters.action;
      console.log("📌 Filter action:", filters.action);
    }

    // Filter berdasarkan date range
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
        console.log("📅 Start Date:", filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
        console.log("📅 End Date:", filters.endDate);
      }
    }

    // Search query
    if (filters.search) {
      query.$or = [
        { entityName: { $regex: filters.search, $options: "i" } },
        { category: { $regex: filters.search, $options: "i" } },
        { source: { $regex: filters.search, $options: "i" } },
        { userName: { $regex: filters.search, $options: "i" } },
      ];
      console.log("🔎 Search:", filters.search);
    }

    console.log(
      "🧩 Final Query yang dikirim ke MongoDB:",
      JSON.stringify(query, null, 2)
    );
    console.log("📢 Limit:", filters.limit || 100);

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);

    console.log("✅ Jumlah hasil:", activities.length);

    // Debug: tampilkan sample data jika ada
    if (activities.length > 0) {
      console.log("📄 Sample data pertama:", activities[0]);
    }

    return activities;
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
    return [];
  }
};

// Get activity statistics
const getActivityStatsService = async (userId) => {
  try {
    const stats = await Activity.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            type: "$type",
            action: "$action",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return stats;
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return [];
  }
};

// Delete old activities (cleanup)
const cleanupOldActivities = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await Activity.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`🗑️ Cleaned up ${result.deletedCount} old activities`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up activities:", error);
    return 0;
  }
};

module.exports = {
  createActivityLog,
  getActivitiesService,
  getActivityStatsService,
  cleanupOldActivities,
};
