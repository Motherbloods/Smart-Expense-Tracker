const { predictCategory } = require("../services/classifier.service");
const { createExpenseService } = require("../services/expense.service");
const { sendMessage } = require("../services/telegram.service");
const sessionCache = require("../utils/session-cache");
const {
  capitalizeWords,
  extractAmount,
  cleanDescription,
} = require("../utils/text-formatter");

const handleSingleExpense = async (telegramId, inputText, res) => {
  try {
    const cleanedActivity = cleanDescription(inputText);

    const { category, confidence, recognized } = await predictCategory(
      cleanedActivity
    );

    // Extract amount if present in the activity
    const amount = extractAmount(inputText);

    let replyText;
    if (recognized) {
      replyText = `✅ Pengeluaran: "${cleanedActivity}"\nKategori: ${category}\nKeyakinan: ${(
        confidence * 100
      ).toFixed(2)}%`;

      try {
        // Format category with capitalized first letter
        const formattedCategory =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const formattedDescription = capitalizeWords(cleanedActivity);

        await createExpenseService(
          {
            name: formattedDescription,
            amount: amount || 0,
            category: formattedCategory,
            date: new Date(),
          },
          telegramId
        );
      } catch (dbError) {
        console.error("Error saving expense to database:", dbError);
      }
    } else {
      replyText = `❓ Maaf, saya tidak dapat mengenali kategori untuk "${cleanedActivity}" dengan yakin.\nPrediksi: ${category}\nKeyakinan: ${(
        confidence * 100
      ).toFixed(
        2
      )}%\n\nMohon balas dengan kategori yang tepat untuk pengeluaran ini.\nAtau ketik "/batal" untuk batalkan.`;

      // Store this prediction in sessionCache for potential correction
      sessionCache.set(telegramId, {
        activity: inputText,
        prediction: category,
        awaitingCorrection: true,
      });
    }
    await sendMessage(telegramId, replyText);
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error classifying expense:", error);
    await sendMessage(
      telegramId,
      "Maaf, terjadi kesalahan saat memproses pengeluaran Anda. Silakan coba lagi nanti."
    );
    res.status(200).send("OK");
  }
};

module.exports = { handleSingleExpense };
