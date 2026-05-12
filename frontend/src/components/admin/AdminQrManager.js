import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import AutorenewRounded from "@mui/icons-material/AutorenewRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import toast from "react-hot-toast";
import QRCode from "qrcode";

import api from "../../api";

export default function AdminQrManager() {
  const [active, setActive] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  
  const [attendanceActive, setAttendanceActive] = useState(null);
  const [attendanceQrUrl, setAttendanceQrUrl] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isMonday, setIsMonday] = useState(false);

  const [loading, setLoading] = useState(false);

  // BUG FIX: Ensure we drill into the axios response properly
  const getData = (res) => {
    const data = res?.data?.data || res?.data || res;
    return data?.code_value ? data : null;
  };

  const refresh = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      setIsMonday(dayOfWeek === 1);

      const res = await api.get("/qr/active");
      setActive(getData(res));

      const attRes = await api.get("/qr/active-attendance");
      const attData = getData(attRes);
      setAttendanceActive(attData);

      if (attData?.created_at) {
        const diff = (new Date() - new Date(attData.created_at)) / (1000 * 60 * 60 * 24);
        if (diff < 7 || dayOfWeek !== 1) {
          setIsLocked(true);
          setDaysLeft(Math.max(0, Math.ceil(7 - diff)));
        } else {
          setIsLocked(false);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { 
    refresh(); 
  }, []);

  // BUG FIX: QR Generation safe check
  useEffect(() => {
    if (active?.code_value) {
      QRCode.toDataURL(String(active.code_value), { width: 200, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.error(err);
          setQrDataUrl("");
        });
    } else {
      setQrDataUrl("");
    }
  }, [active]);

  // BUG FIX: Attendance QR Generation safe check
  useEffect(() => {
    if (attendanceActive?.code_value) {
      QRCode.toDataURL(String(attendanceActive.code_value), { width: 200, margin: 1 })
        .then((url) => setAttendanceQrUrl(url))
        .catch((err) => {
          console.error(err);
          setAttendanceQrUrl("");
        });
    } else {
      setAttendanceQrUrl("");
    }
  }, [attendanceActive]);

  const rotate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/qr/rotate", {});
      setActive(getData(res));
      toast.success("New Payment QR Generated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Rotation failed");
    } finally {
      setLoading(false);
    }
  };

  const rotateAttendance = async () => {
    if (!isMonday) {
      toast.error("Attendance rotation is only allowed on Mondays");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/qr/rotate-attendance", {});
      setAttendanceActive(getData(res));
      await refresh(); 
      toast.success("Attendance QR Rotated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Rotation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      toast.success(`${label} Copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Stack spacing={3} sx={{ p: 1, maxWidth: "1000px" }}>
      {/* SECTION 1: PAYMENT QR */}
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e1b4b" }}>
            Payment QR
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the student payment gateway versioning.
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ 
          borderRadius: "12px", 
          borderLeft: "6px solid #4F46E5",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
              <Box sx={{ width: 200, height: 200, display: "grid", placeItems: "center", bgcolor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Payment QR" style={{ width: "100%", height: "100%" }} />
                ) : (
                  <QrCode2Rounded sx={{ fontSize: 40, color: "#cbd5e1" }} />
                )}
              </Box>
              
              <Box sx={{ flex: 1, width: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>System Config</Typography>
                <Typography variant="caption" color="text.secondary">UPI ID: 7020572471@ibl</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">VERSION</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#4F46E5" }}>{active?.version ? `v${active.version}` : "v0"}</Typography>
                    </Box>
                    <Button size="small" variant="text" onClick={refresh} sx={{ fontSize: "0.7rem" }}>Refresh</Button>
                  </Stack>
                  <Box sx={{ bgcolor: "#f1f5f9", p: 1, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <Typography sx={{ fontFamily: "monospace", fontSize: 10, wordBreak: "break-all", color: "#475569" }}>
                      {active?.code_value || "No active string"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" startIcon={<AutorenewRounded />} onClick={rotate} disabled={loading} sx={{ borderRadius: "8px", textTransform: "none", bgcolor: "#4F46E5" }}>Rotate</Button>
                    <Button variant="outlined" size="small" startIcon={<ContentCopyRounded />} onClick={() => copy(active?.code_value, "UPI")} sx={{ borderRadius: "8px", textTransform: "none" }}>Copy</Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* SECTION 2: ATTENDANCE QR */}
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e1b4b" }}>
            Attendance QR
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Weekly security rotation. (Enabled only on Mondays)
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ 
          borderRadius: "12px", 
          borderLeft: "6px solid #EF4444",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
              <Box sx={{ width: 200, height: 200, display: "grid", placeItems: "center", bgcolor: "#fef2f2", borderRadius: "8px", border: "1px solid #fee2e2" }}>
                {attendanceQrUrl ? (
                  <img src={attendanceQrUrl} alt="Attendance QR" style={{ width: "100%", height: "100%" }} />
                ) : (
                  <QrCode2Rounded sx={{ fontSize: 40, color: "#fecaca" }} />
                )}
              </Box>

              <Box sx={{ flex: 1, width: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Security Validator</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: isLocked ? "#dc2626" : "#16a34a" }}>
                  {!isMonday 
                    ? "🔒 Locked: Rotation only allowed on Monday" 
                    : isLocked 
                      ? `⏳ Cooldown: ${daysLeft} days remaining` 
                      : "🔓 Ready for Monday Rotation"}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">TOKEN VERSION</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#ef4444" }}>{attendanceActive?.version ? `v${attendanceActive.version}` : "v0"}</Typography>
                    </Box>
                    <Button size="small" variant="text" color="error" onClick={refresh} sx={{ fontSize: "0.7rem" }}>Refresh Status</Button>
                  </Stack>

                  <Box sx={{ bgcolor: "#fff1f2", p: 1, borderRadius: "6px", border: "1px solid #fee2e2" }}>
                    <Typography sx={{ fontFamily: "monospace", fontSize: 10, wordBreak: "break-all", color: "#991b1b" }}>
                      {attendanceActive?.code_value || "No active token"}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="contained" 
                      color="error" 
                      size="small" 
                      startIcon={<AutorenewRounded />} 
                      onClick={rotateAttendance} 
                      disabled={loading || isLocked || !isMonday} 
                      sx={{ borderRadius: "8px", textTransform: "none" }}
                    >
                      Rotate Weekly
                    </Button>
                    <Button variant="outlined" color="error" size="small" startIcon={<ContentCopyRounded />} onClick={() => copy(attendanceActive?.code_value, "Token")} sx={{ borderRadius: "8px", textTransform: "none" }}>Copy</Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}