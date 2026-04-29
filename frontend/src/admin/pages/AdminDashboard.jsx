import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Package, TrendingUp, AlertTriangle } from "lucide-react";
import AdminLayout from "../AdminLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import { adminApi } from "../../services/adminApi";
import { formatPrice } from "../../utils/formatPrice";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-gray-100 text-gray-700",
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><LoadingSpinner className="py-20" /></AdminLayout>;

  const statCards = [
    { label: "Today's Orders", value: data?.today_orders ?? 0, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
    { label: "Today's Sales", value: formatPrice(data?.today_sales ?? 0), icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "Total Sales", value: formatPrice(data?.total_sales ?? 0), icon: TrendingUp, color: "bg-gold-muted/10 text-gold-muted" },
    { label: "Low Stock", value: data?.low_stock_products ?? 0, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
  ];

  const statusCards = [
    { label: "Pending", value: data?.pending_orders ?? 0, key: "pending" },
    { label: "Confirmed", value: data?.confirmed_orders ?? 0, key: "confirmed" },
    { label: "Processing", value: data?.processing_orders ?? 0, key: "processing" },
    { label: "Shipped", value: data?.shipped_orders ?? 0, key: "shipped" },
    { label: "Delivered", value: data?.delivered_orders ?? 0, key: "delivered" },
    { label: "Cancelled", value: data?.cancelled_orders ?? 0, key: "cancelled" },
    { label: "Returned", value: data?.returned_orders ?? 0, key: "returned" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back to Baynoore Admin</p>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Order status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {statusCards.map(({ label, value, key }) => (
              <Link
                key={key}
                to={`/admin/orders?status=${key}`}
                className="text-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <p className="text-xl font-bold text-gray-800">{value}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[key]}`}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        {data?.recent_orders?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-gold-muted hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Order", "Customer", "District", "Total", "Payment", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/admin/orders/${order.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{order.customer_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{order.district_name}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize text-gray-500">{order.payment_status?.replace("_", " ")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.order_status] || "bg-gray-100 text-gray-600"}`}>
                          {order.order_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
