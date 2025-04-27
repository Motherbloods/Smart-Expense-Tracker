require("dotenv").config();
const express = require("express");
const connectDB = require("./utils/db");
const router = require("./routes/expense.route.js");
const app = require("./utils/utils.js"); // langsung buat di sini aja lebih clean

(async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());
    app.use(router);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
  }
})();
