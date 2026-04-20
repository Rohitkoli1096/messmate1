import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../../api';
import toast from 'react-hot-toast';

export function PaymentScreen() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  useEffect(() => {
    paymentsAPI.getMy().then(r => setPayment(r.data)).catch(() => toast.error('Failed to load payment')).finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!file || !payment) return;
    const fd = new FormData();
    fd.append('screenshot', file);
    fd.append('payment_id', payment.id);
    try {
      await paymentsAPI.uploadScreenshot(fd);
      toast.success('Screenshot uploaded! Admin will verify.');
    } catch { toast.error('Upload failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Loading...</div>;

  const planProgress = payment ? Math.round(((new Date() - new Date(payment.start_date)) / (new Date(payment.end_date) - new Date(payment.start_date))) * 100) : 0;
  const remaining = payment ? Number(payment.total_amount) - Number(payment.paid_amount) : 0;

  return (
    <div style={{ padding: 16 }}>
      {payment ? (
        <>
          <div style={{ background: 'linear-gradient(135deg,#4F46E5,#8B5CF6)', borderRadius: 20, padding: 20, color: '#fff', marginBottom: 14 }}>
            <div style={{ fontSize: 11, opacity: .7, marginBottom: 4 }}>CURRENT PLAN</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{payment.plan_type === 'full' ? 'Full Meal' : 'Single Meal'} – {payment.duration === '1month' ? '1 Month' : '15 Days'}</div>
            <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>
              {new Date(payment.start_date).toLocaleDateString('en-IN')} → {new Date(payment.end_date).toLocaleDateString('en-IN')}
            </div>
            <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 20, height: 8, margin: '14px 0 4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(planProgress, 100)}%`, height: '100%', background: '#fff', borderRadius: 20 }} />
            </div>
            <div style={{ fontSize: 11, opacity: .7 }}>
              {Math.ceil((new Date(payment.end_date) - new Date()) / 86400000)} days remaining
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            {[
              { label: 'Plan Total', val: `₹${Number(payment.total_amount).toLocaleString('en-IN')}`, color: '#1e1b4b' },
              { label: 'Amount Paid', val: `₹${Number(payment.paid_amount).toLocaleString('en-IN')}`, color: '#22C55E' },
              { label: 'Remaining', val: `₹${remaining.toLocaleString('en-IN')}`, color: remaining > 0 ? '#EF4444' : '#22C55E' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Status</span>
              <span className={`badge badge-${payment.status === 'paid' ? 'green' : payment.status === 'partial' ? 'yellow' : 'red'}`}>{payment.status}</span>
            </div>
          </div>

          {remaining > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#1e1b4b' }}>Upload Payment Proof</div>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ marginBottom: 10, fontSize: 12 }} />
              <button onClick={handleUpload} disabled={!file} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 15, fontWeight: 800, cursor: file ? 'pointer' : 'not-allowed', opacity: file ? 1 : .6 }}>
                Upload UPI Screenshot <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
  <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
</svg>
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none">
  <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
  <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
</svg></div>
          <p>No active subscription found.<br />Contact admin to assign a plan.</p>
        </div>
      )}
    </div>
  );
}

export default PaymentScreen;