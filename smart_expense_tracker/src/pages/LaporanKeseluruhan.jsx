import { useState, useMemo, useEffect } from "react";
import { FileText, Download, TrendingUp, TrendingDown, Calendar, Users, BarChart3, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import Sidebar from "../components/sidebar/Sidebar";
import useNavigation from "../hooks/useNavigation";
import { getAllUsers, getAllExpenses, getAllIncomes, invalidateAdminCache } from "../api/adminService";
import toast from "react-hot-toast";
import openPrintWindow from "../utils/printUtils";

function AdminLaporan() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [_, setIsSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // State untuk data dari API
    const [users, setUsers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);

    const { currentPage, handlePageChange } = useNavigation();

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    // Fetch data dari API
    const fetchData = async (showToast = false) => {
        try {
            setLoading(true);

            const [usersRes, expensesRes, incomesRes] = await Promise.all([
                getAllUsers(),
                getAllExpenses(selectedMonth + 1, selectedYear),
                getAllIncomes(selectedMonth + 1, selectedYear)
            ]);

            setUsers(usersRes.data?.data || []);
            setExpenses(expensesRes.data?.data || []);
            setIncomes(incomesRes.data?.data || []);

            if (showToast) {
                toast.success("Data berhasil direfresh!");
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
            toast.error("Gagal mengambil data laporan");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch data saat component mount atau filter berubah
    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    // Handle refresh data
    const handleRefresh = async () => {
        setRefreshing(true);
        invalidateAdminCache();
        await fetchData(true);
    };

    // Kalkulasi data admin
    const allExpenses = useMemo(() =>
        expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
        [expenses]
    );

    const allIncomes = useMemo(() =>
        incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0),
        [incomes]
    );

    const totalUsers = users.length;
    const netIncome = allIncomes - allExpenses;

    const categoryBreakdown = useMemo(() =>
        expenses.reduce((acc, expense) => {
            const category = expense.category || 'Lainnya';
            if (!acc[category]) {
                acc[category] = { total: 0, count: 0 };
            }
            acc[category].total += expense.amount || 0;
            acc[category].count += 1;
            return acc;
        }, {}),
        [expenses]
    );

    const topCategories = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5);

    // Hitung total income dan expense per user
    const userStats = useMemo(() => {
        return users.map(user => {
            const userIncomes = incomes
                .filter(inc => {
                    return inc.telegramId === user.telegramId ||
                        inc.userId === user._id ||
                        inc.userId === user.telegramId;
                })
                .reduce((sum, inc) => sum + (inc.amount || 0), 0);

            const userExpenses = expenses
                .filter(exp => {
                    return exp.telegramId === user.telegramId ||
                        exp.userId === user._id ||
                        exp.userId === user.telegramId;
                })
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);

            return {
                ...user,
                totalIncome: userIncomes,
                totalExpense: userExpenses,
                netIncome: userIncomes - userExpenses
            };
        });
    }, [users, incomes, expenses]);

    const topUsers = userStats
        .sort((a, b) => b.totalIncome - a.totalIncome)
        .slice(0, 5);

    // Helper function untuk mendapatkan nama user
    const getUserName = (telegramId) => {
        const user = users.find(u =>
            u.telegramId === telegramId ||
            u._id === telegramId
        );
        return user?.name || user?.username || "Unknown User";
    };

    // Handle Export PDF
    const handleExportPDF = () => {
        const reportData = {
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
        };

        openPrintWindow(reportData);
        toast.success("Membuka halaman print...");
    };

    // Handle Export CSV
    const handleExportCSV = () => {
        try {
            // Header CSV
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "LAPORAN KEUANGAN ADMIN\n";
            csvContent += `Periode:,${monthNames[selectedMonth]} ${selectedYear}\n`;
            csvContent += `Tanggal Export:,${new Date().toLocaleDateString('id-ID')}\n\n`;

            // Ringkasan
            csvContent += "RINGKASAN\n";
            csvContent += "Kategori,Jumlah\n";
            csvContent += `Total User,${totalUsers}\n`;
            csvContent += `Total Pemasukan,${allIncomes}\n`;
            csvContent += `Total Pengeluaran,${allExpenses}\n`;
            csvContent += `Saldo Bersih,${netIncome}\n\n`;

            // Top Categories
            csvContent += "TOP 5 KATEGORI PENGELUARAN\n";
            csvContent += "No,Kategori,Total,Jumlah Transaksi,Persentase\n";
            topCategories.forEach(([category, data], index) => {
                const percentage = Math.round((data.total / allExpenses) * 100);
                csvContent += `${index + 1},${category},${data.total},${data.count},${percentage}%\n`;
            });
            csvContent += "\n";

            // Top Users
            csvContent += "TOP 5 PENGGUNA\n";
            csvContent += "No,Nama,Pemasukan,Pengeluaran,Bersih\n";
            topUsers.forEach((user, index) => {
                csvContent += `${index + 1},${user.name || user.username},${user.totalIncome},${user.totalExpense},${user.netIncome}\n`;
            });

            // Download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `laporan_${monthNames[selectedMonth]}_${selectedYear}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("CSV berhasil didownload!");
        } catch (error) {
            console.error("Error exporting CSV:", error);
            toast.error("Gagal export CSV");
        }
    };

    if (loading) {
        return (
            <div className="flex">
                <Sidebar
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    onCollapseChange={setIsSidebarCollapsed}
                />
                <main className="flex-1 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Memuat data laporan...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex">
            <Sidebar
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onCollapseChange={setIsSidebarCollapsed}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div>
                                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                        Laporan Admin
                                    </h1>
                                    <p className="text-gray-600 text-lg">Ringkasan dan analisis keuangan semua pengguna</p>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                                    {refreshing ? 'Refreshing...' : 'Refresh Data'}
                                </button>
                            </div>
                        </div>

                        {/* Filter */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-xl font-bold text-gray-700">Pilih Periode</h3>
                                </div>
                                <div className="flex items-center gap-3 w-full lg:w-auto">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md"
                                    >
                                        {monthNames.map((month, index) => (
                                            <option key={index} value={index}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md"
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

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-600">Total User</h3>
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-3xl font-bold text-blue-600">{totalUsers}</p>
                                <p className="text-xs text-gray-500 mt-1">Pengguna aktif</p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-600">Total Pemasukan</h3>
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-3xl font-bold text-green-600">
                                    Rp {allIncomes.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{incomes.length} transaksi</p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-600">Total Pengeluaran</h3>
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                                <p className="text-3xl font-bold text-red-600">
                                    Rp {allExpenses.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{expenses.length} transaksi</p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-600">Saldo Bersih</h3>
                                    <FileText className="w-5 h-5 text-purple-600" />
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
                                    <h3 className="text-sm font-medium text-gray-600">Rata-rata User</h3>
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <p className="text-3xl font-bold text-indigo-600">
                                    Rp {totalUsers > 0 ? Math.round(allIncomes / totalUsers).toLocaleString('id-ID') : '0'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Pemasukan per user</p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Top Categories */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <h3 className="text-xl font-bold text-gray-700 mb-4">Kategori Pengeluaran Terbesar</h3>
                                {topCategories.length > 0 ? (
                                    <div className="space-y-4">
                                        {topCategories.map(([category, data]) => {
                                            const percentage = (data.total / allExpenses) * 100;
                                            return (
                                                <div key={category}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-gray-700">{category}</span>
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

                            {/* Top Users */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <h3 className="text-xl font-bold text-gray-700 mb-4">Top 5 Pengguna</h3>
                                {topUsers.length > 0 ? (
                                    <div className="space-y-3">
                                        {topUsers.map((user, index) => (
                                            <div key={user.telegramId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.name || user.username}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Rp {user.netIncome.toLocaleString('id-ID')} bersih
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">
                                                        Rp {user.totalIncome.toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">Belum ada data pengguna</p>
                                )}
                            </div>
                        </div>

                        {/* Transaction Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Recent Incomes */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <ArrowDownLeft className="w-5 h-5 text-green-600" />
                                    Pemasukan Terbaru
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {incomes.length > 0 ? (
                                        incomes
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .slice(0, 10)
                                            .map(income => (
                                                <div key={income._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{income.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {getUserName(income.telegramId)}
                                                        </p>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                            {income.source || income.category}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-green-600">
                                                        Rp {income.amount.toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Belum ada data pemasukan</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Expenses */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                                    Pengeluaran Terbaru
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {expenses.length > 0 ? (
                                        expenses
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .slice(0, 10)
                                            .map(expense => (
                                                <div key={expense._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{expense.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {getUserName(expense.telegramId)}
                                                        </p>
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                            {expense.category}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-red-600">
                                                        Rp {expense.amount.toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Belum ada data pengeluaran</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Export */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Export Laporan</h3>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    <Download className="w-5 h-5" />
                                    Export ke PDF
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    <Download className="w-5 h-5" />
                                    Export ke CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminLaporan;