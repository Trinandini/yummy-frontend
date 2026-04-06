import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG = {
  customer: { emoji: '🛍️', color: '#06D6A0', gradient: 'linear-gradient(135deg,#06D6A0,#00b386)', label: 'Customer' },
  owner:    { emoji: '🏪', color: '#845EC2', gradient: 'linear-gradient(135deg,#845EC2,#6a1b9a)', label: 'Owner' },
  delivery: { emoji: '🛵', color: '#00B4D8', gradient: 'linear-gradient(135deg,#00B4D8,#0077b6)', label: 'Delivery' },
};

const DEMO_EMAILS = ['customer@demo.com','owner@demo.com','delivery@demo.com','delivery2@demo.com'];

const Login = () => {
  const [form, setForm]             = useState({ email: '', password: '' });
  const [loading, setLoading]       = useState(false);
  const [loggingIn, setLoggingIn]   = useState('');
  const [allUsers, setAllUsers]     = useState([]);
  const [activeTab, setActiveTab]   = useState('customer');
  const [panelOpen, setPanelOpen]   = useState(false);
  const [pwdModal, setPwdModal]     = useState(null); // { user }
  const [pwdInput, setPwdInput]     = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    axios.get('/api/auth/demo-users')
      .then(r => setAllUsers(r.data))
      .catch(() => {});
  }, []);

  const doLogin = async (email, password) => {
    try {
      const user = await login(email.toLowerCase(), password);
      toast.success(`Welcome, ${user.name}! 🎉`);
      if (user.role === 'owner')         navigate('/owner');
      else if (user.role === 'delivery') navigate('/delivery');
      else                               navigate('/');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your password.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await doLogin(form.email, form.password);
    setLoading(false);
  };

  const handleUserClick = async (user) => {
    const isDemo = DEMO_EMAILS.includes(user.email);
    if (isDemo) {
      // Auto-login demo accounts
      setLoggingIn(user._id);
      setForm({ email: user.email, password: 'demo123' });
      await doLogin(user.email, 'demo123');
      setLoggingIn('');
    } else {
      // Show password modal for non-demo accounts
      setPwdModal(user);
      setPwdInput('');
    }
  };

  const handleModalLogin = async () => {
    if (!pwdInput) { toast.error('Enter your password'); return; }
    setLoggingIn(pwdModal._id);
    const ok = await doLogin(pwdModal.email, pwdInput);
    if (ok) setPwdModal(null);
    setLoggingIn('');
  };

  const isBusy = loading || loggingIn !== '';
  const roles = ['customer', 'owner', 'delivery'];
  const usersByRole = {
    customer: allUsers.filter(u => u.role === 'customer'),
    owner:    allUsers.filter(u => u.role === 'owner'),
    delivery: allUsers.filter(u => u.role === 'delivery'),
  };

  return (
    <div className="auth-page">
      {/* Password Modal for non-demo users */}
      {pwdModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
        }}>
          <div style={{
            background:'white', borderRadius:'16px', padding:'2rem',
            width:'100%', maxWidth:'360px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)'
          }}>
            <div style={{ textAlign:'center', marginBottom:'1.2rem' }}>
              <div style={{
                width:'56px', height:'56px', borderRadius:'50%', margin:'0 auto 0.8rem',
                background: ROLE_CONFIG[pwdModal.role]?.gradient,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.6rem'
              }}>
                {ROLE_CONFIG[pwdModal.role]?.emoji}
              </div>
              <div style={{ fontWeight:800, fontSize:'1.1rem' }}>{pwdModal.name}</div>
              <div style={{ color:'var(--text-light)', fontSize:'0.85rem' }}>{pwdModal.email}</div>
            </div>
            <div className="form-group">
              <label className="form-label">🔑 Enter your password</label>
              <input
                type="password" className="form-input"
                placeholder="Your password"
                value={pwdInput}
                onChange={e => setPwdInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleModalLogin()}
                autoFocus
              />
            </div>
            <div style={{ display:'flex', gap:'0.8rem', marginTop:'1rem' }}>
              <button
                onClick={() => setPwdModal(null)}
                style={{
                  flex:1, padding:'0.8rem', borderRadius:'10px',
                  border:'2px solid var(--border)', background:'white',
                  fontFamily:'Nunito,sans-serif', fontWeight:700, cursor:'pointer'
                }}
              >Cancel</button>
              <button
                onClick={handleModalLogin}
                disabled={loggingIn !== ''}
                style={{
                  flex:2, padding:'0.8rem', borderRadius:'10px', border:'none',
                  background: ROLE_CONFIG[pwdModal.role]?.gradient,
                  color:'white', fontFamily:'Nunito,sans-serif', fontWeight:800,
                  cursor:'pointer', fontSize:'0.95rem'
                }}
              >
                {loggingIn !== '' ? '⏳ Logging in...' : '🚀 Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="auth-card" style={{ maxWidth:'480px' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'2.8rem' }}>🍽️</div>
          <h1 className="auth-title" style={{ textAlign:'center' }}>Welcome Back!</h1>
          <p className="auth-sub">Select your account to login</p>
        </div>

        {/* COLLAPSIBLE ACCOUNTS PANEL */}
        <div style={{ marginBottom:'1.5rem' }}>
          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setPanelOpen(p => !p)}
            style={{
              width:'100%',
              background: panelOpen ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : 'linear-gradient(135deg,#FF6B35,#FF6B9D)',
              color:'white', border:'none',
              borderRadius: panelOpen ? '14px 14px 0 0' : '14px',
              padding:'1rem 1.4rem',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              cursor:'pointer', fontFamily:'Nunito,sans-serif', fontWeight:800, fontSize:'0.95rem',
              transition:'all 0.25s',
              boxShadow: panelOpen ? 'none' : '0 6px 20px rgba(255,107,53,0.4)',
            }}
          >
            <span style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
              <span style={{ fontSize:'1.2rem' }}>👤</span>
              Select Your Account
              <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:'20px', padding:'0.1rem 0.6rem', fontSize:'0.78rem' }}>
                {allUsers.length} users
              </span>
            </span>
            <span style={{ transform: panelOpen ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.25s', display:'inline-block' }}>▼</span>
          </button>

          {/* Dropdown Panel */}
          {panelOpen && (
            <div style={{
              background:'linear-gradient(180deg,#1a1a2e 0%,#0f3460 100%)',
              borderRadius:'0 0 14px 14px',
              padding:'1rem',
              border:'2px solid rgba(255,255,255,0.06)',
              borderTop:'none'
            }}>
              {/* Role Tabs */}
              <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1rem', background:'rgba(255,255,255,0.06)', borderRadius:'10px', padding:'0.3rem' }}>
                {roles.map(role => {
                  const rc = ROLE_CONFIG[role];
                  const count = usersByRole[role].length;
                  return (
                    <button
                      key={role}
                      onClick={() => setActiveTab(role)}
                      style={{
                        flex:1, padding:'0.5rem 0.3rem', borderRadius:'8px', border:'none',
                        fontFamily:'Nunito,sans-serif', fontWeight:800, fontSize:'0.78rem',
                        cursor:'pointer', transition:'all 0.2s',
                        background: activeTab === role ? rc.color : 'transparent',
                        color: activeTab === role ? 'white' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {rc.emoji} {rc.label}
                      <span style={{ marginLeft:'0.3rem', background:'rgba(255,255,255,0.2)', borderRadius:'10px', padding:'0 0.4rem', fontSize:'0.7rem' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* User Cards */}
              {usersByRole[activeTab].length === 0 ? (
                <div style={{ textAlign:'center', padding:'1rem', color:'rgba(255,255,255,0.4)', fontSize:'0.85rem' }}>
                  No {activeTab} accounts yet
                  {activeTab !== 'owner' && (
                    <span> — <Link to="/register" style={{ color: ROLE_CONFIG[activeTab].color }}>Register one</Link></span>
                  )}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {usersByRole[activeTab].map(user => {
                    const rc = ROLE_CONFIG[user.role];
                    const isDemo = DEMO_EMAILS.includes(user.email);
                    const isLoading = loggingIn === user._id;
                    return (
                      <button
                        key={user._id}
                        onClick={() => handleUserClick(user)}
                        disabled={isBusy}
                        style={{
                          background: isLoading ? 'rgba(255,255,255,0.08)' : rc.gradient,
                          border:'none', borderRadius:'12px',
                          padding:'0.8rem 1rem',
                          display:'flex', alignItems:'center', gap:'0.8rem',
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          opacity: isBusy && !isLoading ? 0.5 : 1,
                          transition:'all 0.2s', fontFamily:'Nunito,sans-serif',
                          boxShadow: isLoading ? 'none' : `0 4px 12px rgba(0,0,0,0.3)`,
                          textAlign:'left', width:'100%'
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width:'40px', height:'40px', borderRadius:'50%',
                          background:'rgba(255,255,255,0.2)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'1.1rem', fontWeight:900, color:'white', flexShrink:0
                        }}>
                          {isLoading ? '⏳' : user.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:900, fontSize:'0.95rem', color:'white' }}>
                            {isLoading ? 'Logging in...' : user.name}
                          </div>
                          <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.6)', marginTop:'0.1rem' }}>
                            {user.email}
                          </div>
                        </div>
                        {/* Badge */}
                        <div style={{ flexShrink:0 }}>
                          {isDemo ? (
                            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:'20px', padding:'0.15rem 0.5rem', fontSize:'0.68rem', color:'white', fontWeight:700 }}>
                              ⚡ 1-click
                            </span>
                          ) : (
                            <span style={{ background:'rgba(255,255,255,0.15)', borderRadius:'20px', padding:'0.15rem 0.5rem', fontSize:'0.68rem', color:'rgba(255,255,255,0.8)', fontWeight:700 }}>
                              🔑 password
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop:'0.8rem', textAlign:'center', fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>
                ⚡ demo accounts auto-login &nbsp;|&nbsp; 🔑 your accounts need password
              </div>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.8rem', marginBottom:'1.2rem' }}>
          <div style={{ flex:1, height:'1px', background:'var(--border)' }}></div>
          <span style={{ color:'var(--text-light)', fontSize:'0.78rem', fontWeight:700 }}>OR TYPE MANUALLY</span>
          <div style={{ flex:1, height:'1px', background:'var(--border)' }}></div>
        </div>

        {/* MANUAL FORM */}
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

        <div className="auth-link" style={{ marginTop:'1rem' }}>
          New here? <Link to="/register">Create an account →</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
