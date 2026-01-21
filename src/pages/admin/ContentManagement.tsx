"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Settings,
  Home,
  Users,
  Star,
  MessageSquare,
  DollarSign,
  Info,
  Building,
  Mail,
  BookOpen,
  GraduationCap,
  FileText,
  UserPlus,
  Menu,
  ChevronRight,
  ChevronLeft,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bell,
  Layout,
  Navigation,
  Footprints,
  Eye,
  EyeOff,
  Video,
  Image as ImageIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { apiFetch, api } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { BulkUploadDialog } from "@/components/BulkUploadDialog"

import { io } from "socket.io-client"
import { API_BASE } from "@/lib/api"
import * as XLSX from "xlsx"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Types
interface HeroContent {
  id?: string
  title: string
  subtitle: string
  description: string
  buttonText: string
  secondaryButtonText: string
  trustIndicatorText: string
  universities: string[]
  features: Array<{ title: string; description: string; icon: string }>
  backgroundGradient: string
  isActive?: boolean
}

interface Feature {
  id?: string
  title: string
  description: string
  icon: string
  benefits: string[]
  isActive?: boolean
  order?: number
}

interface Announcement {
  id?: string
  title?: string
  content: string
  type: "info" | "warning" | "success"
  pinned: boolean
  isActive?: boolean
  mediaUrl?: string
  mediaType?: "image" | "video"
  created_at?: string
}

interface PricingPlan {
  id?: string
  name: string
  price: string
  period: string
  features: string[]
  notIncluded: string[]
  color: string
  icon: string
  popular: boolean
  isActive?: boolean
  order?: number
}

interface Testimonial {
  id?: string
  content: string
  author: string
  role: string
  subject: string
  improvement: string
  image: string
  rating: number
  isActive?: boolean
  order?: number
}

interface TeamMember {
  id?: string
  name: string
  role: string
  bio: string
  image: string
  isActive?: boolean
  order?: number
}

interface AboutUsContent {
  id?: string
  goal: string
  mission: string
  rolesResponsibilities: Record<string, unknown>
  isActive?: boolean
}

interface Tutor {
  id?: string
  name: string
  subjects: string[]
  image: string
  contactName: string
  contactPhone: string
  contactEmail: string
  description: string
  ratings: Array<Record<string, unknown>>
  isActive?: boolean
  order?: number
}

interface Subject {
  id?: string
  name: string
  description: string
  image: string
  category: string
  tutorsCount: number
  popularTopics: string[]
  difficulty: string[]
  isActive?: boolean
  order?: number
}

interface FooterContent {
  id?: string
  companyName: string
  tagline: string
  contactPhone: string
  contactEmail: string
  contactPerson: string
  whatsappLink: string
  socialLinks: Record<string, string>
  quickLinks: Array<Record<string, string>>
  resourceLinks: Array<Record<string, string>>
  copyrightText: string
  isActive?: boolean
}

interface NavigationItem {
  id?: string
  path: string
  label: string
  type: string
  isActive?: boolean
  order?: number
}

interface ContactUsContent {
  id?: string
  title: string
  description: string
  logo: string
  formEndpoint: string
  contactInfo: Record<string, string>
  isActive?: boolean
}

interface BecomeTutorContent {
  id?: string
  title: string
  description: string
  requirements: string[]
  benefits: string[]
  applicationUrl: string
  formEmbedCode?: string
  isActive?: boolean
}

interface ExamRewriteContent {
  id?: string
  title: string
  description: string
  heroTitle: string
  heroDescription: string
  benefits: string[]
  process: string[]
  subjects: string[]
  applicationFormUrl: string
  grade11FormUrl?: string
  grade12FormUrl?: string
  pricingInfo: Record<string, unknown>
  isActive?: boolean
}

interface UniversityApplicationContent {
  id?: string
  title: string
  description: string
  services: string[]
  process: string[]
  requirements: string[]
  pricing: Record<string, unknown>
  formUrl?: string
  isActive?: boolean
}

// Safe array helper
function safeArray<T>(arr: T[] | null | undefined): NonNullable<T>[] {
  if (!Array.isArray(arr)) return []
  return arr.filter((item): item is NonNullable<T> => item != null)
}

// Navigation items config
const navItems = [
  { id: "overview", label: "Overview", icon: Layout },
  { id: "hero", label: "Hero Section", icon: Home },
  { id: "features", label: "Features", icon: Star },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "pricing", label: "Pricing Plans", icon: DollarSign },
  { id: "testimonials", label: "Testimonials", icon: MessageSquare },
  { id: "team", label: "Team Members", icon: Users },
  { id: "tutors", label: "Tutors", icon: GraduationCap },
  { id: "subjects", label: "Subjects", icon: BookOpen },
  { id: "about", label: "About Us", icon: Info },
  { id: "contact", label: "Contact Us", icon: Mail },
  { id: "navigation", label: "Navigation", icon: Navigation },
  { id: "footer", label: "Footer", icon: Footprints },
  { id: "become-tutor", label: "Become a Tutor", icon: UserPlus },
  { id: "exam-rewrite", label: "Exam Rewrite", icon: FileText },
  { id: "university", label: "University Apps", icon: Building },
  { id: "settings", label: "System Settings", icon: Settings },
]

interface ContentManagementProps {
  onBack?: () => void
}

