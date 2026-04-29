import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Request interceptor — attach admin token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("baynoore_admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Do NOT set Content-Type for FormData — let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute = window.location.pathname.startsWith("/admin");
      if (isAdminRoute) {
        localStorage.removeItem("baynoore_admin_token");
        localStorage.removeItem("baynoore_admin_user");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
