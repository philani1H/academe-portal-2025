import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, User, Settings, BookOpen, Users, BarChart3 } from 'lucide-react';

const DashboardNavigation = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dashboard Access
          </h1>
          <p className="text-xl text-gray-600">
            Choose your role to access the appropriate dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Student Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Student Dashboard</CardTitle>
                  <CardDescription>Enhanced student portal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access your courses, assignments, tests, and track your progress with our enhanced student dashboard.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Course Management
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Progress Tracking
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  Tutor Communication
                </div>
              </div>
              <Link to="/student-dashboard">
                <Button className="w-full">
                  Access Student Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tutor Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Tutor Dashboard</CardTitle>
                  <CardDescription>Enhanced tutor portal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage your students, schedule sessions, track progress, and access comprehensive analytics.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  Student Management
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Course Planning
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance Analytics
                </div>
              </div>
              <Link to="/tutor-dashboard">
                <Button className="w-full">
                  Access Tutor Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Admin Dashboard</CardTitle>
                  <CardDescription>Content management system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage all website content, users, courses, and system settings from the admin dashboard.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Settings className="h-4 w-4 mr-2" />
                  Content Management
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  System Analytics
                </div>
              </div>
              <Link to="/admin">
                <Button className="w-full">
                  Access Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Dashboard Features</h3>
              <p className="text-gray-600 mb-4">
                All dashboards are now fully functional with real-time data, comprehensive analytics, 
                and intuitive user interfaces. Each dashboard is tailored to specific user roles and needs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Real-time Data</h4>
                  <p className="text-blue-700">Live updates and real-time information</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-1">Comprehensive Analytics</h4>
                  <p className="text-green-700">Detailed insights and performance metrics</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-1">User-friendly Interface</h4>
                  <p className="text-purple-700">Intuitive design and easy navigation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavigation;