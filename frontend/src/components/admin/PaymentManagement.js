import React, { useEffect, useState } from "react";
import { paymentsAPI } from "../../api";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5001";

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editAmt, setEditAmt] = useState("");

  // State for image popup modal
  const [selectedImg, setSelectedImg] = useState(null);

  const load = () => {
    setLoading(true);
    paymentsAPI
      .getAll()
      .then((r) => setPayments(r.data))
      .catch(() => toast.error("Failed to load payments"))
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

  // --- CSV Export Logic ---
  const downloadCSV = () => {
    if (payments.length === 0) return toast.error("No data to export");

    const headers = [
      "Student Name",
      "Plan",
      "Total Amount",
      "Paid Amount",
      "Remaining",
      "Status",
    ];
    const rows = payments.map((p) => [
      `"${p.name}"`,
      `"${p.plan_type}"`,
      p.total_amount,
      p.paid_amount,
      Number(p.total_amount) - Number(p.paid_amount),
      `"${p.status}"`,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Payments_Report_${new Date().toLocaleDateString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCollected = payments.reduce(
    (s, p) => s + Number(p.paid_amount),
    0,
  );
  const totalPending = payments.reduce(
    (s, p) => s + (Number(p.total_amount) - Number(p.paid_amount)),
    0,
  );

  return (
    <div
      style={{
        padding: "10px",
        position: "relative",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* --- IMAGE POPUP MODAL --- */}
      {selectedImg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "zoom-out",
          }}
          onClick={() => setSelectedImg(null)}
        >
          <div
            style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}
          >
            <button
              onClick={() => setSelectedImg(null)}
              style={{
                position: "absolute",
                top: -45,
                right: 0,
                background: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              ✕
            </button>
            <img
              src={selectedImg}
              alt="Receipt Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        </div>
      )}

      {/* Header & Export Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
          Payment Dashboard
        </h2>
        <button
          onClick={downloadCSV}
          style={{
            background: "#10B981",
            color: "white",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div
        className="stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "16px",
          marginBottom: 25,
        }}
      >
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #eef2ff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#22C55E",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Total Collected
          </div>
          <div style={{ color: "#1e293b", fontSize: "24px", fontWeight: 800 }}>
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #fff1f2",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#F59E0B",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Pending Amount
          </div>
          <div style={{ color: "#1e293b", fontSize: "24px", fontWeight: 800 }}>
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #f5f3ff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#4F46E5",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Total Records
          </div>
          <div style={{ color: "#1e293b", fontSize: "24px", fontWeight: 800 }}>
            {payments.length}
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
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            Loading records...
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
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    STUDENT
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    PLAN
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    TOTAL
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    PAID
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    REMAINING
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    STATUS
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    RECEIPT
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const remaining =
                    Number(p.total_amount) - Number(p.paid_amount);
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
                      <td style={{ padding: "16px", fontSize: "12px" }}>
                        <span
                          style={{
                            display: "block",
                            fontWeight: 700,
                            color: "#4F46E5",
                          }}
                        >
                          {p.plan_type?.toUpperCase()}
                        </span>
                        <span style={{ color: "#94a3b8" }}>{p.duration}</span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        ₹{Number(p.total_amount).toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: "#22C55E",
                          fontWeight: 700,
                        }}
                      >
                        ₹{Number(p.paid_amount).toLocaleString("en-IN")}
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
                          style={{
                            textTransform: "uppercase",
                            fontSize: "10px",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            background:
                              p.status === "paid"
                                ? "#DCFCE7"
                                : p.status === "partial"
                                  ? "#FEF3C7"
                                  : "#FEE2E2",
                            color:
                              p.status === "paid"
                                ? "#166534"
                                : p.status === "partial"
                                  ? "#92400E"
                                  : "#991B1B",
                            fontWeight: 700,
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
                                cursor: "pointer",
                              }}
                              onClick={() => setSelectedImg(imageUrl)}
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/35?text=ERR";
                              }}
                            />
                            <button
                              onClick={() => setSelectedImg(imageUrl)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#4F46E5",
                                fontSize: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: 0,
                                textAlign: "left",
                              }}
                            >
                              VIEW
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: 11 }}>
                            No file
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
                              style={{
                                background: "#4F46E5",
                                color: "#fff",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                border: "none",
                                cursor: "pointer",
                              }}
                              onClick={() => handleUpdate(p.id)}
                            >
                              Save
                            </button>
                            <button
                              style={{
                                background: "#f1f5f9",
                                border: "none",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              onClick={() => setEditId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "#f5f3ff",
                              color: "#4F46E5",
                              border: "1px solid #ddd6fe",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setEditId(p.id);
                              setEditAmt(p.paid_amount);
                            }}
                          >
                            Edit
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
