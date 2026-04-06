import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cart, cartRestaurant, totalAmount, clearCart, addToCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user?.address || '');
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const delivery = 40;
  const taxes = Math.round(totalAmount * 0.05);
  const grandTotal = totalAmount + delivery + taxes;

  const handlePlaceOrder = async () => {
    if (!address.trim()) { toast.error('Please enter delivery address'); return; }
    setPlacing(true);
    try {
      const { data } = await axios.post('/api/orders/place', {
        restaurantId: cartRestaurant._id,
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        totalAmount: grandTotal,
        deliveryAddress: address,
      });
      setOrderId(data._id);
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa, #e8f5e9)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white', borderRadius: '20px', padding: '3rem', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxWidth: '450px', width: '100%',
          animation: 'fadeInUp 0.5s ease'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>🎉</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--accent)' }}>
            Order Placed!
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Your order is being processed by the restaurant.
          </p>
          <div style={{
            background: '#f0fff4', borderRadius: '12px', padding: '1rem',
            border: '2px solid var(--accent)', marginBottom: '1.5rem'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)' }}>⏳ Status: In Process</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.3rem' }}>
              The restaurant owner is reviewing your order
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => navigate('/my-orders')}
              className="action-btn btn-primary"
              style={{ flex: 1, borderRadius: '12px', padding: '0.9rem' }}
            >
              📦 Track Order
            </button>
            <button
              onClick={() => navigate('/')}
              className="action-btn"
              style={{ flex: 1, background: '#f0f0f0', borderRadius: '12px', padding: '0.9rem' }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '6rem 2rem' }}>
        <div className="emoji">🛒</div>
        <h3>Your cart is empty</h3>
        <p style={{ marginBottom: '1.5rem' }}>Add some delicious food to get started!</p>
        <button onClick={() => navigate('/')} className="action-btn btn-primary">
          🍽️ Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>🛒 Your Cart</h1>
      {cartRestaurant && (
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          From: <strong>{cartRestaurant.name}</strong>
        </p>
      )}

      <div className="cart-items">
        {cart.map(item => (
          <div className="cart-item" key={item._id}>
            <img src={item.image} alt={item.name} className="cart-item-img" />
            <div className="cart-item-info">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">₹{item.price} each</div>
            </div>
            <div className="qty-control">
              <button className="qty-btn minus" onClick={() => removeFromCart(item._id)}>−</button>
              <span className="qty-num">{item.quantity}</span>
              <button className="qty-btn plus" onClick={() => addToCart(item, cartRestaurant)}>+</button>
            </div>
            <div style={{ fontWeight: 800, minWidth: '70px', textAlign: 'right' }}>
              ₹{item.price * item.quantity}
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="form-group">
          <label className="form-label">📍 Delivery Address</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your full delivery address"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>

        <div className="summary-row"><span>Subtotal</span><span>₹{totalAmount}</span></div>
        <div className="summary-row"><span>🛵 Delivery</span><span>₹{delivery}</span></div>
        <div className="summary-row"><span>Taxes (5%)</span><span>₹{taxes}</span></div>
        <div className="summary-row"><span>Total</span><span style={{ color: 'var(--primary)' }}>₹{grandTotal}</span></div>

        <button
          className="place-order-btn"
          onClick={handlePlaceOrder}
          disabled={placing}
        >
          {placing ? '⏳ Placing Order...' : `🚀 Place Order • ₹${grandTotal}`}
        </button>
      </div>
    </div>
  );
};

export default Cart;
