const {
  getActivitiesService,
  getActivityStatsService,
} = require("../services/activity.service");
const { handleErrorResponse } = require("../helper/errorHelper.handler");

const scopeFor = (req) => (req.user.role === "admin" ? null : req.user.telegramId);

const getActivities = async (req, res) => {
  try {
    const { type, action, startDate, endDate, search, limit } = req.query;
    const activities = await getActivitiesService(scopeFor(req), {
      type,
      action,
      startDate,
      endDate,
      search,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Activities retrieved successfully",
      data: activities,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching activities", e);
  }
};

const getActivityStats = async (req, res) => {
  try {
    const stats = await getActivityStatsService(scopeFor(req));
    return res.status(200).json({
      success: true,
      message: "Activity stats retrieved successfully",
      data: stats,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error fetching activity stats", e);
  }
};

module.exports = {
  getActivities,
  getActivityStats,
};
