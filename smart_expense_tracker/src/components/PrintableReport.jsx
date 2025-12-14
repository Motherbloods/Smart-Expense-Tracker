import { FileText, TrendingUp, TrendingDown, Calendar, Users, BarChart3 } from "lucide-react";

function PrintableReport({
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
    monthNames
}) {

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white p-8">
            {/* Print Button - Hidden saat print */}
            <div className="no-print mb-6 flex justify-end gap-4">
                <button
                    onClick={() => window.close()}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                >
                    Tutup
                </button>
                <button
                    onClick={handlePrint}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                    Print / Save as PDF
                </button>
            </div>

            {/* Header Laporan */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Laporan Keuangan Admin</h1>
                <p className="text-xl text-gray-600">
                    Periode: {monthNames[selectedMonth]} {selectedYear}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Dicetak pada: {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            {/* Ringkasan Statistik */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Ringkasan Statistik</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-600">Total User</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{totalUsers}</p>
                        <p className="text-xs text-gray-500">Pengguna aktif</p>
                    </div>

                    <div className="border border-gray-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <h3 className="text-sm font-semibold text-gray-600">Total Pemasukan</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                            Rp {allIncomes.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-gray-500">{incomes.length} transaksi</p>
                    </div>

                    <div className="border border-gray-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                            <h3 className="text-sm font-semibold text-gray-600">Total Pengeluaran</h3>
                        </div>
                        <p className="text-3xl font-bold text-red-600">
                            Rp {allExpenses.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-gray-500">{expenses.length} transaksi</p>
                    </div>

                    <div className="border border-gray-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <h3 className="text-sm font-semibold text-gray-600">Saldo Bersih</h3>
                        </div>
                        <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rp {netIncome.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-gray-500">
                            {netIncome >= 0 ? 'Surplus' : 'Defisit'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top 5 Kategori Pengeluaran */}
            <div className="mb-8 page-break-inside-avoid">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Top 5 Kategori Pengeluaran</h2>
                {topCategories.length > 0 ? (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">No</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Kategori</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Transaksi</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Persentase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCategories.map(([category, data], index) => {
                                const percentage = (data.total / allExpenses) * 100;
                                return (
                                    <tr key={category}>
                                        <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                                        <td className="border border-gray-300 px-4 py-2 font-medium">{category}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                                            Rp {data.total.toLocaleString('id-ID')}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center">{data.count}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                            {Math.round(percentage)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 text-center py-4">Belum ada data pengeluaran</p>
                )}
            </div>

            {/* Top 5 Pengguna */}
            <div className="mb-8 page-break-inside-avoid">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Top 5 Pengguna</h2>
                {topUsers.length > 0 ? (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">No</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Nama</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">Pemasukan</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">Pengeluaran</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">Bersih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topUsers.map((user, index) => (
                                <tr key={user.telegramId}>
                                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                                    <td className="border border-gray-300 px-4 py-2 font-medium">
                                        {user.name || user.username}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right text-green-600 font-semibold">
                                        Rp {user.totalIncome.toLocaleString('id-ID')}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right text-red-600 font-semibold">
                                        Rp {user.totalExpense.toLocaleString('id-ID')}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                                        Rp {user.netIncome.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 text-center py-4">Belum ada data pengguna</p>
                )}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-500">
                <p>Laporan ini dibuat secara otomatis oleh sistem</p>
                <p className="mt-1">© 2024 Financial Management System</p>
            </div>

            {/* Print Styles */}
            <style>{`
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
                    }
                }
            `}</style>
        </div>
    );
}

export default PrintableReport;