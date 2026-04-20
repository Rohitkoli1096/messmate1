import axios from "axios";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

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
  scan: () => API.post("/attendance/scan"),
  getMy: (month, year) => API.get(`/attendance/my?month=${month}&year=${year}`),
  getDaily: (date) => API.get(`/attendance/daily?date=${date}`),
  getStats: () => API.get("/attendance/stats"),
  getWeekly: () => API.get("/attendance/weekly"),
  absenceCheck: () => API.post("/attendance/absence-check"),
};

export const subscriptionsAPI = {
  getMy: () => API.get("/subscriptions/my"),
  getAll: () => API.get("/subscriptions"),
  assign: (data) => API.post("/subscriptions", data),
  extend: (id, days) => API.put(`/subscriptions/${id}/extend`, { days }),
  // Added for Dashboard
  getExpiring: () => API.get("/subscriptions/expiring"),
};

export const paymentsAPI = {
  getAll: () => API.get("/payments"),
  getMy: () => API.get("/payments/my"),
  update: (id, data) => API.put(`/payments/${id}`, data),
  uploadScreenshot: (formData) =>
    API.post("/payments/upload-screenshot", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const notificationsAPI = {
  getMy: () => API.get("/notifications/my"),
  markRead: () => API.put("/notifications/mark-read"),
  getUnreadCount: () => API.get("/notifications/unread-count"),
  // Added for Meal Notifications
  sendMealUpdate: (data) => API.post("/notifications/send-meal-update", data),
};

export default API;