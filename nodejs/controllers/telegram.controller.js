const UserExpenseTracker = require("../models/user");
const {
  createExpenseService,
  getExpensesService,
} = require("../services/expense.service");
const TELEGRAM_API = `${process.env.TELEGRAM_API}${process.env.TOKEN}`;
const axios = require("axios");
const capitalizeWords = require("../utils/capitalizeWords.js");
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

    const userSession = sessionCache.get(telegramId);
    // Handle Corrections Single and Batch Expenses
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
            // Extract amount if present in the activity
            const amountMatch = expense.activity.match(
              /(\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/i
            );

            let amount = 0;
            console.log("amountMatch", amountMatch);
            if (amountMatch) {
              // Mengambil bagian angka dari match
              let amountStr = amountMatch[0]
                .replace(/\./g, "")
                .replace(/,/g, ".");
              console.log("amountStr", amountStr);

              // Menangani k/ribu (ribu atau ribu diidentifikasi sebagai ribu di Indonesia)
              if (/k|K|ribu/i.test(inputText)) {
                const numPart = amountStr.replace(/k|K|ribu/gi, "").trim();
                amount = parseFloat(numPart) * 1000;
              }
              // Menangani jt/juta
              else if (/jt|juta/i.test(inputText)) {
                const numPart = amountStr.replace(/jt|juta/gi, "").trim();
                amount = parseFloat(numPart) * 1000000;
              }
              // Menangani m (miliar)
              else if (/m|M/i.test(inputText)) {
                const numPart = amountStr.replace(/m|M/gi, "").trim();
                amount = parseFloat(numPart) * 1000000;
              }
              // Angka biasa (tidak ada singkatan)
              else {
                amount = parseFloat(amountStr);
              }
            }
            // Clean description
            const description = expense.activity
              .replace(
                /(\s*Rp\.?\s*\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\s*\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/gi,
                ""
              )
              .trim();

            // Format category with capitalized first letter
            const formattedCategory =
              category.charAt(0).toUpperCase() +
              category.slice(1).toLowerCase();

            const formattedDescription = capitalizeWords(description);

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
            // Format the category for display
            const formattedCategory =
              item.category.charAt(0).toUpperCase() +
              item.category.slice(1).toLowerCase();
            replyText += `- ${item.index}. "${item.activity}" sebagai "${formattedCategory}"\n`;
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
        // Handle single item correction
        if (
          inputText.length > 25 ||
          inputText.includes("http") ||
          /^[0-9]+$/.test(inputText) || // only numbers
          inputText.split(" ").length > 3
        ) {
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramId,
            text: `⚠️ Input "${inputText}" tidak terlihat seperti kategori yang valid.\n\nMohon masukkan kategori pengeluaran yang sederhana (contoh: "Makanan", "Transportasi", "Hiburan").\n\nAtau ketik "/batal" untuk membatalkan.`,
          });

          res.status(200).send("OK");
          return;
        }

        try {
          // Extract amount if present in the activity
          const amountMatch = userSession.activity.match(
            /(\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/i
          );

          let amount = 0;
          console.log("amountMatch", amountMatch);
          if (amountMatch) {
            // Mengambil bagian angka dari match
            let amountStr = amountMatch[0]
              .replace(/\./g, "")
              .replace(/,/g, ".");
            console.log("amountStr", amountStr);

            // Menangani k/ribu (ribu atau ribu diidentifikasi sebagai ribu di Indonesia)
            if (/k|K|ribu/i.test(inputText)) {
              const numPart = amountStr.replace(/k|K|ribu/gi, "").trim();
              amount = parseFloat(numPart) * 1000;
            }
            // Menangani jt/juta
            else if (/jt|juta/i.test(inputText)) {
              const numPart = amountStr.replace(/jt|juta/gi, "").trim();
              amount = parseFloat(numPart) * 1000000;
            }
            // Menangani m (miliar)
            else if (/m|M/i.test(inputText)) {
              const numPart = amountStr.replace(/m|M/gi, "").trim();
              amount = parseFloat(numPart) * 1000000;
            }
            // Angka biasa (tidak ada singkatan)
            else {
              amount = parseFloat(amountStr);
            }
          }

          // Clean description
          const description = userSession.activity
            .replace(
              /(\s*Rp\.?\s*\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\s*\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/gi,
              ""
            )
            .trim();

          // Format category with capitalized first letter
          const formattedCategory =
            inputText.charAt(0).toUpperCase() +
            inputText.slice(1).toLowerCase();

          const formattedDescription = capitalizeWords(description);

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

          // Confirm to the user
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramId,
            text: `✅ Terima kasih! Pengeluaran "${userSession.activity}" telah disimpan dengan kategori "${formattedCategory}".`,
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
    // Handle Batch Expense
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

              // Extract amount if present in the activity
              const amountMatch = activity.match(
                /(\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/i
              );

              let amount = 0;
              console.log("amountMatch", amountMatch);
              if (amountMatch) {
                // Mengambil bagian angka dari match
                let amountStr = amountMatch[0]
                  .replace(/\./g, "")
                  .replace(/,/g, ".");
                console.log("amountStr", amountStr);

                // Menangani k/ribu (ribu atau ribu diidentifikasi sebagai ribu di Indonesia)
                if (/k|K|ribu/i.test(inputText)) {
                  const numPart = amountStr.replace(/k|K|ribu/gi, "").trim();
                  amount = parseFloat(numPart) * 1000;
                }
                // Menangani jt/juta
                else if (/jt|juta/i.test(inputText)) {
                  const numPart = amountStr.replace(/jt|juta/gi, "").trim();
                  amount = parseFloat(numPart) * 1000000;
                }
                // Menangani m (miliar)
                else if (/m|M/i.test(inputText)) {
                  const numPart = amountStr.replace(/m|M/gi, "").trim();
                  amount = parseFloat(numPart) * 1000000;
                }
                // Angka biasa (tidak ada singkatan)
                else {
                  amount = parseFloat(amountStr);
                }
              }

              // Clean description
              const description = activity
                .replace(
                  /(\s*Rp\.?\s*\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\s*\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/gi,
                  ""
                )
                .trim();

              // Format category with capitalized first letter
              const formattedCategory =
                category.charAt(0).toUpperCase() +
                category.slice(1).toLowerCase();

              const formattedDescription = capitalizeWords(description);

              // Store recognized expenses for database
              recognizedExpenses.push({
                name: formattedDescription,
                amount: amount || 0,
                category: formattedCategory,
                date: new Date(),
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
              for (const expenseData of recognizedExpenses) {
                await createExpenseService(expenseData, telegramId);
              }
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

    // Handle single expense
    try {
      const cleanedActivity = inputText
        .replace(
          /(\s*Rp\.?\s*\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\s*\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/gi,
          ""
        )
        .trim();

      const response = await axios.post(`${FLASK_API_URL}/predict`, {
        activity: cleanedActivity,
      });

      const { category, confidence, recognized } = response.data;

      // Extract amount if present in the activity
      const amountMatch = inputText.match(
        /(\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/i
      );

      let amount = 0;
      console.log("amountMatch", amountMatch);
      if (amountMatch) {
        // Mengambil bagian angka dari match
        let amountStr = amountMatch[0].replace(/\./g, "").replace(/,/g, ".");
        console.log("amountStr", amountStr);

        // Menangani k/ribu (ribu atau ribu diidentifikasi sebagai ribu di Indonesia)
        if (/k|K|ribu/i.test(inputText)) {
          const numPart = amountStr.replace(/k|K|ribu/gi, "").trim();
          amount = parseFloat(numPart) * 1000;
        }
        // Menangani jt/juta
        else if (/jt|juta/i.test(inputText)) {
          const numPart = amountStr.replace(/jt|juta/gi, "").trim();
          amount = parseFloat(numPart) * 1000000;
        }
        // Menangani m (miliar)
        else if (/m|M/i.test(inputText)) {
          const numPart = amountStr.replace(/m|M/gi, "").trim();
          amount = parseFloat(numPart) * 1000000;
        }
        // Angka biasa (tidak ada singkatan)
        else {
          amount = parseFloat(amountStr);
        }
      }

      console.log("Amount final:", amount);

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
