import api from "./api";

export const productApi = {
  getAll: (params) => api.get("/products", { params }),
  getFeatured: () => api.get("/products/featured"),
  getByCategory: (slug, params) => api.get(`/products/category/${slug}`, { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get("/categories"),
  getDistricts: () => api.get("/districts"),
  getDeliveryCharge: (districtId) => api.get(`/districts/${districtId}/delivery-charge`),
  getExchangePolicy: () => api.get("/policies/exchange"),
};

export const adminProductApi = {
  getAll: (params) => api.get("/admin/products", { params }),
  getById: (id) => api.get(`/admin/products/${id}`),
  create: (data) => api.post("/admin/products", data),
  update: (id, data) => api.patch(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),

  // Images
  uploadImage: (productId, formData) =>
    api.post(`/admin/products/${productId}/images`, formData),
  deleteImage: (imageId) => api.delete(`/admin/product-images/${imageId}`),
  setPrimaryImage: (imageId) => api.patch(`/admin/product-images/${imageId}/primary`),

  // Variants
  createVariant: (productId, data) =>
    api.post(`/admin/products/${productId}/variants`, data),
  updateVariant: (variantId, data) => api.patch(`/admin/variants/${variantId}`, data),
  deleteVariant: (variantId) => api.delete(`/admin/variants/${variantId}`),
};
