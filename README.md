# 🍛 MessMate – Smart Mess Management System

A full-stack mess management application with React frontend, Node.js backend, and MySQL database.

---

## 📁 Project Structure

```
messmate/
├── backend/          ← Node.js + Express API
├── frontend/         ← React App
└── database/         ← SQL schema & seed data
```

---

## 🚀 Quick Setup (Step by Step)

### Step 1 – Database Setup

1. Open MySQL (XAMPP / MySQL Workbench / terminal)
2. Run the schema file:
   ```sql
   source /path/to/messmate/database/schema.sql
   ```
   Or paste contents of `database/schema.sql` into your MySQL client.

---

### Step 2 – Backend Setup

```bash
cd backend
npm install
```

Edit `.env` file — update your MySQL password:
```
DB_PASSWORD=yourpassword
```

Start backend:
```bash
npm run dev        # development (auto-restart)
npm start          # production
```

Backend runs on: http://localhost:5000

---

### Step 3 – Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

---

## 🔐 Default Login Credentials

| Role    | Username  | Password  |
|---------|-----------|-----------|
| Admin   | admin     | admin123  |
| Student | rohit.s   | pass123   |
| Student | priya.v   | pass123   |
| Student | ankit.j   | pass123   |

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/change-password` — Change password

### Students (Admin only)
- `GET    /api/students` — All students
- `POST   /api/students` — Create student
- `PUT    /api/students/:id` — Update student
- `DELETE /api/students/:id` — Delete student

### Attendance
- `POST /api/attendance/scan` — QR scan (student)
- `GET  /api/attendance/my` — My diary (student)
- `GET  /api/attendance/daily` — Daily report (admin)
- `GET  /api/attendance/stats` — Today stats (admin)
- `GET  /api/attendance/weekly` — Weekly trend (admin)
- `POST /api/attendance/absence-check` — Run absence rule (admin)

### Subscriptions
- `GET  /api/subscriptions/my` — My plan (student)
- `GET  /api/subscriptions` — All plans (admin)
- `POST /api/subscriptions` — Assign plan (admin)
- `PUT  /api/subscriptions/:id/extend` — Extend plan (admin)

### Payments
- `GET /api/payments` — All payments (admin)
- `GET /api/payments/my` — My payment (student)
- `PUT /api/payments/:id` — Update payment (admin)
- `POST /api/payments/upload-screenshot` — Upload proof (student)

### Notifications
- `GET /api/notifications/my` — My notifications
- `PUT /api/notifications/mark-read` — Mark all read
- `GET /api/notifications/unread-count` — Unread count

---

## 💰 Subscription Plans

| Plan             | Duration | Price  |
|------------------|----------|--------|
| Full Meal        | 1 Month  | ₹2200  |
| Full Meal        | 15 Days  | ₹1100  |
| Single Meal      | 1 Month  | ₹1100  |
| Single Meal      | 15 Days  | ₹550   |

---

## ⏰ Meal Windows

- **Lunch:** 12:00 PM – 3:00 PM
- **Dinner:** 7:00 PM – 10:00 PM

---

## 🔥 Absence Rule

If a student has **6 or more continuous absences**, their subscription is automatically extended.  
Run via: `POST /api/attendance/absence-check` (Admin button on Dashboard)

---

## 🛠️ Tech Stack

| Layer     | Technology             |
|-----------|------------------------|
| Frontend  | React 18, React Router |
| Charts    | Recharts               |
| Backend   | Node.js, Express       |
| Database  | MySQL                  |
| Auth      | JWT + bcrypt           |
| Scheduler | node-cron              |
| Uploads   | Multer                 |
| Toasts    | react-hot-toast        |

---

## 📱 Features

- ✅ Student QR scan attendance (time-windowed)
- ✅ Admin dashboard with live stats & charts
- ✅ Subscription management (assign, extend, expire)
- ✅ Payment tracking (total, paid, remaining)
- ✅ UPI screenshot upload + admin verification
- ✅ Auto notifications (expiry: 15d, 7d, 1d)
- ✅ Dinner reminder cron job
- ✅ Absence rule auto-extension
- ✅ Role-based access (admin / student)
- ✅ JWT authentication
- ✅ Attendance diary (calendar view)

---

## 🔮 Future Enhancements

- Face recognition attendance
- PDF bill generation
- SMS notifications (Twilio)
- Analytics & meal prediction
- Mobile app (React Native)

---

Built with ❤️ — MessMate v1.0
