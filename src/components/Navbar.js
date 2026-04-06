import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'owner') return { to: '/owner', label: '🏪 My Restaurant' };
    if (user.role === 'delivery') return { to: '/delivery', label: '🛵 My Deliveries' };
    return null;
  };

  const dash = getDashboardLink();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🍽️ Yummy<span>!</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="nav-link" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              Hi, {user.name.split(' ')[0]} 👋
            </span>
            {dash && <Link to={dash.to} className="nav-link">{dash.label}</Link>}
            {user.role === 'customer' && (
              <>
                <Link to="/my-orders" className="nav-link">📦 Orders</Link>
                <Link to="/cart" className="nav-btn outline cart-badge">
                  🛒 Cart {totalItems > 0 && <span className="badge">{totalItems}</span>}
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="nav-btn" style={{ background: '#e74c3c' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn outline">Login</Link>
            <Link to="/register" className="nav-btn">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
