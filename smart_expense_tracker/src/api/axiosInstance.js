import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Variable to track if we're currently refreshing token
let isRefreshing = false;
// Queue of requests to retry after token refresh
let refreshQueue = [];

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

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
            // No telegramId, redirect to login
            window.location.href = "/login";
            return Promise.reject(error);
          }

          // Call login API directly without using the intercepted instance
          const response = await axios.post(`${API_URL}/login`, { telegramId });

          if (response.data && response.data.token) {
            localStorage.setItem("token", response.data.token);

            // Update original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;

            // Process any queued requests
            processQueue(null, response.data.token);

            // Try the original request again
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Process queued requests with error
          processQueue(refreshError, null);

          // Clear token and redirect to login
          localStorage.removeItem("token");
          window.location.href = "/login";
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
              resolve(axios(originalRequest));
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
