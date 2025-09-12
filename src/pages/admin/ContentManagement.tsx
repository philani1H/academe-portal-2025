"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  Upload,
  Settings,
  Home,
  Users,
  Star,
  MessageSquare,
  DollarSign,
  Info,
  Building,
  Phone,
  Mail,
  Globe,
  Palette,
  Type,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  GraduationCap,
  FileText,
  Calendar,
  UserPlus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

// Types for content management
interface HeroContent {
  id?: string
  title: string
  subtitle: string
  description: string
  buttonText: string
  secondaryButtonText: string
  trustIndicatorText: string
  universities: string[]
  features: Array<{
    title: string
    description: string
    icon: string
  }>
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
  content: string
  type: 'info' | 'warning' | 'success'
  pinned: boolean
  isActive?: boolean
  createdAt?: string
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

const ContentManagement = () => {
  const { toast } = useToast()
 
  
  // Helper: convert file to base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // Helper: upload image via API, returns URL string
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const dataUrl = await fileToBase64(file)
      const res = await apiFetch<{ url: string }>('/api/admin/upload', {
        method: 'POST',
        body: JSON.stringify({ file: dataUrl, fileName: file.name }),
      })
      if (!res || (!res.url && typeof res !== 'string')) {
        throw new Error('Invalid response from upload API')
      }
      return res.url || res
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      })
      throw error
    }
  }
  
  // State for different content types
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
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
  const [universityApplicationContent, setUniversityApplicationContent] = useState<UniversityApplicationContent | null>(null)
  
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
  const [editingUniversityApplication, setEditingUniversityApplication] = useState<UniversityApplicationContent | null>(null)
  
  const [loading, setLoading] = useState(true)

  // Fetch all content on component mount
  const fetchAllContent = React.useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchHeroContent(),
        fetchFeatures(),
        fetchAnnouncements(),
        fetchPricingPlans(),
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
        fetchUniversityApplicationContent()
      ])
    } catch (error) {
      console.error('Error fetching content:', error)
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

  // API functions
  const fetchHeroContent = async () => {
    try {
      const data = await apiFetch<HeroContent | null>(`/api/admin/content/hero`)
      if (data) setHeroContent(data)
    } catch (error) {
      console.error('Error fetching hero content:', error)
    }
  }

  const fetchFeatures = async () => {
    try {
      const data = await apiFetch<Feature[]>(`/api/admin/content/features`)
      setFeatures(data || [])
    } catch (error) {
      console.error('Error fetching features:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const data = await apiFetch<Announcement[]>(`/api/admin/content/announcements`)
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const fetchPricingPlans = async () => {
    try {
      const data = await apiFetch<PricingPlan[]>(`/api/admin/content/pricing`)
      setPricingPlans(data || [])
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
    }
  }

  const fetchTestimonials = async () => {
    try {
      const data = await apiFetch<Testimonial[]>(`/api/admin/content/testimonials`)
      setTestimonials(data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const data = await apiFetch<TeamMember[]>(`/api/admin/content/team-members`)
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchAboutUsContent = async () => {
    try {
      const data = await apiFetch<AboutUsContent | null>('/api/admin/content/about-us')
      if (data) setAboutUsContent(data)
    } catch (error) {
      console.error('Error fetching about us content:', error)
    }
  }

  const fetchTutors = async () => {
    try {
      const data = await apiFetch<Tutor[]>('/api/admin/content/tutors')
      setTutors(data || [])
    } catch (error) {
      console.error('Error fetching tutors:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const data = await apiFetch<Subject[]>('/api/admin/content/subjects')
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchFooterContent = async () => {
    try {
      const data = await apiFetch<FooterContent | null>('/api/admin/content/footer')
      if (data) setFooterContent(data)
    } catch (error) {
      console.error('Error fetching footer content:', error)
    }
  }

  const fetchNavigationItems = async () => {
    try {
      const data = await apiFetch<NavigationItem[]>('/api/admin/content/navigation')
      setNavigationItems(data || [])
    } catch (error) {
      console.error('Error fetching navigation items:', error)
    }
  }

  const fetchContactUsContent = async () => {
    try {
      const data = await apiFetch<ContactUsContent | null>('/api/admin/content/contact-us')
      if (data) setContactUsContent(data)
    } catch (error) {
      console.error('Error fetching contact us content:', error)
    }
  }

  const fetchBecomeTutorContent = async () => {
    try {
      const data = await apiFetch<BecomeTutorContent | null>('/api/admin/content/become-tutor')
      if (data) setBecomeTutorContent(data)
    } catch (error) {
      console.error('Error fetching become tutor content:', error)
    }
  }

  const fetchExamRewriteContent = async () => {
    try {
      const data = await apiFetch<ExamRewriteContent | null>('/api/admin/content/exam-rewrite')
      if (data) setExamRewriteContent(data)
    } catch (error) {
      console.error('Error fetching exam rewrite content:', error)
    }
  }

  const fetchUniversityApplicationContent = async () => {
    try {
      const data = await apiFetch<UniversityApplicationContent | null>('/api/admin/content/university-application')
      if (data) setUniversityApplicationContent(data)
    } catch (error) {
      console.error('Error fetching university application content:', error)
    }
  }

  // Save functions
  const saveHeroContent = async (content: HeroContent) => {
    try {
      const method = content.id ? 'PUT' : 'POST'
      const data = await apiFetch<HeroContent>('/api/admin/content/hero', {
        method,
        body: JSON.stringify(content)
      })
      setHeroContent(data)
      setEditingHero(null)
      toast({ title: "Success", description: "Hero content saved successfully" })
    } catch (error) {
      console.error('Error saving hero content:', error)
      toast({
        title: "Error",
        description: "Failed to save hero content",
        variant: "destructive",
      })
    }
  }

  const saveFeature = async (feature: Feature) => {
    try {
      const method = feature.id ? 'PUT' : 'POST'
      const data = await apiFetch<Feature>('/api/admin/content/features', {
        method,
        body: JSON.stringify(feature)
      })
      if (feature.id) {
        setFeatures(features.map(f => f.id === feature.id ? data : f))
      } else {
        setFeatures([...features, data])
      }
      setEditingFeature(null)
      toast({ title: "Success", description: "Feature saved successfully" })
    } catch (error) {
      console.error('Error saving feature:', error)
      toast({
        title: "Error",
        description: "Failed to save feature",
        variant: "destructive",
      })
    }
  }

  const deleteFeature = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/features?id=${id}`, { method: 'DELETE' })
      setFeatures(features.filter(f => f.id !== id))
      toast({ title: "Success", description: "Feature deleted successfully" })
    } catch (error) {
      console.error('Error deleting feature:', error)
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      })
    }
  }

  // Testimonial save
  const saveTestimonial = async (testimonial: Testimonial) => {
    const method = testimonial.id ? 'PUT' : 'POST'
    try {
      const data = await apiFetch<Testimonial>('/api/admin/content/testimonials', {
        method,
        body: JSON.stringify(testimonial)
      })
      if (testimonial.id) {
        setTestimonials(testimonials.map(t => t.id === testimonial.id ? data : t))
      } else {
        setTestimonials([...testimonials, data])
      }
      setEditingTestimonial(null)
      toast({ title: 'Success', description: 'Testimonial saved successfully' })
    } catch (error) {
      console.error('Error saving testimonial:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save testimonial',
        variant: 'destructive',
      })
    }
  }

  // Team member save
  const saveTeamMember = async (member: TeamMember) => {
    const method = member.id ? 'PUT' : 'POST'
    try {
      const data = await apiFetch<TeamMember>('/api/admin/content/team-members', {
        method,
        body: JSON.stringify(member)
      })
      if (member.id) {
        setTeamMembers(teamMembers.map(m => m.id === member.id ? data : m))
      } else {
        setTeamMembers([...teamMembers, data])
      }
      setEditingTeamMember(null)
      toast({ title: 'Success', description: 'Team member saved successfully' })
    } catch (error) {
      console.error('Error saving team member:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save team member',
        variant: 'destructive',
      })
    }
  }

  const deletePricingPlan = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/pricing?id=${id}`, { method: 'DELETE' })
      setPricingPlans(pricingPlans.filter(p => p.id !== id))
      toast({ title: "Success", description: "Pricing plan deleted successfully" })
    } catch (error) {
      console.error('Error deleting pricing plan:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete pricing plan",
        variant: "destructive",
      })
    }
  }

  const deleteTestimonial = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/testimonials?id=${id}`, { method: 'DELETE' })
      setTestimonials(testimonials.filter(t => t.id !== id))
      toast({ title: "Success", description: "Testimonial deleted successfully" })
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete testimonial",
        variant: "destructive",
      })
    }
  }

  const deleteTeamMember = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/team-members?id=${id}`, { method: 'DELETE' })
      setTeamMembers(teamMembers.filter(m => m.id !== id))
      toast({ title: "Success", description: "Team member deleted successfully" })
    } catch (error) {
      console.error('Error deleting team member:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete team member",
        variant: "destructive",
      })
    }
  }

  const deleteTutor = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/tutors?id=${id}`, { method: 'DELETE' })
      setTutors(tutors.filter(t => t.id !== id))
      toast({ title: "Success", description: "Tutor deleted successfully" })
    } catch (error) {
      console.error('Error deleting tutor:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tutor",
        variant: "destructive",
      })
    }
  }

  const deleteSubject = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/subjects?id=${id}`, { method: 'DELETE' })
      setSubjects(subjects.filter(s => s.id !== id))
      toast({ title: "Success", description: "Subject deleted successfully" })
    } catch (error) {
      console.error('Error deleting subject:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subject",
        variant: "destructive",
      })
    }
  }

  const deleteNavigationItem = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/navigation?id=${id}`, { method: 'DELETE' })
      setNavigationItems(navigationItems.filter(n => n.id !== id))
      toast({ title: "Success", description: "Navigation item deleted successfully" })
    } catch (error) {
      console.error('Error deleting navigation item:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete navigation item",
        variant: "destructive",
      })
    }
  }

  const saveAnnouncement = async (announcement: Announcement) => {
    try {
      const method = announcement.id ? 'PUT' : 'POST'
      const data = await apiFetch<Announcement>('/api/admin/content/announcements', {
        method,
        body: JSON.stringify(announcement)
      })
      if (announcement.id) {
        setAnnouncements(announcements.map(a => a.id === announcement.id ? data : a))
      } else {
        setAnnouncements([...announcements, data])
      }
      setEditingAnnouncement(null)
      toast({ title: 'Success', description: 'Announcement saved successfully' })
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save announcement',
        variant: 'destructive',
      })
    }
  }

  const deleteAnnouncement = async (id: string) => {
    try {
      await apiFetch(`/api/admin/content/announcements?id=${id}`, { method: 'DELETE' })
      setAnnouncements(announcements.filter(a => a.id !== id))
      toast({ title: 'Success', description: 'Announcement deleted successfully' })
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete announcement',
        variant: 'destructive',
      })
    }
  }

  const renderHeroContentTab = () => (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Home className="h-6 w-6 text-blue-600" />
          Hero Section Content
        </CardTitle>
        <CardDescription className="text-gray-600">
          Manage the main hero section content on the homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {heroContent ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Title</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800 font-medium">{heroContent.title}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Subtitle</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">{heroContent.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-800">{heroContent.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Primary Button Text</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">{heroContent.buttonText}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Secondary Button Text</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">{heroContent.secondaryButtonText}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setEditingHero(heroContent)} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit Hero Content
              </Button>
              <Button variant="outline" onClick={() => window.open('/', '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-6 text-lg">No hero content found</p>
            <Button onClick={() => setEditingHero({
              title: '',
              subtitle: '',
              description: '',
              buttonText: '',
              secondaryButtonText: '',
              trustIndicatorText: '',
              universities: [],
              features: [],
              backgroundGradient: ''
            })} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Hero Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderFeaturesTab = () => (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Star className="h-6 w-6 text-green-600" />
              Features Management
            </CardTitle>
            <CardDescription className="text-gray-600">
              Manage website features and benefits
            </CardDescription>
          </div>
          <Button 
            onClick={() => setEditingFeature({
              title: '',
              description: '',
              icon: '',
              benefits: ['']
            })}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Features ({features.length})</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.id} className="p-6 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-lg">{feature.title}</h4>
                    <p className="text-sm text-gray-600 mt-2">{feature.description}</p>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFeature(feature)}
                      className="hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFeature(feature.id!)}
                      className="hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">Benefits:</Label>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="secondary" className="text-xs">
                    {feature.icon || 'No Icon'}
                  </Badge>
                  <Badge variant={feature.isActive !== false ? "default" : "secondary"} className="text-xs">
                    {feature.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
          
          {features.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-6 text-lg">No features found</p>
              <p className="text-gray-400 text-sm mb-6">Add your first feature to get started with content management</p>
              <Button 
                onClick={() => setEditingFeature({
                  title: '',
                  description: '',
                  icon: '',
                  benefits: ['']
                })}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Hero Content Edit Dialog
  const HeroEditDialog = () => (
    <Dialog open={!!editingHero} onOpenChange={() => setEditingHero(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Hero Content</DialogTitle>
          <DialogDescription>
            Update the main hero section content
          </DialogDescription>
        </DialogHeader>
        
        {editingHero && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingHero.title}
                  onChange={(e) => setEditingHero({
                    ...editingHero,
                    title: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={editingHero.subtitle}
                  onChange={(e) => setEditingHero({
                    ...editingHero,
                    subtitle: e.target.value
                  })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingHero.description}
                onChange={(e) => setEditingHero({
                  ...editingHero,
                  description: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buttonText">Primary Button Text</Label>
                <Input
                  id="buttonText"
                  value={editingHero.buttonText}
                  onChange={(e) => setEditingHero({
                    ...editingHero,
                    buttonText: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="secondaryButtonText">Secondary Button Text</Label>
                <Input
                  id="secondaryButtonText"
                  value={editingHero.secondaryButtonText}
                  onChange={(e) => setEditingHero({
                    ...editingHero,
                    secondaryButtonText: e.target.value
                  })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="trustIndicatorText">Trust Indicator Text</Label>
              <Input
                id="trustIndicatorText"
                value={editingHero.trustIndicatorText}
                onChange={(e) => setEditingHero({
                  ...editingHero,
                  trustIndicatorText: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="universities">Universities (comma-separated)</Label>
              <Input
                id="universities"
                value={editingHero.universities.join(', ')}
                onChange={(e) => setEditingHero({
                  ...editingHero,
                  universities: e.target.value.split(',').map(u => u.trim())
                })}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingHero(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingHero && saveHeroContent(editingHero)}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Feature Edit Dialog
  const FeatureEditDialog = () => (
    <Dialog open={!!editingFeature} onOpenChange={() => setEditingFeature(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingFeature?.id ? 'Edit' : 'Add'} Feature</DialogTitle>
          <DialogDescription>
            {editingFeature?.id ? 'Update' : 'Create'} a feature for the website
          </DialogDescription>
        </DialogHeader>
        
        {editingFeature && (
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="featureTitle">Title</Label>
              <Input
                id="featureTitle"
                value={editingFeature.title}
                onChange={(e) => setEditingFeature({
                  ...editingFeature,
                  title: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="featureDescription">Description</Label>
              <Textarea
                id="featureDescription"
                value={editingFeature.description}
                onChange={(e) => setEditingFeature({
                  ...editingFeature,
                  description: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="featureIcon">Icon</Label>
              <Select
                value={editingFeature.icon}
                onValueChange={(value) => setEditingFeature({
                  ...editingFeature,
                  icon: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curriculum">Curriculum</SelectItem>
                  <SelectItem value="tutors">Tutors</SelectItem>
                  <SelectItem value="cost">Cost-Effective</SelectItem>
                  <SelectItem value="focus">Better Focus</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="global">Global Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Benefits</Label>
              {editingFeature.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={benefit}
                    onChange={(e) => {
                      const newBenefits = [...editingFeature.benefits]
                      newBenefits[index] = e.target.value
                      setEditingFeature({
                        ...editingFeature,
                        benefits: newBenefits
                      })
                    }}
                    placeholder="Enter benefit"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newBenefits = editingFeature.benefits.filter((_, i) => i !== index)
                      setEditingFeature({
                        ...editingFeature,
                        benefits: newBenefits
                      })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditingFeature({
                  ...editingFeature,
                  benefits: [...editingFeature.benefits, '']
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Benefit
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingFeature(null)}>
            Cancel
          </Button>
          <Button onClick={() => editingFeature && saveFeature(editingFeature)}>
            {editingFeature?.id ? 'Update' : 'Create'} Feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Testimonial Edit Dialog
  const TestimonialEditDialog = () => (
    <Dialog open={!!editingTestimonial} onOpenChange={() => setEditingTestimonial(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingTestimonial?.id ? 'Edit' : 'Add'} Testimonial</DialogTitle>
          <DialogDescription>Manage testimonial content and image</DialogDescription>
        </DialogHeader>
        {editingTestimonial && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Author</Label>
                <Input value={editingTestimonial.author} onChange={e => setEditingTestimonial({ ...editingTestimonial, author: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={editingTestimonial.role} onChange={e => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject</Label>
                <Input value={editingTestimonial.subject} onChange={e => setEditingTestimonial({ ...editingTestimonial, subject: e.target.value })} />
              </div>
              <div>
                <Label>Rating</Label>
                <Input type="number" min={1} max={5} value={editingTestimonial.rating} onChange={e => setEditingTestimonial({ ...editingTestimonial, rating: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea rows={3} value={editingTestimonial.content} onChange={e => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label>Image URL</Label>
                <Input value={editingTestimonial.image} onChange={e => setEditingTestimonial({ ...editingTestimonial, image: e.target.value })} placeholder="/uploads/.. or https://" />
              </div>
              <div>
                <Label>Upload Image</Label>
                <Input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await uploadImage(file)
                  setEditingTestimonial({ ...editingTestimonial, image: url })
                }} />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingTestimonial(null)}>Cancel</Button>
          <Button onClick={() => editingTestimonial && saveTestimonial(editingTestimonial)}>
            {editingTestimonial?.id ? 'Update' : 'Create'} Testimonial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Team Member Edit Dialog
  const TeamMemberEditDialog = () => (
    <Dialog open={!!editingTeamMember} onOpenChange={() => setEditingTeamMember(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingTeamMember?.id ? 'Edit' : 'Add'} Team Member</DialogTitle>
          <DialogDescription>Manage team member details and image</DialogDescription>
        </DialogHeader>
        {editingTeamMember && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={editingTeamMember.name} onChange={e => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={editingTeamMember.role} onChange={e => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea rows={3} value={editingTeamMember.bio} onChange={e => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label>Image URL</Label>
                <Input value={editingTeamMember.image} onChange={e => setEditingTeamMember({ ...editingTeamMember, image: e.target.value })} placeholder="/uploads/..." />
              </div>
              <div>
                <Label>Upload Image</Label>
                <Input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await uploadImage(file)
                  setEditingTeamMember({ ...editingTeamMember, image: url })
                }} />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingTeamMember(null)}>Cancel</Button>
          <Button onClick={() => editingTeamMember && saveTeamMember(editingTeamMember)}>
            {editingTeamMember?.id ? 'Update' : 'Create'} Team Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
              <p className="text-gray-600 mt-2">Manage all website content from one centralized dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Content Items</p>
                  <p className="text-2xl font-bold">{features.length + pricingPlans.length + testimonials.length + teamMembers.length + tutors.length + subjects.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Features</p>
                  <p className="text-2xl font-bold">{features.filter(f => f.isActive !== false).length}</p>
                </div>
                <Star className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Tutors Available</p>
                  <p className="text-2xl font-bold">{tutors.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Subjects Covered</p>
                  <p className="text-2xl font-bold">{subjects.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="tutors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tutors
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <div className="space-y-6">
              <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm border">
                  <TabsTrigger value="hero" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Hero
                  </TabsTrigger>
                  <TabsTrigger value="features" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Features
                  </TabsTrigger>
                  <TabsTrigger value="announcements" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    News
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="testimonials" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Reviews
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="mt-6">
                  {renderHeroContentTab()}
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                  {renderFeaturesTab()}
                </TabsContent>

                <TabsContent value="announcements" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Announcements & News
                      </CardTitle>
                      <CardDescription>
                        Manage announcements and news updates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Announcements ({announcements.length})</h3>
                        <Button onClick={() => setEditingAnnouncement({
                          content: '',
                          type: 'info',
                          pinned: false
                        })}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Announcement
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <Card key={announcement.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={announcement.type === 'info' ? 'bg-blue-100 text-blue-800' : 
                                                   announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                                                   'bg-green-100 text-green-800'}>
                                    {announcement.type}
                                  </Badge>
                                  {announcement.pinned && <Badge className="bg-red-100 text-red-800">Pinned</Badge>}
                                </div>
                                <p className="text-sm text-gray-600">{announcement.content}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingAnnouncement(announcement)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => announcement.id && deleteAnnouncement(announcement.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {announcements.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No announcements found. Add your first announcement to get started.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pricing" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing Plans
                      </CardTitle>
                      <CardDescription>
                        Manage pricing plans and packages
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Pricing Plans ({pricingPlans.length})</h3>
                        <Button onClick={() => setEditingPricingPlan({
                          name: '',
                          price: '',
                          period: '',
                          features: [],
                          notIncluded: [],
                          color: 'blue',
                          icon: 'star',
                          popular: false
                        })}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Pricing Plan
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {pricingPlans.map((plan) => (
                          <Card key={plan.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{plan.name}</h4>
                                  {plan.popular && <Badge className="bg-yellow-100 text-yellow-800">Popular</Badge>}
                                </div>
                                <p className="text-lg font-bold text-gray-900">{plan.price} {plan.period}</p>
                                <p className="text-sm text-gray-600 mt-1">{plan.features.length} features included</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingPricingPlan(plan)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => plan.id && deletePricingPlan(plan.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {pricingPlans.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No pricing plans found. Add your first pricing plan to get started.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="testimonials" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Testimonials & Reviews
                      </CardTitle>
                      <CardDescription>
                        Manage customer testimonials and reviews
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Testimonials ({testimonials.length})</h3>
                        <Button onClick={() => setEditingTestimonial({
                          content: '',
                          author: '',
                          role: '',
                          subject: '',
                          improvement: '',
                          image: '',
                          rating: 5
                        })}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Testimonial
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {testimonials.map((testimonial) => (
                          <Card key={testimonial.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{testimonial.author}</h4>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{testimonial.content}</p>
                                <p className="text-xs text-gray-500 mt-2">{testimonial.role} - {testimonial.subject}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingTestimonial(testimonial)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => testimonial.id && deleteTestimonial(testimonial.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {testimonials.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No testimonials found. Add your first testimonial to get started.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="team" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                      </CardTitle>
                      <CardDescription>
                        Manage team member profiles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Team Members ({teamMembers.length})</h3>
                        <Button onClick={() => setEditingTeamMember({
                          name: '',
                          role: '',
                          bio: '',
                          image: ''
                        })}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Team Member
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {teamMembers.map((member) => (
                          <Card key={member.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold">{member.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{member.role}</p>
                                <p className="text-sm text-gray-500 mt-2">{member.bio}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingTeamMember(member)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => member.id && deleteTeamMember(member.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {teamMembers.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No team members found. Add your first team member to get started.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="tutors" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="h-6 w-6 text-purple-600" />
                      Tutors Management
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage all tutors, their subjects, contact info, and ratings
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setEditingTutor({
                      name: '',
                      subjects: [],
                      image: '',
                      contactName: '',
                      contactPhone: '',
                      contactEmail: '',
                      description: '',
                      ratings: []
                    })}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tutor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Tutors ({tutors.length})</h3>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search tutors..." className="w-64" />
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tutors.map((tutor) => (
                    <Card key={tutor.id} className="p-6 hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">{tutor.name}</h4>
                              <p className="text-sm text-gray-600">{tutor.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTutor(tutor)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => tutor.id && deleteTutor(tutor.id)}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Subjects:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tutor.subjects.map((subject, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{tutor.contactEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{tutor.contactPhone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant={tutor.isActive !== false ? "default" : "secondary"} className="text-xs">
                            {tutor.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">4.8</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {tutors.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-6 text-lg">No tutors found</p>
                      <p className="text-gray-400 text-sm mb-6">Add your first tutor to start building your team</p>
                      <Button 
                        onClick={() => setEditingTutor({
                          name: '',
                          subjects: [],
                          image: '',
                          contactName: '',
                          contactPhone: '',
                          contactEmail: '',
                          description: '',
                          ratings: []
                        })}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tutor
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="h-6 w-6 text-orange-600" />
                      Subjects Management
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage all subjects, categories, topics, and difficulty levels
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setEditingSubject({
                      name: '',
                      description: '',
                      image: '',
                      category: '',
                      tutorsCount: 0,
                      popularTopics: [],
                      difficulty: []
                    })}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Subjects ({subjects.length})</h3>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search subjects..." className="w-64" />
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((subject) => (
                    <Card key={subject.id} className="p-6 hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">{subject.name}</h4>
                              <p className="text-sm text-gray-600">{subject.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSubject(subject)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => subject.id && deleteSubject(subject.id)}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {subject.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {subject.tutorsCount} tutors
                            </Badge>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Popular Topics:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {subject.popularTopics.slice(0, 3).map((topic, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                              {subject.popularTopics.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{subject.popularTopics.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Difficulty Levels:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {subject.difficulty.map((level, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {level}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant={subject.isActive !== false ? "default" : "secondary"} className="text-xs">
                            {subject.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {subject.popularTopics.length} topics
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {subjects.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-6 text-lg">No subjects found</p>
                      <p className="text-gray-400 text-sm mb-6">Add your first subject to start building your curriculum</p>
                      <Button 
                        onClick={() => setEditingSubject({
                          name: '',
                          description: '',
                          image: '',
                          category: '',
                          tutorsCount: 0,
                          popularTopics: [],
                          difficulty: []
                        })}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="mt-6">
            <div className="space-y-6">
              <Tabs defaultValue="become-tutor" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="become-tutor">Become Tutor</TabsTrigger>
                  <TabsTrigger value="exam-rewrite">Exam Rewrite</TabsTrigger>
                  <TabsTrigger value="university-application">University App</TabsTrigger>
                  <TabsTrigger value="about-us">About Us</TabsTrigger>
                </TabsList>

                <TabsContent value="become-tutor" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Become Tutor Page
                      </CardTitle>
                      <CardDescription>
                        Manage the become tutor page content and application form
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {becomeTutorContent ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Title</Label>
                            <p className="text-sm text-gray-600">{becomeTutorContent.title}</p>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <p className="text-sm text-gray-600">{becomeTutorContent.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingBecomeTutor(becomeTutorContent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Content
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No become tutor content found</p>
                          <Button onClick={() => setEditingBecomeTutor({
                            title: '',
                            description: '',
                            requirements: [],
                            benefits: [],
                            applicationUrl: ''
                          })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Content
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="exam-rewrite" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Exam Rewrite Page
                      </CardTitle>
                      <CardDescription>
                        Manage the exam rewrite program content and forms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {examRewriteContent ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Title</Label>
                            <p className="text-sm text-gray-600">{examRewriteContent.title}</p>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <p className="text-sm text-gray-600">{examRewriteContent.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingExamRewrite(examRewriteContent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Content
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No exam rewrite content found</p>
                          <Button onClick={() => setEditingExamRewrite({
                            title: '',
                            description: '',
                            heroTitle: '',
                            heroDescription: '',
                            benefits: [],
                            process: [],
                            subjects: [],
                            applicationFormUrl: '',
                            pricingInfo: {}
                          })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Content
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="university-application" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        University Application Page
                      </CardTitle>
                      <CardDescription>
                        Manage the university application services content
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {universityApplicationContent ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Title</Label>
                            <p className="text-sm text-gray-600">{universityApplicationContent.title}</p>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <p className="text-sm text-gray-600">{universityApplicationContent.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingUniversityApplication(universityApplicationContent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Content
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No university application content found</p>
                          <Button onClick={() => setEditingUniversityApplication({
                            title: '',
                            description: '',
                            services: [],
                            process: [],
                            requirements: [],
                            pricing: {}
                          })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Content
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="about-us" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        About Us Page
                      </CardTitle>
                      <CardDescription>
                        Manage the about us page content and team information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {aboutUsContent ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Goal</Label>
                            <p className="text-sm text-gray-600">{aboutUsContent.goal}</p>
                          </div>
                          <div>
                            <Label>Mission</Label>
                            <p className="text-sm text-gray-600">{aboutUsContent.mission}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingAboutUs(aboutUsContent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Content
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No about us content found</p>
                          <Button onClick={() => setEditingAboutUs({
                            goal: '',
                            mission: '',
                            rolesResponsibilities: {}
                          })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Content
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <Tabs defaultValue="footer" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="footer">Footer</TabsTrigger>
                  <TabsTrigger value="navigation">Navigation</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="site">Site</TabsTrigger>
                </TabsList>

                <TabsContent value="footer" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Footer Content
                      </CardTitle>
                      <CardDescription>
                        Manage footer content, social links, and contact information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {footerContent ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Company Name</Label>
                            <p className="text-sm text-gray-600">{footerContent.companyName}</p>
                          </div>
                          <div>
                            <Label>Tagline</Label>
                            <p className="text-sm text-gray-600">{footerContent.tagline}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Contact Email</Label>
                              <p className="text-sm text-gray-600">{footerContent.contactEmail}</p>
                            </div>
                            <div>
                              <Label>Contact Phone</Label>
                              <p className="text-sm text-gray-600">{footerContent.contactPhone}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingFooter(footerContent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Footer Content
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No footer content found</p>
                          <Button onClick={() => setEditingFooter({
                            companyName: '',
                            tagline: '',
                            contactPhone: '',
                            contactEmail: '',
                            contactPerson: '',
                            whatsappLink: '',
                            socialLinks: {},
                            quickLinks: [],
                            resourceLinks: [],
                            copyrightText: ''
                          })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Footer Content
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="navigation" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Navigation Menu
                      </CardTitle>
                      <CardDescription>
                        Manage navigation menu items and links
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Navigation Items ({navigationItems.length})</h3>
                        <Button onClick={() => setEditingNavigation({
                          path: '',
                          label: '',
                          type: 'main'
                        })}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Navigation Item
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {navigationItems.map((item) => (
                          <Card key={item.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold">{item.label}</h4>
                                <p className="text-sm text-gray-600 mt-1">Path: {item.path}</p>
                                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                  <span>Type: {item.type}</span>
                                  <span>Active: {item.isActive ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingNavigation(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => item.id && deleteNavigationItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {navigationItems.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No navigation items found. Add your first navigation item to get started.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contact" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contact Us Page
                      </CardTitle>
                      <CardDescription>
                        Manage contact page content and form settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {contactUsContent ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Title</Label>
                            <p className="text-sm text-gray-600">{contactUsContent.title}</p>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <p className="text-sm text-gray-600">{contactUsContent.description}</p>
                          </div>
                          <div>
                            <Label>Form Endpoint</Label>
                            <p className="text-sm text-gray-600">{contactUsContent.formEndpoint}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingContactUs(contactUsContent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Contact Page
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No contact page content found</p>
                          <Button onClick={() => setEditingContactUs({
                            title: '',
                            description: '',
                            logo: '',
                            formEndpoint: '',
                            contactInfo: {}
                          })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Contact Page
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="site" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Site Settings
                      </CardTitle>
                      <CardDescription>
                        Manage general site settings and configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Site settings management interface</p>
                        <p className="text-sm text-gray-400">
                          Configure general site settings, SEO, integrations, and more
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Edit Dialogs */}
      <HeroEditDialog />
      <FeatureEditDialog />
    </div>
  )
}

export default ContentManagement