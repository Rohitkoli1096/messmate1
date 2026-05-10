import React, { useEffect, useState } from "react";
import { paymentsAPI } from "../../api";
import toast from "react-hot-toast";

// Define the backend URL where images are hosted
const API_BASE_URL = "http://localhost:5001";

export default function PaymentManagement() {
  // Initialize as an empty array to prevent .reduce errors on initial render
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editAmt, setEditAmt] = useState("");

  const load = () => {
    setLoading(true);
    paymentsAPI
      .getAll()
      .then((r) => {
        // FIX: Remove .data as api.js interceptor already unwrapped it
        const data = Array.isArray(r) ? r : (r?.data || []);
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

  // FIX: Added safety check to ensure payments is an array before reducing
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
    <div style={{ padding: "10px" }}>
      {/* Statistics Cards */}
      <div
        className="stat-grid"
        style={{
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "16px",
          marginBottom: 20,
        }}
      >
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #eef2ff",
          }}
        >
          <div className="stat-icon" style={{ marginBottom: 8 }}>
            ✅
          </div>
          <div
            className="stat-val"
            style={{ color: "#22C55E", fontSize: "20px", fontWeight: 800 }}
          >
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
          <div
            className="stat-lbl"
            style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}
          >
            Total Collected
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #fff1f2",
          }}
        >
          <div className="stat-icon" style={{ marginBottom: 8 }}>
            ⏳
          </div>
          <div
            className="stat-val"
            style={{ color: "#F59E0B", fontSize: "20px", fontWeight: 800 }}
          >
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <div
            className="stat-lbl"
            style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}
          >
            Pending Amount
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #f5f3ff",
          }}
        >
          <div className="stat-icon" style={{ marginBottom: 8 }}>
            👥
          </div>
          <div
            className="stat-val"
            style={{ color: "#4F46E5", fontSize: "20px", fontWeight: 800 }}
          >
            {safePayments.length}
          </div>
          <div
            className="stat-lbl"
            style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}
          >
            Total Records
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            marginBottom: 20,
            fontSize: 16,
            fontWeight: 700,
            color: "#1e1b4b",
          }}
        >
          💰 All Payment Records
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            <p>Fetching payments...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    background: "#f8fafc",
                    borderBottom: "2px solid #f1f5f9",
                  }}
                >
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
                    Student
                  </th>
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
                    Plan Details
                  </th>
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
                    Total
                  </th>
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
                    Paid
                  </th>
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
                    Remaining
                  </th>
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
                    Status
                  </th>
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
                    Screenshot
                  </th>
                  <th style={{ padding: "12px 16px", fontSize: "13px" }}>
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
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        {p.name}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontWeight: 700,
                            color: "#4F46E5",
                          }}
                        >
                          {p.plan_type?.toUpperCase()}
                        </span>
                        {p.duration}
                      </td>
                      <td style={{ padding: "16px" }}>
                        ₹{Number(p.total_amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: "#22C55E",
                          fontWeight: 700,
                        }}
                      >
                        ₹{Number(p.paid_amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: remaining > 0 ? "#EF4444" : "#22C55E",
                          fontWeight: 700,
                        }}
                      >
                        ₹{remaining.toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-yellow" : "badge-red"}`}
                          style={{
                            textTransform: "uppercase",
                            fontSize: "10px",
                            padding: "4px 8px",
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
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "4px",
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
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/35?text=ERR";
                              }}
                            />
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#4F46E5",
                                fontSize: 10,
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              VIEW FULL
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: 11 }}>
                            No Receipt
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
                                padding: "6px",
                                borderRadius: "4px",
                                border: "1px solid #4F46E5",
                              }}
                              type="number"
                            />
                            <button
                              className="btn-edit"
                              style={{
                                background: "#4F46E5",
                                color: "#fff",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                border: "none",
                              }}
                              onClick={() => handleUpdate(p.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn-danger"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "4px",
                              }}
                              onClick={() => setEditId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-edit"
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "#f5f3ff",
                              color: "#4F46E5",
                              border: "1px solid #ddd6fe",
                              borderRadius: "6px",
                            }}
                            onClick={() => {
                              setEditId(p.id);
                              setEditAmt(p.paid_amount);
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