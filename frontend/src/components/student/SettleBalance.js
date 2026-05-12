import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box, Typography, IconButton, Stack, Card, TextField, 
  Button, RadioGroup, Container, styled, alpha, 
  Radio as MuiRadio, InputAdornment, Divider, Paper
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react"; 
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";

// Icons
import ChevronLeft from "@mui/icons-material/ChevronLeftRounded";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import QrCodeScanner from "@mui/icons-material/QrCodeScannerRounded";
import Smartphone from "@mui/icons-material/SmartphoneRounded";
import CheckCircle from "@mui/icons-material/CheckCircleRounded";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";

const THEME = {
  primary: "#4F46E5", // Indigo
  secondary: "#0F172A", // Navy
  success: "#10B981", // Emerald
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textSecondary: "#64748B"
};

// --- STYLED COMPONENTS ---

const StyledPaper = styled(Paper)({
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  border: `1px solid ${THEME.border}`,
});

const PaymentOption = styled(Box)(({ selected }) => ({
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  padding: "20px", 
  borderRadius: "16px",
  border: `2px solid ${selected ? THEME.primary : THEME.border}`,
  backgroundColor: selected ? alpha(THEME.primary, 0.04) : THEME.surface,
  cursor: 'pointer', 
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  "&:hover": { 
    borderColor: THEME.primary,
    boxShadow: `0 4px 12px ${alpha(THEME.primary, 0.1)}`
  }
}));

const UTRInput = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    backgroundColor: THEME.background,
    fontSize: "1.1rem",
    fontWeight: 700,
    "& fieldset": { borderColor: THEME.border },
    "&:hover fieldset": { borderColor: THEME.primary },
    "&.Mui-focused fieldset": { borderColor: THEME.primary },
  },
});

