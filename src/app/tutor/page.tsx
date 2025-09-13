'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import TutorDashboard from '@/pages/tutor/TutorDashboard';

export default function TutorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['tutor', 'admin']}>
      <TutorDashboard />
    </ProtectedRoute>
  );
}