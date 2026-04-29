import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

const CART_KEY = "baynoore_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(item) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.variantId === item.variantId && i.productId === item.productId
      );
      if (existing) {
        const newQty = Math.min(existing.quantity + item.quantity, item.stock);
        return prev.map((i) =>
          i.variantId === item.variantId && i.productId === item.productId
            ? { ...i, quantity: newQty }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(item.quantity, item.stock) }];
    });
  }

  function removeItem(variantId, productId) {
    setItems((prev) =>
      prev.filter((i) => !(i.variantId === variantId && i.productId === productId))
    );
  }

  function updateQuantity(variantId, productId, quantity) {
    if (quantity < 1) {
      removeItem(variantId, productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId && i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
