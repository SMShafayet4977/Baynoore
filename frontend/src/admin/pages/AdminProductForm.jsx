import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft, Upload, Trash2, Star, Plus, Pencil, Check, X, ImageIcon,
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../components/Toast";
import { adminProductApi, productApi } from "../../services/productApi";

const SIZE_SUGGESTIONS = {
  burka: ["50", "52", "54", "56"],
  punjabi: ["S", "M", "L", "XL", "XXL"],
  "one-piece": ["S", "M", "L", "XL", "XXL"],
  "two-piece": ["S", "M", "L", "XL", "XXL"],
  hijab: ["Free Size"],
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Image manager state
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Variant manager state
  const [variantForm, setVariantForm] = useState({ size: "", color: "", stock_quantity: "" });
  const [addingVariant, setAddingVariant] = useState(false);
  const [deleteVariantTarget, setDeleteVariantTarget] = useState(null);
  const [editingVariant, setEditingVariant] = useState(null); // { id, stock_quantity }
  const [deleteImageTarget, setDeleteImageTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category_id: "",
      name: "",
      product_code: "",
      regular_price: "",
      sale_price: "",
      short_description: "",
      full_description: "",
      fabric: "",
      care_instruction: "",
      status: "draft",
      is_featured: false,
    },
  });

  const watchedCategoryId = watch("category_id");

  // Derive size suggestions from selected category
  const selectedCategory = categories.find((c) => String(c.id) === String(watchedCategoryId));
  const sizeSuggestions = selectedCategory ? (SIZE_SUGGESTIONS[selectedCategory.slug] || []) : [];

  // Fetch categories
  useEffect(() => {
    productApi.getCategories()
      .then((res) => setCategories(res.data.data || res.data || []))
      .catch(() => {});
  }, []);

  // Fetch product if editing
  const fetchProduct = () => {
    if (!id) return;
    adminProductApi.getById(id)
      .then((res) => {
        const p = res.data.data || res.data;
        setProduct(p);
        reset({
          category_id: p.category_id || "",
          name: p.name || "",
          product_code: p.product_code || "",
          regular_price: p.regular_price || "",
          sale_price: p.sale_price || "",
          short_description: p.short_description || "",
          full_description: p.full_description || "",
          fabric: p.fabric || "",
          care_instruction: p.care_instruction || "",
          status: p.status || "draft",
          is_featured: p.is_featured || false,
        });
      })
      .catch(() => addToast("Failed to load product", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isEdit) fetchProduct();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data) {
    setSaving(true);
    try {
      const payload = {
        ...data,
        regular_price: Number(data.regular_price),
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        is_featured: !!data.is_featured,
      };
      if (isEdit) {
        await adminProductApi.update(id, payload);
        addToast("Product updated", "success");
        fetchProduct();
      } else {
        const res = await adminProductApi.create(payload);
        const newId = res.data.data?.id || res.data?.id;
        addToast("Product created", "success");
        navigate(`/admin/products/${newId}/edit`);
      }
    } catch (err) {
      addToast(err?.response?.data?.message || "Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Image handlers ──────────────────────────────────────────────
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (product?.images?.length >= 5) {
      addToast("Maximum 5 images allowed", "warning");
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    setImageUploading(true);
    try {
      await adminProductApi.uploadImage(id, formData);
      addToast("Image uploaded", "success");
      fetchProduct();
    } catch {
      addToast("Failed to upload image", "error");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSetPrimary(imageId) {
    try {
      await adminProductApi.setPrimaryImage(imageId);
      addToast("Primary image updated", "success");
      fetchProduct();
    } catch {
      addToast("Failed to update primary image", "error");
    }
  }

  async function handleDeleteImage() {
    if (!deleteImageTarget) return;
    try {
      await adminProductApi.deleteImage(deleteImageTarget.id);
      addToast("Image deleted", "success");
      setDeleteImageTarget(null);
      fetchProduct();
    } catch {
      addToast("Failed to delete image", "error");
    }
  }

  // ── Variant handlers ─────────────────────────────────────────────
  async function handleAddVariant(e) {
    e.preventDefault();
    if (!variantForm.size || !variantForm.stock_quantity) {
      addToast("Size and stock quantity are required", "warning");
      return;
    }
    setAddingVariant(true);
    try {
      await adminProductApi.createVariant(id, {
        size: variantForm.size,
        color: variantForm.color || null,
        stock_quantity: Number(variantForm.stock_quantity),
      });
      addToast("Variant added", "success");
      setVariantForm({ size: "", color: "", stock_quantity: "" });
      fetchProduct();
    } catch (err) {
      addToast(err?.response?.data?.message || "Failed to add variant", "error");
    } finally {
      setAddingVariant(false);
    }
  }

  async function handleUpdateVariantStock(variantId, stock) {
    try {
      await adminProductApi.updateVariant(variantId, { stock_quantity: Number(stock) });
      addToast("Stock updated", "success");
      setEditingVariant(null);
      fetchProduct();
    } catch {
      addToast("Failed to update stock", "error");
    }
  }

  async function handleDeleteVariant() {
    if (!deleteVariantTarget) return;
    try {
      await adminProductApi.deleteVariant(deleteVariantTarget.id);
      addToast("Variant deleted", "success");
      setDeleteVariantTarget(null);
      fetchProduct();
    } catch {
      addToast("Failed to delete variant", "error");
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner className="py-20" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 text-gray-500 hover:text-brown hover:bg-cream rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {isEdit ? "Edit Product" : "New Product"}
            </h1>
            {product && (
              <p className="text-sm text-gray-500 mt-0.5 font-mono">{product.product_code}</p>
            )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select
                  {...register("category_id", { required: "Category is required" })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>
                )}
              </div>

              {/* Product Code */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Code</label>
                <input
                  {...register("product_code", { required: "Product code is required" })}
                  placeholder="e.g. BN-001"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown font-mono"
                />
                {errors.product_code && (
                  <p className="text-xs text-red-500 mt-1">{errors.product_code.message}</p>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Name</label>
              <input
                {...register("name", { required: "Name is required" })}
                placeholder="Product name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Regular Price (৳)</label>
                <input
                  type="number"
                  {...register("regular_price", { required: "Regular price is required", min: 0 })}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown"
                />
                {errors.regular_price && (
                  <p className="text-xs text-red-500 mt-1">{errors.regular_price.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sale Price (৳) <span className="text-gray-400 font-normal">optional</span></label>
                <input
                  type="number"
                  {...register("sale_price", { min: 0 })}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Short Description</label>
              <textarea
                {...register("short_description")}
                rows={2}
                placeholder="Brief product description"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown resize-none"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Description</label>
              <textarea
                {...register("full_description")}
                rows={4}
                placeholder="Detailed product description"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown resize-none"
              />
            </div>

            {/* Fabric & Care */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fabric</label>
                <input
                  {...register("fabric")}
                  placeholder="e.g. 100% Cotton"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Care Instruction</label>
                <input
                  {...register("care_instruction")}
                  placeholder="e.g. Hand wash cold"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown"
                />
              </div>
            </div>

            {/* Status & Featured */}
            <div className="flex flex-wrap items-center gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                <select
                  {...register("status")}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brown bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="is_featured"
                  {...register("is_featured")}
                  className="w-4 h-4 accent-brown rounded"
                />
                <label htmlFor="is_featured" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500" />
                  Featured Product
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-brown text-ivory px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-dark disabled:opacity-60 transition-colors"
            >
              {saving ? <LoadingSpinner size="sm" /> : null}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>

        {/* ── IMAGE MANAGER (edit mode only) ── */}
        {isEdit && product && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Images</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recommended ratio: 4:5, 2160×2700px. Maximum 5 images.
                </p>
              </div>
              <span className="text-xs text-gray-400">{product.images?.length || 0}/5</span>
            </div>

            {/* Image grid */}
            {product.images?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {product.images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-[4/5] bg-cream">
                    <img
                      src={img.image_url}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                    {img.is_primary && (
                      <span className="absolute top-1.5 left-1.5 bg-gold-muted text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star size={9} fill="currentColor" />
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(img.id)}
                          className="p-1.5 bg-white/90 rounded-lg text-amber-600 hover:bg-white transition-colors"
                          title="Set as primary"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteImageTarget(img)}
                        className="p-1.5 bg-white/90 rounded-lg text-red-600 hover:bg-white transition-colors"
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <ImageIcon size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No images yet</p>
              </div>
            )}

            {/* Upload */}
            {(product.images?.length || 0) < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`inline-flex items-center gap-2 border border-dashed border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl text-sm cursor-pointer hover:border-brown hover:text-brown transition-colors ${imageUploading ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {imageUploading ? <LoadingSpinner size="sm" /> : <Upload size={15} />}
                  {imageUploading ? "Uploading…" : "Upload Image"}
                </label>
              </div>
            )}
            {(product.images?.length || 0) >= 5 && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl inline-block">
                Maximum 5 images reached. Delete an image to upload a new one.
              </p>
            )}
          </div>
        )}

        {/* ── VARIANT MANAGER (edit mode only) ── */}
        {isEdit && product && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">
              Variants
            </h2>

            {/* Existing variants */}
            {product.variants?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Size</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Color</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">SKU</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Stock</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Active</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {product.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{v.size}</td>
                        <td className="px-3 py-2.5 text-gray-600">{v.color || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{v.sku || "—"}</td>
                        <td className="px-3 py-2.5">
                          {editingVariant?.id === v.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={editingVariant.stock_quantity}
                                onChange={(e) => setEditingVariant({ ...editingVariant, stock_quantity: e.target.value })}
                                className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-brown"
                                min="0"
                              />
                              <button
                                onClick={() => handleUpdateVariantStock(v.id, editingVariant.stock_quantity)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingVariant(null)}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className={v.stock_quantity === 0 ? "text-red-500" : "text-gray-800"}>
                              {v.stock_quantity}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${v.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {v.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingVariant({ id: v.id, stock_quantity: v.stock_quantity })}
                              className="p-1.5 text-gray-500 hover:text-brown hover:bg-cream rounded-lg transition-colors"
                              title="Edit stock"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteVariantTarget(v)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete variant"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No variants yet. Add one below.</p>
            )}

            {/* Add variant form */}
            <form onSubmit={handleAddVariant} className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-gray-600">Add Variant</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-gray-500 mb-1">Size *</label>
                  <input
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                    placeholder="e.g. M"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown"
                  />
                  {sizeSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {sizeSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setVariantForm({ ...variantForm, size: s })}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            variantForm.size === s
                              ? "bg-brown text-ivory border-brown"
                              : "border-gray-200 text-gray-600 hover:border-brown hover:text-brown"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-gray-500 mb-1">Color</label>
                  <input
                    value={variantForm.color}
                    onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                    placeholder="e.g. Black"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">Stock *</label>
                  <input
                    type="number"
                    value={variantForm.stock_quantity}
                    onChange={(e) => setVariantForm({ ...variantForm, stock_quantity: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={addingVariant}
                    className="inline-flex items-center gap-1.5 bg-brown text-ivory px-4 py-2 rounded-xl text-sm font-medium hover:bg-brown-dark disabled:opacity-60 transition-colors"
                  >
                    {addingVariant ? <LoadingSpinner size="sm" /> : <Plus size={14} />}
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Image Modal */}
      <ConfirmModal
        isOpen={!!deleteImageTarget}
        title="Delete Image"
        message="This will permanently delete this image. Continue?"
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteImage}
        onCancel={() => setDeleteImageTarget(null)}
      />

      {/* Delete Variant Modal */}
      <ConfirmModal
        isOpen={!!deleteVariantTarget}
        title="Delete Variant"
        message="This will permanently delete this variant. Continue?"
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteVariant}
        onCancel={() => setDeleteVariantTarget(null)}
      />
    </AdminLayout>
  );
}
