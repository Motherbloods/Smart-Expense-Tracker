const { handleStartCommand } = require("../helper/user.handler.js");
const { handleBatchExpenses } = require("../helper/batch-expense.handler.js");
const sessionCache = require("../utils/session-cache.js");
const { handleCorrection } = require("../helper/correction.handler.js");
const { handleSingleExpense } = require("../helper/single-expense.handler.js");
const pusher = require("../utils/pusher");

const getTelegramIdHook = async (req, res) => {
  const { message } = req.body;
  const telegramId = String(message?.from?.id);
  const inputText = message?.text?.trim();

  if (
    (message && message.text === "/start login") ||
    message.text === "/start"
  ) {
    await handleStartCommand(telegramId, message.from.username, res);
    return;
  }
  const userSession = sessionCache.get(telegramId);
  if (userSession && userSession.awaitingCorrection) {
    await handleCorrection(telegramId, inputText, userSession, res);
    return;
  }

  if (inputText.includes(",") || inputText.includes("\n")) {
    await handleBatchExpenses(telegramId, inputText, res);
    return;
  }

  // Handle single expense
  await handleSingleExpense(telegramId, inputText, res);
};

module.exports = { getTelegramIdHook };
