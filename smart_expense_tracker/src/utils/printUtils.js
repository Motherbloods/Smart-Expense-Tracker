export const openPrintWindow = (reportData) => {
  const {
    selectedMonth,
    selectedYear,
    totalUsers,
    allIncomes,
    allExpenses,
    netIncome,
    incomes,
    expenses,
    topCategories,
    topUsers,
    monthNames,
  } = reportData;

  // Generate HTML untuk Top Categories
  const topCategoriesHTML =
    topCategories.length > 0
      ? topCategories
          .map(([category, data], index) => {
            const percentage = Math.round((data.total / allExpenses) * 100);
            return `
                <tr>
                    <td class="border border-gray-300 px-4 py-2">${
                      index + 1
                    }</td>
                    <td class="border border-gray-300 px-4 py-2 font-medium">${category}</td>
                    <td class="border border-gray-300 px-4 py-2 text-right font-semibold">
                        Rp ${data.total.toLocaleString("id-ID")}
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center">${
                      data.count
                    }</td>
                    <td class="border border-gray-300 px-4 py-2 text-center">${percentage}%</td>
                </tr>
            `;
          })
          .join("")
      : '<tr><td colspan="5" class="text-center py-4 text-gray-500">Belum ada data pengeluaran</td></tr>';

  // Generate HTML untuk Top Users
  const topUsersHTML =
    topUsers.length > 0
      ? topUsers
          .map(
            (user, index) => `
            <tr>
                <td class="border border-gray-300 px-4 py-2">${index + 1}</td>
                <td class="border border-gray-300 px-4 py-2 font-medium">
                    ${user.name || user.username}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-right text-green-600 font-semibold">
                    Rp ${user.totalIncome.toLocaleString("id-ID")}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-right text-red-600 font-semibold">
                    Rp ${user.totalExpense.toLocaleString("id-ID")}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-right font-bold">
                    Rp ${user.netIncome.toLocaleString("id-ID")}
                </td>
            </tr>
        `
          )
          .join("")
      : '<tr><td colspan="5" class="text-center py-4 text-gray-500">Belum ada data pengguna</td></tr>';

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // HTML Template lengkap
  const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Laporan Keuangan - ${
              monthNames[selectedMonth]
            } ${selectedYear}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .page-break-inside-avoid {
                        page-break-inside: avoid;
                    }
                    @page {
                        margin: 1.5cm;
                        size: A4;
                    }
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }
            </style>
        </head>
        <body class="min-h-screen bg-white p-8">
            <!-- Print Button -->
            <div class="no-print mb-6 flex justify-end gap-4">
                <button
                    onclick="window.close()"
                    class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                >
                    Tutup
                </button>
                <button
                    onclick="window.print()"
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                    Print / Save as PDF
                </button>
            </div>

            <!-- Header Laporan -->
            <div class="text-center mb-8 pb-6 border-b-2 border-gray-300">
                <h1 class="text-4xl font-bold text-gray-800 mb-2">Laporan Keuangan Admin</h1>
                <p class="text-xl text-gray-600">
                    Periode: ${monthNames[selectedMonth]} ${selectedYear}
                </p>
                <p class="text-sm text-gray-500 mt-2">
                    Dicetak pada: ${currentDate}
                </p>
            </div>

            <!-- Ringkasan Statistik -->
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Ringkasan Statistik</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="border border-gray-300 rounded-lg p-4">
                        <h3 class="text-sm font-semibold text-gray-600 mb-2">Total User</h3>
                        <p class="text-3xl font-bold text-blue-600">${totalUsers}</p>
                        <p class="text-xs text-gray-500">Pengguna aktif</p>
                    </div>

                    <div class="border border-gray-300 rounded-lg p-4">
                        <h3 class="text-sm font-semibold text-gray-600 mb-2">Total Pemasukan</h3>
                        <p class="text-3xl font-bold text-green-600">
                            Rp ${allIncomes.toLocaleString("id-ID")}
                        </p>
                        <p class="text-xs text-gray-500">${
                          incomes.length
                        } transaksi</p>
                    </div>

                    <div class="border border-gray-300 rounded-lg p-4">
                        <h3 class="text-sm font-semibold text-gray-600 mb-2">Total Pengeluaran</h3>
                        <p class="text-3xl font-bold text-red-600">
                            Rp ${allExpenses.toLocaleString("id-ID")}
                        </p>
                        <p class="text-xs text-gray-500">${
                          expenses.length
                        } transaksi</p>
                    </div>

                    <div class="border border-gray-300 rounded-lg p-4">
                        <h3 class="text-sm font-semibold text-gray-600 mb-2">Saldo Bersih</h3>
                        <p class="text-3xl font-bold ${
                          netIncome >= 0 ? "text-green-600" : "text-red-600"
                        }">
                            Rp ${netIncome.toLocaleString("id-ID")}
                        </p>
                        <p class="text-xs text-gray-500">
                            ${netIncome >= 0 ? "Surplus" : "Defisit"}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Top 5 Kategori Pengeluaran -->
            <div class="mb-8 page-break-inside-avoid">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Top 5 Kategori Pengeluaran</h2>
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2 text-left">No</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Kategori</th>
                            <th class="border border-gray-300 px-4 py-2 text-right">Total</th>
                            <th class="border border-gray-300 px-4 py-2 text-center">Transaksi</th>
                            <th class="border border-gray-300 px-4 py-2 text-center">Persentase</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topCategoriesHTML}
                    </tbody>
                </table>
            </div>

            <!-- Top 5 Pengguna -->
            <div class="mb-8 page-break-inside-avoid">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Top 5 Pengguna</h2>
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2 text-left">No</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Nama</th>
                            <th class="border border-gray-300 px-4 py-2 text-right">Pemasukan</th>
                            <th class="border border-gray-300 px-4 py-2 text-right">Pengeluaran</th>
                            <th class="border border-gray-300 px-4 py-2 text-right">Bersih</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topUsersHTML}
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-500">
                <p>Laporan ini dibuat secara otomatis oleh sistem</p>
                <p class="mt-1">© 2024 Financial Management System</p>
            </div>
        </body>
        </html>
    `;

  // Buat window baru
  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    alert("Pop-up diblokir! Mohon izinkan pop-up untuk mencetak laporan.");
    return;
  }

  // Tulis HTML ke window baru
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export default openPrintWindow;
