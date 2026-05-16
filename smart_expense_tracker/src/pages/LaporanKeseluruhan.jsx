import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";
import Sidebar from "../components/sidebar/Sidebar";
import useNavigation from "../hooks/useNavigation";
import {
  getAllUsers,
  getAllExpenses,
  getAllIncomes,
  invalidateAdminCache,
} from "../api/adminService";
import toast from "react-hot-toast";
import openPrintWindow from "../utils/printUtils";

const CAT_COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#db2777", "#ea580c"];

const USER_RANK_COLORS = [
  "#f97316",
  "#64748b",
  "#b45309",
  "#94a3b8",
  "#94a3b8",
];

function AdminLaporan() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [_, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  const { currentPage, handlePageChange } = useNavigation();

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

  const fetchData = async (showToast = false) => {
    try {
      setLoading(true);
      const [usersRes, expensesRes, incomesRes] = await Promise.all([
        getAllUsers(),
        getAllExpenses(selectedMonth + 1, selectedYear),
        getAllIncomes(selectedMonth + 1, selectedYear),
      ]);
      setUsers(usersRes.data?.data || []);
      setExpenses(expensesRes.data?.data || []);
      setIncomes(incomesRes.data?.data || []);
      if (showToast) toast.success("Data berhasil direfresh!");
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Gagal mengambil data laporan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleRefresh = async () => {
    setRefreshing(true);
    invalidateAdminCache();
    await fetchData(true);
  };

  const allExpenses = useMemo(
    () => expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [expenses],
  );

  const allIncomes = useMemo(
    () => incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0),
    [incomes],
  );

  const totalUsers = users.length;
  const netIncome = allIncomes - allExpenses;

  const categoryBreakdown = useMemo(
    () =>
      expenses.reduce((acc, expense) => {
        const category = expense.category || "Lainnya";
        if (!acc[category]) acc[category] = { total: 0, count: 0 };
        acc[category].total += expense.amount || 0;
        acc[category].count += 1;
        return acc;
      }, {}),
    [expenses],
  );

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5);

  const userStats = useMemo(() => {
    return users.map((user) => {
      const userIncomes = incomes
        .filter(
          (inc) =>
            inc.telegramId === user.telegramId ||
            inc.userId === user._id ||
            inc.userId === user.telegramId,
        )
        .reduce((sum, inc) => sum + (inc.amount || 0), 0);

      const userExpenses = expenses
        .filter(
          (exp) =>
            exp.telegramId === user.telegramId ||
            exp.userId === user._id ||
            exp.userId === user.telegramId,
        )
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      return {
        ...user,
        totalIncome: userIncomes,
        totalExpense: userExpenses,
        netIncome: userIncomes - userExpenses,
      };
    });
  }, [users, incomes, expenses]);

  const topUsers = userStats
    .sort((a, b) => b.totalIncome - a.totalIncome)
    .slice(0, 5);

  const getUserName = (telegramId) => {
    const user = users.find(
      (u) => u.telegramId === telegramId || u._id === telegramId,
    );
    return user?.name || user?.username || "Unknown User";
  };

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
      monthNames,
    };
    openPrintWindow(reportData);
    toast.success("Membuka halaman print...");
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "LAPORAN KEUANGAN ADMIN\n";
      csvContent += `Periode:,${monthNames[selectedMonth]} ${selectedYear}\n`;
      csvContent += `Tanggal Export:,${new Date().toLocaleDateString("id-ID")}\n\n`;
      csvContent += "RINGKASAN\n";
      csvContent += "Kategori,Jumlah\n";
      csvContent += `Total User,${totalUsers}\n`;
      csvContent += `Total Pemasukan,${allIncomes}\n`;
      csvContent += `Total Pengeluaran,${allExpenses}\n`;
      csvContent += `Saldo Bersih,${netIncome}\n\n`;
      csvContent += "TOP 5 KATEGORI PENGELUARAN\n";
      csvContent += "No,Kategori,Total,Jumlah Transaksi,Persentase\n";
      topCategories.forEach(([category, data], index) => {
        const percentage = Math.round((data.total / allExpenses) * 100);
        csvContent += `${index + 1},${category},${data.total},${data.count},${percentage}%\n`;
      });
      csvContent += "\n";
      csvContent += "TOP 5 PENGGUNA\n";
      csvContent += "No,Nama,Pemasukan,Pengeluaran,Bersih\n";
      topUsers.forEach((user, index) => {
        csvContent += `${index + 1},${user.name || user.username},${user.totalIncome},${user.totalExpense},${user.netIncome}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `laporan_${monthNames[selectedMonth]}_${selectedYear}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV berhasil didownload!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Gagal export CSV");
    }
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

    .adm-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
    .adm-mono { font-family: 'DM Mono', monospace; }

    .adm-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgb(0 0 0/.05), 0 1px 2px -1px rgb(0 0 0/.05);
    }

    .adm-stat {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px 0 rgb(0 0 0/.05);
      position: relative; overflow: hidden;
      transition: box-shadow .2s, transform .2s;
    }
    .adm-stat:hover { box-shadow: 0 4px 16px -2px rgb(0 0 0/.08); transform: translateY(-1px); }

    .adm-select {
      padding: .5rem .875rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      color: #0f172a;
      font-size: .875rem; font-weight: 500;
      font-family: 'Plus Jakarta Sans', sans-serif;
      outline: none; cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right .75rem center;
      padding-right: 2rem;
      transition: border-color .2s, box-shadow .2s;
    }
    .adm-select:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgb(20 184 166/.15); }

    .adm-btn {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .6rem 1.25rem;
      border-radius: 10px;
      font-size: .875rem; font-weight: 600;
      border: none; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all .2s;
    }
    .adm-btn:hover { transform: translateY(-1px); }
    .adm-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

    .adm-btn-slate { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
    .adm-btn-slate:hover { background:#e2e8f0; }
    .adm-btn-red { background:#ef4444; color:#fff; box-shadow:0 2px 8px rgb(239 68 68/.25); }
    .adm-btn-red:hover { background:#dc2626; }
    .adm-btn-teal { background:#0f766e; color:#fff; box-shadow:0 2px 8px rgb(15 118 110/.25); }
    .adm-btn-teal:hover { background:#0d6a62; }

    .adm-section-label {
      font-size:.7rem; font-weight:700;
      letter-spacing:.07em; text-transform:uppercase;
      color:#94a3b8; margin-bottom:.5rem;
    }

    .adm-progress-track {
      height:7px; background:#f1f5f9;
      border-radius:99px; overflow:hidden;
      box-shadow:inset 0 1px 2px rgb(0 0 0/.06);
    }
    .adm-progress-fill {
      height:100%; border-radius:99px;
      transition:width 1s cubic-bezier(.4,0,.2,1);
    }

    .adm-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:.75rem 1rem;
      border-radius:12px;
      border:1px solid transparent;
      transition:background .15s;
    }

    .adm-scrollbox {
      max-height:320px; overflow-y:auto;
      scrollbar-width:thin; scrollbar-color:#e2e8f0 transparent;
    }
    .adm-scrollbox::-webkit-scrollbar { width:4px; }
    .adm-scrollbox::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }

    .adm-badge {
      display:inline-flex; align-items:center;
      padding:.18rem .6rem;
      border-radius:99px;
      font-size:.7rem; font-weight:600;
    }

    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
    .adm-fadein { animation: fadeIn .3s ease both; }
    .adm-spin { animation: spin 1s linear infinite; }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div
          className="adm-root"
          style={{ display: "flex", background: "#f8fafc", minHeight: "100vh" }}
        >
          <Sidebar
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onCollapseChange={setIsSidebarCollapsed}
          />
          <main
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  border: "3px solid #e2e8f0",
                  borderTopColor: "#0f766e",
                  margin: "0 auto 1rem",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p
                style={{
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: ".95rem",
                }}
              >
                Memuat data laporan...
              </p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div
        className="adm-root"
        style={{ display: "flex", background: "#f8fafc", minHeight: "100vh" }}
      >
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onCollapseChange={setIsSidebarCollapsed}
        />

        <main
          style={{
            flex: 1,
            minHeight: "100vh",
            padding: "2rem",
            overflowX: "hidden",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div className="adm-card">
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
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BarChart3 size={17} color="#fff" />
                    </div>
                    <h1
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        letterSpacing: "-.02em",
                      }}
                    >
                      Laporan Admin
                    </h1>
                    <span
                      style={{
                        padding: ".2rem .625rem",
                        borderRadius: 99,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        fontSize: ".7rem",
                        fontWeight: 700,
                        letterSpacing: ".04em",
                      }}
                    >
                      ADMIN
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: ".875rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    Ringkasan dan analisis keuangan semua pengguna
                  </p>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="adm-btn adm-btn-slate"
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? "adm-spin" : ""}
                  />
                  {refreshing ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            </div>

            <div className="adm-card">
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
                  <Calendar size={16} color="#1d4ed8" />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: ".95rem",
                      color: "#0f172a",
                    }}
                  >
                    Pilih Periode
                  </span>
                </div>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="adm-select"
                  >
                    {monthNames.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="adm-select"
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
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    color: "#1d4ed8",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#1d4ed8",
                    }}
                  />
                  {monthNames[selectedMonth]} {selectedYear}
                </div>
                <span style={{ fontSize: ".75rem", color: "#94a3b8" }}>
                  {incomes.length + expenses.length} total transaksi
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "1rem",
              }}
            >
              {[
                {
                  label: "Total User",
                  accent: "#1d4ed8",
                  value: totalUsers,
                  sub: "Pengguna terdaftar",
                  icon: <Users size={15} />,
                  mono: false,
                },
                {
                  label: "Total Pemasukan",
                  accent: "#0f766e",
                  value: `Rp ${allIncomes.toLocaleString("id-ID")}`,
                  sub: `${incomes.length} transaksi`,
                  icon: <TrendingUp size={15} />,
                  mono: true,
                },
                {
                  label: "Total Pengeluaran",
                  accent: "#dc2626",
                  value: `Rp ${allExpenses.toLocaleString("id-ID")}`,
                  sub: `${expenses.length} transaksi`,
                  icon: <TrendingDown size={15} />,
                  mono: true,
                },
                {
                  label: "Saldo Bersih",
                  accent: netIncome >= 0 ? "#0f766e" : "#dc2626",
                  value: `Rp ${netIncome.toLocaleString("id-ID")}`,
                  sub: netIncome >= 0 ? "Surplus" : "Defisit",
                  icon: <FileText size={15} />,
                  mono: true,
                },
                {
                  label: "Rata-rata / User",
                  accent: "#7c3aed",
                  value: `Rp ${totalUsers > 0 ? Math.round(allIncomes / totalUsers).toLocaleString("id-ID") : "0"}`,
                  sub: "Pemasukan per user",
                  icon: <BarChart3 size={15} />,
                  mono: true,
                },
              ].map(({ label, accent, value, sub, icon, mono }) => (
                <div key={label} className="adm-stat adm-fadein">
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
                        fontSize: ".7rem",
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
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: accent + "15",
                        color: accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                  </div>
                  <div
                    className={mono ? "adm-mono" : ""}
                    style={{
                      fontSize: mono ? "1.05rem" : "1.75rem",
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div className="adm-card adm-fadein">
                <div className="adm-section-label">Breakdown</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: ".95rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  Kategori Pengeluaran Terbesar
                </div>
                {topCategories.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".875rem",
                    }}
                  >
                    {topCategories.map(([category, data], idx) => {
                      const pct = (data.total / allExpenses) * 100;
                      const color = CAT_COLORS[idx % CAT_COLORS.length];
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
                                style={{ fontSize: ".7rem", color: "#94a3b8" }}
                              >
                                ({data.count}x)
                              </span>
                            </div>
                            <span
                              className="adm-mono"
                              style={{
                                fontSize: ".8rem",
                                fontWeight: 700,
                                color: "#0f172a",
                              }}
                            >
                              Rp {data.total.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="adm-progress-track">
                            <div
                              className="adm-progress-fill"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <div
                            style={{ textAlign: "right", marginTop: ".2rem" }}
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
                  <AdminEmpty
                    icon={<TrendingDown size={20} color="#cbd5e1" />}
                    text="Belum ada data pengeluaran"
                  />
                )}
              </div>

              <div className="adm-card adm-fadein">
                <div className="adm-section-label">Ranking</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: ".95rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  Top 5 Pengguna
                </div>
                {topUsers.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".625rem",
                    }}
                  >
                    {topUsers.map((user, index) => (
                      <div
                        key={user.telegramId}
                        className="adm-row"
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
                              background: USER_RANK_COLORS[index] || "#e2e8f0",
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
                              {user.name || user.username}
                            </div>
                            <div
                              style={{ fontSize: ".7rem", color: "#94a3b8" }}
                            >
                              Bersih: Rp{" "}
                              {user.netIncome.toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            className="adm-mono"
                            style={{
                              fontSize: ".82rem",
                              fontWeight: 700,
                              color: "#0f766e",
                            }}
                          >
                            Rp {user.totalIncome.toLocaleString("id-ID")}
                          </div>
                          <div style={{ fontSize: ".7rem", color: "#94a3b8" }}>
                            pemasukan
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <AdminEmpty
                    icon={<Users size={20} color="#cbd5e1" />}
                    text="Belum ada data pengguna"
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
              <div className="adm-card adm-fadein">
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
                    <ArrowDownLeft size={15} color="#16a34a" />
                  </div>
                  <div>
                    <div className="adm-section-label" style={{ margin: 0 }}>
                      Transaksi
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: ".9rem",
                      }}
                    >
                      Pemasukan Terbaru
                    </div>
                  </div>
                </div>

                <div
                  className="adm-scrollbox"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".5rem",
                  }}
                >
                  {incomes.length > 0 ? (
                    incomes
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 10)
                      .map((income) => (
                        <div
                          key={income._id}
                          className="adm-row"
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
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{ fontSize: ".7rem", color: "#94a3b8" }}
                              >
                                {getUserName(income.telegramId)}
                              </span>
                              {(income.source || income.category) && (
                                <span
                                  className="adm-badge"
                                  style={{
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    border: "1px solid #bbf7d0",
                                  }}
                                >
                                  {income.source || income.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className="adm-mono"
                            style={{
                              fontSize: ".82rem",
                              fontWeight: 700,
                              color: "#16a34a",
                              flexShrink: 0,
                              marginLeft: ".5rem",
                            }}
                          >
                            Rp {income.amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                  ) : (
                    <AdminEmpty
                      icon={<ArrowDownLeft size={20} color="#cbd5e1" />}
                      text="Belum ada data pemasukan"
                    />
                  )}
                </div>
              </div>

              <div className="adm-card adm-fadein">
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
                    <ArrowUpRight size={15} color="#dc2626" />
                  </div>
                  <div>
                    <div className="adm-section-label" style={{ margin: 0 }}>
                      Transaksi
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: ".9rem",
                      }}
                    >
                      Pengeluaran Terbaru
                    </div>
                  </div>
                </div>

                <div
                  className="adm-scrollbox"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".5rem",
                  }}
                >
                  {expenses.length > 0 ? (
                    expenses
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 10)
                      .map((expense) => (
                        <div
                          key={expense._id}
                          className="adm-row"
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
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{ fontSize: ".7rem", color: "#94a3b8" }}
                              >
                                {getUserName(expense.telegramId)}
                              </span>
                              <span
                                className="adm-badge"
                                style={{
                                  background: "#ffe4e6",
                                  color: "#be123c",
                                  border: "1px solid #fecdd3",
                                }}
                              >
                                {expense.category}
                              </span>
                            </div>
                          </div>
                          <span
                            className="adm-mono"
                            style={{
                              fontSize: ".82rem",
                              fontWeight: 700,
                              color: "#dc2626",
                              flexShrink: 0,
                              marginLeft: ".5rem",
                            }}
                          >
                            Rp {expense.amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                  ) : (
                    <AdminEmpty
                      icon={<ArrowUpRight size={20} color="#cbd5e1" />}
                      text="Belum ada data pengeluaran"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="adm-card adm-fadein">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                  marginBottom: ".625rem",
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
                Unduh laporan admin {monthNames[selectedMonth]} {selectedYear}{" "}
                dalam format pilihan
              </p>
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleExportPDF}
                  className="adm-btn adm-btn-red"
                >
                  <Download size={14} />
                  Export ke PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  className="adm-btn adm-btn-teal"
                >
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

function AdminEmpty({ icon, text }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1rem",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: ".75rem",
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: ".82rem", fontWeight: 500, color: "#cbd5e1" }}>
        {text}
      </p>
    </div>
  );
}

export default AdminLaporan;
