const { handleStartCommand } = require("../helper/user.handler.js");
const { handleBatchExpenses } = require("../helper/batch-expense.handler.js");
const sessionCache = require("../utils/session-cache.js");
const { handleCorrection } = require("../helper/correction.handler.js");
const { handleSingleExpense } = require("../helper/single-expense.handler.js");
const { handleIncomeCommand } = require("../helper/income.handler.js");
const { handleHelpCommand } = require("../helper/help.handler.js");

const getTelegramIdHook = async (req, res) => {
  const message = req.body?.message;

  if (!message || !message.from || typeof message.text !== "string") {
    return res.status(200).send("OK");
  }

  const telegramId = String(message.from.id);
  const inputText = message.text.trim();

  if (!inputText) {
    return res.status(200).send("OK");
  }

  if (inputText === "/start login" || inputText === "/start" || inputText === "/login") {
    await handleStartCommand(telegramId, message.from.username, res);
    return;
  }

  if (inputText === "/help") {
    await handleHelpCommand(telegramId, res);
    return;
  }

  if (inputText.startsWith("/pemasukan")) {
    await handleIncomeCommand(telegramId, inputText, res);
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

  await handleSingleExpense(telegramId, inputText, res);
};

module.exports = { getTelegramIdHook };
