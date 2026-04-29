import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";
import EmptyState from "../components/EmptyState";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  return (
    <>
      <SEO title="Your Cart" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-brown mb-2">Your Cart</h1>
          <div className="gold-line" />
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            message="Browse our collection and add something beautiful."
            actionTo="/"
            actionLabel="Continue Shopping"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm">
                  <Link to={`/product/${item.slug}`} className="w-20 h-24 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={24} className="text-beige" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brown-light">{item.productCode}</p>
                    <Link to={`/product/${item.slug}`} className="text-sm font-medium text-brown hover:text-gold-muted transition-colors line-clamp-2">
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {item.size && <span className="text-xs bg-cream text-brown px-2 py-0.5 rounded-full">{item.size}</span>}
                      {item.color && <span className="text-xs bg-cream text-brown px-2 py-0.5 rounded-full">{item.color}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-beige rounded-xl overflow-hidden">
                        <button onClick={() => updateQuantity(item.variantId, item.productId, item.quantity - 1)} className="px-3 py-2 text-brown hover:bg-cream transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-brown border-x border-beige">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.variantId, item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="px-3 py-2 text-brown hover:bg-cream transition-colors disabled:opacity-40">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-semibold text-brown">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.variantId, item.productId)} className="self-start p-2 text-brown-light hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="font-serif text-lg text-brown mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-light">Subtotal ({items.length} items)</span>
                    <span className="font-medium text-brown">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-light">Delivery</span>
                    <span className="text-brown-light">Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t border-beige pt-4 mb-5">
                  <div className="flex justify-between font-semibold text-brown">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
                <Link
                  to="/checkout"
                  className="flex items-center justify-center gap-2 w-full bg-brown text-ivory py-3.5 rounded-xl font-medium hover:bg-brown-dark transition-colors"
                >
                  Checkout <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
