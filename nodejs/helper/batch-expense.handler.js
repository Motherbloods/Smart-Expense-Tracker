const axios = require("axios");
const { createExpenseService } = require("../services/expense.service");
const {
  sendMessage,
  sendChatAction,
  sendWaitingMessage,
  editMessage,
} = require("../services/telegram.service");
const sessionCache = require("../utils/session-cache");
const {
  capitalizeWords,
  extractAmount,
  cleanDescription,
} = require("../utils/text-formatter");
const pusher = require("../utils/pusher");
const { performance } = require("perf_hooks");

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

  let waitingMessage = null;

  try {
    const startTime = performance.now();

    await sendChatAction(telegramId, "typing");
    waitingMessage = await sendWaitingMessage(telegramId);

    const webhookUrl =
      "https://n8n-ku.motherbloodss.site/webhook/8a9edca1-db89-4274-848d-a1174e8ede84";

    const n8nResponse = await axios.post(webhookUrl, {
      inputText: inputText,
    });

    console.log(`n8n batch response:`, n8nResponse.data);

    let results = n8nResponse.data;

    if (typeof results === "string") {
      try {
        let cleanData = results.trim();
        if (cleanData.startsWith("=")) {
          cleanData = cleanData.substring(1);
        }
        results = JSON.parse(cleanData);
      } catch (parseError) {
        console.error("Error parsing string response:", parseError);
        throw new Error("Invalid response format from n8n");
      }
    }

    if (!Array.isArray(results)) {
      console.error("Results is not an array:", typeof results, results);
      throw new Error("Invalid response format from n8n - not an array");
    }

    if (results.length === 0) {
      console.error("Results array is empty");
      throw new Error("Invalid response format from n8n - empty array");
    }

    console.log("Parsed results:", JSON.stringify(results, null, 2));

    let replyText = "📋 Hasil Klasifikasi Pengeluaran:\n\n";
    const recognizedExpenses = [];
    const lowConfidenceExpenses = [];

    results.forEach((item, index) => {
      const {
        nama_pengeluaran,
        nominal,
        category,
        confidence,
        teks_asli,
        confidence_level,
      } = item;

      if (confidence > 0.8) {
        replyText += `${
          index + 1
        }. "${teks_asli}"\n   Nama: ${teks_asli}\n   Jumlah: Rp ${nominal.toLocaleString(
          "id-ID"
        )}\n   Kategori: ${category}\n   Keyakinan: ${(
          confidence * 100
        ).toFixed(2)}%\n\n`;

        const formattedDescription = capitalizeWords(teks_asli);
        const formattedCategory =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

        // ✅ Tambahkan confidence di sini
        recognizedExpenses.push({
          name: formattedDescription,
          amount: nominal,
          category: formattedCategory,
          date: new Date(),
          confidence: confidence, // ✅ Simpan confidence
        });
      } else {
        replyText += `${
          index + 1
        }. "${teks_asli}"\n   Nama: ${teks_asli}\n   Jumlah: Rp ${nominal.toLocaleString(
          "id-ID"
        )}\n   ⚠️ Keyakinan rendah: ${(confidence * 100).toFixed(
          2
        )}%\n   Prediksi: ${category}\n\n`;

        lowConfidenceExpenses.push({
          index: index + 1,
          activity: teks_asli,
          name: teks_asli,
          amount: nominal,
          prediction: category,
          confidence: confidence, // ✅ Simpan confidence
        });
      }
    });

    if (recognizedExpenses.length > 0) {
      try {
        for (const expenseData of recognizedExpenses) {
          await createExpenseService(expenseData, telegramId, "telegram");

          pusher.trigger("expenses", "new-expense", {
            telegramId,
            expense: expenseData,
          });
        }
      } catch (dbError) {
        console.error("Error saving batch expenses to database:", dbError);
      }
    }

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

    if (waitingMessage) {
      const edited = await editMessage(
        telegramId,
        waitingMessage.message_id,
        replyText
      );
      if (!edited) {
        await sendMessage(telegramId, replyText);
      }
    } else {
      await sendMessage(telegramId, replyText);
    }

    const endTime = performance.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(3);
    console.log(
      `Batch expense classification for Telegram ID ${telegramId} took ${durationSeconds} seconds.`
    );

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error classifying batch expenses:", error);
    console.error("Error stack:", error.stack);

    if (waitingMessage) {
      const edited = await editMessage(
        telegramId,
        waitingMessage.message_id,
        "Maaf, terjadi kesalahan saat memproses pengeluaran batch Anda. Silakan coba lagi nanti."
      );
      if (!edited) {
        await sendMessage(
          telegramId,
          "Maaf, terjadi kesalahan saat memproses pengeluaran batch Anda. Silakan coba lagi nanti."
        );
      }
    } else {
      await sendMessage(
        telegramId,
        "Maaf, terjadi kesalahan saat memproses pengeluaran batch Anda. Silakan coba lagi nanti."
      );
    }

    res.status(200).send("OK");
  }
};

module.exports = { handleBatchExpenses };
