const UserExpenseTracker = require("../models/user");
const { sendMessage } = require("../services/telegram.service");
const { issueLoginCode, CODE_TTL_MS } = require("../utils/loginCode");

const handleStartCommand = async (telegramId, username, res) => {
  try {
    let user = await UserExpenseTracker.findOne({ telegramId });

    if (!user) {
      user = new UserExpenseTracker({
        telegramId,
        username,
      });
      await user.save();
    }

    const { cooldown, code } = await issueLoginCode(telegramId);

    if (cooldown) {
      await sendMessage(
        telegramId,
        "Kode login baru baru saja dikirim. Tunggu sekitar 30 detik lalu kirim /login lagi jika diperlukan."
      );
    } else {
      const minutes = Math.round(CODE_TTL_MS / 60000);
      await sendMessage(
        telegramId,
        `Selamat datang!\n\nID Telegram Anda: ${telegramId}\nKode login: ${code}\n\nMasukkan ID Telegram dan kode ini di halaman login. Kode berlaku ${minutes} menit dan hanya bisa dipakai sekali. Jangan bagikan kode ini kepada siapa pun. Kirim /login untuk meminta kode baru.`
      );
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling /start:", error.message);
    res.status(200).send("OK");
  }
};

module.exports = { handleStartCommand };
