export const openUserPrintWindow = (reportData) => {
  const {
    selectedMonth,
    selectedYear,
    totalIncomes,
    totalExpenses,
    netIncome,
    monthlyBudget,
    budgetPercentage,
    filteredIncomes,
    filteredExpenses,
    categoryBreakdown,
    monthNames,
  } = reportData;

  // Generate HTML untuk kategori pengeluaran
  const categoryHTML =
    Object.keys(categoryBreakdown).length > 0
      ? Object.entries(categoryBreakdown)
          .sort(([, a], [, b]) => b.total - a.total)
          .map(([category, data], index) => {
            const percentage = Math.round((data.total / totalExpenses) * 100);
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

  // Generate HTML untuk top 5 pengeluaran
  const topExpensesHTML =
    filteredExpenses.length > 0
      ? filteredExpenses
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
          .map(
            (expense, index) => `
                <tr>
                    <td class="border border-gray-300 px-4 py-2 text-center">${
                      index + 1
                    }</td>
                    <td class="border border-gray-300 px-4 py-2">
                        <div class="font-medium">${expense.name}</div>
                        <div class="text-xs text-gray-500">${new Date(
                          expense.date
                        ).toLocaleDateString("id-ID")}</div>
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center">
                        <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">${
                          expense.category
                        }</span>
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-right font-bold text-red-600">
                        Rp ${expense.amount.toLocaleString("id-ID")}
                    </td>
                </tr>
            `
          )
          .join("")
      : '<tr><td colspan="4" class="text-center py-4 text-gray-500">Belum ada data pengeluaran</td></tr>';

  // Generate HTML untuk detail pemasukan
  const incomesHTML =
    filteredIncomes.length > 0
      ? filteredIncomes
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
          .map(
            (income) => `
                <tr>
                    <td class="border border-gray-300 px-4 py-2">${new Date(
                      income.date
                    ).toLocaleDateString("id-ID")}</td>
                    <td class="border border-gray-300 px-4 py-2 font-medium">${
                      income.name
                    }</td>
                    <td class="border border-gray-300 px-4 py-2">${
                      income.source || "-"
                    }</td>
                    <td class="border border-gray-300 px-4 py-2 text-right font-semibold text-green-600">
                        Rp ${income.amount.toLocaleString("id-ID")}
                    </td>
                </tr>
            `
          )
          .join("")
      : '<tr><td colspan="4" class="text-center py-4 text-gray-500">Belum ada data pemasukan</td></tr>';

  // Generate HTML untuk detail pengeluaran
  const expensesHTML =
    filteredExpenses.length > 0
      ? filteredExpenses
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
          .map(
            (expense) => `
                <tr>
                    <td class="border border-gray-300 px-4 py-2">${new Date(
                      expense.date
                    ).toLocaleDateString("id-ID")}</td>
                    <td class="border border-gray-300 px-4 py-2 font-medium">${
                      expense.name
                    }</td>
                    <td class="border border-gray-300 px-4 py-2">
                        <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">${
                          expense.category
                        }</span>
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-right font-semibold text-red-600">
                        Rp ${expense.amount.toLocaleString("id-ID")}
                    </td>
                </tr>
            `
          )
          .join("")
      : '<tr><td colspan="4" class="text-center py-4 text-gray-500">Belum ada data pengeluaran</td></tr>';

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate budget bar color
  const budgetBarColor =
    budgetPercentage > 90
      ? "bg-red-500"
      : budgetPercentage > 70
      ? "bg-orange-500"
      : "bg-green-500";

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
                    .page-break-before {
                        page-break-before: always;
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
                <h1 class="text-4xl font-bold text-gray-800 mb-2">Laporan Keuangan Pribadi</h1>
                <p class="text-xl text-gray-600">
                    Periode: ${monthNames[selectedMonth]} ${selectedYear}
                </p>
                <p class="text-sm text-gray-500 mt-2">
                    Dicetak pada: ${currentDate}
                </p>
            </div>

            <!-- Ringkasan Statistik -->
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Ringkasan Keuangan</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="border border-gray-300 rounded-lg p-4">
                        <h3 class="text-sm font-semibold text-gray-600 mb-2">Total Pemasukan</h3>
                        <p class="text-3xl font-bold text-green-600">
                            Rp ${totalIncomes.toLocaleString("id-ID")}
                        </p>
                        <p class="text-xs text-gray-500">${
                          filteredIncomes.length
                        } transaksi</p>
                    </div>

                    <div class="border border-gray-300 rounded-lg p-4">
                        <h3 class="text-sm font-semibold text-gray-600 mb-2">Total Pengeluaran</h3>
                        <p class="text-3xl font-bold text-red-600">
                            Rp ${totalExpenses.toLocaleString("id-ID")}
                        </p>
                        <p class="text-xs text-gray-500">${
                          filteredExpenses.length
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

                    <div class="border border-gray-300 rounded-lg p-4">
                        <h3 class="text-sm font-semibold text-gray-600 mb-2">Budget Bulanan</h3>
                        <p class="text-3xl font-bold text-purple-600">
                            Rp ${monthlyBudget.toLocaleString("id-ID")}
                        </p>
                        <p class="text-xs text-gray-500">
                            Penggunaan: ${Math.round(budgetPercentage)}%
                        </p>
                    </div>
                </div>

                <!-- Budget Progress Bar -->
                <div class="mt-4 p-4 border border-gray-300 rounded-lg">
                    <h3 class="text-sm font-semibold text-gray-600 mb-2">Penggunaan Budget</h3>
                    <div class="w-full bg-gray-200 rounded-full h-4">
                        <div class="${budgetBarColor} h-4 rounded-full transition-all" style="width: ${Math.min(
    budgetPercentage,
    100
  )}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">${Math.round(
                      budgetPercentage
                    )}% dari Rp ${monthlyBudget.toLocaleString("id-ID")}</p>
                </div>
            </div>

            <!-- Pengeluaran per Kategori -->
            <div class="mb-8 page-break-inside-avoid">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Pengeluaran per Kategori</h2>
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
                        ${categoryHTML}
                    </tbody>
                </table>
            </div>

            <!-- Top 5 Pengeluaran Terbesar -->
            <div class="mb-8 page-break-inside-avoid">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Top 5 Pengeluaran Terbesar</h2>
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2 text-center">No</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Nama</th>
                            <th class="border border-gray-300 px-4 py-2 text-center">Kategori</th>
                            <th class="border border-gray-300 px-4 py-2 text-right">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topExpensesHTML}
                    </tbody>
                </table>
            </div>

            <!-- Detail Pemasukan -->
            <div class="mb-8 page-break-before page-break-inside-avoid">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Detail Pemasukan (10 Terbaru)</h2>
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2 text-left">Tanggal</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Nama</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Sumber</th>
                            <th class="border border-gray-300 px-4 py-2 text-right">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${incomesHTML}
                    </tbody>
                </table>
            </div>

            <!-- Detail Pengeluaran -->
            <div class="mb-8 page-break-inside-avoid">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Detail Pengeluaran (10 Terbaru)</h2>
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2 text-left">Tanggal</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Nama</th>
                            <th class="border border-gray-300 px-4 py-2 text-center">Kategori</th>
                            <th class="border border-gray-300 px-4 py-2 text-right">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expensesHTML}
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

export default openUserPrintWindow;
