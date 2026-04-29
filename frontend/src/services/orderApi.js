import api from "./api";

export const orderApi = {
  create: (data) => api.post("/orders", data),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
};

export const adminOrderApi = {
  getAll: (params) => api.get("/admin/orders", { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  updateCourier: (id, data) => api.patch(`/admin/orders/${id}/courier`, data),
  updateNote: (id, data) => api.patch(`/admin/orders/${id}/note`, data),
  updatePayment: (id, data) => api.patch(`/admin/orders/${id}/payment`, data),
};
