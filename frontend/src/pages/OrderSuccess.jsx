import { useParams, useLocation, Link } from "react-router-dom";
import { CheckCircle, Package, MessageCircle, ShoppingBag } from "lucide-react";
import SEO from "../components/SEO";
import { whatsappOrderLink } from "../utils/whatsapp";
import { formatPrice } from "../utils/formatPrice";
import mainLogo from "../assets/baynoore-main-logo.png";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const paymentStatus = state?.paymentStatus;
  const total = state?.total;
  const isBkash = paymentStatus === "pending_verification";

  return (
    <>
      <SEO title="Order Placed Successfully" />
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <img src={mainLogo} alt="Baynoore" className="h-10 w-auto object-contain mx-auto mb-6" />

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-600" />
            </div>

            <h1 className="font-serif text-2xl text-brown mb-2">Order Placed!</h1>
            <p className="text-xs tracking-[0.2em] text-gold-muted mb-4">MODESTY WITH ELEGANCE</p>

            <div className="bg-cream rounded-xl p-4 mb-5">
              <p className="text-xs text-brown-light mb-1">Order Number</p>
              <p className="font-mono font-bold text-brown text-lg">{orderNumber}</p>
              {total && (
                <>
                  <p className="text-xs text-brown-light mt-2 mb-1">Total Amount</p>
                  <p className="font-semibold text-brown">{formatPrice(total)}</p>
                </>
              )}
            </div>

            <p className="text-sm text-brown-light leading-relaxed mb-6">
              {isBkash
                ? "Your bKash payment is pending verification. We will confirm your order after checking the transaction."
                : "Thank you for choosing Baynoore. Your order has been placed successfully. Our team may call you before shipping."}
            </p>

            <div className="space-y-3">
              <Link
                to={`/track-order`}
                className="flex items-center justify-center gap-2 w-full border-2 border-brown text-brown py-3.5 rounded-xl font-medium hover:bg-brown hover:text-ivory transition-colors"
              >
                <Package size={18} />
                Track Order
              </Link>
              <a
                href={whatsappOrderLink(orderNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-green-300 text-green-700 py-3.5 rounded-xl font-medium hover:bg-green-50 transition-colors"
              >
                <MessageCircle size={18} />
                Contact on WhatsApp
              </a>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 w-full text-brown-light py-3 text-sm hover:text-brown transition-colors"
              >
                <ShoppingBag size={16} />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