export default function SettleBalance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [method, setMethod] = useState("qr_scan");
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);

  const payableAmount = location.state?.amount || 0;
  const subscriptionId = location.state?.subscriptionId || 0;
  const upiId = "7020572471@ibl"; 
  const upiLink = `upi://pay?pa=${upiId}&pn=MessMate&am=${payableAmount}&cu=INR`;

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerifySubmission = async () => {
    if (utr.length < 12) {
      toast.error("Please enter the 12-digit UTR from your bank app");
      return;
    }

    setLoading(true);
    const apiToast = toast.loading("Confirming settlement...");

    try {
      const response = await axios.post("http://localhost:5001/api/payments/settle", {
        subscription_id: subscriptionId,
        amount: payableAmount,
        utr_number: utr,
        title: "Manual UPI Settlement"
      });

      if (response.data.success) {
        toast.success("Payment Logged Successfully", { id: apiToast });
        setTimeout(() => navigate("/student/payment"), 2000);
      }
    } catch (error) {
      toast.error("Network synchronization failed", { id: apiToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: THEME.background, minHeight: "100vh", pb: 6 }}>
      <Container maxWidth="xs">
        {/* HEADER SECTION */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ py: 3 }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ bgcolor: THEME.surface, boxShadow: 1 }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ color: THEME.secondary }}
          >
            Secure Checkout
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{
              color: "#E11D48",
              bgcolor: "#FFF1F2",
              px: 1.5,
              py: 0.5,
              borderRadius: "12px",
            }}
          >
            <TimerOutlined sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={900}>
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </Typography>
          </Stack>
        </Stack>

        {/* AMOUNT CARD */}
        <Card
          sx={{
            p: 3,
            borderRadius: "24px",
            background: `linear-gradient(135deg, ${THEME.secondary} 0%, #1E293B 100%)`,
            color: "#FFF",
            mb: 4,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 2 }}>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontWeight: 700, letterSpacing: 1.5 }}
            >
              TOTAL PAYABLE
            </Typography>
            <Typography variant="h3" fontWeight={900} sx={{ my: 1 }}>
              ₹{payableAmount}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <ReceiptLongOutlined sx={{ fontSize: 16, opacity: 0.7 }} />
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ opacity: 0.8 }}
              >
                ID: MM-SUB{subscriptionId}
              </Typography>
            </Stack>
          </Box>
          <VerifiedUserOutlined
            sx={{
              position: "absolute",
              right: -10,
              bottom: -10,
              fontSize: 100,
              opacity: 0.05,
            }}
          />
        </Card>

        {/* PAYMENT FLOW CONTAINER */}
        <StyledPaper elevation={0}>
          <Typography
            variant="body2"
            fontWeight={800}
            color={THEME.textSecondary}
            mb={2}
          >
            SELECT GATEWAY
          </Typography>

          <RadioGroup
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <Stack spacing={2}>
              <PaymentOption
                selected={method === "qr_scan"}
                onClick={() => setMethod("qr_scan")}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: alpha(THEME.primary, 0.1),
                      borderRadius: "12px",
                    }}
                  >
                    <QrCodeScanner sx={{ color: THEME.primary }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} variant="body2">
                      Show QR Code
                    </Typography>
                    <Typography variant="caption" color={THEME.textSecondary}>
                      Pay via any UPI App
                    </Typography>
                  </Box>
                </Stack>
                <MuiRadio value="qr_scan" size="small" />
              </PaymentOption>

              <PaymentOption
                selected={method === "intent"}
                onClick={() => setMethod("intent")}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: alpha(THEME.success, 0.1),
                      borderRadius: "12px",
                    }}
                  >
                    <Smartphone sx={{ color: THEME.success }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} variant="body2">
                      Direct UPI App
                    </Typography>
                    <Typography variant="caption" color={THEME.textSecondary}>
                      One-tap payment
                    </Typography>
                  </Box>
                </Stack>
                <MuiRadio value="intent" size="small" />
              </PaymentOption>
            </Stack>
          </RadioGroup>

          {/* DYNAMIC VISUAL AREA */}
          <Box
            sx={{
              mt: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <AnimatePresence mode="wait">
              {method === "qr_scan" ? (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#FFF",
                      borderRadius: "24px",
                      border: `1px solid ${THEME.border}`,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                    }}
                  >
                    <QRCodeCanvas
                      value={upiLink}
                      size={180}
                      level="H"
                      includeMargin
                    />
                  </Box>
                </motion.div>
              ) : (
                <motion.div
                  key="btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ width: "100%" }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    component="a"
                    href={upiLink}
                    sx={{
                      py: 2,
                      borderRadius: "16px",
                      borderStyle: "dashed",
                      fontWeight: 800,
                      textTransform: "none",
                    }}
                  >
                    🚀 Launch PhonePe / GPay
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </StyledPaper>

        {/* VERIFICATION SECTION */}
        <Box sx={{ mt: 4 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1.5, px: 1 }}
          >
            <Typography
              variant="caption"
              fontWeight={900}
              color={THEME.textSecondary}
            >
              SUBMIT TRANSACTION PROOF
            </Typography>
            <InfoOutlined sx={{ fontSize: 14, color: THEME.textSecondary }} />
          </Stack>

          <UTRInput
            fullWidth
            placeholder="12-Digit UTR Number"
            value={utr}
            onChange={(e) =>
              setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            InputProps={{
              endAdornment: utr.length === 12 && (
                <InputAdornment position="end">
                  <CheckCircle sx={{ color: THEME.success }} />
                </InputAdornment>
              ),
            }}
          />

          <Typography
            variant="caption"
            sx={{
              mt: 1.5,
              display: "block",
              px: 1,
              color: THEME.textSecondary,
              fontStyle: "italic",
            }}
          >
            * Your balance will be updated after admin verifies the UTR.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            disabled={loading || utr.length < 12}
            onClick={handleVerifySubmission}
            sx={{
              mt: 3,
              py: 2.2,
              borderRadius: "20px",
              fontWeight: 900,
              fontSize: "1rem",
              bgcolor: THEME.primary,
              textTransform: "none",
              boxShadow: `0 10px 20px ${alpha(THEME.primary, 0.3)}`,
              "&:hover": {
                bgcolor: THEME.primary,
                transform: "translateY(-2px)",
              },
              transition: "all 0.2s",
            }}
          >
            {loading ? "Processing..." : "Confirm Settlement"}
          </Button>
        </Box>

        <Typography
          variant="caption"
          sx={{ mt: 4, display: "block", textAlign: "center", opacity: 0.5 }}
        >
          End-to-End Encrypted Secure Gateway
        </Typography>
      </Container>
    </Box>
  );
}