import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Landing = lazy(() => import("./pages/Landing"));
const Privasi = lazy(() => import("./pages/Privasi"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
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

const isAuthenticated = () => Boolean(localStorage.getItem("telegramId"));

const getUserRole = () => {
  try {
    const userData = localStorage.getItem("userData");
    if (userData) {
      return JSON.parse(userData).role || "user";
    }
  } catch {
    return "user";
  }
  return "user";
};

const NotFound = () => {
  if (!isAuthenticated()) {
    return <NotFoundPage />;
  }
  if (getUserRole() === "admin") {
    return <Navigate to="/aktivitas-pengguna" replace />;
  }
  return <Navigate to="/" replace />;
};

const LoginRoute = () => {
  if (!isAuthenticated()) {
    return <Login />;
  }
  return getUserRole() === "admin" ? (
    <Navigate to="/aktivitas-pengguna" replace />
  ) : (
    <Navigate to="/" replace />
  );
};

const HomeRoute = () => {
  if (!isAuthenticated()) {
    return <Landing />;
  }
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <Dashboard />
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/privasi" element={<Privasi />} />

          {/* ✅ User Routes */}
          <Route path="/" element={<HomeRoute />} />
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