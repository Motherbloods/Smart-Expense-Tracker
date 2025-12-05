import { Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

function ProtectedRoute({ children, allowedRoles = [] }) {
    const location = useLocation();

    // ✅ Get auth data dengan fallback
    const token = localStorage.getItem("token");
    const telegramId = localStorage.getItem("telegramId");
    const isAuthenticated = Boolean(token && telegramId);

    // ✅ Parse user data dengan error handling
    const userData = useMemo(() => {
        try {
            const user = localStorage.getItem("user");
            if (user) {
                return JSON.parse(user);
            }
        } catch (error) {
            console.error("Error parsing user data:", error);
            // Clear corrupted data
            localStorage.removeItem("user");
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