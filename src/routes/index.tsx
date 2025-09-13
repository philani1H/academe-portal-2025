import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import SetPassword from '../pages/auth/SetPassword';

import Dashboard from '../pages/Dashboard';
import StudentPortal from '../pages/student/StudentPortal';
import TutorPortal from '../pages/tutor/TutorPortal';
import AdminPortal from '../pages/admin/AdminPortal';
import Unauthorized from '../pages/Unauthorized';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/set-password" element={<SetPassword />} />

      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentPortal />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tutor/*"
        element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorPortal />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPortal />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};