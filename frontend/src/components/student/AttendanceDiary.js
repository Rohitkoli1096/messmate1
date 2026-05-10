import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Award,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { attendanceAPI, paymentsAPI } from "../../api";

const THEME = {
  primary: "#4F46E5",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  glass: "rgba(255, 255, 255, 0.9)",
  border: "rgba(226, 232, 240, 0.8)",
  subscribedBg: "#FFF7ED", // Light Orange / Peach background
  subscribedBorder: "#FFEDD5", // Slightly darker orange border
};

export default function AttendanceDiary() {
  const [records, setRecords] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const month = viewDate.getMonth() + 1;
  const year = viewDate.getFullYear();

  useEffect(() => {
    const fetchSync = async () => {
      setLoading(true);
      try {
        const [attRes, payRes] = await Promise.all([
          attendanceAPI.getMy(month, year),
          paymentsAPI.getMy(),
        ]);
        setRecords(attRes?.data || attRes || []);
        setSubscription(payRes?.data || payRes);
      } catch (err) {
        console.error("Sync Error", err);
      }
      setLoading(false);
    };
    fetchSync();
  }, [month, year]);

  const recordsMap = useMemo(() => {
    const map = {};
    records.forEach((rec) => {
      const dateKey = new Date(rec.date).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = {};
      map[dateKey][rec.meal_type] = rec.status;
    });
    return map;
  }, [records]);

  const isDateSubscribed = (date) => {
    if (!subscription?.created_at || !subscription?.end_date) return false;
    const start = new Date(subscription.created_at);
    const end = new Date(subscription.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  };

  return (
    <div style={styles.shell}>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={styles.header}
      >
        <div style={styles.topRow}>
          <div style={styles.brand}>
            <div style={styles.logo}>
              <Activity size={18} color="#fff" />
            </div>
            <h1 style={styles.title}>Analytics Diary</h1>
          </div>
          <div style={styles.monthSelector}>
            <button
              onClick={() => setViewDate(new Date(year, month - 2, 1))}
              style={styles.navBtn}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={styles.monthLabel}>
              {viewDate.toLocaleString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month, 1))}
              style={styles.navBtn}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={styles.hudContainer}>
          <SummaryCard
            label="Compliance"
            val={`${records.length > 0 ? Math.round((records.filter((r) => r.status === "present").length / records.length) * 100) : 0}%`}
            icon={<Activity size={12} />}
            color={THEME.primary}
          />
          <SummaryCard
            label="Verified"
            val={records.filter((r) => r.status === "present").length}
            icon={<Award size={12} />}
            color={THEME.success}
          />
          <SummaryCard
            label="Month"
            val={month}
            icon={<ArrowUpRight size={12} />}
            color={THEME.warning}
          />
        </div>
      </motion.header>

      <main style={styles.mainContent}>
        <motion.div layout style={styles.calendarCard}>
          <div style={styles.weekLabels}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <span key={d} style={styles.weekText}>
                {d}
              </span>
            ))}
          </div>

          <div style={styles.grid}>
            {Array(new Date(year, month - 1, 1).getDay())
              .fill(0)
              .map((_, i) => (
                <div key={`p-${i}`} />
              ))}
            {Array(new Date(year, month, 0).getDate())
              .fill(0)
              .map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(year, month - 1, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayData = recordsMap[dateStr] || {};

                const isToday = today.toISOString().split("T")[0] === dateStr;
                const isPastOrToday = dateObj <= today;
                const hasSubscription = isDateSubscribed(dateObj);

                return (
                  <div
                    key={day}
                    style={{
                      ...styles.dayNode,
                      ...(hasSubscription ? styles.subscribedNode : {}), // Apply light orange if subscribed
                      ...(isToday ? styles.todayNode : {}),
                    }}
                  >
                    <span style={styles.dayNum}>{day}</span>
                    <div style={styles.statusRow}>
                      {hasSubscription && (
                        <>
                          <PulseDot
                            status={dayData.lunch}
                            isPastOrToday={isPastOrToday}
                          />
                          <PulseDot
                            status={dayData.dinner}
                            isPastOrToday={isPastOrToday}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        <section style={styles.footer}>
          <div style={styles.legendTitle}>
            <Filter size={14} color={THEME.primary} />
            <span>Legend</span>
          </div>
          <div style={styles.legendGrid}>
            <LegendItem
              color={THEME.subscribedBg}
              title="Active"
              subtitle="Subscribed Day"
              border={THEME.subscribedBorder}
            />
            <LegendItem
              color={THEME.success}
              title="Verified"
              subtitle="Redeemed"
            />
            <LegendItem
              color={THEME.danger}
              title="Absent"
              subtitle="Missed Scan"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

// Sub-components
const SummaryCard = ({ label, val, icon, color }) => (
  <div style={styles.sumCard}>
    <div style={{ ...styles.sumIcon, color }}>{icon}</div>
    <div>
      <p style={styles.sumLabel}>{label}</p>
      <h3 style={{ ...styles.sumVal, color }}>{val}</h3>
    </div>
  </div>
);

const PulseDot = ({ status, isPastOrToday }) => {
  let bg = "#CBD5E1";
  if (status === "present") bg = THEME.success;
  else if (isPastOrToday) bg = THEME.danger;
  return <div style={{ ...styles.dot, backgroundColor: bg }} />;
};

const LegendItem = ({ color, title, subtitle, border }) => (
  <div style={styles.legendItem}>
    <div
      style={{
        ...styles.legendDot,
        backgroundColor: color,
        border: border ? `1px solid ${border}` : "none",
      }}
    />
    <div>
      <p style={styles.legendMain}>{title}</p>
      <p style={styles.legendSub}>{subtitle}</p>
    </div>
  </div>
);

const styles = {
  shell: {
    background: "#F1F5F9",
    minHeight: "100vh",
    fontFamily: "sans-serif",
    color: "#1E293B",
  },
  header: {
    background: THEME.glass,
    backdropFilter: "blur(10px)",
    padding: "16px",
    borderBottom: `1px solid ${THEME.border}`,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: { display: "flex", alignItems: "center", gap: 8 },
  logo: { background: THEME.primary, padding: "6px", borderRadius: "8px" },
  title: { fontSize: "16px", fontWeight: 900 },
  monthSelector: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#fff",
    padding: "4px 8px",
    borderRadius: "20px",
    border: `1px solid ${THEME.border}`,
  },
  monthLabel: {
    fontSize: "12px",
    fontWeight: 800,
    minWidth: "80px",
    textAlign: "center",
  },
  navBtn: { border: "none", background: "transparent", color: "#94A3B8" },
  hudContainer: { display: "flex", gap: 8 },
  sumCard: {
    flex: 1,
    background: "#fff",
    padding: "10px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: `1px solid ${THEME.border}`,
  },
  sumIcon: { background: "#F8FAFC", padding: "5px", borderRadius: "6px" },
  sumLabel: {
    fontSize: "8px",
    fontWeight: 800,
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  sumVal: { fontSize: "14px", fontWeight: 900 },
  mainContent: { padding: "16px" },
  calendarCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "16px",
    border: `1px solid ${THEME.border}`,
  },
  weekLabels: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: 12,
  },
  weekText: {
    textAlign: "center",
    fontSize: "10px",
    fontWeight: 900,
    color: "#94A3B8",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 },
  dayNode: {
    aspectRatio: "1/1",
    borderRadius: "10px",
    background: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "0.2s",
  },
  subscribedNode: {
    background: THEME.subscribedBg,
    border: `1px solid ${THEME.subscribedBorder}`,
  },
  todayNode: { border: `2px solid ${THEME.primary}`, background: "#EEF2FF" },
  dayNum: { fontSize: "12px", fontWeight: 800 },
  statusRow: { display: "flex", gap: "3px", marginTop: "4px" },
  dot: { width: "5px", height: "5px", borderRadius: "50%" },
  footer: { marginTop: "24px" },
  legendTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "12px",
  },
  legendGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  legendItem: { display: "flex", gap: "8px", alignItems: "center" },
  legendDot: { width: "12px", height: "12px", borderRadius: "3px" },
  legendMain: { fontSize: "11px", fontWeight: 800 },
  legendSub: { fontSize: "9px", color: "#94A3B8" },
};
