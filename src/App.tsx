import type React from "react";
import { useState, useEffect } from "react";
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
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NoInternetModal from "./components/NoInternetModal";
import AgreementBlockModal from "./components/AgreementBlockModal";
import MaintenanceModal from "./components/MaintenanceModal";
import PromoPopup from "./components/PromoPopup";
import { Analytics } from "@vercel/analytics/react";

import Dashboard from "./pages/Dashboard";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { apiFetch } from "@/lib/api";
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
  const isLoginRoute = ["/student-login", "/tutor-login", "/admin-login"].includes(location.pathname);
  
  const [isAgreementMet, setIsAgreementMet] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // Promo Popup State
  const [promoPopup, setPromoPopup] = useState({
    active: false,
    image: "",
    link: ""
  });

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
        
        // Popup Settings
        const popupActiveRow = list.find((r) => String(r.key).toLowerCase() === "system_popup_active");
        const popupImageRow = list.find((r) => String(r.key).toLowerCase() === "system_popup_image");
        const popupLinkRow = list.find((r) => String(r.key).toLowerCase() === "system_popup_link");

        if (maintRow) {
          const v = String(maintRow.value).toLowerCase();
          setIsMaintenanceMode(v === "true" || v === "1");
        }
        if (agreementRow) {
          const v = String(agreementRow.value).toLowerCase();
          setIsAgreementMet(!(v === "false" || v === "0"));
        }
        
        if (popupActiveRow) {
          const v = String(popupActiveRow.value).toLowerCase();
          setPromoPopup(prev => ({ ...prev, active: v === "true" || v === "1" }));
        }
        if (popupImageRow) {
          setPromoPopup(prev => ({ ...prev, image: String(popupImageRow.value) }));
        }
        if (popupLinkRow) {
          setPromoPopup(prev => ({ ...prev, link: String(popupLinkRow.value) }));
        }

      } catch (error) {
        console.error("Error loading site settings:", error);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const shouldShowBlocker = !isAdminRoute && !isLoginRoute;

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            {shouldShowBlocker && isMaintenanceMode && <MaintenanceModal />}
            {shouldShowBlocker && !isAgreementMet && !isMaintenanceMode && (
              <AgreementBlockModal />
            )}
            
            <PromoPopup 
              active={promoPopup.active} 
              image={promoPopup.image} 
              link={promoPopup.link} 
            />

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
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/dashboards" element={<DashboardNavigation />} />
            
            {/* Login Routes */}
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/tutor-login" element={<TutorLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Dashboard Routes */}
            <Route path="/students" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentPortal /></ProtectedRoute>} />
            <Route path="/students/*" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentPortal /></ProtectedRoute>} />
            <Route path="/student-portal" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentPortal /></ProtectedRoute>} />
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentPortal /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapper><AdminDashboard /></AdminWrapper></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapper><ContentManagement /></AdminWrapper></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapper><AdminDashboard /></AdminWrapper></ProtectedRoute>} />
            <Route path="/tutors-dashboard" element={<ProtectedRoute allowedRoles={['tutor', 'admin']}><TutorDashboard /></ProtectedRoute>} />
            <Route path="/tutors-dashboard/*" element={<ProtectedRoute allowedRoles={['tutor', 'admin']}><TutorDashboard /></ProtectedRoute>} />
            <Route path="/live-session/:sessionId" element={<LiveClass />} />
            
            {/* Department Routes */}
            <Route path="/financemanagement" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapper><FinanceDashboard /></AdminWrapper></ProtectedRoute>} />
            <Route path="/IT management" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapper><ITDashboard /></AdminWrapper></ProtectedRoute>} />
            
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
    <HelmetProvider>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppInner />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
