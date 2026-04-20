import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import ManageStudents from '../components/admin/ManageStudents';
import AttendanceMonitor from '../components/admin/AttendanceMonitor';
import PaymentManagement from '../components/admin/PaymentManagement';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor"/>
        <rect x="14" y="3" width="7" height="4" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="14" y="9" width="7" height="12" rx="2" fill="currentColor"/>
        <rect x="3" y="12" width="7" height="9" rx="2" fill="currentColor" opacity="0.6"/>
      </svg>
    )
  },
  {
    id: 'students',
    label: 'Students',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="4" fill="currentColor" opacity="0.2"/>
        <circle cx="17" cy="10" r="3" fill="currentColor" opacity="0.2"/>
        <path d="M3 20C3 16 7 14 9 14C11 14 15 16 15 20" stroke="currentColor" strokeWidth="2"/>
        <path d="M14 20C14 17 17 16 19 16" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
        <rect x="7" y="10" width="6" height="2" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
        <circle cx="8" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
      </svg>
    )
  }
];

export default function AdminLayout() {
  const [active, setActive] = useState('dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const panels = {
    dashboard: <AdminDashboard />,
    students: <ManageStudents />,
    attendance: <AttendanceMonitor />,
    payments: <PaymentManagement />,
    subscriptions: <SubscriptionManagement />,
  };

  const titles = { dashboard: 'Admin Dashboard', students: 'Manage Students', attendance: 'Attendance Monitor', payments: 'Payment Management', subscriptions: 'Subscription Management' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#1e1b4b', display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#4F46E5,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍛</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Mess<span style={{ color: '#8B5CF6' }}>Mate</span></span>
        </div>
        {navItems.map(n => (
          <div key={n.id}
            onClick={() => setActive(n.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: active === n.id ? '#fff' : '#a5b4fc', background: active === n.id ? 'rgba(139,92,246,.2)' : 'transparent', borderLeft: active === n.id ? '3px solid #8B5CF6' : '3px solid transparent', fontSize: 13, fontWeight: 500, transition: 'all .2s' }}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{n.icon}</span> {n.label}
          </div>
        ))}
        <div style={{ height: 1, background: 'rgba(255,255,255,.1)', margin: '8px 4px' }} />
        <div style={{ marginTop: 'auto', padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#06B6D4,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
              {user?.name?.[0] || 'A'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#a5b4fc', fontSize: 11 }}>Admin</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 16 }} title="Logout">⏻</button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b' }}>{titles[active]}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: '#f3f4f6', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#6b7280' }}>
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#F0F0FF' }}>
          {panels[active]}
        </div>
      </div>
    </div>
  );
}
