import React, { useEffect, useState } from "react";
import { notificationsAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsAPI
      .getMy()
      .then((r) => setNotifs(r.data))
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, []);

  const markRead = () => {
    notificationsAPI.markRead().then(() => {
      setNotifs((n) => n.map((x) => ({ ...x, is_read: 1 })));
    });
  };

  // --- UPDATED ICON MAP TO INCLUDE MEAL ---
  const iconMap = {
    plan: { icon: "⚠️", bg: "#fef3c7" },
    payment: { icon: "💳", bg: "#dbeafe" },
    attendance: { icon: "🍛", bg: "#cffafe" },
    system: { icon: "🔔", bg: "#ede9fe" },
    meal: { icon: "🍔", bg: "#dcfce7" }, // Added Green theme for Meals
  };

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>
          🔔 Notifications
        </h2>
        <button
          onClick={markRead}
          style={{
            fontSize: 12,
            color: "#4F46E5",
            background: "none",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Mark all read
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
          Loading...
        </p>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifs.map((n) => {
            const config = iconMap[n.type] || iconMap.system;
            const isMeal = n.type === "meal";

            return (
              <div
                key={n.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                  opacity: n.is_read ? 0.7 : 1,
                  borderLeft: n.is_read ? "none" : "4px solid #4F46E5",
                  position: "relative",
                  // Highlight meal notifications slightly
                  border: isMeal && !n.is_read ? "1px solid #22C55E" : "none",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: config.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1e1b4b",
                      }}
                    >
                      {n.title}
                    </div>
                    {!n.is_read && isMeal && (
                      <span
                        style={{
                          fontSize: 9,
                          background: "#22C55E",
                          color: "#fff",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 800,
                        }}
                      >
                        NEW MENU
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    {n.message}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#d1d5db",
                      marginTop: 6,
                      fontWeight: 500,
                    }}
                  >
                    {new Date(n.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
  
}
