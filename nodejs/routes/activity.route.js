const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getActivities,
  getActivityStats,
} = require("../controllers/activity.controller");
const router = express.Router();

router.get("/activities", authMiddleware, getActivities);
router.get("/activities/stats", authMiddleware, getActivityStats);

module.exports = router;
