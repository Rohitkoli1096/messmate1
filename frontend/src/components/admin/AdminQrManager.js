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
  // Payment QR States
  const [active, setActive] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  
  // Attendance QR States
  const [attendanceActive, setAttendanceActive] = useState(null);
  const [attendanceQrUrl, setAttendanceQrUrl] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  const [loading, setLoading] = useState(false);

  const getData = (res) => (res?.code_value ? res : res?.data);

  const refresh = async () => {
    try {
      // Sync Payment QR
      const res = await api.get("/qr/active");
      setActive(getData(res) || null);

      // Sync Attendance QR
      const attRes = await api.get("/qr/active-attendance");
      const attData = getData(attRes);
      setAttendanceActive(attData || null);

      // Check 7-day Lock Logic
      if (attData?.created_at) {
        const diff = (new Date() - new Date(attData.created_at)) / (1000 * 60 * 60 * 24);
        if (diff < 7) {
          setIsLocked(true);
          setDaysLeft(Math.ceil(7 - diff));
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

  // Generate Payment QR Image
  useEffect(() => {
    if (active?.code_value) {
      QRCode.toDataURL(active.code_value, { width: 280, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(""));
    }
  }, [active]); // Simplified dependency

  // Generate Attendance QR Image - FIXED TRIGGER
  useEffect(() => {
    if (attendanceActive?.code_value) {
      QRCode.toDataURL(attendanceActive.code_value, { width: 280, margin: 1 })
        .then((url) => setAttendanceQrUrl(url))
        .catch(() => setAttendanceQrUrl(""));
    } else {
      setAttendanceQrUrl("");
    }
  }, [attendanceActive]); // Simplified dependency

  // Rotate Payment
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

  // Rotate Attendance
  const rotateAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.post("/qr/rotate-attendance", {});
      const data = getData(res);
      setAttendanceActive(data);
      await refresh(); 
      toast.success("Attendance QR Rotated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Attendance Rotation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} Copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Stack spacing={4}>
      {/* SECTION 1: PAYMENT QR */}
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Payment QR
          </Typography>
          <Typography color="text.secondary">
            Students scan this QR to pay. Version updates on every rotation.
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
              <Box sx={{ minWidth: 280, display: "grid", placeItems: "center" }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Payment QR" style={{ width: 280, height: 280, borderRadius: "8px" }} />
                ) : (
                  <Box sx={{ width: 280, height: 280, borderRadius: 3, border: "1px dashed", borderColor: "divider", display: "grid", placeItems: "center", color: "text.secondary", bgcolor: "#fafafa" }}>
                    <Stack alignItems="center">
                      <QrCode2Rounded sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="caption">{active ? "Generating Image..." : "No Active QR"}</Typography>
                    </Stack>
                  </Box>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 0.5 }}>System Configuration</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Current UPI ID: <strong>7020572471@ibl</strong></Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.25}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Current Version</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{active?.version ? `v${active.version}` : "Not Set"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Raw Payload</Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", mt: 0.5, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>{active?.code_value || "Connect to database"}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                    <Button variant="contained" startIcon={<AutorenewRounded />} onClick={rotate} disabled={loading}>Rotate QR</Button>
                    <Button variant="outlined" startIcon={<ContentCopyRounded />} onClick={() => copy(active?.code_value, "UPI Link")}>Copy UPI</Button>
                    <Button variant="text" onClick={refresh}>Refresh</Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* SECTION 2: ATTENDANCE QR */}
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Attendance QR
          </Typography>
          <Typography color="text.secondary">
            Students scan this to mark attendance. Rotates weekly for security.
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
              <Box sx={{ minWidth: 280, display: "grid", placeItems: "center" }}>
                {attendanceQrUrl ? (
                  <img src={attendanceQrUrl} alt="Attendance QR" style={{ width: 280, height: 280, borderRadius: "8px" }} />
                ) : (
                  <Box sx={{ width: 280, height: 280, borderRadius: 3, border: "1px dashed", borderColor: "divider", display: "grid", placeItems: "center", color: "text.secondary", bgcolor: "#fafafa" }}>
                    <Stack alignItems="center">
                      <QrCode2Rounded sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="caption">{attendanceActive ? "Generating Image..." : "No Active QR"}</Typography>
                    </Stack>
                  </Box>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Attendance Validator</Typography>
                <Typography variant="body2" color={isLocked ? "error" : "success.main"} sx={{ mb: 2 }}>
                  {isLocked ? `Locked: Available in ${daysLeft} days` : "Ready for Weekly Rotation"}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.25}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Current Version</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{attendanceActive?.version ? `v${attendanceActive.version}` : "Not Set"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Attendance Token</Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", mt: 0.5, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>{attendanceActive?.code_value || "No Active Secret"}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                    <Button variant="contained" startIcon={<AutorenewRounded />} onClick={rotateAttendance} disabled={loading || isLocked}>Rotate Weekly</Button>
                    <Button variant="outlined" startIcon={<ContentCopyRounded />} onClick={() => copy(attendanceActive?.code_value, "Attendance Token")}>Copy Link</Button>
                    <Button variant="text" onClick={refresh}>Refresh</Button>
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