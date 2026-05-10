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
} from "recharts";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  // ✅ Robust initial state with arrays to prevent .includes() errors
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
        // ✅ Handle data properly even if one API fails
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

          if (!map[r.date]) {
            map[r.date] = { date: formattedDate, lunch: 0, dinner: 0 };
          }
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

  const handleExport = () => {
    if (!expiringUsers || expiringUsers.length === 0) {
      return toast.error("No student data available to export");
    }

    const headers = ["Student Name", "Date", "Lunch Status", "Dinner Status"];
    const today = new Date().toLocaleDateString("en-IN");

    const rows = expiringUsers.map((user) => {
      // ✅ Check against the lists safely
      const isLunchPresent = (stats.lunch_names || []).includes(user.name)
        ? "Present"
        : "Absent";
      const isDinnerPresent = (stats.dinner_names || []).includes(user.name)
        ? "Present"
        : "Absent";

      return `"${user.name}",${today},${isLunchPresent},${isDinnerPresent}`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Individual Student Report Exported!");
  };

  const handleNotify = async () => {
    if (!mealMenu.trim()) return toast.error("Please enter meal menu details");
    setIsNotifying(true);
    const tid = toast.loading("Broadcasting notification...");

    try {
      // ✅ Sending explicit fields to prevent Database Errors
      await notificationsAPI.sendMealUpdate({
        meal_type: mealType, // 'lunch' or 'dinner'
        menu: mealMenu, // The text content
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      });

      toast.success("Notification sent to all students!", { id: tid });
      setMealMenu("");
    } catch (err) {
      console.error("Notify Error Details:", err);
      // ✅ Show detailed backend error if available
      const errMsg =
        err.response?.data?.message || "Failed to send notification (Check DB)";
      toast.error(errMsg, { id: tid });
    } finally {
      setIsNotifying(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          color: "#6b7280",
          fontWeight: "600",
        }}
      >
        Syncing Dashboard Data...
      </div>
    );

  return (
    <div>
      {/* Stat Grid */}
      <div className="stat-grid">
        {[
          {
            icon: "👥",
            val: stats.total,
            lbl: "Total Students",
            color: "#4F46E5",
          },
          {
            icon: "🍛",
            val: stats.lunch,
            lbl: "Lunch Today",
            color: "#06B6D4",
          },
          {
            icon: "🌙",
            val: stats.dinner,
            lbl: "Dinner Today",
            color: "#3B82F6",
          },
          { icon: "❌", val: stats.absent, lbl: "Absent", color: "#EF4444" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val" style={{ color: s.color }}>
              {s.val}
            </div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
            Weekly Attendance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="lunch"
                fill="#4F46E5"
                radius={[4, 4, 0, 0]}
                name="Lunch"
              />
              <Bar
                dataKey="dinner"
                fill="#06B6D4"
                radius={[4, 4, 0, 0]}
                name="Dinner"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
            Today's Meal Split
          </h3>
          {[
            { label: "Lunch", val: stats.lunch, color: "#4F46E5" },
            { label: "Dinner", val: stats.dinner, color: "#06B6D4" },
            { label: "Absent", val: stats.absent, color: "#EF4444" },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 5,
                }}
              >
                <span>{m.label}</span>
                <span style={{ fontWeight: 700 }}>
                  {m.val}/{stats.total}
                </span>
              </div>
              <div className="progress-wrap">
                <div
                  className="progress-fill"
                  style={{
                    width: `${stats.total ? Math.round((m.val / stats.total) * 100) : 0}%`,
                    background: m.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>
          Quick Actions
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            onClick={() =>
              attendanceAPI.absenceCheck().then(() => {
                toast.success("Absence check complete!");
                loadDashboard(); // Refresh stats
              })
            }
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Run Absence Check
          </button>

          <button
            className="btn-primary"
            onClick={handleExport}
            style={{
              background: "linear-gradient(135deg,#06B6D4,#3B82F6)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>
            📢 Send Meal Notification
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: 13,
              }}
            >
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <textarea
              placeholder="Enter menu items (e.g. Paneer, Roti, Dal...)"
              value={mealMenu}
              onChange={(e) => setMealMenu(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                minHeight: 80,
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              className="btn-primary"
              onClick={handleNotify}
              disabled={isNotifying}
              style={{ background: isNotifying ? "#9ca3af" : "#4F46E5" }}
            >
              {isNotifying ? "Sending..." : "Send Notification to All"}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>
            ⏳ Plan Expiry (Expiring Soon)
          </h3>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {expiringUsers.length > 0 ? (
              expiringUsers.map((user, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      Ends: {new Date(user.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    style={{ color: "#EF4444", fontSize: 12, fontWeight: 700 }}
                  >
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(user.end_date) - new Date()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    )}{" "}
                    Days Left
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  textAlign: "center",
                  paddingTop: 20,
                }}
              >
                No plans expiring soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
