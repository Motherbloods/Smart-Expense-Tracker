const UserExpenseTracker = require("../models/user");
const TELEGRAM_API = `${process.env.TELEGRAM_API}${process.env.TOKEN}`;
const axios = require("axios");
const saveCorrectionsToFile = require("../utils/correctionstojson");

const sessionCache = new Map();
const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000";

const getTelegramIdHook = async (req, res) => {
  const { message } = req.body;

  if (
    (message && message.text === "/start login") ||
    message.text === "/start"
  ) {
    const telegramId = message.from.id;
    const username = message.from.username;

    try {
      let user = await UserExpenseTracker.findOne({ telegramId });

      if (!user) {
        user = new UserExpenseTracker({
          telegramId,
          username,
        });
        await user.save();
      }

      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: telegramId,
        text: `Welcome! Your Telegram ID is ${telegramId}. Copy and paste it in the login form.`,
      });
    } catch (error) {
      console.error("Error handling /start:", error);
    }
  } else {
    const telegramId = message.from.id;
    const inputText = message.text.trim();

    // Check if this is a category correction from user
    const userSession = sessionCache.get(telegramId);
    if (userSession && userSession.awaitingCorrection) {
      // Special commands to cancel or finish the correction
      if (
        inputText.toLowerCase() === "/batal" ||
        inputText.toLowerCase() === "batal" ||
        inputText.toLowerCase() === "cancel"
      ) {
        // Clear the session
        sessionCache.delete(telegramId);

        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: telegramId,
          text: `❌ Koreksi dibatalkan. Pengeluaran tidak disimpan.`,
        });

        res.status(200).send("OK");
        return;
      }

      if (userSession.batchMode) {
        // Handle batch mode corrections
        if (
          inputText.toLowerCase() === "/selesai" ||
          inputText.toLowerCase() === "selesai" ||
          inputText.toLowerCase() === "done"
        ) {
          // Clear the session
          sessionCache.delete(telegramId);

          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramId,
            text: `✅ Koreksi selesai. Terima kasih!`,
          });

          res.status(200).send("OK");
          return;
        }

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
            // Save the expense with the corrected category
            await UserExpenseTracker.findOneAndUpdate(
              { telegramId },
              {
                $push: {
                  expenses: {
                    description: expense.activity,
                    category: category,
                  },
                },
              }
            );
            console.log(successfulCorrections);
            successfulCorrections.push({
              index,
              activity: expense.activity,
              category,
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
          }
        }

        if (correctionLog.length > 0) {
          try {
            saveCorrectionsToFile(correctionLog); // Panggil fungsi untuk menyimpan ke file
          } catch (error) {
            console.error("Error saving corrections to file:", error);
          }
        }

        // Prepare response message
        let replyText = "";

        if (successfulCorrections.length > 0) {
          replyText += "✅ Berhasil menyimpan:\n";
          successfulCorrections.forEach((item) => {
            replyText += `- ${item.index}. "${item.activity}" sebagai "${item.category}"\n`;
          });
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
          replyText +=
            "\nGunakan format: [nomor]. [kategori] untuk mengoreksi.";

          // Update the session
          sessionCache.set(telegramId, userSession);
        }
        console.log(replyText);

        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: telegramId,
          text: replyText,
        });

        return res.status(200).send("OK");
      } else {
        // Handle single item correction (existing code)
        // Check if input looks like a valid category (simple validation)
        if (
          inputText.length > 25 ||
          inputText.includes("http") ||
          /^[0-9]+$/.test(inputText) || // only numbers
          inputText.split(" ").length > 3
        ) {
          // too many words

          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramId,
            text: `⚠️ Input "${inputText}" tidak terlihat seperti kategori yang valid.\n\nMohon masukkan kategori pengeluaran yang sederhana (contoh: "Makanan", "Transportasi", "Hiburan").\n\nAtau ketik "/batal" untuk membatalkan.`,
          });

          res.status(200).send("OK");
          return;
        }

        try {
          // Save the expense with the corrected category
          await UserExpenseTracker.findOneAndUpdate(
            { telegramId },
            {
              $push: {
                expenses: {
                  description: userSession.activity,
                  category: inputText, // Use the user-provided category
                },
              },
            }
          );

          // Confirm to the user
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramId,
            text: `✅ Terima kasih! Pengeluaran "${userSession.activity}" telah disimpan dengan kategori "${inputText}".`,
          });

          // Clear the session
          sessionCache.delete(telegramId);

          res.status(200).send("OK");
          return;
        } catch (error) {
          console.error("Error saving corrected expense:", error);
        }
      }
    }

    const hasCommas = inputText.includes(",");
    const hasNewlines = inputText.includes("\n");
    if (hasCommas || hasNewlines) {
      // Handle multiple expenses with batch prediction
      let activities = hasCommas
        ? inputText
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : inputText
            .split("\n")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
      activities = activities.map((item) => {
        return item
          .replace(
            /(\s*Rp\.?\s*\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\s*\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/gi,
            ""
          )
          .trim();
      });

      if (activities.length > 1) {
        try {
          const response = await axios.post(`${FLASK_API_URL}/batch-predict`, {
            activities: activities,
          });

          const { predictions } = response.data;

          // Generate reply for batch predictions
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

              // Store recognized expenses for database
              recognizedExpenses.push({
                description: activity,
                category: category,
              });
            } else {
              replyText += `${
                index + 1
              }. "${activity}"\n   ⚠️ Keyakinan rendah: ${(
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
              await UserExpenseTracker.findOneAndUpdate(
                { telegramId },
                { $push: { expenses: { $each: recognizedExpenses } } }
              );
            } catch (dbError) {
              console.error(
                "Error saving batch expenses to database:",
                dbError
              );
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

          // Send the batch reply back to the user
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramId,
            text: replyText,
          });

          res.status(200).send("OK");
          return;
        } catch (error) {
          console.error("Error classifying batch expenses:", error);

          // Send error message to user
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramId,
            text: "Maaf, terjadi kesalahan saat memproses pengeluaran batch Anda. Silakan coba lagi nanti.",
          });

          res.status(200).send("OK");
          return;
        }
      }
    }
    const cleanedActivity = inputText
      .replace(/(\s+Rp\.?\s*\d+[.,]?\d*|\s+\d+[.,]?\d*\s*[Kk]?)/g, "")
      .trim();

    try {
      const response = await axios.post(`${FLASK_API_URL}/predict`, {
        activity: cleanedActivity,
      });

      const { category, confidence, recognized } = response.data;

      let replyText;
      if (recognized) {
        replyText = `✅ Pengeluaran: "${cleanedActivity}"\nKategori: ${category}\nKeyakinan: ${(
          confidence * 100
        ).toFixed(2)}%`;

        try {
          await UserExpenseTracker.findOneAndUpdate(
            { telegramId },
            { $push: { expenses: { description: cleanedActivity, category } } }
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
          activity: cleanedActivity,
          prediction: category,
          awaitingCorrection: true,
        });
      }

      // Send the reply back to the user
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: telegramId,
        text: replyText,
      });
    } catch (error) {
      console.error("Error classifying expense:", error);

      // Send error message to user
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: telegramId,
        text: "Maaf, terjadi kesalahan saat memproses pengeluaran Anda. Silakan coba lagi nanti.",
      });
    }
  }

  // Send response to Telegram
  res.status(200).send("OK");
};

module.exports = { getTelegramIdHook };
