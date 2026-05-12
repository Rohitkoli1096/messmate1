import React, { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CssBaseline, ThemeProvider } from "@mui/material";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminLayout from "./pages/AdminLayout"; 
import StudentLayout from "./pages/StudentLayout";
import { createAppTheme } from "./theme";
import { RealtimeProvider } from "./realtime/RealtimeProvider";

// Admin Components
import AdminDashboard from "./components/admin/AdminDashboard";
import ManageStudents from "./components/admin/ManageStudents";
import AttendanceMonitor from "./components/admin/AttendanceMonitor";
import PaymentManagement from "./components/admin/PaymentManagement";
import SubscriptionManagement from "./components/admin/SubscriptionManagement";
import AdminQrManager from "./components/admin/AdminQrManager";

// Student Components
import StudentDashboard from "./components/student/StudentDashboard";
import AttendanceDiary from "./components/student/AttendanceDiary";
import QRScanner from "./components/student/QRScanner";
import PaymentScreen from "./components/student/PaymentScreen";
import SettleBalance from "./components/student/SettleBalance"; 
import NotificationsScreen from "./components/student/NotificationsScreen";
import ProfileScreen from "./components/student/ProfileScreen";

import "./index.css";

// --- AUTH GUARD COMPONENT ---
function RequireAuth({ role }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner"></div>
        <span>Initializing MessMate OS...</span>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
  }
  
  return <Outlet />;
}

// --- MAIN ROUTE CONFIGURATION ---
function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* ADMIN SECURE SUITE */}
      <Route element={<RequireAuth role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="attendance" element={<AttendanceMonitor />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          <Route path="qr" element={<AdminQrManager />} />
        </Route>
      </Route>

      {/* STUDENT SECURE SUITE */}
      <Route element={<RequireAuth role="student" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<StudentDashboard />} />
          <Route path="diary" element={<AttendanceDiary />} />
          <Route path="scan" element={<QRScanner />} />
          
          {/* PAYMENT ROUTES */}
          <Route path="payment" element={<PaymentScreen />} />
          
          {/* INDUSTRY STANDARD: Added :id parameter. 
              This ensures SettleBalance.js can extract the ID via useParams()
          */}
          <Route path="payment/settle-balance/:id" element={<SettleBalance />} />
          
          <Route path="notifications" element={<NotificationsScreen />} />
          <Route 
            path="profile" 
            element={<ProfileScreen onLogout={logout} />} 
          />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  const [mode] = useState(() => localStorage.getItem("theme") || "light");
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RealtimeProvider>
          <BrowserRouter>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: { 
                    fontFamily: "Plus Jakarta Sans, sans-serif", 
                    fontWeight: 700,
                    borderRadius: '16px',
                    background: '#1e293b',
                    color: '#fff'
                },
              }}
            />
            <AppRoutes />
          </BrowserRouter>
        </RealtimeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = {
    loaderContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "12px",
        background: "#f8fafc",
        color: "#6366f1",
        fontWeight: 800,
        letterSpacing: "1px",
        fontFamily: "Plus Jakarta Sans, sans-serif"
    }
};