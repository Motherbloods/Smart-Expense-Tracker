const UserExpenseTracker = require("../models/user");
const { handleErrorResponse } = require("../helper/errorHelper.handler");
const { parseNonNegativeAmount } = require("../utils/validators");

const getUserData = async (req, res) => {
  const requested = typeof req.params.telegramId === "string" ? req.params.telegramId.trim() : "";

  if (!requested) {
    return res.status(400).json({
      success: false,
      message: "telegramId is required",
    });
  }

  if (requested !== req.user.telegramId && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  try {
    const existingUser = await UserExpenseTracker.findOne({ telegramId: requested })
      .select("telegramId username budgetMontly role createdAt")
      .lean();

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User data retrieved successfully",
      data: existingUser,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error retrieving user data", e);
  }
};

const updateMonthlyBudget = async (req, res) => {
  const budget = parseNonNegativeAmount(req.body?.budget);

  if (budget === null) {
    return res.status(400).json({
      success: false,
      message: "budget must be a valid non-negative number",
    });
  }

  try {
    const updatedUser = await UserExpenseTracker.findOneAndUpdate(
      { telegramId: req.user.telegramId },
      { $set: { budgetMontly: budget } },
      { new: true }
    )
      .select("telegramId username budgetMontly role")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: updatedUser,
    });
  } catch (e) {
    return handleErrorResponse(res, "Error updating budget", e);
  }
};

module.exports = { getUserData, updateMonthlyBudget };
