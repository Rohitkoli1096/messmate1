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

const THEME = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  navy: "#0F172A",
  emerald: "#10B981",
  indigo: "#6366F1",
  slate: "#64748B"
};

const Root = styled(Box)({
  minHeight: "100vh",
  backgroundColor: THEME.bg,
  paddingBottom: "100px",
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
  boxShadow: "none"
});

export default function PaymentScreen() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await paymentsAPI.getMy();
      const data = res?.data?.data || res?.data || res;
      setPayment(data);
    } catch (e) {
      toast.error("Failed to sync ledger");
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) return (
    <Box sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={28} thickness={5} sx={{ color: THEME.navy }} />
    </Box>
  );

  const total = Number(payment?.total_amount || 0);
  const paid = Number(payment?.paid_amount || 0);
  const balance = total - paid;
  const progress = total > 0 ? (paid / total) * 100 : 0;
  
  const allocatedDate = payment?.created_at ? new Date(payment.created_at).toLocaleDateString() : "N/A";
  const expiryDate = payment?.end_date ? new Date(payment.end_date).toLocaleDateString() : "N/A";
  
  return (
    <Root>
      <Container maxWidth="sm">
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: THEME.navy, lineHeight: 1.1 }}>
                Capital Ledger
              </Typography>
              <Typography variant="caption" sx={{ color: THEME.slate, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                Secure Payment Portal
              </Typography>
            </Box>
            <IconButton size="small" sx={{ bgcolor: THEME.surface, border: "1px solid #E2E8F0" }}>
              <HistoryRounded fontSize="small" sx={{ color: THEME.navy }} />
            </IconButton>
          </Box>

          <TitanCard initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ bgcolor: alpha(THEME.emerald, 0.2), px: 1.5, py: 0.4, borderRadius: '100px' }}>
                  <Typography sx={{ color: THEME.emerald, fontSize: '9px', fontWeight: 900 }}>SYSTEM_ACTIVE</Typography>
                </Box>
                <VerifiedUserRounded sx={{ opacity: 0.8, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem' }}>
                   {payment?.plan_type?.toUpperCase() || 'STANDARD'} TIER
                </Typography>
                <Typography sx={{ opacity: 0.6, fontWeight: 700, fontSize: '0.7rem' }}>
                  REF: #{payment?.subscription_id || '0000'}
                </Typography>
              </Box>
              <Divider sx={{ borderColor: alpha('#FFF', 0.1) }} />
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography sx={{ opacity: 0.5, fontSize: '0.6rem', fontWeight: 800 }}>START</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>{allocatedDate}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography sx={{ opacity: 0.5, fontSize: '0.6rem', fontWeight: 800 }}>END</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>{expiryDate}</Typography>
                </Grid>
              </Grid>
            </Stack>
          </TitanCard>

          <Stack direction="row" spacing={2}>
            <StatBox>
              <Typography sx={{ color: THEME.slate, fontWeight: 900, fontSize: '0.65rem' }}>TOTAL BILLED</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: THEME.navy }}>₹{total}</Typography>
            </StatBox>
            <StatBox sx={{ borderBottom: `4px solid ${THEME.emerald}` }}>
              <Typography sx={{ color: THEME.emerald, fontWeight: 900, fontSize: '0.65rem' }}>SETTLED</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: THEME.emerald }}>₹{paid}</Typography>
            </StatBox>
          </Stack>

          <ActionTerminal>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'flex' }}>
                  <CircularProgress variant="determinate" value={100} size={42} thickness={5} sx={{ color: '#F1F5F9' }} />
                  <CircularProgress variant="determinate" value={progress} size={42} thickness={5} sx={{ color: THEME.indigo, position: 'absolute', strokeLinecap: 'round' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, color: THEME.navy, fontSize: '14px' }}>Outstanding Balance</Typography>
                  <Typography sx={{ color: balance === 0 ? THEME.emerald : '#F43F5E', fontWeight: 800, fontSize: '0.75rem' }}>
                    {balance === 0 ? "FULL SETTLEMENT REACHED" : `DUE: ₹${balance}`}
                  </Typography>
                </Box>
              </Stack>

              {balance > 0 && (
                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  // FIXED: Now passing user_id, amount, AND subscription_id in state
                  onClick={() => {
                    const studentId = payment?.user_id;
                    if (studentId) {
                        navigate(`/student/payment/settle-balance/${studentId}`, {
                          state: {
                            amount: balance,
                            subscriptionId: payment?.subscription_id,
                            title: `${payment?.plan_type?.toUpperCase()} Plan Settlement`
                          }
                        });
                    } else {
                        toast.error("Could not verify session ID");
                    }
                  }} 
                  endIcon={<NorthEastRounded fontSize="small" />}
                  sx={{ 
                    py: 1.5, borderRadius: "16px", bgcolor: THEME.navy, fontWeight: 900, fontSize: '0.9rem',
                    textTransform: 'none', boxShadow: "0 8px 16px -4px rgba(15, 23, 42, 0.2)",
                    '&:hover': { bgcolor: '#1E293B' }
                  }}
                >
                  Settle Balance
                </Button>
              )}
            </CardContent>
          </ActionTerminal>
        </Stack>
      </Container>
    </Root>
  );
}