import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionsAPI } from '../../api';
import { useEffect, useState } from 'react';

export default function ProfileScreen({ onLogout }) {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);

  useEffect(() => {
    subscriptionsAPI.getMy().then(r => setSub(r.data)).catch(() => {});
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'S';
  const daysLeft = sub ? Math.ceil((new Date(sub.end_date) - new Date()) / 86400000) : 0;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: 'linear-gradient(135deg,#4F46E5,#8B5CF6)', borderRadius: 20, padding: 28, color: '#fff', textAlign: 'center', marginBottom: 14 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.25)', border: '3px solid rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, margin: '0 auto 12px' }}>{initials}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.name}</div>
        <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>{user?.username} · Student</div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 10 }}>Personal Info</div>
        {[
          { label: 'Phone', val: user?.phone || '—' },
          { label: 'Room', val: user?.room || '—' },
          { label: 'Role', val: 'Student' },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>{r.label}</span>
            <span style={{ fontWeight: 700 }}>{r.val}</span>
          </div>
        ))}
      </div>

      {sub && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 10 }}>Current Plan</div>
          {[
            { label: 'Plan', val: `${sub.plan_type === 'full' ? 'Full Meal' : 'Single Meal'} – ${sub.duration === '1month' ? '1 Month' : '15 Days'}` },
            { label: 'Valid Till', val: new Date(sub.end_date).toLocaleDateString('en-IN') },
            { label: 'Days Left', val: <span style={{ color: daysLeft < 7 ? '#EF4444' : '#22C55E', fontWeight: 700 }}>{daysLeft}d</span> },
            { label: 'Meals', val: <span style={{ color: '#22C55E' }}>{sub.plan_type === 'full' ? 'Lunch + Dinner' : 'Lunch only'}</span> },
            { label: 'Payment', val: <span className={`badge badge-${sub.payment_status === 'paid' ? 'green' : sub.payment_status === 'partial' ? 'yellow' : 'red'}`}>{sub.payment_status}</span> },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>{r.label}</span>
              <span style={{ fontWeight: 700 }}>{r.val}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={onLogout} style={{ width: '100%', padding: 14, borderRadius: 14, border: '2px solid #EF4444', background: 'transparent', color: '#EF4444', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );
}
