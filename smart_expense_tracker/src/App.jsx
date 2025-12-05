import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const AktivitasPengguna = lazy(() => import("./pages/AktivitasPengguna"));
const Laporan = lazy(() => import("./pages/Laporan"));
const AdminLaporan = lazy(() => import("./pages/LaporanKeseluruhan"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// ✅ Component untuk 404 / Invalid Route
const NotFound = () => {
  const getUserRole = () => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        return JSON.parse(user).role || 'user';
      }
    } catch (error) {
      console.error("Error parsing user:", error);
    }
    return 'user';
  };

  const role = getUserRole();
  const isAuthenticated = localStorage.getItem("token") && localStorage.getItem("telegramId");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (role === 'admin') {
    return <Navigate to="/aktivitas-pengguna" replace />;
  }
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ✅ Login Route */}
          <Route
            path="/login"
            element={
              !localStorage.getItem("token") ? (
                <Login />
              ) : (
                <NotFound />
              )
            }
          />

          {/* ✅ User Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/laporan"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <Laporan />
              </ProtectedRoute>
            }
          />

          {/* ✅ Admin Routes */}
          <Route
            path="/aktivitas-pengguna"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AktivitasPengguna />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-laporan"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLaporan />
              </ProtectedRoute>
            }
          />

          {/* ✅ Catch all invalid routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;