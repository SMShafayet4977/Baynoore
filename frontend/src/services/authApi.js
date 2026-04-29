import api from "./api";

export const authApi = {
  login: (data) => api.post("/auth/login", data),
  signup: (data) => api.post("/auth/admin-signup", data),
  getMe: () => api.get("/auth/me"),
};
