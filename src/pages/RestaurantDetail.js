import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, removeFromCart, totalItems } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`/api/restaurants/${id}`);
        setRestaurant(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem' }}>
      <div className="loader" style={{ margin: '0 auto' }}></div>
    </div>
  );

  if (!restaurant) return <div className="empty-state"><div className="emoji">😕</div><h3>Restaurant not found</h3></div>;

  const getItemQty = (itemId) => {
    const item = cart.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  const handleAdd = (item) => {
    if (!user) { toast.info('Please login to add items to cart'); return; }
    if (user.role !== 'customer') { toast.info('Only customers can order food'); return; }
    addToCart(item, restaurant);
    toast.success(`${item.name} added to cart! 🛒`);
  };

  // Group menu by category
  const categories = [...new Set(restaurant.menu.map(item => item.category))];

  return (
    <div>
      <img src={restaurant.image} alt={restaurant.name} className="restaurant-hero" />

      <div className="restaurant-header">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1>{restaurant.name}</h1>
          <p style={{ color: 'var(--text-light)', margin: '0.3rem 0' }}>{restaurant.cuisine} Cuisine • {restaurant.description}</p>
          <div className="restaurant-meta" style={{ marginTop: '0.8rem' }}>
            <span className="meta-item"><span className="star">⭐</span> {restaurant.rating} Rating</span>
            <span className="meta-item"><span className="time">🕐</span> {restaurant.deliveryTime}</span>
            <span className="meta-item">🛵 Min order: ₹{restaurant.minOrder}</span>
          </div>
        </div>
      </div>

      <div className="section">
        {categories.map(category => {
          const items = restaurant.menu.filter(item => item.category === category && item.isAvailable);
          if (!items.length) return null;
          return (
            <div className="menu-category" key={category}>
              <div className="category-title">{category}</div>
              <div className="menu-grid">
                {items.map(item => {
                  const qty = getItemQty(item._id);
                  return (
                    <div className="menu-card" key={item._id}>
                      <img src={item.image} alt={item.name} className="menu-img" />
                      <div className="menu-info">
                        <div className="menu-name">{item.name}</div>
                        <div className="menu-desc">{item.description}</div>
                      </div>
                      <div className="menu-footer">
                        <span className="menu-price">₹{item.price}</span>
                        {qty === 0 ? (
                          <button className="qty-btn plus" onClick={() => handleAdd(item)} style={{ width: 'auto', padding: '0.4rem 1rem', borderRadius: '8px' }}>
                            + Add
                          </button>
                        ) : (
                          <div className="qty-control">
                            <button className="qty-btn minus" onClick={() => removeFromCart(item._id)}>−</button>
                            <span className="qty-num">{qty}</span>
                            <button className="qty-btn plus" onClick={() => handleAdd(item)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart */}
      {totalItems > 0 && user?.role === 'customer' && (
        <Link to="/cart" className="floating-cart">
          🛒 {totalItems} items | View Cart
        </Link>
      )}
    </div>
  );
};

export default RestaurantDetail;
