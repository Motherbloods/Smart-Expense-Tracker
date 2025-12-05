const { createExpenseService } = require("../services/expense.service");
const { sendMessage } = require("../services/telegram.service");
// const appendFeedback = require("../utils/googleapi");
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
  try {
  } catch (error) {
    console.error("Critical error in handleSingleCorrection:", error);

    try {
      await sendMessage(
        telegramId,
        `❌ Terjadi kesalahan sistem saat menyimpan "${
          userSession?.activity || "pengeluaran"
        }". Silakan coba lagi.`
      );
    } catch (msgError) {
      console.error("Failed to send error message:", msgError);
    }

    sessionCache.delete(telegramId);
    res.status(200).send("OK");
  }
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
    const prediction = capitalizeWords(userSession.prediction);

    const savedExpense = await createExpenseService(
      {
        name: formattedDescription,
        amount: amount || 0,
        category: formattedCategory,
        date: new Date(),
      },
      telegramId,
      "telegram"
    );

    if (!savedExpense) {
      await sendMessage(
        telegramId,
        `❌ Gagal menyimpan pengeluaran "${userSession.activity}". Silakan coba lagi nanti.`
      );
      sessionCache.delete(telegramId);
      res.status(200).send("OK");
      return;
    }
    try {
      pusher.trigger("expenses", "new-expense", {
        telegramId,
        expense: {
          name: formattedDescription,
          amount,
          category: formattedCategory,
          date: new Date(),
        },
      });
    } catch (pusherError) {
      console.error("Pusher notification failed:", pusherError);
    }
    try {
      const feedback = {
        user_input: formattedDescription,
        prediction,
        correct: formattedCategory,
      };
      // await appendFeedback(feedback);
    } catch (feedbackError) {
      console.error("Failed to append feedback:", feedbackError);
    }

    await sendMessage(
      telegramId,
      `✅ Terima kasih! Pengeluaran "${userSession.activity}" telah disimpan dengan kategori "${formattedCategory}".`
    );

    sessionCache.delete(telegramId);

    res.status(200).send("OK");
    return;
  } catch (error) {
    console.error("Error saving corrected expense:", error);
    await sendMessage(
      telegramId,
      `❌ Gagal menyimpan: "${userSession.activity}"\nAlasan: ${error.message}`
    );
  }
};

module.exports = {
  handleSingleCorrection,
};
