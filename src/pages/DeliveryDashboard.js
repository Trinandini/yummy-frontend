import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const autoTimers     = useRef({});
  const cdTimers       = useRef({});
  const prevOrders     = useRef([]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/delivery/my-deliveries');

      // Detect new assignment → notify
      if (prevOrders.current.length < data.length) {
        const newCount = data.length - prevOrders.current.length;
        toast.success(`🎉 ${newCount} new order(s) assigned to you!`);
      }
      prevOrders.current = data;
      setOrders(data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000); // poll every 4s
    return () => {
      clearInterval(interval);
      Object.values(autoTimers.current).forEach(clearTimeout);
      Object.values(cdTimers.current).forEach(clearInterval);
    };
  }, [fetchOrders]);

  const startCountdown = (orderId, secs) => {
    if (cdTimers.current[orderId]) return;
    setCountdowns(prev => ({ ...prev, [orderId]: secs }));
    cdTimers.current[orderId] = setInterval(() => {
      setCountdowns(prev => {
        const rem = (prev[orderId] || 0) - 1;
        if (rem <= 0) {
          clearInterval(cdTimers.current[orderId]);
          delete cdTimers.current[orderId];
        }
        return { ...prev, [orderId]: Math.max(0, rem) };
      });
    }, 1000);
  };

  const handlePickup = async (orderId) => {
    try {
      await axios.put(`/api/delivery/start/${orderId}`);
      toast.success('🛵 Order picked up! Heading to customer...');
      fetchOrders();
      startCountdown(orderId, 60);
      // Auto-deliver after 60 seconds
      autoTimers.current[orderId] = setTimeout(async () => {
        try {
          await axios.put(`/api/delivery/delivered/${orderId}`);
          toast.success('🎉 Auto-delivered! Order reached customer doorstep.');
          setCountdowns(prev => { const n = {...prev}; delete n[orderId]; return n; });
          fetchOrders();
        } catch (e) { console.error('Auto-deliver failed', e); }
      }, 60000);
    } catch (err) {
      toast.error('Failed to start delivery');
    }
  };

  const handleDeliver = async (orderId) => {
    clearTimeout(autoTimers.current[orderId]);  delete autoTimers.current[orderId];
    clearInterval(cdTimers.current[orderId]);   delete cdTimers.current[orderId];
    try {
      await axios.put(`/api/delivery/delivered/${orderId}`);
      toast.success('🎉 Order marked as delivered!');
      setCountdowns(prev => { const n = {...prev}; delete n[orderId]; return n; });
      fetchOrders();
    } catch (err) {
      toast.error('Failed to mark as delivered');
    }
  };

  const assigned  = orders.filter(o => o.status === 'assigned_delivery');
  const enRoute   = orders.filter(o => o.status === 'out_for_delivery');
  const delivered = orders.filter(o => o.status === 'delivered');

  if (loading) return (
    <div style={{ textAlign:'center', padding:'5rem' }}>
      <div className="loader" style={{ margin:'0 auto' }}></div>
      <p style={{ marginTop:'1rem', color:'var(--text-light)', fontWeight:600 }}>Loading your deliveries...</p>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header" style={{ background:'linear-gradient(135deg, #0f3460, #16213e)' }}>
        <div>
          <h1>🛵 Delivery Dashboard</h1>
          <div style={{ color:'rgba(255,255,255,0.7)', marginTop:'0.3rem', fontSize:'0.95rem' }}>
            Logged in as: <strong style={{ color:'white' }}>{user?.name}</strong> &nbsp;•&nbsp; {user?.email}
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.8rem' }}>
          {[
            { num: assigned.length,  label: 'Assigned', color: '#FFD23F' },
            { num: enRoute.length,   label: 'En Route',  color: '#00B4D8' },
            { num: delivered.length, label: 'Done',      color: '#06D6A0' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:'10px', padding:'0.7rem 1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color:s.color }}>{s.num}</div>
              <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live refresh indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.2rem', color:'var(--text-light)', fontSize:'0.82rem' }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#06D6A0', animation:'pulse 2s infinite' }}></div>
        Live — refreshes every 4 seconds automatically
      </div>

      {/* ── ASSIGNED (ready to pick up) ── */}
      {assigned.length > 0 && (
        <div style={{ marginBottom:'2rem' }}>
          <h2 style={{ fontWeight:900, marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            📦 Pick Up These Orders
            <span style={{ background:'var(--primary)', color:'white', borderRadius:'20px', padding:'0.1rem 0.7rem', fontSize:'0.82rem' }}>
              {assigned.length}
            </span>
          </h2>
          {assigned.map(order => (
            <div key={order._id} style={{
              background:'white', borderRadius:'16px', padding:'1.5rem',
              marginBottom:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
              borderLeft:'5px solid #FFD23F'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:'1.05rem' }}>Order #{order._id.slice(-6).toUpperCase()}</div>
                  <div style={{ color:'var(--text-light)', fontSize:'0.85rem', marginTop:'0.2rem' }}>
                    🏪 {order.restaurantId?.name}
                  </div>
                </div>
                <span style={{ background:'#fff9c4', color:'#f57f17', padding:'0.4rem 1rem', borderRadius:'20px', fontWeight:800, fontSize:'0.82rem' }}>
                  📦 READY FOR PICKUP
                </span>
              </div>

              {/* Pick up / Deliver to */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.8rem', marginBottom:'1rem' }}>
                <div style={{ background:'#fff8e1', borderRadius:'10px', padding:'0.8rem' }}>
                  <div style={{ fontWeight:800, fontSize:'0.78rem', color:'#e65100', marginBottom:'0.3rem' }}>📍 PICK UP FROM</div>
                  <div style={{ fontWeight:700 }}>{order.restaurantId?.name}</div>
                </div>
                <div style={{ background:'#e3f2fd', borderRadius:'10px', padding:'0.8rem' }}>
                  <div style={{ fontWeight:800, fontSize:'0.78rem', color:'#1565c0', marginBottom:'0.3rem' }}>🏠 DELIVER TO</div>
                  <div style={{ fontWeight:700 }}>{order.customerId?.name}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-light)' }}>{order.deliveryAddress}</div>
                  {order.customerId?.phone && (
                    <div style={{ fontSize:'0.8rem', color:'#1565c0', fontWeight:700 }}>📱 {order.customerId.phone}</div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:'1rem' }}>
                {order.items.map((item, i) => (
                  <span key={i} style={{ background:'#f0f4ff', borderRadius:'20px', padding:'0.25rem 0.7rem', fontSize:'0.82rem', fontWeight:600, color:'#3949ab' }}>
                    {item.name} ×{item.quantity}
                  </span>
                ))}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:900, color:'var(--primary)', fontSize:'1.1rem' }}>₹{order.totalAmount}</span>
                <button
                  onClick={() => handlePickup(order._id)}
                  style={{
                    background:'linear-gradient(135deg, #00B4D8, #0077b6)',
                    color:'white', border:'none',
                    padding:'0.8rem 2rem', borderRadius:'12px',
                    fontWeight:900, fontFamily:'Nunito, sans-serif',
                    fontSize:'0.95rem', cursor:'pointer',
                    boxShadow:'0 4px 15px rgba(0,180,216,0.4)'
                  }}
                >
                  🛵 Start Delivery
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EN ROUTE ── */}
      {enRoute.length > 0 && (
        <div style={{ marginBottom:'2rem' }}>
          <h2 style={{ fontWeight:900, marginBottom:'1rem' }}>🛵 En Route to Customer</h2>
          {enRoute.map(order => {
            const rem = countdowns[order._id];
            const pct = rem !== undefined ? (rem / 60) * 100 : 0;
            return (
              <div key={order._id} style={{
                background:'white', borderRadius:'16px', padding:'1.5rem',
                marginBottom:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
                borderLeft:'5px solid #845EC2'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                  <div>
                    <div style={{ fontWeight:900 }}>Order #{order._id.slice(-6).toUpperCase()}</div>
                    <div style={{ color:'var(--text-light)', fontSize:'0.85rem' }}>
                      👤 {order.customerId?.name} &nbsp;•&nbsp; 📱 {order.customerId?.phone}
                    </div>
                  </div>
                  <span style={{ background:'#f3e5f5', color:'#6a1b9a', padding:'0.4rem 1rem', borderRadius:'20px', fontWeight:800, fontSize:'0.82rem' }}>
                    🛵 EN ROUTE
                  </span>
                </div>

                {/* Countdown */}
                <div style={{ background:'linear-gradient(135deg, #ede7f6, #f3e5f5)', borderRadius:'12px', padding:'1.2rem', marginBottom:'1rem', textAlign:'center' }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:'0.4rem' }}>🛵</div>
                  {rem !== undefined ? (
                    <>
                      <div style={{ fontWeight:900, color:'#845EC2', fontSize:'1.05rem' }}>
                        Auto-delivering in <span style={{ fontSize:'1.4rem', color:'var(--primary)' }}>{rem}s</span>
                      </div>
                      <div style={{ margin:'0.6rem 0', height:'8px', background:'#e0e0e0', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:'4px',
                          background:'linear-gradient(90deg, #845EC2, #FF6B9D)',
                          width:`${pct}%`, transition:'width 1s linear'
                        }}></div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontWeight:800, color:'#845EC2' }}>On the way — delivering soon!</div>
                  )}
                  <div style={{ fontSize:'0.82rem', color:'var(--text-light)', marginTop:'0.3rem' }}>
                    📍 {order.deliveryAddress}
                  </div>
                </div>

                <button
                  onClick={() => handleDeliver(order._id)}
                  style={{
                    width:'100%', background:'linear-gradient(135deg, #06D6A0, #00b386)',
                    color:'white', border:'none', padding:'1rem', borderRadius:'12px',
                    fontWeight:900, fontFamily:'Nunito, sans-serif',
                    fontSize:'1rem', cursor:'pointer',
                    boxShadow:'0 4px 15px rgba(6,214,160,0.4)'
                  }}
                >
                  ✅ Mark as Delivered Now
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DELIVERED ── */}
      {delivered.length > 0 && (
        <div>
          <h2 style={{ fontWeight:900, marginBottom:'1rem', color:'var(--text-light)' }}>
            ✅ Completed ({delivered.length})
          </h2>
          {delivered.slice(0, 5).map(order => (
            <div key={order._id} style={{
              background:'white', borderRadius:'12px', padding:'1rem 1.5rem',
              marginBottom:'0.6rem', opacity:0.65, borderLeft:'4px solid #4caf50',
              display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <div>
                <div style={{ fontWeight:700 }}>👤 {order.customerId?.name}</div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-light)' }}>{order.deliveryAddress}</div>
              </div>
              <div style={{ display:'flex', gap:'0.8rem', alignItems:'center' }}>
                <span style={{ fontWeight:800, color:'var(--primary)' }}>₹{order.totalAmount}</span>
                <span style={{ background:'#e8f5e9', color:'#1b5e20', padding:'0.3rem 0.7rem', borderRadius:'20px', fontWeight:700, fontSize:'0.8rem' }}>
                  🎉 Done
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <div style={{
          textAlign:'center', padding:'4rem 2rem',
          background:'white', borderRadius:'16px',
          boxShadow:'0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize:'5rem', marginBottom:'1rem' }}>🛵</div>
          <h3 style={{ fontSize:'1.3rem', fontWeight:900, marginBottom:'0.5rem' }}>No deliveries yet</h3>
          <p style={{ color:'var(--text-light)', marginBottom:'1rem' }}>
            You are logged in as <strong>{user?.name}</strong>.<br/>
            The owner needs to assign an order to you.
          </p>
          <div style={{
            background:'#f0f9ff', borderRadius:'10px', padding:'1rem',
            border:'2px solid #00B4D8', fontSize:'0.88rem', color:'#0277bd', maxWidth:'360px', margin:'0 auto'
          }}>
            <strong>📋 How it works:</strong><br/>
            1. Customer places an order<br/>
            2. Owner opens dashboard → assigns order to <strong>{user?.name}</strong><br/>
            3. Order appears here automatically!
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
