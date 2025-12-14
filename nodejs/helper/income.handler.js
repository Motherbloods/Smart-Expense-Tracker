const { createIncomeService } = require("../services/income.service");
const { sendMessage } = require("../services/telegram.service");
const pusher = require("../utils/pusher");
const { extractAmount, capitalizeWords } = require("../utils/text-formatter");

const handleIncomeCommand = async (telegramId, inputText, res) => {
  try {
    // Remove /pemasukan dari input dan trim
    const cleanInput = inputText.replace("/pemasukan", "").trim();

    if (!cleanInput) {
      await sendMessage(
        telegramId,
        `📋 Format pemasukan:\n/pemasukan [nama],[jumlah],[sumber],[catatan]\n\nContoh:\n/pemasukan Gaji Bulanan,5000000,Perusahaan ABC,Gaji bulan Januari\n\n⚠️ Catatan bersifat opsional`
      );
      res.status(200).send("OK");
      return;
    }

    // Split berdasarkan koma
    const parts = cleanInput.split(",").map((part) => part.trim());

    if (parts.length < 3) {
      await sendMessage(
        telegramId,
        `❌ Format tidak lengkap!\n\nFormat yang benar:\n/pemasukan [nama],[jumlah],[sumber],[catatan]\n\nContoh:\n/pemasukan Gaji Bulanan,5000000,Perusahaan ABC,Gaji bulan Januari\n\n⚠️ Minimal harus ada nama, jumlah, dan sumber`
      );
      res.status(200).send("OK");
      return;
    }

    const name = capitalizeWords(parts[0]);
    const amountText = parts[1];
    const source = capitalizeWords(parts[2]);
    const notes = parts[3] ? capitalizeWords(parts[3]) : "";

    // Validasi nama
    if (!name || name.length < 2) {
      await sendMessage(
        telegramId,
        `❌ Nama pemasukan tidak valid: "${parts[0]}"\n\nNama harus minimal 2 karakter.`
      );
      res.status(200).send("OK");
      return;
    }

    // Extract dan validasi amount
    const amount = extractAmount(amountText);
    if (!amount || amount <= 0) {
      await sendMessage(
        telegramId,
        `❌ Jumlah tidak valid: "${amountText}"\n\nMasukkan jumlah yang valid (contoh: 5000000, 5jt, 5000k)`
      );
      res.status(200).send("OK");
      return;
    }

    // Validasi sumber
    if (!source || source.length < 2) {
      await sendMessage(
        telegramId,
        `❌ Sumber pemasukan tidak valid: "${parts[2]}"\n\nSumber harus minimal 2 karakter.`
      );
      res.status(200).send("OK");
      return;
    }

    // Validasi panjang catatan jika ada
    if (notes && notes.length > 200) {
      await sendMessage(
        telegramId,
        `❌ Catatan terlalu panjang (${notes.length} karakter).\n\nMaksimal 200 karakter.`
      );
      res.status(200).send("OK");
      return;
    }

    // Buat data pemasukan
    const incomeData = {
      name,
      amount,
      source,
      notes,
      date: new Date(), // Otomatis set tanggal sekarang
    };

    // Simpan pemasukan
    const savedIncome = await createIncomeService(
      incomeData,
      telegramId,
      "telegram"
    );

    if (!savedIncome) {
      await sendMessage(
        telegramId,
        `❌ Gagal menyimpan pemasukan "${name}". Silakan coba lagi nanti.`
      );
      res.status(200).send("OK");
      return;
    }

    // Trigger pusher notification
    try {
      pusher.trigger("income", "new-income", {
        telegramId,
        income: {
          name,
          amount,
          source,
          notes,
          remainingAmount: amount,
          date: new Date(),
        },
      });
    } catch (pusherError) {
      console.error("Pusher notification failed:", pusherError);
    }

    // Format response message
    const formatAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    let successMessage = `✅ Pemasukan berhasil disimpan!\n\n`;
    successMessage += `📝 Nama: ${name}\n`;
    successMessage += `💰 Jumlah: ${formatAmount}\n`;
    successMessage += `🏢 Sumber: ${source}\n`;
    if (notes) {
      successMessage += `📋 Catatan: ${notes}\n`;
    }
    successMessage += `📅 Tanggal: ${new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`;

    await sendMessage(telegramId, successMessage);

    res.status(200).send("OK");
  } catch (error) {
    console.error("Critical error in handleIncomeCommand:", error);

    try {
      await sendMessage(
        telegramId,
        `❌ Terjadi kesalahan sistem saat menyimpan pemasukan. Silakan coba lagi.`
      );
    } catch (msgError) {
      console.error("Failed to send error message:", msgError);
    }

    res.status(200).send("OK");
  }
};

module.exports = {
  handleIncomeCommand,
};
