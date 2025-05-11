const UserExpenseTracker = require("../models/user");

const getUserData = async (req, res) => {
  const { telegramId } = req.params;

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

    return res.status(200).json({
      success: true,
      message: "User data retrieved successfully",
      data: existingUser,
    });
  } catch (e) {
    console.error("Error retrieving user data:", e.message);
    return handleErrorResponse(res, "Error retrieving user data", e);
  }
};

const updateMonthlyBudget = async (req, res) => {
  const { telegramId, budget } = req.body;

  if (!telegramId || !budget) {
    return res.status(400).json({
      success: false,
      message: "telegramId and budget are required",
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

    const updatedUser = await UserExpenseTracker.findOneAndUpdate(
      {
        telegramId: telegramId.trim(),
      },
      { budgetMontly: budget },
      { new: true }
    );
    await updatedUser.save();
    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: updatedUser,
    });
  } catch (e) {
    console.error("Error updating budget:", e.message);
    return handleErrorResponse(res, "Error updating budget", e);
  }
};

module.exports = { getUserData, updateMonthlyBudget };
