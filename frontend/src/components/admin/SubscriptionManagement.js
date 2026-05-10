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
  const [students, setStudents] = useState([]); // Fixed typo: useSatate -> useState
  const [form, setForm] = useState({ user_id: '', plan: 'full_1month', start_date: new Date().toISOString().split('T')[0], paid_amount: '' });
  const [extendId, setExtendId] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([subscriptionsAPI.getAll(), studentsAPI.getAll()])
      .then(([s, st]) => { 
        // FIX: Remove .data as api.js now returns data directly
        const subData = Array.isArray(s) ? s : (s?.data || []);
        const studentData = Array.isArray(st) ? st : (st?.data || []);
        
        setSubs(subData); 
        setStudents(studentData); 
      })
      .catch(() => toast.error('Failed to load'))
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
      toast.success('Plan assigned!');
      setForm(f => ({ ...f, user_id: '', paid_amount: '' }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error assigning plan');
    }
  };

  const handleExtend = async (id) => {
    try {
      await subscriptionsAPI.extend(id, extendDays);
      toast.success(`Extended by ${extendDays} days!`);
      setExtendId(null);
      load();
    } catch { toast.error('Extend failed'); }
  };

  const daysLeft = (end) => {
    const diff = Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Safe checks for map functions
  const safeStudents = Array.isArray(students) ? students : [];
  const safeSubs = Array.isArray(subs) ? subs : [];

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>Assign New Plan</h3>
        <form onSubmit={handleAssign}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
            <div className="form-group">
              <label>Student</label>
              <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required>
                <option value="">Select student</option>
                {safeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                {PLANS.map(p => <option key={p.value} value={p.value}>{p.label} (₹{p.price})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Paid Amount (₹{selectedPlan?.price})</label>
              <input type="number" placeholder={`0 – ${selectedPlan?.price}`} value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))} max={selectedPlan?.price} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Assign Plan</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>All Subscriptions</h3>
        {loading ? <p style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading...</p> : (
          <table>
            <thead>
              <tr><th>Student</th><th>Plan</th><th>Start</th><th>End</th><th>Days Left</th><th>Status</th><th>Payment</th><th>Action</th></tr>
            </thead>
            <tbody>
              {safeSubs.map(s => {
                const dl = daysLeft(s.end_date);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ fontSize: 12 }}>{s.plan_type} / {s.duration}</td>
                    <td style={{ fontSize: 12 }}>{new Date(s.start_date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{new Date(s.end_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: dl < 7 ? '#EF4444' : dl < 15 ? '#F59E0B' : '#22C55E' }}>
                        {dl > 0 ? `${dl}d` : 'Expired'}
                      </span>
                    </td>
                    <td><span className={`badge ${dl > 0 ? (dl < 7 ? 'badge-yellow' : 'badge-green') : 'badge-red'}`}>{dl > 0 ? (dl < 7 ? 'Expiring' : 'Active') : 'Expired'}</span></td>
                    <td><span className={`badge ${s.payment_status === 'paid' ? 'badge-green' : s.payment_status === 'partial' ? 'badge-yellow' : 'badge-red'}`}>{s.payment_status || 'pending'}</span></td>
                    <td>
                      {extendId === s.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} style={{ width: 60, padding: '5px 8px' }} min="1" />
                          <button className="btn-edit" onClick={() => handleExtend(s.id)}>+Days</button>
                          <button className="btn-danger" onClick={() => setExtendId(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="btn-edit" onClick={() => setExtendId(s.id)}>Extend</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}