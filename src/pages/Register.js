import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'customer', emoji: '🛍️', title: 'Customer',         desc: 'Order food from restaurants',  color: '#06D6A0' },
  { value: 'delivery', emoji: '🛵', title: 'Delivery Person',  desc: 'Deliver orders & earn',         color: '#00B4D8' },
  { value: 'owner',    emoji: '🏪', title: 'Restaurant Owner', desc: 'Manage orders & delivery team', color: '#845EC2' },
];

const isValidEmail    = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone    = (v) => !v || /^\+91[6-9]\d{9}$/.test(v.replace(/\s/g,''));
const isValidPassword = (v) => {
  if (!v || v.length < 4) return false;
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
  const numCount   = (v.match(/\d/g) || []).length;
  return hasSpecial && numCount >= 3;
};

const pwdStrength = (v) => {
  if (!v) return null;
  const score = [v.length >= 4, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v), (v.match(/\d/g)||[]).length >= 3].filter(Boolean).length;
  if (score === 1) return { label:'Weak',   color:'#e53935', pct:33 };
  if (score === 2) return { label:'Medium', color:'#FF6B35', pct:66 };
  if (score === 3) return { label:'Strong', color:'#06D6A0', pct:100 };
  return null;
};

const Register = () => {
  const [form, setForm]         = useState({ name:'', email:'', password:'', role:'customer', phone:'', address:'' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false); // only show errors after submit click
  const { register } = useAuth();
  const navigate = useNavigate();

  const errors = {
    name:     form.name.trim().length < 2     ? 'Name must be at least 2 characters' : '',
    email:    !isValidEmail(form.email)        ? 'Enter a valid email (e.g. you@gmail.com)' : '',
    phone:    form.phone && !isValidPhone(form.phone) ? 'Must be +91 followed by 10 digits' : '',
    password: !isValidPassword(form.password)  ? 'Need: 4+ chars, 3 numbers, 1 special character' : '',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true); // NOW show errors
    if (errors.name || errors.email || errors.phone || errors.password) {
      toast.error('Please fix the highlighted errors before continuing');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`🎉 Welcome, ${user.name}!`);
      if (user.role === 'owner')         navigate('/owner');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  const strength = pwdStrength(form.password);
  const selectedRole = ROLES.find(r => r.value === form.role);

  // Border color — only red/green AFTER submit button is clicked
  const bc = (field) => {
    if (!submitted) return '';
    return errors[field] ? '#e53935' : '#06D6A0';
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth:'480px' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'3rem' }}>🎉</div>
          <h1 className="auth-title" style={{ textAlign:'center' }}>Create Account</h1>
          <p className="auth-sub">Join Yummy — choose your role below</p>
        </div>

        {/* ROLE SELECTOR */}
        <div className="form-group">
          <label className="form-label">I want to join as...</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.7rem' }}>
            {ROLES.map(r => (
              <button type="button" key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                style={{
                  padding:'0.9rem 0.4rem', border:`2px solid ${form.role===r.value ? r.color : '#e0e0e0'}`,
                  borderRadius:'12px', cursor:'pointer', textAlign:'center',
                  background: form.role===r.value ? `${r.color}18` : 'white',
                  fontFamily:'Nunito,sans-serif', transition:'all 0.2s',
                  boxShadow: form.role===r.value ? `0 4px 12px ${r.color}44` : 'none'
                }}
              >
                <div style={{ fontSize:'1.6rem', marginBottom:'0.2rem' }}>{r.emoji}</div>
                <div style={{ fontWeight:800, color:form.role===r.value?r.color:'var(--text)', fontSize:'0.8rem' }}>{r.title}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text-light)', marginTop:'0.15rem' }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* NAME */}
          <div className="form-group">
            <label className="form-label">👤 Full Name</label>
            <input type="text" className="form-input"
              placeholder="e.g. Priya Singh (min 2 characters)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ borderColor: bc('name') }}
            />
            {submitted && errors.name && (
              <div style={{ color:'#e53935', fontSize:'0.78rem', marginTop:'0.3rem', fontWeight:600 }}>⚠️ {errors.name}</div>
            )}
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label className="form-label">📧 Email Address</label>
            <input type="email" className="form-input"
              placeholder="priya@gmail.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ borderColor: bc('email') }}
            />
            {submitted && errors.email && (
              <div style={{ color:'#e53935', fontSize:'0.78rem', marginTop:'0.3rem', fontWeight:600 }}>⚠️ {errors.email}</div>
            )}
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label className="form-label">📱 Phone Number <span style={{ color:'var(--text-light)', fontWeight:400, fontSize:'0.8rem' }}>(optional)</span></label>
            <input type="tel" className="form-input"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={e => {
                let v = e.target.value.replace(/[^0-9+\s]/g,'');
                if (v && !v.startsWith('+')) v = '+91' + v;
                setForm({ ...form, phone: v });
              }}
              style={{ borderColor: submitted && form.phone ? (errors.phone ? '#e53935' : '#06D6A0') : '' }}
            />
            <div style={{ color:'var(--text-light)', fontSize:'0.75rem', marginTop:'0.3rem' }}>
              Format: +91 followed by 10 digits
            </div>
            {submitted && errors.phone && (
              <div style={{ color:'#e53935', fontSize:'0.78rem', marginTop:'0.2rem', fontWeight:600 }}>⚠️ {errors.phone}</div>
            )}
          </div>

          {/* ADDRESS (customer only) */}
          {form.role === 'customer' && (
            <div className="form-group">
              <label className="form-label">📍 Delivery Address <span style={{ color:'var(--text-light)', fontWeight:400, fontSize:'0.8rem' }}>(optional)</span></label>
              <input type="text" className="form-input"
                placeholder="e.g. Flat 3A, Kondapur, Hyderabad"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
          )}

          {/* PASSWORD */}
          <div className="form-group">
            <label className="form-label">🔑 Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} className="form-input"
                placeholder="e.g. Hello123!@"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight:'3rem', borderColor: bc('password') }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position:'absolute', right:'0.8rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem' }}
              >{showPass ? '🙈' : '👁️'}</button>
            </div>

            {/* Live checklist — shows as you type, NO blur needed */}
            {form.password.length > 0 && (
              <div style={{ marginTop:'0.6rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-light)' }}>Strength</span>
                  {strength && <span style={{ fontSize:'0.72rem', fontWeight:700, color:strength.color }}>{strength.label}</span>}
                </div>
                <div style={{ height:'5px', background:'#e0e0e0', borderRadius:'3px', overflow:'hidden', marginBottom:'0.5rem' }}>
                  <div style={{ height:'100%', background:strength?.color||'#e0e0e0', width:`${strength?.pct||0}%`, transition:'all 0.3s', borderRadius:'3px' }}></div>
                </div>
                {[
                  { done: form.password.length >= 4,                                           text:'At least 4 characters' },
                  { done: (form.password.match(/\d/g)||[]).length >= 3,                        text:'At least 3 numbers' },
                  { done: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),       text:'At least 1 special character (!@#$...)' },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color:item.done?'var(--accent)':'var(--text-light)', marginBottom:'0.2rem' }}>
                    <span>{item.done ? '✅' : '○'}</span>
                    <span style={{ textDecoration:item.done?'line-through':'none' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
            {submitted && errors.password && (
              <div style={{ color:'#e53935', fontSize:'0.78rem', marginTop:'0.4rem', fontWeight:600 }}>⚠️ Please meet all password requirements above</div>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading}
            style={{ background:`linear-gradient(135deg,${selectedRole?.color||'var(--primary)'},#FF6B9D)`, opacity:loading?0.7:1 }}
          >
            {loading ? '⏳ Creating account...' : `${selectedRole?.emoji} Create ${selectedRole?.title} Account`}
          </button>
        </form>

        <div className="auth-link" style={{ marginTop:'1rem' }}>
          Already have an account? <Link to="/login">Login here →</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
