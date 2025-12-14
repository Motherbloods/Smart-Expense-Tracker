const {
  getActivitiesService,
  getActivityStatsService,
} = require("../services/activity.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");
const getActivities = async (req, res) => {
  try {
    const { type, action, startDate, endDate, search, limit } = req.query;

    const filters = {
      type,
      action,
      startDate,
      endDate,
      search,
      limit: limit ? parseInt(limit) : 100,
    };

    // Kirim null untuk mengambil semua data tanpa filter userId
    const activities = await getActivitiesService(null, filters);

    return res.status(200).json({
      success: true,
      message: "Activities retrieved successfully",
      data: activities,
    });
  } catch (e) {
    console.error("Error fetching activities:", e.message);
    return handleErrorResponse(res, "Error fetching activities", e);
  }
};

const getActivityStats = async (req, res) => {
  try {
    // Kirim null untuk mengambil stats semua user
    const stats = await getActivityStatsService(null);
    console.log("🔥 Activity stats fetched:", stats);
    return res.status(200).json({
      success: true,
      message: "Activity stats retrieved successfully",
      data: stats,
    });
  } catch (e) {
    console.error("Error fetching activity stats:", e.message);
    return handleErrorResponse(res, "Error fetching activity stats", e);
  }
};

module.exports = {
  getActivities,
  getActivityStats,
};
