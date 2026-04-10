import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'customer', emoji: '🛍️', title: 'Customer',         desc: 'Order food from restaurants',  color: '#06D6A0' },
  { value: 'delivery', emoji: '🛵', title: 'Delivery Person',  desc: 'Deliver orders & earn',         color: '#00B4D8' },
  { value: 'owner',    emoji: '🏪', title: 'Restaurant Owner', desc: 'Manage orders & delivery team', color: '#845EC2' },
];

// ── Validation rules ──────────────────────────────────────────────
const validate = {
  name:     v => v.trim().length >= 2,
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone:    v => !v || /^\+91[6-9]\d{9}$/.test(v.replace(/\s/g,'')),
  password: v => {
    const hasMin4    = v.length >= 4;
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
    const numCount   = (v.match(/\d/g) || []).length;
    return hasMin4 && hasSpecial && numCount >= 3;
  }
};

const pwdStrength = (v) => {
  const hasMin4    = v.length >= 4;
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
  const nums       = (v.match(/\d/g) || []).length;
  const score = [hasMin4, hasSpecial, nums >= 3].filter(Boolean).length;
  if (score === 0) return null;
  if (score === 1) return { label: 'Weak',   color: '#e53935', pct: 33 };
  if (score === 2) return { label: 'Medium', color: '#FF6B35', pct: 66 };
  return              { label: 'Strong',  color: '#06D6A0', pct: 100 };
};

const Register = () => {
  const [form, setForm]       = useState({ name:'', email:'', password:'', role:'customer', phone:'', address:'' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const touch = (field) => setTouched(p => ({ ...p, [field]: true }));

  const errors = {
    name:     !validate.name(form.name)     ? 'Name must be at least 2 characters' : '',
    email:    !validate.email(form.email)   ? 'Enter a valid email (e.g. you@gmail.com)' : '',
    phone:    form.phone && !validate.phone(form.phone) ? 'Must start with +91 followed by 10 digits (e.g. +91 9876543210)' : '',
    password: !validate.password(form.password)
      ? 'Min 4 chars, 3 numbers and 1 special character required'
      : '',
  };

  const isFormValid = !errors.name && !errors.email && !errors.phone && !errors.password && form.name && form.email && form.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name:true, email:true, phone:true, password:true });
    if (!isFormValid) {
      toast.error('Please fix the errors before submitting');
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

  const Field = ({ field, label, children, hint }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {touched[field] && errors[field] && (
        <div style={{ color:'#e53935', fontSize:'0.78rem', marginTop:'0.3rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.3rem' }}>
          ⚠️ {errors[field]}
        </div>
      )}
      {touched[field] && !errors[field] && form[field] && (
        <div style={{ color:'var(--accent)', fontSize:'0.78rem', marginTop:'0.3rem', fontWeight:600 }}>✅ Looks good!</div>
      )}
      {hint && !touched[field] && (
        <div style={{ color:'var(--text-light)', fontSize:'0.75rem', marginTop:'0.3rem' }}>{hint}</div>
      )}
    </div>
  );

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
              <button
                type="button" key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                style={{
                  padding:'0.9rem 0.4rem',
                  border:`2px solid ${form.role === r.value ? r.color : '#e0e0e0'}`,
                  borderRadius:'12px', cursor:'pointer', textAlign:'center',
                  background: form.role === r.value ? `${r.color}18` : 'white',
                  fontFamily:'Nunito,sans-serif', transition:'all 0.2s',
                  boxShadow: form.role === r.value ? `0 4px 12px ${r.color}44` : 'none'
                }}
              >
                <div style={{ fontSize:'1.6rem', marginBottom:'0.2rem' }}>{r.emoji}</div>
                <div style={{ fontWeight:800, color: form.role === r.value ? r.color : 'var(--text)', fontSize:'0.8rem' }}>{r.title}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text-light)', marginTop:'0.15rem' }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* NAME */}
          <Field field="name" label="👤 Full Name" hint="At least 2 characters">
            <input
              type="text" className="form-input"
              placeholder="e.g. Priya Singh"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              onBlur={() => touch('name')}
              style={{ borderColor: touched.name && errors.name ? '#e53935' : touched.name && !errors.name && form.name ? 'var(--accent)' : '' }}
            />
          </Field>

          {/* EMAIL */}
          <Field field="email" label="📧 Email Address" hint="e.g. priya@gmail.com">
            <input
              type="email" className="form-input"
              placeholder="priya@gmail.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onBlur={() => touch('email')}
              style={{ borderColor: touched.email && errors.email ? '#e53935' : touched.email && !errors.email && form.email ? 'var(--accent)' : '' }}
            />
          </Field>

          {/* PHONE */}
          <Field field="phone" label="📱 Phone Number" hint="Indian number: +91 followed by 10 digits">
            <input
              type="tel" className="form-input"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={e => {
                let v = e.target.value.replace(/[^0-9+\s]/g,'');
                // Auto-add +91 prefix
                if (v && !v.startsWith('+')) v = '+91' + v;
                setForm({ ...form, phone: v });
              }}
              onBlur={() => touch('phone')}
              style={{ borderColor: touched.phone && errors.phone ? '#e53935' : touched.phone && !errors.phone && form.phone ? 'var(--accent)' : '' }}
            />
          </Field>

          {/* ADDRESS (customer only) */}
          {form.role === 'customer' && (
            <div className="form-group">
              <label className="form-label">📍 Delivery Address</label>
              <input
                type="text" className="form-input"
                placeholder="e.g. Flat 3A, Kondapur, Hyderabad"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
          )}

          {/* PASSWORD */}
          <Field
            field="password"
            label="🔑 Password"
            hint="Min 4 chars + 3 numbers + 1 special character"
          >
            <div style={{ position:'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="e.g. Pass123!@"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onBlur={() => touch('password')}
                style={{
                  paddingRight:'3rem',
                  borderColor: touched.password && errors.password ? '#e53935' : touched.password && !errors.password && form.password ? 'var(--accent)' : ''
                }}
              />
              <button
                type="button" onClick={() => setShowPass(!showPass)}
                style={{ position:'absolute', right:'0.8rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem' }}
              >{showPass ? '🙈' : '👁️'}</button>
            </div>

            {/* Password strength bar */}
            {form.password.length > 0 && (
              <div style={{ marginTop:'0.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                  <span style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>Password strength</span>
                  {strength && <span style={{ fontSize:'0.75rem', fontWeight:700, color:strength.color }}>{strength.label}</span>}
                </div>
                <div style={{ height:'5px', background:'#e0e0e0', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', background:strength?.color || '#e0e0e0', width:`${strength?.pct || 0}%`, transition:'width 0.3s, background 0.3s', borderRadius:'3px' }}></div>
                </div>
                {/* Checklist */}
                <div style={{ marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.2rem' }}>
                  {[
                    { check: form.password.length >= 4,                                               label:'At least 4 characters' },
                    { check: (form.password.match(/\d/g)||[]).length >= 3,                            label:'At least 3 numbers' },
                    { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),           label:'At least 1 special character (!@#$...)' },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color: item.check ? 'var(--accent)' : 'var(--text-light)' }}>
                      <span>{item.check ? '✅' : '○'}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Field>

          <button
            type="submit" className="submit-btn" disabled={loading}
            style={{ background:`linear-gradient(135deg, ${selectedRole?.color || 'var(--primary)'}, #FF6B9D)`, opacity: loading ? 0.7 : 1 }}
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
