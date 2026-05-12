import axios from "axios";
import toast from "react-hot-toast";

/**
 * TITAN OS - API CORE
 * Industrial-grade networking layer with auto-interception and token management.
 */
const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL
    ? `${process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")}/api`
    : "https://messmate1.onrender.com/api", // Fallback to your local port
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// --- SECURE REQUEST INTERCEPTOR ---
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// --- GLOBAL RESPONSE & ERROR INTERCEPTOR ---
API.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (err) => {
    const status = err.response?.status;
    const errorMsg = err.response?.data?.message || "COMMUNICATION_FAULT_DETECTED";

    if (status === 401) {
      localStorage.clear();
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (status === 409 || status === 429) {
      toast.error(errorMsg, { icon: '⚠️' });
    }

    if (status === 500) {
      toast.error("INTERNAL_SERVER_FAULT");
    }

    return Promise.reject(err);
  }
);

// ==========================================
// ENDPOINT MODULES
// ==========================================

export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  changePassword: (data) => API.post("/auth/change-password", data),
};

export const studentsAPI = {
  getAll: () => API.get("/students"),
  getOne: (id) => API.get(`/students/${id}`),
  create: (data) => API.post("/students", data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
};

export const attendanceAPI = {
  markAttendance: (code_value) => API.post("/qr/mark-attendance", { code_value }),
  getMy: (month, year) => API.get(`/qr/my?month=${month}&year=${year}`),
  getAllLogs: () => API.get("/qr/attendance-logs"),
  
  /**
   * TITAN OS CORE UPDATE:
   * Supports single date (?date=) and range queries (?start= & end=)
   * This is required for the Monthly PDF Export feature.
   */
  getDaily: (date, endDate = null) => {
    if (endDate) {
      return API.get(`/attendance/daily?start=${date}&end=${endDate}`);
    }
    return API.get(`/attendance/daily?date=${date}`);
  },
  
  getStats: () => API.get("/attendance/stats"),
  getWeekly: () => API.get("/attendance/weekly"),
};

export const subscriptionsAPI = {
  getMy: () => API.get("/subscriptions/my"),
  getAll: () => API.get("/subscriptions"),
  assign: (data) => API.post("/subscriptions", data),
  extend: (id, days) => API.put(`/subscriptions/${id}/extend`, { days }),
  getExpiring: () => API.get("/subscriptions/expiring"),
};

export const paymentsAPI = {
  getAll: () => API.get("/payments"),
  getMy: () => API.get("/payments/my"), 
  getDetails: (studentId) => API.get(`/payments/payment-details/${studentId}`),
  submitSettlement: (data) => API.post("/payments/submit-settlement", data),
  update: (id, data) => API.put(`/payments/${id}`, data),
  createOrder: (sub_id) => API.post("/payments/orders", { subscription_id: sub_id }),
  verifyCheckout: (payload) => API.post("/payments/verify-checkout", payload),
  uploadScreenshot: (formData) =>
    API.post("/payments/upload-screenshot", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const notificationsAPI = {
  getMy: () => API.get("/notifications/my"),
  markRead: () => API.put("/notifications/mark-read"),
  getUnreadCount: () => API.get("/notifications/unread-count"),
  sendMealUpdate: (data) => API.post("/notifications/send-meal-update", data),
};

export const qrAPI = {
  getActivePayment: () => API.get("/qr/active"),
  rotatePayment: () => API.post("/qr/rotate", {}),
  getActiveAttendance: () => API.get("/qr/active-attendance"),
  rotateAttendance: () => API.post("/qr/rotate-attendance", {}),
};

export default API;