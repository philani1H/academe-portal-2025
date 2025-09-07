import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Tutors from "./components/Tutors";
import BecomeTutor from "./components/BecomeTutor";
import Testimonies from "./components/Testimonies";
import ContactUs from "./components/ContactUs";
import Subject from "./components/Subject";
import Pricing from "./components/Pricing";
import AboutUs from "./components/AboutUs";
import StudentLogin from "./pages/auth/StudentLogin";
import TutorLogin from "./pages/auth/TutorLogin";
import AdminLogin from "./pages/auth/AdminLogin";

import StudentPortal from "./pages/student/StudentPortal";
import StudentDashboardEnhanced from "./pages/student/StudentDashboardEnhanced";
import StudentDashboardUltimate from "./pages/student/StudentDashboardUltimate";
import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorDashboardEnhanced from "./pages/tutor/TutorDashboardEnhanced";
import TutorDashboardUltimate from "./pages/tutor/TutorDashboardUltimate";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDashboardEnhanced from "./pages/admin/AdminDashboardEnhanced";
import ContentManagement from "./pages/admin/ContentManagement";
import ContentManagementEnhanced from "./pages/admin/ContentManagementEnhanced";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NoInternetModal from "./components/NoInternetModal";
import AgreementBlockModal from "./components/AgreementBlockModal";
import MaintenanceModal from "./components/MaintenanceModal";
import { Analytics } from "@vercel/analytics/react";

import Dashboard from "./pages/Dashboard";

import { useAuth, AuthProvider } from "./contexts/AuthContext";

import UniversityApplication from "./components/UniversityApplication";
import ExamRewrite from "./components/ExamRewrite";
import DashboardNavigation from "./components/DashboardNavigation";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const queryClient = new QueryClient();

const App = () => {
  const isAgreementMet = true; // Set this to true when agreement is met
  const isMaintenanceMode = false; // Control maintenance mode

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <TooltipProvider>
        {isMaintenanceMode && <MaintenanceModal />}
        {!isAgreementMet && !isMaintenanceMode && <AgreementBlockModal />}
        <Toaster />
        <Sonner />
        <NoInternetModal />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/become-tutor" element={<BecomeTutor />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/subjects" element={<Subject />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/testimonials" element={<Testimonies />} />
            <Route path="/university-application" element={<UniversityApplication />} />
            <Route path="/exam-rewrite" element={<ExamRewrite />} />
            <Route path="/dashboards" element={<DashboardNavigation />} />
            
            {/* Login Routes */}
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/tutor-login" element={<TutorLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Dashboard Routes */}
            <Route path="/students" element={<StudentPortal />} />
            <Route path="/students/*" element={<StudentPortal />} />
            <Route path="/student-dashboard" element={<StudentDashboardUltimate />} />
            <Route path="/student-dashboard/*" element={<StudentDashboardUltimate />} />
            <Route path="/admin" element={<AdminDashboardEnhanced />} />
            <Route path="/admin/content" element={<ContentManagement />} />
            <Route path="/admin/content-enhanced" element={<ContentManagementEnhanced />} />
            <Route path="/admin/*" element={<AdminDashboardEnhanced />} />
            <Route path="/tutors-dashboard" element={<TutorDashboard />} />
            <Route path="/tutors-dashboard/*" element={<TutorDashboard />} />
            <Route path="/tutor-dashboard" element={<TutorDashboardUltimate />} />
            <Route path="/tutor-dashboard/*" element={<TutorDashboardUltimate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Analytics />
        </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;