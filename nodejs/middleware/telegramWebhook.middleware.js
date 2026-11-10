const crypto = require("crypto");

const safeEqual = (a, b) => {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
};

const verifyTelegramWebhook = (req, res, next) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return next();
  }

  const provided = req.get("X-Telegram-Bot-Api-Secret-Token");
  if (!provided || !safeEqual(provided, secret)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
};

module.exports = verifyTelegramWebhook;
