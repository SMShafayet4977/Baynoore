import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Star, ChevronLeft, ChevronRight } from "lucide-react";
import AdminLayout from "../AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { adminProductApi, productApi } from "../../services/productApi";

const PRODUCT_STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  out_of_stock: "bg-red-100 text-red-700",
};

const LIMIT = 20;

export default function AdminProducts() {
  const { isSuperAdmin } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("category_id") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch categories once
  useEffect(() => {
    productApi.getCategories()
      .then((res) => setCategories(res.data.data || res.data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (search) params.search = search;
    if (categoryId) params.category_id = categoryId;
    if (status) params.status = status;

    adminProductApi.getAll(params)
      .then((res) => {
        const d = res.data;
        setProducts(d.data || []);
        setTotalPages(d.pagination?.totalPages || 1);
        setTotalCount(d.pagination?.total || 0);
      })
      .catch(() => addToast("Failed to load products", "error"))
      .finally(() => setLoading(false));
  }, [page, search, categoryId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync filters to URL
  useEffect(() => {
    const p = {};
    if (search) p.search = search;
    if (categoryId) p.category_id = categoryId;
    if (status) p.status = status;
    if (page > 1) p.page = page;
    setSearchParams(p, { replace: true });
  }, [search, categoryId, status, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminProductApi.delete(deleteTarget.id);
      addToast("Product deleted", "success");
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      addToast("Failed to delete product", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">{totalCount} total products</p>
          </div>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 bg-brown text-ivory px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-dark transition-colors"
          >
            <Plus size={16} />
            New Product
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brown"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-20" />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              message="Try adjusting your filters or add a new product."
              action={
                <Link
                  to="/admin/products/new"
                  className="inline-flex items-center gap-2 bg-brown text-ivory px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-dark transition-colors"
                >
                  <Plus size={15} />
                  Add Product
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Stock</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Featured</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      {/* Image + Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                            {product.primary_image ? (
                              <img
                                src={product.primary_image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-beige" />
                            )}
                          </div>
                          <span className="font-medium text-gray-800 line-clamp-2 max-w-[160px]">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      {/* Code */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs text-gray-500">{product.product_code}</span>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600 text-xs">
                        {product.category_name || "—"}
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {product.sale_price ? (
                            <>
                              <p className="font-medium text-gray-800">৳{Number(product.sale_price).toLocaleString("en-BD")}</p>
                              <p className="text-xs text-gray-400 line-through">৳{Number(product.regular_price).toLocaleString("en-BD")}</p>
                            </>
                          ) : (
                            <p className="font-medium text-gray-800">৳{Number(product.regular_price).toLocaleString("en-BD")}</p>
                          )}
                        </div>
                      </td>
                      {/* Stock */}
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-700">
                        {product.stock_quantity ?? "—"}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${PRODUCT_STATUS_COLORS[product.status] || "bg-gray-100 text-gray-600"}`}>
                          {product.status?.replace("_", " ")}
                        </span>
                      </td>
                      {/* Featured */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {product.is_featured ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <Star size={11} fill="currentColor" />
                            Featured
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="p-1.5 text-gray-500 hover:text-brown hover:bg-cream rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </Link>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-brown text-ivory"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Product"
        message="This will permanently delete the product. Continue?"
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
