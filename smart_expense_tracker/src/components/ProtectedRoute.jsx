import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const isAuthenticated = localStorage.getItem("token");
    if (isAuthenticated) {
        return children;
    }

    // Jika belum login, arahkan ke halaman login
    return <Navigate to="/login" />;
}

export default ProtectedRoute;