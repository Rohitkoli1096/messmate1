DROP DATABASE IF EXISTS messmate;
CREATE DATABASE messmate;
USE messmate;


-- 1. Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  room VARCHAR(20),
  role ENUM('admin','student') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. Subscriptions
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_type ENUM('full','single') NOT NULL,
  duration ENUM('1month','15days') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Attendance
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  meal_type ENUM('lunch','dinner') NOT NULL,
  status ENUM('present','absent') DEFAULT 'present',
  scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (user_id, date, meal_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Payments (CRITICAL FIX FOR DELETE ERROR)
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subscription_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  screenshot_url VARCHAR(255),
  status ENUM('pending','partial','paid') DEFAULT 'pending',
  verified_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Both foreign keys MUST have ON DELETE CASCADE
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- 5. Notifications (ENUM FIX FOR MEAL ERROR)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

---
--- SEED DATA ---
---
select * from users
  
-- This sets the password for 'admin' to 'admin123' (assuming standard bcrypt)
UPDATE users 
SET password = '$2a$10$oap.AWhUxJxdFOh1Q/Onw.S6Q7m1Q4KbqUgATCc.GOUtrX4mPBJtO' 
WHERE username = 'admin';

INSERT INTO users (name, username, password, role) VALUES
('Rohit', 'rohit', '$2a$10$oap.AWhUxJxdFOh1Q/Onw.S6Q7m1Q4KbqUgATCc.GOUtrX4mPBJtO', 'admin');
('Admin', 'admin', '$2a$10$oap.AWhUxJxdFOh1Q/Onw.S6Q7m1Q4KbqUgATCc.GOUtrX4mPBJtO', 'admin');

INSERT INTO users (name, username, password, phone, room, role) VALUES
('Rohit Sharma', 'rohit.s', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543210', 'A-204', 'student'),
('Priya Verma', 'priya.v', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543211', 'B-102', 'student'),
('Ankit Joshi', 'ankit.j', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543212', 'A-301', 'student');

-- Drop and recreate to match your backend logic exactly
DROP TABLE IF EXISTS qr_codes;
USE messmate;
-- Track specific payment attempts and receipts
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    title VARCHAR(100) NOT NULL, -- e.g., 'April Premium Plan'
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    status ENUM('PAID', 'PENDING', 'PARTIAL', 'FAILED') DEFAULT 'PENDING',
    method VARCHAR(50) DEFAULT 'UPI',
    utr_number VARCHAR(100),
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qr_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scope VARCHAR(50) DEFAULT 'payment',
  code_value TEXT NOT NULL,
  version INT DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT NULL,
  revoked_at TIMESTAMP NULL,
  revoked_reason VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert an initial record so the app has something to show immediately
INSERT INTO qr_codes (scope, code_value, version, is_active) 
VALUES ('payment', 'upi://pay?pa=7020572471@ibl&pn=MessMate&cu=INR', 1, 1);