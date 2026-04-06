import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CATEGORIES = [
  { label: 'All', emoji: '🍽️' },
  { label: 'Indian', emoji: '🍛' },
  { label: 'Italian', emoji: '🍕' },
  { label: 'American', emoji: '🍔' },
  { label: 'Japanese', emoji: '🍣' },
  { label: 'Mexican', emoji: '🌮' },
  { label: 'Hyderabadi', emoji: '🍚' },
  { label: 'Chinese', emoji: '🥡' },
  { label: 'Cafe', emoji: '☕' },
  { label: 'Lebanese', emoji: '🥙' },
  { label: 'South Indian', emoji: '🫓' },
  { label: 'Thai', emoji: '🌶️' },
  { label: 'BBQ', emoji: '🔥' },
  { label: 'Pan-Asian', emoji: '🍜' },
  { label: 'Desserts', emoji: '🍰' },
  { label: 'Healthy', emoji: '🥗' },
];

const OFFERS = ['🔥 Popular', '⚡ Fast Delivery', '⭐ Top Rated', '💚 Healthy', '🆕 New', '🎯 Must Try'];

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data } = await axios.get('/api/restaurants');
        setRestaurants(data);
        setFiltered(data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    let result = restaurants;
    if (activeCategory !== 'All') {
      result = result.filter(r => r.cuisine === activeCategory);
    }
    if (search.trim()) {
      result = result.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [activeCategory, search, restaurants]);

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-emojis">🍕 🍔 🌮 🍜 🍣</div>
          <h1 className="hero-title">
            Delicious Food <br />
            <span className="highlight">Delivered Fast!</span>
          </h1>
          <p className="hero-sub">
            Order from 15+ amazing restaurants in your city. Hot food at your doorstep in minutes!
          </p>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search restaurants or cuisines..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button>🔍 Search</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stat"><div className="stat-num">15+</div><div className="stat-label">Restaurants</div></div>
        <div className="stat"><div className="stat-num">75+</div><div className="stat-label">Menu Items</div></div>
        <div className="stat"><div className="stat-num">30 min</div><div className="stat-label">Avg Delivery</div></div>
        <div className="stat"><div className="stat-num">4.6 ⭐</div><div className="stat-label">Avg Rating</div></div>
      </div>

      <div className="section">
        {/* PROMO BANNERS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="promo-banner gradient-card-1">
            <div>
              <div className="promo-title">🎉 First Order!</div>
              <div className="promo-sub">50% off on first order</div>
              <div className="promo-code">YUMMY50</div>
            </div>
          </div>
          <div className="promo-banner gradient-card-2">
            <div>
              <div className="promo-title">🛵 Free Delivery</div>
              <div className="promo-sub">On orders above ₹299</div>
              <div className="promo-code">FREEDEL</div>
            </div>
          </div>
          <div className="promo-banner gradient-card-3">
            <div>
              <div className="promo-title">🍕 Weekend Feast</div>
              <div className="promo-sub">20% off every weekend</div>
              <div className="promo-code">FEAST20</div>
            </div>
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="section-title">🍴 Explore by Cuisine</div>
        <p className="section-sub">What are you craving today?</p>
        <div className="categories">
          {CATEGORIES.map(cat => (
            <div
              key={cat.label}
              className={`category-chip ${activeCategory === cat.label ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.label)}
            >
              {cat.emoji} {cat.label}
            </div>
          ))}
        </div>

        {/* RESTAURANTS */}
        <div className="section-title">🏪 Restaurants Near You</div>
        <p className="section-sub">
          {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} available
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-light)', fontWeight: 600 }}>
              Loading restaurants...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">😕</div>
            <h3>No restaurants found</h3>
            <p>Try a different search or category</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="action-btn btn-primary"
              style={{ marginTop: '1rem' }}
            >
              Show All Restaurants
            </button>
          </div>
        ) : (
          <div className="restaurant-grid">
            {filtered.map((restaurant, idx) => (
              <Link
                to={`/restaurant/${restaurant._id}`}
                key={restaurant._id}
                className="restaurant-card fade-in"
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                <div className="restaurant-img-wrap">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="restaurant-img"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'; }}
                  />
                  <div className="offer-badge" style={{
                    background: ['var(--accent)', 'var(--purple)', 'var(--blue)', 'var(--pink)', 'var(--primary)', 'var(--secondary)'][idx % 6],
                    color: idx % 5 === 5 ? 'var(--dark)' : 'white'
                  }}>
                    {OFFERS[idx % OFFERS.length]}
                  </div>
                </div>
                <div className="restaurant-info">
                  <div className="restaurant-name">{restaurant.name}</div>
                  <div className="restaurant-cuisine">{restaurant.cuisine} Cuisine</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', margin: '0.3rem 0 0.6rem', lineHeight: 1.4 }}>
                    {restaurant.description.substring(0, 70)}...
                  </div>
                  <div className="restaurant-meta">
                    <span className="meta-item"><span className="star">⭐</span> {restaurant.rating}</span>
                    <span className="meta-item"><span className="time">🕐</span> {restaurant.deliveryTime}</span>
                    <span className="meta-item">₹{restaurant.minOrder} min</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
