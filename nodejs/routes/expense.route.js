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
const {
  updateMonthlyBudget,
  getUserData,
} = require("../controllers/user.controller");
const { getTelegramIdHook } = require("../controllers/telegram.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/login", loginToDashboard);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.post("/webhook", getTelegramIdHook);

router.get("/expenses", authMiddleware, getExpenses);
router.post("/create", authMiddleware, createExpense);
router.put("/:id", authMiddleware, editExpense);
router.delete("/:id", authMiddleware, deleteExpense);
router.patch("/update-budget", authMiddleware, updateMonthlyBudget);
router.get("/getUser/:telegramId", authMiddleware, getUserData);

module.exports = router;
