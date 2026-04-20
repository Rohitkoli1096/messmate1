import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      console.log('Logged in user:', user);
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate(user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#4F46E5,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🍛</div>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800 }}>MessMate</h1>
          <p style={{ color: 'rgba(255,255,255,.75)', marginTop: 4 }}>Smart Mess, Smart Living</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,.97)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>Welcome Back 👋</h2>
          <div className="form-group">
            <label>Username</label>
            <input placeholder="Enter your username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 8, padding: '14px' }}
          >
            {loading ? 'Signing in...' : 'Login →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
            Forgot password? <span style={{ color: '#4F46E5', fontWeight: 600 }}>Contact Admin</span>
          </p>
        </form>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 20 }}>
          Demo: admin / admin123 &nbsp;|&nbsp; rohit.s / pass123
        </p>
      </div>
    </div>
  );
}
