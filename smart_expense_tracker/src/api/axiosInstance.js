import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Variable to track if we're currently refreshing token
let isRefreshing = false;
// Queue of requests to retry after token refresh
let refreshQueue = [];
// Flag to prevent multiple redirects
let isRedirecting = false;

// Function to retry requests after token refresh
const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  refreshQueue = [];
};

// ✅ Helper function untuk safe redirect (cegah multiple redirects)
const safeRedirectToLogin = () => {
  if (isRedirecting) return;

  // Cek apakah sudah di login page
  if (window.location.pathname === "/login") {
    return;
  }

  isRedirecting = true;

  localStorage.clear();

  // Hard redirect untuk ensure clean state
  window.location.href = "/login";
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Skip interceptor untuk endpoint login
    if (originalRequest.url?.includes("/login")) {
      return Promise.reject(error);
    }

    // ✅ Cek jika sedang dalam proses redirect, skip
    if (isRedirecting) {
      return Promise.reject(error);
    }

    // If error is 401 (Unauthorized) and we haven't retried already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If not already refreshing, try to refresh the token
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Get telegramId from localStorage
          const telegramId = localStorage.getItem("telegramId");

          if (!telegramId) {
            processQueue(new Error("No telegramId"), null);
            safeRedirectToLogin();
            return Promise.reject(error);
          }

          // ✅ Gunakan axios biasa untuk refresh token
          const response = await axios.post(
            `${API_URL}/login`,
            {
              telegramId,
            },
            {
              timeout: 5000, // ✅ Tambah timeout 5 detik
            }
          );

          if (response.data?.token) {
            localStorage.setItem("token", response.data.token);
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;

            // Process queued requests
            processQueue(null, response.data.token);

            // Retry original request
            return axiosInstance(originalRequest);
          } else {
            throw new Error("No token received");
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);

          // Process queued requests with error
          processQueue(refreshError, null);

          // Clear and redirect
          safeRedirectToLogin();

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If we're already refreshing, add request to queue
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
