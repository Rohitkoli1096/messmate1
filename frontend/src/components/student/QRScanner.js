import React, { useState } from "react";
import { attendanceAPI } from "../../api";
import toast from "react-hot-toast";

export default function QRScanner() {
  const [status, setStatus] = useState("idle"); // idle | scanning | success | error
  const [message, setMessage] = useState("");

  const handleScan = async () => {
    setStatus("scanning");
    try {
      const res = await attendanceAPI.scan();
      setMessage(res.data.message);
      setStatus("success");
      toast.success(res.data.message);
    } catch (err) {
      const msg = err.response?.data?.message || "Scan failed";
      setMessage(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessage("");
  };

  const hour = new Date().getHours();
  const mealWindow =
    hour >= 11 && hour < 14
      ? "lunch"
      : hour >= 19 && hour < 22
        ? "dinner"
        : null;

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg,#1e1b4b,#312e81)",
          borderRadius: 20,
          padding: 24,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 7V4H7" stroke="white" strokeWidth="2" />
            <path d="M20 7V4H17" stroke="white" strokeWidth="2" />
            <path d="M4 17V20H7" stroke="white" strokeWidth="2" />
            <path d="M20 17V20H17" stroke="white" strokeWidth="2" />
            <rect
              x="7"
              y="7"
              width="10"
              height="10"
              stroke="white"
              strokeWidth="2"
            />
          </svg>{" "}
          Scan QR Code
        </div>
        <div
          style={{
            color: "rgba(255,255,255,.7)",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {mealWindow
            ? `Active: ${mealWindow === "lunch" ? "🍛 Lunch" : "🌙 Dinner"} window`
            : "No meal window active right now"}
        </div>

        {/* Camera frame simulation */}
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 20,
            background: "rgba(255,255,255,.05)",
            border: "2px solid rgba(255,255,255,.3)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Corner markers */}
          {[
            ["top:8px", "left:8px", "borderTop", "borderLeft"],
            ["top:8px", "right:8px", "borderTop", "borderRight"],
            ["bottom:8px", "left:8px", "borderBottom", "borderLeft"],
            ["bottom:8px", "right:8px", "borderBottom", "borderRight"],
          ].map(([t, s, b1, b2], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 22,
                height: 22,
                [t.split(":")[0]]: t.split(":")[1],
                [s.split(":")[0]]: s.split(":")[1],
                [b1]: "3px solid #8B5CF6",
                [b2]: "3px solid #8B5CF6",
                borderRadius:
                  i === 0
                    ? "4px 0 0 0"
                    : i === 1
                      ? "0 4px 0 0"
                      : i === 2
                        ? "0 0 0 4px"
                        : "0 0 4px 0",
              }}
            />
          ))}

          {status === "success" ? (
            <div style={{ textAlign: "center", color: "#22C55E" }}>
              <div style={{ fontSize: 52 }}>✅</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  marginTop: 8,
                }}
              >
                Marked!
              </div>
            </div>
          ) : status === "error" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52 }}>❌</div>
            </div>
          ) : status === "scanning" ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,.5)" }}>
              <div style={{ fontSize: 36 }}>⏳</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Scanning...</div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,.3)" }}>
              <div style={{ fontSize: 52 }}>
                {" "}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7V4H7" stroke="white" strokeWidth="2" />
                  <path d="M20 7V4H17" stroke="white" strokeWidth="2" />
                  <path d="M4 17V20H7" stroke="white" strokeWidth="2" />
                  <path d="M20 17V20H17" stroke="white" strokeWidth="2" />
                  <rect
                    x="7"
                    y="7"
                    width="10"
                    height="10"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div style={{ fontSize: 11, marginTop: 8 }}>Camera preview</div>
            </div>
          )}
        </div>

        <div
          style={{
            color: "rgba(255,255,255,.6)",
            fontSize: 12,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Lunch: 11:00 AM – 2:00 PM
          <br />
          Dinner: 7:00 PM – 10:00 PM
        </div>
      </div>

      {status === "idle" || status === "scanning" ? (
        <button
          onClick={handleScan}
          disabled={status === "scanning"}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg,#06B6D4,#3B82F6)",
            color: "#fff",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontSize: 16,
            fontWeight: 800,
            cursor: status === "scanning" ? "not-allowed" : "pointer",
            opacity: status === "scanning" ? 0.7 : 1,
          }}
        >
          {status === "scanning" ? "Scanning..." : "📷 Tap to Scan QR"}
        </button>
      ) : (
        <div style={{ width: "100%", textAlign: "center" }}>
          <div
            style={{
              background: status === "success" ? "#dcfce7" : "#fee2e2",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              color: status === "success" ? "#16a34a" : "#dc2626",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {message}
          </div>
          <button
            onClick={reset}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: "2px solid #4F46E5",
              background: "transparent",
              color: "#4F46E5",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Scan Again
          </button>
        </div>
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 14,
          width: "100%",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#1e1b4b",
            marginBottom: 8,
          }}
        >
          How it works
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
          1. Tap the scan button during meal time
          <br />
          2. Your attendance is automatically marked
          <br />
          3. System detects lunch or dinner based on time
          <br />
          4. Subscription must be active to scan
        </div>
      </div>
    </div>
  );
}
