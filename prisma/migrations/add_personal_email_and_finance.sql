-- Add personal email and subjects to users
ALTER TABLE users ADD COLUMN personal_email TEXT;
ALTER TABLE users ADD COLUMN subjects TEXT;

-- Create Payslip table
CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  basic_salary REAL NOT NULL,
  allowances REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net_salary REAL NOT NULL,
  payment_date TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create FinancialRecord table
CREATE TABLE IF NOT EXISTS financial_records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  user_id INTEGER,
  status TEXT DEFAULT 'completed',
  reference_number TEXT,
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create TimetableEntry table
CREATE TABLE IF NOT EXISTS timetable_entries (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  course_id INTEGER NOT NULL,
  tutor_id INTEGER NOT NULL,
  room TEXT,
  type TEXT DEFAULT 'lecture',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (tutor_id) REFERENCES users(id)
);

-- Create TimetableDocument table
CREATE TABLE IF NOT EXISTS timetable_documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
