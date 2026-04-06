import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const STATUS_CONFIG = {
  placed:            { label: '⏳ Order Placed',        color: '#e65100', bg: '#fff3e0', msg: 'Your order is being reviewed by the restaurant' },
  accepted_by_owner: { label: '✅ Accepted',             color: '#2e7d32', bg: '#e8f5e9', msg: 'Restaurant accepted your order & assigning delivery' },
  assigned_delivery: { label: '📦 Preparing',            color: '#1565c0', bg: '#e3f2fd', msg: 'Food is being prepared — delivery person assigned!' },
  out_for_delivery:  { label: '🛵 Out for Delivery!',    color: '#6a1b9a', bg: '#f3e5f5', msg: 'Your order is on the way — almost there!' },
  delivered:         { label: '🎉 Delivered!',            color: '#1b5e20', bg: '#e8f5e9', msg: 'Your order arrived at your doorstep. Enjoy your meal! 😋' },
};

const STEPS = ['placed', 'accepted_by_owner', 'assigned_delivery', 'out_for_delivery', 'delivered'];
const STEP_ICONS = ['📋', '✅', '📦', '🛵', '🎉'];

const ProgressBar = ({ status }) => {
  const idx = STEPS.indexOf(status);
  return (
    <div style={{ display:'flex', alignItems:'center', margin:'1rem 0' }}>
      {STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'50%', flexShrink:0,
            background: i <= idx ? 'var(--accent)' : '#e0e0e0',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1rem', transition:'all 0.4s',
            boxShadow: i <= idx ? '0 4px 12px rgba(6,214,160,0.4)' : 'none'
          }}>
            {STEP_ICONS[i]}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex:1, height:'4px', transition:'all 0.4s',
              background: i < idx ? 'var(--accent)' : '#e0e0e0'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const prevOrders = useRef([]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/orders/my-orders');

      // Detect status changes → show notification
      if (prevOrders.current.length > 0) {
        data.forEach(newOrder => {
          const old = prevOrders.current.find(o => o._id === newOrder._id);
          if (old && old.status !== newOrder.status) {
            const cfg = STATUS_CONFIG[newOrder.status];
            const notif = { id: Date.now(), label: cfg?.label, msg: cfg?.msg };
            setNotifications(prev => [...prev, notif]);
            setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notif.id)), 5000);
          }
        });
      }
      prevOrders.current = data;
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (loading) return (
    <div style={{ textAlign:'center', padding:'5rem' }}>
      <div className="loader" style={{ margin:'0 auto' }}></div>
    </div>
  );

  return (
    <div className="orders-page">
      {/* Notifications */}
      <div style={{ position:'fixed', top:'80px', right:'1.5rem', zIndex:9999, display:'flex', flexDirection:'column', gap:'0.8rem' }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background:'white', borderRadius:'16px', padding:'1rem 1.5rem',
            boxShadow:'0 8px 30px rgba(0,0,0,0.2)', maxWidth:'300px',
            borderLeft:'4px solid var(--accent)', animation:'fadeInUp 0.4s ease'
          }}>
            <div style={{ fontWeight:800, marginBottom:'0.2rem' }}>{n.label}</div>
            <div style={{ color:'var(--text-light)', fontSize:'0.87rem' }}>{n.msg}</div>
          </div>
        ))}
      </div>

      <h1 style={{ fontSize:'2rem', fontWeight:900, marginBottom:'0.3rem' }}>📦 My Orders</h1>
      <p style={{ color:'var(--text-light)', marginBottom:'1.5rem' }}>
        Live tracking — page refreshes automatically every 4 seconds
      </p>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📦</div>
          <h3>No orders yet</h3>
          <p>Browse restaurants and place your first order!</p>
        </div>
      ) : (
        orders.map(order => {
          const cfg = STATUS_CONFIG[order.status] || {};
          const isDelivered = order.status === 'delivered';
          return (
            <div key={order._id} style={{
              background:'white', borderRadius:'16px', padding:'1.5rem',
              marginBottom:'1.2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
              borderLeft:`5px solid ${cfg.color || '#ccc'}`
            }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.8rem' }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:'1.1rem' }}>
                    {order.restaurantId?.name || 'Restaurant'}
                  </div>
                  <div style={{ color:'var(--text-light)', fontSize:'0.85rem' }}>
                    Order #{order._id.slice(-6).toUpperCase()}
                  </div>
                </div>
                <span style={{
                  background: cfg.bg, color: cfg.color,
                  padding:'0.4rem 1rem', borderRadius:'20px',
                  fontWeight:800, fontSize:'0.82rem', whiteSpace:'nowrap'
                }}>{cfg.label}</span>
              </div>

              <ProgressBar status={order.status} />

              <p style={{ color:'var(--text-light)', fontSize:'0.9rem', marginBottom:'0.8rem' }}>
                💬 {cfg.msg}
              </p>

              {/* Delivered banner */}
              {isDelivered && (
                <div style={{
                  background:'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                  borderRadius:'12px', padding:'1rem', marginBottom:'1rem',
                  border:'2px solid var(--accent)', textAlign:'center'
                }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:'0.3rem' }}>🚪✅</div>
                  <div style={{ fontWeight:900, color:'var(--accent)', fontSize:'1rem' }}>
                    Your order is on your doorstep!
                  </div>
                  <div style={{ color:'var(--text-light)', fontSize:'0.85rem', marginTop:'0.3rem' }}>
                    Thank you for ordering from Yummy! Enjoy your meal 😋
                  </div>
                </div>
              )}

              {/* Items */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:'0.8rem' }}>
                {order.items.map((item, i) => (
                  <span key={i} style={{ background:'#f0f0f0', borderRadius:'20px', padding:'0.25rem 0.7rem', fontSize:'0.85rem', fontWeight:600 }}>
                    {item.name} × {item.quantity}
                  </span>
                ))}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.5rem' }}>
                <span style={{ color:'var(--text-light)', fontSize:'0.85rem' }}>📍 {order.deliveryAddress}</span>
                <span style={{ fontWeight:900, color:'var(--primary)', fontSize:'1.1rem' }}>₹{order.totalAmount}</span>
              </div>

              {/* Timeline */}
              {order.statusHistory?.length > 0 && (
                <div style={{ marginTop:'0.8rem', background:'#f8f9fa', borderRadius:'10px', padding:'0.8rem' }}>
                  {order.statusHistory.map((h, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom: i < order.statusHistory.length-1 ? '0.4rem' : 0 }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--primary)', flexShrink:0 }}></div>
                      <span style={{ color:'var(--text-light)', fontSize:'0.82rem' }}>
                        {h.message} &nbsp;•&nbsp; {new Date(h.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MyOrders;
