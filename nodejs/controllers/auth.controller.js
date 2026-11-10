const jwt = require("jsonwebtoken");
const UserExpenseTracker = require("../models/user.js");
const { handleErrorResponse } = require("../helper/errorHelper.handler.js");
const { isTelegramId } = require("../utils/validators");
const { verifyLoginCode } = require("../utils/loginCode");

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
});

const signAccessToken = (user) =>
  jwt.sign(
    { telegramId: user.telegramId, tv: user.tokenVersion || 0, typ: "access" },
    process.env.JWT_SECRET,
    { expiresIn: "15m", algorithm: "HS256" }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { telegramId: user.telegramId, tv: user.tokenVersion || 0, typ: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d", algorithm: "HS256" }
  );

const setAccessCookie = (res, token) =>
  res.cookie("accessToken", token, { ...baseCookieOptions(), maxAge: ACCESS_TTL_MS });

const setRefreshCookie = (res, token) =>
  res.cookie("refreshToken", token, { ...baseCookieOptions(), maxAge: REFRESH_TTL_MS });

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", baseCookieOptions());
  res.clearCookie("refreshToken", baseCookieOptions());
};

const loginToDashboard = async (req, res) => {
  const telegramId = typeof req.body?.telegramId === "string" ? req.body.telegramId.trim() : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";

  if (!isTelegramId(telegramId) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: "telegramId and a 6-digit code are required",
    });
  }

  try {
    const validCode = await verifyLoginCode(telegramId, code);
    const user = validCode ? await UserExpenseTracker.findOne({ telegramId }) : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Telegram ID or code",
      });
    }

    setAccessCookie(res, signAccessToken(user));
    setRefreshCookie(res, signRefreshToken(user));

    return res.json({
      success: true,
      user: {
        username: user.username,
        budgetMontly: user.budgetMontly,
        telegramId: user.telegramId,
        role: user.role,
      },
    });
  } catch (e) {
    return handleErrorResponse(res, "Error logging in", e);
  }
};

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
    });

    if (decoded.typ !== "refresh" || typeof decoded.telegramId !== "string") {
      throw new Error("Invalid token type");
    }

    const user = await UserExpenseTracker.findOne({ telegramId: decoded.telegramId })
      .select("telegramId tokenVersion")
      .lean();

    if (!user || (user.tokenVersion || 0) !== (decoded.tv || 0)) {
      throw new Error("Token revoked");
    }

    setAccessCookie(res, signAccessToken(user));
    return res.json({ success: true });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(403).json({ success: false, message: "Invalid refresh token" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        algorithms: ["HS256"],
      });
      if (decoded.typ === "refresh" && typeof decoded.telegramId === "string") {
        await UserExpenseTracker.updateOne(
          { telegramId: decoded.telegramId, tokenVersion: decoded.tv || 0 },
          { $inc: { tokenVersion: 1 } }
        );
      }
    }
  } catch (error) {
    console.warn("Logout without valid refresh token");
  }

  clearAuthCookies(res);
  return res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  loginToDashboard,
  refreshAccessToken,
  logout,
};