export default function ContentManagement({ onBack }: ContentManagementProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // State for content
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [siteSettings, setSiteSettings] = useState<any[]>([])
  const [annualDiscountInput, setAnnualDiscountInput] = useState<string>("15")
  const [promotionalDiscountInput, setPromotionalDiscountInput] = useState<string>("0")
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [aboutUsContent, setAboutUsContent] = useState<AboutUsContent | null>(null)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null)
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [contactUsContent, setContactUsContent] = useState<ContactUsContent | null>(null)
  const [becomeTutorContent, setBecomeTutorContent] = useState<BecomeTutorContent | null>(null)
  const [examRewriteContent, setExamRewriteContent] = useState<ExamRewriteContent | null>(null)
  const [universityApplicationContent, setUniversityApplicationContent] = useState<UniversityApplicationContent | null>(
    null,
  )

  // Dialog states
  const [editingHero, setEditingHero] = useState<HeroContent | null>(null)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [editingPricingPlan, setEditingPricingPlan] = useState<PricingPlan | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null)
  const [editingAboutUs, setEditingAboutUs] = useState<AboutUsContent | null>(null)
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [editingFooter, setEditingFooter] = useState<FooterContent | null>(null)
  const [editingNavigation, setEditingNavigation] = useState<NavigationItem | null>(null)
  const [editingContactUs, setEditingContactUs] = useState<ContactUsContent | null>(null)
  const [editingBecomeTutor, setEditingBecomeTutor] = useState<BecomeTutorContent | null>(null)
  const [editingExamRewrite, setEditingExamRewrite] = useState<ExamRewriteContent | null>(null)
  const [editingUniversityApplication, setEditingUniversityApplication] = useState<UniversityApplicationContent | null>(
    null,
  )
  const [announcementPreviewMode, setAnnouncementPreviewMode] = useState(false)

  const [loading, setLoading] = useState(true)
  const [uploadingPricing, setUploadingPricing] = useState(false)
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false)
  const [uploadingAnnouncements, setUploadingAnnouncements] = useState(false)
  const [showAnnouncementBulkUploadDialog, setShowAnnouncementBulkUploadDialog] = useState(false)
  const [uploadingTutors, setUploadingTutors] = useState(false)
  const [showTutorBulkUploadDialog, setShowTutorBulkUploadDialog] = useState(false)
  const [uploadingTutorPlacement, setUploadingTutorPlacement] = useState(false)
  const [showTutorPlacementBulkUploadDialog, setShowTutorPlacementBulkUploadDialog] = useState(false)
  const [uploadingTeam, setUploadingTeam] = useState(false)
  const [showTeamBulkUploadDialog, setShowTeamBulkUploadDialog] = useState(false)

  // Helper functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Use standard upload API (same as Tutor dashboard) to handle large files correctly
      // This bypasses the base64 payload limit and uses local/cloud storage as configured globally
      const res = await api.uploadFile(file)
      return res.url
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
      throw error
    }
  }

  // Fetch functions
  const fetchHeroContent = async () => {
    try {
      const data = await apiFetch<HeroContent | null>("/api/admin/content/hero")
      if (data) setHeroContent(data)
    } catch (error) {
      console.error("Error fetching hero content:", error)
    }
  }

  const fetchFeatures = async () => {
    try {
      const data = await apiFetch<Feature[]>("/api/admin/content/features")
      const list = safeArray(data)
      const normalized = list.map((f) => ({
        ...f,
        benefits: safeArray(f?.benefits),
        isActive: Boolean(f?.isActive),
        order: Number(f?.order ?? 0),
      }))
      setFeatures(normalized)
    } catch (error) {
      console.error("Error fetching features:", error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const data = await apiFetch<Announcement[]>("/api/admin/content/announcements")
      setAnnouncements(safeArray(data))
    } catch (error) {
      console.error("Error fetching announcements:", error)
    }
  }

  const fetchPricingPlans = async () => {
    try {
      const data = await apiFetch<PricingPlan[]>("/api/admin/content/pricing")
      const list = safeArray(data)
      const normalized = list.map((p) => ({
        ...p,
        features: safeArray(p?.features),
        notIncluded: safeArray(p?.notIncluded),
        isActive: Boolean(p?.isActive),
        order: Number(p?.order ?? 0),
      }))
      setPricingPlans(normalized)
    } catch (error) {
      console.error("Error fetching pricing plans:", error)
    }
  }

  const fetchSiteSettings = async () => {
    try {
      const data = await apiFetch<any[]>("/api/admin/content/site-settings")
      const list = Array.isArray(data) ? data : []
      setSiteSettings(list)
      const annualRow = list.find((r) => String(r.key).toLowerCase() === "pricing_annual_discount_percent")
      if (annualRow) setAnnualDiscountInput(String(annualRow.value ?? "15"))
      const promoRow = list.find((r) => String(r.key).toLowerCase() === "pricing_promotional_discount_percent")
      if (promoRow) setPromotionalDiscountInput(String(promoRow.value ?? "0"))
    } catch (error) {
      console.error("Error fetching site settings:", error)
    }
  }

  const fetchTestimonials = async () => {
    try {
      const data = await apiFetch<Testimonial[]>("/api/admin/content/testimonials")
      const list = safeArray(data)
      const normalized = list.map((t) => ({
        ...t,
        rating: Number(t?.rating ?? 0),
        isActive: Boolean(t?.isActive),
        order: Number(t?.order ?? 0),
      }))
      setTestimonials(normalized)
    } catch (error) {
      console.error("Error fetching testimonials:", error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const data = await apiFetch<TeamMember[]>("/api/admin/content/team-members")
      const list = safeArray(data)
      const normalized = list.map((m) => ({
        ...m,
        isActive: Boolean(m?.isActive),
        order: Number(m?.order ?? 0),
      }))
      setTeamMembers(normalized)
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }

  const fetchAboutUsContent = async () => {
    try {
      const data = await apiFetch<AboutUsContent | null>("/api/admin/content/about-us")
      if (data) setAboutUsContent(data)
    } catch (error) {
      console.error("Error fetching about us content:", error)
    }
  }

  const fetchTutors = async () => {
    try {
      const data = await apiFetch<Tutor[]>("/api/admin/content/tutors")
      const list = safeArray(data)
      const normalized = list.map((t) => ({
        ...t,
        subjects: safeArray(t?.subjects),
        ratings: safeArray(t?.ratings),
        isActive: Boolean(t?.isActive),
        order: Number(t?.order ?? 0),
      }))
      setTutors(normalized)
    } catch (error) {
      console.error("Error fetching tutors:", error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const data = await apiFetch<Subject[]>("/api/admin/content/subjects")
      const list = safeArray(data)
      const normalized = list.map((s) => ({
        ...s,
        popularTopics: safeArray(s?.popularTopics),
        difficulty: safeArray(s?.difficulty),
        isActive: Boolean(s?.isActive),
        order: Number(s?.order ?? 0),
      }))
      setSubjects(normalized)
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchFooterContent = async () => {
    try {
      const data = await apiFetch<FooterContent | null>("/api/admin/content/footer")
      if (data) setFooterContent(data)
    } catch (error) {
      console.error("Error fetching footer content:", error)
    }
  }

  const fetchNavigationItems = async () => {
    try {
      const data = await apiFetch<NavigationItem[]>("/api/admin/content/navigation")
      setNavigationItems(safeArray(data))
    } catch (error) {
      console.error("Error fetching navigation items:", error)
    }
  }

  const fetchContactUsContent = async () => {
    try {
      const data = await apiFetch<ContactUsContent | null>("/api/admin/content/contact-us")
      if (data) setContactUsContent(data)
    } catch (error) {
      console.error("Error fetching contact us content:", error)
    }
  }

  const fetchBecomeTutorContent = async () => {
    try {
      const data = await apiFetch<BecomeTutorContent | null>("/api/admin/content/become-tutor")
      if (data) setBecomeTutorContent(data)
    } catch (error) {
      console.error("Error fetching become tutor content:", error)
    }
  }

  const fetchExamRewriteContent = async () => {
    try {
      const data = await apiFetch<ExamRewriteContent | null>("/api/admin/content/exam-rewrite")
      if (data) setExamRewriteContent(data)
    } catch (error) {
      console.error("Error fetching exam rewrite content:", error)
    }
  }

  const fetchUniversityApplicationContent = async () => {
    try {
      const data = await apiFetch<UniversityApplicationContent | null>("/api/admin/content/university-application")
      if (data) setUniversityApplicationContent(data)
    } catch (error) {
      console.error("Error fetching university application content:", error)
    }
  }

  // Real-time updates listener
  useEffect(() => {
    const socket = io(API_BASE.replace('/api', ''), {
      path: "/socket.io",
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on("connect", () => {
      console.log("Connected to content updates socket")
    })

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message)
    })

    socket.on("content-updated", (event: { type: string, action: string, data: any }) => {
      console.log("Content update received:", event)
      // Refresh the specific content type
      switch (event.type) {
        case "hero": fetchHeroContent(); break;
        case "features": fetchFeatures(); break;
        case "announcements": fetchAnnouncements(); break;
        case "pricing": fetchPricingPlans(); break;
        case "site-settings": fetchSiteSettings(); break;
        case "testimonials": fetchTestimonials(); break;
        case "team-members": fetchTeamMembers(); break;
        case "about-us": fetchAboutUsContent(); break;
        case "tutors": fetchTutors(); break;
        case "subjects": fetchSubjects(); break;
        case "footer": fetchFooterContent(); break;
        case "navigation": fetchNavigationItems(); break;
        case "contact-us": fetchContactUsContent(); break;
        case "become-tutor": fetchBecomeTutorContent(); break;
        case "exam-rewrite": fetchExamRewriteContent(); break;
        case "university-application": fetchUniversityApplicationContent(); break;
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchAllContent = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchHeroContent(),
        fetchFeatures(),
        fetchAnnouncements(),
        fetchPricingPlans(),
        fetchSiteSettings(),
        fetchTestimonials(),
        fetchTeamMembers(),
        fetchAboutUsContent(),
        fetchTutors(),
        fetchSubjects(),
        fetchFooterContent(),
        fetchNavigationItems(),
        fetchContactUsContent(),
        fetchBecomeTutorContent(),
        fetchExamRewriteContent(),
        fetchUniversityApplicationContent(),
      ])
    } catch (error) {
      console.error("Error fetching content:", error)
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllContent()
  }, [fetchAllContent])

  // Save functions
  const saveHeroContent = async (content: HeroContent) => {
    try {
      const method = content.id ? "PUT" : "POST"
      const data = await apiFetch<HeroContent>("/api/admin/content/hero", {
        method,
        body: JSON.stringify(content),
      })
      setHeroContent(data)
      setEditingHero(null)
      toast({ title: "Success", description: "Hero content saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save hero content", variant: "destructive" })
    }
  }

  const saveFeature = async (feature: Feature) => {
    try {
      const method = feature.id ? "PUT" : "POST"
      const data = await apiFetch<Feature>("/api/admin/content/features", {
        method,
        body: JSON.stringify(feature),
      })
      if (feature.id) {
        setFeatures(features.map((f) => (f.id === feature.id ? data : f)))
      } else {
        setFeatures([...features, data])
      }
      setEditingFeature(null)
      toast({ title: "Success", description: "Feature saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save feature", variant: "destructive" })
    }
  }

  const deleteFeature = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/features?id=${id}`, { method: "DELETE" })
      setFeatures(features.filter((f) => f.id !== id))
      toast({ title: "Success", description: "Feature deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete feature", variant: "destructive" })
    }
  }

  const saveAnnouncement = async (announcement: Announcement) => {
    try {
      const method = announcement.id ? "PUT" : "POST"
      // Ensure media fields are sent as null if empty, rather than undefined or deleted
      const payload = { ...announcement }
      if (!payload.mediaUrl || payload.mediaUrl.trim() === "") {
        payload.mediaUrl = null as any
        payload.mediaType = null as any
      }
      if (payload.created_at === undefined) delete payload.created_at

      const data = await apiFetch<Announcement>("/api/admin/content/announcements", {
        method,
        body: JSON.stringify(payload),
      })
      if (announcement.id) {
        setAnnouncements(announcements.map((a) => (a.id === announcement.id ? data : a)))
      } else {
        setAnnouncements([...announcements, data])
      }
      setEditingAnnouncement(null)
      toast({ title: "Success", description: "Announcement saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save announcement", variant: "destructive" })
    }
  }

  const deleteAnnouncement = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/announcements?id=${id}`, { method: "DELETE" })
      setAnnouncements(announcements.filter((a) => a.id !== id))
      toast({ title: "Success", description: "Announcement deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete announcement", variant: "destructive" })
    }
  }

  const savePricingPlan = async (plan: PricingPlan) => {
    try {
      const method = plan.id ? "PUT" : "POST"
      const data = await apiFetch<PricingPlan>("/api/admin/content/pricing", {
        method,
        body: JSON.stringify(plan),
      })
      if (plan.id) {
        setPricingPlans(pricingPlans.map((p) => (p.id === plan.id ? data : p)))
      } else {
        setPricingPlans([...pricingPlans, data])
      }
      setEditingPricingPlan(null)
      toast({ title: "Success", description: "Pricing plan saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save pricing plan", variant: "destructive" })
    }
  }

  const deletePricingPlan = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/pricing?id=${id}`, { method: "DELETE" })
      setPricingPlans(pricingPlans.filter((p) => p.id !== id))
      toast({ title: "Success", description: "Pricing plan deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete pricing plan", variant: "destructive" })
    }
  }

  const saveTestimonial = async (testimonial: Testimonial) => {
    try {
      const method = testimonial.id ? "PUT" : "POST"
      const data = await apiFetch<Testimonial>("/api/admin/content/testimonials", {
        method,
        body: JSON.stringify(testimonial),
      })
      if (testimonial.id) {
        setTestimonials(testimonials.map((t) => (t.id === testimonial.id ? data : t)))
      } else {
        setTestimonials([...testimonials, data])
      }
      setEditingTestimonial(null)
      toast({ title: "Success", description: "Testimonial saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save testimonial", variant: "destructive" })
    }
  }

  const deleteTestimonial = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/testimonials?id=${id}`, { method: "DELETE" })
      setTestimonials(testimonials.filter((t) => t.id !== id))
      toast({ title: "Success", description: "Testimonial deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete testimonial", variant: "destructive" })
    }
  }

  const saveTeamMember = async (member: TeamMember) => {
    try {
      const method = member.id ? "PUT" : "POST"
      const data = await apiFetch<TeamMember>("/api/admin/content/team-members", {
        method,
        body: JSON.stringify(member),
      })
      if (member.id) {
        setTeamMembers(teamMembers.map((m) => (m.id === member.id ? data : m)))
      } else {
        setTeamMembers([...teamMembers, data])
      }
      setEditingTeamMember(null)
      toast({ title: "Success", description: "Team member saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save team member", variant: "destructive" })
    }
  }

  const deleteTeamMember = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/team-members?id=${id}`, { method: "DELETE" })
      setTeamMembers(teamMembers.filter((m) => m.id !== id))
      toast({ title: "Success", description: "Team member deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete team member", variant: "destructive" })
    }
  }

  const saveTutor = async (tutor: Tutor) => {
    try {
      const method = tutor.id ? "PUT" : "POST"
      const data = await apiFetch<Tutor>("/api/admin/content/tutors", {
        method,
        body: JSON.stringify(tutor),
      })
      if (tutor.id) {
        setTutors(tutors.map((t) => (t.id === tutor.id ? data : t)))
      } else {
        setTutors([...tutors, data])
      }
      setEditingTutor(null)
      toast({ title: "Success", description: "Tutor saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save tutor", variant: "destructive" })
    }
  }

  const deleteTutor = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/tutors?id=${id}`, { method: "DELETE" })
      setTutors(tutors.filter((t) => t.id !== id))
      toast({ title: "Success", description: "Tutor deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete tutor", variant: "destructive" })
    }
  }

  const createTutorLogin = async (tutor: Tutor) => {
    try {
      const response = await apiFetch<any>("/api/admin/tutors/create-login", {
        method: "POST",
        body: JSON.stringify({
          email: tutor.contactEmail,
          name: tutor.name
        })
      })
      
      if (response.success) {
        if (response.isNew) {
           // Show persistent toast with credentials
           toast({ 
             title: "Login Created", 
             description: (
               <div className="mt-2 p-2 bg-slate-100 rounded text-xs font-mono">
                 <p>Email: {response.email}</p>
                 <p>Password: {response.password}</p>
                 <p className="text-muted-foreground mt-1">(Please copy this password)</p>
               </div>
             ),
             duration: 10000,
           })
           // Update local state to reflect system account
           setTutors(tutors.map(t => t.id === tutor.id ? { ...t, hasSystemAccount: true } as any : t))
        } else {
           toast({ title: "Login Exists", description: "This tutor already has a login account." })
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create login", variant: "destructive" })
    }
  }

  const saveSubject = async (subject: Subject) => {
    try {
      const method = subject.id ? "PUT" : "POST"
      const data = await apiFetch<Subject>("/api/admin/content/subjects", {
        method,
        body: JSON.stringify(subject),
      })
      if (subject.id) {
        setSubjects(subjects.map((s) => (s.id === subject.id ? data : s)))
      } else {
        setSubjects([...subjects, data])
      }
      setEditingSubject(null)
      toast({ title: "Success", description: "Subject saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save subject", variant: "destructive" })
    }
  }

  const deleteSubject = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/subjects?id=${id}`, { method: "DELETE" })
      setSubjects(subjects.filter((s) => s.id !== id))
      toast({ title: "Success", description: "Subject deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" })
    }
  }

  const saveAboutUsContent = async (content: AboutUsContent) => {
    try {
      const method = content.id ? "PUT" : "POST"
      const data = await apiFetch<AboutUsContent>("/api/admin/content/about-us", {
        method,
        body: JSON.stringify(content),
      })
      setAboutUsContent(data)
      setEditingAboutUs(null)
      toast({ title: "Success", description: "About Us content saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save about us content", variant: "destructive" })
    }
  }

  const saveFooterContent = async (content: FooterContent) => {
    try {
      const method = content.id ? "PUT" : "POST"
      const data = await apiFetch<FooterContent>("/api/admin/content/footer", {
        method,
        body: JSON.stringify(content),
      })
      setFooterContent(data)
      setEditingFooter(null)
      toast({ title: "Success", description: "Footer content saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save footer content", variant: "destructive" })
    }
  }

  const saveNavigationItem = async (item: NavigationItem) => {
    try {
      const method = item.id ? "PUT" : "POST"
      const data = await apiFetch<NavigationItem>("/api/admin/content/navigation", {
        method,
        body: JSON.stringify(item),
      })
      if (item.id) {
        setNavigationItems(navigationItems.map((n) => (n.id === item.id ? data : n)))
      } else {
        setNavigationItems([...navigationItems, data])
      }
      setEditingNavigation(null)
      toast({ title: "Success", description: "Navigation item saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save navigation item", variant: "destructive" })
    }
  }

  const deleteNavigationItem = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/navigation?id=${id}`, { method: "DELETE" })
      setNavigationItems(navigationItems.filter((n) => n.id !== id))
      toast({ title: "Success", description: "Navigation item deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete navigation item", variant: "destructive" })
    }
  }

  const saveContactUsContent = async (content: ContactUsContent) => {
    try {
      const method = content.id ? "PUT" : "POST"
      const data = await apiFetch<ContactUsContent>("/api/admin/content/contact-us", {
        method,
        body: JSON.stringify(content),
      })
      setContactUsContent(data)
      setEditingContactUs(null)
      toast({ title: "Success", description: "Contact Us content saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save contact us content", variant: "destructive" })
    }
  }

  const saveBecomeTutorContent = async (content: BecomeTutorContent) => {
    try {
      const method = content.id ? "PUT" : "POST"
      const data = await apiFetch<BecomeTutorContent>("/api/admin/content/become-tutor", {
        method,
        body: JSON.stringify(content),
      })
      setBecomeTutorContent(data)
      setEditingBecomeTutor(null)
      toast({ title: "Success", description: "Become Tutor content saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save become tutor content", variant: "destructive" })
    }
  }

  const saveExamRewriteContent = async (content: ExamRewriteContent) => {
    try {
      const method = content.id ? "PUT" : "POST"
      const data = await apiFetch<ExamRewriteContent>("/api/admin/content/exam-rewrite", {
        method,
        body: JSON.stringify(content),
      })
      setExamRewriteContent(data)
      setEditingExamRewrite(null)
      toast({ title: "Success", description: "Exam Rewrite content saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save exam rewrite content", variant: "destructive" })
    }
  }

  const saveUniversityApplicationContent = async (content: UniversityApplicationContent) => {
    try {
      const method = content.id ? "PUT" : "POST"
      const data = await apiFetch<UniversityApplicationContent>("/api/admin/content/university-application", {
        method,
        body: JSON.stringify(content),
      })
      setUniversityApplicationContent(data)
      setEditingUniversityApplication(null)
      toast({ title: "Success", description: "University Application content saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save university application content", variant: "destructive" })
    }
  }

  // Bulk upload handlers
  const handleBulkPricingUpload = async (file: File) => {
    setUploadingPricing(true)
    try {
      const fileContent = await fileToText(file)
      const isJson = file.name.endsWith(".json") || 
                     file.name.endsWith(".md") || 
                     fileContent.trim().startsWith("[") || 
                     fileContent.trim().startsWith("{")
      const fileType = isJson ? "json" : "csv"
      
      const response = await apiFetch<{ message: string; updated: number; created: number; warnings?: string[] }>(
        "/api/admin/content/pricing/bulk-upload",
        {
          method: "POST",
          body: JSON.stringify({ fileContent, fileType }),
        },
      )
      const total = (response.updated ?? 0) + (response.created ?? 0)
      toast({
        title: "Success",
        description: `${response.message}. Updated: ${response.updated}, Created: ${response.created}`,
      })
      await fetchPricingPlans()
      return {
        updated: response.updated,
        created: response.created,
        total,
        message: response.message,
        warnings: response.warnings ?? [],
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload pricing data",
        variant: "destructive",
      })
      throw error instanceof Error ? error : new Error("Failed to upload pricing data")
    } finally {
      setUploadingPricing(false)
    }
  }

  const handleBulkAnnouncementUpload = async (file: File) => {
    setUploadingAnnouncements(true)
    try {
      const fileContent = await fileToText(file)
      const fileType = file.name.endsWith(".json") ? "json" : "csv"
      const response = await apiFetch<{ message: string; updated: number; created: number; warnings?: string[] }>(
        "/api/admin/content/announcements/bulk-upload",
        {
          method: "POST",
          body: JSON.stringify({ fileContent, fileType }),
        },
      )
      const total = (response.updated ?? 0) + (response.created ?? 0)
      toast({
        title: "Success",
        description: `${response.message}. Updated: ${response.updated}, Created: ${response.created}`,
      })
      await fetchAnnouncements()
      return {
        updated: response.updated,
        created: response.created,
        total,
        message: response.message,
        warnings: response.warnings ?? [],
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload announcement data",
        variant: "destructive",
      })
      throw error instanceof Error ? error : new Error("Failed to upload announcement data")
    } finally {
      setUploadingAnnouncements(false)
    }
  }

  const handleBulkTutorUpload = async (file: File) => {
    setUploadingTutors(true)
    try {
      const fileContent = await fileToText(file)
      // Check for JSON extension or if content looks like JSON
      const isJson = file.name.endsWith(".json") || 
                     file.name.endsWith(".md") || 
                     fileContent.trim().startsWith("[") || 
                     fileContent.trim().startsWith("{")
      const fileType = isJson ? "json" : "csv"
      
      const response = await apiFetch<{ message: string; updated: number; created: number }>(
        "/api/admin/content/tutors/bulk-upload",
        {
          method: "POST",
          body: JSON.stringify({ fileContent, fileType }),
        },
      )
      const total = (response.updated ?? 0) + (response.created ?? 0)
      toast({
        title: "Success",
        description: `${response.message}. Updated: ${response.updated}, Created: ${response.created}`,
      })
      await fetchTutors()
      return {
        updated: response.updated,
        created: response.created,
        total,
        message: response.message,
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload tutor data",
        variant: "destructive",
      })
      throw error instanceof Error ? error : new Error("Failed to upload tutor data")
    } finally {
      setUploadingTutors(false)
    }
  }

  const handleBulkTutorPlacementUpload = async (file: File) => {
    setUploadingTutorPlacement(true)
    try {
      const fileContent = await fileToText(file)
      // Check for JSON extension or if content looks like JSON (starts with [ or {)
      const isJson = file.name.endsWith(".json") || 
                     file.name.endsWith(".md") || 
                     fileContent.trim().startsWith("[") || 
                     fileContent.trim().startsWith("{")
      const fileType = isJson ? "json" : "csv"
      
      const response = await apiFetch<{ message: string; placements: number; tutorsMatched: number; coursesCreated: number; warnings?: string[] }>(
        "/api/admin/content/tutor-placement/bulk-upload",
        {
          method: "POST",
          body: JSON.stringify({ fileContent, fileType }),
        },
      )
      toast({
        title: "Success",
        description: `${response.message}. Tutors matched: ${response.tutorsMatched}, Courses created: ${response.coursesCreated}`,
      })
      return {
        updated: response.coursesCreated,
        created: response.coursesCreated,
        total: response.placements,
        message: response.message,
        warnings: response.warnings ?? [],
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process tutor placement data",
        variant: "destructive",
      })
      throw error instanceof Error ? error : new Error("Failed to process tutor placement data")
    } finally {
      setUploadingTutorPlacement(false)
    }
  }

  const handleBulkTeamUpload = async (file: File) => {
    setUploadingTeam(true)
    try {
      const fileContent = await fileToText(file)
      const isJson = file.name.endsWith(".json") || 
                     file.name.endsWith(".md") || 
                     fileContent.trim().startsWith("[") || 
                     fileContent.trim().startsWith("{")
      const fileType = isJson ? "json" : "csv"
      
      const response = await apiFetch<{ message: string; updated: number; created: number }>(
        "/api/admin/content/team/bulk-upload",
        {
          method: "POST",
          body: JSON.stringify({ fileContent, fileType }),
        },
      )
      const total = (response.updated ?? 0) + (response.created ?? 0)
      toast({
        title: "Success",
        description: `${response.message}. Updated: ${response.updated}, Created: ${response.created}`,
      })
      await fetchTeamMembers()
      return {
        updated: response.updated,
        created: response.created,
        total,
        message: response.message,
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload team data",
        variant: "destructive",
      })
      throw error instanceof Error ? error : new Error("Failed to upload team data")
    } finally {
      setUploadingTeam(false)
    }
  }

  // Stats for overview
  const stats = [
    { label: "Tutors", value: tutors.length, icon: GraduationCap, color: "text-primary" },
    { label: "Subjects", value: subjects.length, icon: BookOpen, color: "text-chart-2" },
    { label: "Team Members", value: teamMembers.length, icon: Users, color: "text-chart-3" },
    { label: "Pricing Plans", value: pricingPlans.length, icon: DollarSign, color: "text-chart-5" },
    { label: "Testimonials", value: testimonials.length, icon: MessageSquare, color: "text-chart-4" },
    { label: "Announcements", value: announcements.length, icon: Bell, color: "text-primary" },
  ]

  // Filter nav items by search
  const filteredNavItems = navItems.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading content management...</p>
        </div>
      </div>
    )
  }

  // Render content sections
  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Manage all your website content from one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-semibold">{stat.value}</p>
                </div>
                <div className={cn("rounded-lg bg-secondary p-3", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Tutors</CardTitle>
            <CardDescription>Latest added tutors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeArray(tutors)
                .slice(0, 5)
                .map((tutor) => (
                  <div key={tutor.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tutor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {safeArray(tutor.subjects).join(", ") || "No subjects"}
                      </p>
                    </div>
                    <Badge variant={tutor.isActive ? "default" : "secondary"}>
                      {tutor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              {tutors.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tutors found</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Announcements</CardTitle>
            <CardDescription>Latest announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeArray(announcements)
                .slice(0, 5)
                .map((announcement) => (
                  <div key={announcement.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        announcement.type === "success" && "bg-primary/20 text-primary",
                        announcement.type === "warning" && "bg-chart-3/20 text-chart-3",
                        announcement.type === "info" && "bg-chart-2/20 text-chart-2",
                      )}
                    >
                      {announcement.type === "success" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {announcement.type === "warning" && <AlertCircle className="h-3.5 w-3.5" />}
                      {announcement.type === "info" && <Info className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {announcement.pinned ? "Pinned" : "Not pinned"}
                      </p>
                    </div>
                  </div>
                ))}
              {announcements.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No announcements found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderHeroSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Hero Section</h2>
          <p className="text-muted-foreground">Manage your homepage hero content.</p>
        </div>
        {!heroContent && (
          <Button
            onClick={() =>
              setEditingHero({
                title: "",
                subtitle: "",
                description: "",
                buttonText: "",
                secondaryButtonText: "",
                trustIndicatorText: "",
                universities: [],
                features: [],
                backgroundGradient: "",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Hero
          </Button>
        )}
      </div>

      {heroContent ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="text-sm font-medium mt-1">{heroContent.title || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Subtitle</Label>
                  <p className="text-sm font-medium mt-1">{heroContent.subtitle || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {heroContent.description || "Not set"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Primary Button</Label>
                    <p className="text-sm font-medium mt-1">{heroContent.buttonText || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Secondary Button</Label>
                    <p className="text-sm font-medium mt-1">{heroContent.secondaryButtonText || "Not set"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Trust Indicator</Label>
                  <p className="text-sm font-medium mt-1">{heroContent.trustIndicatorText || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Universities</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {safeArray(heroContent.universities).length > 0 ? (
                      safeArray(heroContent.universities).map((uni, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {uni}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No universities</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => setEditingHero(heroContent)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Hero
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No hero content found</p>
            <Button
              onClick={() =>
                setEditingHero({
                  title: "",
                  subtitle: "",
                  description: "",
                  buttonText: "",
                  secondaryButtonText: "",
                  trustIndicatorText: "",
                  universities: [],
                  features: [],
                  backgroundGradient: "",
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Hero Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderFeaturesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
          <p className="text-muted-foreground">Manage website features and benefits.</p>
        </div>
        <Button onClick={() => setEditingFeature({ title: "", description: "", icon: "", benefits: [""] })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safeArray(features).map((feature) => (
          <Card key={feature.id} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                  {safeArray(feature.benefits).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Benefits:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {safeArray(feature.benefits)
                          .slice(0, 3)
                          .map((benefit, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-primary" />
                              <span className="truncate">{benefit}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={feature.isActive ? "default" : "secondary"}>
                  {feature.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingFeature(feature)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => feature.id && deleteFeature(feature.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {features.length === 0 && (
          <Card className="bg-card border-border md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No features found. Add your first feature to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderTutorsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tutors</h2>
          <p className="text-muted-foreground">Manage your tutoring staff.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTutorPlacementBulkUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Place Tutors
          </Button>
          <Button variant="outline" onClick={() => setShowTutorBulkUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button
            onClick={() =>
              setEditingTutor({
                name: "",
                subjects: [],
                image: "",
                contactName: "",
                contactPhone: "",
                contactEmail: "",
                description: "",
                ratings: [],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Tutor
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Subjects</TableHead>
                <TableHead className="text-muted-foreground">Contact</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeArray(tutors).map((tutor) => (
                <TableRow key={tutor.id} className="border-border">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {tutor.image ? (
                        <img
                          src={tutor.image || "/placeholder.svg"}
                          alt={tutor.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {tutor.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {safeArray(tutor.subjects)
                        .slice(0, 2)
                        .map((subj, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {subj}
                          </Badge>
                        ))}
                      {safeArray(tutor.subjects).length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{safeArray(tutor.subjects).length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tutor.contactEmail || "No email"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={tutor.isActive ? "default" : "secondary"}>
                        {tutor.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {(tutor as any).hasSystemAccount && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          System User
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!(tutor as any).hasSystemAccount && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => createTutorLogin(tutor)}
                          title="Create Login"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTutor(tutor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => tutor.id && deleteTutor(tutor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {tutors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tutors found. Add your first tutor to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderSubjectsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Subjects</h2>
          <p className="text-muted-foreground">Manage available subjects and courses.</p>
        </div>
        <Button
          onClick={() =>
            setEditingSubject({
              name: "",
              description: "",
              image: "",
              category: "",
              tutorsCount: 0,
              popularTopics: [],
              difficulty: [],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safeArray(subjects).map((subject) => (
          <Card key={subject.id} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {subject.image ? (
                  <img
                    src={subject.image || "/placeholder.svg"}
                    alt={subject.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{subject.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {subject.description || "No description"}
                  </p>
                  {subject.category && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {subject.category}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={subject.isActive ? "default" : "secondary"}>
                  {subject.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingSubject(subject)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => subject.id && deleteSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {subjects.length === 0 && (
          <Card className="bg-card border-border md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No subjects found. Add your first subject to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderAnnouncementsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">Manage site-wide announcements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAnnouncementBulkUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button
            onClick={() =>
              setEditingAnnouncement({
                title: "",
                content: "",
                type: "info",
                pinned: false,
                isActive: true,
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Announcement
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {safeArray(announcements).map((announcement) => (
          <Card key={announcement.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    announcement.type === "success" && "bg-primary/20 text-primary",
                    announcement.type === "warning" && "bg-chart-3/20 text-chart-3",
                    announcement.type === "info" && "bg-chart-2/20 text-chart-2",
                  )}
                >
                  {announcement.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                  {announcement.type === "warning" && <AlertCircle className="h-4 w-4" />}
                  {announcement.type === "info" && <Info className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  {announcement.title && (
                    <p className="text-sm font-semibold mb-1 line-clamp-1">{announcement.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                  {announcement.mediaUrl && (
                    <div className="mt-2">
                      {announcement.mediaType === 'video' ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md w-fit border border-border">
                          <Video className="h-3.5 w-3.5" />
                          <span className="font-medium">Video Attached</span>
                        </div>
                      ) : (
                        <div className="relative group w-fit">
                          <img 
                            src={announcement.mediaUrl} 
                            alt="Attachment" 
                            className="h-20 w-32 object-cover rounded-md border border-border bg-muted" 
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                            <ImageIcon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {announcement.type}
                    </Badge>
                    {announcement.pinned && (
                      <Badge variant="secondary" className="text-xs">
                        Pinned
                      </Badge>
                    )}
                    <Badge variant={announcement.isActive ? "default" : "secondary"} className="text-xs">
                      {announcement.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">
                      {announcement.created_at ? new Date(announcement.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingAnnouncement(announcement)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => announcement.id && deleteAnnouncement(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No announcements found. Add your first announcement to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderPricingSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Pricing Plans</h2>
          <p className="text-muted-foreground">Manage your pricing tiers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button
            onClick={() =>
              setEditingPricingPlan({
                name: "",
                price: "",
                period: "month",
                features: [""],
                notIncluded: [],
                color: "bg-primary",
                icon: "Star",
                popular: false,
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Annual Discount (%)</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={annualDiscountInput}
                  onChange={(e) => setAnnualDiscountInput(e.target.value)}
                  placeholder="15"
                />
                <Button
                  onClick={async () => {
                    const v = Number.parseFloat(annualDiscountInput)
                    if (!Number.isFinite(v) || v < 0 || v > 100) {
                      toast({ title: "Invalid", description: "Enter 0–100", variant: "destructive" })
                      return
                    }
                    const existing = siteSettings.find(
                      (r) => String(r.key).toLowerCase() === "pricing_annual_discount_percent",
                    )
                    const payload = {
                      ...(existing?.id ? { id: existing.id } : {}),
                      key: "pricing_annual_discount_percent",
                      value: String(v),
                      type: "number",
                      label: "Annual Discount %",
                      category: "pricing",
                    }
                    const method = existing?.id ? "PUT" : "POST"
                    const res = await apiFetch<any>("/api/admin/content/site-settings", {
                      method,
                      body: JSON.stringify(payload),
                    })
                    if (res) {
                      toast({ title: "Saved", description: "Pricing settings updated" })
                      await fetchSiteSettings()
                    } else {
                      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
                    }
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Used to compute annual billing savings.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Promotional Discount (%)</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={promotionalDiscountInput}
                  onChange={(e) => setPromotionalDiscountInput(e.target.value)}
                  placeholder="0"
                />
                <Button
                  onClick={async () => {
                    const v = Number.parseFloat(promotionalDiscountInput)
                    if (!Number.isFinite(v) || v < 0 || v > 100) {
                      toast({ title: "Invalid", description: "Enter 0–100", variant: "destructive" })
                      return
                    }
                    const existing = siteSettings.find(
                      (r) => String(r.key).toLowerCase() === "pricing_promotional_discount_percent",
                    )
                    const payload = {
                      ...(existing?.id ? { id: existing.id } : {}),
                      key: "pricing_promotional_discount_percent",
                      value: String(v),
                      type: "number",
                      label: "Promotional Discount %",
                      category: "pricing",
                    }
                    const method = existing?.id ? "PUT" : "POST"
                    const res = await apiFetch<any>("/api/admin/content/site-settings", {
                      method,
                      body: JSON.stringify(payload),
                    })
                    if (res) {
                      toast({ title: "Saved", description: "Promotional discount updated" })
                      await fetchSiteSettings()
                    } else {
                      toast({ title: "Error", description: "Failed to save promotional discount", variant: "destructive" })
                    }
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Optional extra discount for limited-time promotions. Set to 0 when not active.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safeArray(pricingPlans).map((plan) => (
          <Card key={plan.id} className={cn("bg-card border-border relative", plan.popular && "ring-2 ring-primary")}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              </div>
            )}
            <CardContent className="p-6 pt-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {safeArray(plan.features)
                  .slice(0, 4)
                  .map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                {safeArray(plan.features).length > 4 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{safeArray(plan.features).length - 4} more features
                  </p>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Badge variant={plan.isActive ? "default" : "secondary"}>{plan.isActive ? "Active" : "Inactive"}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPricingPlan(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => plan.id && deletePricingPlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {pricingPlans.length === 0 && (
          <Card className="bg-card border-border md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pricing plans found. Add your first plan to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderTestimonialsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Testimonials</h2>
          <p className="text-muted-foreground">Manage customer testimonials.</p>
        </div>
        <Button
          onClick={() =>
            setEditingTestimonial({
              content: "",
              author: "",
              role: "",
              subject: "",
              improvement: "",
              image: "",
              rating: 5,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {safeArray(testimonials).map((testimonial) => (
          <Card key={testimonial.id} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {testimonial.image ? (
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.author}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < testimonial.rating ? "fill-chart-3 text-chart-3" : "text-muted-foreground",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm mt-2 line-clamp-3">{testimonial.content}</p>
                  <div className="mt-3">
                    <p className="text-sm font-medium">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={testimonial.isActive ? "default" : "secondary"}>
                  {testimonial.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingTestimonial(testimonial)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => testimonial.id && deleteTestimonial(testimonial.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {testimonials.length === 0 && (
          <Card className="bg-card border-border md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No testimonials found. Add your first testimonial to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderTeamSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground">Manage your team.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTeamBulkUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => setEditingTeamMember({ name: "", role: "", bio: "", image: "" })}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safeArray(teamMembers).map((member) => (
          <Card key={member.id} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {member.image ? (
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <h3 className="mt-4 font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{member.bio || "No bio"}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={member.isActive ? "default" : "secondary"}>
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTeamMember(member)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => member.id && deleteTeamMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {teamMembers.length === 0 && (
          <Card className="bg-card border-border md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No team members found. Add your first member to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderSimpleSection = (
    title: string,
    description: string,
    content: any,
    setEditing: (val: any) => void,
    icon: React.ReactNode,
    defaultValues: any,
  ) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {!content && (
          <Button onClick={() => setEditing(defaultValues)}>
            <Plus className="mr-2 h-4 w-4" />
            Create {title}
          </Button>
        )}
      </div>

      {content ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <pre className="text-sm text-muted-foreground overflow-auto max-h-64">
              {JSON.stringify(content, null, 2)}
            </pre>
            <div className="mt-4">
              <Button onClick={() => setEditing(content)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit {title}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            {icon}
            <p className="text-muted-foreground mt-4">No {title.toLowerCase()} content found</p>
            <Button className="mt-4" onClick={() => setEditing(defaultValues)}>
              <Plus className="mr-2 h-4 w-4" />
              Create {title}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderNavigationSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Navigation</h2>
          <p className="text-muted-foreground">Manage navigation menu items.</p>
        </div>
        <Button onClick={() => setEditingNavigation({ path: "", label: "", type: "main", isActive: true })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Label</TableHead>
                <TableHead className="text-muted-foreground">Path</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeArray(navigationItems).map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell className="text-muted-foreground">{item.path}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingNavigation(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => item.id && deleteNavigationItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {navigationItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Navigation className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No navigation items found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Render main content based on active tab
  const updateSiteSetting = async (key: string, value: string, label: string) => {
    try {
      const existing = siteSettings.find((r) => String(r.key).toLowerCase() === key.toLowerCase())
      const payload = {
        ...(existing?.id ? { id: existing.id } : {}),
        key: key,
        value: value,
        type: "boolean",
        label: label,
        category: "system",
      }
      const method = existing?.id ? "PUT" : "POST"
      await apiFetch("/api/admin/content/site-settings", {
        method,
        body: JSON.stringify(payload),
      })
      toast({ title: "Saved", description: `${label} updated` })
      await fetchSiteSettings()
    } catch (error) {
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" })
    }
  }

  const renderSettingsSection = () => {
    const maintenanceMode = siteSettings.find((r) => r.key === "system_maintenance_mode")?.value === "true"
    // Agreement is met by default (true). If it's "false", then it's NOT met (blocked).
    // So "Blocking Active" means agreementMet is false.
    const agreementMetVal = siteSettings.find((r) => r.key === "system_agreement_met")?.value
    const isBlockingActive = agreementMetVal === "false" || agreementMetVal === "0"

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">Manage global system configurations.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>
                When active, only admins can access the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={(checked) => updateSiteSetting("system_maintenance_mode", String(checked), "Maintenance Mode")}
                />
                <Label>Maintenance Mode {maintenanceMode ? "On" : "Off"}</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Agreement Block</CardTitle>
              <CardDescription>
                If active, users must wait for agreement requirements to be met (Blocks access).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isBlockingActive}
                  onCheckedChange={(checked) => updateSiteSetting("system_agreement_met", String(!checked), "Agreement Status")}
                />
                <Label>Block Access {isBlockingActive ? "On" : "Off"}</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview()
      case "hero":
        return renderHeroSection()
      case "features":
        return renderFeaturesSection()
      case "announcements":
        return renderAnnouncementsSection()
      case "pricing":
        return renderPricingSection()
      case "testimonials":
        return renderTestimonialsSection()
      case "team":
        return renderTeamSection()
      case "tutors":
        return renderTutorsSection()
      case "subjects":
        return renderSubjectsSection()
      case "navigation":
        return renderNavigationSection()
      case "about":
        return renderSimpleSection(
          "About Us",
          "Manage about us page content.",
          aboutUsContent,
          setEditingAboutUs,
          <Info className="h-12 w-12 text-muted-foreground" />,
          {
            goal: "",
            mission: "",
            rolesResponsibilities: {},
          },
        )
      case "contact":
        return renderSimpleSection(
          "Contact Us",
          "Manage contact page content.",
          contactUsContent,
          setEditingContactUs,
          <Mail className="h-12 w-12 text-muted-foreground" />,
          { title: "", description: "", logo: "", formEndpoint: "", contactInfo: {} },
        )
      case "footer":
        return renderSimpleSection(
          "Footer",
          "Manage footer content.",
          footerContent,
          setEditingFooter,
          <Footprints className="h-12 w-12 text-muted-foreground" />,
          {
            companyName: "",
            tagline: "",
            contactPhone: "",
            contactEmail: "",
            contactPerson: "",
            whatsappLink: "",
            socialLinks: {},
            quickLinks: [],
            resourceLinks: [],
            copyrightText: "",
          },
        )
      case "become-tutor":
        return renderSimpleSection(
          "Become a Tutor",
          "Manage tutor application page.",
          becomeTutorContent,
          setEditingBecomeTutor,
          <UserPlus className="h-12 w-12 text-muted-foreground" />,
          { title: "", description: "", requirements: [], benefits: [], applicationUrl: "" },
        )
      case "exam-rewrite":
        return renderSimpleSection(
          "Exam Rewrite",
          "Manage exam rewrite page content.",
          examRewriteContent,
          setEditingExamRewrite,
          <FileText className="h-12 w-12 text-muted-foreground" />,
          {
            title: "",
            description: "",
            heroTitle: "",
            heroDescription: "",
            benefits: [],
            process: [],
            subjects: [],
            applicationFormUrl: "",
            pricingInfo: {},
          },
        )
      case "university":
        return renderSimpleSection(
          "University Applications",
          "Manage university application page.",
          universityApplicationContent,
          setEditingUniversityApplication,
          <Building className="h-12 w-12 text-muted-foreground" />,
          { title: "", description: "", services: [], process: [], requirements: [], pricing: {} },
        )
      case "settings":
        return renderSettingsSection()
      default:
        return renderOverview()
    }
  }

  // Dialog components
  const HeroEditDialog = () => (
    <Dialog open={!!editingHero} onOpenChange={() => setEditingHero(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingHero?.id ? "Edit" : "Create"} Hero Section</DialogTitle>
          <DialogDescription>Manage your homepage hero content.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingHero && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editingHero.title}
                    onChange={(e) => setEditingHero({ ...editingHero, title: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={editingHero.subtitle}
                    onChange={(e) => setEditingHero({ ...editingHero, subtitle: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingHero.description}
                  onChange={(e) => setEditingHero({ ...editingHero, description: e.target.value })}
                  className="bg-input border-border"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Button Text</Label>
                  <Input
                    value={editingHero.buttonText}
                    onChange={(e) => setEditingHero({ ...editingHero, buttonText: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Text</Label>
                  <Input
                    value={editingHero.secondaryButtonText}
                    onChange={(e) => setEditingHero({ ...editingHero, secondaryButtonText: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Trust Indicator Text</Label>
                <Input
                  value={editingHero.trustIndicatorText}
                  onChange={(e) => setEditingHero({ ...editingHero, trustIndicatorText: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editingHero.isActive}
                  onCheckedChange={(checked) => setEditingHero({ ...editingHero, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingHero(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingHero && saveHeroContent(editingHero)}>
            {editingHero?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const FeatureEditDialog = () => (
    <Dialog open={!!editingFeature} onOpenChange={() => setEditingFeature(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingFeature?.id ? "Edit" : "Add"} Feature</DialogTitle>
          <DialogDescription>Manage feature details.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingFeature && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editingFeature.title}
                    onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    value={editingFeature.icon}
                    onChange={(e) => setEditingFeature({ ...editingFeature, icon: e.target.value })}
                    className="bg-input border-border"
                    placeholder="e.g., Star, Users"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingFeature.description}
                  onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                  className="bg-input border-border"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Benefits</Label>
                {safeArray(editingFeature.benefits).map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => {
                        const newBenefits = [...editingFeature.benefits]
                        newBenefits[index] = e.target.value
                        setEditingFeature({ ...editingFeature, benefits: newBenefits })
                      }}
                      className="bg-input border-border"
                      placeholder="Enter benefit"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newBenefits = editingFeature.benefits.filter((_, i) => i !== index)
                        setEditingFeature({ ...editingFeature, benefits: newBenefits })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingFeature({ ...editingFeature, benefits: [...editingFeature.benefits, ""] })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Benefit
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editingFeature.isActive}
                  onCheckedChange={(checked) => setEditingFeature({ ...editingFeature, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingFeature(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingFeature && saveFeature(editingFeature)}>
            {editingFeature?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const TutorEditDialog = () => (
    <Dialog open={!!editingTutor} onOpenChange={() => setEditingTutor(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingTutor?.id ? "Edit" : "Add"} Tutor</DialogTitle>
          <DialogDescription>Manage tutor profile.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingTutor && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingTutor.name}
                    onChange={(e) => setEditingTutor({ ...editingTutor, name: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    value={editingTutor.contactEmail}
                    onChange={(e) => setEditingTutor({ ...editingTutor, contactEmail: e.target.value })}
                    className="bg-input border-border"
                    type="email"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={editingTutor.contactPhone}
                    onChange={(e) => setEditingTutor({ ...editingTutor, contactPhone: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person Name</Label>
                  <Input
                    value={editingTutor.contactName}
                    onChange={(e) => setEditingTutor({ ...editingTutor, contactName: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingTutor.description}
                  onChange={(e) => setEditingTutor({ ...editingTutor, description: e.target.value })}
                  className="bg-input border-border"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingTutor.image}
                    onChange={(e) => setEditingTutor({ ...editingTutor, image: e.target.value })}
                    className="bg-input border-border"
                    placeholder="/uploads/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-input border-border"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = await uploadImage(file)
                      setEditingTutor({ ...editingTutor, image: url })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subjects</Label>
                <ScrollArea className="h-40 rounded-md border border-border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {safeArray(subjects).map((subj) => {
                      const checked = safeArray(editingTutor.subjects).includes(subj.name)
                      return (
                        <label key={subj.id || subj.name} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(val) => {
                              const next = new Set(editingTutor.subjects)
                              if (val) {
                                next.add(subj.name)
                              } else {
                                next.delete(subj.name)
                              }
                              setEditingTutor({ ...editingTutor, subjects: Array.from(next) })
                            }}
                          />
                          <span>{subj.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editingTutor.isActive}
                  onCheckedChange={(checked) => setEditingTutor({ ...editingTutor, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingTutor(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingTutor && saveTutor(editingTutor)}>
            {editingTutor?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const SubjectEditDialog = () => (
    <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingSubject?.id ? "Edit" : "Add"} Subject</DialogTitle>
          <DialogDescription>Manage subject details.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingSubject && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editingSubject.category}
                    onChange={(e) => setEditingSubject({ ...editingSubject, category: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingSubject.description}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="bg-input border-border"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingSubject.image}
                    onChange={(e) => setEditingSubject({ ...editingSubject, image: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-input border-border"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = await uploadImage(file)
                      setEditingSubject({ ...editingSubject, image: url })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Popular Topics (comma separated)</Label>
                <Input
                  value={safeArray(editingSubject.popularTopics).join(", ")}
                  onChange={(e) =>
                    setEditingSubject({
                      ...editingSubject,
                      popularTopics: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  className="bg-input border-border"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editingSubject.isActive}
                  onCheckedChange={(checked) => setEditingSubject({ ...editingSubject, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingSubject(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingSubject && saveSubject(editingSubject)}>
            {editingSubject?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const AnnouncementEditDialog = () => (
    <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
      <DialogContent className="max-w-md max-h-[85vh] bg-card border-border overflow-auto">
        <DialogHeader>
          <DialogTitle>{editingAnnouncement?.id ? "Edit" : "Add"} Announcement</DialogTitle>
          <DialogDescription>Create or update site announcements.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingAnnouncement && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingAnnouncement.title || ""}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  className="bg-input border-border"
                  placeholder="Professional announcement headline"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Content (Markdown or HTML)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnnouncementPreviewMode(!announcementPreviewMode)}
                    className="h-8 px-2"
                  >
                    {announcementPreviewMode ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                </div>
                {announcementPreviewMode ? (
                  <div
                    className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 border rounded-md bg-muted/30 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: editingAnnouncement.content }}
                  />
                ) : (
                  <Textarea
                    value={editingAnnouncement.content}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                    className="bg-input border-border font-mono text-sm"
                    rows={12}
                    placeholder="Write your full announcement or article here... (Supports Markdown and HTML)"
                  />
                )}
                <div className="space-y-1">
                  <Label>Upload MD/HTML</Label>
                  <Input
                    type="file"
                    accept=".md,.html,text/markdown,text/html"
                    className="bg-input border-border"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const text = await fileToText(file)
                      setEditingAnnouncement({ ...editingAnnouncement, content: text })
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Media URL</Label>
                  <Input
                    value={editingAnnouncement.mediaUrl || ""}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, mediaUrl: e.target.value })}
                    className="bg-input border-border"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Media Type</Label>
                  <Select
                    value={editingAnnouncement.mediaType || "image"}
                    onValueChange={(val) => setEditingAnnouncement({ ...editingAnnouncement, mediaType: val })}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Upload Media</Label>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    className="bg-input border-border"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const resourceType = file.type.startsWith("video") ? "video" : "image"
                        const url = await uploadImage(file)
                        setEditingAnnouncement({
                          ...editingAnnouncement,
                          mediaUrl: url,
                          mediaType: resourceType
                        })
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                  />
                </div>
              </div>
              {editingAnnouncement.mediaUrl && (
                <div className="mt-2">
                  {editingAnnouncement.mediaType === 'video' ? (
                    <video src={editingAnnouncement.mediaUrl} controls className="max-h-40 rounded" />
                  ) : (
                    <img src={editingAnnouncement.mediaUrl} alt="Preview" className="max-h-40 rounded object-cover" />
                  )}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editingAnnouncement.type}
                    onValueChange={(val: "info" | "warning" | "success") =>
                      setEditingAnnouncement({ ...editingAnnouncement, type: val })
                    }
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingAnnouncement.pinned}
                      onCheckedChange={(checked) => setEditingAnnouncement({ ...editingAnnouncement, pinned: checked })}
                    />
                    <Label>Pinned</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!editingAnnouncement.isActive}
                      onCheckedChange={(checked) => setEditingAnnouncement({ ...editingAnnouncement, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingAnnouncement && saveAnnouncement(editingAnnouncement)}>
            {editingAnnouncement?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const PricingPlanEditDialog = () => (
    <Dialog open={!!editingPricingPlan} onOpenChange={() => setEditingPricingPlan(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingPricingPlan?.id ? "Edit" : "Add"} Pricing Plan</DialogTitle>
          <DialogDescription>Manage pricing plans and subscription options.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingPricingPlan && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingPricingPlan.name}
                    onChange={(e) => setEditingPricingPlan({ ...editingPricingPlan, name: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    value={editingPricingPlan.price}
                    onChange={(e) => setEditingPricingPlan({ ...editingPricingPlan, price: e.target.value })}
                    className="bg-input border-border"
                    placeholder="e.g., R299"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select
                    value={editingPricingPlan.period}
                    onValueChange={(val) => setEditingPricingPlan({ ...editingPricingPlan, period: val })}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="once">Once</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingPricingPlan.popular}
                      onCheckedChange={(checked) => setEditingPricingPlan({ ...editingPricingPlan, popular: checked })}
                    />
                    <Label>Popular</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!editingPricingPlan.isActive}
                      onCheckedChange={(checked) => setEditingPricingPlan({ ...editingPricingPlan, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Color (Tailwind class)</Label>
                  <Input
                    value={editingPricingPlan.color}
                    onChange={(e) => setEditingPricingPlan({ ...editingPricingPlan, color: e.target.value })}
                    className="bg-input border-border"
                    placeholder="e.g., bg-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon (name)</Label>
                  <Input
                    value={editingPricingPlan.icon}
                    onChange={(e) => setEditingPricingPlan({ ...editingPricingPlan, icon: e.target.value })}
                    className="bg-input border-border"
                    placeholder="e.g., Star"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={editingPricingPlan.order ?? 0}
                    onChange={(e) =>
                      setEditingPricingPlan({
                        ...editingPricingPlan,
                        order: Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value),
                      })
                    }
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                {safeArray(editingPricingPlan.features).map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...editingPricingPlan.features]
                        newFeatures[index] = e.target.value
                        setEditingPricingPlan({ ...editingPricingPlan, features: newFeatures })
                      }}
                      className="bg-input border-border"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newFeatures = editingPricingPlan.features.filter((_, i) => i !== index)
                        setEditingPricingPlan({ ...editingPricingPlan, features: newFeatures })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditingPricingPlan({ ...editingPricingPlan, features: [...editingPricingPlan.features, ""] })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Not Included</Label>
                {safeArray(editingPricingPlan.notIncluded).map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newItems = [...editingPricingPlan.notIncluded]
                        newItems[index] = e.target.value
                        setEditingPricingPlan({ ...editingPricingPlan, notIncluded: newItems })
                      }}
                      className="bg-input border-border"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newItems = editingPricingPlan.notIncluded.filter((_, i) => i !== index)
                        setEditingPricingPlan({ ...editingPricingPlan, notIncluded: newItems })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditingPricingPlan({
                      ...editingPricingPlan,
                      notIncluded: [...editingPricingPlan.notIncluded, ""],
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Not Included Item
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingPricingPlan(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingPricingPlan && savePricingPlan(editingPricingPlan)}>
            {editingPricingPlan?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const TestimonialEditDialog = () => (
    <Dialog open={!!editingTestimonial} onOpenChange={() => setEditingTestimonial(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingTestimonial?.id ? "Edit" : "Add"} Testimonial</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingTestimonial && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={editingTestimonial.author}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, author: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={editingTestimonial.role}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={editingTestimonial.subject}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, subject: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={editingTestimonial.rating}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: Number(e.target.value) })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editingTestimonial.content}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                  className="bg-input border-border"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingTestimonial.image}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, image: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-input border-border"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = await uploadImage(file)
                      setEditingTestimonial({ ...editingTestimonial, image: url })
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editingTestimonial.isActive}
                  onCheckedChange={(checked) => setEditingTestimonial({ ...editingTestimonial, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingTestimonial(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingTestimonial && saveTestimonial(editingTestimonial)}>
            {editingTestimonial?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const TeamMemberEditDialog = () => (
    <Dialog open={!!editingTeamMember} onOpenChange={() => setEditingTeamMember(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingTeamMember?.id ? "Edit" : "Add"} Team Member</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {editingTeamMember && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingTeamMember.name}
                    onChange={(e) => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={editingTeamMember.role}
                    onChange={(e) => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={editingTeamMember.bio}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })}
                  className="bg-input border-border"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingTeamMember.image}
                    onChange={(e) => setEditingTeamMember({ ...editingTeamMember, image: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-input border-border"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = await uploadImage(file)
                      setEditingTeamMember({ ...editingTeamMember, image: url })
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editingTeamMember.isActive}
                  onCheckedChange={(checked) => setEditingTeamMember({ ...editingTeamMember, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingTeamMember(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingTeamMember && saveTeamMember(editingTeamMember)}>
            {editingTeamMember?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const NavigationEditDialog = () => (
    <Dialog open={!!editingNavigation} onOpenChange={() => setEditingNavigation(null)}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingNavigation?.id ? "Edit" : "Add"} Navigation Item</DialogTitle>
        </DialogHeader>
        {editingNavigation && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={editingNavigation.label}
                onChange={(e) => setEditingNavigation({ ...editingNavigation, label: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Path</Label>
              <Input
                value={editingNavigation.path}
                onChange={(e) => setEditingNavigation({ ...editingNavigation, path: e.target.value })}
                className="bg-input border-border"
                placeholder="/about"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingNavigation.type}
                  onValueChange={(val) => setEditingNavigation({ ...editingNavigation, type: val })}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={!!editingNavigation.isActive}
                  onCheckedChange={(checked) => setEditingNavigation({ ...editingNavigation, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingNavigation(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingNavigation && saveNavigationItem(editingNavigation)}>
            {editingNavigation?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Generic edit dialog for simple content types
  const SimpleEditDialog = ({
    title,
    content,
    setContent,
    saveContent,
    fields,
  }: {
    title: string
    content: any
    setContent: (val: any) => void
    saveContent: (val: any) => void
    fields: Array<{ key: string; label: string; type?: string }>
  }) => (
    <Dialog open={!!content} onOpenChange={() => setContent(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {content?.id ? "Edit" : "Create"} {title}
          </DialogTitle>
          <DialogDescription>Edit content details for {title}.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
          {content && (
            <div className="grid gap-4 py-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={content[field.key] || ""}
                      onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
                      className="bg-input border-border"
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={content[field.key] || ""}
                      onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
                      className="bg-input border-border"
                    />
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!content.isActive}
                  onCheckedChange={(checked) => setContent({ ...content, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setContent(null)}>
            Cancel
          </Button>
          <Button onClick={() => content && saveContent(content)}>{content?.id ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Export handlers
  const handleExportPricing = () => {
    const data = pricingPlans.map((plan) => ({
      name: plan.name,
      price: plan.price,
      period: plan.period,
      features: safeArray(plan.features).join("|"),
      notIncluded: safeArray(plan.notIncluded).join("|"),
      color: plan.color,
      icon: plan.icon,
      popular: plan.popular,
      order: plan.order,
    }))
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Professional column widths
    ws['!cols'] = [
      { wch: 20 }, // Name
      { wch: 10 }, // Price
      { wch: 10 }, // Period
      { wch: 40 }, // Features
      { wch: 30 }, // Not Included
      { wch: 15 }, // Color
      { wch: 10 }, // Icon
      { wch: 10 }, // Popular
      { wch: 8 },  // Order
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pricing Plans");
    XLSX.writeFile(wb, "pricing-plans.xlsx");
  }

  const handleExportAnnouncements = async () => {
    const data = announcements.map((a) => ({
      title: a.title || "",
      content: a.content,
      type: a.type,
      pinned: !!a.pinned,
      isActive: !!a.isActive,
      mediaUrl: a.mediaUrl || "",
      mediaType: a.mediaType || "",
    }))
    
    const ws = XLSX.utils.json_to_sheet(data);

    // Professional column widths
    ws['!cols'] = [
      { wch: 30 }, // Title
      { wch: 50 }, // Content
      { wch: 10 }, // Type
      { wch: 10 }, // Pinned
      { wch: 10 }, // IsActive
      { wch: 30 }, // MediaUrl
      { wch: 10 }, // MediaType
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Announcements");
    XLSX.writeFile(wb, "announcements.xlsx");
  }

  const handleExportTutors = () => {
    const data = tutors.map((tutor) => ({
      name: tutor.name,
      subjects: safeArray(tutor.subjects).join("|"),
      image: tutor.image,
      contactName: tutor.contactName,
      contactPhone: tutor.contactPhone,
      contactEmail: tutor.contactEmail,
      description: tutor.description,
      order: tutor.order,
      isActive: tutor.isActive,
      hasLogin: (tutor as any).hasSystemAccount ? "Yes" : "No",
    }))
    
    const ws = XLSX.utils.json_to_sheet(data);

    // Professional column widths
    ws['!cols'] = [
      { wch: 25 }, // Name
      { wch: 40 }, // Subjects
      { wch: 30 }, // Image
      { wch: 25 }, // ContactName
      { wch: 20 }, // ContactPhone
      { wch: 30 }, // ContactEmail
      { wch: 50 }, // Description
      { wch: 10 }, // Order
      { wch: 10 }, // IsActive
      { wch: 10 }, // HasLogin
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tutors");
    XLSX.writeFile(wb, `tutors-export-${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  const handleExportTeamMembers = () => {
    const data = teamMembers.map((member) => ({
      name: member.name,
      role: member.role,
      bio: member.bio,
      image: member.image,
      order: member.order,
      isActive: member.isActive,
    }))
    
    const ws = XLSX.utils.json_to_sheet(data);

    // Professional column widths
    ws['!cols'] = [
      { wch: 25 }, // Name
      { wch: 25 }, // Role
      { wch: 50 }, // Bio
      { wch: 30 }, // Image
      { wch: 10 }, // Order
      { wch: 10 }, // IsActive
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Team Members");
    XLSX.writeFile(wb, `team-members-export-${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {sidebarOpen && <span className="font-semibold">Content Manager</span>}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {sidebarOpen && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-sidebar-accent border-sidebar-border pl-8 h-9"
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredNavItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  activeTab === item.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                  !sidebarOpen && "justify-center px-2",
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3 h-10", !sidebarOpen && "justify-center px-2")}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile Menu */}
              <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="-ml-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <div className="flex h-14 items-center border-b px-4">
                      <span className="font-semibold">Content Manager</span>
                    </div>
                    <ScrollArea className="h-[calc(100vh-3.5rem)]">
                      <div className="p-2 space-y-1">
                        {filteredNavItems.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 h-10",
                              activeTab === item.id && "bg-muted text-foreground"
                            )}
                            onClick={() => {
                              setActiveTab(item.id)
                              setMobileMenuOpen(false)
                            }}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>

              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="sm:hidden">Back</span>
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              )}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Dashboard</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground capitalize">{activeTab.replace("-", " ")}</span>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">{renderContent()}</div>
      </main>

      {/* Dialogs */}
      <HeroEditDialog />
      <FeatureEditDialog />
      <TutorEditDialog />
      <SubjectEditDialog />
      <AnnouncementEditDialog />
      <PricingPlanEditDialog />
      <TestimonialEditDialog />
      <TeamMemberEditDialog />
      <NavigationEditDialog />

      {/* Simple content dialogs */}
      <SimpleEditDialog
        title="About Us"
        content={editingAboutUs}
        setContent={setEditingAboutUs}
        saveContent={saveAboutUsContent}
        fields={[
          { key: "mission", label: "Mission", type: "textarea" },
          { key: "goal", label: "Goal", type: "textarea" },
        ]}
      />

      <SimpleEditDialog
        title="Contact Us"
        content={editingContactUs}
        setContent={setEditingContactUs}
        saveContent={saveContactUsContent}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "logo", label: "Logo URL" },
          { key: "formEndpoint", label: "Form Endpoint" },
        ]}
      />

      <SimpleEditDialog
        title="Footer"
        content={editingFooter}
        setContent={setEditingFooter}
        saveContent={saveFooterContent}
        fields={[
          { key: "companyName", label: "Company Name" },
          { key: "tagline", label: "Tagline" },
          { key: "contactEmail", label: "Contact Email" },
          { key: "contactPhone", label: "Contact Phone" },
          { key: "copyrightText", label: "Copyright Text" },
        ]}
      />

      <SimpleEditDialog
        title="Become a Tutor"
        content={editingBecomeTutor}
        setContent={setEditingBecomeTutor}
        saveContent={saveBecomeTutorContent}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "applicationUrl", label: "Application URL" },
        ]}
      />

      <SimpleEditDialog
        title="Exam Rewrite"
        content={editingExamRewrite}
        setContent={setEditingExamRewrite}
        saveContent={saveExamRewriteContent}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "heroTitle", label: "Hero Title" },
          { key: "heroDescription", label: "Hero Description", type: "textarea" },
          { key: "applicationFormUrl", label: "Application Form URL" },
        ]}
      />

      <SimpleEditDialog
        title="University Application"
        content={editingUniversityApplication}
        setContent={setEditingUniversityApplication}
        saveContent={saveUniversityApplicationContent}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "formUrl", label: "Form URL" },
        ]}
      />

      {/* Bulk upload dialogs */}
      <BulkUploadDialog
        open={showAnnouncementBulkUploadDialog}
        onOpenChange={setShowAnnouncementBulkUploadDialog}
        title="Bulk Upload Announcements"
        description="Upload a CSV or JSON file to add or update announcements"
        onUpload={handleBulkAnnouncementUpload}
        templateCsvUrl="/templates/announcements-template.csv"
        templateJsonUrl="/templates/announcements-template.json"
        csvExample={`title,content,type,pinned,isActive,mediaUrl,mediaType
Important Update,"School will be closed on Friday","warning",true,true,,
Welcome,"Welcome to Excellence Akademie!","success",false,true,,
Article Title,"<p>Rich HTML content allowed</p>","info",false,true,https://example.com/banner.jpg,image`}
        jsonExample={`[
  { "title": "Important Update", "content": "School will be closed on Friday", "type": "warning", "pinned": true, "isActive": true },
  { "title": "Welcome", "content": "Welcome to Excellence Akademie!", "type": "success", "pinned": false, "isActive": true },
  { "title": "Article Title", "content": "<p>Rich HTML content allowed</p>", "type": "info", "pinned": false, "isActive": true, "mediaUrl": "https://example.com/banner.jpg", "mediaType": "image" }
]`}
        guidelines={[
          "type must be one of: info, warning, success",
          "pinned and isActive accept true/false/yes/no/1/0",
          "CSV fields with commas or line breaks should be quoted",
          "If title is empty, it is generated from the first 80 chars of content",
        ]}
        onExport={handleExportAnnouncements}
      />
      <BulkUploadDialog
        open={showBulkUploadDialog}
        onOpenChange={setShowBulkUploadDialog}
        title="Bulk Upload Pricing Plans"
        description="Upload a CSV, JSON, or Excel file to update multiple pricing plans at once"
        onUpload={handleBulkPricingUpload}
        templateCsvUrl="/templates/pricing-template.csv"
        templateJsonUrl="/templates/pricing-template.json"
        csvExample={`name,price,period,features,notIncluded,color,icon,popular,order
Basic Plan,R299,month,"Feature 1|Feature 2|Feature 3","Advanced Feature","bg-blue-500",Star,false,1
Pro Plan,R599,month,"All Basic|Feature 4|Feature 5","Enterprise Support","bg-purple-500",Zap,true,2`}
        jsonExample={`[
  {
    "name": "Basic Plan",
    "price": "R299",
    "period": "month",
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "notIncluded": ["Advanced Feature"],
    "color": "bg-blue-500",
    "icon": "Star",
    "popular": false,
    "order": 1
  }
]`}
        guidelines={[
          "Use pipe (|) or semicolon (;) to separate array items",
          "Use \"true\"/\"false\" for boolean values",
          "Existing plans (matched by name) will be updated",
          "Excel: Save as CSV before uploading",
        ]}
        onExport={handleExportPricing}
      />

      <BulkUploadDialog
        open={showTutorBulkUploadDialog}
        onOpenChange={setShowTutorBulkUploadDialog}
        title="Bulk Upload Tutors"
        description="Upload a CSV, JSON, or Excel file to update multiple tutors at once"
        onUpload={handleBulkTutorUpload}
        templateCsvUrl="/templates/tutors-template.csv"
        templateJsonUrl="/templates/tutors-template.json"
        csvExample={`name,subjects,image,contactName,contactPhone,contactEmail,description,order
John Doe,"Math|Physics|Chemistry","https://example.com/image.jpg","Jane Doe","+27123456789","john@example.com","Experienced tutor",1`}
        jsonExample={`[
  {
    "name": "John Doe",
    "subjects": ["Math", "Physics", "Chemistry"],
    "image": "https://example.com/image.jpg",
    "contactName": "Jane Doe",
    "contactPhone": "+27123456789",
    "contactEmail": "john@example.com",
    "description": "Experienced tutor",
    "order": 1
  }
]`}
        guidelines={[
          "Required: name and subjects",
          "Use pipe (|) or semicolon (;) to separate subjects",
          "Existing tutors (matched by name) will be updated",
          "Excel: Save as CSV before uploading",
        ]}
        onExport={handleExportTutors}
      />

      <BulkUploadDialog
        open={showTutorPlacementBulkUploadDialog}
        onOpenChange={setShowTutorPlacementBulkUploadDialog}
        title="Bulk Place Tutors"
        description="Upload JSON or CSV to place tutors into departments and courses automatically"
        onUpload={handleBulkTutorPlacementUpload}
        templateCsvUrl="/templates/tutor-placement-template.csv"
        templateJsonUrl="/templates/tutor-placement-template.json"
        csvExample={`name,subjects,courses,departments
Roshan (mr mvp),"Economics|Geography","Economics Grade 10-12|Geography Grade 10-12","Social Sciences|Commerce"`}
        jsonExample={`[
  {
    "name": "Roshan (mr mvp)",
    "subjects": ["Economics", "Geography"],
    "courses": [
      { "name": "Economics Grade 10-12", "subject": "Economics", "level": "High School" },
      { "name": "Geography Grade 10-12", "subject": "Geography", "level": "High School" }
    ],
    "departments": ["Social Sciences", "Commerce"]
  }
]`}
        guidelines={[
          "Recommended: use JSON for full courses/subjects/departments structure",
          "CSV: use pipe (|) to separate subjects, courses, and departments",
          "Existing tutors are matched by name; unknown tutors are skipped",
          "New courses are created in Courses Management for each unique title/department",
          "Excel: Save as CSV before uploading",
        ]}
      />

      <BulkUploadDialog
        open={showTeamBulkUploadDialog}
        onOpenChange={setShowTeamBulkUploadDialog}
        title="Bulk Upload Team Members"
        description="Upload a CSV or JSON file to update multiple team members at once"
        onUpload={handleBulkTeamUpload}
        templateCsvUrl="/templates/team-template.csv"
        templateJsonUrl="/templates/team-template.json"
        csvExample={`name,role,bio,image,order
Jane Smith,CEO,"Passionate about education","https://example.com/jane.jpg",1
John Doe,CTO,"Tech enthusiast","https://example.com/john.jpg",2`}
        jsonExample={`[
  {
    "name": "Jane Smith",
    "role": "CEO",
    "bio": "Passionate about education",
    "image": "https://example.com/jane.jpg",
    "order": 1
  }
]`}
        guidelines={[
          "Required: name and role",
          "Existing members (matched by name) will be updated",
          "Excel: Save as CSV before uploading",
        ]}
        onExport={handleExportTeamMembers}
      />
    </div>
  )
}
