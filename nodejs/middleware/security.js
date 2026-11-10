const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://smart_expense_tracker.motherbloodss.site",
];

const getAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : defaultOrigins)
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

const cors = (req, res, next) => {
  const origin = req.headers.origin ? req.headers.origin.replace(/\/$/, "") : "";

  res.vary("Origin");

  if (origin && getAllowedOrigins().includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cache-Control", "no-store");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
  next();
};

module.exports = { cors, securityHeaders, getAllowedOrigins };
