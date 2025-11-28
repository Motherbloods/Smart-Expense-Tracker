const { sendMessage } = require("../services/telegram.service");
const handleHelpCommand = async (telegramId, res) => {
  const helpMessage = `
📖 *Panduan Penggunaan Expense Tracker Bot*

*PERINTAH UTAMA:*
- /start - Memulai bot dan registrasi akun
- /help - Menampilkan panduan ini
- /pemasukan - Mencatat pemasukan

*CARA MENCATAT PENGELUARAN:*

1️⃣ *Pengeluaran Tunggal:*
Format: \`Nama pengeluaran Rp jumlah\`
Contoh: \`Makan siang Rp 25000\`

2️⃣ *Pengeluaran Batch (Multiple):*
Format: Pisahkan dengan koma atau baris baru
Contoh:
\`\`\`
Bensin Rp 50000,
Parkir Rp 5000,
Makan Rp 30000
\`\`\`

*CARA MENCATAT PEMASUKAN:*
Format: \`/pemasukan [jumlah] [sumber] [catatan]\`
Contoh: \`/pemasukan 5000000 Gaji Bonus bulan ini\`

*TIPS:*
✓ Gunakan format Rp untuk nominal
✓ Sistem akan otomatis mengkategorikan pengeluaran
✓ Anda dapat mengoreksi kategori jika tidak sesuai
✓ Akses dashboard web untuk laporan lengkap

Butuh bantuan lebih lanjut? Hubungi admin.
  `;

  await sendMessage(telegramId, helpMessage);
  res.status(200).send({ status: "Help message sent" });
};

module.exports = { handleHelpCommand };
