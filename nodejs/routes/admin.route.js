const express = require("express");
const {
  getAllUsers,
  getAllExpenses,
  getAllIncomes,
  getAdminSummary,
} = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");

const router = express.Router();

router.use("/admin", authMiddleware, requireAdmin);

router.get("/admin/users", getAllUsers);
router.get("/admin/expenses", getAllExpenses);
router.get("/admin/incomes", getAllIncomes);
router.get("/admin/summary", getAdminSummary);

module.exports = router;
