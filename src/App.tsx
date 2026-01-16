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
import TutorDashboard from "./pages/tutor/TutorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContentManagement from "./pages/admin/ContentManagement";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import LiveClass from "./pages/LiveClass";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import ITDashboard from "./pages/it/ITDashboard";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AdminWrapper = ({ children }: { children: React.ReactNode }) => {
  // No maintenance mode or agreement blocking for admin routes
  return <>{children}</>;
};

const queryClient = new QueryClient();

const AppInner = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isAgreementMet, setIsAgreementMet] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiFetch<any[]>("/api/admin/content/site-settings");
        const list = Array.isArray(data) ? data : [];
        const maintRow = list.find(
          (r) => String(r.key).toLowerCase() === "system_maintenance_mode"
        );
        const agreementRow = list.find(
          (r) => String(r.key).toLowerCase() === "system_agreement_met"
        );
        if (maintRow) {
          const v = String(maintRow.value).toLowerCase();
          setIsMaintenanceMode(v === "true" || v === "1");
        }
        if (agreementRow) {
          const v = String(agreementRow.value).toLowerCase();
          setIsAgreementMet(!(v === "false" || v === "0"));
        }
      } catch (error) {
        console.error("Error loading site settings:", error);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            {!isAdminRoute && isMaintenanceMode && <MaintenanceModal />}
            {!isAdminRoute && !isAgreementMet && !isMaintenanceMode && (
              <AgreementBlockModal />
            )}
            <Toaster />
            <Sonner />
            <NoInternetModal />
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
            <Route path="/student-portal" element={<StudentPortal />} />
            <Route path="/student/dashboard" element={<StudentPortal />} />
            <Route path="/admin" element={<AdminWrapper><AdminDashboard /></AdminWrapper>} />
            <Route path="/admin/content" element={<AdminWrapper><ContentManagement /></AdminWrapper>} />
            <Route path="/admin/*" element={<AdminWrapper><AdminDashboard /></AdminWrapper>} />
            <Route path="/tutors-dashboard" element={<TutorDashboard />} />
            <Route path="/tutors-dashboard/*" element={<TutorDashboard />} />
            <Route path="/live-session/:sessionId" element={<LiveClass />} />
            
            {/* Department Routes */}
            <Route path="/financemanagement" element={<AdminWrapper><FinanceDashboard /></AdminWrapper>} />
            <Route path="/IT management" element={<AdminWrapper><ITDashboard /></AdminWrapper>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Analytics />
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
