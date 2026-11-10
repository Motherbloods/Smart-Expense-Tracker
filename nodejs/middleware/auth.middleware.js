const jwt = require("jsonwebtoken");
const User = require("../models/user");

const reject = (res, status, message, code) =>
  res.status(status).json({ success: false, message, code });

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return reject(res, 401, "Authentication required", "NO_TOKEN");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return reject(res, 401, "Token expired", "TOKEN_EXPIRED");
    }
    return reject(res, 401, "Invalid token", "INVALID_TOKEN");
  }

  if (decoded.typ !== "access" || typeof decoded.telegramId !== "string") {
    return reject(res, 401, "Invalid token", "INVALID_TOKEN");
  }

  try {
    const user = await User.findOne({ telegramId: decoded.telegramId })
      .select("telegramId role tokenVersion")
      .lean();

    if (!user || (user.tokenVersion || 0) !== (decoded.tv || 0)) {
      return reject(res, 401, "Invalid token", "INVALID_TOKEN");
    }

    req.user = { telegramId: user.telegramId, role: user.role || "user" };
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authMiddleware;
