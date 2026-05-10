import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionsAPI } from '../../api';
import { motion } from 'framer-motion';
import { 
  Phone, ShieldCheck, Calendar, 
  CreditCard, LogOut, ChevronRight,
  Activity, Crown, MapPin, Zap
} from 'lucide-react';

export default function ProfileScreen({ onLogout }) {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionsAPI.getMy()
      .then(r => setSub(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'ST';
  const daysLeft = sub ? Math.ceil((new Date(sub.end_date) - new Date()) / 86400000) : 0;

  if (loading) return <div style={styles.loading}>Decrypting Profile...</div>;

  return (
    <div style={styles.shell}>
      <main style={styles.container}>
        {/* 2. IDENTITY HERO CARD - REDUCED PADDING & AVATAR SIZE */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={styles.heroCard}
        >
          <div style={styles.avatarWrapper}>
            <div style={styles.avatarGlow} />
            <div style={styles.avatarInner}>{initials}</div>
            <div style={styles.verifiedTick}><ShieldCheck size={12} fill="#fff" /></div>
          </div>
          
          <div style={styles.heroText}>
            <h1 style={styles.userName}>{user?.name}</h1>
            <p style={styles.userSub}>ID: {user?.username} • {user?.phone}</p>
          </div>

          <div style={styles.badgeRow}>
            <div style={styles.statusBadge}>ACTIVE</div>
            <div style={styles.statusBadge}>STUDENT</div>
          </div>
        </motion.section>

        {/* 3. SUBSCRIPTION BENTO - COMPACT VERSION */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <Crown size={12} color="#6366F1" />
            <span>Membership Info</span>
          </div>
          
          {sub ? (
            <div style={styles.planCard}>
                <div style={styles.planMain}>
                    <div>
                        <div style={styles.planLabel}>PLAN</div>
                        <div style={styles.planTitle}>
                          {sub.plan_type === 'full' ? 'Full Executive' : 'Single Tier'}
                        </div>
                    </div>
                    <div style={{...styles.daysBadge, color: daysLeft < 7 ? '#EF4444' : '#10B981'}}>
                        {daysLeft}d
                    </div>
                </div>
                
                <div style={styles.progressTrack}>
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                        style={{...styles.progressFill, background: daysLeft < 7 ? '#EF4444' : '#6366F1'}} 
                    />
                </div>

                <div style={styles.planFooter}>
                    <div style={styles.planMeta}><Calendar size={10}/> {new Date(sub.end_date).toLocaleDateString('en-IN')}</div>
                    <div style={styles.planMeta}><CreditCard size={10}/> {sub.payment_status.toUpperCase()}</div>
                </div>
            </div>
          ) : (
            <div style={styles.emptyCard}>No active deployment found.</div>
          )}
        </section>

        {/* 4. DATA GRID - REDUCED PADDING */}
        <div style={styles.dataGrid}>
           <MetricBox icon={<Phone size={16}/>} label="Phone" val={user?.phone || '—'} />
           <MetricBox icon={<MapPin size={16}/>} label="Room" val={user?.room || '—'} />
        </div>

        {/* 5. ACTION DOCK - TIGHTER LIST ITEMS */}
        <div style={styles.actionDock}>
            <ActionItem icon={<Activity size={16}/>} label="Consumption Logs" />
            <ActionItem icon={<Zap size={16}/>} label="Authorizations" />
            <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={onLogout} 
                style={styles.logoutBtn}
            >
                <div style={styles.logoutInner}>
                    <LogOut size={16} />
                    <span>Terminate Session</span>
                </div>
                <ChevronRight size={16} />
            </motion.button>
        </div>

        <p style={styles.buildInfo}>TITAN OS v6.0.4 • 2026</p>
      </main>
    </div>
  );
}

const MetricBox = ({ icon, label, val }) => (
    <div style={styles.metricBox}>
        <div style={styles.metricIcon}>{icon}</div>
        <div>
            <div style={styles.metricLabel}>{label}</div>
            <div style={styles.metricVal}>{val}</div>
        </div>
    </div>
);

const ActionItem = ({ icon, label }) => (
    <div style={styles.actionItem}>
        <div style={styles.actionLeft}>
            <div style={styles.actionIcon}>{icon}</div>
            <span style={styles.actionLabel}>{label}</span>
        </div>
        <ChevronRight size={14} color="#94A3B8" />
    </div>
);

const styles = {
  shell: { background: '#F8FAFC', minHeight: '100vh', color: '#0F172A', fontFamily: '"Inter", sans-serif' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#6366F1', letterSpacing: 2 },
  
  container: { padding: '16px' }, // Reduced from 20px
  heroCard: { 
    background: '#fff', borderRadius: 24, padding: '20px 16px', textAlign: 'center', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', marginBottom: 16 
  },
  avatarWrapper: { position: 'relative', width: 70, height: 70, margin: '0 auto 12px' }, // Shrunken avatar
  avatarGlow: { position: 'absolute', inset: -3, background: 'linear-gradient(45deg, #6366F1, #A855F7)', borderRadius: 24, opacity: 0.15, filter: 'blur(6px)' },
  avatarInner: { 
    width: '100%', height: '100%', borderRadius: 22, background: '#0F172A', color: '#fff', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, position: 'relative' 
  },
  verifiedTick: { position: 'absolute', bottom: -2, right: -2, background: '#6366F1', borderRadius: '50%', padding: 3, border: '2px solid #fff' },
  userName: { fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 2 },
  userSub: { fontSize: 11, color: '#94A3B8', fontWeight: 600 },
  badgeRow: { display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 },
  statusBadge: { background: '#F1F5F9', padding: '3px 10px', borderRadius: 100, fontSize: 9, fontWeight: 800, color: '#64748B' },

  section: { marginBottom: 16 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 },
  planCard: { background: '#fff', borderRadius: 24, padding: 16, border: '1px solid #E2E8F0' },
  planMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  planLabel: { fontSize: 9, fontWeight: 800, color: '#6366F1', marginBottom: 2 },
  planTitle: { fontSize: 16, fontWeight: 900 },
  daysBadge: { fontSize: 18, fontWeight: 900 },
  progressTrack: { height: 5, background: '#F1F5F9', borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10 },
  planFooter: { display: 'flex', gap: 12, borderTop: '1px solid #F1F5F9', paddingTop: 10 },
  planMeta: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#94A3B8' },

  dataGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
  metricBox: { background: '#fff', padding: 12, borderRadius: 20, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 },
  metricIcon: { color: '#6366F1' },
  metricLabel: { fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' },
  metricVal: { fontSize: 13, fontWeight: 800 },

  actionDock: { background: '#fff', borderRadius: 24, padding: '4px 14px', border: '1px solid #E2E8F0' },
  actionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9' },
  actionLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  actionIcon: { color: '#94A3B8' },
  actionLabel: { fontSize: 13, fontWeight: 700 },

  logoutBtn: { 
    width: '100%', padding: '12px 0', marginTop: 4, background: 'none', border: 'none', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' 
  },
  logoutInner: { display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444', fontWeight: 800, fontSize: 14 },
  buildInfo: { textAlign: 'center', fontSize: 9, fontWeight: 800, color: '#CBD5E1', marginTop: 20, letterSpacing: 1 },
  emptyCard: { textAlign: 'center', padding: 16, color: '#94A3B8', fontWeight: 700, fontSize: 12 }
};