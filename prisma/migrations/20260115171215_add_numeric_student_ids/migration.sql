-- Add student_number and program_code fields to users table
ALTER TABLE users ADD COLUMN student_number TEXT;
ALTER TABLE users ADD COLUMN program_code INTEGER;

-- Create unique index on student_number
CREATE UNIQUE INDEX users_student_number_key ON users(student_number);
