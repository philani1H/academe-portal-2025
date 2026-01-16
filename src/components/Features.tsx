"use client"

import { useState, useEffect, useRef } from "react"
import { apiFetch } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ReactPlayer from 'react-player'
import { CheckCircle, AlertCircle, Info, MessageSquare, Plus, X, Edit, Trash2, Star, Sparkles } from "lucide-react"
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

const ProfessionalBanner = ({ className = "", placement = "" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    if (!iframeRef.current) return
    
    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    
    // Write the ad script into the iframe with proper containment
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            html, body { 
              width: 100%;
              height: 100%;
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
            }
            body > * {
              max-width: 100% !important;
              max-height: 100% !important;
              overflow: hidden !important;
            }
            iframe, img, div {
              max-width: 100% !important;
              max-height: 90px !important;
            }
          </style>
        </head>
        <body>
          <script 
            type="text/javascript" 
            src="https://thankfuldirection.com/bzX.VPsLdpGblY0mYsWccA/yermk9fuxZdUJlHk/PIT/Yo3/NiD/k/y/MrDHYHt/NKjlcD0/OgTnICwBN_wx"
            async
            referrerpolicy="no-referrer-when-downgrade"
          ><\/script>
        </body>
      </html>
    `)
    doc.close()
    
    // Set loaded state after a delay
    const timer = setTimeout(() => setIsLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [placement])
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-60" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Main container */}
      <div className="relative bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg shadow-blue-100/50">
        <div className="p-4 sm:p-5">
          {/* Header section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-30 animate-pulse" />
                <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-blue-900">Featured Partner</span>
                <p className="text-xs text-blue-600/70">Sponsored Content</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-100/80 px-3 py-1.5 rounded-full border border-blue-200/50 shadow-sm">
                Ad
              </span>
            </div>
          </div>
          
          {/* Ad container with fixed dimensions */}
          <div className="relative w-full h-[100px] bg-white rounded-xl border border-blue-100 shadow-inner overflow-hidden">
            {/* Loading skeleton */}
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm text-blue-600 font-medium">Loading content...</span>
                </div>
              </div>
            )}
            
            {/* Iframe container - fixed size with overflow hidden */}
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                ref={iframeRef}
                title={`ad-${placement}`}
                className="w-full h-full border-0"
                style={{ 
                  minWidth: '100%',
                  maxWidth: '100%',
                  height: '100px',
                  maxHeight: '100px',
                  overflow: 'hidden',
                  display: 'block'
                }}
                scrolling="no"
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
          
          {/* Footer section */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
            <p className="text-xs text-blue-500 font-medium px-3">
              Supporting quality education
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}

const Features = () => {
  
  const [features, setFeatures] = useState<Feature[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [newAnnouncement, setNewAnnouncement] = useState("")
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementType, setAnnouncementType] = useState("info")
  const [activeTab, setActiveTab] = useState("features")
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
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
      const normalizedAnnouncements = Array.isArray(data)
        ? data.map((a) => ({
            ...a,
            type: a?.type || "info",
            pinned: typeof a?.pinned === "boolean" ? a.pinned : !!a?.pinned,
            mediaUrl: a?.mediaUrl || a?.media_url,
            mediaType: a?.mediaType || a?.media_type,
            timestamp:
              a?.timestamp ||
              a?.created_at ||
              a?.createdAt ||
              new Date().toISOString(),
          }))
        : []
      setAnnouncements(normalizedAnnouncements)
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setAnnouncements([])
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === "admin123") {
      setIsAdmin(true)
      setShowAdminLogin(false)
      setAdminLoginError("")
    } else {
      setAdminLoginError("Invalid password")
    }
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    setShowAdminControls(false)
    setAdminPassword("")
  }

  const postAnnouncement = async () => {
    if (newAnnouncement.trim() === "") return

    try {
      await apiFetch("/api/admin/content/announcements", {
        method: "POST",
        body: JSON.stringify({
          title: announcementTitle,
          content: newAnnouncement,
          type: announcementType,
          pinned: false,
          authorId: 1,
          department: null,
        }),
      })
      setNewAnnouncement("")
      setAnnouncementTitle("")
      await fetchAnnouncements()
    } catch (error) {
      console.error("Error posting announcement:", error)
    }
  }

  const deleteAnnouncement = async (id: string | number) => {
    try {
      await apiFetch(`/api/admin/content/announcements?id=${id}`, { method: "DELETE" })
      await fetchAnnouncements()
    } catch (error) {
      console.error("Error deleting announcement:", error)
    }
  }

  const togglePinAnnouncement = async (id: string | number) => {
    const current = announcements.find((announcement) => announcement.id === id)
    if (!current) return

    const payload = {
      id: current.id,
      content: current.content,
      type: current.type,
      pinned: !current.pinned,
      isActive: current.isActive ?? true,
      mediaUrl: current.mediaUrl,
      mediaType: current.mediaType,
    }

    try {
      await apiFetch("/api/admin/content/announcements", {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      await fetchAnnouncements()
    } catch (error) {
      console.error("Error updating announcement:", error)
    }
  }

  const startEditFeature = (feature: Feature) => {
    setEditingFeature({ ...feature })
  }

  const saveFeature = () => {
    if (!editingFeature) return

    setFeatures(features.map((feature) => (feature.id === editingFeature.id ? { ...editingFeature } : feature)))
    setEditingFeature(null)
  }

  const addNewFeature = () => {
    const newFeature: Feature = {
      id: String(Date.now()),
      title: "New Feature",
      description: "Description of the new feature",
      icon: "new",
      benefits: ["Benefit 1", "Benefit 2", "Benefit 3"],
    }

    setFeatures([...features, newFeature])
    startEditFeature(newFeature)
  }

  const deleteFeature = (id: string | undefined) => {
    if (!id) return
    setFeatures(features.filter((feature) => feature.id !== id))
  }

  const getFeatureIcon = (iconName: string) => {
    return <CheckCircle className="text-blue-600 w-6 h-6 mt-1 flex-shrink-0" />
  }

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    const aTime = a?.timestamp ? new Date(a.timestamp).getTime() : 0
    const bTime = b?.timestamp ? new Date(b.timestamp).getTime() : 0
    return bTime - aTime
  })

  return (
    <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Why Choose Us
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Excellence Academia
            </span>
          </h2>
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
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-100 shadow-sm">
              <Switch id="admin-mode" checked={showAdminControls} onCheckedChange={setShowAdminControls} />
              <Label htmlFor="admin-mode" className="text-blue-700 font-medium">
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

        {/* Admin Login Button */}
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
                  className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter admin password"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
                {adminLoginError && <p className="text-sm text-red-500">{adminLoginError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdminLogin(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdminLogin} className="bg-blue-600 hover:bg-blue-700">Login</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tabs for Features and Announcements */}
        <Tabs defaultValue="features" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-blue-100/50 p-1 rounded-xl">
            <TabsTrigger 
              value="features"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 transition-all"
            >
              Features
            </TabsTrigger>
            <TabsTrigger 
              value="announcements" 
              className="relative rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 transition-all"
            >
              <span>Announcements</span>
              {announcements.length > 0 && (
                <span className="ml-2">
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-xs px-2">{announcements.length}</Badge>
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Features Tab Content */}
          <TabsContent value="features" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    <Card className="relative h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500 border-blue-100 rounded-2xl overflow-hidden">
                      {isAdmin && showAdminControls && (
                        <div className="absolute top-3 right-3 flex space-x-1 z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditFeature(feature)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFeature(feature.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-start space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
                            <CheckCircle className="text-white w-6 h-6" />
                          </div>
                          <CardTitle className="text-xl text-blue-900 pt-2">{feature.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                        <div className="space-y-2">
                          {(Array.isArray(feature?.benefits) ? feature.benefits : []).map((benefit, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
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

              {/* Add New Feature Button */}
              {isAdmin && showAdminControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    onClick={addNewFeature}
                    variant="outline"
                    className="h-full w-full min-h-[280px] border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 flex flex-col items-center justify-center py-12 rounded-2xl transition-all"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-blue-600" />
                    </div>
                    <span className="font-semibold">Add New Feature</span>
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
          <TabsContent value="announcements" className="mt-8">
            {/* Admin Announcement Form */}
            {isAdmin && showAdminControls && (
              <Card className="mb-6 border-blue-200 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-900">Post New Announcement</CardTitle>
                  <CardDescription>Create a new announcement for students and visitors</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="announcement-title" className="text-blue-900 font-medium">Announcement Title</Label>
                      <input
                        id="announcement-title"
                        type="text"
                        placeholder="Enter announcement title (optional)"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        className="mt-1 flex h-11 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="announcement-type" className="text-blue-900 font-medium">Announcement Type</Label>
                      <Select value={announcementType} onValueChange={setAnnouncementType}>
                        <SelectTrigger id="announcement-type" className="w-full mt-1 rounded-lg border-blue-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Information</SelectItem>
                          <SelectItem value="warning">Important Alert</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="announcement-content" className="text-blue-900 font-medium">Announcement Content</Label>
                      <Textarea
                        id="announcement-content"
                        placeholder="Enter your announcement here..."
                        value={newAnnouncement}
                        onChange={(e) => setNewAnnouncement(e.target.value)}
                        className="mt-1 min-h-[120px] rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50/50">
                  <Button 
                    onClick={postAnnouncement} 
                    disabled={!newAnnouncement.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
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
                      className={`p-5 rounded-2xl flex items-start space-x-4 relative overflow-hidden ${
                        announcement.type === "warning"
                          ? "bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
                          : announcement.type === "success"
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                      } ${announcement.pinned ? "border-l-4" : ""}`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        announcement.type === "warning"
                          ? "bg-red-100"
                          : announcement.type === "success"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}>
                        {announcement.type === "warning" ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : announcement.type === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Info className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        {announcement.title && (
                          <h3
                            className={`text-lg font-semibold ${
                              announcement.type === "warning"
                                ? "text-red-800"
                                : announcement.type === "success"
                                ? "text-green-900"
                                : "text-blue-900"
                            }`}
                          >
                            {announcement.title}
                          </h3>
                        )}
                        {announcement.mediaUrl && (
                          <div className="mb-3 mt-1 rounded-xl overflow-hidden max-w-2xl shadow-sm border border-gray-100">
                             {announcement.mediaType === 'video' ? (
                                <ReactPlayer 
                                  url={announcement.mediaUrl} 
                                  controls 
                                  width="100%" 
                                  height="auto" 
                                  className="aspect-video"
                                />
                             ) : (
                                <img 
                                  src={announcement.mediaUrl} 
                                  alt="Announcement media" 
                                  className="w-full h-auto object-cover max-h-[400px]"
                                />
                             )}
                          </div>
                        )}
                        <div
                          className={`${
                            announcement.type === "warning"
                              ? "text-red-700"
                              : announcement.type === "success"
                              ? "text-green-700"
                              : "text-blue-700"
                          } prose prose-sm max-w-none`}
                        >
                          {typeof announcement.content === "string" &&
                          /<\/[a-z][\s\S]*>/.test(announcement.content) ? (
                            <div
                              dangerouslySetInnerHTML={{ __html: announcement.content }}
                            />
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {announcement.content}
                            </ReactMarkdown>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(announcement.timestamp).toLocaleString()}
                          </p>
                          {announcement.pinned && (
                            <Badge variant="outline" className="text-xs bg-white/50">
                              📌 Pinned
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Admin Controls for Announcements */}
                      {isAdmin && showAdminControls && (
                        <div className="flex space-x-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePinAnnouncement(announcement.id)}
                            className={`h-8 w-8 rounded-full ${
                              announcement.pinned
                                ? "text-yellow-600 hover:text-yellow-700 bg-yellow-100"
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
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            title="Delete announcement"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium text-lg">No announcements at this time</p>
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
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Feature</DialogTitle>
                <DialogDescription>Make changes to the feature information.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="feature-title" className="font-medium">Title</Label>
                  <input
                    id="feature-title"
                    value={editingFeature.title}
                    onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feature-description" className="font-medium">Description</Label>
                  <Textarea
                    id="feature-description"
                    value={editingFeature.description}
                    onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                    className="min-h-[100px] border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Benefits</Label>
                  <div className="space-y-2">
                    {(Array.isArray(editingFeature?.benefits) ? editingFeature.benefits : []).map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          value={benefit}
                          onChange={(e) => {
                            const currentBenefits = Array.isArray(editingFeature?.benefits) ? [...editingFeature.benefits] : []
                            currentBenefits[index] = e.target.value
                            setEditingFeature({ ...editingFeature, benefits: currentBenefits })
                          }}
                          className="flex-1 p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentBenefits = Array.isArray(editingFeature?.benefits) ? editingFeature.benefits.filter((_, i) => i !== index) : []
                            setEditingFeature({ ...editingFeature, benefits: currentBenefits })
                          }}
                          className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                <Button onClick={saveFeature} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-12 text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Experience the Difference?</h3>
              <p className="text-blue-100 max-w-2xl mx-auto mb-8">
                Join Excellence Academia today and take the first step towards academic excellence.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-xl shadow-blue-900/20"
                  onClick={() => {
                    window.location.href = "/pricing"
                  }}
                >
                  Get Started Now
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-white/50 text-white hover:bg-white/20 hover:text-white px-8 py-6 text-lg font-semibold backdrop-blur-sm bg-transparent"
                  onClick={() => {
                    window.location.href = "/contact-us"
                  }}
                >
                  Contact Us
                </Button>
              </div>
            </div>
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
      
      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-blue-100">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Excellence Academia. All rights reserved. POPI Act Compliance.
        </p>
        <p className="text-sm text-gray-400 mt-2 text-center max-w-3xl mx-auto px-4">
          As for the IDs, they are used for registrations and verifying the student. All our actions are bound by the POPI
          Act and the client is informed on the repercussions of the handing out ID as they have agreed to our terms
          policy conditions.
        </p>
      </div>
    </section>
  )
}

export default Features