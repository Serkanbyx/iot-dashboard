import axios from "axios";
import { refreshAuthTokens } from "./refreshClient";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login")
    ) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (!storedRefreshToken) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = refreshAuthTokens(storedRefreshToken)
        .then((response) => {
          localStorage.setItem("token", response.token);
          localStorage.setItem("refreshToken", response.refreshToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          return response.token;
        })
        .catch(() => null)
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return api(originalRequest);
  }
);

export default api;
