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
      .then((r) => setStudents(r.data))
      .catch(() => toast.error("Failed to load students"))
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
    // 1. Confirm before action
    if (
      !window.confirm(
        `Are you sure you want to delete ${name}? This will also remove all their attendance and payment history.`,
      )
    )
      return;

    const tid = toast.loading("Deleting student...");
    try {
      // 2. Call the updated backend delete route
      await studentsAPI.delete(id);

      // 3. Update UI
      toast.success("Student deleted successfully", { id: tid });
      load(); // Reload the list to show current data
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(
        err.response?.data?.message ||
          "Delete failed: Database constraint issue",
        { id: tid },
      );
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ padding: "20px" }}>
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: "20px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        <h3
          style={{
            marginBottom: 14,
            fontSize: 16,
            fontWeight: 700,
            color: "#1e1b4b",
          }}
        >
          {editing ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Edit (Pen) Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M14.06 6.19L17.81 9.94"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Edit Student
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Add (Plus) Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line
                  x1="12"
                  y1="5"
                  x2="12"
                  y2="19"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Add New Student
            </span>
          )}
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
                label: "Username",
                placeholder: "e.g. rohit.k",
              },
              {
                key: "password",
                label: "Password",
                placeholder: editing
                  ? "(leave blank to keep current)"
                  : "Set password",
                type: "password",
              },
              {
                key: "phone",
                label: "Phone Number",
                placeholder: "e.g. 7020572471",
              },
              { key: "room", label: "Room Number", placeholder: "e.g. A-204" },
            ].map((f) => (
              <div
                key={f.key}
                className="form-group"
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#4b5563",
                  }}
                >
                  {f.label}
                </label>
                <input
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
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
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {editing ? "Update Student" : "Register Student"}
              </button>
              {editing && (
                <button
                  type="button"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#f3f4f6",
                    border: "none",
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

      <div
        className="card"
        style={{
          padding: "20px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>
            👥 All Students ({filtered.length})
          </h3>
          <input
            style={{
              width: 250,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
            placeholder="Search name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>
            🔍 Loading student records...
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #f3f4f6",
                  }}
                >
                  <th style={{ padding: "12px" }}>Name</th>
                  <th style={{ padding: "12px" }}>Username</th>
                  <th style={{ padding: "12px" }}>Room</th>
                  <th style={{ padding: "12px" }}>Plan Details</th>
                  <th style={{ padding: "12px" }}>Expiry</th>
                  <th style={{ padding: "12px" }}>Payment</th>
                  <th style={{ padding: "12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px", fontWeight: 600 }}>
                      {s.name}
                    </td>
                    <td style={{ padding: "12px", color: "#6b7280" }}>
                      {s.username}
                    </td>
                    <td style={{ padding: "12px" }}>{s.room || "N/A"}</td>
                    <td style={{ padding: "12px", fontSize: "13px" }}>
                      {s.plan_type
                        ? `${s.plan_type.toUpperCase()} (${s.duration})`
                        : "No Active Plan"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {s.end_date
                        ? new Date(s.end_date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {s.payment_status ? (
                        <span
                          className={`badge badge-${s.payment_status}`}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            backgroundColor:
                              s.payment_status === "paid"
                                ? "#dcfce7"
                                : s.payment_status === "partial"
                                  ? "#fef9c3"
                                  : "#fee2e2",
                            color:
                              s.payment_status === "paid"
                                ? "#166534"
                                : s.payment_status === "partial"
                                  ? "#854d0e"
                                  : "#991b1b",
                          }}
                        >
                          {s.payment_status.toUpperCase()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
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
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "#eef2ff",
                            color: "#4F46E5",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 600,
                            transition: "0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#e0e7ff")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = "#eef2ff")
                          }
                        >
                          {/* Pen / Edit Icon */}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M14.06 6.19L17.81 9.94"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "#fee2e2",
                            color: "#EF4444",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 600,
                            transition: "0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#fecaca")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = "#fee2e2")
                          }
                        >
                          {/* Trash Icon */}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M3 6H21"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M8 6V4H16V6"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <rect
                              x="6"
                              y="6"
                              width="12"
                              height="14"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <line
                              x1="10"
                              y1="10"
                              x2="10"
                              y2="16"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <line
                              x1="14"
                              y1="10"
                              x2="14"
                              y2="16"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                          Delete
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
