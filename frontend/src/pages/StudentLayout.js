import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

// Clean, Professional Icons
import HomeRounded from "@mui/icons-material/HomeOutlined";
import CalendarMonthRounded from "@mui/icons-material/CalendarTodayOutlined";
import QrCodeScannerRounded from "@mui/icons-material/QrCodeScannerRounded";
import PaymentsRounded from "@mui/icons-material/AccountBalanceWalletOutlined";
import PersonRounded from "@mui/icons-material/PersonOutlineRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";

import { useRealtime } from "../realtime/RealtimeProvider";

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useRealtime() || { unreadCount: 0 };

  const currentTab = location.pathname.split("/")[2] || "home";

  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: "auto",
        minHeight: "100vh",
        bgcolor: "#FFFFFF", 
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* 1. HEADER WITH BRAND LOGO */}
      <AppBar 
        position="sticky" 
        sx={{ 
          background: "rgba(255, 255, 255, 0.8)", 
          backdropFilter: "blur(15px)",
          borderBottom: "1px solid #F1F5F9",
          zIndex: 1100 
        }} 
        elevation={0}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: 2.5 }}>
          <Box 
            sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: 'pointer' }}
            onClick={() => navigate("/student/home")}
          >
            {/* --- SVG MEAL LOGO START --- */}
            <Box sx={{ position: "relative", display: "flex" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Plate Circle */}
                <circle cx="12" cy="12" r="10" fill="url(#studentMealGradient)" />
                {/* Stylized Fork */}
                <path d="M9 7V11M7.5 7V10C7.5 10.5523 7.94772 11 8.5 11H9.5C10.0523 11 10.5 10.5523 10.5 10V7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M9 11V17" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                {/* Stylized Knife */}
                <path d="M14 7V17M14 7C14 7 16.5 7.5 16.5 10V11C16.5 11 14 11 14 11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                
                <defs>
                  <linearGradient id="studentMealGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4F46E5" />
                    <stop offset="1" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Subtle Decorative Sparkle */}
              <motion.div 
                animate={{ opacity: [0, 1, 0] }} 
                transition={{ repeat: Infinity, duration: 2.5 }}
                style={{ position: "absolute", top: -4, right: -4 }}
              >
                <Typography sx={{ fontSize: 10 }}>✨</Typography>
              </motion.div>
            </Box>
            {/* --- SVG MEAL LOGO END --- */}

            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>
              Mess<span style={{ color: "#4F46E5" }}>Mate</span>
            </Typography>
          </Box>

          <IconButton onClick={() => navigate("/student/notifications")} sx={{ bgcolor: "#F8FAFC" }}>
            <Badge color="primary" variant="dot" invisible={unreadCount === 0}>
              <NotificationsNoneRounded sx={{ color: "#64748B", fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 2. CONTENT */}
      <Box sx={{ flex: 1, p: 2, pb: 12 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* 3. BOTTOM NAV */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 500,
          zIndex: 1000,
          bgcolor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid #F1F5F9",
          pb: "calc(8px + env(safe-area-inset-bottom))", 
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: 64 }}>
          <NavItem 
            active={currentTab === "home"} 
            icon={<HomeRounded />} 
            label="Home" 
            onClick={() => navigate("/student/home")} 
          />
          <NavItem 
            active={currentTab === "diary"} 
            icon={<CalendarMonthRounded />} 
            label="Diary" 
            onClick={() => navigate("/student/diary")} 
          />
          
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/student/scan")}
              style={{
                background: "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: "15px",
                width: "75px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 16px -4px rgba(79, 70, 229, 0.4)",
              }}
            >
              <QrCodeScannerRounded sx={{ fontSize: 24 }} />
            </motion.button>
          </Box>

          <NavItem 
            active={currentTab === "payment"} 
            icon={<PaymentsRounded />} 
            label="Pay" 
            onClick={() => navigate("/student/payment")} 
          />
          <NavItem 
            active={currentTab === "profile"} 
            icon={<PersonRounded />} 
            label="Me" 
            onClick={() => navigate("/student/profile")} 
          />
        </Box>
      </Box>
    </Box>
  );
}

function NavItem({ active, icon, label, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flex: 1,
        position: "relative",
        height: "100%",
        gap: 0.5
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-line"
          style={{
            position: "absolute",
            top: 0,
            width: "32px",
            height: "3px",
            backgroundColor: "#4F46E5",
            borderRadius: "0 0 4px 4px"
          }}
        />
      )}

      <Box sx={{ color: active ? "#4F46E5" : "#94A3B8", transition: "color 0.2s", display: 'flex' }}>
        {React.cloneElement(icon, { sx: { fontSize: 22 } })}
      </Box>
      
      <Typography variant="caption" sx={{ fontSize: "10px", fontWeight: active ? 800 : 600, color: active ? "#4F46E5" : "#94A3B8" }}>
        {label}
      </Typography>
    </Box>
  );
}