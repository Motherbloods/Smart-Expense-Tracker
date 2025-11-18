require("dotenv").config();
const express = require("express");
const connectDB = require("./utils/db");
const expenseRouter = require("./routes/expense.route.js");
const incomeRouter = require("./routes/income.route.js");
const app = require("./utils/utils.js"); // langsung buat di sini aja lebih clean

(async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());
    app.use("/", expenseRouter);
    app.use("/", incomeRouter);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
  }
})();
