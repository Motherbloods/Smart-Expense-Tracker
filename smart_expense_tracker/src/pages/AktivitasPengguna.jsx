import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { toast } from 'react-toastify';
import useNavigation from '../hooks/useNavigation';
import { getActivities } from '../api/activityService';
import { invalidateActivityCache } from '../api/activityService';

function AktivitasPengguna() {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

    const [_, setIsSidebarCollapsed] = useState(false);

    const { currentPage, handlePageChange } = useNavigation();

    const telegramId = localStorage.getItem("telegramId");

    // Fetch activities dari backend dengan filter
    const fetchActivities = useCallback(async (forceRefresh = false) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Invalidate cache jika force refresh
            if (forceRefresh) {
                invalidateActivityCache();
            }

            const filters = {
                type: filterType,
                search: searchQuery,
                limit: 100,
            };

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
    }, [filterType, searchQuery, isLoading]);

    // Initial fetch
    useEffect(() => {
        if (telegramId) {
            fetchActivities();
        }
    }, [telegramId, filterType]);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            if (telegramId) {
                fetchActivities();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Pusher Integration untuk Real-time Updates
    useEffect(() => {
        const pusher = new window.Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe(import.meta.env.VITE_PUSHER_SUBSCRIBE);

        // Handler untuk expense yang ditambahkan
        channel.bind(import.meta.env.VITE_PUSHER_BIND, (data) => {
            if (data && data.expense && data.telegramId === telegramId) {
                fetchActivities();

                toast.success(`💸 Pengeluaran baru: ${data.expense.name}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });

        // Handler untuk income yang ditambahkan
        channel.bind('income-added', (data) => {
            if (data && data.income && data.telegramId === telegramId) {
                fetchActivities();

                toast.success(`💰 Pemasukan baru: ${data.income.name}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });

        // Handler untuk expense yang diupdate
        channel.bind('expense-updated', (data) => {
            if (data && data.expense && data.telegramId === telegramId) {
                fetchActivities();

                toast.info(`✏️ Pengeluaran diupdate: ${data.expense.name}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });

        // Handler untuk income yang diupdate
        channel.bind('income-updated', (data) => {
            if (data && data.income && data.telegramId === telegramId) {
                fetchActivities();

                toast.info(`✏️ Pemasukan diupdate: ${data.income.name}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });

        // Handler untuk expense yang dihapus
        channel.bind('expense-deleted', (data) => {
            if (data && data.expenseId && data.telegramId === telegramId) {
                fetchActivities();

                toast.warning(`🗑️ Pengeluaran dihapus: ${data.expenseName || 'Transaksi'}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });

        // Handler untuk income yang dihapus
        channel.bind('income-deleted', (data) => {
            if (data && data.incomeId && data.telegramId === telegramId) {
                fetchActivities();

                toast.warning(`🗑️ Pemasukan dihapus: ${data.incomeName || 'Transaksi'}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [telegramId, fetchActivities]);

    // Refresh data when app visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 5 * 60 * 1000) {
                    console.log('App became visible, refreshing activities...');
                    fetchActivities(true);
                }
            }
        };

        const handleFocus = () => {
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 5 * 60 * 1000) {
                console.log('Window focused, refreshing activities...');
                fetchActivities(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [lastRefreshTime, fetchActivities]);

    const getActionColor = (action) => {
        switch (action) {
            case 'create': return 'bg-green-100 text-green-700';
            case 'update': return 'bg-blue-100 text-blue-700';
            case 'delete': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'create':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                );
            case 'update':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                );
            case 'delete':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                );
            default: return null;
        }
    };

    const getTypeIcon = (type) => {
        if (type === 'expense') {
            return (
                <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </div>
            );
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewDetail = (activity) => {
        setSelectedActivity(activity);
        setShowDetailModal(true);
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

                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                    Aktivitas Pengguna
                                </h1>
                                <p className="text-gray-600 text-lg">Riwayat dan log aktivitas transaksi real-time</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fetchActivities(true)}
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70"
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

                                {/* Real-time Indicator */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-green-100 border border-green-300 rounded-xl">
                                    <div className="relative">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                                    </div>
                                    <span className="text-sm font-semibold text-green-700">Live</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="flex-1">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari aktivitas..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${filterType === 'all'
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => setFilterType('expense')}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${filterType === 'expense'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    Pengeluaran
                                </button>
                                <button
                                    onClick={() => setFilterType('income')}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${filterType === 'income'
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    Pemasukan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Activities List */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                <svg className="w-20 h-20 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-xl font-medium mb-2">Tidak Ada Aktivitas</p>
                                <p className="text-sm text-center">Aktivitas akan muncul di sini secara real-time</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {activities.map((activity) => (
                                    <div
                                        key={activity._id}
                                        className="p-6 hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <div className="flex items-start gap-4">
                                            {getTypeIcon(activity.type)}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(activity.action)}`}>
                                                        {getActionIcon(activity.action)}
                                                        {activity.action.toUpperCase()}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(activity.createdAt)}
                                                    </span>
                                                    {activity.sourceUser === 'Telegram Bot' && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.945 13.56l-2.936-.918c-.638-.197-.658-.637.135-.943l11.49-4.43c.529-.176.995.12.823.943z" />
                                                            </svg>
                                                            Telegram
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-800 mb-1">
                                                    {activity.entityName}
                                                </h3>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    👤 {activity.userName}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                    <span className="font-semibold text-lg text-blue-600">
                                                        Rp {activity.amount.toLocaleString('id-ID')}
                                                    </span>
                                                    {activity.category && (
                                                        <span className="px-3 py-1 bg-gray-100 rounded-full">
                                                            {activity.category}
                                                        </span>
                                                    )}
                                                    {activity.source && (
                                                        <span className="px-3 py-1 bg-gray-100 rounded-full">
                                                            {activity.source}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleViewDetail(activity)}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                            >
                                                Detail
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail Modal */}
                    {showDetailModal && selectedActivity && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-gray-800">Detail Aktivitas</h2>
                                        <button
                                            onClick={() => setShowDetailModal(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                        {getTypeIcon(selectedActivity.type)}
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Tipe Transaksi</p>
                                            <p className="text-lg font-semibold text-gray-800">
                                                {selectedActivity.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 mb-1">Aksi</p>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getActionColor(selectedActivity.action)}`}>
                                                {getActionIcon(selectedActivity.action)}
                                                {selectedActivity.action.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 mb-1">Nominal</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                Rp {selectedActivity.amount.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-1">Nama Pengguna</p>
                                        <p className="text-lg font-semibold text-gray-800">
                                            👤 {selectedActivity.userName}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-1">Nama Transaksi</p>
                                        <p className="text-lg font-semibold text-gray-800">{selectedActivity.entityName}</p>
                                    </div>

                                    {selectedActivity.category && (
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 mb-1">Kategori</p>
                                            <p className="text-lg font-semibold text-gray-800">{selectedActivity.category}</p>
                                        </div>
                                    )}

                                    {selectedActivity.source && (
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 mb-1">Sumber</p>
                                            <p className="text-lg font-semibold text-gray-800">{selectedActivity.source}</p>
                                        </div>
                                    )}

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-1">Waktu</p>
                                        <p className="text-lg font-semibold text-gray-800">{formatDate(selectedActivity.createdAt)}</p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-1">Sumber Transaksi</p>
                                        <div className="flex items-center gap-2">
                                            {selectedActivity.sourceUser === 'Telegram Bot' ? (
                                                <>
                                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.945 13.56l-2.936-.918c-.638-.197-.658-.637.135-.943l11.49-4.43c.529-.176.995.12.823.943z" />
                                                    </svg>
                                                    <span className="text-lg font-semibold text-gray-800">Telegram Bot</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                    <span className="text-lg font-semibold text-gray-800">{selectedActivity.sourceUser}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedActivity.description || selectedActivity.notes) && (
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 mb-1">Keterangan</p>
                                            <p className="text-gray-800">{selectedActivity.description || selectedActivity.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-gray-200">
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AktivitasPengguna;