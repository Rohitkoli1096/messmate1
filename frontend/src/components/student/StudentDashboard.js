import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { attendanceAPI, subscriptionsAPI, notificationsAPI } from "../../api";
import { motion } from "framer-motion";
import {
  QrCode,
  Flame,
  CheckCircle2,
  Utensils,
  TrendingUp,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState({ lunch: null, dinner: null });
  const [sub, setSub] = useState(null);
  const [stats, setStats] = useState({ percent: 0, streak: 0 });
  const [liveMenu, setLiveMenu] = useState({
    lunch: "Not Allocated",
    dinner: "Not Allocated",
  });

  const extractData = (res) => res?.data?.data || res?.data || res;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        // Use local date string to match DB format YYYY-MM-DD
        const todayStr = now.toLocaleDateString("en-CA");

        const [attendanceRes, subRes, notifRes] = await Promise.all([
          attendanceAPI.getMy(month, year),
          subscriptionsAPI.getMy(),
          notificationsAPI.getMy(),
        ]);

        // 1. Process Attendance & Streak
        const records = extractData(attendanceRes) || [];
        const todayRecs = records.filter((a) => a.date?.startsWith(todayStr));

        setToday({
          lunch: todayRecs.find((a) => a.meal_type === "lunch"),
          dinner: todayRecs.find((a) => a.meal_type === "dinner"),
        });

        const presentCount = records.filter(
          (a) => a.status === "present",
        ).length;
        setStats({
          percent:
            records.length > 0
              ? Math.round((presentCount / records.length) * 100)
              : 0,
          streak: presentCount,
        });

        // 2. Menu Logic (Filter strictly for TODAY)
        const menuUpdates = { lunch: "Not Allocated", dinner: "Not Allocated" };
        const allNotifs = extractData(notifRes) || [];

        if (Array.isArray(allNotifs)) {
          const todaysNotifs = allNotifs.filter((n) => {
            const createdAt = n.created_at || n.createdAt;
            return createdAt && createdAt.startsWith(todayStr);
          });

          todaysNotifs.forEach((n) => {
            const title = n.title?.toLowerCase() || "";
            if (title.includes("lunch")) menuUpdates.lunch = n.message;
            if (title.includes("dinner")) menuUpdates.dinner = n.message;
          });
        }
        setLiveMenu(menuUpdates);

        // 3. Subscription
        setSub(extractData(subRes));
      } catch (error) {
        console.error("Dashboard sync failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const daysLeft = useMemo(() => {
    if (!sub?.end_date) return 0;
    const end = new Date(sub.end_date);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [sub]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-bold text-indigo-600">
        Syncing Profile...
      </div>
    );

  return (
    <div
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: "#1E293B",
        paddingBottom: 100,
      }}
    >
      <main style={{ padding: "16px 12px" }}>
        {/* BLUE HEADER SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            borderRadius: 24,
            padding: "20px 24px",
            color: "#fff",
            boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.25)",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    opacity: 0.8,
                    letterSpacing: 1.2,
                  }}
                >
                  {new Date()
                    .toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                    .toUpperCase()}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0" }}>
                  Hey, {user?.name?.split(" ")[0]}! 👋
                </h2>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: 10,
                  borderRadius: 14,
                  backdropFilter: "blur(4px)",
                }}
              >
                <QrCode size={20} color="#fff" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                Active Plan
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {daysLeft} Days Left
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
                  Monthly Attendance
                </span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>
                  {stats.percent}%
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    background: "#fff",
                    borderRadius: 10,
                  }}

                />
                
              </div>
            </div>
          </div>
        </motion.section>

        {/* CLAIM STATUS GRID */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {["lunch", "dinner"].map((type) => {
            const isMarked = today[type]?.status === "present";
            return (
              <div
                key={type}
                style={{
                  flex: 1,
                  background: isMarked ? "#DCFCE7" : "#fff",
                  borderRadius: 24,
                  padding: "16px",
                  border: isMarked
                    ? "1.5px solid #10B981"
                    : "1.5px solid #E2E8F0",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: isMarked ? "#16A34A" : "#94A3B8",
                    textTransform: "uppercase",
                  }}
                >
                  {type}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    marginTop: 4,
                    color: isMarked ? "#16A34A" : "#1E293B",
                  }}
                >
                  {isMarked ? "Claimed" : "Available"}
                </div>
              </div>
            );
          })}
        </div>

        {/* UPDATED MENU SECTION */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
            Today's Menu 🍲
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MealTimelineItem
              type="Lunch"
              time="10:30 AM - 02:30 PM" // Updated per your request
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

        {/* STATS FOOTER */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <StatCard
            icon={<Flame color="#EF4444" size={20} />}
            label="Streak"
            val={`${stats.streak} Days`}
          />
          <StatCard
            icon={<TrendingUp color="#4F46E5" size={20} />}
            label="Rating"
            val="4.8/5"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, val }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "18px",
        borderRadius: "24px",
        border: "1px solid #E2E8F0",
      }}
    >
      <div style={{ marginBottom: "8px" }}>{icon}</div>
      <div style={{ color: "#64748B", fontSize: "12px", fontWeight: "700" }}>
        {label}
      </div>
      <div style={{ fontSize: "18px", fontWeight: "800", color: "#1E293B" }}>
        {val}
      </div>
    </div>
  );
}

function MealTimelineItem({ type, time, items, isDone }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        background: isDone ? "#F0FDF4" : "#fff",
        padding: "18px",
        borderRadius: "24px",
        border: "1px solid #E2E8F0",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "14px",
          background: isDone ? "#10B981" : "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isDone ? (
          <CheckCircle2 color="white" size={22} />
        ) : (
          <Utensils color="#94A3B8" size={20} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "800" }}>{type}</span>
          <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>
            {time}
          </span>
        </div>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "13px",
            color: "#64748B",
            fontWeight: 500,
          }}
        >
          {items}
        </p>
      </div>
    </div>
  );
}
