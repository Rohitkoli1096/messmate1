import React, { useEffect, useState } from "react";
import { attendanceAPI, subscriptionsAPI, notificationsAPI } from "../../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    lunch: 0,
    dinner: 0,
    total: 0,
    absent: 0,
    lunch_names: [],
    dinner_names: [],
  });
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);

  // Management States
  const [mealMenu, setMealMenu] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [expiringUsers, setExpiringUsers] = useState([]);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([
      attendanceAPI.getStats().catch(() => null),
      attendanceAPI.getWeekly().catch(() => []),
      subscriptionsAPI.getExpiring().catch(() => []),
    ])
      .then(([s, w, e]) => {
        if (s) {
          setStats({
            lunch: s.lunch || 0,
            dinner: s.dinner || 0,
            total: s.total || 0,
            absent: s.absent || 0,
            lunch_names: Array.isArray(s.lunch_names) ? s.lunch_names : [],
            dinner_names: Array.isArray(s.dinner_names) ? s.dinner_names : [],
          });
        }

        const map = {};
        const weeklyData = Array.isArray(w) ? w : [];
        weeklyData.forEach((r) => {
          const dateObj = new Date(r.date);
          const formattedDate = dateObj.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          });
          if (!map[r.date])
            map[r.date] = { date: formattedDate, lunch: 0, dinner: 0 };
          map[r.date][r.meal_type] = Number(r.count);
        });

        setWeekly(Object.values(map));
        setExpiringUsers(Array.isArray(e) ? e : []);
      })
      .catch((err) => {
        console.error("Dashboard Load Error:", err);
        toast.error("Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  };

  const handleAbsenceCheck = async () => {
    setIsChecking(true);
    const tid = toast.loading("Running system-wide absence check...");
    try {
      await attendanceAPI.absenceCheck();
      toast.success("Absence check complete! Refreshing data...", { id: tid });
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to run absence check", { id: tid });
    } finally {
      setIsChecking(false);
    }
  };

  const handleExport = () => {
    if (!expiringUsers || expiringUsers.length === 0) {
      return toast.error("No student data available to export");
    }
    const headers = ["Student Name", "Date", "Lunch Status", "Dinner Status"];
    const today = new Date().toLocaleDateString("en-IN");
    const rows = expiringUsers.map((user) => {
      const isLunchPresent = (stats.lunch_names || []).includes(user.name) ? "Present" : "Absent";
      const isDinnerPresent = (stats.dinner_names || []).includes(user.name) ? "Present" : "Absent";
      return `"${user.name}",${today},${isLunchPresent},${isDinnerPresent}`;
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Individual Report Exported!");
  };

  const handleNotify = async () => {
    if (!mealMenu.trim()) return toast.error("Please enter meal menu details");
    setIsNotifying(true);
    const tid = toast.loading("Broadcasting notification...");
    try {
      await notificationsAPI.sendMealUpdate({
        meal_type: mealType,
        menu: mealMenu,
        date: new Date().toISOString().split("T")[0],
      });
      toast.success("Notification sent!", { id: tid });
      setMealMenu("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Notify Failed", { id: tid });
    } finally {
      setIsNotifying(false);
    }
  };

  if (loading)
    return <div style={{ textAlign: "center", padding: 80, color: "#6b7280", fontWeight: "600" }}>Syncing Dashboard Data...</div>;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "10px" }}>
      
      {/* 1. PROFESSIONAL STATS HEADER (Incorporated Left Borders) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "30px" }}>
        
        {/* Total Strength Card */}
        <div className="stat-card" style={{ borderLeft: "6px solid #4F46E5", padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Daily Capacity</div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}>{stats.total}</div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Registered Strength</div>
        </div>

        {/* Lunch Served Card */}
        <div className="stat-card" style={{ borderLeft: "6px solid #06B6D4", padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Lunch Served</div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#0891b2" }}>{stats.lunch}</div>
          <div style={{ fontSize: "12px", color: "#06B6D4", fontWeight: "600" }}>{stats.total ? Math.round((stats.lunch / stats.total) * 100) : 0}% Coverage</div>
        </div>

        {/* Dinner Served Card */}
        <div className="stat-card" style={{ borderLeft: "6px solid #3B82F6", padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Dinner Served</div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#1d4ed8" }}>{stats.dinner}</div>
          <div style={{ fontSize: "12px", color: "#3B82F6", fontWeight: "600" }}>Current Session</div>
        </div>

        {/* Absent Card */}
        <div className="stat-card" style={{ borderLeft: "6px solid #EF4444", padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Total Absent</div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#b91c1c" }}>{stats.absent}</div>
          <div style={{ fontSize: "12px", color: "#EF4444", fontWeight: "600" }}>Daily Variance</div>
        </div>
      </div>

      {/* 2. ANALYTICS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "10px" }} />
              <Bar dataKey="lunch" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Lunch" />
              <Bar dataKey="dinner" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Dinner" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Distribution Profile</h3>
          {[
            { label: "Lunch", val: stats.lunch, color: "#4F46E5" },
            { label: "Dinner", val: stats.dinner, color: "#06B6D4" },
            { label: "Absent", val: stats.absent, color: "#EF4444" },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span>{m.label}</span>
                <span style={{ fontWeight: 700 }}>{stats.total ? Math.round((m.val / stats.total) * 100) : 0}%</span>
              </div>
              <div className="progress-wrap" style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div className="progress-fill" style={{ height: "100%", width: `${stats.total ? (m.val / stats.total) * 100 : 0}%`, background: m.color, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SYSTEM ACTIONS */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>System Control Center</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={handleAbsenceCheck} disabled={isChecking} style={{ display: "flex", alignItems: "center", gap: 8, opacity: isChecking ? 0.7 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
            {isChecking ? "Running Check..." : "Run Daily Absence Check"}
          </button>
          <button className="btn-primary" onClick={handleExport} style={{ background: "linear-gradient(135deg,#06B6D4,#3B82F6)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export Attendance CSV
          </button>
        </div>
      </div>

      {/* 4. MANAGEMENT GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>📢 Broadcast Meal Menu</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 13 }}>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <textarea placeholder="Enter today's menu items..." value={mealMenu} onChange={(e) => setMealMenu(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", minHeight: 80, fontSize: 13, outline: "none", resize: "none" }} />
            <button className="btn-primary" onClick={handleNotify} disabled={isNotifying} style={{ background: isNotifying ? "#9ca3af" : "#4F46E5" }}>
              {isNotifying ? "Broadcasting..." : "Notify All Students"}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>⏳ Critical Plan Expiries</h3>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {expiringUsers.length > 0 ? (
              expiringUsers.map((user, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Valid until: {new Date(user.end_date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ color: "#EF4444", fontSize: 12, fontWeight: "800", background: "#fef2f2", padding: "4px 8px", borderRadius: "6px" }}>
                    {Math.max(0, Math.ceil((new Date(user.end_date) - new Date()) / 86400000))} Days Left
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", paddingTop: 20 }}>No critical expiries today.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}