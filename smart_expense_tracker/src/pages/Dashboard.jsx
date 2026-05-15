import {
  useCallback,
  useEffect,
  useState,
  lazy,
  Suspense,
  useMemo,
  useTransition,
} from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/card/Card";
import Sidebar from "../components/sidebar/Sidebar";
import {
  createExpense,
  deleteExpense,
  editExpense,
  getExpenses,
} from "../api/expenseService";
import {
  createIncome,
  deleteIncome,
  editIncome,
  getIncomes,
} from "../api/incomeService";
import { getUserData } from "../api/loginService";
import { toast } from "react-toastify";
import { apiCache } from "../utils/apiCache";
import useNavigation from "../hooks/useNavigation";
import StatCard from "../components/card/Card";

const CategoryBreakdown = lazy(
  () => import("../components/categoryBreakdown/CategoryBreakdown"),
);
const Chart = lazy(() => import("../components/chart/Chart"));
const ExpenseForm = lazy(() =>
  import("../features/expenses/ExpenseForm").then((m) => ({
    default: m.default,
  })),
);

const ExpenseList = lazy(() => import("../features/expenses/ExpenseList"));
const IncomeForm = lazy(() => import("../features/income/IncomeForm"));
const IncomeList = lazy(() => import("../features/income/IncomeList"));
const BudgetModal = lazy(() => import("../components/budgetModal/BudgetModal"));

const FormSkeleton = () => (
  <div className="dash-card animate-pulse">
    <div className="h-5 bg-slate-200 rounded-lg w-1/3 mb-6"></div>
    <div className="space-y-3">
      <div className="h-11 bg-slate-200 rounded-xl"></div>
      <div className="h-11 bg-slate-200 rounded-xl"></div>
      <div className="h-11 bg-slate-200 rounded-xl"></div>
      <div className="h-11 bg-slate-100 rounded-xl w-1/2 mt-2"></div>
    </div>
  </div>
);

const ListSkeleton = () => (
  <div className="dash-card animate-pulse">
    <div className="h-5 bg-slate-200 rounded-lg w-1/4 mb-6"></div>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
      ))}
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="dash-card animate-pulse">
    <div className="h-5 bg-slate-200 rounded-lg w-1/3 mb-6"></div>
    <div className="h-64 bg-slate-100 rounded-xl"></div>
  </div>
);

const CardSkeleton = () => (
  <div className="dash-stat-card animate-pulse">
    <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-slate-200 rounded-lg w-3/4"></div>
  </div>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-14 text-slate-400">
    <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
      {icon}
    </div>
    <p className="text-base font-semibold text-slate-500 mb-1">{title}</p>
    <p className="text-sm text-center text-slate-400 max-w-xs">{subtitle}</p>
  </div>
);

