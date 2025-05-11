const UserExpenseTracker = require("../models/user.js");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { handleErrorResponse } = require("../helper/errorHelper.handler.js");

const loginToDashboard = async (req, res) => {
  const { telegramId } = req.body;
  console.log("telegramId:", telegramId);

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
    console.log("existingUser:", existingUser);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const jwtToken = jwt.sign(
      { telegramId: existingUser.telegramId },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ token: jwtToken });
  } catch (e) {
    console.error("Error logging in:", e.message);
    return handleErrorResponse(res, "Error logging in", e);
  }
};

module.exports = { loginToDashboard };
