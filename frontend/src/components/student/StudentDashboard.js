import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { attendanceAPI, subscriptionsAPI, notificationsAPI } from "../../api";
import { motion } from "framer-motion"; // Removed AnimatePresence as it's no longer used
import { 
  QrCode, 
  Flame, 
  CheckCircle2, 
  Utensils,
  TrendingUp
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState({ lunch: null, dinner: null });
  const [sub, setSub] = useState(null);
  const [stats, setStats] = useState({ percent: 0, streak: 0 });
  const [liveMenu, setLiveMenu] = useState({
    lunch: "Standard Lunch Set",
    dinner: "Standard Dinner Set"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const todayStr = now.toISOString().split("T")[0];

        const [attendanceRes, subRes, notifRes] = await Promise.all([
          attendanceAPI.getMy(month, year),
          subscriptionsAPI.getMy(),
          notificationsAPI.getMy()
        ]);

        const records = attendanceRes.data || [];
        const todayRecs = records.filter((a) => a.date?.startsWith(todayStr));
        setToday({
          lunch: todayRecs.find((a) => a.meal_type === "lunch"),
          dinner: todayRecs.find((a) => a.meal_type === "dinner"),
        });

        const presentCount = records.filter((a) => a.status === "present").length;
        setStats({
          percent: records.length ? Math.round((presentCount / records.length) * 100) : 0,
          streak: records.filter(r => r.status === 'present').length, 
        });

        const notifs = Array.isArray(notifRes) ? notifRes : (notifRes.data || []);
        const menuUpdates = { lunch: "Standard Lunch Set", dinner: "Standard Dinner Set" };
        
        notifs.forEach(n => {
            if (n.title.toLowerCase().includes('lunch') && menuUpdates.lunch === "Standard Lunch Set") {
                menuUpdates.lunch = n.message;
            }
            if (n.title.toLowerCase().includes('dinner') && menuUpdates.dinner === "Standard Dinner Set") {
                menuUpdates.dinner = n.message;
            }
        });
        setLiveMenu(menuUpdates);
        setSub(subRes.data);
      } catch (error) {
        console.error("Dashboard sync failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDaysLeft = () => {
    if (!sub?.end_date) return 0;
    const diff = new Date(sub.end_date) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 font-bold">Syncing Profile...</div>;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1E293B", paddingBottom: 100 }}>
      
      <main style={{ padding: "24px 20px" }}>
        
        {/* ✅ INTEGRATED BLUE SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", 
            borderRadius: 32, padding: "28px", color: "#fff",
            boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.25)",
            marginBottom: 24, position: "relative", overflow: "hidden"
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: 1.2 }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: "4px 0" }}>Hey, {user?.name?.split(' ')[0]}! 👋</h2>
              </div>
              
              <div style={{ background: "rgba(255,255,255,0.2)", padding: 12, borderRadius: 16, backdropFilter: "blur(4px)" }}>
                <QrCode size={24} color="#fff" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    Status: Standard Plan
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {daysLeft} Days Remaining
                </div>
            </div>
            
            <div style={{ marginTop: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.9 }}>Monthly Attendance</span>
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{stats.percent}%</span>
                </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 10 }}>
                <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${stats.percent}%` }} 
                    style={{ height: "100%", background: "#fff", borderRadius: 10 }} 
                />
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(20px)" }} />
        </motion.section>

        {/* Claim Status Grid */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {['lunch', 'dinner'].map((type) => {
            const isMarked = today[type]?.status === "present";
            return (
              <div key={type} style={{ 
                  flex: 1, background: isMarked ? "#DCFCE7" : "#fff", borderRadius: 24, padding: "16px", 
                  border: isMarked ? "1.5px solid #10B981" : "1.5px solid #E2E8F0", textAlign: "center",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
                }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: isMarked ? "#16A34A" : "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>{type}</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4, color: isMarked ? "#16A34A" : "#1E293B" }}>
                  {isMarked ? "Claimed" : "Available"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Menu */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Today's Menu 🍲</h3>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '4px 12px', borderRadius: 20 }}>LIVE UPDATES</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
             <MealTimelineItem 
                type="Lunch" 
                time="12:30 PM - 02:30 PM" 
                items={liveMenu.lunch} 
                isDone={today.lunch?.status === "present"} 
             />
             <MealTimelineItem 
                type="Dinner" 
                time="07:30 PM - 09:30 PM" 
                items={liveMenu.dinner} 
                isDone={today.dinner?.status === "present"} 
             />
          </div>
        </section>

        {/* Footer Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <StatCard icon={<Flame color="#EF4444" size={20} />} label="Streak" val={`${stats.streak} Days`} />
            <StatCard icon={<TrendingUp color="#4F46E5" size={20} />} label="Rating" val="4.8/5" />
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, val }) {
  return (
    <div style={{ background: "#fff", padding: "18px", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
      <div style={{ marginBottom: "8px" }}>{icon}</div>
      <div style={{ color: "#64748B", fontSize: "12px", fontWeight: "700" }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: "800", color: "#1E293B" }}>{val}</div>
    </div>
  );
}

function MealTimelineItem({ type, time, items, isDone }) {
  return (
    <div style={{ 
      display: "flex", gap: "16px", background: isDone ? "#F0FDF4" : "#fff",
      padding: "18px", borderRadius: "24px", border: "1px solid #E2E8F0"
    }}>
      <div style={{ 
        width: "44px", height: "44px", borderRadius: "14px", background: isDone ? "#10B981" : "#F8FAFC",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        {isDone ? <CheckCircle2 color="white" size={22}/> : <Utensils color="#94A3B8" size={20} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "800" }}>{type}</span>
          <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>{time}</span>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B", lineHeight: 1.4, fontWeight: 500 }}>
            {items}
        </p>
      </div>
    </div>
  );
}