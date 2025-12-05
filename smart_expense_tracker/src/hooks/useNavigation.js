import { useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Deteksi halaman saat ini berdasarkan pathname
  const currentPage = useMemo(() => {
    const path = location.pathname;

    const routeMap = {
      "/": "dashboard",
      "/laporan": "laporan",
      "/aktivitas-pengguna": "aktivitas",
      "/admin-laporan": "admin-laporan",
    };

    return routeMap[path] || "dashboard";
  }, [location.pathname]);

  // Handler untuk page change
  const handlePageChange = useCallback(
    (pageId) => {
      const navigationMap = {
        dashboard: "/",
        laporan: "/laporan",
        aktivitas: "/aktivitas-pengguna",
        "admin-laporan": "/admin-laporan",
      };

      const route = navigationMap[pageId] || "/";
      navigate(route);
    },
    [navigate]
  );

  return {
    currentPage,
    handlePageChange,
    navigate,
    location,
  };
};

export default useNavigation;
