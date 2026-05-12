import React, { useEffect, useState } from "react";
import { paymentsAPI } from "../../api";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5001";

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editAmt, setEditAmt] = useState("");

  const load = () => {
    setLoading(true);
    paymentsAPI
      .getAll()
      .then((r) => {
        const data = Array.isArray(r) ? r : r?.data || [];
        setPayments(data);
      })
      .catch((err) => {
        console.error("Payment load error:", err);
        toast.error("Failed to load payments");
        setPayments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (id) => {
    try {
      await paymentsAPI.update(id, { paid_amount: parseFloat(editAmt) });
      toast.success("Payment updated!");
      setEditId(null);
      load();
    } catch {
      toast.error("Update failed");
    }
  };

  const safePayments = Array.isArray(payments) ? payments : [];

  const totalCollected = safePayments.reduce(
    (s, p) => s + Number(p.paid_amount || 0),
    0,
  );
  const totalPending = safePayments.reduce(
    (s, p) => s + (Number(p.total_amount || 0) - Number(p.paid_amount || 0)),
    0,
  );

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "10px" }}>
      {/* PROFESSIONAL STATS HEADER (Left Border Sheds) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "30px",
        }}
      >
        {/* Total Collected Card */}
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            borderLeft: "6px solid #22C55E", // Green Shed
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Total Collected
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "800", color: "#166534" }}
          >
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
          <div
            style={{ fontSize: "12px", color: "#22C55E", fontWeight: "600" }}
          >
            Verified Revenue
          </div>
        </div>

        {/* Pending Amount Card */}
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            borderLeft: "6px solid #F59E0B", // Orange Shed
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Pending Amount
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "800", color: "#92400e" }}
          >
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <div
            style={{ fontSize: "12px", color: "#F59E0B", fontWeight: "600" }}
          >
            Outstanding Balance
          </div>
        </div>

        {/* Total Records Card */}
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            borderLeft: "6px solid #4F46E5", // Purple/Indigo Shed
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Total Records
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "800", color: "#1e1b4b" }}
          >
            {safePayments.length}
          </div>
          <div
            style={{ fontSize: "12px", color: "#4F46E5", fontWeight: "600" }}
          >
            Payment Entries
          </div>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div
        className="card"
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            marginBottom: 20,
            fontSize: 18,
            fontWeight: 800,
            color: "#1e1b4b",
          }}
        >
          💰 Financial Ledger
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <p>Syncing Financial Data...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Student
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}

                    
                  >
                    Plan
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Paid
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Due
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Receipt
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {safePayments.map((p) => {
                  const remaining =
                    Number(p.total_amount || 0) - Number(p.paid_amount || 0);
                  const imageUrl = p.screenshot_url
                    ? `${API_BASE_URL}/${p.screenshot_url}`
                    : null;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "all 0.2s",
                      }}
                      className="table-row-hover"
                    >
                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 700,
                          color: "#1e293b",
                        }}
                      >
                        {p.name}
                      </td>
                      <td style={{ padding: "16px" }}>
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
                          {p.plan_type?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "#64748b" }}>
                        ₹{Number(p.total_amount).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: "#16a34a",
                          fontWeight: 800,
                        }}
                      >
                        ₹{Number(p.paid_amount).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: remaining > 0 ? "#dc2626" : "#16a34a",
                          fontWeight: 800,
                        }}
                      >
                        ₹{remaining.toLocaleString()}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "99px",
                            fontSize: "10px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            background:
                              p.status === "paid"
                                ? "#dcfce7"
                                : p.status === "partial"
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              p.status === "paid"
                                ? "#16a34a"
                                : p.status === "partial"
                                  ? "#d97706"
                                  : "#dc2626",
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        {imageUrl ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt="Receipt"
                              style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "6px",
                                objectFit: "cover",
                                border: "1px solid #e2e8f0",
                              }}
                            />
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#4F46E5",
                                fontSize: 10,
                                fontWeight: 800,
                                textDecoration: "none",
                              }}
                            >
                              VIEW
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: 11 }}>
                            N/A
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px" }}>
                        {editId === p.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              autoFocus
                              value={editAmt}
                              onChange={(e) => setEditAmt(e.target.value)}
                              style={{
                                width: 80,
                                padding: "8px",
                                borderRadius: "8px",
                                border: "1px solid #4F46E5",
                                outline: "none",
                              }}
                              type="number"
                            />
                            <button
                              className="btn-edit"
                              style={{
                                background: "#4F46E5",
                                color: "#fff",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                              }}
                              onClick={() => handleUpdate(p.id)}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              style={{
                                background: "#f1f5f9",
                                padding: "8px",
                                borderRadius: "8px",
                                border: "none",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditId(p.id);
                              setEditAmt(p.paid_amount);
                            }}
                            style={{
                              padding: "8px 16px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "transparent",
                              color: "#475569",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
