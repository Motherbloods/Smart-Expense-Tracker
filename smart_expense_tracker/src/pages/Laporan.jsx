import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { getExpenses } from "../api/expenseService";
import { getIncomes } from "../api/incomeService";
import { getUserData } from "../api/loginService";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import openUserPrintWindow from "../utils/userPrintUtils";
import useNavigation from "../hooks/useNavigation";

const CATEGORY_COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
  "#9333ea",
  "#e11d48",
];

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
    () => filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    [filteredExpenses],
  );

  const totalIncomes = useMemo(
    () => filteredIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0),
    [filteredIncomes],
  );

  const netIncome = totalIncomes - totalExpenses;
  const budgetPercentage =
    monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  const categoryBreakdown = useMemo(
    () =>
      filteredExpenses.reduce((acc, expense) => {
        const category = expense.category || "Lainnya";
        if (!acc[category]) acc[category] = { total: 0, count: 0, items: [] };
        acc[category].total += Number(expense.amount);
        acc[category].count += 1;
        acc[category].items.push(expense);
        return acc;
      }, {}),
    [filteredExpenses],
  );

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

  const fetchCriticalData = useCallback(async () => {
    try {
      const userResponse = await getUserData(telegramId);
      setMonthlyBudget(userResponse.data.data.budgetMontly);
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  }, [telegramId]);

  const fetchNonCriticalData = useCallback(async () => {
    try {
      const [expenseResponse, incomeResponse] = await Promise.all([
        getExpenses(),
        getIncomes(),
      ]);
      setExpenses(expenseResponse.data.data);
      setIncomes(incomeResponse.data.data);
      setIsDataReady(true);
    } catch (error) {
      console.error("Error fetching transactions", error);
      setIsDataReady(true);
    }
  }, []);

  useEffect(() => {
    if (telegramId) fetchCriticalData();
  }, [telegramId, fetchCriticalData]);

  useEffect(() => {
    if (telegramId && !isDataReady) {
      const timeoutId = requestIdleCallback(() => fetchNonCriticalData(), {
        timeout: 2000,
      });
      return () => cancelIdleCallback(timeoutId);
    }
  }, [telegramId, isDataReady, fetchNonCriticalData]);

  const handleMonthChange = (event) => {
    startTransition(() => setSelectedMonth(parseInt(event.target.value)));
  };

  const handleYearChange = (event) => {
    startTransition(() => setSelectedYear(parseInt(event.target.value)));
  };

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
      monthNames,
    };
    openUserPrintWindow(reportData);
    toast.success("Membuka halaman print...");
  };

  const exportToCSV = () => {
    try {
      const csvData = [];
      csvData.push(["LAPORAN KEUANGAN"]);
      csvData.push([`Periode: ${monthNames[selectedMonth]} ${selectedYear}`]);
      csvData.push([]);
      csvData.push(["RINGKASAN"]);
      csvData.push([
        "Total Pemasukan",
        `Rp ${totalIncomes.toLocaleString("id-ID")}`,
      ]);
      csvData.push([
        "Total Pengeluaran",
        `Rp ${totalExpenses.toLocaleString("id-ID")}`,
      ]);
      csvData.push(["Saldo Bersih", `Rp ${netIncome.toLocaleString("id-ID")}`]);
      csvData.push([
        "Budget Bulanan",
        `Rp ${monthlyBudget.toLocaleString("id-ID")}`,
      ]);
      csvData.push(["Penggunaan Budget", `${Math.round(budgetPercentage)}%`]);
      csvData.push([]);
      csvData.push(["PENGELUARAN PER KATEGORI"]);
      csvData.push(["Kategori", "Total", "Persentase", "Jumlah Transaksi"]);
      if (Object.keys(categoryBreakdown).length > 0) {
        Object.entries(categoryBreakdown)
          .sort(([, a], [, b]) => b.total - a.total)
          .forEach(([category, data]) => {
            const percentage = (data.total / totalExpenses) * 100;
            csvData.push([
              category,
              data.total,
              `${Math.round(percentage)}%`,
              data.count,
            ]);
          });
      }
      csvData.push([]);
      csvData.push(["DETAIL PEMASUKAN"]);
      csvData.push(["Tanggal", "Nama", "Sumber", "Jumlah"]);
      if (filteredIncomes.length > 0) {
        filteredIncomes
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach((inc) => {
            csvData.push([
              new Date(inc.date).toLocaleDateString("id-ID"),
              inc.name,
              inc.source || "-",
              inc.amount,
            ]);
          });
      } else {
        csvData.push(["Belum ada data pemasukan"]);
      }
      csvData.push([]);
      csvData.push(["DETAIL PENGELUARAN"]);
      csvData.push(["Tanggal", "Nama", "Kategori", "Jumlah"]);
      if (filteredExpenses.length > 0) {
        filteredExpenses
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach((exp) => {
            csvData.push([
              new Date(exp.date).toLocaleDateString("id-ID"),
              exp.name,
              exp.category,
              exp.amount,
            ]);
          });
      } else {
        csvData.push(["Belum ada data pengeluaran"]);
      }

      const csvContent = csvData
        .map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell);
              if (
                cellStr.includes(",") ||
                cellStr.includes('"') ||
                cellStr.includes("\n")
              ) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(","),
        )
        .join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
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

  const sortedCategories = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b.total - a.total,
  );
  const top5Expenses = [...filteredExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const warningLevel =
    budgetPercentage >= 100
      ? "exceeded"
      : budgetPercentage >= 90
        ? "critical"
        : budgetPercentage >= 70
          ? "warning"
          : "safe";

  const budgetBarColor = {
    exceeded: "#ef4444",
    critical: "#f97316",
    warning: "#f59e0b",
    safe: "#0f766e",
  }[warningLevel];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .lap-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .lap-mono { font-family: 'DM Mono', monospace; }

        .lap-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / .05), 0 1px 2px -1px rgb(0 0 0 / .05);
        }

        .lap-stat {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / .05);
          position: relative;
          overflow: hidden;
          transition: box-shadow .2s, transform .2s;
        }
        .lap-stat:hover { box-shadow: 0 4px 16px -2px rgb(0 0 0 / .08); transform: translateY(-1px); }

        .lap-select {
          padding: .5rem .875rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          color: #0f172a;
          font-size: .875rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right .75rem center;
          padding-right: 2rem;
          transition: border-color .2s, box-shadow .2s;
        }
        .lap-select:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgb(20 184 166 / .15); }
        .lap-select:disabled { opacity: .6; cursor: not-allowed; }

        .lap-btn {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .6rem 1.25rem;
          border-radius: 10px;
          font-size: .875rem; font-weight: 600;
          border: none; cursor: pointer;
          transition: all .2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .lap-btn:hover { transform: translateY(-1px); }
        .lap-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }

        .lap-btn-slate {
          background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
        }
        .lap-btn-slate:hover { background: #e2e8f0; }

        .lap-btn-red {
          background: #ef4444; color: #fff;
          box-shadow: 0 2px 8px rgb(239 68 68 / .25);
        }
        .lap-btn-red:hover { background: #dc2626; box-shadow: 0 4px 12px rgb(239 68 68 / .3); }

        .lap-btn-teal {
          background: #0f766e; color: #fff;
          box-shadow: 0 2px 8px rgb(15 118 110 / .25);
        }
        .lap-btn-teal:hover { background: #0d6a62; box-shadow: 0 4px 12px rgb(15 118 110 / .3); }

        .lap-section-label {
          font-size: .7rem; font-weight: 700;
          letter-spacing: .07em; text-transform: uppercase;
          color: #94a3b8; margin-bottom: .625rem;
        }

        .lap-progress-track {
          height: 8px; background: #f1f5f9;
          border-radius: 99px; overflow: hidden;
          box-shadow: inset 0 1px 2px rgb(0 0 0 / .06);
        }
        .lap-progress-fill {
          height: 100%; border-radius: 99px;
          transition: width 1s cubic-bezier(.4,0,.2,1);
        }

        .lap-row-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: .75rem 1rem;
          border-radius: 12px;
          border: 1px solid transparent;
          transition: background .15s;
        }

        .lap-scrollbox {
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
        .lap-scrollbox::-webkit-scrollbar { width: 4px; }
        .lap-scrollbox::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

        .lap-divider { height: 1px; background: #f1f5f9; margin: .5rem 0; }

        .lap-badge {
          display: inline-flex; align-items: center;
          padding: .2rem .625rem;
          border-radius: 99px;
          font-size: .7rem; font-weight: 600;
          letter-spacing: .01em;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .lap-fadein { animation: fadeIn .3s ease both; }
      `}</style>

      <div
        className="lap-root"
        style={{ display: "flex", background: "#f8fafc", minHeight: "100vh" }}
      >
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onCollapseChange={setIsSidebarCollapsed}
        />

        <main style={{ flex: 1, minHeight: "100vh", padding: "2rem" }}>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div className="lap-card">
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
                      gap: ".625rem",
                      marginBottom: ".25rem",
                    }}
                  >
                    <h1
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        letterSpacing: "-.02em",
                      }}
                    >
                      Laporan Keuangan
                    </h1>
                  </div>
                  <p
                    style={{
                      fontSize: ".875rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                      marginLeft: 1,
                    }}
                  >
                    Ringkasan dan analisis keuangan bulanan Anda
                  </p>
                </div>
              </div>
            </div>

            <div className="lap-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                  }}
                >
                  <Calendar size={16} color="#0f766e" />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: ".95rem",
                      color: "#0f172a",
                    }}
                  >
                    Pilih Periode
                  </span>
                  {isPending && (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #14b8a6",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  )}
                </div>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    disabled={isPending}
                    className="lap-select"
                  >
                    {monthNames.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    disabled={isPending}
                    className="lap-select"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".375rem",
                    padding: ".3rem .875rem",
                    borderRadius: 99,
                    background: "#f0fdf9",
                    border: "1px solid #99f6e4",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    color: "#0f766e",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#0f766e",
                    }}
                  />
                  {monthNames[selectedMonth]} {selectedYear}
                </div>
                <span style={{ fontSize: ".75rem", color: "#94a3b8" }}>
                  {filteredExpenses.length + filteredIncomes.length} total
                  transaksi
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "1rem",
              }}
            >
              {[
                {
                  label: "Total Pemasukan",
                  accent: "#0f766e",
                  value: `Rp ${totalIncomes.toLocaleString("id-ID")}`,
                  sub: `${filteredIncomes.length} transaksi`,
                  icon: <TrendingUp size={16} />,
                },
                {
                  label: "Total Pengeluaran",
                  accent: "#dc2626",
                  value: `Rp ${totalExpenses.toLocaleString("id-ID")}`,
                  sub: `${filteredExpenses.length} transaksi`,
                  icon: <TrendingDown size={16} />,
                },
                {
                  label: "Saldo Bersih",
                  accent: netIncome >= 0 ? "#0f766e" : "#dc2626",
                  value: `Rp ${netIncome.toLocaleString("id-ID")}`,
                  sub: netIncome >= 0 ? "Surplus" : "Defisit",
                  icon: <DollarSign size={16} />,
                },
                {
                  label: "Penggunaan Budget",
                  accent: "#7c3aed",
                  value: `${Math.round(budgetPercentage)}%`,
                  sub: `dari Rp ${monthlyBudget.toLocaleString("id-ID")}`,
                  icon: <FileText size={16} />,
                },
              ].map(({ label, accent, value, sub, icon }) => (
                <div key={label} className="lap-stat lap-fadein">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: ".75rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: ".72rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                      }}
                    >
                      {label}
                    </span>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: accent + "15",
                        color: accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {icon}
                    </div>
                  </div>
                  <div
                    className="lap-mono"
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: "-.01em",
                      marginBottom: ".25rem",
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: ".72rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    {sub}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: accent,
                      borderRadius: "0 0 16px 16px",
                      opacity: 0.15,
                    }}
                  />
                </div>
              ))}
            </div>

            {monthlyBudget > 0 && (
              <div className="lap-card lap-fadein">
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
                        background: budgetBarColor,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: ".9rem",
                      }}
                    >
                      Progress Budget Bulanan
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: ".5rem" }}>
                    <span
                      className="lap-badge"
                      style={{
                        background: budgetBarColor + "15",
                        color: budgetBarColor,
                        border: `1px solid ${budgetBarColor}30`,
                      }}
                    >
                      {Math.round(budgetPercentage)}% terpakai
                    </span>
                    <span
                      className="lap-badge"
                      style={{
                        background: "#f8fafc",
                        color: "#64748b",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Sisa Rp{" "}
                      {(monthlyBudget - totalExpenses).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="lap-progress-track">
                  <div
                    className="lap-progress-fill"
                    style={{
                      width: `${Math.min(budgetPercentage, 100)}%`,
                      background: budgetBarColor,
                    }}
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
                    className="lap-mono"
                    style={{ fontSize: ".7rem", color: "#94a3b8" }}
                  >
                    Rp 0
                  </span>
                  <span
                    className="lap-mono"
                    style={{ fontSize: ".7rem", color: "#94a3b8" }}
                  >
                    Rp {monthlyBudget.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div className="lap-card lap-fadein">
                <div className="lap-section-label">Breakdown</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: ".95rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  Pengeluaran per Kategori
                </div>
                {sortedCategories.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".875rem",
                    }}
                  >
                    {sortedCategories.map(([category, data], idx) => {
                      const pct = (data.total / totalExpenses) * 100;
                      const color =
                        CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      return (
                        <div key={category}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: ".4rem",
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
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  background: color,
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: ".85rem",
                                  fontWeight: 600,
                                  color: "#334155",
                                }}
                              >
                                {category}
                              </span>
                              <span
                                style={{ fontSize: ".72rem", color: "#94a3b8" }}
                              >
                                ({data.count}x)
                              </span>
                            </div>
                            <span
                              className="lap-mono"
                              style={{
                                fontSize: ".8rem",
                                fontWeight: 700,
                                color: "#0f172a",
                              }}
                            >
                              Rp {data.total.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div
                            className="lap-progress-track"
                            style={{ height: 6 }}
                          >
                            <div
                              className="lap-progress-fill"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <div
                            style={{ textAlign: "right", marginTop: ".25rem" }}
                          >
                            <span
                              style={{ fontSize: ".68rem", color: "#94a3b8" }}
                            >
                              {Math.round(pct)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyPlaceholder
                    icon={<TrendingDown size={22} color="#cbd5e1" />}
                    text="Belum ada data pengeluaran"
                  />
                )}
              </div>

              <div className="lap-card lap-fadein">
                <div className="lap-section-label">Ranking</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: ".95rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  5 Pengeluaran Terbesar
                </div>
                {top5Expenses.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".625rem",
                    }}
                  >
                    {top5Expenses.map((expense, index) => (
                      <div
                        key={expense._id}
                        className="lap-row-item"
                        style={{
                          background: index === 0 ? "#fff7ed" : "#f8fafc",
                          border: `1px solid ${index === 0 ? "#fed7aa" : "#f1f5f9"}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".75rem",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              flexShrink: 0,
                              background:
                                index === 0
                                  ? "#f97316"
                                  : index === 1
                                    ? "#64748b"
                                    : index === 2
                                      ? "#b45309"
                                      : "#e2e8f0",
                              color: index < 3 ? "#fff" : "#64748b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: ".75rem",
                              fontWeight: 800,
                            }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: ".85rem",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {expense.name}
                            </div>
                            <div
                              style={{ fontSize: ".72rem", color: "#94a3b8" }}
                            >
                              {new Date(expense.date).toLocaleDateString(
                                "id-ID",
                              )}
                            </div>
                          </div>
                        </div>
                        <span
                          className="lap-mono"
                          style={{
                            fontSize: ".85rem",
                            fontWeight: 700,
                            color: "#dc2626",
                          }}
                        >
                          Rp {expense.amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPlaceholder
                    icon={<TrendingDown size={22} color="#cbd5e1" />}
                    text="Belum ada data pengeluaran"
                  />
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div className="lap-card lap-fadein">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={15} color="#16a34a" />
                  </div>
                  <div>
                    <div className="lap-section-label" style={{ margin: 0 }}>
                      Transaksi
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: ".9rem",
                      }}
                    >
                      Detail Pemasukan
                    </div>
                  </div>
                </div>

                {filteredIncomes.length > 0 ? (
                  <div
                    className="lap-scrollbox"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".5rem",
                    }}
                  >
                    {filteredIncomes
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((income) => (
                        <div
                          key={income._id}
                          className="lap-row-item"
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: ".85rem",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {income.name}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: ".375rem",
                                marginTop: ".2rem",
                              }}
                            >
                              <span
                                style={{ fontSize: ".7rem", color: "#94a3b8" }}
                              >
                                {new Date(income.date).toLocaleDateString(
                                  "id-ID",
                                )}
                              </span>
                              {income.source && (
                                <span
                                  className="lap-badge"
                                  style={{
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    border: "1px solid #bbf7d0",
                                    padding: ".1rem .5rem",
                                  }}
                                >
                                  {income.source}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className="lap-mono"
                            style={{
                              fontSize: ".85rem",
                              fontWeight: 700,
                              color: "#16a34a",
                              flexShrink: 0,
                            }}
                          >
                            Rp {income.amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyPlaceholder
                    icon={<TrendingUp size={22} color="#cbd5e1" />}
                    text="Belum ada data pemasukan"
                  />
                )}
              </div>

              <div className="lap-card lap-fadein">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "#fff1f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingDown size={15} color="#dc2626" />
                  </div>
                  <div>
                    <div className="lap-section-label" style={{ margin: 0 }}>
                      Transaksi
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: ".9rem",
                      }}
                    >
                      Detail Pengeluaran
                    </div>
                  </div>
                </div>

                {filteredExpenses.length > 0 ? (
                  <div
                    className="lap-scrollbox"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".5rem",
                    }}
                  >
                    {filteredExpenses
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((expense) => (
                        <div
                          key={expense._id}
                          className="lap-row-item"
                          style={{
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: ".85rem",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {expense.name}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: ".375rem",
                                marginTop: ".2rem",
                              }}
                            >
                              <span
                                style={{ fontSize: ".7rem", color: "#94a3b8" }}
                              >
                                {new Date(expense.date).toLocaleDateString(
                                  "id-ID",
                                )}
                              </span>
                              <span
                                className="lap-badge"
                                style={{
                                  background: "#ffe4e6",
                                  color: "#be123c",
                                  border: "1px solid #fecdd3",
                                  padding: ".1rem .5rem",
                                }}
                              >
                                {expense.category}
                              </span>
                            </div>
                          </div>
                          <span
                            className="lap-mono"
                            style={{
                              fontSize: ".85rem",
                              fontWeight: 700,
                              color: "#dc2626",
                              flexShrink: 0,
                            }}
                          >
                            Rp {expense.amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyPlaceholder
                    icon={<TrendingDown size={22} color="#cbd5e1" />}
                    text="Belum ada data pengeluaran"
                  />
                )}
              </div>
            </div>

            <div className="lap-card lap-fadein">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                  marginBottom: "1rem",
                }}
              >
                <Download size={16} color="#0f766e" />
                <span
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: ".95rem",
                  }}
                >
                  Export Laporan
                </span>
              </div>
              <p
                style={{
                  fontSize: ".8rem",
                  color: "#94a3b8",
                  marginBottom: "1rem",
                }}
              >
                Unduh laporan {monthNames[selectedMonth]} {selectedYear} dalam
                format pilihan Anda
              </p>
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <button onClick={exportToPDF} className="lap-btn lap-btn-red">
                  <Download size={14} />
                  Export ke PDF
                </button>
                <button onClick={exportToCSV} className="lap-btn lap-btn-teal">
                  <Download size={14} />
                  Export ke CSV
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function EmptyPlaceholder({ icon, text }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1rem",
        color: "#94a3b8",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: ".875rem",
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: ".85rem", fontWeight: 500, color: "#cbd5e1" }}>
        {text}
      </p>
    </div>
  );
}

export default Laporan;
