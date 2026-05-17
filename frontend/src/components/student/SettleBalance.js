import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react"; 
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";

// Pro Fintech App Icons
import { 
  ChevronLeft, Timer, QrCode, Smartphone, 
  CheckCircle2, ShieldCheck, Lock, 
  ArrowRight, Loader2, AlertCircle, HelpCircle, X, IndianRupee
} from "lucide-react";

export default function SettleBalance() {
  const navigate = useNavigate();
  const location = useLocation();

  // Route configurations passed from subscription select dashboard
  const subscriptionId = location.state?.subscriptionId;

  // UI Component states
  const [method, setMethod] = useState("intent");
  const [paymentStatus, setPaymentStatus] = useState("loading"); // loading | pending | verifying | success | failed
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins precision clock
  const [showHelp, setShowHelp] = useState(false);
  const [utr, setUtr] = useState("");
  const [customAmount, setCustomAmount] = useState(""); // Dynamic User Entered Amount
  
  // Financial State vectors fetched safely from server ledger
  const [financials, setFinancials] = useState({
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0
  });

  // Unique tracking token generated per session to isolate reconciliation paths
  const [transactionToken] = useState(`TXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`);

  const merchantUpiId = "7020572471@ibl"; 
  const merchantName = "MessMate Core Engine";
  
  // Computes active transaction value safely (fallback to 0 if input empty)
  const activePaymentAmount = Number(customAmount) || 0;

  // Real-time calculated secure dynamic UPI deep link binding
  const upiLink = `upi://pay?pa=${merchantUpiId}&pn=${encodeURIComponent(merchantName)}&tr=${transactionToken}&am=${activePaymentAmount}&cu=INR&tn=${encodeURIComponent(`Sub settlement ${subscriptionId}`)}`;

  // 1. Fetch exact dues safely from database ledger with Auth Token injection
  const fetchFreshLedgerData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token"); // Retrieve saved login JWT token

      const response = await axios.get("http://localhost:5001/api/payments/my", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Handle incoming properties seamlessly from server response object mapping
        const total = Number(response.data.total_amount) || 0;
        const paid = Number(response.data.paid_amount) || 0;
        const outstanding = total - paid;

        if (outstanding <= 0) {
          toast.success("Account balance fully cleared!");
          navigate("/student/payment");
          return;
        }

        setFinancials({
          totalAmount: total,
          paidAmount: paid,
          outstandingAmount: outstanding
        });
        
        // Auto-populate input textarea with maximum outstanding arrears by default
        setCustomAmount(outstanding.toString());
        setPaymentStatus("pending");
      } else {
        toast.error("No active payment structure found.");
        navigate(-1);
      }
    } catch (err) {
      console.error("Sync Error Details:", err.response || err);
      toast.error(`Sync Error: ${err.response?.data?.message || "Verify server auth rules"}`);
      setPaymentStatus("failed");
    }
  }, [navigate]);

  useEffect(() => {
    if (!subscriptionId) {
      toast.error("Invalid routing window context.");
      navigate(-1);
      return;
    }
    fetchFreshLedgerData();
  }, [subscriptionId, fetchFreshLedgerData, navigate]);

  // 2. Count down timer engine loop
  useEffect(() => {
    if (paymentStatus === "loading" || paymentStatus === "success") return;
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          setPaymentStatus("failed");
          clearInterval(timer);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus]);

  // 3. Amount Field Validator Handler
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Allow only positive integers
    const numericValue = Number(value);

    if (numericValue > financials.outstandingAmount) {
      toast.error(`Amount cannot exceed remaining balance of ₹${financials.outstandingAmount}`);
      setCustomAmount(financials.outstandingAmount.toString());
      return;
    }
    setCustomAmount(value);
  };

  // 4. Submit Custom Transaction Request with Auth Token injection
  const handleManualSettleSubmit = async () => {
    if (activePaymentAmount <= 0) {
      toast.error("Please specify a valid payment amount.");
      return;
    }
    if (utr.length < 12) {
      toast.error("Please enter a valid 12-digit UTR signature from your bank receipt.");
      return;
    }

    setPaymentStatus("verifying");
    const apiToast = toast.loading("Logging transaction metadata with clearing network...");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5001/api/payments/settle", 
        {
          subscription_id: subscriptionId,
          utr_number: utr,
          custom_amount: activePaymentAmount,
          title: "Custom App UPI Settlement"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success("Settlement request captured! Forwarded to admin console.", { id: apiToast });
        setPaymentStatus("success");
        setTimeout(() => navigate("/student/payment"), 2500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reconciliation failed.", { id: apiToast });
      setPaymentStatus("pending");
    }
  };

  const triggerIntentAppLaunch = () => {
    if (activePaymentAmount <= 0) {
      toast.error("Please input a valid amount before launching gateway application.");
      return;
    }
    window.location.href = upiLink;
  };

  if (paymentStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8FAFC" }}>
        <Loader2 size={36} color="#4F46E5" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 13, color: "#64748B", fontWeight: 700, marginTop: 12 }}>Syncing Ledger Matrices Securely...</span>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", paddingBottom: 60, fontFamily: "system-ui, sans-serif" }}>
      <main style={{ padding: "20px 16px", maxWidth: "480px", margin: "0 auto" }}>
        
        {/* UPPER CONTEXT TITLE BAR */}
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ background: "#fff", border: "1px solid #E2E8F0", padding: "12px", borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <ChevronLeft size={18} color="#0F172A" />
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>Secured Gateway</span>
            <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><Lock size={10} /> Variable Ledger Node</span>
          </div>
          <div style={{ color: "#EF4444", background: "#FEE2E2", padding: "8px 14px", borderRadius: "24px", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}>
            <Timer size={14} />
            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
          </div>
        </section>

        {/* FINANCIAL DATA METRIC CARD */}
        <section style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderRadius: "28px", padding: "28px", color: "#fff", boxShadow: "0 20px 30px -10px rgba(15, 23, 42, 0.25)", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, opacity: 0.6, letterSpacing: "1.5px" }}>MAXIMUM OUTSTANDING ARREARS</span>
            <span style={{ fontSize: "10px", background: "rgba(56, 189, 248, 0.2)", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, color: "#38BDF8" }}>FLEXI DEBIT</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: "8px 0", letterSpacing: "-1px" }}>
            ₹{financials.outstandingAmount.toLocaleString('en-IN')}.00
          </h1>
          <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7, fontSize: "11px", fontWeight: 600 }}>
            <span>Total Plan: ₹{financials.totalAmount}</span>
            <span>Paid Till Date: ₹{financials.paidAmount}</span>
          </div>
        </section>

        {/* TRANSITIONING VIEWPORT STATES */}
        <AnimatePresence mode="wait">
          {paymentStatus === "pending" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              
              {/* VARIABLE AMOUNT ENTER TEXTAREA FIELD */}
              <section style={{ background: "#fff", padding: "24px", borderRadius: "28px", border: "1px solid #E2E8F0", marginBottom: 24 }}>
                <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>How much would you like to pay?</h3>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "#64748B", display: "flex", alignItems: "center" }}>
                    <IndianRupee size={20} style={{ strokeWidth: 2.5 }} />
                  </div>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="0"
                    value={customAmount}
                    onChange={handleAmountChange}
                    style={{
                      width: "100%", padding: "18px 18px 18px 44px", borderRadius: "20px",
                      border: "2px solid #4F46E5", background: "#FFF", fontSize: "22px",
                      fontWeight: 900, color: "#4F46E5", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>
                <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
                  * Type any custom amount. The security module downstream will generate code values matching this specific intent.
                </p>
              </section>

              {/* SELECT NETWORK INTENT CONNECTOR */}
              <section style={{ background: "#fff", padding: "24px", borderRadius: "28px", border: "1px solid #E2E8F0", marginBottom: 24 }}>
                <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>Select Transfer Route</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div onClick={() => setMethod("intent")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px", borderRadius: "20px", cursor: "pointer", border: method === "intent" ? "2px solid #4F46E5" : "2px solid #E2E8F0", background: method === "intent" ? "#F5F3FF" : "#fff" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ background: "#E0E7FF", padding: 12, borderRadius: "14px", color: "#10B981" }}><Smartphone size={18} /></div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>Direct Bank-App Tunnel</div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Launches native device UPI apps for ₹{activePaymentAmount}</div>
                      </div>
                    </div>
                  </div>

                  <div onClick={() => setMethod("qr_scan")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px", borderRadius: "20px", cursor: "pointer", border: method === "qr_scan" ? "2px solid #4F46E5" : "2px solid #E2E8F0", background: method === "qr_scan" ? "#F5F3FF" : "#fff" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ background: "#E0E7FF", padding: 12, borderRadius: "14px", color: "#4F46E5" }}><QrCode size={18} /></div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>Generate Secure dynamic QR</div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Scan from another device to wire ₹{activePaymentAmount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "center", width: "100%" }}>
                  {method === "intent" ? (
                    <button disabled={activePaymentAmount <= 0} onClick={triggerIntentAppLaunch} style={{ width: "100%", padding: "18px", borderRadius: "20px", border: "none", fontSize: "15px", fontWeight: 800, color: "#fff", background: activePaymentAmount <= 0 ? "#CBD5E1" : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", cursor: activePaymentAmount <= 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      Initialize Active Handoff <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div style={{ padding: "20px", background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", textAlign: "center" }}>
                      {activePaymentAmount > 0 ? (
                        <>
                          <QRCodeCanvas value={upiLink} size={160} level="H" />
                          <div style={{ marginTop: 8, fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>Scan to Pay ₹{activePaymentAmount}</div>
                        </>
                      ) : (
                        <span style={{ fontSize: "13px", color: "#EF4444", fontWeight: 700 }}>Enter amount above to initialize code.</span>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* TRANSACTION PROOF VALIDATION SHEATH */}
              <section style={{ background: "#fff", padding: "24px", borderRadius: "28px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Bank Reconciler Entry</span>
                  </div>
                  <button onClick={() => setShowHelp(true)} style={{ background: "none", border: "none", color: "#4F46E5", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                    <HelpCircle size={14} /> Locate Key Code
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <input 
                    type="text"
                    placeholder="Enter 12-Digit Banking UTR"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    style={{
                      width: "100%", padding: "18px 46px 18px 18px", borderRadius: "20px",
                      border: utr.length === 12 ? "1.5px solid #10B981" : "1.5px solid #E2E8F0",
                      background: "#F8FAFC", fontSize: "16px", fontWeight: 800, color: "#0F172A", outline: "none",
                      letterSpacing: utr.length > 0 ? "2px" : "normal", boxSizing: "border-box"
                    }}
                  />
                  {utr.length === 12 && (
                    <div style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", color: "#10B981" }}><CheckCircle2 size={22} strokeWidth={2.5} /></div>
                  )}
                </div>

                <button
                  disabled={utr.length < 12 || activePaymentAmount <= 0}
                  onClick={handleManualSettleSubmit}
                  style={{
                    width: "100%", marginTop: 20, padding: "18px", borderRadius: "20px", border: "none", fontSize: "15px", fontWeight: 800, color: "#fff",
                    background: (utr.length < 12 || activePaymentAmount <= 0) ? "#CBD5E1" : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    boxShadow: (utr.length === 12 && activePaymentAmount > 0) ? "0 10px 20px rgba(79, 70, 229, 0.2)" : "none",
                    cursor: (utr.length < 12 || activePaymentAmount <= 0) ? "not-allowed" : "pointer"
                  }}
                >
                  Verify and Complete Settlement
                </button>
              </section>

            </motion.div>
          )}

          {paymentStatus === "verifying" && (
            <motion.div key="verifying" style={{ background: "#fff", padding: "40px 24px", borderRadius: "28px", border: "1px solid #E2E8F0", textAlign: "center" }}>
              <Loader2 size={40} color="#4F46E5" style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Handshaking Assets</h3>
              <p style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Logging data keys within clearing house indexes...</p>
            </motion.div>
          )}

          {paymentStatus === "success" && (
            <motion.div key="success" style={{ background: "#DCFCE7", padding: "40px 24px", borderRadius: "28px", border: "1.5px solid #10B981", textAlign: "center" }}>
              <CheckCircle2 size={44} color="#10B981" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#16A34A", margin: "0 0 4px" }}>Verification Dispatched</h3>
              <p style={{ fontSize: "13px", color: "#16A34A", fontWeight: 700 }}>Your request is queued for audit clearance.</p>
            </motion.div>
          )}

          {paymentStatus === "failed" && (
            <motion.div key="failed" style={{ background: "#FEE2E2", padding: "40px 24px", borderRadius: "28px", border: "1.5px solid #EF4444", textAlign: "center" }}>
              <AlertCircle size={44} color="#EF4444" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#B91C1C", margin: "0 0 6px" }}>Session Interrupted</h3>
              <button onClick={() => fetchFreshLedgerData()} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #EF4444", borderRadius: "12px", color: "#B91C1C", fontWeight: 800, cursor: "pointer" }}>Re-initialize Portal</button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer style={{ marginTop: 28, textAlign: "center", fontSize: "11px", color: "#94A3B8", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
          <ShieldCheck size={14} /> Bank-Direct Flexible Reconciliation Pipeline
        </footer>
      </main>

      {/* CONTEXT HELP SHEET DRAWER */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} style={{ background: "#fff", width: "100%", maxWidth: "480px", borderTopLeftRadius: "28px", borderTopRightRadius: "28px", padding: "24px", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Locating reference identifiers</h4>
                <button onClick={() => setShowHelp(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", padding: 6, cursor: "pointer" }}><X size={16} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
                <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 14 }}>
                  <strong style={{ color: "#0F172A" }}>PhonePe / Paytm:</strong> Look at your digital debit voucher metrics for the 12-digit code named <span style={{ color: "#4F46E5" }}>UTR</span>.
                </div>
                <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 14 }}>
                  <strong style={{ color: "#0F172A" }}>Google Pay (GPay):</strong> Open transaction history cards to harvest the target <span style={{ color: "#4F46E5" }}>UPI Ref Number</span>.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
