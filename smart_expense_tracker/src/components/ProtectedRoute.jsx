import { Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useEffect } from 'react';

function ProtectedRoute({ children, allowedRoles = [] }) {
    const location = useLocation();
    useEffect(() => {
        console.log("🔍 ProtectedRoute check:", {
            path: location.pathname,
            telegramId: localStorage.getItem("telegramId"),
            userData: localStorage.getItem("userData")
        });
    }, [location]);

    // ✅ Cek auth hanya dari telegramId (token ada di HttpOnly cookies)
    const telegramId = localStorage.getItem("telegramId");
    const isAuthenticated = Boolean(telegramId);

    // ✅ Parse user data dengan error handling
    const userData = useMemo(() => {
        try {
            const user = localStorage.getItem("userData");
            if (user) {
                return JSON.parse(user);
            }
        } catch (error) {
            console.error("Error parsing user data:", error);
            // Clear corrupted data
            localStorage.removeItem("userData");
        }
        return null;
    }, []);

    // ✅ Check authentication first
    if (!isAuthenticated) {
        console.log("🔒 Not authenticated, redirecting to login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // ✅ If no role restriction, allow access
    if (allowedRoles.length === 0) {
        return children;
    }
    console.log("👤 User data:", userData?.role);
    // ✅ Check user role
    const userRole = userData?.role || 'user';

    // ✅ If role is allowed, grant access
    if (allowedRoles.includes(userRole)) {
        return children;
    }

    // ✅ If role not allowed, redirect to appropriate page
    console.log(`🚫 Access denied for role: ${userRole}. Allowed: ${allowedRoles.join(', ')}`);

    if (userRole === 'admin') {
        return <Navigate to="/aktivitas-pengguna" replace />;
    }

    return <Navigate to="/" replace />;
}

export default ProtectedRoute;