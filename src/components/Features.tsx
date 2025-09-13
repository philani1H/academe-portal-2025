"use client"

import { useState, useEffect, useRef } from "react"

import { apiFetch } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Info, MessageSquare, Plus, X, Edit, Trash2, Star } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Feature {
  id?: string
  title: string
  description: string
  icon: string
  benefits: string[]
  isActive?: boolean
  order?: number
}

const initialAnnouncements: any[] = []

// Ensure TS knows about the global aclib object
declare global {
  interface Window { aclib?: any }
}

// Loader that injects the ACLib script exactly once
const AclibLoader = () => {
  useEffect(() => {
    // Avoid loading external ad script in development to prevent noisy errors
    if (import.meta.env?.DEV) return;
    const existing = document.getElementById('aclib') as HTMLScriptElement | null
    if (!existing) {
      const s = document.createElement('script')
      s.id = 'aclib'
      s.type = 'text/javascript'
      s.src = '//acscdn.com/script/aclib.js'
      s.async = true
      document.head.appendChild(s)
    }
  }, [])
  return null
}

// Professional Banner Component - 728x90 Leaderboard
const ProfessionalBanner = ({ className = "", placement = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerId] = useState(() => `aclib-zone-${placement || 'default'}-${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    // Attempt to run banner once script is available
    const run = () => {
      try {
        if (!import.meta.env?.DEV && window.aclib && typeof window.aclib.runBanner === 'function') {
          window.aclib.runBanner({
            zoneId: '10397366',
            targetId: containerId,
          })
        }
      } catch (e) {
        // swallow
      }
    }
    // Try immediately and again shortly after in case the script is still loading
    run()
    const t = window.setTimeout(run, 800)
    return () => window.clearTimeout(t)
  }, [containerId])

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm overflow-hidden ${className}`}>
      {/* Loader ensures the script exists */}
      <AclibLoader />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Sponsored Content</span>
          </div>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Advertisement</span>
        </div>
        {/* 728x90 Banner Ad Container */}
        <div className="bg-white rounded-lg border border-blue-200 flex items-center justify-center" style={{ width: '728px', height: '90px', maxWidth: '100%', margin: '0 auto' }}>
          {import.meta.env?.DEV ? (
            <div className="text-xs text-gray-500">Ad placeholder (disabled in development)</div>
          ) : (
            <div id={containerId} ref={containerRef} className="w-full h-full flex items-center justify-center" />
          )}
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs text-blue-600">Supporting quality education through trusted partnerships</p>
        </div>
      </div>
    </div>
  )
}

