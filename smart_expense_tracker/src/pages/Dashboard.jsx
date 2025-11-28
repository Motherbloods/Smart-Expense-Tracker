import { useCallback, useEffect, useState, lazy, Suspense, useMemo, useTransition } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "../components/card/Card";
import Sidebar from "../components/sidebar/Sidebar";
import { createExpense, deleteExpense, editExpense, getExpenses } from "../api/expenseService";
import { createIncome, deleteIncome, editIncome, getIncomes } from "../api/incomeService";
import { getUserData } from "../api/loginService";
import { toast } from "react-toastify";
import { cachedAPICall, apiCache } from "../utils/apiCache";

// ✅ LAZY LOADING
const CategoryBreakdown = lazy(() => import("../components/categoryBreakdown/CategoryBreakdown"));
const Chart = lazy(() => import("../components/chart/Chart"));
const ExpenseForm = lazy(() =>
    import("../features/expenses/ExpenseForm").then((m) => ({ default: m.default }))
);

const ExpenseList = lazy(() => import("../features/expenses/ExpenseList"));
const IncomeForm = lazy(() => import("../features/income/IncomeForm"));
const IncomeList = lazy(() => import("../features/income/IncomeList"));
const BudgetModal = lazy(() => import("../components/budgetModal/BudgetModal"));

// Loading Skeletons
const FormSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const ListSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
        </div>
    </div>
);

const ChartSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
    </div>
);

const CardSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
    </div>
);

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [_, startTransition] = useTransition();

    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [originalMonthlyBudget, setOriginalMonthlyBudget] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [expenseEdit, setExpenseEdit] = useState(null);
    const [incomeEdit, setIncomeEdit] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpense, setIsExpense] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDataReady, setIsDataReady] = useState(false);

    // State untuk filter bulan
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const telegramId = localStorage.getItem("telegramId");

    const currentPage = useMemo(() => {
        if (location.pathname === '/') return 'dashboard';
        if (location.pathname === '/laporan') return 'laporan';
        if (location.pathname === '/aktivitas-pengguna') return 'aktivitas';
        return 'dashboard';
    }, [location.pathname]);

    const filterDataByMonth = useCallback((data, month, year) => {
        return data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === month && itemDate.getFullYear() === year;
        });
    }, []);

    const filteredExpenses = useMemo(() =>
        filterDataByMonth(expenses, selectedMonth, selectedYear),
        [expenses, selectedMonth, selectedYear, filterDataByMonth]
    );

    const filteredIncomes = useMemo(() =>
        filterDataByMonth(incomes, selectedMonth, selectedYear),
        [incomes, selectedMonth, selectedYear, filterDataByMonth]
    );

    const totalExpenses = useMemo(() =>
        filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
        [filteredExpenses]
    );

    const totalIncomes = useMemo(() =>
        filteredIncomes.reduce((sum, income) => sum + Number(income.amount), 0),
        [filteredIncomes]
    );

    const netIncome = totalIncomes - totalExpenses;
    const budgetPercentage = (totalExpenses / monthlyBudget) * 100;

    let warningLevel = "safe";
    if (budgetPercentage >= 100) {
        warningLevel = "exceeded";
    } else if (budgetPercentage >= 90) {
        warningLevel = "critical";
    } else if (budgetPercentage >= 70) {
        warningLevel = "warning";
    }

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    const handlePageChange = useCallback((pageId) => {
        switch (pageId) {
            case 'dashboard':
                navigate('/');
                break;
            case 'laporan':
                navigate('/laporan');
                break;
            case 'aktivitas':
                navigate('/aktivitas-pengguna');
                break;
            default:
                navigate('/');
        }
    }, [navigate]);

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

    const goToPreviousMonth = () => {
        startTransition(() => {
            if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
            } else {
                setSelectedMonth(selectedMonth - 1);
            }
        });
    };

    const goToNextMonth = () => {
        startTransition(() => {
            if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
            } else {
                setSelectedMonth(selectedMonth + 1);
            }
        });
    };

    const goToCurrentMonth = () => {
        startTransition(() => {
            const now = new Date();
            setSelectedMonth(now.getMonth());
            setSelectedYear(now.getFullYear());
        });
    };

    // ✅ OPTIMASI: Expense handlers dengan cache invalidation
    const onAddExpense = async (newExpense) => {
        try {
            setIsLoading(true);
            const response = await createExpense(newExpense);
            if (response.data && response.data.data) {
                setExpenses((prev) => [response.data.data, ...prev]);

                // Invalidate cache
                apiCache.invalidate(`incomes_${telegramId}`);

                const incomeResponse = await getIncomes();
                setIncomes(incomeResponse.data.data);
            }
        } catch (error) {
            console.error("Error adding expense:", error);
            toast.error("Gagal menambahkan pengeluaran");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateExpense = async (updatedExpense) => {
        try {
            setIsLoading(true);
            const { id, ...expenseData } = updatedExpense;
            const response = await editExpense(expenseData, id);

            if (response.data && response.data.data) {
                setExpenses((prev) =>
                    prev.map((expense) =>
                        expense._id === id ? response.data.data : expense
                    )
                );

                apiCache.invalidate(`incomes_${telegramId}`);
                const incomeResponse = await getIncomes();
                setIncomes(incomeResponse.data.data);
            }
        } catch (error) {
            console.error("Error updating expense:", error);
            toast.error("Gagal memperbarui pengeluaran");
        } finally {
            setIsLoading(false);
        }
    };

    const onDeleteExpense = async (id) => {
        try {
            setIsLoading(true);
            const response = await deleteExpense(id);

            if (response.data && response.data.success) {
                setExpenses((prev) => prev.filter((expense) => expense._id !== id));

                apiCache.invalidate(`incomes_${telegramId}`);
                const incomeResponse = await getIncomes();
                setIncomes(incomeResponse.data.data);

                toast.success("Pengeluaran berhasil dihapus 🗑️");
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Gagal menghapus pengeluaran");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditExpense = (expense) => {
        setExpenseEdit(expense);
    };

    // Income handlers
    const onAddIncome = async (newIncome) => {
        try {
            setIsLoading(true);
            const response = await createIncome(newIncome);

            if (response.data && response.data.data) {
                setIncomes((prev) => [response.data.data, ...prev]);
                apiCache.invalidate(`incomes_${telegramId}`);
            }
        } catch (error) {
            console.error("Error adding income:", error);
            toast.error("Gagal menambahkan pemasukan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateIncome = async (updatedIncome) => {
        try {
            setIsLoading(true);
            const { id, ...incomeData } = updatedIncome;
            const response = await editIncome(incomeData, id);

            if (response.data && response.data.data) {
                setIncomes((prev) =>
                    prev.map((income) =>
                        income._id === id ? response.data.data : income
                    )
                );
                apiCache.invalidate(`incomes_${telegramId}`);
            }
        } catch (error) {
            console.error("Error updating income:", error);
            toast.error("Gagal memperbarui pemasukan");
        } finally {
            setIsLoading(false);
        }
    };

    const onDeleteIncome = async (id) => {
        try {
            setIsLoading(true);
            const response = await deleteIncome(id);

            if (response.data && response.data.success) {
                setIncomes((prev) => prev.filter((income) => income._id !== id));
                apiCache.invalidate(`incomes_${telegramId}`);
                toast.success("✅ Pemasukan berhasil dihapus");
            }
        } catch (error) {
            console.error("Error deleting income:", error);
            toast.error("❌ Gagal menghapus pemasukan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditIncome = (income) => {
        setIncomeEdit(income);
    };

    const handleToggleToExpense = () => {
        startTransition(() => {
            setIsExpense(true);
            setExpenseEdit(null);
            setIncomeEdit(null);
        });
    };

    const handleToggleToIncome = () => {
        startTransition(() => {
            setIsExpense(false);
            setExpenseEdit(null);
            setIncomeEdit(null);
        });
    };

    // ✅ NEW: Fetch SEMUA data secara parallel (Critical + Non-Critical)
    const fetchAllData = useCallback(async () => {
        try {
            // ✅ Parallel fetching untuk user, expenses, dan incomes
            const [userResponse, expenseResponse, incomeResponse] = await Promise.all([
                cachedAPICall(
                    `user_${telegramId}`,
                    () => getUserData(telegramId),
                    10 * 60 * 1000 // 10 menit cache untuk user data
                ),
                cachedAPICall(
                    `expenses_${telegramId}`,
                    getExpenses,
                    2 * 60 * 1000 // 2 menit cache
                ),
                cachedAPICall(
                    `incomes_${telegramId}`,
                    getIncomes,
                    2 * 60 * 1000 // 2 menit cache
                )
            ]);

            // Set semua state sekaligus
            setMonthlyBudget(userResponse.data.data.budgetMontly);
            setExpenses(expenseResponse.data.data);
            setIncomes(incomeResponse.data.data);
            setIsDataReady(true);
            setLastRefreshTime(Date.now());

        } catch (error) {
            console.error("Error fetching data:", error);
            setIsDataReady(true); // Set ready even on error
        }
    }, [telegramId]);

    // ✅ OPTIMASI: Refresh dengan parallel call
    const refreshAllData = useCallback(async () => {
        try {
            const [expenseResponse, incomeResponse] = await Promise.all([
                cachedAPICall(`expenses_${telegramId}`, getExpenses, 2 * 60 * 1000),
                cachedAPICall(`incomes_${telegramId}`, getIncomes, 2 * 60 * 1000)
            ]);

            setExpenses(expenseResponse.data.data);
            setIncomes(incomeResponse.data.data);
            setLastRefreshTime(Date.now());
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    }, [telegramId]);

    // ✅ NEW: Single useEffect untuk initial data fetch
    useEffect(() => {
        if (telegramId && !isDataReady) {
            // Delay 50ms untuk prioritaskan render pertama
            const timeoutId = setTimeout(() => {
                fetchAllData();
            }, 50);

            return () => clearTimeout(timeoutId);
        }
    }, [telegramId, isDataReady, fetchAllData]);

    // Refresh on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 5 * 60 * 1000) {
                    refreshAllData();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [lastRefreshTime, refreshAllData]);

    // ✅ DEFER: Pusher initialization
    useEffect(() => {
        if (!telegramId) return;

        const timeoutId = requestIdleCallback(async () => {
            try {

                const pusher = new window.Pusher(import.meta.env.VITE_PUSHER_KEY, {
                    cluster: import.meta.env.VITE_PUSHER_CLUSTER,
                });
                const channel = pusher.subscribe(import.meta.env.VITE_PUSHER_SUBSCRIBE);

                channel.bind(import.meta.env.VITE_PUSHER_BIND, (data) => {
                    if (data && data.expense && data.telegramId === telegramId) {
                        const newExpense = {
                            _id: data.expense._id || `temp-${Date.now()}`,
                            name: data.expense.name,
                            amount: data.expense.amount,
                            category: data.expense.category,
                            date: data.expense.date,
                            telegramId: data.telegramId
                        };

                        setExpenses(prev => {
                            const exists = prev.some(exp => exp._id === newExpense._id);
                            if (!exists) {
                                apiCache.invalidate(`expenses_${telegramId}`);
                                return [newExpense, ...prev];
                            }
                            return prev;
                        });
                    }
                });

                channel.bind('income-added', (data) => {
                    if (data && data.income && data.telegramId === telegramId) {
                        const newIncome = {
                            _id: data.income._id || `temp-${Date.now()}`,
                            name: data.income.name,
                            amount: data.income.amount,
                            source: data.income.source,
                            notes: data.income.notes,
                            date: data.income.date,
                            telegramId: data.telegramId
                        };

                        setIncomes(prev => {
                            const exists = prev.some(inc => inc._id === newIncome._id);
                            if (!exists) {
                                apiCache.invalidate(`incomes_${telegramId}`);
                                return [newIncome, ...prev];
                            }
                            return prev;
                        });
                    }
                });

                return () => {
                    channel.unbind_all();
                    channel.unsubscribe();
                };
            } catch (error) {
                console.error("Error initializing Pusher:", error);
            }
        }, { timeout: 5000 });

        return () => cancelIdleCallback(timeoutId);
    }, [telegramId]);

    useEffect(() => {
        if (!isExpense) {
            refreshAllData();
        }
    }, [isExpense, refreshAllData]);

    return (
        <div className="flex">
            <Sidebar
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onCollapseChange={setIsSidebarCollapsed}
            />

            <main className="flex-1 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
                <div className="max-w-full mx-auto">
                    {/* Header Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                    Expense Tracker
                                </h1>
                                <p className="text-gray-600 text-lg">Kelola keuangan Anda dengan mudah</p>
                            </div>
                            <div className="flex gap-3 w-full lg:w-auto">
                                <button
                                    onClick={() => {
                                        // Clear cache sebelum refresh manual
                                        apiCache.clear();
                                        fetchAllData();
                                    }}
                                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Loading...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Refresh
                                        </div>
                                    )}
                                </button>
                                <button
                                    onClick={() => { setOriginalMonthlyBudget(monthlyBudget); setShowBudgetModal(true) }}
                                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    Set Budget
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <button
                                    aria-label="goToPreviousMonth"
                                    onClick={goToPreviousMonth}
                                    className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <div className="text-center px-4">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                                        {monthNames[selectedMonth]} {selectedYear}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Periode Filter</p>
                                </div>

                                <button
                                    aria-label="goToNextMonth"
                                    onClick={goToNextMonth}
                                    className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                <select
                                    aria-label="Pilih Bulan"
                                    value={selectedMonth}
                                    onChange={handleMonthChange}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    {monthNames.map((month, index) => (
                                        <option key={index} value={index}>
                                            {month}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    aria-label="Pilih Tahun"
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    {yearOptions.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={goToCurrentMonth}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                >
                                    Bulan Ini
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Cards Grid */}
                    {!isDataReady ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <CardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                            <Card
                                title={"Budget Bulanan"}
                                value={`Rp ${monthlyBudget.toLocaleString("id-ID")}`}
                                textColor={"text-blue-600"}
                            />
                            <Card
                                title={"Total Pemasukan"}
                                value={`Rp ${totalIncomes.toLocaleString("id-ID")}`}
                                textColor={"text-green-600"}
                            />
                            <Card
                                title={"Total Pengeluaran"}
                                value={`Rp ${totalExpenses.toLocaleString("id-ID")}`}
                                textColor={"text-red-600"}
                            />
                            <Card
                                title={"Saldo Bersih"}
                                value={`Rp ${netIncome.toLocaleString("id-ID")}`}
                                textColor={netIncome >= 0 ? "text-green-600" : "text-red-600"}
                            />
                        </div>
                    )}

                    {/* Budget Progress */}
                    {monthlyBudget > 0 && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                                <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                                    Progress Budget Bulanan
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${warningLevel === 'exceeded' ? 'bg-red-100 text-red-700' :
                                        warningLevel === 'critical' ? 'bg-orange-100 text-orange-700' :
                                            warningLevel === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                        }`}>
                                        {Math.round(budgetPercentage)}% terpakai
                                    </span>
                                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                        Sisa: Rp {(monthlyBudget - totalExpenses).toLocaleString("id-ID")}
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-3 shadow-inner">
                                    <div
                                        className={`h-4 rounded-full transition-all duration-1000 ease-out shadow-sm ${warningLevel === 'exceeded' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                            warningLevel === 'critical' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                                warningLevel === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                    'bg-gradient-to-r from-green-500 to-green-600'
                                            }`}
                                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 font-medium">
                                    <span>Rp 0</span>
                                    <span>Rp {monthlyBudget.toLocaleString("id-ID")}</span>
                                </div>
                            </div>

                            {budgetPercentage > 100 && (
                                <div className="text-center mt-4">
                                    <span className="inline-flex items-center gap-2 text-sm bg-red-100 text-red-800 px-4 py-2 rounded-full font-medium shadow-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        Melebihi budget sebesar Rp {(totalExpenses - monthlyBudget).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Toggle Section */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 mb-8">
                        <button
                            onClick={handleToggleToExpense}
                            className={`flex-1 sm:flex-none px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${isExpense
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                Pengeluaran
                            </div>
                        </button>

                        <button
                            onClick={handleToggleToIncome}
                            className={`flex-1 sm:flex-none px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${!isExpense
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Pemasukan
                            </div>
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className={`grid gap-8 transition-all duration-300 ${isSidebarCollapsed ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'
                        }`}>
                        {/* Left Column */}
                        <div className={`space-y-6 ${isSidebarCollapsed ? 'xl:col-span-7' : 'w-full'}`}>
                            <Suspense fallback={<FormSkeleton />}>
                                {isExpense ? (
                                    <ExpenseForm
                                        onAddExpense={onAddExpense}
                                        expensesData={expenses}
                                        onUpdateExpense={handleUpdateExpense}
                                        expenseEdit={expenseEdit}
                                        setExpenseEdit={setExpenseEdit}
                                        isLoading={isLoading}
                                    />
                                ) : (
                                    <IncomeForm
                                        onAddIncome={onAddIncome}
                                        incomesData={incomes}
                                        onUpdateIncome={handleUpdateIncome}
                                        incomeEdit={incomeEdit}
                                        setIncomeEdit={setIncomeEdit}
                                        isLoading={isLoading}
                                    />
                                )}
                            </Suspense>

                            <Suspense fallback={<ListSkeleton />}>
                                {isExpense ? (
                                    <ExpenseList
                                        expenses={filteredExpenses}
                                        onDeleteExpense={onDeleteExpense}
                                        handleEditExpense={handleEditExpense}
                                    />
                                ) : (
                                    <IncomeList
                                        incomes={filteredIncomes}
                                        onDeleteIncome={onDeleteIncome}
                                        handleEditIncome={handleEditIncome}
                                    />
                                )}
                            </Suspense>
                        </div>

                        {/* Right Column */}
                        <div className={`space-y-6 ${isSidebarCollapsed ? 'xl:col-span-5' : 'w-full'}`}>
                            <Suspense fallback={<ChartSkeleton />}>
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                    <h1 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                        <div className="w-3 h-3 text-sm rounded-full bg-gradient-to-r from-purple-500 to-pink-600"></div>
                                        Grafik Pemasukan & Pengeluaran
                                    </h1>

                                    {!isDataReady ? (
                                        <div className="h-64 animate-pulse">
                                            <div className="h-full bg-gray-200 rounded"></div>
                                        </div>
                                    ) : (filteredExpenses.length > 0 || filteredIncomes.length > 0) ? (
                                        <Chart expenses={filteredExpenses} incomes={filteredIncomes} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <p className="text-lg font-medium mb-2">Belum Ada Data Transaksi</p>
                                            <p className="text-sm text-center">Tambahkan pemasukan atau pengeluaran untuk melihat grafik</p>
                                        </div>
                                    )}
                                </div>
                            </Suspense>

                            {isExpense && (
                                <Suspense fallback={<ChartSkeleton />}>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                                        <h1 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600"></div>
                                            Kategori Pengeluaran
                                        </h1>
                                        {filteredExpenses.length > 0 ? (
                                            <CategoryBreakdown expenses={filteredExpenses} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                                <p className="text-lg font-medium mb-2">Belum Ada Kategori</p>
                                                <p className="text-sm text-center">Kategori pengeluaran akan muncul setelah Anda menambahkan data</p>
                                            </div>
                                        )}
                                    </div>
                                </Suspense>
                            )}
                        </div>
                    </div>

                    {/* Budget Modal */}
                    {showBudgetModal && (
                        <Suspense fallback={
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="bg-white rounded-2xl p-8 animate-pulse">
                                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        }>
                            <BudgetModal
                                telegramId={telegramId}
                                setShowBudgetModal={setShowBudgetModal}
                                setMonthlyBudget={setMonthlyBudget}
                                monthlyBudget={monthlyBudget}
                                originalMonthlyBudget={originalMonthlyBudget}
                            />
                        </Suspense>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;