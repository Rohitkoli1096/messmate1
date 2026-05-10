import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";

import { useAuth } from "../context/AuthContext";

const drawerWidth = 280;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => localStorage.getItem("theme") || "light");

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

  const toggleTheme = () => {
    const next = mode === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.dataset.theme = next;
    setMode(next);
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: 0,
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: "linear-gradient(135deg,#4F46E5,#8B5CF6)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "white",
              }}
            >
              MM
            </Box>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 900 }}>
                MessMate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Admin Console
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        <List sx={{ px: 1.5, py: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{
                borderRadius: 2.5,
                mb: 0.5,
                "&.active": {
                  bgcolor: "action.selected",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: "auto", p: 2 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.username} • Admin
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
            <IconButton onClick={toggleTheme} size="small">
              {mode === "dark" ? <LightModeRounded /> : <DarkModeRounded />}
            </IconButton>
            <IconButton onClick={handleLogout} size="small" color="error">
              <LogoutRounded />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <AppBar position="sticky" color="transparent" elevation={0}>
          <Toolbar sx={{ px: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, flex: 1 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
