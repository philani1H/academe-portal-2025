-- Database schema for Akademie Portal

CREATE DATABASE IF NOT EXISTS akademie_portal;
USE akademie_portal;

-- Users table for all types of users (admin, tutors, students)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'tutor', 'student') NOT NULL,
  status ENUM('active', 'pending', 'inactive') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP NULL,
  department_id VARCHAR(36) NULL
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor profiles
CREATE TABLE IF NOT EXISTS tutor_profiles (
  user_id VARCHAR(36) PRIMARY KEY,
  specialization VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id VARCHAR(36) PRIMARY KEY,
  progress INT DEFAULT 0,
  grade DECIMAL(5,2) DEFAULT 0.0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department_id VARCHAR(36) NOT NULL,
  tutor_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'pending', 'inactive') NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (tutor_id) REFERENCES users(id)
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  course_id VARCHAR(36),
  student_id VARCHAR(36),
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INT DEFAULT 0,
  grade DECIMAL(5,2) DEFAULT 0.0,
  PRIMARY KEY (course_id, student_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('system', 'course', 'user', 'approval') NOT NULL,
  status ENUM('sent', 'draft') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sender_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Notification recipients
CREATE TABLE IF NOT EXISTS notification_recipients (
  notification_id VARCHAR(36),
  user_id VARCHAR(36),
  read_at TIMESTAMP NULL,
  PRIMARY KEY (notification_id, user_id),
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (id, name, email, password, role, status)
VALUES (UUID(), 'Admin', 'admin@akademie.com', 'admin123', 'admin', 'active')
ON DUPLICATE KEY UPDATE email = email;