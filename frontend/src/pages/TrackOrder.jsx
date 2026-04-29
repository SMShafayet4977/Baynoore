import { useState } from "react";
import { Package, CheckCircle, Truck, MapPin, Clock } from "lucide-react";
import SEO from "../components/SEO";
import { orderApi } from "../services/orderApi";
import { formatPrice } from "../utils/formatPrice";

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_COLORS = {
  pending: "text-amber-600 bg-amber-50",
  confirmed: "text-blue-600 bg-blue-50",
  processing: "text-purple-600 bg-purple-50",
  shipped: "text-indigo-600 bg-indigo-50",
  delivered: "text-green-600 bg-green-50",
  cancelled: "text-red-600 bg-red-50",
  returned: "text-gray-600 bg-gray-50",
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrack(e) {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await orderApi.track(orderNumber.trim());
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Order not found. Please check your order number.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? STATUS_STEPS.indexOf(order.order_status) : -1;

  return (
    <>
      <SEO title="Track Order" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-brown mb-2">Track Your Order</h1>
          <div className="gold-line mx-auto mb-4" />
          <p className="text-brown-light text-sm">Enter your order number to see the latest status.</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. BN-20260429-0001"
            className="flex-1 border border-beige rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brown text-ivory px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-brown-dark transition-colors disabled:opacity-60"
          >
            {loading ? "..." : "Track"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6">
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-5">
            {/* Status card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-brown-light mb-1">Order Number</p>
                  <p className="font-mono font-bold text-brown">{order.order_number}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.order_status] || "text-brown bg-cream"}`}>
                  {STATUS_LABELS[order.order_status] || order.order_status}
                </span>
              </div>

              {/* Timeline */}
              {!["cancelled", "returned"].includes(order.order_status) && (
                <div className="flex items-center justify-between mt-6 mb-2">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        i <= currentStep
                          ? "bg-brown border-brown text-ivory"
                          : "bg-white border-beige text-brown-light"
                      }`}>
                        {i < currentStep ? <CheckCircle size={14} /> : i + 1}
                      </div>
                      <p className={`text-[10px] mt-1.5 text-center ${i <= currentStep ? "text-brown font-medium" : "text-brown-light"}`}>
                        {STATUS_LABELS[step]}
                      </p>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`absolute h-0.5 w-full ${i < currentStep ? "bg-brown" : "bg-beige"}`} style={{ display: "none" }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-beige">
                <div>
                  <p className="text-xs text-brown-light mb-1">Payment Status</p>
                  <p className="text-sm font-medium text-brown capitalize">{order.payment_status?.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-brown-light mb-1">Total</p>
                  <p className="text-sm font-semibold text-brown">{formatPrice(order.total)}</p>
                </div>
                {order.courier_name && (
                  <div>
                    <p className="text-xs text-brown-light mb-1">Courier</p>
                    <p className="text-sm text-brown">{order.courier_name}</p>
                  </div>
                )}
                {order.courier_tracking_id && (
                  <div>
                    <p className="text-xs text-brown-light mb-1">Tracking ID</p>
                    <p className="text-sm font-mono text-brown">{order.courier_tracking_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            {order.items?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-serif text-base text-brown mb-4">Items Ordered</h3>
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-brown">{item.product_name}</p>
                        <p className="text-xs text-brown-light">
                          {item.size && `Size: ${item.size}`}
                          {item.color && ` · Color: ${item.color}`}
                          {` · Qty: ${item.quantity}`}
                        </p>
                      </div>
                      <p className="font-semibold text-brown shrink-0 ml-4">{formatPrice(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
