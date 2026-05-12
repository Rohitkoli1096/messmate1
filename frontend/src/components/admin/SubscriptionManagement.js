import React, { useEffect, useState } from 'react';
import { subscriptionsAPI, studentsAPI } from '../../api';
import toast from 'react-hot-toast';

const PLANS = [
  { value: 'full_1month', label: 'Full Meal – 1 Month', price: 2200 },
  { value: 'full_15days', label: 'Full Meal – 15 Days', price: 1100 },
  { value: 'single_1month', label: 'Single Meal – 1 Month', price: 1100 },
  { value: 'single_15days', label: 'Single Meal – 15 Days', price: 550 },
];

export default function SubscriptionManagement() {
  const [subs, setSubs] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ 
    user_id: '', 
    plan: 'full_1month', 
    start_date: new Date().toISOString().split('T')[0], 
    paid_amount: '' 
  });
  const [extendId, setExtendId] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([subscriptionsAPI.getAll(), studentsAPI.getAll()])
      .then(([s, st]) => { 
        const subData = Array.isArray(s) ? s : (s?.data || []);
        const studentData = Array.isArray(st) ? st : (st?.data || []);
        setSubs(subData); 
        setStudents(studentData); 
      })
      .catch(() => toast.error('Failed to sync system data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const selectedPlan = PLANS.find(p => p.value === form.plan);

  const handleAssign = async (e) => {
    e.preventDefault();
    const [plan_type, duration] = form.plan.split('_');
    try {
      await subscriptionsAPI.assign({ 
        user_id: form.user_id, 
        plan_type, 
        duration: duration === '1month' ? '1month' : '15days', 
        start_date: form.start_date, 
        paid_amount: form.paid_amount || 0 
      });
      toast.success('Subscription activated!');
      setForm(f => ({ ...f, user_id: '', paid_amount: '' }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error assigning plan');
    }
  };

  const handleExtend = async (id) => {
    try {
      await subscriptionsAPI.extend(id, extendDays);
      toast.success(`Extended by ${extendDays} days`);
      setExtendId(null);
      load();
    } catch { toast.error('Extension failed'); }
  };

  const daysLeft = (end) => {
    if (!end) return 0;
    const diff = Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "10px" }}>
      
      {/* 1. TOP STATS SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "30px" }}>
        <div style={{ borderLeft: "6px solid #4F46E5", padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Active Plans</div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}>{subs.filter(s => daysLeft(s.end_date) > 0).length}</div>
          <div style={{ fontSize: "12px", color: "#4F46E5", fontWeight: "600" }}>Currently Subscribed</div>
        </div>

        <div style={{ borderLeft: "6px solid #EF4444", padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Expiring Soon</div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#991b1b" }}>{subs.filter(s => { const d = daysLeft(s.end_date); return d > 0 && d < 5; }).length}</div>
          <div style={{ fontSize: "12px", color: "#EF4444", fontWeight: "600" }}>Ends within 5 days</div>
        </div>
      </div>

      {/* 2. ASSIGNMENT FORM */}
      <div className="card" style={{ marginBottom: 24, padding: "24px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 800 }}>🎟️ Assign New Plan</h3>
        <form onSubmit={handleAssign}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>STUDENT</label>
              <select style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }} value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required>
                <option value="">Select student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>MEAL PLAN</label>
              <select style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                {PLANS.map(p => <option key={p.value} value={p.value}>{p.label} (₹{p.price})</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>START DATE</label>
              <input type="date" style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>PAID AMOUNT</label>
              <input type="number" style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }} placeholder={`Max ₹${selectedPlan?.price}`} value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))} max={selectedPlan?.price} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: "12px 24px", borderRadius: "10px", fontWeight: "700", background: "#4F46E5", border: "none", color: "#fff", cursor: "pointer" }}>Activate Plan</button>
        </form>
      </div>

      {/* 3. TABLE SECTION - EXACT COLUMN ORDER */}
      <div className="card" style={{ padding: "24px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 800 }}>📋 All Subscriptions</h3>
        {loading ? <div style={{ textAlign: "center", padding: 60 }}>Loading data...</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>Student</th>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>Plan</th>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>Start</th>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>End</th>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>Days Left</th>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>Status</th>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>Payment</th>
                  <th style={{ padding: "14px", fontSize: "12px", color: "#64748b" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => {
                  const dl = daysLeft(s.end_date);
                  const shortId = String(s.id || '').slice(-4).toUpperCase();
                  
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* 1. Student */}
                      <td style={{ padding: "14px" }}>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8" }}>#{shortId}</div>
                      </td>
                      
                      {/* 2. Plan */}
                      <td style={{ padding: "14px", fontSize: "13px", color: "#475569" }}>
                        {s.plan_type} / {s.duration}
                      </td>
                      
                      {/* 3. Start */}
                      <td style={{ padding: "14px", fontSize: "13px" }}>
                        {new Date(s.start_date).toLocaleDateString('en-IN')}
                      </td>
                      
                      {/* 4. End */}
                      <td style={{ padding: "14px", fontSize: "13px" }}>
                        {new Date(s.end_date).toLocaleDateString('en-IN')}
                      </td>
                      
                      {/* 5. Days Left */}
                      <td style={{ padding: "14px" }}>
                        <span style={{ fontWeight: 800, color: dl < 0 ? "#dc2626" : dl < 7 ? "#F59E0B" : "#16a34a" }}>
                          {dl > 0 ? `${dl}d` : 'Expired'}
                        </span>
                      </td>
                      
                      {/* 6. Status */}
                      <td style={{ padding: "14px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase",
                          background: dl > 0 ? (dl < 7 ? "#fef3c7" : "#dcfce7") : "#fee2e2",
                          color: dl > 0 ? (dl < 7 ? "#d97706" : "#16a34a") : "#dc2626"
                        }}>
                          {dl > 0 ? (dl < 7 ? 'Expiring' : 'Active') : 'Expired'}
                        </span>
                      </td>
                      
                      {/* 7. Payment */}
                      <td style={{ padding: "14px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase",
                          background: s.payment_status === 'paid' ? "#dcfce7" : s.payment_status === 'partial' ? "#fef3c7" : "#fee2e2",
                          color: s.payment_status === 'paid' ? "#16a34a" : s.payment_status === 'partial' ? "#92400e" : "#991b1b"
                        }}>
                          {s.payment_status || 'pending'}
                        </span>
                      </td>
                      
                      {/* 8. Action */}
                      <td style={{ padding: "14px" }}>
                        {extendId === s.id ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} style={{ width: 50, padding: "5px", borderRadius: "6px", border: "1px solid #4F46E5" }} min="1" />
                            <button onClick={() => handleExtend(s.id)} style={{ background: "#4F46E5", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}>Save</button>
                            <button onClick={() => setExtendId(null)} style={{ background: "#f1f5f9", padding: "5px", borderRadius: "6px", border: "none", cursor: "pointer" }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setExtendId(s.id)} style={{ background: "transparent", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                            Extend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}