import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import {
  Box, Button, Card, CardContent, Divider, Stack, Typography, 
  CircularProgress, styled, alpha, IconButton, Grid, Container
} from "@mui/material";
import {
  VerifiedUserRounded, HistoryRounded,
  ShieldRounded, TrendingUpRounded, NorthEastRounded
} from "@mui/icons-material";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { paymentsAPI } from "../../api";

// --- DESIGN TOKENS ---
const THEME = {
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  navy: "#0F172A",
  emerald: "#10B981",
  indigo: "#6366F1",
  slate: "#64748B"
};

// --- STYLED COMPONENTS ---
const Root = styled(Box)({
  minHeight: "100vh",
  backgroundColor: THEME.bg,
  paddingBottom: "30px",
});

const TitanCard = styled(motion.div)({
  background: `linear-gradient(135deg, ${THEME.navy} 0%, #1E293B 100%)`,
  borderRadius: "24px",
  padding: "20px",
  color: "#FFF",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 15px 30px -10px rgba(15, 23, 42, 0.3)",
});

const StatBox = styled(Box)({
  backgroundColor: THEME.surface,
  padding: "14px",
  borderRadius: "20px",
  border: "1px solid #E2E8F0",
  flex: 1,
});

const ActionTerminal = styled(Card)({
  borderRadius: "24px",
  border: "1px solid #E2E8F0",
  background: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(12px)",
});

export default function PaymentScreen() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await paymentsAPI.getMy();
      const data = res?.data || res;
      setPayment(data);
    } catch (e) {
      toast.error("Fetch failed");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) return (
    <Root sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={24} thickness={5} sx={{ color: THEME.navy }} />
    </Root>
  );

  const balance = payment ? Number(payment.total_amount) - Number(payment.paid_amount) : 0;
  const progress = payment ? (Number(payment.paid_amount) / Number(payment.total_amount)) * 100 : 0;
  
  const allocatedDate = payment?.created_at ? new Date(payment.created_at).toLocaleDateString() : "N/A";
  const expiryDate = payment?.end_date ? new Date(payment.end_date).toLocaleDateString() : "N/A";
  const diffInMs = payment?.end_date ? new Date(payment.end_date) - new Date() : 0;
  const remainingDays = Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));

  return (
    <Root>
      <Container maxWidth="sm">
        <Stack spacing={2} sx={{ pt: 3 }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: THEME.navy, lineHeight: 1.1 }}>
                Capital Ledger
              </Typography>
              <Typography variant="caption" sx={{ color: THEME.slate, fontWeight: 800, fontSize: '0.65rem' }}>
                SECURE_PORTAL_v2
              </Typography>
            </Box>
            <IconButton size="small" sx={{ bgcolor: THEME.surface, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <HistoryRounded fontSize="small" sx={{ color: THEME.navy }} />
            </IconButton>
          </Box>

          <TitanCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ bgcolor: alpha(THEME.emerald, 0.15), px: 1.2, py: 0.3, borderRadius: '100px' }}>
                  <Typography sx={{ color: THEME.emerald, fontSize: '9px', fontWeight: 900 }}>SYSTEM_ACTIVE</Typography>
                </Box>
                <VerifiedUserRounded sx={{ opacity: 0.8, fontSize: 20 }} />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
                   {payment?.plan_type === 'full' ? 'Elite Executive' : 'Standard Tier'}
                </Typography>
                <Typography sx={{ opacity: 0.6, fontWeight: 700, fontSize: '0.65rem' }}>
                  ID: #{payment?.subscription_id}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: alpha('#FFF', 0.1) }} />

              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography sx={{ opacity: 0.5, fontSize: '0.6rem', fontWeight: 800 }}>ALLOCATED</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>{allocatedDate}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography sx={{ opacity: 0.5, fontSize: '0.6rem', fontWeight: 800 }}>EXPIRY</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>{expiryDate}</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'right' }}>
                  <Typography sx={{ color: THEME.emerald, fontSize: '0.6rem', fontWeight: 900 }}>REMAINING</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 900 }}>{remainingDays}D</Typography>
                </Grid>
              </Grid>
            </Stack>
          </TitanCard>

          <Stack direction="row" spacing={1.5}>
            <StatBox>
              <Typography sx={{ color: THEME.slate, fontWeight: 900, fontSize: '0.65rem' }}>BILLED</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: THEME.navy }}>₹{payment?.total_amount}</Typography>
            </StatBox>
            <StatBox sx={{ borderBottom: `3px solid ${THEME.emerald}` }}>
              <Typography sx={{ color: THEME.emerald, fontWeight: 900, fontSize: '0.65rem' }}>SETTLED</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: THEME.emerald }}>₹{payment?.paid_amount}</Typography>
            </StatBox>
          </Stack>

          <ActionTerminal>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'flex' }}>
                  <CircularProgress variant="determinate" value={100} size={36} thickness={5} sx={{ color: '#E2E8F0' }} />
                  <CircularProgress variant="determinate" value={progress} size={36} thickness={5} sx={{ color: THEME.indigo, position: 'absolute', strokeLinecap: 'round' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, color: THEME.navy, fontSize: '12px' }}>Ledger Status</Typography>
                  <Typography sx={{ color: THEME.slate, fontWeight: 700, fontSize: '0.65rem' }}>
                    {balance === 0 ? "Settled" : `Pending: ₹${balance}`}
                  </Typography>
                </Box>
              </Stack>

              {balance > 0 && (
                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  // FIXED: Changed to relative path to match App.js hierarchy
                  onClick={() => navigate("settle-balance")} 
                  endIcon={<NorthEastRounded fontSize="small" />}
                  sx={{ 
                    py: 1.2, borderRadius: "12px", bgcolor: THEME.navy, fontWeight: 900, fontSize: '0.85rem',
                    textTransform: 'none',
                    '&:active': { transform: 'scale(0.98)' } 
                  }}
                >
                  Settle Balance
                </Button>
              )}
            </CardContent>
          </ActionTerminal>

          <Stack direction="row" justifyContent="center" spacing={2} sx={{ opacity: 0.4, pt: 0.5 }}>
            <FooterBadge icon={<ShieldRounded />} label="SECURE" />
            <FooterBadge icon={<TrendingUpRounded />} label="SYNCED" />
          </Stack>
        </Stack>
      </Container>
    </Root>
  );
}

const FooterBadge = ({ icon, label }) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    {React.cloneElement(icon, { sx: { fontSize: 10 } })}
    <Typography sx={{ fontSize: '8px', fontWeight: 950, letterSpacing: 0.5 }}>{label}</Typography>
  </Stack>
);