import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import AdminLayout from "../AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../components/Toast";
import { adminOrderApi } from "../../services/orderApi";
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

const PAYMENT_STATUS_COLORS = {
  unpaid: "bg-gray-100 text-gray-600",
  pending_verification: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

// Status transitions that affect stock
const STOCK_REDUCE_STATUSES = ["confirmed"];
const STOCK_RETURN_STATUSES = ["cancelled", "returned"];

export default function AdminOrderDetails() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Action states
  const [statusConfirm, setStatusConfirm] = useState(null); // { status, label, message }
  const [courierForm, setCourierForm] = useState({ courier_name: "", courier_tracking_id: "" });
  const [noteForm, setNoteForm] = useState("");
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    adminOrderApi
      .getById(id)
      .then((res) => {
        const o = res.data.data;
        setOrder(o);
        setCourierForm({
          courier_name: o.courier_name || "",
          courier_tracking_id: o.courier_tracking_id || "",
        });
        setNoteForm(o.admin_note || "");
      })
      .catch(() => addToast("Failed to load order", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function requestStatusChange(status) {
    const isConfirm = STOCK_REDUCE_STATUSES.includes(status);
    const isReturn = STOCK_RETURN_STATUSES.includes(status);
    const currentIsConfirmed = ["confirmed", "processing", "shipped"].includes(order?.order_status);

    let message = `Change order status to "${status}"?`;
    if (isConfirm && !order?.stock_deducted) {
      message = "Confirming this order will reduce stock. Continue?";
    } else if (isReturn && currentIsConfirmed && order?.stock_deducted) {
      message = "This will return stock to inventory. Continue?";
    }

    setStatusConfirm({ status, label: status.charAt(0).toUpperCase() + status.slice(1), message });
  }

  async function handleStatusChange() {
    if (!statusConfirm) return;
    setSubmitting(true);
    try {
      await adminOrderApi.updateStatus(id, { status: statusConfirm.status });
      addToast(`Order status updated to ${statusConfirm.status}`, "success");
      setStatusConfirm(null);
      fetchOrder();
    } catch (err) {
      addToast(err?.response?.data?.message || "Failed to update status", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCourierUpdate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminOrderApi.updateCourier(id, courierForm);
      addToast("Courier information updated", "success");
      setShowCourierForm(false);
      fetchOrder();
    } catch {
      addToast("Failed to update courier", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNoteUpdate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminOrderApi.updateNote(id, { admin_note: noteForm });
      addToast("Admin note updated", "success");
      setShowNoteForm(false);
      fetchOrder();
    } catch {
      addToast("Failed to update note", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentUpdate(paymentStatus) {
    setSubmitting(true);
    try {
      await adminOrderApi.updatePayment(id, { payment_status: paymentStatus });
      addToast(`Payment marked as ${paymentStatus}`, "success");
      fetchOrder();
    } catch {
      addToast("Failed to update payment", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-BD", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner className="py-20" />
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-500">Order not found.</div>
      </AdminLayout>
    );
  }

  const isBkash = order.payment_method === "manual_bkash";
  const mp = order.manual_payment;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 text-gray-500 hover:text-brown hover:bg-cream rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-gray-800 font-mono">{order.order_number}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.order_status] || "bg-gray-100 text-gray-600"}`}>
                {order.order_status}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${PAYMENT_STATUS_COLORS[order.payment_status] || "bg-gray-100 text-gray-600"}`}>
                {order.payment_status?.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Customer Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="font-medium text-gray-800">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <p className="text-gray-700">{order.phone}</p>
                </div>
                {order.alternative_phone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Alt. Phone</p>
                    <p className="text-gray-700">{order.alternative_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">District</p>
                  <p className="text-gray-700">{order.district_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Area</p>
                  <p className="text-gray-700">{order.area}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Full Address</p>
                  <p className="text-gray-700">{order.full_address}</p>
                </div>
                {order.delivery_note && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Delivery Note</p>
                    <p className="text-gray-700 italic">{order.delivery_note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Items</h2>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-sm py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{item.product_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">{item.product_code}</p>
                      <div className="flex gap-2 mt-1">
                        {item.size && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Size: {item.size}</span>}
                        {item.color && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Color: {item.color}</span>}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-semibold text-gray-800">{formatPrice(item.total)}</p>
                      <p className="text-xs text-gray-400">{formatPrice(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{formatPrice(order.delivery_charge)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* bKash Payment Card */}
            {isBkash && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-pink-400">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">
                  bKash Payment Verification
                </h2>
                {mp ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Sender Number</p>
                        <p className="font-medium text-gray-800">{mp.sender_number || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Transaction ID</p>
                        <p className="font-mono font-medium text-gray-800">{mp.transaction_id || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Paid Amount</p>
                        <p className="font-semibold text-gray-800">{mp.amount ? formatPrice(mp.amount) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Verification Status</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                          mp.verification_status === "verified" ? "bg-green-100 text-green-700" :
                          mp.verification_status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {mp.verification_status}
                        </span>
                      </div>
                    </div>

                    {/* Screenshot */}
                    {mp.screenshot_url && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Payment Screenshot</p>
                        <div className="flex items-start gap-3">
                          <a href={mp.screenshot_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={mp.screenshot_url}
                              alt="Payment screenshot"
                              className="w-28 h-36 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                            />
                          </a>
                          <a
                            href={mp.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-1"
                          >
                            <ExternalLink size={12} />
                            Open full size
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Verification actions */}
                    {mp.verification_status === "pending" && (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handlePaymentUpdate("paid")}
                          disabled={submitting}
                          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                        >
                          ✓ Mark as Paid
                        </button>
                        <button
                          onClick={() => handlePaymentUpdate("failed")}
                          disabled={submitting}
                          className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                          ✗ Mark as Failed
                        </button>
                      </div>
                    )}
                    {mp.verification_status !== "pending" && (
                      <button
                        onClick={() => handlePaymentUpdate("pending_verification")}
                        disabled={submitting}
                        className="text-xs text-gray-500 hover:text-brown underline"
                      >
                        Reset to pending
                      </button>
                    )}
                    {mp.verified_by_name && (
                      <p className="text-xs text-gray-400">
                        Verified by {mp.verified_by_name} on {formatDate(mp.verified_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No payment record found.</p>
                )}
              </div>
            )}

            {/* Status History */}
            {order.status_history?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Status History</h2>
                <div className="space-y-3">
                  {order.status_history.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-gold-muted mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-700">
                          <span className="font-medium capitalize">{h.old_status || "—"}</span>
                          {" → "}
                          <span className="font-medium capitalize">{h.new_status}</span>
                        </p>
                        {h.note && <p className="text-xs text-gray-500 mt-0.5 italic">{h.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {h.changed_by_name && `by ${h.changed_by_name} · `}
                          {formatDate(h.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — Actions */}
          <div className="space-y-5">
            {/* Order Status Actions */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Update Status</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { status: "confirmed", label: "Confirm", color: "bg-blue-600 hover:bg-blue-700" },
                  { status: "processing", label: "Processing", color: "bg-purple-600 hover:bg-purple-700" },
                  { status: "shipped", label: "Shipped", color: "bg-indigo-600 hover:bg-indigo-700" },
                  { status: "delivered", label: "Delivered", color: "bg-green-600 hover:bg-green-700" },
                  { status: "cancelled", label: "Cancel", color: "bg-red-600 hover:bg-red-700" },
                  { status: "returned", label: "Return", color: "bg-gray-600 hover:bg-gray-700" },
                ].map(({ status, label, color }) => (
                  <button
                    key={status}
                    onClick={() => requestStatusChange(status)}
                    disabled={submitting || order.order_status === status}
                    className={`py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Actions (COD) */}
            {!isBkash && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Payment</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentUpdate("paid")}
                    disabled={submitting || order.payment_status === "paid"}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handlePaymentUpdate("unpaid")}
                    disabled={submitting || order.payment_status === "unpaid"}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-xl text-xs font-medium hover:bg-gray-600 disabled:opacity-40 transition-colors"
                  >
                    Mark Unpaid
                  </button>
                </div>
              </div>
            )}

            {/* Courier */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h2 className="text-sm font-semibold text-gray-700">Courier</h2>
                <button
                  onClick={() => setShowCourierForm(!showCourierForm)}
                  className="text-xs text-gold-muted hover:underline"
                >
                  {showCourierForm ? "Cancel" : "Edit"}
                </button>
              </div>
              {showCourierForm ? (
                <form onSubmit={handleCourierUpdate} className="space-y-3">
                  <input
                    value={courierForm.courier_name}
                    onChange={(e) => setCourierForm({ ...courierForm, courier_name: e.target.value })}
                    placeholder="Courier name (e.g. Steadfast)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown"
                  />
                  <input
                    value={courierForm.courier_tracking_id}
                    onChange={(e) => setCourierForm({ ...courierForm, courier_tracking_id: e.target.value })}
                    placeholder="Tracking ID"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown font-mono"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brown text-ivory py-2 rounded-xl text-sm font-medium hover:bg-brown-dark disabled:opacity-60 transition-colors"
                  >
                    {submitting ? "Saving…" : "Save Courier"}
                  </button>
                </form>
              ) : (
                <div className="text-sm space-y-1.5">
                  <div>
                    <p className="text-xs text-gray-400">Courier</p>
                    <p className="text-gray-700">{order.courier_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Tracking ID</p>
                    <p className="font-mono text-gray-700">{order.courier_tracking_id || "—"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Note */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h2 className="text-sm font-semibold text-gray-700">Admin Note</h2>
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className="text-xs text-gold-muted hover:underline"
                >
                  {showNoteForm ? "Cancel" : "Edit"}
                </button>
              </div>
              {showNoteForm ? (
                <form onSubmit={handleNoteUpdate} className="space-y-3">
                  <textarea
                    value={noteForm}
                    onChange={(e) => setNoteForm(e.target.value)}
                    rows={3}
                    placeholder="Internal note for this order..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brown resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brown text-ivory py-2 rounded-xl text-sm font-medium hover:bg-brown-dark disabled:opacity-60 transition-colors"
                  >
                    {submitting ? "Saving…" : "Save Note"}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-600 italic">
                  {order.admin_note || <span className="text-gray-400 not-italic">No note added.</span>}
                </p>
              )}
            </div>

            {/* Confirmation info */}
            {order.confirmed_by && (
              <div className="bg-white rounded-2xl p-5 shadow-sm text-sm">
                <h2 className="text-xs font-semibold text-gray-500 mb-2">Confirmation</h2>
                <p className="text-gray-700">Confirmed by: {order.confirmed_by_name || `Admin #${order.confirmed_by}`}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.confirmed_at)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Confirm Modal */}
      <ConfirmModal
        isOpen={!!statusConfirm}
        title={`Change to ${statusConfirm?.label}`}
        message={statusConfirm?.message || ""}
        confirmLabel={submitting ? "Updating…" : statusConfirm?.label}
        danger={STOCK_RETURN_STATUSES.includes(statusConfirm?.status)}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusConfirm(null)}
      />
    </AdminLayout>
  );
}