function Dashboard() {
  const navigate = useNavigate();
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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const telegramId = localStorage.getItem("telegramId");
  const { currentPage } = useNavigation();

  const filterDataByMonth = useCallback((data, month, year) => {
    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === month && itemDate.getFullYear() === year;
    });
  }, []);

  const filteredExpenses = useMemo(
    () => filterDataByMonth(expenses, selectedMonth, selectedYear),
    [expenses, selectedMonth, selectedYear, filterDataByMonth],
  );

  const filteredIncomes = useMemo(
    () => filterDataByMonth(incomes, selectedMonth, selectedYear),
    [incomes, selectedMonth, selectedYear, filterDataByMonth],
  );

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [filteredExpenses],
  );

  const totalIncomes = useMemo(
    () => filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0),
    [filteredIncomes],
  );

  const netIncome = totalIncomes - totalExpenses;
  const budgetPercentage = (totalExpenses / monthlyBudget) * 100;

  let warningLevel = "safe";
  if (budgetPercentage >= 100) warningLevel = "exceeded";
  else if (budgetPercentage >= 90) warningLevel = "critical";
  else if (budgetPercentage >= 70) warningLevel = "warning";

  const warningConfig = {
    exceeded: {
      bar: "from-red-500 to-rose-500",
      badge: "bg-red-50 text-red-600 border border-red-200",
      sisa: "bg-red-50 text-red-500",
    },
    critical: {
      bar: "from-orange-400 to-orange-500",
      badge: "bg-orange-50 text-orange-600 border border-orange-200",
      sisa: "bg-orange-50 text-orange-500",
    },
    warning: {
      bar: "from-amber-400 to-yellow-400",
      badge: "bg-amber-50 text-amber-600 border border-amber-200",
      sisa: "bg-amber-50 text-amber-500",
    },
    safe: {
      bar: "from-teal-400 to-emerald-500",
      badge: "bg-teal-50 text-teal-600 border border-teal-200",
      sisa: "bg-teal-50 text-teal-600",
    },
  };

  const stats = [
    {
      label: "Budget Bulanan",
      value: `Rp ${monthlyBudget.toLocaleString("id-ID")}`,
      accent: "#2563eb",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      ),
    },
    {
      label: "Total Pemasukan",
      value: `Rp ${totalIncomes.toLocaleString("id-ID")}`,
      accent: "#0f766e",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5m-7 7 7-7 7 7" />
        </svg>
      ),
    },
    {
      label: "Total Pengeluaran",
      value: `Rp ${totalExpenses.toLocaleString("id-ID")}`,
      accent: "#dc2626",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14m7-7-7 7-7-7" />
        </svg>
      ),
    },
    {
      label: "Saldo Bersih",
      value: `Rp ${netIncome.toLocaleString("id-ID")}`,
      accent: netIncome >= 0 ? "#0f766e" : "#dc2626",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  const handlePageChange = useCallback(
    (pageId) => {
      switch (pageId) {
        case "dashboard":
          navigate("/");
          break;
        case "laporan":
          navigate("/laporan");
          break;
        case "aktivitas":
          navigate("/aktivitas-pengguna");
          break;
        case "admin-laporan":
          navigate("/admin-laporan");
          break;
        default:
          navigate("/");
      }
    },
    [navigate],
  );

  const handleMonthChange = (event) => {
    startTransition(() => setSelectedMonth(parseInt(event.target.value)));
  };

  const handleYearChange = (event) => {
    startTransition(() => setSelectedYear(parseInt(event.target.value)));
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

  const onAddExpense = async (newExpense) => {
    try {
      setIsLoading(true);
      const response = await createExpense(newExpense);
      if (response.data && response.data.data) {
        setExpenses((prev) => [response.data.data, ...prev]);
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
            expense._id === id ? response.data.data : expense,
          ),
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

  const handleEditExpense = (expense) => setExpenseEdit(expense);

  // Income handlers
  const onAddIncome = async (newIncome) => {
    try {
      setIsLoading(true);
      console.log("📝 Adding new income:", newIncome);
      const response = await createIncome(newIncome, telegramId);
      console.log("Response from createIncome:", response);
      const newIncomeData = response?.data?.data || response?.data;
      if (newIncomeData) {
        setIncomes((prev) => [newIncomeData, ...prev]);
        apiCache.invalidate(`incomes_${telegramId}`);
        console.log("✅ Income added successfully to state");
      } else {
        throw new Error("No data returned from server");
      }
    } catch (error) {
      console.error("Error adding income:", error);
      toast.error("❌ Gagal menambahkan pemasukan", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateIncome = async (updatedIncome) => {
    try {
      setIsLoading(true);
      const { id, ...incomeData } = updatedIncome;
      console.log("📝 Updating income with correct params:", {
        incomeId: id,
        incomeData,
        telegramId,
      });
      const response = await editIncome(id, incomeData, telegramId);
      console.log("Response from editIncome:", response);
      const updatedData = response?.data?.data || response?.data;
      if (updatedData) {
        setIncomes((prev) =>
          prev.map((income) => (income._id === id ? updatedData : income)),
        );
        apiCache.invalidate(`incomes_${telegramId}`);
        toast.success("✅ Pemasukan berhasil diperbarui", {
          position: "top-right",
          autoClose: 3000,
        });
        console.log("✅ Income updated successfully in state");
      } else {
        throw new Error("No data returned from server");
      }
    } catch (error) {
      console.error("Error updating income:", error);
      toast.error("❌ Gagal memperbarui pemasukan", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDeleteIncome = async (id) => {
    try {
      setIsLoading(true);
      const response = await deleteIncome(id, telegramId);
      if (response.data && response.data.success) {
        setIncomes((prev) => prev.filter((income) => income._id !== id));
        apiCache.invalidate(`incomes_${telegramId}`);
        toast.success("✅ Pemasukan berhasil dihapus");
      }
    } catch (error) {
      console.error("Error deleting income:", error);
      if (error.response && error.response.status === 400) {
        const errorMessage =
          error.response.data?.message ||
          "Income tidak bisa dihapus karena sudah dipakai pada pengeluaran";
        toast.warning(errorMessage, { position: "top-right", autoClose: 5000 });
      } else {
        toast.error("❌ Gagal menghapus pemasukan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditIncome = (income) => setIncomeEdit(income);

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

  const fetchAllData = useCallback(async () => {
    try {
      const [userResponse, expenseResponse, incomeResponse] = await Promise.all(
        [getUserData(telegramId), getExpenses(), getIncomes()],
      );
      setMonthlyBudget(userResponse.data.data.budgetMontly);
      setExpenses(expenseResponse.data.data);
      setIncomes(incomeResponse.data.data);
      setIsDataReady(true);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsDataReady(true);
    }
  }, [telegramId]);

  const refreshAllData = useCallback(async () => {
    try {
      const [expenseResponse, incomeResponse] = await Promise.all([
        getExpenses(),
        getIncomes(),
      ]);
      setExpenses(expenseResponse.data.data);
      setIncomes(incomeResponse.data.data);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, [telegramId]);

  useEffect(() => {
    if (telegramId && !isDataReady) {
      const timeoutId = setTimeout(() => fetchAllData(), 50);
      return () => clearTimeout(timeoutId);
    }
  }, [telegramId, isDataReady, fetchAllData]);

  // Refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime;
        if (timeSinceLastRefresh > 5 * 60 * 1000) refreshAllData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lastRefreshTime, refreshAllData]);

  useEffect(() => {
    if (!telegramId) return;
    const timeoutId = requestIdleCallback(
      async () => {
        try {
          const pusher = new window.Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
          });
          const channel = pusher.subscribe(
            import.meta.env.VITE_PUSHER_SUBSCRIBE,
          );
          channel.bind(import.meta.env.VITE_PUSHER_BIND, (data) => {
            if (data && data.expense && data.telegramId === telegramId) {
              const newExpense = {
                _id: data.expense._id || `temp-${Date.now()}`,
                name: data.expense.name,
                amount: data.expense.amount,
                category: data.expense.category,
                date: data.expense.date,
                telegramId: data.telegramId,
              };
              setExpenses((prev) => {
                const exists = prev.some((exp) => exp._id === newExpense._id);
                if (!exists) {
                  apiCache.invalidate(`expenses_${telegramId}`);
                  return [newExpense, ...prev];
                }
                return prev;
              });
            }
          });
          channel.bind("income-added", (data) => {
            if (data && data.income && data.telegramId === telegramId) {
              const newIncome = {
                _id: data.income._id || `temp-${Date.now()}`,
                name: data.income.name,
                amount: data.income.amount,
                source: data.income.source,
                notes: data.income.notes,
                date: data.income.date,
                telegramId: data.telegramId,
              };
              setIncomes((prev) => {
                const exists = prev.some((inc) => inc._id === newIncome._id);
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
      },
      { timeout: 5000 },
    );
    return () => cancelIdleCallback(timeoutId);
  }, [telegramId]);

  useEffect(() => {
    if (!isExpense) refreshAllData();
  }, [isExpense, refreshAllData]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --brand: #0f766e;
          --brand-light: #14b8a6;
          --brand-muted: #ccfbf1;
          --surface: #ffffff;
          --surface-2: #f8fafc;
          --border: #e2e8f0;
          --text-1: #0f172a;
          --text-2: #475569;
          --text-3: #94a3b8;
          --radius: 16px;
          --radius-sm: 10px;
          --shadow: 0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .06);
          --shadow-md: 0 4px 16px -2px rgb(0 0 0 / .08), 0 2px 6px -2px rgb(0 0 0 / .05);
        }

        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        .dash-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow);
        }

        .dash-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.25rem 1.5rem;
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
          transition: box-shadow .2s, transform .2s;
        }
        .dash-stat-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .dash-btn-primary {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .6rem 1.25rem;
          background: var(--brand);
          color: #fff;
          border-radius: var(--radius-sm);
          font-size: .875rem; font-weight: 600;
          transition: background .2s, box-shadow .2s, transform .15s;
          border: none; cursor: pointer;
        }
        .dash-btn-primary:hover { background: #0d6a62; box-shadow: 0 4px 12px rgb(15 118 110 / .3); transform: translateY(-1px); }
        .dash-btn-primary:disabled { opacity: .65; cursor: not-allowed; transform: none; }

        .dash-btn-secondary {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .6rem 1.25rem;
          background: var(--surface-2);
          color: var(--text-2);
          border-radius: var(--radius-sm);
          font-size: .875rem; font-weight: 600;
          border: 1px solid var(--border); cursor: pointer;
          transition: background .2s, border-color .2s, transform .15s;
        }
        .dash-btn-secondary:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); }

        .dash-btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          padding: .5rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-2);
          cursor: pointer; transition: all .15s;
        }
        .dash-btn-ghost:hover { background: var(--surface-2); color: var(--text-1); }

        .dash-select {
          padding: .5rem .875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          color: var(--text-1);
          font-size: .875rem; font-weight: 500;
          outline: none; cursor: pointer;
          transition: border-color .2s, box-shadow .2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right .75rem center;
          padding-right: 2rem;
        }
        .dash-select:focus { border-color: var(--brand-light); box-shadow: 0 0 0 3px rgb(20 184 166 / .15); }

        .toggle-pill {
          display: flex;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }
        .toggle-pill button {
          flex: 1;
          padding: .6rem 1.5rem;
          border-radius: 9px;
          font-weight: 700;
          font-size: .9rem;
          border: none; cursor: pointer;
          transition: all .25s cubic-bezier(.4,0,.2,1);
          display: flex; align-items: center; justify-content: center; gap: .4rem;
        }
        .toggle-pill .active-expense {
          background: #0f766e;
          color: #fff;
          box-shadow: 0 2px 8px rgb(15 118 110 / .35);
        }
        .toggle-pill .active-income {
          background: #1d4ed8;
          color: #fff;
          box-shadow: 0 2px 8px rgb(29 78 216 / .3);
        }
        .toggle-pill .inactive {
          background: transparent;
          color: var(--text-2);
        }
        .toggle-pill .inactive:hover { background: var(--surface); color: var(--text-1); }

        .progress-track {
          height: 10px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgb(0 0 0 / .07);
        }
        .progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 1.1s cubic-bezier(.4,0,.2,1);
        }

        .section-label {
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: var(--text-3);
          margin-bottom: .75rem;
        }

        .mono { font-family: 'DM Mono', monospace; }

        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div
        className="flex"
        style={{ background: "#f8fafc", minHeight: "100vh" }}
      >
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onCollapseChange={setIsSidebarCollapsed}
        />

        <main style={{ flex: 1, minHeight: "100vh", padding: "2rem" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".6rem",
                      marginBottom: ".25rem",
                    }}
                  >
                    <h1
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "var(--text-1)",
                        letterSpacing: "-.02em",
                      }}
                    >
                      Dashboard Keuangan
                    </h1>
                  </div>
                  <p
                    style={{
                      fontSize: ".875rem",
                      color: "var(--text-3)",
                      fontWeight: 500,
                    }}
                  >
                    Kelola pengeluaran dan pemasukan Anda dengan mudah
                  </p>
                </div>

                <button
                  onClick={() => {
                    setOriginalMonthlyBudget(monthlyBudget);
                    setShowBudgetModal(true);
                  }}
                  className="dash-btn-primary"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                  Set Budget
                </button>
              </div>
            </div>

            <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".75rem",
                  }}
                >
                  <button
                    aria-label="goToPreviousMonth"
                    onClick={goToPreviousMonth}
                    className="dash-btn-ghost"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  <div style={{ textAlign: "center", minWidth: 160 }}>
                    <div
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        color: "var(--text-1)",
                        letterSpacing: "-.02em",
                      }}
                    >
                      {monthNames[selectedMonth]} {selectedYear}
                    </div>
                    <div
                      style={{
                        fontSize: ".75rem",
                        color: "var(--text-3)",
                        fontWeight: 500,
                        marginTop: 2,
                      }}
                    >
                      Periode Aktif
                    </div>
                  </div>

                  <button
                    aria-label="goToNextMonth"
                    onClick={goToNextMonth}
                    className="dash-btn-ghost"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                  }}
                >
                  <select
                    aria-label="Pilih Bulan"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="dash-select"
                  >
                    {monthNames.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Pilih Tahun"
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="dash-select"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={goToCurrentMonth}
                    className="dash-btn-secondary"
                    style={{ fontSize: ".8rem" }}
                  >
                    Bulan Ini
                  </button>
                </div>
              </div>
            </div>

            {!isDataReady ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                {stats.map((item) => (
                  <StatCard key={item.label} {...item} />
                ))}
              </div>
            )}

            {monthlyBudget > 0 && (
              <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: ".75rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".5rem",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--brand)",
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--text-1)",
                        fontSize: ".95rem",
                      }}
                    >
                      Progress Budget Bulanan
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${warningConfig[warningLevel].badge}`}
                      style={{ fontSize: ".78rem" }}
                    >
                      {Math.round(budgetPercentage)}% terpakai
                    </span>
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${warningConfig[warningLevel].sisa}`}
                      style={{ fontSize: ".78rem", fontWeight: 500 }}
                    >
                      Sisa: Rp{" "}
                      {(monthlyBudget - totalExpenses).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill bg-gradient-to-r ${warningConfig[warningLevel].bar}`}
                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: ".5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".72rem",
                      color: "var(--text-3)",
                      fontWeight: 500,
                    }}
                    className="mono"
                  >
                    Rp 0
                  </span>
                  <span
                    style={{
                      fontSize: ".72rem",
                      color: "var(--text-3)",
                      fontWeight: 500,
                    }}
                    className="mono"
                  >
                    Rp {monthlyBudget.toLocaleString("id-ID")}
                  </span>
                </div>

                {budgetPercentage > 100 && (
                  <div
                    style={{
                      marginTop: ".875rem",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: ".4rem",
                        fontSize: ".8rem",
                        fontWeight: 600,
                        background: "#fef2f2",
                        color: "#dc2626",
                        padding: ".4rem .875rem",
                        borderRadius: 99,
                        border: "1px solid #fecaca",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Melebihi budget sebesar Rp{" "}
                      {(totalExpenses - monthlyBudget).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", marginBottom: "1.5rem" }}>
              <div className="toggle-pill">
                <button
                  onClick={handleToggleToExpense}
                  className={isExpense ? "active-expense" : "inactive"}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5m-7 7 7-7 7 7" />
                  </svg>
                  Pengeluaran
                </button>
                <button
                  onClick={handleToggleToIncome}
                  className={!isExpense ? "active-income" : "inactive"}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14m7-7-7 7-7-7" />
                  </svg>
                  Pemasukan
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isSidebarCollapsed ? "1fr 1fr" : "1fr",
                gap: "1.25rem",
                alignItems: "start",
              }}
              className={isSidebarCollapsed ? "xl:grid-cols-2" : ""}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <Suspense fallback={<FormSkeleton />}>
                  {isExpense ? (
                    <ExpenseForm
                      onAddExpense={onAddExpense}
                      expensesData={expenses}
                      incomesData={incomes}
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

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <Suspense fallback={<ChartSkeleton />}>
                  <div className="dash-card">
                    <div className="section-label">Grafik Transaksi</div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-1)",
                        fontSize: ".95rem",
                        marginBottom: "1rem",
                      }}
                    >
                      Pemasukan &amp; Pengeluaran
                    </div>

                    {!isDataReady ? (
                      <div
                        style={{
                          height: 256,
                          background: "#f1f5f9",
                          borderRadius: 12,
                        }}
                        className="animate-pulse"
                      />
                    ) : filteredExpenses.length > 0 ||
                      filteredIncomes.length > 0 ? (
                      <Chart
                        expenses={filteredExpenses}
                        incomes={filteredIncomes}
                      />
                    ) : (
                      <EmptyState
                        icon={
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                          </svg>
                        }
                        title="Belum Ada Data Transaksi"
                        subtitle="Tambahkan pemasukan atau pengeluaran untuk melihat grafik"
                      />
                    )}
                  </div>
                </Suspense>

                {isExpense && (
                  <Suspense fallback={<ChartSkeleton />}>
                    <div className="dash-card">
                      <div className="section-label">Breakdown</div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text-1)",
                          fontSize: ".95rem",
                          marginBottom: "1rem",
                        }}
                      >
                        Kategori Pengeluaran
                      </div>
                      {filteredExpenses.length > 0 ? (
                        <CategoryBreakdown expenses={filteredExpenses} />
                      ) : (
                        <EmptyState
                          icon={
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#94a3b8"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="2" y="3" width="6" height="6" rx="1" />
                              <rect x="16" y="3" width="6" height="6" rx="1" />
                              <rect x="2" y="15" width="6" height="6" rx="1" />
                              <rect x="16" y="15" width="6" height="6" rx="1" />
                            </svg>
                          }
                          title="Belum Ada Kategori"
                          subtitle="Kategori pengeluaran akan muncul setelah Anda menambahkan data"
                        />
                      )}
                    </div>
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </main>

        {showBudgetModal && (
          <Suspense
            fallback={
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgb(0 0 0 / .45)",
                  backdropFilter: "blur(4px)",
                  zIndex: 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    padding: 32,
                    width: 340,
                  }}
                  className="animate-pulse"
                >
                  <div
                    style={{
                      height: 28,
                      background: "#e2e8f0",
                      borderRadius: 8,
                      width: "60%",
                      marginBottom: 16,
                    }}
                  />
                  <div
                    style={{
                      height: 44,
                      background: "#f1f5f9",
                      borderRadius: 10,
                      marginBottom: 12,
                    }}
                  />
                  <div
                    style={{
                      height: 40,
                      background: "#f1f5f9",
                      borderRadius: 10,
                    }}
                  />
                </div>
              </div>
            }
          >
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

export default Dashboard;
