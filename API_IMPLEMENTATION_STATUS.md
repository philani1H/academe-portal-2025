# API Implementation Status & Required Work

## 🎯 Overview

This document outlines the current status of API endpoints and identifies what needs to be implemented to ensure all admin, tutor, and student dashboard operations properly save to the database.

---

## ⚠️ CRITICAL ISSUE IDENTIFIED

**Problem:** Many API endpoints are defined as Next.js API routes in `/src/pages/api/` but this is a **Vite + React Router** project, NOT Next.js. These Next.js routes will NOT work.

**Solution:** All endpoints must be implemented in the Express server (`/src/server/index.ts`).

---

## 📊 Current Status

### ✅ ADMIN DASHBOARD - Fully Implemented
All admin content management endpoints are implemented in Express and working:
- `/api/admin/content/hero` - ✅ GET, POST, PUT
- `/api/admin/content/features` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/pricing` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/testimonials` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/team-members` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/tutors` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/subjects` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/navigation` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/site-settings` - ✅ GET, POST, PUT, DELETE
- `/api/admin/content/announcements` - ✅ GET, POST, PUT, DELETE
- All other admin content endpoints - ✅ Implemented
- Bulk upload endpoints - ✅ Implemented

**Status:** 100% Complete ✅

---

### ⚠️ STUDENT DASHBOARD - Partially Implemented

#### Currently Implemented in Express:
- ✅ `GET /api/student/dashboard` - Fetch dashboard data
- ✅ `GET /api/student/live-sessions` - Fetch live sessions
- ✅ `GET /api/students` - List students
- ✅ `POST /api/students/bulk` - Bulk create students

#### ❌ NOT Implemented (Only exist as Next.js routes):
- ❌ `POST /api/student/assignments` - Submit assignment
- ❌ `GET /api/student/assignments` - Get assignments
- ❌ `POST /api/student/tests` - Submit test
- ❌ `GET /api/student/tests` - Get tests
- ❌ `POST /api/student/courses` - Enroll in course
- ❌ `DELETE /api/student/courses` - Unenroll from course
- ❌ `GET /api/student/courses` - Get enrolled courses
- ❌ `GET /api/student/scheduled-sessions` - Get scheduled sessions
- ❌ `GET /api/student/events` - SSE events stream

**Status:** 20% Complete - Critical endpoints missing

---

### ⚠️ TUTOR DASHBOARD - Partially Implemented

#### Currently Implemented in Express:
- ✅ `GET /api/tutor/dashboard` - Fetch dashboard data
- ✅ `GET /api/tutor/stats` - Fetch analytics stats
- ✅ `GET /api/tutor/:tutorId/students` - List tutor's students

#### ❌ NOT Implemented (Only exist as Next.js routes):
- ❌ `POST /api/tutor/materials` - Upload course material
- ❌ `DELETE /api/tutor/materials` - Delete material
- ❌ `GET /api/tutor/materials` - Get materials
- ❌ `POST /api/tutor/courses` - Create course
- ❌ `PUT /api/tutor/courses` - Update course
- ❌ `GET /api/tutor/courses` - Get tutor courses
- ❌ `POST /api/tutor/students` - Add/enroll student
- ❌ `PUT /api/tutor/students` - Update student
- ❌ `DELETE /api/tutor/students` - Remove student
- ❌ `GET /api/tutor/students` - Get students
- ❌ `POST /api/tutor/sessions` - Create session
- ❌ `PUT /api/tutor/sessions` - Update session
- ❌ `DELETE /api/tutor/sessions` - Delete session
- ❌ `GET /api/tutor/sessions` - Get sessions
- ❌ `POST /api/tutor/scheduled-sessions` - Schedule session
- ❌ `PUT /api/tutor/scheduled-sessions` - Update scheduled session
- ❌ `DELETE /api/tutor/scheduled-sessions` - Delete scheduled session
- ❌ `GET /api/tutor/scheduled-sessions` - Get scheduled sessions
- ❌ `POST /api/tutor/tests` - Create test (implied from frontend)
- ❌ `PUT /api/tutor/tests` - Update test
- ❌ `DELETE /api/tutor/tests` - Delete test

**Status:** 15% Complete - Most endpoints missing

---

## 🔧 REQUIRED WORK

### Priority 1: Student Endpoints (High Priority)

These are essential for students to submit work and enroll in courses:

```typescript
// 1. Assignment Endpoints
POST   /api/student/assignments      - Submit assignment (saves to assignment_submissions table)
GET    /api/student/assignments      - Get student's assignments

