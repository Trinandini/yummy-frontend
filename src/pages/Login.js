import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// Only the 3 fixed demo accounts — no dynamic DB fetch
const DEMO_ACCOUNTS = [
  {
    role: 'customer',
    name: 'Rahul Sharma',
    email: 'customer@demo.com',
    password: 'demo123',
    emoji: '🛍️',
    label: 'Customer',
    desc: 'Browse restaurants & order food',
    color: '#06D6A0',
    gradient: 'linear-gradient(135deg, #06D6A0, #00b386)',
    shadow: 'rgba(6,214,160,0.4)',
  },
  {
    role: 'owner',
    name: 'Chef Priya',
    email: 'owner@demo.com',
    password: 'demo123',
    emoji: '🏪',
    label: 'Restaurant Owner',
    desc: 'Manage orders & delivery team',
    color: '#845EC2',
    gradient: 'linear-gradient(135deg, #845EC2, #6a1b9a)',
    shadow: 'rgba(132,94,194,0.4)',
  },
  {
    role: 'delivery',
    name: 'Raju Kumar',
    email: 'delivery@demo.com',
    password: 'demo123',
    emoji: '🛵',
    label: 'Delivery Person (Raju)',
    desc: 'Pick up & deliver orders',
    color: '#00B4D8',
    gradient: 'linear-gradient(135deg, #00B4D8, #0077b6)',
    shadow: 'rgba(0,180,216,0.4)',
  },
  {
    role: 'delivery',
    name: 'Sita Devi',
    email: 'delivery2@demo.com',
    password: 'demo123',
    emoji: '🛵',
    label: 'Delivery Person (Sita)',
    desc: 'Pick up & deliver orders',
    color: '#00B4D8',
    gradient: 'linear-gradient(135deg, #00B4D8, #0077b6)',
    shadow: 'rgba(0,180,216,0.4)',
  },
];

const Login = () => {
  const [form, setForm]           = useState({ email: '', password: '' });
  const [loading, setLoading]     = useState(false);
  const [demoLoading, setDemoLoading] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);   // collapsed by default
  const { login } = useAuth();
  const navigate  = useNavigate();

  const doLogin = async (email, password) => {
    try {
      const user = await login(email.toLowerCase(), password);
      toast.success(`Welcome, ${user.name}! 🎉`);
      if (user.role === 'owner')         navigate('/owner');
      else if (user.role === 'delivery') navigate('/delivery');
      else                               navigate('/');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await doLogin(form.email, form.password);
    setLoading(false);
  };

  const handleDemoClick = async (demo) => {
    setDemoLoading(demo.email);
    setForm({ email: demo.email, password: demo.password });
    await doLogin(demo.email, demo.password);
    setDemoLoading('');
  };

  const isBusy = loading || demoLoading !== '';

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '460px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.4rem' }}>🍽️</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>Welcome Back!</h1>
          <p className="auth-sub">Login to your Yummy account</p>
        </div>

        {/* ── COLLAPSIBLE DEMO PANEL ── */}
        <div style={{ marginBottom: '1.5rem' }}>

          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setPanelOpen(prev => !prev)}
            style={{
              width: '100%',
              background: panelOpen
                ? 'linear-gradient(135deg, #1a1a2e, #16213e)'
                : 'linear-gradient(135deg, #FF6B35, #FF6B9D)',
              color: 'white',
              border: 'none',
              borderRadius: panelOpen ? '14px 14px 0 0' : '14px',
              padding: '1rem 1.4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800,
              fontSize: '0.95rem',
              transition: 'all 0.25s',
              boxShadow: panelOpen ? 'none' : '0 6px 20px rgba(255,107,53,0.4)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              Quick Demo Login
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '20px', padding: '0.1rem 0.6rem',
                fontSize: '0.78rem', fontWeight: 700
              }}>
                4 accounts
              </span>
            </span>
            <span style={{
              fontSize: '1.1rem',
              transform: panelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s',
              display: 'inline-block'
            }}>▼</span>
          </button>

          {/* Dropdown panel */}
          {panelOpen && (
            <div style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #0f3460 100%)',
              borderRadius: '0 0 14px 14px',
              padding: '1.2rem',
              border: '2px solid rgba(255,255,255,0.06)',
              borderTop: 'none',
              animation: 'fadeInUp 0.2s ease',
            }}>
              <p style={{
                color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem',
                fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                textAlign: 'center', marginBottom: '1rem'
              }}>
                Click any card to instantly login
              </p>

              {/* 3 Account Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {DEMO_ACCOUNTS.map(demo => {
                  const isThisLoading = demoLoading === demo.email;
                  return (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => handleDemoClick(demo)}
                      disabled={isBusy}
                      style={{
                        background: isThisLoading ? 'rgba(255,255,255,0.08)' : demo.gradient,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.9rem 1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                        opacity: isBusy && !isThisLoading ? 0.5 : 1,
                        transition: 'all 0.2s',
                        fontFamily: 'Nunito, sans-serif',
                        boxShadow: isThisLoading ? 'none' : `0 4px 16px ${demo.shadow}`,
                        transform: isThisLoading ? 'scale(0.98)' : 'scale(1)',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', flexShrink: 0,
                      }}>
                        {isThisLoading ? '⏳' : demo.emoji}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white' }}>
                          {isThisLoading ? 'Logging in...' : demo.label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.1rem' }}>
                          {demo.desc}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                          {demo.email}
                        </div>
                      </div>

                      {/* Arrow */}
                      {!isThisLoading && (
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', flexShrink: 0 }}>›</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{
                marginTop: '0.8rem', textAlign: 'center',
                fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)'
              }}>
                Password for all demo accounts: <code style={{ color: 'rgba(255,255,255,0.55)' }}>demo123</code>
              </div>
            </div>
          )}
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 700 }}>
            OR LOGIN WITH YOUR ACCOUNT
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        {/* ── MANUAL FORM ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">📧 Email Address</label>
            <input
              type="email" className="form-input"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">🔑 Password</label>
            <input
              type="password" className="form-input"
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isBusy}>
            {loading ? '⏳ Logging in...' : '🚀 Login'}
          </button>
        </form>

        <div className="auth-link" style={{ marginTop: '1rem' }}>
          New here? <Link to="/register">Create an account →</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
