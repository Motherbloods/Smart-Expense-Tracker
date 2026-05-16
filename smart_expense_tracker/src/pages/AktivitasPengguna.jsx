import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { toast } from "react-toastify";
import useNavigation from "../hooks/useNavigation";
import { getActivities, invalidateActivityCache } from "../api/activityService";

function AktivitasPengguna() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [_, setIsSidebarCollapsed] = useState(false);

  const { currentPage, handlePageChange } = useNavigation();
  const telegramId = localStorage.getItem("telegramId");

  const fetchActivities = useCallback(
    async (forceRefresh = false) => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        if (forceRefresh) invalidateActivityCache();
        const filters = { type: filterType, search: searchQuery, limit: 100 };
        const response = await getActivities(filters);
        console.log("🔥 Activities fetched:", response.data);
        if (response.data.success) {
          setActivities(response.data.data);
          setLastRefreshTime(Date.now());
          if (forceRefresh) {
            toast.success("Aktivitas berhasil diperbarui", {
              position: "top-right",
              autoClose: 2000,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        toast.error("Gagal memuat aktivitas", {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [filterType, searchQuery, isLoading],
  );

  useEffect(() => {
    if (telegramId) fetchActivities();
  }, [telegramId, filterType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (telegramId) fetchActivities();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const pusher = new window.Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    });
    const channel = pusher.subscribe(import.meta.env.VITE_PUSHER_SUBSCRIBE);

    channel.bind(import.meta.env.VITE_PUSHER_BIND, (data) => {
      if (data && data.expense && data.telegramId === telegramId) {
        fetchActivities();
        toast.success(`💸 Pengeluaran baru: ${data.expense.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });
    channel.bind("income-added", (data) => {
      if (data && data.income && data.telegramId === telegramId) {
        fetchActivities();
        toast.success(`💰 Pemasukan baru: ${data.income.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });
    channel.bind("expense-updated", (data) => {
      if (data && data.expense && data.telegramId === telegramId) {
        fetchActivities();
        toast.info(`✏️ Pengeluaran diupdate: ${data.expense.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });
    channel.bind("income-updated", (data) => {
      if (data && data.income && data.telegramId === telegramId) {
        fetchActivities();
        toast.info(`✏️ Pemasukan diupdate: ${data.income.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });
    channel.bind("expense-deleted", (data) => {
      if (data && data.expenseId && data.telegramId === telegramId) {
        fetchActivities();
        toast.warning(
          `🗑️ Pengeluaran dihapus: ${data.expenseName || "Transaksi"}`,
          { position: "top-right", autoClose: 3000 },
        );
      }
    });
    channel.bind("income-deleted", (data) => {
      if (data && data.incomeId && data.telegramId === telegramId) {
        fetchActivities();
        toast.warning(
          `🗑️ Pemasukan dihapus: ${data.incomeName || "Transaksi"}`,
          { position: "top-right", autoClose: 3000 },
        );
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [telegramId, fetchActivities]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastRefreshTime > 5 * 60 * 1000) fetchActivities(true);
      }
    };
    const handleFocus = () => {
      if (Date.now() - lastRefreshTime > 5 * 60 * 1000) fetchActivities(true);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [lastRefreshTime, fetchActivities]);

  const getActionMeta = (action) => {
    switch (action) {
      case "create":
        return {
          bg: "#f0fdf4",
          color: "#15803d",
          border: "#bbf7d0",
          label: "BUAT",
        };
      case "update":
        return {
          bg: "#eff6ff",
          color: "#1d4ed8",
          border: "#bfdbfe",
          label: "EDIT",
        };
      case "delete":
        return {
          bg: "#fff1f2",
          color: "#be123c",
          border: "#fecdd3",
          label: "HAPUS",
        };
      default:
        return {
          bg: "#f8fafc",
          color: "#64748b",
          border: "#e2e8f0",
          label: action.toUpperCase(),
        };
    }
  };

  const getActionIcon = (action) => {
    const size = 11;
    if (action === "create")
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    if (action === "update")
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    if (action === "delete")
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );
    return null;
  };

  const getTypeConfig = (type) => {
    if (type === "expense")
      return { bg: "#fff1f2", iconColor: "#dc2626", arrow: "down" };
    return { bg: "#f0fdf4", iconColor: "#16a34a", arrow: "up" };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetail = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  const FILTERS = [
    {
      key: "all",
      label: "Semua",
      activeColor: "#1d4ed8",
      activeBg: "#eff6ff",
      activeBorder: "#bfdbfe",
    },
    {
      key: "expense",
      label: "Pengeluaran",
      activeColor: "#dc2626",
      activeBg: "#fff1f2",
      activeBorder: "#fecdd3",
    },
    {
      key: "income",
      label: "Pemasukan",
      activeColor: "#0f766e",
      activeBg: "#f0fdf9",
      activeBorder: "#99f6e4",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .ak-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .ak-mono { font-family: 'DM Mono', monospace; }

        .ak-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0/.05), 0 1px 2px -1px rgb(0 0 0/.05);
        }

        .ak-section-label {
          font-size: .7rem; font-weight: 700;
          letter-spacing: .07em; text-transform: uppercase; color: #94a3b8;
        }

        .ak-input {
          width: 100%;
          padding: .6rem 1rem .6rem 2.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          color: #0f172a;
          font-size: .875rem; font-weight: 500;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .ak-input::placeholder { color: #94a3b8; }
        .ak-input:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgb(20 184 166/.15); }

        .ak-filter-btn {
          padding: .55rem 1.125rem;
          border-radius: 9px;
          font-size: .82rem; font-weight: 700;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .2s;
          white-space: nowrap;
        }
        .ak-filter-inactive {
          background: #fff; color: #64748b; border-color: #e2e8f0;
        }
        .ak-filter-inactive:hover { background: #f8fafc; }

        .ak-btn {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .55rem 1.125rem;
          border-radius: 10px;
          font-size: .875rem; font-weight: 600;
          border: none; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .2s;
        }
        .ak-btn:hover { transform: translateY(-1px); }
        .ak-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .ak-btn-slate { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .ak-btn-slate:hover { background: #e2e8f0; }
        .ak-btn-close {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          border-radius: 8px; border: 1px solid #e2e8f0;
          background: #fff; color: #64748b; cursor: pointer;
          transition: all .15s;
        }
        .ak-btn-close:hover { background: #f1f5f9; color: #0f172a; }

        .ak-activity-row {
          display: flex; align-items: flex-start; gap: 1rem;
          padding: 1.125rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          transition: background .15s;
          cursor: default;
        }
        .ak-activity-row:last-child { border-bottom: none; }
        .ak-activity-row:hover { background: #fafafa; }

        .ak-badge {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .2rem .6rem;
          border-radius: 99px;
          font-size: .7rem; font-weight: 700;
          letter-spacing: .02em;
          border: 1px solid transparent;
        }

        .ak-tag {
          display: inline-flex; align-items: center;
          padding: .2rem .6rem;
          border-radius: 99px;
          font-size: .72rem; font-weight: 600;
          background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
        }

        .ak-modal-overlay {
          position: fixed; inset: 0;
          background: rgb(0 0 0 / .45);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; z-index: 50;
        }
        .ak-modal {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / .25);
          max-width: 520px; width: 100%;
          max-height: 90vh; overflow-y: auto;
        }

        .ak-detail-row {
          display: flex; flex-direction: column; gap: .25rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .ak-detail-label { font-size: .72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
        .ak-detail-value { font-size: .9rem; font-weight: 600; color: #0f172a; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)} }
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        .ak-ping { animation: ping 1.2s cubic-bezier(0,0,.2,1) infinite; }
        .ak-spin { animation: spin 1s linear infinite; }
        .ak-fadein { animation: fadeIn .25s ease both; }
      `}</style>

      <div
        className="ak-root"
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
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div className="ak-card">
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
                        background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <h1
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        letterSpacing: "-.02em",
                      }}
                    >
                      Aktivitas Pengguna
                    </h1>
                  </div>
                  <p
                    style={{
                      fontSize: ".875rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    Riwayat dan log aktivitas transaksi real-time
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: ".625rem",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".5rem",
                      padding: ".45rem .875rem",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 99,
                    }}
                  >
                    <div style={{ position: "relative", width: 8, height: 8 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#16a34a",
                        }}
                      />
                      <div
                        className="ak-ping"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          background: "#16a34a",
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: ".75rem",
                        fontWeight: 700,
                        color: "#15803d",
                      }}
                    >
                      Live
                    </span>
                  </div>

                  <button
                    onClick={() => fetchActivities(true)}
                    disabled={isLoading}
                    className="ak-btn ak-btn-slate"
                  >
                    {isLoading ? (
                      <>
                        <div
                          className="ak-spin"
                          style={{
                            width: 13,
                            height: 13,
                            border: "2px solid #94a3b8",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                          }}
                        />
                        Memuat...
                      </>
                    ) : (
                      <>
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
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M8 16H3v5" />
                        </svg>
                        Refresh
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="ak-card">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: ".75rem",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      position: "absolute",
                      left: ".875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari aktivitas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ak-input"
                  />
                </div>

                <div style={{ display: "flex", gap: ".375rem" }}>
                  {FILTERS.map(
                    ({ key, label, activeColor, activeBg, activeBorder }) => {
                      const isActive = filterType === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setFilterType(key)}
                          className={
                            isActive
                              ? "ak-filter-btn"
                              : "ak-filter-btn ak-filter-inactive"
                          }
                          style={
                            isActive
                              ? {
                                  background: activeBg,
                                  color: activeColor,
                                  borderColor: activeBorder,
                                  boxShadow: `0 1px 4px ${activeColor}20`,
                                }
                              : {}
                          }
                        >
                          {label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: ".875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                }}
              >
                <span style={{ fontSize: ".75rem", color: "#94a3b8" }}>
                  Menampilkan
                </span>
                <span
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {activities.length} aktivitas
                </span>
                {searchQuery && (
                  <span style={{ fontSize: ".72rem", color: "#94a3b8" }}>
                    untuk &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
            </div>

            <div className="ak-card" style={{ padding: 0, overflow: "hidden" }}>
              {isLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "5rem 1rem",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    className="ak-spin"
                    style={{
                      width: 36,
                      height: 36,
                      border: "3px solid #e2e8f0",
                      borderTopColor: "#0f766e",
                      borderRadius: "50%",
                    }}
                  />
                  <p
                    style={{
                      fontSize: ".85rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    Memuat aktivitas...
                  </p>
                </div>
              ) : activities.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "5rem 1rem",
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 18,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontSize: ".95rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      marginBottom: ".25rem",
                    }}
                  >
                    Tidak Ada Aktivitas
                  </p>
                  <p
                    style={{
                      fontSize: ".8rem",
                      color: "#cbd5e1",
                      textAlign: "center",
                    }}
                  >
                    Aktivitas akan muncul di sini secara real-time
                  </p>
                </div>
              ) : (
                <div className="ak-fadein">
                  {activities.map((activity, idx) => {
                    const typeConfig = getTypeConfig(activity.type);
                    const actionMeta = getActionMeta(activity.action);
                    const amountColor =
                      activity.type === "expense" ? "#dc2626" : "#0f766e";

                    return (
                      <div key={activity._id} className="ak-activity-row">
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            flexShrink: 0,
                            background: typeConfig.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: ".1rem",
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={typeConfig.iconColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {typeConfig.arrow === "down" ? (
                              <>
                                <path d="M12 5v14" />
                                <path d="m5 12 7 7 7-7" />
                              </>
                            ) : (
                              <>
                                <path d="M12 19V5" />
                                <path d="m5 12 7-7 7 7" />
                              </>
                            )}
                          </svg>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: ".375rem",
                              flexWrap: "wrap",
                              marginBottom: ".375rem",
                            }}
                          >
                            <span
                              className="ak-badge"
                              style={{
                                background: actionMeta.bg,
                                color: actionMeta.color,
                                borderColor: actionMeta.border,
                              }}
                            >
                              {getActionIcon(activity.action)}
                              {actionMeta.label}
                            </span>

                            {activity.sourceUser === "Telegram Bot" && (
                              <span
                                className="ak-badge"
                                style={{
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  borderColor: "#bfdbfe",
                                }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.945 13.56l-2.936-.918c-.638-.197-.658-.637.135-.943l11.49-4.43c.529-.176.995.12.823.943z" />
                                </svg>
                                Telegram
                              </span>
                            )}

                            <span
                              style={{
                                fontSize: ".72rem",
                                color: "#94a3b8",
                                fontWeight: 500,
                              }}
                            >
                              {formatDateShort(activity.createdAt)}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: ".9rem",
                              fontWeight: 700,
                              color: "#0f172a",
                              marginBottom: ".2rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {activity.entityName}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: ".5rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{ fontSize: ".75rem", color: "#94a3b8" }}
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                  display: "inline",
                                  marginRight: ".25rem",
                                  verticalAlign: "middle",
                                }}
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              {activity.userName}
                            </span>

                            {activity.category && (
                              <span className="ak-tag">
                                {activity.category}
                              </span>
                            )}
                            {activity.source && (
                              <span className="ak-tag">{activity.source}</span>
                            )}

                            <span
                              className="ak-mono"
                              style={{
                                fontSize: ".8rem",
                                fontWeight: 700,
                                color: amountColor,
                              }}
                            >
                              Rp {activity.amount.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewDetail(activity)}
                          style={{
                            flexShrink: 0,
                            alignSelf: "center",
                            padding: ".45rem .875rem",
                            borderRadius: 9,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#475569",
                            fontSize: ".78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                          }}
                        >
                          Detail
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>

        {showDetailModal && selectedActivity && (
          <div
            className="ak-modal-overlay"
            onClick={(e) =>
              e.target === e.currentTarget && setShowDetailModal(false)
            }
          >
            <div className="ak-modal ak-fadein">
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".625rem",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: getTypeConfig(selectedActivity.type).bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={getTypeConfig(selectedActivity.type).iconColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {getTypeConfig(selectedActivity.type).arrow === "down" ? (
                        <>
                          <path d="M12 5v14" />
                          <path d="m5 12 7 7 7-7" />
                        </>
                      ) : (
                        <>
                          <path d="M12 19V5" />
                          <path d="m5 12 7-7 7 7" />
                        </>
                      )}
                    </svg>
                  </div>
                  <div>
                    <div className="ak-section-label" style={{ margin: 0 }}>
                      Log
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: ".95rem",
                      }}
                    >
                      Detail Aktivitas
                    </div>
                  </div>
                </div>
                <button
                  className="ak-btn-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".75rem",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: ".75rem",
                  }}
                >
                  <div className="ak-detail-row">
                    <span className="ak-detail-label">Tipe Transaksi</span>
                    <span className="ak-detail-value">
                      {selectedActivity.type === "expense"
                        ? "💸 Pengeluaran"
                        : "💰 Pemasukan"}
                    </span>
                  </div>
                  <div className="ak-detail-row">
                    <span className="ak-detail-label">Aksi</span>
                    <div style={{ marginTop: ".2rem" }}>
                      {(() => {
                        const m = getActionMeta(selectedActivity.action);
                        return (
                          <span
                            className="ak-badge"
                            style={{
                              background: m.bg,
                              color: m.color,
                              borderColor: m.border,
                            }}
                          >
                            {getActionIcon(selectedActivity.action)}
                            {m.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="ak-detail-row">
                  <span className="ak-detail-label">Nominal</span>
                  <span
                    className="ak-mono"
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color:
                        selectedActivity.type === "expense"
                          ? "#dc2626"
                          : "#0f766e",
                    }}
                  >
                    Rp {selectedActivity.amount.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="ak-detail-row">
                  <span className="ak-detail-label">Nama Pengguna</span>
                  <span className="ak-detail-value">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        display: "inline",
                        marginRight: ".3rem",
                        verticalAlign: "middle",
                        color: "#94a3b8",
                      }}
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {selectedActivity.userName}
                  </span>
                </div>

                <div className="ak-detail-row">
                  <span className="ak-detail-label">Nama Transaksi</span>
                  <span className="ak-detail-value">
                    {selectedActivity.entityName}
                  </span>
                </div>

                {selectedActivity.category && (
                  <div className="ak-detail-row">
                    <span className="ak-detail-label">Kategori</span>
                    <span className="ak-detail-value">
                      {selectedActivity.category}
                    </span>
                  </div>
                )}

                {selectedActivity.source && (
                  <div className="ak-detail-row">
                    <span className="ak-detail-label">Sumber</span>
                    <span className="ak-detail-value">
                      {selectedActivity.source}
                    </span>
                  </div>
                )}

                <div className="ak-detail-row">
                  <span className="ak-detail-label">Waktu</span>
                  <span className="ak-detail-value">
                    {formatDate(selectedActivity.createdAt)}
                  </span>
                </div>

                <div className="ak-detail-row">
                  <span className="ak-detail-label">Sumber Transaksi</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".5rem",
                      marginTop: ".2rem",
                    }}
                  >
                    {selectedActivity.sourceUser === "Telegram Bot" ? (
                      <>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: "#eff6ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="#1d4ed8"
                          >
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.945 13.56l-2.936-.918c-.638-.197-.658-.637.135-.943l11.49-4.43c.529-.176.995.12.823.943z" />
                          </svg>
                        </div>
                        <span className="ak-detail-value">Telegram Bot</span>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: "#f0fdf4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        </div>
                        <span className="ak-detail-value">
                          {selectedActivity.sourceUser}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {(selectedActivity.description || selectedActivity.notes) && (
                  <div className="ak-detail-row">
                    <span className="ak-detail-label">Keterangan</span>
                    <span
                      style={{
                        fontSize: ".875rem",
                        color: "#334155",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedActivity.description || selectedActivity.notes}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    width: "100%",
                    padding: ".7rem",
                    borderRadius: 12,
                    border: "none",
                    background: "#0f766e",
                    color: "#fff",
                    fontSize: ".875rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    transition: "background .2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#0d6a62")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#0f766e")
                  }
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AktivitasPengguna;
