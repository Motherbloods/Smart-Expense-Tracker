const UserExpenseTracker = require("../models/user.js");
const jwt = require("jsonwebtoken");
const { handleErrorResponse } = require("../helper/errorHelper.handler.js");

const loginToDashboard = async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId || telegramId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "telegramId is required",
    });
  }

  try {
    const existingUser = await UserExpenseTracker.findOne({
      telegramId: telegramId.trim(),
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Access token (short-lived: 15 menit)
    const accessToken = jwt.sign(
      { telegramId: existingUser.telegramId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // ✅ Refresh token (long-lived: 7 hari)
    const refreshToken = jwt.sign(
      { telegramId: existingUser.telegramId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Set HttpOnly cookies (tidak bisa diakses JavaScript)
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // Tidak bisa diakses via JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS only di production
      sameSite: "strict", // CSRF protection
      maxAge: 15 * 60 * 1000, // 15 menit
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    // ✅ Hanya kirim data non-sensitif ke client
    res.json({
      success: true,
      user: {
        username: existingUser.username,
        budgetMontly: existingUser.budgetMontly,
        telegramId: existingUser.telegramId,
        role: existingUser.role,
      },
    });
  } catch (e) {
    console.error("Error logging in:", e.message);
    return handleErrorResponse(res, "Error logging in", e);
  }
};

// ✅ Endpoint untuk refresh token
// Di auth.controller.js - refreshAccessToken
const refreshAccessToken = async (req, res) => {
  console.log("🔄 Refresh token request received");
  console.log("Cookies:", req.cookies);

  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    console.log("❌ No refresh token found");
    return res.status(401).json({
      success: false,
      message: "No refresh token",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log("✅ Refresh token valid for:", decoded.telegramId);

    const newAccessToken = jwt.sign(
      { telegramId: decoded.telegramId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    console.log("✅ New access token issued");
    res.json({ success: true });
  } catch (error) {
    console.log("❌ Invalid refresh token:", error.message);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(403).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

// ✅ Logout endpoint
const logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  loginToDashboard,
  refreshAccessToken,
  logout,
};
