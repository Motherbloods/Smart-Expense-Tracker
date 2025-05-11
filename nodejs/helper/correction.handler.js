const { sendMessage } = require("../services/telegram.service");
const sessionCache = require("../utils/session-cache");
const { handleBatchCorrection } = require("./handle-batch-correction");
const { handleSingleCorrection } = require("./handle-single-correction");

const handleCorrection = async (telegramId, inputText, userSession, res) => {
  if (
    inputText.toLowerCase() === "/batal" ||
    inputText.toLowerCase() === "batal" ||
    inputText.toLowerCase() === "cancel"
  ) {
    // Clear the session
    sessionCache.delete(telegramId);

    await sendMessage(
      telegramId,
      "❌ Koreksi dibatalkan. Pengeluaran tidak disimpan."
    );

    res.status(200).send("OK");
    return;
  }

  if (userSession.batchMode) {
    await handleBatchCorrection(telegramId, inputText, userSession, res);
  } else {
    await handleSingleCorrection(telegramId, inputText, userSession, res);
  }
};

module.exports = { handleCorrection };
