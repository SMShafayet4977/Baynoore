import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShoppingBag, Upload, X } from "lucide-react";
import SEO from "../components/SEO";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import { productApi } from "../services/productApi";
import { orderApi } from "../services/orderApi";
import { formatPrice } from "../utils/formatPrice";
import mainLogo from "../assets/baynoore-main-logo.png";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const districtId = watch("district_id");

  useEffect(() => {
    productApi.getDistricts().then((res) => setDistricts(res.data.data || []));
  }, []);

  useEffect(() => {
    if (districtId) {
      const d = districts.find((d) => String(d.id) === String(districtId));
      setDeliveryCharge(d ? Number(d.delivery_charge) : 0);
    }
  }, [districtId, districts]);

  const total = subtotal + deliveryCharge;

  function handleScreenshot(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      addToast("Only JPG, JPEG, PNG, and WEBP images are allowed", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image size must be less than 5MB", "error");
      return;
    }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function onSubmit(data) {
    if (items.length === 0) {
      addToast("Your cart is empty", "error");
      return;
    }
    if (!data.district_id) {
      addToast("Please select a district", "error");
      return;
    }

    if (paymentMethod === "manual_bkash") {
      if (!data.bkashSenderNumber) { addToast("Sender bKash number is required", "error"); return; }
      if (!data.bkashTransactionId) { addToast("Transaction ID is required", "error"); return; }
      if (!data.paidAmount) { addToast("Paid amount is required", "error"); return; }
      if (Number(data.paidAmount) < total) {
        addToast(`Paid amount must be at least ${formatPrice(total)}`, "error");
        return;
      }
      if (!screenshot) { addToast("Payment screenshot is required", "error"); return; }
    }

    setSubmitting(true);
    try {
      const cartItems = items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
      }));

      let res;
      if (paymentMethod === "manual_bkash") {
        const fd = new FormData();
        fd.append("fullName", data.fullName);
        fd.append("phone", data.phone);
        if (data.altPhone) fd.append("altPhone", data.altPhone);
        fd.append("district_id", data.district_id);
        fd.append("area", data.area);
        fd.append("address", data.address);
        if (data.deliveryNote) fd.append("deliveryNote", data.deliveryNote);
        fd.append("paymentMethod", "manual_bkash");
        fd.append("bkashSenderNumber", data.bkashSenderNumber);
        fd.append("bkashTransactionId", data.bkashTransactionId);
        fd.append("paidAmount", data.paidAmount);
        fd.append("paymentScreenshot", screenshot);
        fd.append("items", JSON.stringify(cartItems));
        res = await orderApi.create(fd);
      } else {
        res = await orderApi.create({
          fullName: data.fullName,
          phone: data.phone,
          altPhone: data.altPhone || undefined,
          district_id: data.district_id,
          area: data.area,
          address: data.address,
          deliveryNote: data.deliveryNote || undefined,
          paymentMethod: "cod",
          items: cartItems,
        });
      }

      clearCart();
      navigate(`/order-success/${res.data.data.order_number}`, {
        state: { total: res.data.data.total, paymentStatus: res.data.data.payment_status },
      });
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to place order. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag size={48} className="text-beige mx-auto mb-4" />
          <p className="font-serif text-xl text-brown mb-4">Your cart is empty</p>
          <Link to="/" className="bg-brown text-ivory px-6 py-3 rounded-full text-sm font-medium hover:bg-brown-dark transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Checkout" />
      <div className="min-h-screen bg-ivory">
        {/* Brand header */}
        <div className="bg-white border-b border-beige py-4 px-4 text-center">
          <img src={mainLogo} alt="Baynoore - Modesty with Elegance" className="h-8 w-auto object-contain mx-auto mb-1" />
          <p className="text-xs tracking-[0.2em] text-gold-muted">MODESTY WITH ELEGANCE</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left: Form */}
              <div className="lg:col-span-3 space-y-6">
                {/* Contact */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-serif text-lg text-brown mb-4">Delivery Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brown mb-1.5">Full Name *</label>
                      <input
                        {...register("fullName", { required: "Full name is required" })}
                        className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                        placeholder="Your full name"
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brown mb-1.5">Phone *</label>
                        <input
                          {...register("phone", { required: "Phone is required" })}
                          className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                          placeholder="01XXXXXXXXX"
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brown mb-1.5">Alt. Phone</label>
                        <input
                          {...register("altPhone")}
                          className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown mb-1.5">District *</label>
                      <select
                        {...register("district_id", { required: "District is required" })}
                        className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted bg-white"
                      >
                        <option value="">Select district</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {formatPrice(d.delivery_charge)} delivery
                          </option>
                        ))}
                      </select>
                      {errors.district_id && <p className="text-red-500 text-xs mt-1">{errors.district_id.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown mb-1.5">Area / Thana / Upazila *</label>
                      <input
                        {...register("area", { required: "Area is required" })}
                        className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                        placeholder="e.g. Agrabad, Dhanmondi"
                      />
                      {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown mb-1.5">Full Address *</label>
                      <textarea
                        {...register("address", { required: "Address is required" })}
                        rows={3}
                        className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted resize-none"
                        placeholder="House/flat number, road, area..."
                      />
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown mb-1.5">Delivery Note</label>
                      <input
                        {...register("deliveryNote")}
                        className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                        placeholder="e.g. Call before delivery"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-serif text-lg text-brown mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { value: "cod", label: "Cash on Delivery", sub: "Pay when you receive your order" },
                      { value: "manual_bkash", label: "Manual bKash", sub: "Send payment and upload screenshot" },
                    ].map((m) => (
                      <label
                        key={m.value}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          paymentMethod === m.value ? "border-brown bg-cream" : "border-beige hover:border-brown/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={m.value}
                          checked={paymentMethod === m.value}
                          onChange={() => setPaymentMethod(m.value)}
                          className="mt-0.5 accent-brown"
                        />
                        <div>
                          <p className="text-sm font-medium text-brown">{m.label}</p>
                          <p className="text-xs text-brown-light">{m.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* bKash section */}
                  {paymentMethod === "manual_bkash" && (
                    <div className="mt-5 p-4 bg-pink-50 border border-pink-200 rounded-xl space-y-4">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-brown">Baynoore bKash Number</p>
                        <p className="text-xl font-bold text-pink-600 mt-1">+8801794529766</p>
                        <p className="text-xs text-brown-light mt-2 leading-relaxed">
                          Please send the exact total amount to the Baynoore bKash number above. Then enter your sender number, transaction ID, paid amount, and upload a screenshot of the payment confirmation.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brown mb-1.5">Your bKash Number *</label>
                        <input
                          {...register("bkashSenderNumber")}
                          className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brown mb-1.5">Transaction ID *</label>
                        <input
                          {...register("bkashTransactionId")}
                          className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                          placeholder="e.g. ABC123XYZ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brown mb-1.5">Paid Amount (৳) *</label>
                        <input
                          {...register("paidAmount")}
                          type="number"
                          className="w-full border border-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-muted"
                          placeholder={String(total)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brown mb-1.5">Payment Screenshot *</label>
                        {screenshotPreview ? (
                          <div className="relative inline-block">
                            <img src={screenshotPreview} alt="Payment screenshot" className="w-32 h-40 object-cover rounded-xl border border-beige" />
                            <button
                              type="button"
                              onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-beige rounded-xl p-6 cursor-pointer hover:border-gold-muted transition-colors">
                            <Upload size={24} className="text-brown-light mb-2" />
                            <p className="text-sm text-brown-light">Click to upload screenshot</p>
                            <p className="text-xs text-brown-light mt-1">JPG, PNG, WEBP · Max 5MB</p>
                            <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                  <h2 className="font-serif text-lg text-brown mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={16} className="text-beige" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-brown line-clamp-2">{item.name}</p>
                          <p className="text-xs text-brown-light">{item.size} {item.color} × {item.quantity}</p>
                        </div>
                        <p className="text-xs font-semibold text-brown shrink-0">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-beige pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brown-light">Subtotal</span>
                      <span className="text-brown">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brown-light">Delivery</span>
                      <span className="text-brown">{deliveryCharge > 0 ? formatPrice(deliveryCharge) : "—"}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-brown border-t border-beige pt-2 mt-2">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 w-full bg-brown text-ivory py-4 rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Placing Order..." : `Place Order · ${formatPrice(total)}`}
                  </button>
                  <p className="text-xs text-brown-light text-center mt-3">
                    By placing your order, you agree to our exchange policy.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
