const express = require("express");
const router = express.Router();
const {
  getExpenses,
  editExpense,
  createExpense,
  deleteExpense,
} = require("../controllers/expense.controller");
router.get("/", getExpenses);
router.post("/create", createExpense);
router.put("/:id", editExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
