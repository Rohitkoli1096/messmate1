import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, IconButton, Stack, Card, TextField, 
  Button, Radio, RadioGroup, Container, 
  styled, alpha, Radio as MuiRadio, Divider
} from "@mui/material";

// REAL FUNCTIONALITY IMPORTS
import { QRCodeCanvas } from "qrcode.react"; 
import axios from "axios"; 
import { useParams as getParams } from "react-router-dom";

// ICON IMPORTS
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import QrCodeScanner from "@mui/icons-material/QrCodeScanner";
import Smartphone from "@mui/icons-material/Smartphone";
import CheckCircle from "@mui/icons-material/CheckCircle";

import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// --- THEME ---
const THEME = {
  primary: "#4F46E5",
  surface: "#FFFFFF",
  bg: "#F8FAFC",
  slate: "#64748B",
  border: "#E2E8F0"
};

const Root = styled(Box)({ backgroundColor: THEME.bg, minHeight: "100vh", paddingBottom: "40px" });

const PaymentOption = styled(Box)(({ selected }) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: "14px 16px", borderRadius: "14px",
  border: `2px solid ${selected ? THEME.primary : THEME.border}`,
  backgroundColor: selected ? alpha(THEME.primary, 0.04) : THEME.surface,
  marginBottom: "12px", cursor: 'pointer', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const QRBox = styled(Box)({
  padding: "20px", background: "#fff", borderRadius: "20px", display: "inline-block",
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: `1px solid ${THEME.border}`
});

export default function SettleBalance() {
  const { id } = useParams(); // Get student ID from URL
  const navigate = useNavigate();

  const [method, setMethod] = useState("qr_scan");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Data from Database
  const [dbData, setDbData] = useState({
    amount: 0,
    studentName: "",
    upiString: "",
    subscriptionId: null
  });

  const [utrNumber, setUtrNumber] = useState("");

  // 1. FETCH REAL DATA FROM DATABASE ON LOAD
  useEffect(() => {
    const getPaymentDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/payments/payment-details/${id}`);
        setDbData(res.data);
      } catch (err) {
        toast.error("Could not load payment data");
      } finally {
        setFetching(false);
      }
    };
    getParams && getPaymentDetails();
  }, [id]);

  // 2. PROCESS PAYMENT SUBMISSION
  const handlePaymentSubmit = async () => {
    if (!utrNumber || utrNumber.length < 6) {
      toast.error("Please enter a valid UTR / Transaction ID");
      return;
    }

    setLoading(true);
    const loadToast = toast.loading("Submitting to admin for verification...");

    try {
      await axios.post("http://localhost:5001/api/payments/submit-settlement", {
        user_id: id,
        subscription_id: dbData.subscriptionId,
        amount: dbData.amount,
        utr_number: utrNumber,
        method: "UPI"
      });

      toast.success("Submitted! Admin will verify soon.", { id: loadToast });
      setTimeout(() => navigate("/student/home"), 2000);
    } catch (error) {
      toast.error("Submission failed. Try again.", { id: loadToast });
      setLoading(false);
    }
  };

  if (fetching) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>Loading...</Box>;

  return (
    <Root>
      <Toaster position="top-center" />
      <Container maxWidth="xs">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 3 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ border: `1px solid ${THEME.border}`, bgcolor: THEME.surface }}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" fontWeight={900}>Settle Balance</Typography>
            <Box sx={{ width: 40 }} />
          </Stack>

          {/* DYNAMIC BALANCE CARD */}
          <Card sx={{ p: 3, borderRadius: "24px", bgcolor: THEME.primary, color: "#FFF", mb: 4, boxShadow: `0 20px 40px ${alpha(THEME.primary, 0.3)}` }}>
            <Typography sx={{ opacity: 0.8, fontSize: '0.8rem', fontWeight: 600 }}>PAYABLE BY {dbData.studentName.toUpperCase()}</Typography>
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{dbData.amount}</Typography>
            <Divider sx={{ my: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
            <Typography sx={{ fontSize: '0.75rem', opacity: 0.8 }}>Pending Settlement for Sub #{dbData.subscriptionId}</Typography>
          </Card>

          <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
            <PaymentOption selected={method === "qr_scan"} onClick={() => setMethod("qr_scan")}>
              <Stack direction="row" spacing={2} alignItems="center">
                <QrCodeScanner sx={{ color: method === "qr_scan" ? THEME.primary : THEME.slate }} />
                <Typography sx={{ fontWeight: 700 }}>Scan Dynamic QR</Typography>
              </Stack>
              <MuiRadio value="qr_scan" size="small" />
            </PaymentOption>

            <PaymentOption selected={method === "manual"} onClick={() => setMethod("manual")}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Smartphone sx={{ color: method === "manual" ? THEME.primary : THEME.slate }} />
                <Typography sx={{ fontWeight: 700 }}>Enter UTR Manually</Typography>
              </Stack>
              <MuiRadio value="manual" size="small" />
            </PaymentOption>
          </RadioGroup>

          <AnimatePresence mode="wait">
            {method === "qr_scan" ? (
              <motion.div key="qr" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', marginTop: '24px' }}>
                <QRBox>
                  <QRCodeCanvas 
                    // Append the dynamic amount to the base UPI string from database
                    value={`${dbData.upiString}&am=${dbData.amount}`} 
                    size={200} 
                    level={"H"} 
                    includeMargin={true}
                  />
                </QRBox>
                <Typography sx={{ mt: 2, fontSize: '0.75rem', color: THEME.slate, fontWeight: 600 }}>
                  Scan to automatically pay ₹{dbData.amount}
                </Typography>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* UTR INPUT FIELD (Always visible for confirmation) */}
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: "0.9rem", color: THEME.slate }}>
              Transaction / UTR Number
            </Typography>
            <TextField 
              fullWidth 
              placeholder="Enter 12-digit UTR"
              value={utrNumber} 
              onChange={(e) => setUtrNumber(e.target.value)}
              InputProps={{
                sx: { borderRadius: '16px', bgcolor: "#fff" },
                endAdornment: utrNumber.length >= 10 && <CheckCircle sx={{ color: THEME.primary }} />
              }}
            />
          </Box>

          <Button 
            fullWidth variant="contained" 
            onClick={handlePaymentSubmit}
            disabled={loading || dbData.amount <= 0}
            sx={{ 
              mt: 4, py: 2, borderRadius: '18px', fontWeight: 900, textTransform: 'none', fontSize: '1.1rem',
              bgcolor: THEME.primary, '&:hover': { bgcolor: '#4338CA' }
            }}
          >
            {loading ? "Submitting..." : "Confirm Payment"}
          </Button>

        </motion.div>
      </Container>
    </Root>
  );
}