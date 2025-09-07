'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AdminDashboard from '@/pages/admin/AdminDashboard';

export default function TutorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['tutor', 'admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}