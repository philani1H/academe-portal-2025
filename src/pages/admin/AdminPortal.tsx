import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
    {/* Add admin-specific dashboard content */}
  </div>
);

const UserManagement = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">User Management</h2>
    {/* Add user management content */}
  </div>
);

const SystemSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">System Settings</h2>
    {/* Add system settings content */}
  </div>
);

const AdminPortal = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Portal - Welcome, <span className="capitalize">{user?.name || 'Admin'}</span>
          </h1>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<SystemSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminPortal;