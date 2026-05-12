import React, { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";

import { useAuth } from "../context/AuthContext";

const drawerWidth = 280;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = useMemo(
    () => [
      { to: "dashboard", label: "Dashboard", icon: <DashboardRounded /> },
      { to: "students", label: "Students", icon: <PeopleAltRounded /> },
      { to: "attendance", label: "Attendance", icon: <FactCheckRounded /> },
      { to: "payments", label: "Payments", icon: <PaymentsRounded /> },
      { to: "subscriptions", label: "Subscriptions", icon: <CalendarMonthRounded /> },
      { to: "qr", label: "Payment QR", icon: <QrCode2Rounded /> },
    ],
    [],
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#F8FAFC" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
          },
        }}
      >
        {/* LOGO SECTION - MEAL & MESS THEMED */}
        <Box sx={{ p: 3, pt: 2.5 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            {/* Unique Meal Icon */}
            <Box sx={{ position: "relative", display: "flex" }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Plate Circle */}
                <circle cx="12" cy="12" r="10" fill="url(#mealGradient)" />
                {/* Stylized Fork */}
                <path d="M9 7V11M7.5 7V10C7.5 10.5523 7.94772 11 8.5 11H9.5C10.0523 11 10.5 10.5523 10.5 10V7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M9 11V17" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                {/* Stylized Knife */}
                <path d="M14 7V17M14 7C14 7 16.5 7.5 16.5 10V11C16.5 11 14 11 14 11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                
                <defs>
                  <linearGradient id="mealGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4F46E5" />
                    <stop offset="1" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Decorative Sparkle */}
              <motion.div 
                animate={{ opacity: [0, 1, 0] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ position: "absolute", top: -2, right: -2 }}
              >
                <Typography sx={{ fontSize: 12 }}>✨</Typography>
              </motion.div>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 900, color: "#1E293B", letterSpacing: "-0.5px" }}>
                Mess<span style={{ color: "#4F46E5" }}>Mate</span>
              </Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 800, fontSize: "0.6rem", textTransform: "uppercase" }}>
                Meal Management
              </Typography>
            </Box>
          </motion.div>
        </Box>

        <Divider sx={{ mx: 2, mb: 2, opacity: 0.5 }} />

        {/* NAVIGATION LIST */}
        <List sx={{ px: 2, flexGrow: 1 }}>
          {navItems.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <ListItemButton
                component={NavLink}
                to={item.to}
                sx={{
                  borderRadius: "12px",
                  mb: 0.8,
                  py: 1.2,
                  color: "#64748B",
                  "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" },
                  "&.active": {
                    color: "#4F46E5",
                    bgcolor: "#EEF2FF",
                    "& .MuiListItemIcon-root": { color: "#4F46E5" },
                    "& .MuiTypography-root": { fontWeight: 700 }
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ fontSize: "0.95rem" }}
                />
              </ListItemButton>
            </motion.div>
          ))}
        </List>

        {/* USER PROFILE SECTION */}
        <Box sx={{ p: 2, mt: "auto" }}>
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
            <Box sx={{ 
              p: 1.5, borderRadius: "16px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0",
              display: "flex", alignItems: "center", gap: 1.2 
            }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "#4F46E5", fontSize: "0.85rem" }}>
                {user?.name?.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>Admin Access</Typography>
              </Box>
              <IconButton onClick={handleLogout} size="small" sx={{ color: "#94A3B8", "&:hover": { color: "#EF4444" } }}>
                <LogoutRounded fontSize="small" />
              </IconButton>
            </Box>
          </motion.div>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: "rgba(248, 250, 252, 0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>
          <Toolbar sx={{ px: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
            </Typography>
          </Toolbar>
        </AppBar>
        
        {/* PAGE TRANSITION */}
        <Box sx={{ flex: 1, overflow: "auto", p: 4 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}