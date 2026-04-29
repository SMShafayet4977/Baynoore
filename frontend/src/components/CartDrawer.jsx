import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, isDrawerOpen, closeDrawer } = useCart();

  return (
    <>
      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-ivory z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-beige">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brown" />
            <h2 className="font-serif text-lg text-brown">Your Cart</h2>
            {items.length > 0 && (
              <span className="bg-gold-muted text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <button onClick={closeDrawer} className="p-2 text-brown-light hover:text-brown transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-beige mb-4" />
              <p className="font-serif text-lg text-brown mb-2">Your cart is empty</p>
              <p className="text-brown-light text-sm mb-6">Add some beautiful pieces to get started.</p>
              <button
                onClick={closeDrawer}
                className="bg-brown text-ivory px-6 py-3 rounded-full text-sm font-medium hover:bg-brown-dark transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={20} className="text-beige" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brown-light">{item.productCode}</p>
                    <p className="text-sm font-medium text-brown line-clamp-2 leading-snug">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.size && <span className="text-xs bg-cream text-brown px-2 py-0.5 rounded-full">{item.size}</span>}
                      {item.color && <span className="text-xs bg-cream text-brown px-2 py-0.5 rounded-full">{item.color}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 border border-beige rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.productId, item.quantity - 1)}
                          className="p-1.5 text-brown hover:text-gold-muted transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-medium text-brown w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.productId, item.quantity + 1)}
                          className="p-1.5 text-brown hover:text-gold-muted transition-colors"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-brown">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId, item.productId)}
                    className="self-start p-1.5 text-brown-light hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-beige px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brown-light">Subtotal</span>
              <span className="font-semibold text-brown">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-brown-light">Delivery charge calculated at checkout</p>
            <Link
              to="/checkout"
              onClick={closeDrawer}
              className="block w-full bg-brown text-ivory text-center py-3.5 rounded-xl font-medium hover:bg-brown-dark transition-colors"
            >
              Proceed to Checkout
            </Link>
            <Link
              to="/cart"
              onClick={closeDrawer}
              className="block w-full border border-beige text-brown text-center py-3 rounded-xl text-sm font-medium hover:bg-cream transition-colors"
            >
              View Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
