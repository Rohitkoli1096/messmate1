import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import StudentDashboard from "../components/student/StudentDashboard";
import AttendanceDiary from "../components/student/AttendanceDiary";
import QRScanner from "../components/student/QRScanner";
import PaymentScreen from "../components/student/PaymentScreen";
import NotificationsScreen from "../components/student/NotificationsScreen";
import ProfileScreen from "../components/student/ProfileScreen";

const navItems = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10L12 3L21 10V21H3V10Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "diary",
    label: "Diary",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="4"
          width="18"
          height="18"
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
      </svg>
    ),
  },
  {
    id: "scan",
    label: "Scan",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="4"
          y="4"
          width="6"
          height="6"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="4"
          width="6"
          height="6"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="4"
          y="14"
          width="6"
          height="6"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="14"
          width="6"
          height="6"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "payment",
    label: "Payment",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="2"
          y1="10"
          x2="22"
          y2="10"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M4 20C4 16 8 14 12 14C16 14 20 16 20 20"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
];

export default function StudentLayout() {
  const [active, setActive] = useState("home");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const panels = {
    home: <StudentDashboard onScan={() => setActive("scan")} />,
    diary: <AttendanceDiary />,
    scan: <QRScanner />,
    payment: <PaymentScreen />,
    notifications: <NotificationsScreen />,
    profile: (
      <ProfileScreen
        onLogout={() => {
          logout();
          navigate("/login");
        }}
      />
    ),
  };

  // Mobile-first layout
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F0F0FF",
        position: "relative",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "#fff",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🍛</span>
          <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 16 }}>
            Mess<span style={{ color: "#8B5CF6" }}>Mate</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => setActive("notifications")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8C18 5.79 16.21 4 14 4H10C7.79 4 6 5.79 6 8V12C6 13.1 5.1 14 4 14H20C18.9 14 18 13.1 18 12V8Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M9 18C9 19.66 10.34 21 12 21C13.66 21 15 19.66 15 18"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 72 }}>
        {panels[active] || panels["home"]}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          zIndex: 100,
        }}
      >
        {navItems.map((n) => (
          <button
            key={n.id}
            onClick={() => setActive(n.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: active === n.id ? "#4F46E5" : "#9ca3af",
                marginTop: 2,
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              {n.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
