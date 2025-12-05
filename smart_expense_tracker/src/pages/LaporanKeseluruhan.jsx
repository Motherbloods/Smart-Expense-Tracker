import { useState, useMemo } from "react";
import { FileText, Download, TrendingUp, TrendingDown, Calendar, Users, BarChart3, PieChart, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Sidebar from "../components/sidebar/Sidebar";
import useNavigation from "../hooks/useNavigation";
// Import Sidebar asli dari components

function AdminLaporan() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [_, setIsSidebarCollapsed] = useState(false);


    const { currentPage, handlePageChange } = useNavigation();

    // Dummy data dengan banyak users
    const dummyUsers = [
        { id: 1, name: "Ahmad Rizki", totalIncome: 15000000, totalExpense: 8500000 },
        { id: 2, name: "Siti Nurhaliza", totalIncome: 12000000, totalExpense: 7200000 },
        { id: 3, name: "Budi Santoso", totalIncome: 18000000, totalExpense: 9800000 },
        { id: 4, name: "Dewi Lestari", totalIncome: 10000000, totalExpense: 6500000 },
        { id: 5, name: "Eko Prasetyo", totalIncome: 16000000, totalExpense: 8200000 },
    ];

    const dummyExpenses = [
        { _id: 1, name: "Makan", category: "Makanan", amount: 85000, date: new Date(2025, selectedMonth, 5), userId: 1 },
        { _id: 2, name: "Transportasi", category: "Transportasi", amount: 150000, date: new Date(2025, selectedMonth, 6), userId: 2 },
        { _id: 3, name: "Internet", category: "Utilitas", amount: 300000, date: new Date(2025, selectedMonth, 1), userId: 3 },
        { _id: 4, name: "Belanja Groceries", category: "Belanja", amount: 450000, date: new Date(2025, selectedMonth, 8), userId: 1 },
        { _id: 5, name: "Tagihan Listrik", category: "Utilitas", amount: 500000, date: new Date(2025, selectedMonth, 10), userId: 4 },
        { _id: 6, name: "Bensin", category: "Transportasi", amount: 200000, date: new Date(2025, selectedMonth, 12), userId: 5 },
        { _id: 7, name: "Hiburan", category: "Hiburan", amount: 250000, date: new Date(2025, selectedMonth, 15), userId: 2 },
        { _id: 8, name: "Kesehatan", category: "Kesehatan", amount: 320000, date: new Date(2025, selectedMonth, 18), userId: 3 },
    ];

    const dummyIncomes = [
        { _id: 1, name: "Gaji", source: "Kerja", amount: 10000000, date: new Date(2025, selectedMonth, 1), userId: 1 },
        { _id: 2, name: "Gaji", source: "Kerja", amount: 8000000, date: new Date(2025, selectedMonth, 1), userId: 2 },
        { _id: 3, name: "Gaji", source: "Kerja", amount: 12000000, date: new Date(2025, selectedMonth, 1), userId: 3 },
        { _id: 4, name: "Gaji", source: "Kerja", amount: 7000000, date: new Date(2025, selectedMonth, 1), userId: 4 },
        { _id: 5, name: "Gaji", source: "Kerja", amount: 11000000, date: new Date(2025, selectedMonth, 1), userId: 5 },
        { _id: 6, name: "Bonus", source: "Bonus", amount: 2000000, date: new Date(2025, selectedMonth, 15), userId: 1 },
    ];

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    // Kalkulasi data admin
    const allExpenses = useMemo(() =>
        dummyExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        []
    );

    const allIncomes = useMemo(() =>
        dummyIncomes.reduce((sum, inc) => sum + inc.amount, 0),
        []
    );

    const totalUsers = dummyUsers.length;
    const netIncome = allIncomes - allExpenses;

    const categoryBreakdown = useMemo(() =>
        dummyExpenses.reduce((acc, expense) => {
            const category = expense.category || 'Lainnya';
            if (!acc[category]) {
                acc[category] = { total: 0, count: 0 };
            }
            acc[category].total += expense.amount;
            acc[category].count += 1;
            return acc;
        }, {}),
        []
    );

    const topCategories = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5);

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
                                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                    Refresh Data
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
                                <p className="text-xs text-gray-500 mt-1">{dummyIncomes.length} transaksi</p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-600">Total Pengeluaran</h3>
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                                <p className="text-3xl font-bold text-red-600">
                                    Rp {allExpenses.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{dummyExpenses.length} transaksi</p>
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
                                    Rp {Math.round(allIncomes / totalUsers).toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Pemasukan per user</p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Top Categories */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <h3 className="text-xl font-bold text-gray-700 mb-4">Kategori Pengeluaran Terbesar</h3>
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
                            </div>

                            {/* Top Users */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <h3 className="text-xl font-bold text-gray-700 mb-4">Top 5 Pengguna</h3>
                                <div className="space-y-3">
                                    {dummyUsers.sort((a, b) => b.totalIncome - a.totalIncome).map((user, index) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Rp {(user.totalIncome - user.totalExpense).toLocaleString('id-ID')} bersih
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
                                    {dummyIncomes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(income => (
                                        <div key={income._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{income.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {dummyUsers.find(u => u.id === income.userId)?.name}
                                                </p>
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                    {income.source}
                                                </span>
                                            </div>
                                            <p className="font-bold text-green-600">
                                                Rp {income.amount.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Expenses */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                                    Pengeluaran Terbaru
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {dummyExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                                        <div key={expense._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{expense.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {dummyUsers.find(u => u.id === expense.userId)?.name}
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
                            </div>
                        </div>

                        {/* Export */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Export Laporan</h3>
                            <div className="flex flex-wrap gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                    <Download className="w-5 h-5" />
                                    Export ke PDF
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
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