const Features = () => {
  const [features, setFeatures] = useState<Feature[]>([])
  const [isAdmin, setIsAdmin] = useState(false) // Set to false by default for production
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [newAnnouncement, setNewAnnouncement] = useState("")
  const [announcementType, setAnnouncementType] = useState("info")
  const [activeTab, setActiveTab] = useState("features")
  const [editingFeature, setEditingFeature] = useState(null)
  const [showAdminControls, setShowAdminControls] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [adminLoginError, setAdminLoginError] = useState("")
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch features and announcements from API
  useEffect(() => {
    fetchFeatures()
    fetchAnnouncements()
  }, [])

  const fetchFeatures = async () => {
    try {
      const data = await apiFetch<any[]>('/api/admin/content/features')
      // Normalize incoming data: ensure benefits is always an array
      const normalizedFeatures = Array.isArray(data)
        ? data.map((f) => ({ ...f, benefits: Array.isArray(f?.benefits) ? f.benefits : [] }))
        : []
      setFeatures(normalizedFeatures)
    } catch (error) {
      console.error('Error fetching features:', error)
      setFeatures([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const data = await apiFetch<any[]>('/api/admin/content/announcements')
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setAnnouncements([])
    }
  }

  // Function to handle admin login
  const handleAdminLogin = () => {
    // In a real application, this would be a secure authentication process
    // This is just a simple example
    if (adminPassword === "admin123") {
      setIsAdmin(true)
      setShowAdminLogin(false)
      setAdminLoginError("")
    } else {
      setAdminLoginError("Invalid password")
    }
  }

  // Function to handle admin logout
  const handleAdminLogout = () => {
    setIsAdmin(false)
    setShowAdminControls(false)
    setAdminPassword("")
  }

  // Function to post a new announcement
  const postAnnouncement = () => {
    if (newAnnouncement.trim() === "") return

    const newAnnouncementObj = {
      id: Date.now(),
      content: newAnnouncement,
      type: announcementType,
      timestamp: new Date().toISOString(),
      pinned: false,
    }

    setAnnouncements([newAnnouncementObj, ...announcements])
    setNewAnnouncement("")
  }

  // Function to delete an announcement
  const deleteAnnouncement = (id) => {
    setAnnouncements(announcements.filter((announcement) => announcement.id !== id))
  }

  // Function to toggle pin status of an announcement
  const togglePinAnnouncement = (id) => {
    setAnnouncements(
      announcements.map((announcement) =>
        announcement.id === id ? { ...announcement, pinned: !announcement.pinned } : announcement,
      ),
    )
  }

  // Function to start editing a feature
  const startEditFeature = (feature) => {
    setEditingFeature({ ...feature })
  }

  // Function to save edited feature
  const saveFeature = () => {
    if (!editingFeature) return

    setFeatures(features.map((feature) => (feature.id === editingFeature.id ? { ...editingFeature } : feature)))
    setEditingFeature(null)
  }

  // Function to add a new feature
  const addNewFeature = () => {
    const newFeature = {
      id: Date.now(),
      title: "New Feature",
      description: "Description of the new feature",
      icon: "new",
      benefits: ["Benefit 1", "Benefit 2", "Benefit 3"],
    }

    setFeatures([...features, newFeature])
    startEditFeature(newFeature)
  }

  // Function to delete a feature
  const deleteFeature = (id) => {
    setFeatures(features.filter((feature) => feature.id !== id))
  }

  // Get icon component based on feature icon name
  const getFeatureIcon = (iconName) => {
    const iconMap = {
      curriculum: <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />,
      tutors: <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />,
      cost: <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />,
      focus: <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />,
      technology: <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />,
      global: <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />,
      new: <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />,
    }

    return iconMap[iconName] || <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />
  }

  // Sort announcements to show pinned ones first
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    // Fix: Convert string dates to Date objects before comparison
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Why Choose Excellence Academia</h2>
          <p className="text-xl text-blue-700/70 max-w-3xl mx-auto">
            Discover the unique advantages that set our tutoring services apart and help our students achieve academic
            excellence
          </p>
        </motion.div>

        {/* Top Banner Placement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <ProfessionalBanner placement="top" />
        </motion.div>

        {/* Admin Controls Toggle */}
        {isAdmin && (
          <div className="mb-8 flex justify-end">
            <div className="flex items-center space-x-2">
              <Switch id="admin-mode" checked={showAdminControls} onCheckedChange={setShowAdminControls} />
              <Label htmlFor="admin-mode" className="text-blue-700">
                Admin Mode
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdminLogout}
                className="ml-4 text-red-600 border-red-200 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        )}

        {/* Admin Login Button (visible when not logged in) */}
        {!isAdmin && (
          <div className="mb-8 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdminLogin(true)}
              className="text-gray-500 hover:text-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>
        )}

        {/* Admin Login Dialog */}
        <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Admin Login</DialogTitle>
              <DialogDescription>Enter your admin password to access management features.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter admin password"
                />
                {adminLoginError && <p className="text-sm text-red-500">{adminLoginError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdminLogin(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdminLogin}>Login</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tabs for Features and Announcements */}
        <Tabs defaultValue="features" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="announcements" className="relative">
              <span>Announcements</span>
              {announcements.length > 0 && (
                <span className="ml-2">
                  <Badge className="bg-blue-600 hover:bg-blue-600">{announcements.length}</Badge>
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Features Tab Content */}
          <TabsContent value="features" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {features.map((feature) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <Card className="h-full hover:shadow-md transition-shadow duration-300 border-blue-100">
                      {isAdmin && showAdminControls && (
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditFeature(feature)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFeature(feature.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-start space-x-4">
                          {getFeatureIcon(feature.icon)}
                          <CardTitle className="text-xl text-blue-900">{feature.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                        <div className="space-y-2">
                          {(Array.isArray(feature?.benefits) ? feature.benefits : []).map((benefit, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add New Feature Button (Admin Only) */}
              {isAdmin && showAdminControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    onClick={addNewFeature}
                    variant="outline"
                    className="h-full w-full border-dashed border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 flex flex-col items-center justify-center py-12"
                  >
                    <Plus className="h-8 w-8 mb-2" />
                    <span>Add New Feature</span>
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Mid-Content Banner Placement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 mb-8"
            >
              <ProfessionalBanner placement="middle" />
            </motion.div>
          </TabsContent>

          {/* Announcements Tab Content */}
          <TabsContent value="announcements" className="mt-6">
            {/* Admin Announcement Form */}
            {isAdmin && showAdminControls && (
              <Card className="mb-6 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Post New Announcement</CardTitle>
                  <CardDescription>Create a new announcement for students and visitors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="announcement-type">Announcement Type</Label>
                      <Select value={announcementType} onValueChange={setAnnouncementType}>
                        <SelectTrigger id="announcement-type" className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Information</SelectItem>
                          <SelectItem value="warning">Important Alert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="announcement-content">Announcement Content</Label>
                      <Textarea
                        id="announcement-content"
                        placeholder="Enter your announcement here..."
                        value={newAnnouncement}
                        onChange={(e) => setNewAnnouncement(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={postAnnouncement} disabled={!newAnnouncement.trim()}>
                    Post Announcement
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
              <AnimatePresence>
                {sortedAnnouncements.length > 0 ? (
                  sortedAnnouncements.map((announcement) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-lg flex items-start space-x-3 relative ${
                        announcement.type === "warning"
                          ? "bg-red-50 border border-red-200"
                          : "bg-blue-50 border border-blue-200"
                      } ${announcement.pinned ? "border-l-4" : ""}`}
                    >
                      {announcement.type === "warning" ? (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                      )}
                      <div className="space-y-1 flex-1">
                        <p className={`${announcement.type === "warning" ? "text-red-700" : "text-blue-700"}`}>
                          {announcement.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(announcement.timestamp).toLocaleString()}
                          {announcement.pinned && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Pinned
                            </Badge>
                          )}
                        </p>
                      </div>

                      {/* Admin Controls for Announcements */}
                      {isAdmin && showAdminControls && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePinAnnouncement(announcement.id)}
                            className={`h-7 w-7 ${
                              announcement.pinned
                                ? "text-yellow-600 hover:text-yellow-700"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                            title={announcement.pinned ? "Unpin announcement" : "Pin announcement"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 2L12 12" />
                              <path d="M12 2L8 6" />
                              <path d="M12 2L16 6" />
                              <path d="M3 10H5.34C5.82 10 6.31 10.17 6.71 10.47L9.29 12.47C9.69 12.77 10.18 12.95 10.66 12.95V12.95C11.5 12.95 12.18 12.27 12.18 11.43V3" />
                              <path d="M13 3H21" />
                              <path d="M13 7H21" />
                              <path d="M13 11H21" />
                              <path d="M2 21L22 21" />
                              <path d="M10 17L14 17" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAnnouncement(announcement.id)}
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete announcement"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <Info className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No announcements at this time</p>
                    <p className="text-gray-500 text-sm mt-1">Check back later for updates</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>

        {/* Feature Editing Dialog */}
        {editingFeature && (
          <Dialog open={!!editingFeature} onOpenChange={(open) => !open && setEditingFeature(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Feature</DialogTitle>
                <DialogDescription>Make changes to the feature information.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="feature-title">Title</Label>
                  <input
                    id="feature-title"
                    value={editingFeature.title}
                    onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feature-description">Description</Label>
                  <Textarea
                    id="feature-description"
                    value={editingFeature.description}
                    onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Benefits</Label>
                  {(Array.isArray(editingFeature?.benefits) ? editingFeature.benefits : []).map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        value={benefit}
                        onChange={(e) => {
                          const currentBenefits = Array.isArray(editingFeature?.benefits) ? [...editingFeature.benefits] : []
                          currentBenefits[index] = e.target.value
                          setEditingFeature({ ...editingFeature, benefits: currentBenefits })
                        }}
                        className="flex-1 p-2 border rounded-md"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const currentBenefits = Array.isArray(editingFeature?.benefits) ? editingFeature.benefits.filter((_, i) => i !== index) : []
                          setEditingFeature({ ...editingFeature, benefits: currentBenefits })
                        }}
                        className="h-8 w-8 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentBenefits = Array.isArray(editingFeature?.benefits) ? editingFeature.benefits : []
                      setEditingFeature({
                        ...editingFeature,
                        benefits: [...currentBenefits, "New benefit"],
                      })
                    }}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingFeature(null)}>
                  Cancel
                </Button>
                <Button onClick={saveFeature}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-blue-900 mb-4">Ready to Experience the Difference?</h3>
          <p className="text-blue-700/70 max-w-2xl mx-auto mb-6">
            Join Excellence Academia today and take the first step towards academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              onClick={() => {
                // Using window.location.href with hash for more reliable navigation
                window.location.href = "/pricing"
              }}
            >
              Get Started Now
            </Button>
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 px-8"
              onClick={() => {
                // Using window.location.href with hash for more reliable navigation
                window.location.href = "/contact-us"
              }}
            >
              Contact Us
            </Button>
          </div>
        </motion.div>

        {/* Bottom Banner Placement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <ProfessionalBanner placement="bottom" />
        </motion.div>
      </div>
      
      <p className="text-center text-xs text-gray-500 mt-4">
        © {new Date().getFullYear()} Excellence Academia. All rights reserved. POPI Act Compliance.
      </p>
      <p className="text-sm text-gray-500 mt-2 text-center">
        As for the IDs, they are used for registrations and verifying the student. All our actions are bound by the POPI
        Act and the client is informed on the repercussions of the handing out ID as they have agreed to our terms
        policy conditions.
      </p>
    </section>
  )
}

export default Features