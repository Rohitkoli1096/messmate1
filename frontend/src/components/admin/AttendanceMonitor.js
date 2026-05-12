import React, { useEffect, useState } from "react";
import { attendanceAPI, subscriptionsAPI, studentsAPI } from "../../api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AttendanceMonitor() {
  // --- CORE STATE ---
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // --- EXPORT & GRID STATE ---
  const [exportStart, setExportStart] = useState(new Date().toISOString().split("T")[0]);
  const [exportEnd, setExportEnd] = useState(new Date().toISOString().split("T")[0]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [gridMonth, setGridMonth] = useState(new Date().getMonth() + 1);
  const [gridYear, setGridYear] = useState(new Date().getFullYear());

  const load = (d) => {
    setLoading(true);
    attendanceAPI.getDaily(d)
      .then((r) => setRecords(Array.isArray(r) ? r : (r?.data || [])))
      .catch(() => toast.error("Error: Could not sync attendance data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(date); }, [date]);

  // --- PDF GENERATOR: MONTHLY ATTENDANCE MATRIX ---
  const handleMonthlyGridExport = async () => {
    setIsExporting(true);
    try {
      const daysInMonth = new Date(gridYear, gridMonth, 0).getDate();
      const startStr = `${gridYear}-${String(gridMonth).padStart(2, '0')}-01`;
      const endStr = `${gridYear}-${String(gridMonth).padStart(2, '0')}-${daysInMonth}`;

      const [stuRes, attRes, subRes] = await Promise.all([
        studentsAPI.getAll(),
        attendanceAPI.getDaily(startStr, endStr),
        subscriptionsAPI.getAll()
      ]);

      const allStudents = Array.isArray(stuRes) ? stuRes : (stuRes?.data || []);
      const allAttendance = Array.isArray(attRes) ? attRes : (attRes?.data || []);
      const allSubs = Array.isArray(subRes) ? subRes : (subRes?.data || []);

      const doc = new jsPDF('l', 'mm', 'a3'); 
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(`MessMate: Master Attendance Matrix`, 14, 15);
      doc.setFontSize(11);
      doc.text(`Period: ${new Date(gridYear, gridMonth - 1).toLocaleString('default', { month: 'long' })} ${gridYear}`, 14, 22);

      const headers = ["Student Name", ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString())];

      const tableRows = allStudents.map(student => {
        const row = [student.name];
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDayStr = `${gridYear}-${String(gridMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          const isSubscribed = allSubs.some(s => {
            if (s.username !== student.username) return false;
            const start = new Date(s.startDate || s.start_date).toISOString().split('T')[0];
            const end = new Date(s.endDate || s.end_date).toISOString().split('T')[0];
            return currentDayStr >= start && currentDayStr <= end;
          });

          if (!isSubscribed) {
            row.push("-");
          } else {
            const attended = allAttendance.find(a => a.username === student.username && a.date === currentDayStr);
            row.push(attended ? "P" : "A"); // Using P/A for maximum PDF compatibility
          }
        }
        return row;
      });

      autoTable(doc, {
        head: [headers],
        body: tableRows,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 8, halign: 'center', cellPadding: 1.2 },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 } },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index !== 0) {
            if (data.cell.raw === "P") data.cell.styles.textColor = [22, 163, 74];
            if (data.cell.raw === "A") data.cell.styles.textColor = [220, 38, 38];
          }
        }
      });

      doc.save(`MessMate_Grid_${gridMonth}_${gridYear}.pdf`);
      toast.success("Monthly Matrix Generated");
    } catch (err) {
      toast.error("Failed to compile monthly data");
    } finally {
      setIsExporting(false);
    }
  };

  // --- PDF GENERATOR: STUDENT INDIVIDUAL AUDIT ---
  const handleStudentAudit = async () => {
    if (!selectedStudent) return toast.error("Please select a student");
    setIsExporting(true);
    try {
      const attRes = await attendanceAPI.getDaily(exportStart, exportEnd);
      const allAtt = Array.isArray(attRes) ? attRes : (attRes?.data || []);
      const studentData = allAtt.filter(a => a.username === selectedStudent);

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`MessMate Attendance Audit`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Student: ${selectedStudent} | Range: ${exportStart} to ${exportEnd}`, 14, 28);
      
      autoTable(doc, {
        head: [["Date", "Lunch", "Dinner", "Last Scan Time"]],
        body: studentData.map(r => [
          r.date, 
          r.lunch === 'present' ? 'PRESENT' : 'ABSENT',
          r.dinner === 'present' ? 'PRESENT' : 'ABSENT',
          r.last_scan ? new Date(r.last_scan).toLocaleTimeString() : '-'
        ]),
        startY: 35,
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`MessMate_Audit_${selectedStudent}.pdf`);
      toast.success("Individual Audit Ready");
    } catch (err) {
      toast.error("Export Error");
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = records.filter(r => 
    r.name?.toLowerCase().includes(filter.toLowerCase()) || 
    r.username?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      
      {/* STATS SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "25px" }}>
        <div className="stat-card" style={{ borderLeft: "5px solid #6366f1" }}>
          <div className="stat-val">{records.length}</div>
          <div className="stat-lbl">Daily Capacity</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "5px solid #22c55e" }}>
          <div className="stat-val">{records.filter(r => r.lunch === 'present').length}</div>
          <div className="stat-lbl">Lunch Served</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "5px solid #f59e0b" }}>
          <div className="stat-val">{records.filter(r => r.dinner === 'present').length}</div>
          <div className="stat-lbl">Dinner Served</div>
        </div>
      </div>

      {/* EXPORT CONTROL CENTER */}
      <div className="card" style={{ marginBottom: "25px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: "1.2rem", color: "#1e293b" }}>📊 MessMate Analytics & Reports</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "25px" }}>
          
          {/* Box 1: Monthly Matrix */}
          <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <h4 style={{ margin: "0 0 8px 0" }}>Master Monthly Matrix</h4>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "15px" }}>Generate a full 1-31 grid for all registered students.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <select value={gridMonth} onChange={(e) => setGridMonth(parseInt(e.target.value))} style={{ flex: 1 }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <input type="number" value={gridYear} onChange={(e) => setGridYear(parseInt(e.target.value))} style={{ width: "100px" }} />
              <button className="btn-primary" onClick={handleMonthlyGridExport} disabled={isExporting} style={{ background: "#334155" }}>
                Export Grid
              </button>
            </div>
          </div>

          {/* Box 2: Specific Audit */}
          <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <h4 style={{ margin: "0 0 8px 0" }}>Individual Student Audit</h4>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "15px" }}>History for a specific student across a custom date range.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Select Student...</option>
                {records.map(r => <option key={r.username} value={r.username}>{r.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)} style={{ flex: 1 }} />
                <input type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)} style={{ flex: 1 }} />
                <button className="btn-primary" onClick={handleStudentAudit} disabled={isExporting}>
                  Generate
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* LIVE VIEW TABLE */}
      <div className="card">
        <div style={{ display: "flex", gap: "15px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: "bold", color: "#475569" }}>Monitor Logs:</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "160px" }} />
          <input 
            style={{ flex: 1, minWidth: "250px" }} 
            placeholder="Search name or ID..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
          />
          <button className="btn-primary" onClick={() => load(date)}>Sync Database</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Syncing MessMate records...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Username</th>
                  <th>Lunch</th>
                  <th>Dinner</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{r.name}</td>
                    <td style={{ color: "#64748b" }}>{r.username}</td>
                    <td><span className={`badge ${r.lunch === 'present' ? 'badge-green' : 'badge-red'}`}>{r.lunch}</span></td>
                    <td><span className={`badge ${r.dinner === 'present' ? 'badge-green' : 'badge-red'}`}>{r.dinner || 'absent'}</span></td>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>{r.last_scan ? new Date(r.last_scan).toLocaleTimeString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}