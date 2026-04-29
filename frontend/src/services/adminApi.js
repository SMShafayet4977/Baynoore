import api from "./api";

export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard/summary"),
  getAdmins: (params) => api.get("/admin/admins", { params }),
  getPendingAdmins: () => api.get("/admin/admins/pending"),
  createAdmin: (data) => api.post("/admin/admins", data),
  approveAdmin: (id) => api.patch(`/admin/admins/${id}/approve`),
  rejectAdmin: (id, data) => api.patch(`/admin/admins/${id}/reject`, data),
  updateAdminStatus: (id, data) => api.patch(`/admin/admins/${id}/status`, data),
  updateAdminPassword: (id, data) => api.patch(`/admin/admins/${id}/password`, data),
};
