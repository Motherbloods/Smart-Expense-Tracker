import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Home from "lucide-react/dist/esm/icons/home";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Activity from "lucide-react/dist/esm/icons/activity";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import { LogOut } from 'lucide-react';

const MenuItem = memo(({ item, isActive, isCollapsed, onClick }) => {
    const Icon = item.icon;

    return (
        <li>
            <button
                onClick={onClick}
                className={`
                    w-full flex items-center gap-4 px-4 py-3 rounded-xl
                    transition-all duration-300 group
                    ${isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : 'hover:bg-gray-100 text-gray-700'
                    }
                `}
                title={isCollapsed ? item.label : ''}
            >
                <Icon
                    className={`
                        w-6 h-6 flex-shrink-0
                        ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'}
                        transition-colors duration-300
                    `}
                />

                {!isCollapsed && (
                    <div className="flex-1 text-left">
                        <div className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                            {item.label}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                            {item.description}
                        </div>
                    </div>
                )}

                {!isCollapsed && isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
            </button>
        </li>
    );
});

MenuItem.displayName = 'MenuItem';

function Sidebar({ currentPage, onPageChange, onCollapseChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // ✅ OPTIMASI: Memoize menu items (tidak perlu dibuat ulang setiap render)
    const menuItems = useMemo(() => [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            description: 'Ringkasan keuangan'
        },
        {
            id: 'laporan',
            label: 'Laporan Keuangan',
            icon: FileText,
            description: 'Laporan detail transaksi'
        },
        // {
        //     id: 'aktivitas',
        //     label: 'Aktivitas Pengguna',
        //     icon: Activity,
        //     description: 'Riwayat aktivitas'
        // }
    ], []);

    // ✅ OPTIMASI: Stabilkan toggle functions dengan useCallback
    const toggleSidebar = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    // ✅ OPTIMASI: Stabilkan handleMenuClick dengan useCallback
    const handleMenuClick = useCallback((itemId) => {
        // ✅ FIX: Cek apakah onPageChange adalah function sebelum dipanggil
        if (onPageChange && typeof onPageChange === 'function') {
            onPageChange(itemId);
        }

        // Close mobile menu after clicking
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    }, [onPageChange]);

    // Notify parent component when collapse state changes
    useEffect(() => {
        if (onCollapseChange && typeof onCollapseChange === 'function') {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                aria-label={isOpen ? "Close menu" : "Open menu"}
            >
                {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:sticky top-0 left-0 h-screen bg-white/90 backdrop-blur-md shadow-2xl z-40
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
                    w-72
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            {!isCollapsed && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">ET</span>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-800 text-lg">Expense Tracker</h2>
                                        <p className="text-xs text-gray-500">Kelola Keuangan</p>
                                    </div>
                                </div>
                            )}

                            {/* Collapse Button - Desktop Only */}
                            <button
                                onClick={toggleCollapse}
                                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                <ChevronLeft
                                    className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.id}
                                    item={item}
                                    isActive={currentPage === item.id}
                                    isCollapsed={isCollapsed}
                                    onClick={() => handleMenuClick(item.id)}
                                />
                            ))}
                        </ul><div className="border-t border-gray-200">
                            <button
                                onClick={() => { }}
                                className={`
                                    w-full flex items-center gap-4 px-4 py-3 rounded-xl
                                    transition-all duration-300 group
                                    hover:bg-red-50 text-gray-700 hover:text-red-600
                                `}
                                title={isCollapsed ? 'Logout' : ''}
                            >
                                <LogOut
                                    className="w-6 h-6 flex-shrink-0 text-gray-500 group-hover:text-red-500 transition-colors duration-300"
                                />

                                {!isCollapsed && (
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-gray-800 group-hover:text-red-600">
                                            Logout
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Keluar dari akun
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        {!isCollapsed ? (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold">H</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">Habib Risky K</p>
                                        <p className="text-xs text-gray-500 truncate">motherbloodss</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">U</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

// ✅ OPTIMASI: Export dengan memo untuk prevent unnecessary re-renders
export default memo(Sidebar);