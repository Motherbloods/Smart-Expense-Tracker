const Activity = require("../models/activity");
const UserExpenseTracker = require("../models/user");
const { escapeRegex, clampInt } = require("../utils/validators");

const ALLOWED_TYPES = ["expense", "income"];
const ALLOWED_ACTIONS = ["create", "update", "delete"];

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
    const user = await UserExpenseTracker.findOne({ telegramId }).select("username").lean();
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
    return activity;
  } catch (error) {
    console.error("Error creating activity log:", error.message);
    return null;
  }
};

const parseFilterDate = (value) => {
  if (typeof value !== "string" || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getActivitiesService = async (userId, filters = {}) => {
  const query = {};

  if (userId !== null && userId !== undefined) {
    query.userId = String(userId);
  }

  if (typeof filters.type === "string" && ALLOWED_TYPES.includes(filters.type)) {
    query.type = filters.type;
  }

  if (typeof filters.action === "string" && ALLOWED_ACTIONS.includes(filters.action)) {
    query.action = filters.action;
  }

  const startDate = parseFilterDate(filters.startDate);
  const endDate = parseFilterDate(filters.endDate);
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  if (typeof filters.search === "string" && filters.search.trim() !== "") {
    const pattern = escapeRegex(filters.search.trim().slice(0, 100));
    query.$or = [
      { entityName: { $regex: pattern, $options: "i" } },
      { category: { $regex: pattern, $options: "i" } },
      { source: { $regex: pattern, $options: "i" } },
      { userName: { $regex: pattern, $options: "i" } },
    ];
  }

  const limit = clampInt(filters.limit, 1, 200, 100);

  return Activity.find(query).sort({ createdAt: -1 }).limit(limit).lean();
};

const getActivityStatsService = async (userId) => {
  const match = {};
  if (userId !== null && userId !== undefined) {
    match.userId = String(userId);
  }

  return Activity.aggregate([
    { $match: match },
    {
      $group: {
        _id: { type: "$type", action: "$action" },
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);
};

const cleanupOldActivities = async (daysToKeep = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const result = await Activity.deleteMany({ createdAt: { $lt: cutoffDate } });
  return result.deletedCount;
};

module.exports = {
  createActivityLog,
  getActivitiesService,
  getActivityStatsService,
  cleanupOldActivities,
};
