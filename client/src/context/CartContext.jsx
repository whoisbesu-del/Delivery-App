import React, { createContext, useContext, useState, useCallback } from 'react';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState(null);
  const [items, setItems] = useState([]);

  const addItem = useCallback((store, product) => {
    setItems(prev => {
      const sameStore = storeId === store.id;
      const base = sameStore ? prev : [];
      const existing = base.find(i => i.productId === product.id);
      if (existing) return base.map(i => i.productId===product.id ? {...i, quantity:i.quantity+1} : i);
      return [...base, { productId:product.id, name:product.name, price:product.price, image:product.image, quantity:1 }];
    });
    setStoreId(store.id);
    setStoreName(store.name);
  }, [storeId]);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems(prev => quantity<=0 ? prev.filter(i=>i.productId!==productId) : prev.map(i=>i.productId===productId?{...i,quantity}:i));
  }, []);

  const clearCart = useCallback(() => { setItems([]); setStoreId(null); setStoreName(null); }, []);
  const subtotal = items.reduce((s,i)=>s+i.price*i.quantity, 0);
  const itemCount = items.reduce((s,i)=>s+i.quantity, 0);

  return <CartContext.Provider value={{ storeId, storeName, items, addItem, updateQuantity, clearCart, subtotal, itemCount }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