// 2. Test Endpoints
POST   /api/student/tests            - Submit test (saves to test_submissions table)
GET    /api/student/tests            - Get student's tests

// 3. Course Enrollment Endpoints
POST   /api/student/courses          - Enroll in course (creates course_enrollments record)
DELETE /api/student/courses          - Unenroll from course
GET    /api/student/courses          - Get enrolled courses

// 4. Session Endpoints
GET    /api/student/scheduled-sessions - Get upcoming sessions
```

### Priority 2: Tutor Endpoints (High Priority)

These are essential for tutors to manage their courses:

```typescript
// 1. Materials Endpoints
POST   /api/tutor/materials          - Upload material (saves to course_materials table)
DELETE /api/tutor/materials          - Delete material
GET    /api/tutor/materials          - Get course materials

// 2. Course Management
POST   /api/tutor/courses            - Create course
PUT    /api/tutor/courses            - Update course
GET    /api/tutor/courses            - Get tutor's courses

// 3. Student Management
POST   /api/tutor/students           - Enroll student
DELETE /api/tutor/students           - Remove student
PUT    /api/tutor/students           - Update student info

// 4. Test Management
POST   /api/tutor/tests              - Create test (saves to tests and test_questions tables)
PUT    /api/tutor/tests              - Update test
DELETE /api/tutor/tests              - Delete test
GET    /api/tutor/tests              - Get tests

// 5. Assignment Management
POST   /api/tutor/assignments        - Create assignment (saves to assignments table)
PUT    /api/tutor/assignments        - Update assignment
DELETE /api/tutor/assignments        - Delete assignment
GET    /api/tutor/assignments        - Get assignments

// 6. Session Scheduling
POST   /api/tutor/scheduled-sessions - Schedule session (saves to scheduled_sessions table)
PUT    /api/tutor/scheduled-sessions - Update scheduled session
DELETE /api/tutor/scheduled-sessions - Delete scheduled session
GET    /api/tutor/scheduled-sessions - Get scheduled sessions
```

---

## 📦 DATABASE CHANGES COMPLETED

### ✅ Schema Updates (Already Done)

1. **New Models Added:**
   - `Assignment` - Course assignments
   - `AssignmentSubmission` - Student submissions

2. **Table Name Mappings Added:**
   - All models now have correct `@@map()` directives
   - All foreign keys mapped to snake_case

3. **Relations Updated:**
   - User ↔ AssignmentSubmission
   - Course ↔ Assignment
   - Assignment ↔ AssignmentSubmission

### ⚠️ Next Steps for Database:

1. **Run Migration:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name add_assignments_and_fix_mappings
   ```

2. **Or Deploy to Production:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

---

## 🚀 IMPLEMENTATION PLAN

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Implement Student Endpoints (src/server/index.ts)
Add Express routes for:
- Assignments (GET, POST)
- Tests (GET, POST)
- Course Enrollment (GET, POST, DELETE)

### Step 3: Implement Tutor Endpoints (src/server/index.ts)
Add Express routes for:
- Materials (GET, POST, DELETE)
- Tests (GET, POST, PUT, DELETE)
- Assignments (GET, POST, PUT, DELETE)
- Students (POST, PUT, DELETE)
- Courses (POST, PUT)
- Scheduled Sessions (GET, POST, PUT, DELETE)

### Step 4: Test All Endpoints
- Test each endpoint with Postman or similar
- Verify database persistence
- Test error handling

### Step 5: Update Frontend (if needed)
- Ensure frontend is calling correct endpoints
- Update API base URLs if needed

---

## 📝 NOTES

1. **Authentication:** All endpoints should use JWT authentication middleware
2. **Authorization:** Verify user roles (student/tutor/admin)
3. **Validation:** Validate all input data
4. **Error Handling:** Return proper HTTP status codes and error messages
5. **Transactions:** Use Prisma transactions for complex operations

---

## 🎯 SUMMARY

**Total Endpoints Needed:** ~35
**Currently Implemented:** ~8
**Missing:** ~27

**Estimated Work:**
- Schema changes: ✅ DONE
- Student endpoints: ~4-6 hours
- Tutor endpoints: ~8-10 hours
- Testing: ~2-3 hours

**Total:** ~14-19 hours of development work

---

**Last Updated:** 2026-01-18
**Branch:** `claude/fix-admin-seed-error-uaKaR`
**Status:** Schema ready, awaiting endpoint implementation
