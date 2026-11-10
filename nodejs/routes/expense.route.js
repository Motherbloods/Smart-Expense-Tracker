const express = require("express");
const router = express.Router();
const {
  getExpenses,
  editExpense,
  createExpense,
  deleteExpense,
} = require("../controllers/expense.controller");
const {
  loginToDashboard,
  refreshAccessToken,
  logout,
} = require("../controllers/auth.controller");
const { updateMonthlyBudget, getUserData } = require("../controllers/user.controller");
const { getTelegramIdHook } = require("../controllers/telegram.controller");
const { authorizeChannel } = require("../controllers/realtime.controller");
const authMiddleware = require("../middleware/auth.middleware");
const verifyTelegramWebhook = require("../middleware/telegramWebhook.middleware");
const validateIdParam = require("../middleware/validateId");
const { loginLimiter, refreshLimiter, webhookLimiter } = require("../middleware/rateLimit");

router.param("id", validateIdParam);

router.post("/login", loginLimiter, loginToDashboard);
router.post("/refresh", refreshLimiter, refreshAccessToken);
router.post("/logout", logout);
router.post("/webhook", webhookLimiter, verifyTelegramWebhook, getTelegramIdHook);
router.post("/pusher/auth", authMiddleware, authorizeChannel);

router.get("/expenses", authMiddleware, getExpenses);
router.post("/create", authMiddleware, createExpense);
router.patch("/update-budget", authMiddleware, updateMonthlyBudget);
router.get("/getUser/:telegramId", authMiddleware, getUserData);
router.put("/:id", authMiddleware, editExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;
