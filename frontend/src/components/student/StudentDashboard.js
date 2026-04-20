import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { attendanceAPI, subscriptionsAPI } from "../../api";
import lunchImg from "./images/lunch.jpeg";
import dinnerImg from "./images/dinner.jpeg"; // Add this line

export default function StudentDashboard({ onScan }) {
  const { user } = useAuth();
  const [today, setToday] = useState({ lunch: null, dinner: null });
  const [sub, setSub] = useState(null);
  const [stats, setStats] = useState({ percent: 0, streak: 0 });

  useEffect(() => {
    const now = new Date();
    attendanceAPI.getMy(now.getMonth() + 1, now.getFullYear()).then((r) => {
      const todayStr = now.toISOString().split("T")[0];
      const todayRecs = r.data.filter((a) => a.date?.startsWith(todayStr));
      setToday({
        lunch: todayRecs.find((a) => a.meal_type === "lunch"),
        dinner: todayRecs.find((a) => a.meal_type === "dinner"),
      });
      // Calculate attendance %
      const totalDays = r.data.length;
      const present = r.data.filter((a) => a.status === "present").length;
      setStats({
        percent: totalDays ? Math.round((present / totalDays) * 100) : 0,
        streak: 5,
      });
    });
    subscriptionsAPI.getMy().then((r) => setSub(r.data));
  }, []);

  const daysLeft = sub
    ? Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  const MealCard = ({ type, icon, record }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        textAlign: "center",
        flex: 1,
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        borderTop: `3px solid ${record?.status === "present" ? "#22C55E" : "#EF4444"}`,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        {type.toUpperCase()}
      </div>
      <span
        style={{
          background: record?.status === "present" ? "#dcfce7" : "#fee2e2",
          color: record?.status === "present" ? "#16a34a" : "#dc2626",
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {record?.status === "present" ? "Present ✓" : "Absent ✗"}
      </span>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#4F46E5,#8B5CF6)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 14,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.8 }}>{greeting} 👋</div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: "4px 0" }}>
          {user?.name}
        </div>
        <div
          style={{
            background: "rgba(255,255,255,.2)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            marginTop: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="10"
              x2="21"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="8"
              y1="3"
              x2="8"
              y2="7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="16"
              y1="3"
              x2="16"
              y2="7"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>

          <span>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </div>

      {/* Meal Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        {/* Lunch uses a standard Emoji string */}
        <MealCard
          type="Lunch"
          icon={
            // 1. Add this at the very top of your file
            // 2. Use it in your code like this:
            <img
              src={lunchImg}
              alt="Lunch"
              style={{
                width: 90, // 160 is too wide for a small card
                height: 90, // Match width for a perfect circle
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          }
          record={today.lunch}
        />

        {/* Dinner now uses a JSX <img> tag instead of a string */}
        <MealCard
          type="Dinner"
          icon={
            <img
              src={dinnerImg}
              alt="Dinner"
              style={{
                width: 90, // Match Lunch width
                height: 90, // Match Lunch height
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #f3f4f6", // Optional: gives a clean edge
              }}
            />
          }
          record={today.dinner}
        />
      </div>

      {/* QR Button */}
      <button
        onClick={onScan}
        style={{
          width: "100%",
          padding: 16,
          borderRadius: 16,
          border: "none",
          background: "linear-gradient(135deg,#06B6D4,#3B82F6)",
          color: "#fff",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 4px 20px rgba(6,182,212,.3)",
        }}
      >
        {/* Scan Icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 7V4H7" stroke="white" strokeWidth="2" />
          <path d="M20 7V4H17" stroke="white" strokeWidth="2" />
          <path d="M4 17V20H7" stroke="white" strokeWidth="2" />
          <path d="M20 17V20H17" stroke="white" strokeWidth="2" />
          <rect
            x="7"
            y="7"
            width="10"
            height="10"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
        Scan QR to Mark Meal
      </button>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: "Attendance",
            val: `${stats.percent}%`,
            color: "#4F46E5",
            fill: stats.percent,
          },
          {
            label: "Streak 🔥",
            val: `${stats.streak} days`,
            color: "#F59E0B",
            fill: (stats.streak / 30) * 100,
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
              {s.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: s.color,
                margin: "4px 0",
              }}
            >
              {s.val}
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 3, height: 6 }}>
              <div
                style={{
                  width: `${s.fill}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: `linear-gradient(90deg,${s.color},${s.color}99)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {sub && daysLeft <= 15 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderLeft: "4px solid #F59E0B",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#1e1b4b" }}>
            {daysLeft <= 0
              ? "⚠️ Subscription expired! Renew now."
              : `Plan expires in ${daysLeft} days — Tap to renew`}
          </span>
        </div>
      )}
    </div>
  );
}
