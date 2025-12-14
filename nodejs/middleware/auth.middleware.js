const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Ambil token dari cookie (bukan dari header)
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user info ke request
    req.user = {
      telegramId: decoded.telegramId,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;
