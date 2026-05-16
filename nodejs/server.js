require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./utils/db");

// ✅ Import routes
const expenseRouter = require("./routes/expense.route.js");
const incomeRouter = require("./routes/income.route.js");
const activityRouter = require("./routes/activity.route.js");

const app = express();

// ========================================
// ✅ CORS - FIRST MIDDLEWARE
// ========================================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  console.log(`🔍 [${req.method}] ${req.path} from ${origin || "no-origin"}`);

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
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
    console.log("   📋 Preflight handled");
    return res.status(204).end();
  }

  next();
});

// ========================================
// ✅ BODY PARSERS
// ========================================
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// ✅ SECURITY HEADERS
// ========================================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ========================================
// ✅ ROUTES
// ========================================
app.use("/", expenseRouter);
app.use("/", incomeRouter);
app.use("/", activityRouter);

// ========================================
// ✅ ERROR HANDLER
// ========================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ========================================
// ✅ START SERVER
// ========================================
(async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`
========================================
✅ Server Started
========================================
URL: http://localhost:${PORT}
Time: ${new Date().toLocaleString()}
========================================
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
})();
