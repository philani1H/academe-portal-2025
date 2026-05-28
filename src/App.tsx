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
import { readContentCache, writeContentCache } from "@/lib/contentCache";
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
  
  // Initialise from cache so modals appear instantly on returning visits
  const cachedSiteSettings = readContentCache<{ maintenance: boolean; agreement: boolean; popup: { active: boolean; image: string; link: string } }>('site-settings');
  const [isAgreementMet, setIsAgreementMet] = useState(cachedSiteSettings?.agreement ?? true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(cachedSiteSettings?.maintenance ?? false);
  const [settingsLoaded, setSettingsLoaded] = useState(true); // never block rendering

  // Promo Popup State
  const [promoPopup, setPromoPopup] = useState({
    active: cachedSiteSettings?.popup?.active ?? false,
    image: cachedSiteSettings?.popup?.image ?? "",
    link: cachedSiteSettings?.popup?.link ?? ""
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiFetch<any[]>("/api/admin/content/site-settings");
        const list = Array.isArray(data) ? data : [];
        const maintRow = list.find((r) => String(r.key).toLowerCase() === "system_maintenance_mode");
        const agreementRow = list.find((r) => String(r.key).toLowerCase() === "system_agreement_met");
        const popupActiveRow = list.find((r) => String(r.key).toLowerCase() === "system_popup_active");
        const popupImageRow = list.find((r) => String(r.key).toLowerCase() === "system_popup_image");
        const popupLinkRow = list.find((r) => String(r.key).toLowerCase() === "system_popup_link");

        const maintenance = maintRow ? (String(maintRow.value).toLowerCase() === "true" || String(maintRow.value) === "1") : false;
        const agreement = agreementRow ? !(String(agreementRow.value).toLowerCase() === "false" || String(agreementRow.value) === "0") : true;
        const popupActive = popupActiveRow ? (String(popupActiveRow.value).toLowerCase() === "true" || String(popupActiveRow.value) === "1") : false;
        const popupImage = popupImageRow ? String(popupImageRow.value) : "";
        const popupLink = popupLinkRow ? String(popupLinkRow.value) : "";

        setIsMaintenanceMode(maintenance);
        setIsAgreementMet(agreement);
        setPromoPopup({ active: popupActive, image: popupImage, link: popupLink });

        writeContentCache('site-settings', { maintenance, agreement, popup: { active: popupActive, image: popupImage, link: popupLink } });
      } catch (error) {
        console.error("Error loading site settings:", error);
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
