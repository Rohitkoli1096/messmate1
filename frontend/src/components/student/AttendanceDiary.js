import React, { useEffect, useState } from "react";
import { attendanceAPI } from "../../api";

export default function AttendanceDiary() {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    attendanceAPI.getMy(month, year).then((r) => setRecords(r.data || []));
  }, [month, year]);

  // --- NEW CALCULATIONS ---
  // We filter to find unique "present" days (if either lunch OR dinner is present)
  const presentDays = [
    ...new Set(
      records
        .filter((r) => r.status === "present")
        .map((r) => r.date?.split("T")[0]),
    ),
  ].length;

  // We filter to find unique "absent" days
  const absentDays = [
    ...new Set(
      records
        .filter((r) => r.status === "absent")
        .map((r) => r.date?.split("T")[0]),
    ),
  ].length;
  // ------------------------

  const getStatus = (day, meal) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const rec = records.find(
      (r) => r.date?.startsWith(dateStr) && r.meal_type === meal,
    );
    return rec?.status || null;
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = new Date();

  const monthName = new Date(year, month - 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#4F46E5,#8B5CF6)",
          borderRadius: 20,
          padding: "16px 20px",
          marginBottom: 14,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Attendance Diary</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{monthName}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={prevMonth} style={navBtnStyle}>
            ‹
          </button>
          <button onClick={nextMonth} style={navBtnStyle}>
            ›
          </button>
        </div>
      </div>

      {/* NEW SUMMARY SECTION */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={statCardStyle("#DCFCE7", "#16A34A")}>
          <div style={{ fontSize: 11, fontWeight: 600 }}>TOTAL PRESENT</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {presentDays} Days
          </div>
        </div>
        <div style={statCardStyle("#FEE2E2", "#DC2626")}>
          <div style={{ fontSize: 11, fontWeight: 600 }}>TOTAL ABSENT</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{absentDays} Days</div>
        </div>
      </div>

      {/* Calendar Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 12,
          marginBottom: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 4,
            marginBottom: 8,
          }}
        >
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#9ca3af",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 4,
          }}
        >
          {Array(firstDay)
            .fill(null)
            .map((_, i) => (
              <div key={`e${i}`} />
            ))}
          {Array(daysInMonth)
            .fill(null)
            .map((_, i) => {
              const day = i + 1;
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() + 1 &&
                year === today.getFullYear();
              const lunch = getStatus(day, "lunch");
              const dinner = getStatus(day, "dinner");
              return (
                <div
                  key={day}
                  style={{
                    background: "#f8f7ff",
                    borderRadius: 10,
                    padding: "6px 4px",
                    textAlign: "center",
                    minHeight: 52,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 3,
                      ...(isToday ? todayCircleStyle : {}),
                    }}
                  >
                    {day}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <Dot
                      color={
                        lunch === "present"
                          ? "#22C55E"
                          : lunch === "absent"
                            ? "#EF4444"
                            : "#e5e7eb"
                      }
                    />
                    <Dot
                      color={
                        dinner === "present"
                          ? "#22C55E"
                          : dinner === "absent"
                            ? "#EF4444"
                            : "#e5e7eb"
                      }
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Legend Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          Legend
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <LegendItem color="#22C55E" label="Present" />
          <LegendItem color="#EF4444" label="Absent" />
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            Left = Lunch · Right = Dinner
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES & SUB-COMPONENTS ---
const navBtnStyle = {
  background: "rgba(255,255,255,.2)",
  border: "none",
  color: "#fff",
  width: 30,
  height: 30,
  borderRadius: 8,
  cursor: "pointer",
};

const statCardStyle = (bg, color) => ({
  flex: 1,
  background: bg,
  color: color,
  padding: "12px 16px",
  borderRadius: 16,
  textAlign: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
});

const todayCircleStyle = {
  background: "#4F46E5",
  color: "#fff",
  borderRadius: "50%",
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 3px",
};

const Dot = ({ color }) => (
  <span
    style={{
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: color,
      display: "inline-block",
    }}
  />
);

const LegendItem = ({ color, label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: 12,
      color: "#6b7280",
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
      }}
    />
    {label}
  </div>
);
