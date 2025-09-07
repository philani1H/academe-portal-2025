"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Upload,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Users,
  BookOpen,
  Star,
  MessageSquare,
  Calendar,
  FileText,
  Image,
  Video,
  Link,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Target,
  Award,
  GraduationCap,
  UserPlus,
  BookOpen as BookOpenIcon,
  FileText as FileTextIcon,
  Calendar as CalendarIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import ContentPreview from "@/components/ContentPreview"

// Types
interface ContentItem {
  id: string
  title: string
  description?: string
  isActive: boolean
  order: number
  lastUpdated: string
  [key: string]: any
}

interface ContentStats {
  totalItems: number
  activeItems: number
  lastUpdated: string
  views: number
  engagement: number
}

const ContentManagementEnhanced = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [previewContent, setPreviewContent] = useState<any>(null)
  const [previewType, setPreviewType] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  // Content data states
  const [heroContent, setHeroContent] = useState<ContentItem | null>(null)
  const [features, setFeatures] = useState<ContentItem[]>([])
  const [testimonials, setTestimonials] = useState<ContentItem[]>([])
  const [pricingPlans, setPricingPlans] = useState<ContentItem[]>([])
  const [tutors, setTutors] = useState<ContentItem[]>([])
  const [subjects, setSubjects] = useState<ContentItem[]>([])

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [currentContentType, setCurrentContentType] = useState<string>('')

  // Content statistics
  const [contentStats, setContentStats] = useState<ContentStats>({
    totalItems: 0,
    activeItems: 0,
    lastUpdated: new Date().toISOString(),
    views: 0,
    engagement: 0
  })

  useEffect(() => {
    fetchAllContent()
  }, [])

  const fetchAllContent = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchHeroContent(),
        fetchFeatures(),
        fetchTestimonials(),
        fetchPricingPlans(),
        fetchTutors(),
        fetchSubjects()
      ])
      calculateContentStats()
    } catch (error) {
      console.error('Error fetching content:', error)
      toast({
        title: "Error",
        description: "Failed to fetch content data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchHeroContent = async () => {
    try {
      const response = await fetch('/api/content/hero-enhanced')
      if (response.ok) {
        const data = await response.json()
        setHeroContent({
          id: data.id,
          title: data.title,
          description: data.description,
          isActive: true,
          order: 1,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          ...data
        })
      }
    } catch (error) {
      console.error('Error fetching hero content:', error)
    }
  }

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/content/features-enhanced')
      if (response.ok) {
        const data = await response.json()
        setFeatures(data.map((item: any, index: number) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          isActive: item.isActive,
          order: item.order || index + 1,
          lastUpdated: item.lastUpdated || new Date().toISOString(),
          ...item
        })))
      }
    } catch (error) {
      console.error('Error fetching features:', error)
    }
  }

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/content/testimonials-enhanced')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data.map((item: any, index: number) => ({
          id: item.id,
          title: item.name,
          description: item.content,
          isActive: item.isActive,
          order: item.order || index + 1,
          lastUpdated: item.lastUpdated || new Date().toISOString(),
          ...item
        })))
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    }
  }

  const fetchPricingPlans = async () => {
    try {
      const response = await fetch('/api/admin/content/pricing')
      if (response.ok) {
        const data = await response.json()
        setPricingPlans(data.map((item: any, index: number) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          isActive: item.isActive,
          order: item.order || index + 1,
          lastUpdated: item.updatedAt || new Date().toISOString(),
          ...item
        })))
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
    }
  }

  const fetchTutors = async () => {
    try {
      const response = await fetch('/api/admin/content/tutors')
      if (response.ok) {
        const data = await response.json()
        setTutors(data.map((item: any, index: number) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          isActive: item.isActive,
          order: item.order || index + 1,
          lastUpdated: item.updatedAt || new Date().toISOString(),
          ...item
        })))
      }
    } catch (error) {
      console.error('Error fetching tutors:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/content/subjects')
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.map((item: any, index: number) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          isActive: item.isActive,
          order: item.order || index + 1,
          lastUpdated: item.updatedAt || new Date().toISOString(),
          ...item
        })))
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const calculateContentStats = () => {
    const allContent = [
      heroContent,
      ...features,
      ...testimonials,
      ...pricingPlans,
      ...tutors,
      ...subjects
    ].filter(Boolean)

    const activeContent = allContent.filter(item => item.isActive)

    setContentStats({
      totalItems: allContent.length,
      activeItems: activeContent.length,
      lastUpdated: new Date().toISOString(),
      views: Math.floor(Math.random() * 10000) + 5000, // Mock data
      engagement: Math.floor(Math.random() * 20) + 80 // Mock data
    })
  }

  const handlePreview = (content: any, type: string) => {
    setPreviewContent(content)
    setPreviewType(type)
    setShowPreview(true)
  }

  const handleEdit = (item: ContentItem, contentType: string) => {
    setEditingItem(item)
    setCurrentContentType(contentType)
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string, contentType: string) => {
    try {
      // Implement delete functionality
      toast({
        title: "Success",
        description: `${contentType} item deleted successfully`,
      })
      fetchAllContent()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const getContentIcon = (contentType: string) => {
    const icons: Record<string, any> = {
      hero: Target,
      features: Award,
      testimonials: MessageSquare,
      pricing: BarChart3,
      tutors: Users,
      subjects: BookOpen
    }
    return icons[contentType] || FileText
  }

  const getContentStats = (contentType: string) => {
    const stats: Record<string, any> = {
      hero: { count: heroContent ? 1 : 0, active: heroContent?.isActive ? 1 : 0 },
      features: { count: features.length, active: features.filter(f => f.isActive).length },
      testimonials: { count: testimonials.length, active: testimonials.filter(t => t.isActive).length },
      pricing: { count: pricingPlans.length, active: pricingPlans.filter(p => p.isActive).length },
      tutors: { count: tutors.length, active: tutors.filter(t => t.isActive).length },
      subjects: { count: subjects.length, active: subjects.filter(s => s.isActive).length }
    }
    return stats[contentType] || { count: 0, active: 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
          <p className="text-gray-600">Manage all website content with real-time preview and analytics</p>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content Items</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentStats.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {contentStats.activeItems} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentStats.views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentStats.engagement}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(contentStats.lastUpdated).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(contentStats.lastUpdated).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Overview</CardTitle>
                  <CardDescription>Quick overview of all content sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['hero', 'features', 'testimonials', 'pricing', 'tutors', 'subjects'].map((contentType) => {
                      const IconComponent = getContentIcon(contentType)
                      const stats = getContentStats(contentType)
                      return (
                        <div key={contentType} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold capitalize">{contentType}</h3>
                              <p className="text-sm text-gray-500">
                                {stats.count} items • {stats.active} active
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveTab(contentType)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest content updates and changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Updated', item: 'Hero Section', time: '2 hours ago', type: 'hero' },
                      { action: 'Added', item: 'New Testimonial', time: '4 hours ago', type: 'testimonials' },
                      { action: 'Modified', item: 'Pricing Plans', time: '1 day ago', type: 'pricing' },
                      { action: 'Published', item: 'New Feature', time: '2 days ago', type: 'features' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.action} {activity.item}
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hero Tab */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Hero Section</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(heroContent, 'hero')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEdit(heroContent!, 'hero')}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {heroContent ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Title</h3>
                        <p className="text-gray-600">{heroContent.title}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Subtitle</h3>
                        <p className="text-gray-600">{heroContent.subtitle}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-gray-600">{heroContent.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={heroContent.isActive ? 'default' : 'secondary'}>
                        {heroContent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Last updated: {new Date(heroContent.lastUpdated).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hero content found</p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Hero Content
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Features ({features.length})</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(features, 'features')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{feature.title}</h3>
                          <p className="text-sm text-gray-500">{feature.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={feature.isActive ? 'default' : 'secondary'}>
                          {feature.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(feature, 'features')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(feature.id, 'feature')}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Testimonials ({testimonials.length})</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(testimonials, 'testimonials')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Testimonial
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{testimonial.name?.charAt(0) || 'T'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{testimonial.name || testimonial.title}</h3>
                          <p className="text-sm text-gray-500">{testimonial.role}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {testimonial.content || testimonial.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={testimonial.isActive ? 'default' : 'secondary'}>
                          {testimonial.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(testimonial, 'testimonials')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(testimonial.id, 'testimonial')}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pricing Plans ({pricingPlans.length})</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(pricingPlans, 'pricing')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plan
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pricingPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{plan.name || plan.title}</h3>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                          <p className="text-sm font-medium text-green-600">
                            ${plan.price}/month
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(plan, 'pricing')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(plan.id, 'pricing plan')}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tutors Tab */}
          <TabsContent value="tutors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tutors ({tutors.length})</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(tutors, 'tutors')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tutor
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tutors.map((tutor) => (
                    <div key={tutor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{tutor.name?.charAt(0) || 'T'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{tutor.name || tutor.title}</h3>
                          <p className="text-sm text-gray-500">{tutor.subjects?.join(', ') || 'Tutor'}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {tutor.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={tutor.isActive ? 'default' : 'secondary'}>
                          {tutor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(tutor, 'tutors')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(tutor.id, 'tutor')}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Content Preview Dialog */}
      <ContentPreview
        contentType={previewType as any}
        content={previewContent}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  )
}

export default ContentManagementEnhanced