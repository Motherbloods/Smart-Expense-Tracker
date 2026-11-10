require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const connectDB = require("./utils/db");
const { validateEnv, trustProxyHops } = require("./utils/env");
const { cors, securityHeaders } = require("./middleware/security");
const { apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const expenseRouter = require("./routes/expense.route.js");
const incomeRouter = require("./routes/income.route.js");
const activityRouter = require("./routes/activity.route.js");
const adminRouter = require("./routes/admin.route.js");
const { startPolling } = require("./utils/polling");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", trustProxyHops());

app.use(cors);
app.use(securityHeaders);

app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "degraded" });
});

app.use(apiLimiter);
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

app.use("/", expenseRouter);
app.use("/", incomeRouter);
app.use("/", activityRouter);
app.use("/", adminRouter);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  validateEnv();
  await connectDB();
  const port = process.env.PORT || 3000;
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    if (process.env.TELEGRAM_POLLING === "true") {
      startPolling().catch((error) => {
        console.error("Gagal memulai polling:", error.message);
      });
    }
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason && reason.message ? reason.message : reason);
});

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
}

module.exports = app;
