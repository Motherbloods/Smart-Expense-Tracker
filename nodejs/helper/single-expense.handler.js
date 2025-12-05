const axios = require("axios");
const { predictCategory } = require("../services/classifier.service");
const { createExpenseService } = require("../services/expense.service");
const {
  sendMessage,
  sendChatAction,
  sendWaitingMessage,
  editMessage,
} = require("../services/telegram.service");
const pusher = require("../utils/pusher");
const sessionCache = require("../utils/session-cache");
const {
  capitalizeWords,
  extractAmount,
  cleanDescription,
} = require("../utils/text-formatter");
const { performance } = require("perf_hooks");

const handleSingleExpense = async (telegramId, inputText, res) => {
  let waitingMessage = null;

  try {
    const startTime = performance.now();

    // Send chat action (typing indicator)
    await sendChatAction(telegramId, "typing");

    // Send waiting message
    waitingMessage = await sendWaitingMessage(telegramId);

    const webhookUrl =
      "https://n8n-ku.motherbloodss.site/webhook/29f54df7-988e-4e2b-bb13-03835331f9e8";

    const n8nResponse = await axios.post(webhookUrl, {
      inputText,
    });

    console.log("n8nResponse.data:", n8nResponse.data);

    const { teks_asli, teks_parsing, confidence, recognized, category } =
      n8nResponse.data;

    // Extract amount if present in the activity
    const amount = extractAmount(inputText);

    let replyText;
    if (recognized) {
      replyText = `✅ Pengeluaran: "${teks_asli}"\nKategori: ${category}\nKeyakinan: ${(
        confidence * 100
      ).toFixed(2)}%`;

      try {
        // Format category with capitalized first letter
        const formattedCategory =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const formattedDescription = capitalizeWords(teks_asli);

        await createExpenseService(
          {
            name: formattedDescription,
            amount: amount || 0,
            category: formattedCategory,
            date: new Date(),
          },
          telegramId,
          "telegram"
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
      } catch (dbError) {
        console.error("Error saving expense to database:", dbError);
      }
    } else {
      replyText = `❓ Maaf, saya tidak dapat mengenali kategori untuk "${teks_asli}" dengan yakin.\nPrediksi: ${category}\nKeyakinan: ${(
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

    // Edit waiting message with final response
    if (waitingMessage) {
      const edited = await editMessage(
        telegramId,
        waitingMessage.message_id,
        replyText
      );
      if (!edited) {
        // Fallback: send new message if edit fails
        await sendMessage(telegramId, replyText);
      }
    } else {
      await sendMessage(telegramId, replyText);
    }

    const endTime = performance.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(3);
    console.log(
      `Expense classification for Telegram ID ${telegramId} took ${durationSeconds} seconds.`
    );

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error classifying expense:", error);

    // Edit waiting message with error message
    if (waitingMessage) {
      const edited = await editMessage(
        telegramId,
        waitingMessage.message_id,
        "Maaf, terjadi kesalahan saat memproses pengeluaran Anda. Silakan coba lagi nanti."
      );
      if (!edited) {
        await sendMessage(
          telegramId,
          "Maaf, terjadi kesalahan saat memproses pengeluaran Anda. Silakan coba lagi nanti."
        );
      }
    } else {
      await sendMessage(
        telegramId,
        "Maaf, terjadi kesalahan saat memproses pengeluaran Anda. Silakan coba lagi nanti."
      );
    }
    res.status(200).send("OK");
  }
};

module.exports = { handleSingleExpense };
