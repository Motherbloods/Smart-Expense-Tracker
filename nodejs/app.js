require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./utils/db");
const expenseRouter = require("./routes/expense.route.js");
const incomeRouter = require("./routes/income.route.js");
const activityRouter = require("./routes/activity.route.js");
const adminRouter = require("./routes/admin.route.js");

// ✅ Create app FRESH tanpa import dari utils.js
const app = express();

// ✅ CORS Middleware PERTAMA - SEBELUM SEMUA
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ["http://localhost:5173", "http://localhost:4173"];

  console.log("🔍 CORS Middleware:");
  console.log("   Method:", req.method);
  console.log("   Path:", req.path);
  console.log("   Origin:", origin);

  // Remove any existing CORS headers
  res.removeHeader("Access-Control-Allow-Origin");
  res.removeHeader("Access-Control-Allow-Methods");
  res.removeHeader("Access-Control-Allow-Headers");

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    console.log("   ✅ Set origin to:", origin);
  } else {
    console.log("   ❌ Origin not in allowed list");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,Cookie",
  );

  if (req.method === "OPTIONS") {
    console.log("   📋 Preflight - returning 204");
    return res.status(204).end();
  }

  next();
});

// ✅ Body parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ✅ Routes
app.use("/", expenseRouter);
app.use("/", incomeRouter);
app.use("/", activityRouter);
app.use("/", adminRouter);

// ✅ Start server
(async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
  }
})();
