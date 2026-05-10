import React, { useEffect, useState } from "react";
import { attendanceAPI } from "../../api";
import toast from "react-hot-toast";

export default function AttendanceMonitor() {
  // Initialize with an empty array to prevent .filter/ .length errors
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (d) => {
    setLoading(true);
    attendanceAPI
      .getDaily(d)
      .then((r) => {
        // SMART FIX: Handle both unwrapped data and the old .data format
        const data = Array.isArray(r) ? r : (r?.data || []);
        setRecords(data);
      })
      .catch((err) => {
        console.error("Attendance load error:", err);
        toast.error("Failed to load attendance");
        setRecords([]); // Reset to empty array on error to prevent crash
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(date);
  }, [date]);

  // Use optional chaining and fallback to ensure 'records' is never null
  const filtered = (records || []).filter((r) =>
    r?.name?.toLowerCase().includes(filter.toLowerCase()),
  );

  const present = (records || []).filter((r) => r.lunch === "present").length;
  const absent = (records || []).filter((r) => !r.lunch || r.lunch === "absent").length;

  return (
    <div>
      <div
        className="stat-grid"
        style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}
      >
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-val" style={{ color: "#4F46E5" }}>
            {records?.length || 0}
          </div>
          <div className="stat-lbl">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-val" style={{ color: "#22C55E" }}>
            {present}
          </div>
          <div className="stat-lbl">Lunch Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-val" style={{ color: "#EF4444" }}>
            {absent}
          </div>
          <div className="stat-lbl">Lunch Absent</div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div className="form-group" style={{ flex: "0 0 auto" }}>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: 180 }}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Search Student</label>
            <input
              placeholder="Filter by name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="btn-primary" onClick={() => load(date)}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>
            Loading attendance records...
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Username</th>
                <th>🍛 Lunch (11–2 PM)</th>
                <th>🌙 Dinner (7–10 PM)</th>
                <th>Last Scan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id || i}>
                  <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td style={{ color: "#6b7280" }}>{r.username}</td>
                  <td>
                    <span
                      className={`badge ${r.lunch === "present" ? "badge-green" : "badge-red"}`}
                    >
                      {r.lunch === "present" ? "Present" : "Absent"}
                    </span>
                  </td>
                  <td>
                    {r.dinner ? (
                      <span
                        className={`badge ${r.dinner === "present" ? "badge-green" : "badge-red"}`}
                      >
                        {r.dinner === "present" ? "Present" : "Absent"}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>
                    {r.last_scan
                      ? new Date(r.last_scan).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 20, color: "#9ca3af" }}>
                    No records found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}