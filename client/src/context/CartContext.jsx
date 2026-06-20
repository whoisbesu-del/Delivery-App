import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState(null);
  const [items, setItems] = useState([]); // [{itemId, name, price, quantity}]

  const addItem = useCallback((store, item) => {
    setItems((prev) => {
      // Switching stores clears the cart — Relay delivers from one place at a time.
      const sameStore = storeId === store.id;
      const base = sameStore ? prev : [];
      const existing = base.find((i) => i.itemId === item.id);
      if (existing) {
        return base.map((i) => (i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...base, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    setStoreId(store.id);
    setStoreName(store.name);
  }, [storeId]);

  const updateQuantity = useCallback((itemId, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.itemId !== itemId);
      return prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setStoreId(null);
    setStoreName(null);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ storeId, storeName, items, addItem, updateQuantity, clearCart, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
