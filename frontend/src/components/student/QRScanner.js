import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import QrCodeScannerRounded from "@mui/icons-material/QrCodeScannerRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import toast from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api";

export default function QRScanner() {
  const [status, setStatus] = useState("idle"); // idle | scanning | success | error
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);
  const isProcessing = useRef(false); // BUG FIX: Prevents double-scanning
  const regionId = "mm-qr-reader";

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        // Do not clear the reference here to allow reuse
      }
    } catch (err) {
      console.warn("Scanner stop error:", err);
    }
  }, []);

  const startScanner = async () => {
    // Reset states
    setStatus("scanning");
    setMessage("");
    isProcessing.current = false;

    // Initialize scanner if not already created
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(regionId);
    }

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          // BUG FIX: Ignore if we are already talking to the server
          if (isProcessing.current) return;
          isProcessing.current = true;

          // Stop camera immediately to save resources and provide feedback
          await stopScanner();

          try {
            // Processing logic
            const res = await api.post("/qr/mark-attendance", { code_value: decodedText });
            
            setStatus("success");
            const successMsg = res.data?.message || "Attendance marked successfully!";
            setMessage(successMsg);
            toast.success(successMsg);
            
          } catch (err) {
            const errorMsg = err?.response?.data?.message || "Invalid Attendance QR";
            setStatus("error");
            setMessage(errorMsg);
            toast.error(errorMsg);
          } finally {
            isProcessing.current = false;
          }
        },
        () => {} // Framework internal errors
      );
    } catch (err) {
      setStatus("error");
      setMessage("Camera permission denied or unavailable");
      toast.error("Camera permission denied");
    }
  };

  useEffect(() => {
    return () => {
      // Clean up on component unmount
      if (scannerRef.current) {
        stopScanner().then(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, [stopScanner]);

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Scan Attendance QR
        </Typography>
        <Typography color="text.secondary">
          Scan the weekly QR code at the mess counter. You must have an active plan to mark attendance.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box
            id={regionId}
            sx={{
              width: "100%",
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
              minHeight: 320,
            }}
          />

          {message ? (
            <Typography
              sx={{
                mt: 2,
                fontWeight: 800,
                color: status === "success" ? "success.main" : status === "error" ? "error.main" : "text.primary",
              }}
            >
              {message}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<QrCodeScannerRounded />}
              onClick={startScanner}
              disabled={status === "scanning"}
            >
              {status === "scanning" ? "Scanning..." : "Start camera"}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RestartAltRounded />} 
              onClick={() => {
                setStatus("idle");
                setMessage("");
                startScanner();
              }}
            >
              Reset
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Weekly System</Typography>
          <Typography color="text.secondary">
            QR codes are updated weekly. Ensure you scan the current one. Duplicate scans for the same meal are blocked.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}