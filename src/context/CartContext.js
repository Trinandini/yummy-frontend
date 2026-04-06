import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);

  const addToCart = (item, restaurant) => {
    if (cartRestaurant && cartRestaurant._id !== restaurant._id) {
      if (!window.confirm('Your cart has items from another restaurant. Clear cart and add new item?')) return;
      setCart([]);
    }
    setCartRestaurant(restaurant);
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const updated = prev.map(i => i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
      if (updated.length === 0) setCartRestaurant(null);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCartRestaurant(null);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartRestaurant, addToCart, removeFromCart, clearCart, totalAmount, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
