'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentPortal from '@/pages/student/StudentPortal';

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentPortal />
    </ProtectedRoute>
  );
}