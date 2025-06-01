const { sendMessage } = require("../services/telegram.service");
const sessionCache = require("../utils/session-cache");
const {
  extractAmount,
  cleanDescription,
  capitalizeWords,
} = require("../utils/text-formatter");
const saveCorrectionsToFile = require("../helper/correctionstojson.handler");
const { createExpenseService } = require("../services/expense.service");
const pusher = require("../utils/pusher");
const appendFeedback = require("../utils/googleapi");
const handleBatchCorrection = async (
  telegramId,
  inputText,
  userSession,
  res
) => {
  if (
    inputText.toLowerCase() === "/selesai" ||
    inputText.toLowerCase() === "selesai" ||
    inputText.toLowerCase() === "done"
  ) {
    // Clear the session
    sessionCache.delete(telegramId);
    await sendMessage(telegramId, "✅ Koreksi selesai. Terima kasih!");

    res.status(200).send("OK");
    return;
  }
  console.log("userSession: " + JSON.stringify(userSession, null, 2));

  // Process corrections in batch mode
  const corrections = inputText
    .split(/[\n,]+/) // split by newline *atau* koma
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const successfulCorrections = [];
  const failedCorrections = [];
  const correctionLog = [];

  for (const correction of corrections) {
    const match = correction.match(/^(\d+)[.:]?\s+(.+)$/);

    if (!match) {
      failedCorrections.push({
        input: correction,
        reason: "Format tidak valid. Gunakan format: [nomor]. [kategori]",
      });
      continue;
    }

    const index = parseInt(match[1]);
    const category = match[2].trim();

    // Find the corresponding expense
    const expense = userSession.expenses.find((e) => e.index === index);
    if (!expense) {
      failedCorrections.push({
        input: correction,
        reason: `Tidak ada pengeluaran dengan nomor ${index}`,
      });
      continue;
    }

    // Validate category
    if (
      category.length > 25 ||
      category.includes("http") ||
      /^[0-9]+$/.test(category) ||
      category.split(" ").length > 3
    ) {
      failedCorrections.push({
        input: correction,
        reason: `Kategori "${category}" tidak valid`,
      });
      continue;
    }

    try {
      const amount = extractAmount(expense.activity);
      const description = cleanDescription(expense.activity);
      const formattedCategory =
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      const formattedDescription = capitalizeWords(description);
      const prediction = capitalizeWords(expense.prediction);
      // Use the service function to create expense
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

      successfulCorrections.push({
        index,
        activity: formattedDescription,
        category,
        prediction: prediction,
      });

      correctionLog.push({
        originalActivity: expense.activity,
        correctedCategory: category,
        correctedAt: new Date(),
      });

      // Remove this expense from the session
      userSession.expenses = userSession.expenses.filter(
        (e) => e.index !== index
      );
    } catch (error) {
      console.error("Error saving corrected expense:", error);
      failedCorrections.push({
        input: correction,
        reason: "Kesalahan database",
      });
      await sendMessage(
        telegramId,
        `❌ Gagal menyimpan: "${correction}"\nAlasan: ${error.message}`
      );
    }
  }

  if (correctionLog.length > 0) {
    try {
      saveCorrectionsToFile(correctionLog);
    } catch (error) {
      console.error("Error saving corrections to file:", error);
    }
  }

  // Prepare response message
  let replyText = "";

  if (successfulCorrections.length > 0) {
    replyText += "✅ Berhasil menyimpan:\n";

    for (const item of successfulCorrections) {
      const formattedCategory =
        item.category.charAt(0).toUpperCase() +
        item.category.slice(1).toLowerCase();

      const feedback = {
        user_input: item.activity,
        prediction: item.prediction,
        correct: formattedCategory,
      };

      await appendFeedback(feedback);
      replyText += `- ${item.index}. "${item.activity}" sebagai "${formattedCategory}"\n`;
    }
  }

  if (failedCorrections.length > 0) {
    if (replyText) replyText += "\n";
    replyText += "❌ Gagal menyimpan:\n";
    failedCorrections.forEach((item) => {
      replyText += `- "${item.input}": ${item.reason}\n`;
    });
  }

  // Update the session
  if (userSession.expenses.length === 0) {
    replyText += "\nSemua pengeluaran telah dikoreksi. Terima kasih!";
    sessionCache.delete(telegramId);
  } else {
    replyText += "\nMasih ada pengeluaran yang belum dikoreksi:\n";
    userSession.expenses.forEach((expense) => {
      replyText += `${expense.index}. "${expense.activity}"\n`;
    });
    replyText += "\nGunakan format: [nomor]. [kategori] untuk mengoreksi.";

    // Update the session
    sessionCache.set(telegramId, userSession);
  }
  await sendMessage(telegramId, replyText);
  return res.status(200).send("OK");
};

module.exports = { handleBatchCorrection };
