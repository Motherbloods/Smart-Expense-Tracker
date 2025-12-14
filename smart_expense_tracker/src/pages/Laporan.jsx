import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { getExpenses } from "../api/expenseService";
import { getIncomes } from "../api/incomeService";
import { getUserData } from "../api/loginService";
import { FileText, Download, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import openUserPrintWindow from "../utils/userPrintUtils";

import useNavigation from "../hooks/useNavigation";

function Laporan() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [isLoading] = useState(false);
    const [_, setIsSidebarCollapsed] = useState(false);
    const [isDataReady, setIsDataReady] = useState(false);
    const [isPending, startTransition] = useTransition();

    const telegramId = localStorage.getItem("telegramId");

    const { currentPage, handlePageChange } = useNavigation();

    // Helper function untuk filter data berdasarkan bulan dan tahun
    const filterDataByMonth = useCallback((data, month, year) => {
        return data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === month && itemDate.getFullYear() === year;
        });
    }, []);

    // Filter data
    const filteredExpenses = useMemo(() =>
        filterDataByMonth(expenses, selectedMonth, selectedYear),
        [expenses, selectedMonth, selectedYear, filterDataByMonth]
    );

    const filteredIncomes = useMemo(() =>
        filterDataByMonth(incomes, selectedMonth, selectedYear),
        [incomes, selectedMonth, selectedYear, filterDataByMonth]
    );

    // Kalkulasi
    const totalExpenses = useMemo(() =>
        filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
        [filteredExpenses]
    );

    const totalIncomes = useMemo(() =>
        filteredIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0),
        [filteredIncomes]
    );

    const netIncome = totalIncomes - totalExpenses;
    const budgetPercentage = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

    // Kategori breakdown
    const categoryBreakdown = useMemo(() =>
        filteredExpenses.reduce((acc, expense) => {
            const category = expense.category || 'Lainnya';
            if (!acc[category]) {
                acc[category] = { total: 0, count: 0, items: [] };
            }
            acc[category].total += Number(expense.amount);
            acc[category].count += 1;
            acc[category].items.push(expense);
            return acc;
        }, {}),
        [filteredExpenses]
    );

    // Array nama bulan
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // Generate tahun options
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    // Fetch only essential data for initial render
    const fetchCriticalData = useCallback(async () => {
        try {
            const userResponse = await getUserData(telegramId);
            setMonthlyBudget(userResponse.data.data.budgetMontly);
        } catch (error) {
            console.error("Error fetching user data", error);
        }
    }, [telegramId]);

    // Fetch transaction data after initial render
    const fetchNonCriticalData = useCallback(async () => {
        try {
            const [expenseResponse, incomeResponse] = await Promise.all([
                getExpenses(),
                getIncomes()
            ]);

            setExpenses(expenseResponse.data.data);
            setIncomes(incomeResponse.data.data);
            setIsDataReady(true);
        } catch (error) {
            console.error("Error fetching transactions", error);
            setIsDataReady(true);
        }
    }, []);

    // Fetch critical data immediately on mount
    useEffect(() => {
        if (telegramId) {
            fetchCriticalData();
        }
    }, [telegramId, fetchCriticalData]);

    // Fetch non-critical data using requestIdleCallback to defer
    useEffect(() => {
        if (telegramId && !isDataReady) {
            const timeoutId = requestIdleCallback(() => {
                fetchNonCriticalData();
            }, { timeout: 2000 });

            return () => cancelIdleCallback(timeoutId);
        }
    }, [telegramId, isDataReady, fetchNonCriticalData]);

    // Handlers with startTransition
    const handleMonthChange = (event) => {
        startTransition(() => {
            setSelectedMonth(parseInt(event.target.value));
        });
    };

    const handleYearChange = (event) => {
        startTransition(() => {
            setSelectedYear(parseInt(event.target.value));
        });
    };

    // Export to PDF - Open in new window
    const exportToPDF = () => {
        const reportData = {
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
            monthNames
        };

        openUserPrintWindow(reportData);
        toast.success("Membuka halaman print...");
    };

    // Export to CSV
    const exportToCSV = () => {
        try {
            const csvData = [];

            // Header
            csvData.push(['LAPORAN KEUANGAN']);
            csvData.push([`Periode: ${monthNames[selectedMonth]} ${selectedYear}`]);
            csvData.push([]);

            // Ringkasan
            csvData.push(['RINGKASAN']);
            csvData.push(['Total Pemasukan', `Rp ${totalIncomes.toLocaleString('id-ID')}`]);
            csvData.push(['Total Pengeluaran', `Rp ${totalExpenses.toLocaleString('id-ID')}`]);
            csvData.push(['Saldo Bersih', `Rp ${netIncome.toLocaleString('id-ID')}`]);
            csvData.push(['Budget Bulanan', `Rp ${monthlyBudget.toLocaleString('id-ID')}`]);
            csvData.push(['Penggunaan Budget', `${Math.round(budgetPercentage)}%`]);
            csvData.push([]);

            // Kategori Pengeluaran
            csvData.push(['PENGELUARAN PER KATEGORI']);
            csvData.push(['Kategori', 'Total', 'Persentase', 'Jumlah Transaksi']);

            if (Object.keys(categoryBreakdown).length > 0) {
                Object.entries(categoryBreakdown)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .forEach(([category, data]) => {
                        const percentage = (data.total / totalExpenses) * 100;
                        csvData.push([
                            category,
                            data.total,
                            `${Math.round(percentage)}%`,
                            data.count
                        ]);
                    });
            }
            csvData.push([]);

            // Detail Pemasukan
            csvData.push(['DETAIL PEMASUKAN']);
            csvData.push(['Tanggal', 'Nama', 'Sumber', 'Jumlah']);

            if (filteredIncomes.length > 0) {
                filteredIncomes
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .forEach(inc => {
                        csvData.push([
                            new Date(inc.date).toLocaleDateString('id-ID'),
                            inc.name,
                            inc.source || '-',
                            inc.amount
                        ]);
                    });
            } else {
                csvData.push(['Belum ada data pemasukan']);
            }
            csvData.push([]);

            // Detail Pengeluaran
            csvData.push(['DETAIL PENGELUARAN']);
            csvData.push(['Tanggal', 'Nama', 'Kategori', 'Jumlah']);

            if (filteredExpenses.length > 0) {
                filteredExpenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .forEach(exp => {
                        csvData.push([
                            new Date(exp.date).toLocaleDateString('id-ID'),
                            exp.name,
                            exp.category,
                            exp.amount
                        ]);
                    });
            } else {
                csvData.push(['Belum ada data pengeluaran']);
            }

            // Convert to CSV string with proper escaping
            const csvContent = csvData.map(row =>
                row.map(cell => {
                    const cellStr = String(cell);
                    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                }).join(',')
            ).join('\n');

            // Add BOM for proper Excel UTF-8 encoding
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `laporan-keuangan-${monthNames[selectedMonth]}-${selectedYear}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            toast.success("CSV berhasil didownload!");
        } catch (error) {
            console.error("Error exporting CSV:", error);
            toast.error("Gagal export CSV");
        }
    };

    return (
        <div className="flex">
            <Sidebar
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onCollapseChange={setIsSidebarCollapsed}
            />
            <main className="flex-1 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                    Laporan Keuangan
                                </h1>
                                <p className="text-gray-600 text-lg">Lihat ringkasan dan laporan keuangan Anda</p>
                            </div>
                            <button
                                onClick={fetchNonCriticalData}
                                disabled={isLoading || isPending}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70"
                            >
                                {isLoading || isPending ? 'Loading...' : 'Refresh Data'}
                            </button>
                        </div>
                    </div>

                    {/* Filter Periode */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <h3 className="text-xl font-bold text-gray-700">Pilih Periode</h3>
                            </div>
                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                <select
                                    value={selectedMonth}
                                    onChange={handleMonthChange}
                                    disabled={isPending}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md disabled:opacity-70"
                                >
                                    {monthNames.map((month, index) => (
                                        <option key={index} value={index}>
                                            {month}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                    disabled={isPending}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md disabled:opacity-70"
                                >
                                    {yearOptions.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-600">Total Pemasukan</h3>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-3xl font-bold text-green-600">
                                Rp {totalIncomes.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{filteredIncomes.length} transaksi</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-600">Total Pengeluaran</h3>
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-3xl font-bold text-red-600">
                                Rp {totalExpenses.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} transaksi</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-600">Saldo Bersih</h3>
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Rp {netIncome.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {netIncome >= 0 ? 'Surplus' : 'Defisit'}
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-600">Penggunaan Budget</h3>
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-3xl font-bold text-purple-600">
                                {Math.round(budgetPercentage)}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                dari Rp {monthlyBudget.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {/* Grafik dan Ringkasan */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Kategori Pengeluaran */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Pengeluaran per Kategori</h3>
                            {Object.keys(categoryBreakdown).length > 0 ? (
                                <div className="space-y-4">
                                    {Object.entries(categoryBreakdown)
                                        .sort(([, a], [, b]) => b.total - a.total)
                                        .map(([category, data]) => {
                                            const percentage = (data.total / totalExpenses) * 100;
                                            return (
                                                <div key={category}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {category}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-900">
                                                            Rp {data.total.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-gradient-to-r from-red-500 to-pink-600 h-2.5 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {Math.round(percentage)}% ({data.count} transaksi)
                                                    </p>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Belum ada data pengeluaran</p>
                            )}
                        </div>

                        {/* Top 5 Pengeluaran Terbesar */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">5 Pengeluaran Terbesar</h3>
                            {filteredExpenses.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredExpenses
                                        .sort((a, b) => b.amount - a.amount)
                                        .slice(0, 5)
                                        .map((expense, index) => (
                                            <div
                                                key={expense._id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{expense.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(expense.date).toLocaleDateString('id-ID')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-red-600">
                                                    Rp {expense.amount.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Belum ada data pengeluaran</p>
                            )}
                        </div>
                    </div>

                    {/* Detail Pemasukan dan Pengeluaran */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Detail Pemasukan */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <h1 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Detail Pemasukan
                            </h1>
                            {filteredIncomes.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {filteredIncomes
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map((income) => (
                                            <div
                                                key={income._id}
                                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{income.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(income.date).toLocaleDateString('id-ID')}
                                                    </p>
                                                    {income.source && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                            {income.source}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-bold text-green-600">
                                                    Rp {income.amount.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Belum ada data pemasukan</p>
                            )}
                        </div>

                        {/* Detail Pengeluaran */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <h1 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                Detail Pengeluaran
                            </h1>
                            {filteredExpenses.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {filteredExpenses
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map((expense) => (
                                            <div
                                                key={expense._id}
                                                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{expense.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(expense.date).toLocaleDateString('id-ID')}
                                                    </p>
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                        {expense.category}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-red-600">
                                                    Rp {expense.amount.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Belum ada data pengeluaran</p>
                            )}
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-gray-700 mb-4">Export Laporan</h3>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={exportToPDF}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Download className="w-5 h-5" />
                                Export ke PDF
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Download className="w-5 h-5" />
                                Export ke CSV
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Laporan;