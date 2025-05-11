const { createExpenseService } = require("../services/expense.service");
const { sendMessage } = require("../services/telegram.service");
const sessionCache = require("../utils/session-cache");
const {
  capitalizeWords,
  extractAmount,
  cleanDescription,
} = require("../utils/text-formatter");
const { predictBatchCategories } = require("../services/classifier.service");

const handleBatchExpenses = async (telegramId, inputText, res) => {
  const hasCommas = inputText.includes(",");

  let activities = hasCommas
    ? inputText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : inputText
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

  if (activities.length <= 1) {
    res.status(200).send("OK");
    return;
  }

  try {
    const { predictions } = await predictBatchCategories(activities);

    let replyText = "📋 Hasil Klasifikasi Pengeluaran:\n\n";
    const recognizedExpenses = [];
    const lowConfidenceExpenses = [];

    predictions.forEach((pred, index) => {
      const { activity, category, confidence } = pred;

      if (confidence > 0.5) {
        replyText += `${
          index + 1
        }. "${activity}"\n   Kategori: ${category}\n   Keyakinan: ${(
          confidence * 100
        ).toFixed(2)}%\n\n`;

        const amount = extractAmount(activity);

        const cleanedDescription = cleanDescription(activity);
        const formattedDescription = capitalizeWords(cleanedDescription);
        const formattedCategory =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

        // Store recognized expenses for database
        recognizedExpenses.push({
          name: formattedDescription,
          amount: amount || 0,
          category: formattedCategory,
          date: new Date(),
        });
      } else {
        replyText += `${index + 1}. "${activity}"\n   ⚠️ Keyakinan rendah: ${(
          confidence * 100
        ).toFixed(2)}%\n   Prediksi: ${category}\n\n`;
        lowConfidenceExpenses.push({
          index: index + 1,
          activity,
          prediction: category,
        });
      }
    });

    // Save recognized expenses to the database
    if (recognizedExpenses.length > 0) {
      try {
        for (const expenseData of recognizedExpenses) {
          await createExpenseService(expenseData, telegramId);
        }
      } catch (dbError) {
        console.error("Error saving batch expenses to database:", dbError);
      }
    }

    // Store low confidence expenses in session for correction
    if (lowConfidenceExpenses.length > 0) {
      sessionCache.set(telegramId, {
        batchMode: true,
        expenses: lowConfidenceExpenses,
        awaitingCorrection: true,
      });

      replyText +=
        "\n⚠️ Beberapa pengeluaran memiliki keyakinan rendah. Untuk mengoreksi, balas dengan format:\n";
      lowConfidenceExpenses.forEach((expense) => {
        replyText += `${expense.index}. [kategori]\n`;
      });
      replyText += '\nContoh: "1. Makanan" atau "2. Transportasi"\n';
      replyText +=
        "Anda dapat mengoreksi satu per satu atau semua sekaligus dengan baris terpisah.\n";
      replyText +=
        'Ketik "/selesai" untuk mengakhiri koreksi atau "/batal" untuk membatalkan semua pengeluaran dengan keyakinan rendah.';
    }

    await sendMessage(telegramId, replyText);
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error classifying batch expenses:", error);
    await sendMessage(
      telegramId,
      "Maaf, terjadi kesalahan saat memproses pengeluaran batch Anda. Silakan coba lagi nanti."
    );

    res.status(200).send("OK");
  }
};

module.exports = { handleBatchExpenses };
