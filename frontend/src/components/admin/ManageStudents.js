import React, { useEffect, useState } from "react";
import { studentsAPI } from "../../api";
import toast from "react-hot-toast";

const EMPTY = { name: "", username: "", password: "", phone: "", room: "" };

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    studentsAPI
      .getAll()
      .then((r) => {
        const data = Array.isArray(r) ? r : r?.data || [];
        setStudents(data);
      })
      .catch((err) => {
        console.error("Load error:", err);
        toast.error("Failed to load students");
        setStudents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading(
      editing ? "Updating student..." : "Adding student...",
    );
    try {
      if (editing) {
        await studentsAPI.update(editing, form);
        toast.success("Student updated!", { id: tid });
      } else {
        await studentsAPI.create(form);
        toast.success("Student added!", { id: tid });
      }
      setForm(EMPTY);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving student", {
        id: tid,
      });
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${name}? This will also remove all their attendance and payment history.`,
      )
    )
      return;

    const tid = toast.loading("Deleting student...");
    try {
      await studentsAPI.delete(id);
      toast.success("Student deleted successfully", { id: tid });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed", { id: tid });
    }
  };

  const filtered = (students || []).filter(
    (s) =>
      s?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s?.username?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "10px" }}>
      {/* 1. TOP STATS WITH LEFT BORDER SHEDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            borderLeft: "6px solid #4F46E5",
            padding: "24px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Total Registry
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}
          >
            {students.length}
          </div>
          <div
            style={{ fontSize: "12px", color: "#4F46E5", fontWeight: "600" }}
          >
            Total Students Onboarded
          </div>
        </div>
        <div
          style={{
            borderLeft: "6px solid #10B981",
            padding: "24px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Active Members
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "800", color: "#065f46" }}
          >
            {students.filter((s) => s.payment_status === "paid").length}
          </div>
          <div
            style={{ fontSize: "12px", color: "#10B981", fontWeight: "600" }}
          >
            Fully Paid Status
          </div>
        </div>
        <div
          style={{
            borderLeft: "6px solid #EF4444",
            padding: "24px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Room Occupancy
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "800", color: "#991b1b" }}
          >
            {new Set(students.map((s) => s.room).filter(Boolean)).size}
          </div>
          <div
            style={{ fontSize: "12px", color: "#EF4444", fontWeight: "600" }}
          >
            Unique Rooms Assigned
          </div>
        </div>
      </div>

      {/* 2. REGISTRATION FORM CARD */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: "24px",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            marginBottom: 20,
            fontSize: 18,
            fontWeight: 800,
            color: "#1e1b4b",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {editing ? "✏️ Update Member Profile" : "👤 Register New Student"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 12,
            }}
          >
            {[
              {
                key: "name",
                label: "Full Name",
                placeholder: "e.g. Rohit Koli",
              },
              {
                key: "username",
                label: "Username/ID",
                placeholder: "e.g. rohit.k",
              },
              {
                key: "password",
                label: "Password",
                placeholder: editing ? "(Hidden)" : "Set password",
                type: "password",
              },
              {
                key: "phone",
                label: "Contact No",
                placeholder: "e.g. 7020572471",
              },
              { key: "room", label: "Room No", placeholder: "e.g. A-204" },
            ].map((f) => (
              <div
                key={f.key}
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  {f.label}
                </label>
                <input
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    fontSize: "14px",
                    transition: "0.2s",
                  }}
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  required={!editing && f.key !== "phone" && f.key !== "room"}
                />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  background: "#4F46E5",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {editing ? "Save Changes" : "Create Account"}
              </button>
              {editing && (
                <button
                  type="button"
                  style={{
                    padding: "12px 18px",
                    borderRadius: "10px",
                    background: "#f1f5f9",
                    border: "none",
                    fontWeight: "700",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setEditing(null);
                    setForm(EMPTY);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 3. LISTING CARD */}
      <div
        className="card"
        style={{
          padding: "24px",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#1e1b4b",
              margin: 0,
            }}
          >
            📋 Student Directory{" "}
            <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 14 }}>
              ({filtered.length} found)
            </span>
          </h3>
          <div style={{ position: "relative", width: "300px" }}>
            <input
              style={{
                width: "100%",
                padding: "10px 14px 10px 35px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                outline: "none",
              }}
              placeholder="Filter by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span
              style={{
                position: "absolute",
                left: 12,
                top: 10,
                color: "#94a3b8",
              }}
            >
              🔍
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            Loading student records...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th
                    style={{
                      padding: "14px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Member
                  </th>
                  <th
                    style={{
                      padding: "14px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Location
                  </th>
                  <th
                    style={{
                      padding: "14px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Active Plan
                  </th>
                  <th
                    style={{
                      padding: "14px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Expiration
                  </th>
                  <th
                    style={{
                      padding: "14px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Finance
                  </th>
                  <th
                    style={{
                      padding: "14px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Management
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: "16px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "10px",
                            background: "#f1f5f9",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: "800",
                            color: "#4F46E5",
                          }}
                        >
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#1e293b",
                              fontSize: "14px",
                            }}
                          >
                            {s.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                            @{s.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 14px" }}>
                      <span style={{ color: "#475569", fontWeight: 600 }}>
                        Room: {s.room || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 14px" }}>
                      <span
                        style={{
                          background: "#EEF2FF",
                          color: "#4F46E5",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "800",
                        }}
                      >
                        {s.plan_type ? s.plan_type.toUpperCase() : "NO PLAN"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "16px 14px",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      {s.end_date
                        ? new Date(s.end_date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td style={{ padding: "16px 14px" }}>
                      {s.payment_status ? (
                        <span
                          style={{
                            padding: "5px 12px",
                            borderRadius: "99px",
                            fontSize: "11px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            backgroundColor:
                              s.payment_status === "paid"
                                ? "#dcfce7"
                                : s.payment_status === "partial"
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              s.payment_status === "paid"
                                ? "#166534"
                                : s.payment_status === "partial"
                                  ? "#92400e"
                                  : "#991b1b",
                          }}
                        >
                          {s.payment_status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "16px 14px" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => {
                            setEditing(s.id);
                            setForm({
                              name: s.name,
                              username: s.username,
                              password: "",
                              phone: s.phone || "",
                              room: s.room || "",
                            });
                          }}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            color: "#64748b",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          style={{
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            color: "#e11d48",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
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
