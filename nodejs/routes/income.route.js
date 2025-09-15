const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getIncomes,
  createIncome,
  editIncome,
  deleteIncome,
} = require("../controllers/income.controller");
const router = express.Router();

router.get("/incomes", authMiddleware, getIncomes);
router.post("/incomes/create", authMiddleware, createIncome);
router.put("/incomes/:id", authMiddleware, editIncome);
router.delete("/incomes/:id", authMiddleware, deleteIncome);

module.exports = router;
