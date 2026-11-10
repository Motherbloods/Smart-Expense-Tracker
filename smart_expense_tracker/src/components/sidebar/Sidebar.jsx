import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Home from "lucide-react/dist/esm/icons/home";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Activity from "lucide-react/dist/esm/icons/activity";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import { LogOut, BarChart3 } from 'lucide-react';

const MenuItem = memo(({ item, isActive, isCollapsed, onClick }) => {
    const Icon = item.icon;

    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                title={isCollapsed ? item.label : item.description}
                aria-current={isActive ? 'page' : undefined}
                className={`
                    group relative flex w-full items-center rounded-lg py-2.5 text-sm
                    transition-colors duration-150
                    ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'}
                    ${isActive
                        ? 'bg-[var(--brand-tint)] font-semibold text-[var(--brand-dark)]'
                        : 'font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]'
                    }
                `}
            >
                {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[var(--brand)]" />
                )}
                <Icon
                    aria-hidden="true"
                    className={`h-[18px] w-[18px] shrink-0 ${isActive
                        ? 'text-[var(--brand)]'
                        : 'text-[var(--text-3)] group-hover:text-[var(--text-2)]'
                        }`}
                />
                {isCollapsed ? (
                    <span className="sr-only">{item.label}</span>
                ) : (
                    <span className="truncate">{item.label}</span>
                )}
            </button>
        </li>
    );
});

MenuItem.displayName = 'MenuItem';

function Sidebar({ currentPage, onPageChange, onCollapseChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userRole, setUserRole] = useState('user');
    const [user, setUser] = useState(null);
    const telegramId = localStorage.getItem("telegramId");

    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setUserRole(userData.role || 'user');
            } catch (error) {
                console.error("Error parsing user data:", error);
                setUserRole('user');
                setUser(null);
            }
        }
    }, []);

    const menuItems = useMemo(() => {
        if (userRole === 'admin') {
            return [
                {
                    id: 'aktivitas',
                    label: 'Aktivitas Pengguna',
                    icon: Activity,
                    description: 'Monitor aktivitas user'
                },
                {
                    id: 'admin-laporan',
                    label: 'Laporan Admin',
                    icon: BarChart3,
                    description: 'Laporan keseluruhan'
                }
            ];
        }
        return [
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
            }
        ];
    }, [userRole]);

    const toggleSidebar = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const handleMenuClick = useCallback((itemId) => {
        if (onPageChange && typeof onPageChange === 'function') {
            onPageChange(itemId);
        }

        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    }, [onPageChange]);

    const handleLogout = useCallback(async () => {
        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            setIsOpen(false);

            const { logoutUser } = await import('../../api/loginService');
            await logoutUser(telegramId);

            window.location.href = "/login";

        } catch (error) {
            console.error("Logout error:", error);
            localStorage.removeItem("telegramId");
            localStorage.removeItem("userData");
            window.location.href = "/login";
        }
    }, [isLoggingOut, telegramId]);

    useEffect(() => {
        if (onCollapseChange && typeof onCollapseChange === 'function') {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const initial = user?.username?.charAt(0)?.toUpperCase() || (userRole === 'admin' ? 'A' : 'U');
    const displayName = user?.username || 'User';
    const roleLabel = userRole === 'admin' ? 'Administrator' : 'Pengguna';

    const logoutButton = (
        <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Keluar dari akun"
            title="Keluar"
            className={`
                flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                text-[var(--text-3)] transition-colors duration-150
                ${isLoggingOut
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-red-50 hover:text-[var(--expense)]'
                }
            `}
        >
            <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
        </button>
    );

    return (
        <>
            <button
                type="button"
                onClick={toggleSidebar}
                className="lg:hidden fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--text-2)] shadow-sm"
                aria-label={isOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={isOpen}
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-30 bg-slate-900/40"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    app-sidebar fixed lg:sticky top-0 left-0 z-40 h-dvh shrink-0
                    border-r border-[var(--border)] bg-white
                    shadow-xl lg:shadow-none
                    transition-[transform,width] duration-200 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
                    w-64
                `}
            >
                <div className="flex h-full flex-col">
                    <div
                        className={`flex h-16 shrink-0 items-center border-b border-[var(--border)] ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-5'}`}
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-[13px] font-bold tracking-tight text-white">
                            ET
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-[var(--text-1)]">
                                    Expense Tracker
                                </p>
                                <p className="truncate text-xs leading-tight text-[var(--text-3)]">
                                    {userRole === 'admin' ? 'Admin Panel' : 'Kelola keuangan'}
                                </p>
                            </div>
                        )}
                    </div>

                    <nav
                        aria-label="Menu utama"
                        className="flex-1 overflow-y-auto px-3 py-4"
                    >
                        {!isCollapsed && (
                            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-3)]">
                                Menu
                            </p>
                        )}
                        <ul className="space-y-1">
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.id}
                                    item={item}
                                    isActive={currentPage === item.id}
                                    isCollapsed={isCollapsed}
                                    onClick={() => handleMenuClick(item.id)}
                                />
                            ))}
                        </ul>
                    </nav>

                    <div className="shrink-0 border-t border-[var(--border)] p-3">
                        <button
                            type="button"
                            onClick={toggleCollapse}
                            className={`
                                hidden lg:flex w-full items-center rounded-lg py-2 text-sm font-medium
                                text-[var(--text-3)] transition-colors duration-150
                                hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]
                                ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'}
                            `}
                            aria-label={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                            title={isCollapsed ? "Perluas sidebar" : undefined}
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                            />
                            {!isCollapsed && <span>Ciutkan menu</span>}
                        </button>

                        <div
                            className={`mt-2 border-t border-[var(--border)] pt-3 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-3 px-1'}`}
                        >
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-muted)] text-sm font-bold text-[var(--brand-dark)]"
                                title={isCollapsed ? displayName : undefined}
                            >
                                {initial}
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold leading-tight text-[var(--text-1)]">
                                        {displayName}
                                    </p>
                                    <p className="truncate text-xs leading-tight text-[var(--text-3)]">
                                        {roleLabel}
                                    </p>
                                </div>
                            )}
                            {logoutButton}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default memo(Sidebar);
