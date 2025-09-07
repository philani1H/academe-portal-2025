"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { Link, useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { 
  CheckCircle, 
  GraduationCap, 
  BookOpen, 
  ArrowRight, 
  Star, 
  Calendar, 
  Users, 
  Award,
  TrendingUp,
  Target,
  Clock,
  MessageSquare
} from "lucide-react"

interface HeroContent {
  id: string
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
  statistics?: {
    studentsHelped: number
    successRate: number
    averageGradeImprovement: number
    tutorSatisfaction: number
  }
  testimonials?: Array<{
    name: string
    grade: string
    content: string
    rating: number
  }>
  lastUpdated?: string
}

const HeroEnhanced = () => {
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [animateParticles, setAnimateParticles] = useState(false)
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    setAnimateParticles(true)
    fetchHeroContent()
  }, [])

  useEffect(() => {
    if (heroContent?.testimonials && heroContent.testimonials.length > 0) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => 
          (prev + 1) % heroContent.testimonials!.length
        )
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [heroContent?.testimonials])

  const fetchHeroContent = async () => {
    try {
      const response = await fetch('/api/content/hero-enhanced')
      if (response.ok) {
        const data = await response.json()
        setHeroContent(data)
      } else {
        // Fallback to default content
        setHeroContent(getDefaultContent())
      }
    } catch (error) {
      console.error('Error fetching hero content:', error)
      setHeroContent(getDefaultContent())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultContent = (): HeroContent => ({
    id: 'default',
    title: 'Excellence in Education Starts Here',
    subtitle: 'Transform Your Learning Journey',
    description: 'Join thousands of successful students who have achieved their academic goals with our world-class tutoring services.',
    buttonText: 'Start Learning Today',
    secondaryButtonText: 'Explore Courses',
    trustIndicatorText: 'Trusted by 10,000+ Students',
    universities: ['Harvard', 'MIT', 'Stanford', 'Oxford', 'Cambridge'],
    features: [
      { title: 'Expert Tutors', description: 'Learn from qualified professionals', icon: 'GraduationCap' },
      { title: 'Personalized Learning', description: 'Customized study plans', icon: 'BookOpen' }
    ],
    backgroundGradient: 'from-blue-600 via-purple-600 to-indigo-600',
    statistics: {
      studentsHelped: 10000,
      successRate: 95,
      averageGradeImprovement: 25,
      tutorSatisfaction: 98
    }
  })

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      GraduationCap,
      BookOpen,
      Award,
      Calendar,
      Users,
      MessageSquare
    }
    return icons[iconName] || GraduationCap
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!heroContent) return null

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background with enhanced gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${heroContent.backgroundGradient}`}>
        {/* Animated particles */}
        <AnimatePresence>
          {animateParticles && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full"
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: Math.random() * window.innerHeight,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: [null, -100],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen">
          {/* Left side - Main content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-8"
          >
            {/* Trust indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 text-sm"
            >
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{heroContent.trustIndicatorText}</span>
            </motion.div>

            {/* Main heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                {heroContent.title}
              </h1>
              <h2 className="text-2xl lg:text-3xl text-blue-100 font-medium">
                {heroContent.subtitle}
              </h2>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-blue-100 leading-relaxed max-w-2xl"
            >
              {heroContent.description}
            </motion.p>

            {/* Statistics */}
            {heroContent.statistics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{heroContent.statistics.studentsHelped.toLocaleString()}+</div>
                  <div className="text-sm text-blue-200">Students Helped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{heroContent.statistics.successRate}%</div>
                  <div className="text-sm text-blue-200">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{heroContent.statistics.averageGradeImprovement}%</div>
                  <div className="text-sm text-blue-200">Grade Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{heroContent.statistics.tutorSatisfaction}%</div>
                  <div className="text-sm text-blue-200">Tutor Satisfaction</div>
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
                onClick={() => navigate('/student-login')}
              >
                {heroContent.buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4"
                onClick={() => navigate('/subjects')}
              >
                {heroContent.secondaryButtonText}
              </Button>
            </motion.div>

            {/* Universities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <p className="text-sm text-blue-200">Trusted by students from:</p>
              <div className="flex flex-wrap gap-2">
                {heroContent.universities.map((university, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {university}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Features and testimonials */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {heroContent.features.slice(0, 4).map((feature, index) => {
                const IconComponent = getIcon(feature.icon)
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{feature.title}</h3>
                            <p className="text-xs text-blue-100 mt-1">{feature.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Testimonials carousel */}
            {heroContent.testimonials && heroContent.testimonials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-white/20 text-white">
                          {heroContent.testimonials[currentTestimonial].name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{heroContent.testimonials[currentTestimonial].name}</h4>
                        <p className="text-sm text-blue-200">{heroContent.testimonials[currentTestimonial].grade}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {[...Array(heroContent.testimonials[currentTestimonial].rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm italic">"{heroContent.testimonials[currentTestimonial].content}"</p>
                    
                    {/* Testimonial indicators */}
                    <div className="flex justify-center space-x-2 mt-4">
                      {heroContent.testimonials.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentTestimonial ? 'bg-white' : 'bg-white/30'
                          }`}
                          onClick={() => setCurrentTestimonial(index)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Grade selection dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Your Grade Level</DialogTitle>
            <DialogDescription>
              Choose your current grade level to get personalized tutoring recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'].map((grade) => (
              <Button
                key={grade}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => {
                  setShowGradeDialog(false)
                  navigate('/subjects')
                }}
              >
                <GraduationCap className="h-6 w-6" />
                <span>{grade}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HeroEnhanced