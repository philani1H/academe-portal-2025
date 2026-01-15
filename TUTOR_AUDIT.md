# Tutor System Audit

## Frontend Files
- src/pages/tutor/TutorDashboard.tsx
- src/pages/tutor/analytics-dashboard.tsx
- src/pages/tutor/course-management.tsx
- src/pages/tutor/file-upload.tsx
- src/pages/tutor/notification-system.tsx
- src/pages/tutor/student-management.tsx
- src/pages/tutor/test-management.tsx

## Backend Endpoints to Audit

### Tutor-Specific Endpoints
- GET /api/tutor/:tutorId/students (line 1148)
- GET /api/tutor/dashboard (line 4747)
- GET /api/tutor/stats (line 4906)
- POST /api/tutor/students/invite (line 2576)
- POST /api/tutor/email/send (line 2668)
- POST /api/tutor/live-session/notify (line 2746)
- POST /api/tutor/material/notify (line 2811)

### Shared Endpoints (Need Tutor Filtering)
- POST /api/admin/students/invite (line 1347) - allows tutor role
- GET /api/courses (needs tutorId filter)
- GET /api/tests (needs tutor filter)
- POST /api/upload (needs tutor scoping)
- GET /api/materials (needs tutor filter)

## Issues to Fix
1. [ ] Verify all course queries filter by tutorId
2. [ ] Verify all student queries filter by tutor's courses
3. [ ] Verify upload scoping
4. [ ] Verify email sending
5. [ ] Verify test/assessment isolation
6. [ ] Check dashboard analytics
7. [ ] Test all buttons work
