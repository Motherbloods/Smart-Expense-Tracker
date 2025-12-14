const express = require("express");
const {
  getAllUsers,
  getAllExpenses,
  getAllIncomes,
  getAdminSummary,
} = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Get all users
router.get("/admin/users", authMiddleware, getAllUsers);

// Get all expenses (with optional month/year filter)
router.get("/admin/expenses", authMiddleware, getAllExpenses);

// Get all incomes (with optional month/year filter)
router.get("/admin/incomes", authMiddleware, getAllIncomes);

// Get admin summary statistics
router.get("/admin/summary", authMiddleware, getAdminSummary);

module.exports = router;
