import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

// ✅ Process queue ketika refresh selesai
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const safeRedirectToLogin = () => {
  if (window.location.pathname === "/login") {
    return;
  }

  // Clear data
  localStorage.removeItem("telegramId");
  localStorage.removeItem("userData");

  window.location.href = "/login";
};

// ✅ Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Skip interceptor untuk login/refresh/logout
    if (
      originalRequest.url?.includes("/login") ||
      originalRequest.url?.includes("/refresh") ||
      originalRequest.url?.includes("/logout")
    ) {
      return Promise.reject(error);
    }

    // ✅ Handle 401 errors
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;

      // ✅ TOKEN_EXPIRED = coba refresh
      if (errorCode === "TOKEN_EXPIRED") {
        // Cegah retry loop
        if (originalRequest._retry) {
          console.log("❌ Retry limit reached, redirecting to login");
          safeRedirectToLogin();
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        console.log("ini refresh flag", isRefreshing);
        // ✅ Jika sedang refresh, queue request ini
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token) => {
                resolve(axiosInstance(originalRequest));
              },
              reject: (err) => {
                reject(err);
              },
            });
          });
        }

        // ✅ Mulai refresh process
        isRefreshing = true;

        try {
          console.log("🔄 Attempting token refresh...");

          await axios.post(
            `${API_URL}/refresh`,
            {},
            {
              withCredentials: true,
              timeout: 5000,
            }
          );

          console.log("✅ Token refreshed successfully");

          // ✅ Process semua queued requests
          processQueue(null, true);

          // ✅ Retry original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError.message);

          // ✅ Reject semua queued requests
          processQueue(refreshError, null);

          // ✅ Redirect to login
          safeRedirectToLogin();

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // ✅ 401 lainnya (NO_TOKEN, INVALID_TOKEN) = langsung redirect
      console.log("🔒 Unauthorized access:", errorCode || "No code");
      safeRedirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
