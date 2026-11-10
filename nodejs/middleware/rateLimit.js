const rateLimit = require("express-rate-limit");

const buildLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message },
  });

const apiLimiter = buildLimiter(15 * 60 * 1000, 600, "Too many requests, please try again later");
const loginLimiter = buildLimiter(15 * 60 * 1000, 10, "Too many login attempts, please try again later");
const refreshLimiter = buildLimiter(15 * 60 * 1000, 60, "Too many requests, please try again later");
const webhookLimiter = buildLimiter(60 * 1000, 600, "Too many requests");

module.exports = { apiLimiter, loginLimiter, refreshLimiter, webhookLimiter };
