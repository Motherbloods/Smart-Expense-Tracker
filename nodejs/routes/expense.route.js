const express = require("express");
const router = express.Router();
const {
  getExpenses,
  editExpense,
  createExpense,
  deleteExpense,
} = require("../controllers/expense.controller");
const { loginToDashboard } = require("../controllers/auth.controller");
const {
  updateMonthlyBudget,
  getUserData,
} = require("../controllers/user.controller");
const { getTelegramIdHook } = require("../controllers/telegram.controller");
router.get("/expenses", getExpenses);
router.post("/create", createExpense);
router.put("/:id", editExpense);
router.delete("/:id", deleteExpense);
router.post("/login", loginToDashboard);
router.post("/webhook", getTelegramIdHook);
router.patch("/update-budget", updateMonthlyBudget);
router.get("/getUser/:telegramId", getUserData);

module.exports = router;
