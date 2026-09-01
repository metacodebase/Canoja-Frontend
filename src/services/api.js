import axios from "axios";
import { useMutation } from "@tanstack/react-query";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api" : "http://54.227.140.191/api");

const ACTIVE_BUSINESS_KEY = "activeBusinessId";

// Token helpers
export const setToken = (token) => localStorage.setItem("jwt", token);
export const getToken = () => localStorage.getItem("jwt");
export const removeToken = () => localStorage.removeItem("jwt");

// Refresh token helpers
export const setRefreshToken = (token) => localStorage.setItem("refreshToken", token);
export const getRefreshToken = () => localStorage.getItem("refreshToken");
export const removeRefreshToken = () => localStorage.removeItem("refreshToken"); 
export const setActiveBusinessId = (businessId) => {
  if (businessId) localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
  else localStorage.removeItem(ACTIVE_BUSINESS_KEY);
};
export const getActiveBusinessId = () => localStorage.getItem(ACTIVE_BUSINESS_KEY);
export const removeActiveBusinessId = () => localStorage.removeItem(ACTIVE_BUSINESS_KEY);

// Create axios instance
const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - add JWT token and handle FormData
api.interceptors.request.use((config) => {
  const token = getToken();
  //console.log("Token being sent:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeBusinessId = getActiveBusinessId();
  if (activeBusinessId) {
    config.headers["X-Active-Business"] = activeBusinessId;
  }
  
  // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  
  return config;
});

// Response interceptor - handle 401 with token refresh
let isRefreshing = false;
let failedQueue = [];

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle deactivated account — force logout immediately
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === "ACCOUNT_DEACTIVATED"
    ) {
      removeToken();
      removeRefreshToken();
      window.location.href = "/login?reason=deactivated";
      return Promise.reject(error);
    }

    // Skip refresh logic for login and refresh-token endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/users/login") &&
      !originalRequest.url?.includes("/users/refresh-token")
    ) {
      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        removeToken();
        removeRefreshToken();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${apiBaseUrl}/users/refresh-token`, {
          refreshToken,
        });

        setToken(data.token);
        setRefreshToken(data.refreshToken);
        processQueue(null, data.token);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeToken();
        removeRefreshToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Shop finder functions
export const searchShops = async (searchPayload) => {
  try {
    const response = await api.post("/shops/compare-shops", searchPayload);
    return response.data;
  } catch (error) {
    console.error("Search shops failed", error);
    throw error;
  }
};

export const getSpotlightShops = async (params = {}) => {
  const response = await api.get("/shops/spotlight", { params });
  return response.data;
};

export const loadMoreShops = async (searchPayload) => {
  try {
    const response = await api.post("/shops/compare-shops/more", searchPayload);
    return response.data;
  } catch (error) {
    console.error("Load more shops failed", error);
    throw error;
  }
};

export const useSearchShops = () =>
  useMutation({
    mutationFn: (searchPayload) => searchShops(searchPayload),
  });

export const useLoadMoreShops = () =>
  useMutation({
    mutationFn: (searchPayload) => loadMoreShops(searchPayload),
  });


export default api;
