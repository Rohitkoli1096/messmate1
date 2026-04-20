import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../../api';
import toast from 'react-hot-toast';

export function PaymentScreen() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  useEffect(() => {
    paymentsAPI.getMy()
      .then(r => setPayment(r.data))
      .catch(() => toast.error('Failed to load payment'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!file || !payment) return;
    const tid = toast.loading("Processing upload...");
    const fd = new FormData();
    fd.append('screenshot', file);
    fd.append('payment_id', payment.id);
    try {
      await paymentsAPI.uploadScreenshot(fd);
      toast.success('Screenshot sent! Admin verification pending.', { id: tid });
      setFile(null);
    } catch { 
      toast.error('Upload failed. Please try again.', { id: tid }); 
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#6366f1' }}>
      <div>🌀 Loading Payment Info...</div>
    </div>
  );

  // Logic for Plan Progress
  const today = new Date();
  const startDate = payment ? new Date(payment.start_date) : today;
  const endDate = payment ? new Date(payment.end_date) : today;
  const planProgress = Math.round(((today - startDate) / (endDate - startDate)) * 100);
  const daysLeft = Math.ceil((endDate - today) / 86400000);
  const remaining = payment ? Number(payment.total_amount) - Number(payment.paid_amount) : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto', background: '#F9FAFB', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {payment ? (
        <>
          {/* 1. MEMBERSHIP CARD (CURRENT PLAN) */}
          <div style={{ 
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', 
            borderRadius: '24px', padding: '24px', color: '#fff', marginBottom: '16px',
            boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8, letterSpacing: '1px', marginBottom: '4px' }}>CURRENT PLAN</p>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                   {payment.plan_type === 'full' ? 'Full Meal' : 'Single Meal'} – {payment.duration === '1month' ? '1 Month' : '15 Days'}
                </h2>
                <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
                  {startDate.toLocaleDateString('en-IN')} → {endDate.toLocaleDateString('en-IN')}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                {daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', height: '8px', margin: '20px 0 6px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(Math.max(planProgress, 0), 100)}%`, 
                height: '100%', background: '#fff', borderRadius: '20px',
                transition: 'width 1s ease-in-out'
              }} />
            </div>
            <p style={{ fontSize: '11px', opacity: 0.8, textAlign: 'right', fontWeight: 600 }}>Plan Usage: {planProgress}%</p>
          </div>

          {/* 2. BALANCE STATUS CARD */}
          <div style={{ 
            background: '#fff', borderRadius: '24px', padding: '24px', textAlign: 'center', 
            marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' 
          }}>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Current Balance Status</p>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 8px' }}>
              ₹{Number(payment.total_amount).toLocaleString('en-IN')}
            </h1>
            <span style={{ 
              background: payment.status === 'paid' ? '#DCFCE7' : '#FEF3C7', 
              color: payment.status === 'paid' ? '#15803d' : '#9a3412',
              padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'
            }}>
              {payment.status}
            </span>
          </div>

          {/* 3. SIDE-BY-SIDE STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>PAID</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#22C55E' }}>₹{Number(payment.paid_amount).toLocaleString('en-IN')}</p>
            </div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>REMAINING</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444' }}>₹{remaining.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* 4. QR SCANNER SECTION */}
          {remaining > 0 && (
            <div style={{ 
              background: '#fff', borderRadius: '24px', padding: '24px', marginBottom: '16px', 
              textAlign: 'center', border: '1px solid #f1f5f9'
            }}>
              <div style={{ 
                width: '160px', height: '160px', margin: '0 auto 16px', background: '#fff', 
                padding: '10px', borderRadius: '16px', border: '1px solid #e2e8f0'
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=messmate@fintech&pn=MessMate&am=${remaining}`} 
                  alt="QR" style={{ width: '100%', height: '100%' }}
                />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>Scan to Pay</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>UPI ID: <span style={{ fontWeight: 700, color: '#4F46E5' }}>messmate@fintech</span></p>
            </div>
          )}

          {/* 5. UPLOAD SECTION */}
          {remaining > 0 && (
            <>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', marginBottom: '10px', paddingLeft: '4px' }}>Proof of Payment</p>
              <div style={{ 
                background: '#fff', borderRadius: '20px', padding: '24px', border: '2px dashed #cbd5e1', 
                textAlign: 'center', position: 'relative'
              }}>
                <input 
                  type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                />
                <div style={{ width: '40px', height: '40px', background: '#F0F9FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
                  {file ? file.name : "Tap to select screenshot"}
                </p>
              </div>

              <button 
                onClick={handleUpload} 
                disabled={!file} 
                style={{ 
                  width: '100%', marginTop: '16px', padding: '16px', borderRadius: '16px', border: 'none', 
                  background: file ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : '#cbd5e1', 
                  color: '#fff', fontSize: '16px', fontWeight: 800, cursor: file ? 'pointer' : 'not-allowed',
                  boxShadow: file ? '0 8px 15px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                Confirm & Submit Payment
              </button>
            </>
          )}

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '20px' }}>
            Payments are manually verified by staff <br /> within 24 working hours.
          </p>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ color: '#64748b' }}>No active subscription found.</p>
        </div>
      )}
    </div>
  );
}

export default PaymentScreen;