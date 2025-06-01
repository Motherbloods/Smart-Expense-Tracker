const { createExpenseService } = require("../services/expense.service");
const { sendMessage } = require("../services/telegram.service");
const appendFeedback = require("../utils/googleapi");
const pusher = require("../utils/pusher");
const sessionCache = require("../utils/session-cache");
const {
  extractAmount,
  cleanDescription,
  capitalizeWords,
} = require("../utils/text-formatter");

const handleSingleCorrection = async (
  telegramId,
  inputText,
  userSession,
  res
) => {
  if (
    inputText.length > 25 ||
    inputText.includes("http") ||
    /^[0-9]+$/.test(inputText) || // only numbers
    inputText.split(" ").length > 3
  ) {
    await sendMessage(
      telegramId,
      `⚠️ Input "${inputText}" tidak terlihat seperti kategori yang valid.\n\nMohon masukkan kategori pengeluaran yang sederhana (contoh: "Makanan", "Transportasi", "Hiburan").\n\nAtau ketik "/batal" untuk membatalkan.`
    );
    res.status(200).send("OK");
    return;
  }

  try {
    // Extract amount if present in the activity
    const amount = extractAmount(userSession.activity);
    const description = cleanDescription(userSession.activity);
    const formattedCategory =
      inputText.charAt(0).toUpperCase() + inputText.slice(1).toLowerCase();
    const formattedDescription = capitalizeWords(description);

    await createExpenseService(
      {
        name: formattedDescription,
        amount: amount || 0,
        category: formattedCategory,
        date: new Date(),
      },
      telegramId
    );
    pusher.trigger("expenses", "new-expense", {
      telegramId,
      expense: {
        name: formattedDescription,
        amount,
        category: formattedCategory,
        date: new Date(),
      },
    });

    const feedback = {
      user_input: userSession.activity,
      prediction: userSession.category,
      correct: formattedCategory,
    };

    appendFeedback(feedback);

    await sendMessage(
      telegramId,
      `✅ Terima kasih! Pengeluaran "${userSession.activity}" telah disimpan dengan kategori "${formattedCategory}".`
    );

    sessionCache.delete(telegramId);

    res.status(200).send("OK");
    return;
  } catch (error) {
    console.error("Error saving corrected expense:", error);
  }
};

module.exports = {
  handleSingleCorrection,
};
