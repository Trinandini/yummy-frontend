import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const STATUS_CONFIG = {
  placed:            { label: '🆕 New Order',         bg: '#fff3e0', color: '#e65100', border: '#FF6B35' },
  accepted_by_owner: { label: '✅ Accepted',           bg: '#e8f5e9', color: '#2e7d32', border: '#06D6A0' },
  assigned_delivery: { label: '📦 Delivery Assigned',  bg: '#e3f2fd', color: '#1565c0', border: '#00B4D8' },
  out_for_delivery:  { label: '🛵 Out for Delivery',   bg: '#f3e5f5', color: '#6a1b9a', border: '#845EC2' },
  delivered:         { label: '🎉 Delivered',           bg: '#e8f5e9', color: '#1b5e20', border: '#4caf50' },
};

const COLORS = ['#06D6A0','#00B4D8','#845EC2','#FF6B9D','#FFD23F','#FF6B35'];

const OwnerDashboard = () => {
  const [orders, setOrders]               = useState([]);
  const [allDelivery, setAllDelivery]     = useState([]); // includes removed
  const [activeDelivery, setActiveDelivery] = useState([]); // only active
  const [selectedDelivery, setSelectedDelivery] = useState({});
  const [reassignTarget, setReassignTarget]     = useState({});
  const [reassignReason, setReassignReason]     = useState({});
  const [loading, setLoading]             = useState(true);
  const [accepting, setAccepting]         = useState('');
  const [removing, setRemoving]           = useState('');
  const [showReassign, setShowReassign]   = useState({});
  const [activeTab, setActiveTab]         = useState('orders');

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, activeDP, allDP] = await Promise.all([
        axios.get('/api/orders/restaurant-orders'),
        axios.get('/api/orders/delivery-persons'),
        axios.get('/api/orders/all-delivery-persons'),
      ]);
      setOrders(ordersRes.data);
      setActiveDelivery(activeDP.data);
      setAllDelivery(allDP.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 6000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleAccept = async (orderId) => {
    const dpId = selectedDelivery[orderId];
    if (!dpId) { toast.error('Select a delivery person first!'); return; }
    setAccepting(orderId);
    try {
      await axios.put(`/api/orders/accept/${orderId}`, { deliveryPersonId: dpId });
      toast.success('✅ Order accepted & delivery assigned!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAccepting(''); }
  };

  const handleReassign = async (orderId) => {
    const dpId = reassignTarget[orderId];
    if (!dpId) { toast.error('Select a new delivery person!'); return; }
    try {
      await axios.put(`/api/orders/reassign/${orderId}`, {
        deliveryPersonId: dpId,
        reason: reassignReason[orderId] || ''
      });
      toast.success('⚡ Order emergency reassigned!');
      setShowReassign(prev => ({ ...prev, [orderId]: false }));
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Reassign failed'); }
  };

  const handleRemove = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from the delivery team? They won't be able to login.`)) return;
    setRemoving(userId);
    try {
      await axios.put(`/api/auth/remove-delivery/${userId}`);
      toast.success(`🚫 ${name} removed from delivery team`);
      fetchData();
    } catch (err) { toast.error('Failed to remove'); }
    finally { setRemoving(''); }
  };

  const handleReinstate = async (userId, name) => {
    try {
      await axios.put(`/api/auth/reinstate-delivery/${userId}`);
      toast.success(`✅ ${name} reinstated to delivery team`);
      fetchData();
    } catch (err) { toast.error('Failed to reinstate'); }
  };

  const newOrders    = orders.filter(o => o.status === 'placed');
  const activeOrders = orders.filter(o => ['accepted_by_owner','assigned_delivery','out_for_delivery'].includes(o.status));
  const doneOrders   = orders.filter(o => o.status === 'delivered');

  if (loading) return (
    <div style={{ textAlign:'center', padding:'5rem' }}>
      <div className="loader" style={{ margin:'0 auto' }}></div>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>🏪 Owner Dashboard</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', marginTop:'0.2rem' }}>
            Yummy Restaurant — Manage all orders & delivery team
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
          {[
            { num: newOrders.length,    label:'New',    color:'#FF6B35' },
            { num: activeOrders.length, label:'Active', color:'#06D6A0' },
            { num: doneOrders.length,   label:'Done',   color:'#aaa' },
            { num: activeDelivery.length, label:'Riders', color:'#FFD23F' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:'10px', padding:'0.6rem 0.9rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.3rem', fontWeight:900, color:s.color }}>{s.num}</div>
              <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.6)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
        {[
          { key:'orders', label:'📋 Orders', count: newOrders.length },
          { key:'team',   label:'🛵 Delivery Team', count: activeDelivery.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding:'0.7rem 1.4rem', borderRadius:'25px', border:'none',
            fontFamily:'Nunito, sans-serif', fontWeight:800, fontSize:'0.9rem', cursor:'pointer',
            background: activeTab === tab.key ? 'var(--primary)' : 'white',
            color: activeTab === tab.key ? 'white' : 'var(--text)',
            boxShadow: activeTab === tab.key ? '0 4px 12px rgba(255,107,53,0.35)' : '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            {tab.label}
            {tab.count > 0 && (
              <span style={{ marginLeft:'0.4rem', background: activeTab===tab.key?'rgba(255,255,255,0.3)':'var(--primary)', color:'white', borderRadius:'20px', padding:'0.1rem 0.5rem', fontSize:'0.75rem' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ ORDERS TAB ══════════ */}
      {activeTab === 'orders' && (
        <>
          {/* NEW ORDERS */}
          {newOrders.length > 0 && (
            <div style={{ marginBottom:'2rem' }}>
              <h2 style={{ fontWeight:900, marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                🔔 New Orders
                <span style={{ background:'var(--primary)', color:'white', borderRadius:'20px', padding:'0.1rem 0.7rem', fontSize:'0.82rem' }}>{newOrders.length}</span>
              </h2>
              {newOrders.map(order => (
                <div key={order._id} style={{ background:'white', borderRadius:'16px', padding:'1.5rem', marginBottom:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', borderLeft:'5px solid #FF6B35' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                    <div>
                      <div style={{ fontWeight:900, fontSize:'1.05rem' }}>👤 {order.customerId?.name || 'Customer'}</div>
                      <div style={{ color:'var(--text-light)', fontSize:'0.83rem', marginTop:'0.2rem' }}>
                        📱 {order.customerId?.phone || 'N/A'} &nbsp;•&nbsp; 🏪 {order.restaurantId?.name}
                      </div>
                      <div style={{ color:'var(--text-light)', fontSize:'0.8rem' }}>#{order._id.slice(-6).toUpperCase()}</div>
                    </div>
                    <span style={{ background:'#fff3e0', color:'#e65100', padding:'0.4rem 1rem', borderRadius:'20px', fontWeight:800, fontSize:'0.8rem' }}>🆕 NEW</span>
                  </div>

                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:'0.8rem' }}>
                    {order.items.map((item, i) => (
                      <span key={i} style={{ background:'#f0f4ff', borderRadius:'20px', padding:'0.25rem 0.7rem', fontSize:'0.82rem', fontWeight:600, color:'#3949ab' }}>
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
                    <span style={{ color:'var(--text-light)', fontSize:'0.85rem' }}>📍 {order.deliveryAddress}</span>
                    <span style={{ fontWeight:900, color:'var(--primary)', fontSize:'1.1rem' }}>₹{order.totalAmount}</span>
                  </div>

                  <div style={{ background:'#f8f9fa', borderRadius:'12px', padding:'1rem' }}>
                    <div style={{ fontWeight:800, fontSize:'0.88rem', marginBottom:'0.6rem' }}>🛵 Assign Delivery Person:</div>
                    {activeDelivery.length === 0 ? (
                      <div style={{ color:'#e65100', fontSize:'0.85rem', background:'#fff3e0', padding:'0.7rem', borderRadius:'8px' }}>
                        ⚠️ No active delivery persons! Go to Delivery Team tab to manage riders.
                      </div>
                    ) : (
                      <div style={{ display:'flex', gap:'0.8rem', flexWrap:'wrap', alignItems:'center' }}>
                        <select
                          value={selectedDelivery[order._id] || ''}
                          onChange={e => setSelectedDelivery(prev => ({ ...prev, [order._id]: e.target.value }))}
                          style={{ flex:1, minWidth:'200px', border:'2px solid var(--border)', borderRadius:'8px', padding:'0.65rem 0.9rem', fontFamily:'Nunito, sans-serif', fontSize:'0.9rem', outline:'none' }}
                        >
                          <option value="">-- Choose delivery person --</option>
                          {activeDelivery.map(dp => (
                            <option key={dp._id} value={dp._id}>🛵 {dp.name}{dp.phone ? ` • ${dp.phone}` : ''}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAccept(order._id)}
                          disabled={!selectedDelivery[order._id] || accepting === order._id}
                          style={{
                            background: selectedDelivery[order._id] ? 'linear-gradient(135deg,#06D6A0,#00b386)' : '#ccc',
                            color:'white', border:'none', padding:'0.7rem 1.5rem', borderRadius:'10px',
                            fontWeight:800, fontFamily:'Nunito, sans-serif', cursor: selectedDelivery[order._id] ? 'pointer' : 'not-allowed',
                            fontSize:'0.9rem', whiteSpace:'nowrap'
                          }}
                        >
                          {accepting === order._id ? '⏳...' : '✅ Accept & Assign'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACTIVE ORDERS with EMERGENCY REASSIGN */}
          {activeOrders.length > 0 && (
            <div style={{ marginBottom:'2rem' }}>
              <h2 style={{ fontWeight:900, marginBottom:'1rem' }}>⚡ Active Orders ({activeOrders.length})</h2>
              {activeOrders.map(order => {
                const sc = STATUS_CONFIG[order.status];
                const isShowingReassign = showReassign[order._id];
                return (
                  <div key={order._id} style={{ background:'white', borderRadius:'16px', padding:'1.2rem 1.5rem', marginBottom:'0.8rem', boxShadow:'0 4px 12px rgba(0,0,0,0.08)', borderLeft:`5px solid ${sc.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.6rem' }}>
                      <div>
                        <div style={{ fontWeight:800 }}>
                          👤 {order.customerId?.name || '—'} &nbsp;•&nbsp; 🏪 {order.restaurantId?.name || '—'}
                        </div>
                        <div style={{ color:'var(--text-light)', fontSize:'0.83rem', marginTop:'0.2rem' }}>
                          🛵 {order.deliveryPersonId?.name || 'Assigned'} &nbsp;•&nbsp; ₹{order.totalAmount}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        <span style={{ background:sc.bg, color:sc.color, padding:'0.35rem 0.9rem', borderRadius:'20px', fontWeight:800, fontSize:'0.8rem' }}>{sc.label}</span>
                        {order.status !== 'delivered' && (
                          <button
                            onClick={() => setShowReassign(prev => ({ ...prev, [order._id]: !prev[order._id] }))}
                            title="Emergency reassign"
                            style={{
                              background: isShowingReassign ? '#fff3e0' : '#fff',
                              border: '2px solid #FF6B35', color:'#FF6B35',
                              padding:'0.35rem 0.8rem', borderRadius:'20px',
                              fontWeight:800, fontFamily:'Nunito, sans-serif',
                              cursor:'pointer', fontSize:'0.78rem', whiteSpace:'nowrap'
                            }}
                          >
                            {isShowingReassign ? '✕ Cancel' : '⚡ Reassign'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EMERGENCY REASSIGN PANEL */}
                    {isShowingReassign && (
                      <div style={{ marginTop:'0.8rem', background:'#fff3e0', borderRadius:'10px', padding:'1rem', border:'2px solid #FF6B35' }}>
                        <div style={{ fontWeight:800, fontSize:'0.88rem', color:'#e65100', marginBottom:'0.5rem' }}>
                          ⚡ Emergency Reassign — Change Delivery Person
                        </div>
                        <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', alignItems:'flex-end' }}>
                          <div style={{ flex:1, minWidth:'160px' }}>
                            <div style={{ fontSize:'0.78rem', fontWeight:700, marginBottom:'0.3rem', color:'var(--text-light)' }}>New Delivery Person</div>
                            <select
                              value={reassignTarget[order._id] || ''}
                              onChange={e => setReassignTarget(prev => ({ ...prev, [order._id]: e.target.value }))}
                              style={{ width:'100%', border:'2px solid #FF6B35', borderRadius:'8px', padding:'0.6rem 0.8rem', fontFamily:'Nunito, sans-serif', fontSize:'0.88rem', outline:'none' }}
                            >
                              <option value="">-- Select --</option>
                              {activeDelivery.map(dp => (
                                <option key={dp._id} value={dp._id}>
                                  {dp.name}{order.deliveryPersonId?._id === dp._id ? ' (current)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ flex:1, minWidth:'160px' }}>
                            <div style={{ fontSize:'0.78rem', fontWeight:700, marginBottom:'0.3rem', color:'var(--text-light)' }}>Reason (optional)</div>
                            <input
                              type="text" placeholder="e.g. Rider unavailable"
                              value={reassignReason[order._id] || ''}
                              onChange={e => setReassignReason(prev => ({ ...prev, [order._id]: e.target.value }))}
                              style={{ width:'100%', border:'2px solid #FF6B35', borderRadius:'8px', padding:'0.6rem 0.8rem', fontFamily:'Nunito, sans-serif', fontSize:'0.88rem', outline:'none' }}
                            />
                          </div>
                          <button
                            onClick={() => handleReassign(order._id)}
                            disabled={!reassignTarget[order._id]}
                            style={{
                              background: reassignTarget[order._id] ? 'var(--primary)' : '#ccc',
                              color:'white', border:'none', padding:'0.65rem 1.2rem', borderRadius:'8px',
                              fontWeight:800, fontFamily:'Nunito, sans-serif', cursor: reassignTarget[order._id] ? 'pointer' : 'not-allowed', fontSize:'0.88rem', whiteSpace:'nowrap'
                            }}
                          >
                            ⚡ Reassign Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* DONE */}
          {doneOrders.length > 0 && (
            <div>
              <h2 style={{ fontWeight:900, marginBottom:'1rem', color:'var(--text-light)' }}>✅ Completed ({doneOrders.length})</h2>
              {doneOrders.slice(0,5).map(order => (
                <div key={order._id} style={{ background:'white', borderRadius:'12px', padding:'1rem 1.5rem', marginBottom:'0.5rem', opacity:0.65, borderLeft:'4px solid #4caf50', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700 }}>👤 {order.customerId?.name} &nbsp;•&nbsp; 🏪 {order.restaurantId?.name}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-light)' }}>🛵 {order.deliveryPersonId?.name || '—'}</div>
                  </div>
                  <div style={{ display:'flex', gap:'0.8rem', alignItems:'center' }}>
                    <span style={{ fontWeight:800, color:'var(--primary)' }}>₹{order.totalAmount}</span>
                    <span style={{ background:'#e8f5e9', color:'#1b5e20', padding:'0.3rem 0.7rem', borderRadius:'20px', fontWeight:700, fontSize:'0.78rem' }}>🎉 Done</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {orders.length === 0 && (
            <div className="empty-state"><div className="emoji">🏪</div><h3>No orders yet</h3><p>Customer orders appear here automatically</p></div>
          )}
        </>
      )}

      {/* ══════════ DELIVERY TEAM TAB ══════════ */}
      {activeTab === 'team' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.2rem' }}>
            <h2 style={{ fontWeight:900 }}>🛵 Delivery Team ({allDelivery.length})</h2>
            <a href="/register" style={{ background:'var(--primary)', color:'white', padding:'0.6rem 1.2rem', borderRadius:'20px', fontWeight:800, fontSize:'0.85rem', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'0.4rem' }}>
              + Add New Rider
            </a>
          </div>

          {allDelivery.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">🛵</div>
              <h3>No delivery persons yet</h3>
              <p>Go to <strong>/register</strong> → choose Delivery Person</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1rem' }}>
              {allDelivery.map((dp, idx) => {
                const isRemoved = !dp.isActive;
                const col = COLORS[idx % COLORS.length];
                const orderCount = orders.filter(o => {
                  const dpId = o.deliveryPersonId?._id || o.deliveryPersonId;
                  return dpId?.toString() === dp._id?.toString();
                }).length;
                return (
                  <div key={dp._id} style={{
                    background: isRemoved ? '#fafafa' : 'white',
                    borderRadius:'16px', padding:'1.2rem',
                    boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
                    borderTop:`4px solid ${isRemoved ? '#ccc' : col}`,
                    opacity: isRemoved ? 0.7 : 1,
                    position:'relative'
                  }}>
                    {isRemoved && (
                      <div style={{ position:'absolute', top:'8px', right:'8px', background:'#ef9a9a', color:'#b71c1c', borderRadius:'20px', padding:'0.15rem 0.6rem', fontSize:'0.7rem', fontWeight:800 }}>
                        REMOVED
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', gap:'0.8rem', marginBottom:'0.8rem' }}>
                      <div style={{
                        width:'44px', height:'44px', borderRadius:'50%',
                        background: isRemoved ? '#ccc' : `linear-gradient(135deg, ${col}, ${col}aa)`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'1.2rem', fontWeight:900, color:'white',
                        boxShadow: isRemoved ? 'none' : `0 4px 12px ${col}55`
                      }}>
                        {dp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:800, fontSize:'1rem' }}>{dp.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>{dp.email}</div>
                      </div>
                    </div>

                    {dp.phone && (
                      <div style={{ fontSize:'0.83rem', color:'var(--text-light)', marginBottom:'0.3rem' }}>📱 {dp.phone}</div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.3rem' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: isRemoved ? '#ccc' : '#4caf50' }}></div>
                      <span style={{ fontSize:'0.78rem', fontWeight:700, color: isRemoved ? '#999' : '#2e7d32' }}>
                        {isRemoved ? 'Removed from team' : 'Available for delivery'}
                      </span>
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-light)', marginBottom:'1rem' }}>
                      📦 {orderCount} order{orderCount !== 1 ? 's' : ''} assigned
                    </div>

                    {/* Action buttons */}
                    {isRemoved ? (
                      <button
                        onClick={() => handleReinstate(dp._id, dp.name)}
                        style={{ width:'100%', background:'linear-gradient(135deg,#06D6A0,#00b386)', color:'white', border:'none', padding:'0.6rem', borderRadius:'8px', fontWeight:800, fontFamily:'Nunito, sans-serif', cursor:'pointer', fontSize:'0.85rem' }}
                      >
                        ✅ Reinstate to Team
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemove(dp._id, dp.name)}
                        disabled={removing === dp._id}
                        style={{ width:'100%', background:'#fff', color:'#e53935', border:'2px solid #e53935', padding:'0.6rem', borderRadius:'8px', fontWeight:800, fontFamily:'Nunito, sans-serif', cursor:'pointer', fontSize:'0.85rem' }}
                      >
                        {removing === dp._id ? '⏳ Removing...' : '🚫 Remove from Team'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop:'1.5rem', padding:'1rem 1.2rem', background:'linear-gradient(135deg,#e3f2fd,#f3e5f5)', borderRadius:'12px', fontSize:'0.85rem', color:'#1565c0' }}>
            <strong>📢 To add a new delivery rider:</strong> Share <strong>/register</strong> → they pick "Delivery Person" role → they appear here instantly.
            Removed riders cannot login until reinstated.
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
