import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Utensils,
  CreditCard,
  Zap,
  Clock,
  Inbox,
  Sparkles,
  ChevronRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { notificationsAPI } from "../../api";
import toast from "react-hot-toast";

const NotificationSkeleton = () => (
  <div style={styles.skeletonCard}>
    <div style={styles.skeletonIcon} />
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ ...styles.skeletonLine, width: "30%" }} />
        <div style={{ ...styles.skeletonLine, width: "15%" }} />
      </div>
      <div style={{ ...styles.skeletonLine, width: "80%", marginTop: 8 }} />
    </div>
  </div>
);

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const r = await notificationsAPI.getMy();
      const actualData = Array.isArray(r) ? r : r.data || [];
      setNotifs(actualData);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to sync notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markReadAll = async () => {
    if (notifs.every((n) => n.is_read)) return;

    try {
      await notificationsAPI.markRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      toast.success("Inbox cleared");
    } catch (err) {
      toast.error("Could not update status");
    }
  };

  const categories = ["ALL", "MEAL", "PAYMENT", "INFO"];

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return notifs;
    return notifs.filter((n) => (n.type || "info").toUpperCase() === activeTab);
  }, [notifs, activeTab]);

  const iconMap = {
    plan: {
      icon: <Zap size={16} />,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    },
    payment: {
      icon: <CreditCard size={16} />,
      gradient: "linear-gradient(135deg, #6366F1, #4338CA)",
    },
    attendance: {
      icon: <Sparkles size={16} />,
      gradient: "linear-gradient(135deg, #06B6D4, #0891B2)",
    },
    meal: {
      icon: <Utensils size={16} />,
      gradient: "linear-gradient(135deg, #10B981, #059669)",
    },
    info: {
      icon: <Bell size={16} />,
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
    },
    system: {
      icon: <Activity size={16} />,
      gradient: "linear-gradient(135deg, #64748B, #475569)",
    },
  };

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.statusGroup}>
          <div style={styles.pulseContainer}>
            <div style={styles.pulseDot} />
            <span style={styles.statusText}>SYSTEM_LIVE</span>
          </div>
          <h1 style={styles.title}>Alert Feed</h1>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <motion.button
            whileTap={{ rotate: 180 }}
            onClick={() => loadData(true)}
            style={styles.iconBtn}
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={markReadAll}
            style={styles.clearBtn}
          >
            <CheckCheck size={14} />
            ACK_ALL
          </motion.button>
        </div>
      </header>

      <nav style={styles.nav}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              ...styles.navItem,
              color: activeTab === cat ? "#0F172A" : "#94A3B8",
              fontWeight: activeTab === cat ? "800" : "600",
            }}
          >
            {cat}
            {activeTab === cat && (
              <motion.div layoutId="underline" style={styles.navUnderline} />
            )}
          </button>
        ))}
      </nav>

      <div style={styles.content}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[1, 2, 3, 4].map((i) => (
                <NotificationSkeleton key={i} />
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.emptyState}
            >
              <div style={styles.emptyCircle}>
                <Inbox size={32} color="#CBD5E1" />
              </div>
              <p style={styles.emptyTitle}>ALL_CLEAR</p>
              <p style={styles.emptySub}>No active alerts in {activeTab}.</p>
            </motion.div>
          ) : (
            <LayoutGroup>
              <motion.div layout style={styles.list}>
                {filtered.map((n) => {
                  const theme = iconMap[n.type?.toLowerCase()] || iconMap.info;
                  const isNew = !n.is_read;

                  return (
                    <motion.div
                      layout
                      key={n.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -2 }}
                      style={{
                        ...styles.card,
                        background: isNew ? "#FFFFFF" : "#F1F5F9",
                        border: isNew
                          ? "1px solid #E2E8F0"
                          : "1px solid transparent",
                        opacity: isNew ? 1 : 0.8,
                      }}
                    >
                      <div
                        style={{
                          ...styles.categoryBadge,
                          background: theme.gradient,
                        }}
                      >
                        {theme.icon}
                      </div>

                      <div style={styles.cardBody}>
                        <div style={styles.cardTop}>
                          <span
                            style={{
                              ...styles.categoryLabel,
                              color: isNew ? "#6366F1" : "#94A3B8",
                            }}
                          >
                            {n.type?.toUpperCase() || "GENERAL"}
                          </span>
                          <span style={styles.timestamp}>
                            <Clock size={10} style={{ marginRight: 4 }} />
                            {n.date || "Just now"}
                          </span>
                        </div>
                        <h4
                          style={{
                            ...styles.cardTitle,
                            color: isNew ? "#0F172A" : "#64748B",
                          }}
                        >
                          {n.title}
                        </h4>
                        <p style={styles.message}>{n.message}</p>
                      </div>

                      <div style={styles.actionArea}>
                        {isNew && (
                          <motion.div
                            layoutId={`dot-${n.id}`}
                            style={styles.newIndicator}
                          />
                        )}
                        <ChevronRight size={18} color="#CBD5E1" />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </LayoutGroup>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    padding: "24px",
    background: "#F8FAFC",
    minHeight: "100vh",
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  statusGroup: { display: "flex", flexDirection: "column", gap: 4 },
  pulseContainer: { display: "flex", alignItems: "center", gap: 6 },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10B981",
    boxShadow: "0 0 8px #10B981",
  },
  statusText: {
    fontSize: 9,
    fontWeight: 900,
    color: "#64748B",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  iconBtn: {
    background: "white",
    border: "1px solid #E2E8F0",
    padding: 10,
    borderRadius: 12,
    cursor: "pointer",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#0F172A",
    color: "#FFF",
    border: "none",
    padding: "10px 16px",
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 800,
    cursor: "pointer",
  },
  nav: {
    display: "flex",
    gap: 24,
    borderBottom: "1px solid #E2E8F0",
    marginBottom: 24,
  },
  navItem: {
    padding: "12px 0",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 12,
    position: "relative",
    transition: "color 0.2s",
  },
  navUnderline: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    background: "#0F172A",
  },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    display: "flex",
    padding: "18px",
    borderRadius: 20,
    gap: 16,
    alignItems: "center",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    cursor: "pointer",
  },
  categoryBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryLabel: { fontSize: 9, fontWeight: 900, letterSpacing: 0.5 },
  timestamp: {
    fontSize: 10,
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 800,
    margin: "0 0 4px 0",
    lineHeight: 1.2,
  },
  message: {
    fontSize: 12,
    color: "#64748B",
    margin: 0,
    lineHeight: 1.5,
    fontWeight: 500,
  },
  actionArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#6366F1",
    boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)",
  },
  emptyState: { textAlign: "center", padding: "80px 0" },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0F172A",
    margin: 0,
    letterSpacing: 1,
  },
  emptySub: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  skeletonCard: {
    display: "flex",
    gap: 16,
    padding: 16,
    background: "#FFF",
    borderRadius: 20,
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#F1F5F9",
  },
  skeletonLine: { height: 12, background: "#F1F5F9", borderRadius: 4 },
};
