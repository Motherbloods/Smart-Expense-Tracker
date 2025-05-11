const UserExpenseTracker = require("../models/user");
const { sendMessage } = require("../services/telegram.service");

const handleStartCommand = async (telegramId, username, res) => {
  try {
    let user = await UserExpenseTracker.findOne({ telegramId });

    if (!user) {
      user = new UserExpenseTracker({
        telegramId,
        username,
      });
      await user.save();
    }

    await sendMessage(
      telegramId,
      `Welcome! Your Telegram ID is ${telegramId}. Copy and paste it in the login form.`
    );

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling /start:", error);
    res.status(200).send("OK");
  }
};

module.exports = { handleStartCommand };
