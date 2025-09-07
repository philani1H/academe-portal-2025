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
  ToggleRight
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
  rolesResponsibilities: any
  isActive?: boolean
}

const ContentManagement = () => {
  const { toast } = useToast()
  
  // State for different content types
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [aboutUsContent, setAboutUsContent] = useState<AboutUsContent | null>(null)
  
  // Dialog states
  const [editingHero, setEditingHero] = useState<HeroContent | null>(null)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [editingPricingPlan, setEditingPricingPlan] = useState<PricingPlan | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null)
  const [editingAboutUs, setEditingAboutUs] = useState<AboutUsContent | null>(null)
  
  const [loading, setLoading] = useState(true)

  // Fetch all content on component mount
  useEffect(() => {
    fetchAllContent()
  }, [])

  const fetchAllContent = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchHeroContent(),
        fetchFeatures(),
        fetchAnnouncements(),
        fetchPricingPlans(),
        fetchTestimonials(),
        fetchTeamMembers(),
        fetchAboutUsContent()
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
  }

  // API functions
  const fetchHeroContent = async () => {
    try {
      const response = await fetch('/api/admin/content/hero')
      if (response.ok) {
        const data = await response.json()
        setHeroContent(data)
      }
    } catch (error) {
      console.error('Error fetching hero content:', error)
    }
  }

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/admin/content/features')
      if (response.ok) {
        const data = await response.json()
        setFeatures(data)
      }
    } catch (error) {
      console.error('Error fetching features:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/content/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const fetchPricingPlans = async () => {
    try {
      const response = await fetch('/api/admin/content/pricing')
      if (response.ok) {
        const data = await response.json()
        setPricingPlans(data)
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
    }
  }

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/admin/content/testimonials')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data)
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/content/team-members')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchAboutUsContent = async () => {
    try {
      const response = await fetch('/api/admin/content/about-us')
      if (response.ok) {
        const data = await response.json()
        setAboutUsContent(data)
      }
    } catch (error) {
      console.error('Error fetching about us content:', error)
    }
  }

  // Save functions
  const saveHeroContent = async (content: HeroContent) => {
    try {
      const method = content.id ? 'PUT' : 'POST'
      const response = await fetch('/api/admin/content/hero', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      })

      if (response.ok) {
        const data = await response.json()
        setHeroContent(data)
        setEditingHero(null)
        toast({
          title: "Success",
          description: "Hero content saved successfully",
        })
      } else {
        throw new Error('Failed to save hero content')
      }
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
      const response = await fetch('/api/admin/content/features', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feature)
      })

      if (response.ok) {
        const data = await response.json()
        if (feature.id) {
          setFeatures(features.map(f => f.id === feature.id ? data : f))
        } else {
          setFeatures([...features, data])
        }
        setEditingFeature(null)
        toast({
          title: "Success",
          description: "Feature saved successfully",
        })
      } else {
        throw new Error('Failed to save feature')
      }
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
      const response = await fetch(`/api/admin/content/features?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFeatures(features.filter(f => f.id !== id))
        toast({
          title: "Success",
          description: "Feature deleted successfully",
        })
      } else {
        throw new Error('Failed to delete feature')
      }
    } catch (error) {
      console.error('Error deleting feature:', error)
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      })
    }
  }

  // Similar functions for other content types...

  const renderHeroContentTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Hero Section Content
        </CardTitle>
        <CardDescription>
          Manage the main hero section content on the homepage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {heroContent ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <p className="text-sm text-gray-600">{heroContent.title}</p>
              </div>
              <div>
                <Label>Subtitle</Label>
                <p className="text-sm text-gray-600">{heroContent.subtitle}</p>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <p className="text-sm text-gray-600">{heroContent.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Button Text</Label>
                <p className="text-sm text-gray-600">{heroContent.buttonText}</p>
              </div>
              <div>
                <Label>Secondary Button Text</Label>
                <p className="text-sm text-gray-600">{heroContent.secondaryButtonText}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setEditingHero(heroContent)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Hero Content
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No hero content found</p>
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
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Hero Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderFeaturesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Features Management
        </CardTitle>
        <CardDescription>
          Manage website features and benefits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Features ({features.length})</h3>
          <Button onClick={() => setEditingFeature({
            title: '',
            description: '',
            icon: '',
            benefits: ['']
          })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
        
        <div className="space-y-4">
          {features.map((feature) => (
            <Card key={feature.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  <div className="mt-2">
                    <Label className="text-xs">Benefits:</Label>
                    <ul className="text-xs text-gray-500 list-disc list-inside">
                      {feature.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingFeature(feature)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFeature(feature.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {features.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No features found. Add your first feature to get started.
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
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-2">Manage all website content from one place</p>
        </div>

        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <div className="space-y-6">
              <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="hero">Hero</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="announcements">News</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="testimonials">Reviews</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
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
                      <p className="text-gray-500">Announcements management coming soon...</p>
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
                      <p className="text-gray-500">Pricing management coming soon...</p>
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
                      <p className="text-gray-500">Testimonials management coming soon...</p>
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
                      <p className="text-gray-500">Team management coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="tutors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tutors Management
                </CardTitle>
                <CardDescription>
                  Manage all tutors, their subjects, contact info, and ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Tutors (Loading...)</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tutor
                  </Button>
                </div>
                <p className="text-gray-500">Tutors management interface will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subjects Management
                </CardTitle>
                <CardDescription>
                  Manage all subjects, categories, topics, and difficulty levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Subjects (Loading...)</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </div>
                <p className="text-gray-500">Subjects management interface will be implemented here...</p>
              </CardContent>
            </Card>
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
                      <p className="text-gray-500">Footer management coming soon...</p>
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
                      <p className="text-gray-500">Navigation management coming soon...</p>
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
                      <p className="text-gray-500">Contact page management coming soon...</p>
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
                      <p className="text-gray-500">Site settings management coming soon...</p>
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