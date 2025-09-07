"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  TrendingUp,
  Award,
  User
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Progress } from "./ui/progress"

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  subject?: string
  improvement?: string
  duration?: string
  isActive: boolean
  order: number
  avatar?: string
  verified?: boolean
  achievements?: string[]
  lastUpdated?: string
}

const TestimonialsEnhanced = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    if (testimonials.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [testimonials.length])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/content/testimonials-enhanced')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data)
      } else {
        setTestimonials(getDefaultTestimonials())
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      setTestimonials(getDefaultTestimonials())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultTestimonials = (): Testimonial[] => [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Grade 12 Student',
      content: 'Excellence Academia transformed my academic journey! My grades improved by 30% in just 3 months.',
      rating: 5,
      subject: 'Mathematics & Physics',
      improvement: '30%',
      duration: '3 months',
      isActive: true,
      order: 1,
      verified: true,
      achievements: ['Grade improvement', 'University acceptance']
    }
  ]

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getAchievementIcon = (achievement: string) => {
    if (achievement.toLowerCase().includes('grade')) return <TrendingUp className="h-4 w-4" />
    if (achievement.toLowerCase().includes('university')) return <Award className="h-4 w-4" />
    if (achievement.toLowerCase().includes('confidence')) return <User className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading testimonials...</p>
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) return null

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Students Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our students and their parents have to say about their experience with Excellence Academia.
          </p>
        </motion.div>

        {/* Main testimonial carousel */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                        {testimonials[currentIndex]?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Quote icon */}
                    <Quote className="h-8 w-8 text-blue-200 mb-4" />
                    
                    {/* Testimonial content */}
                    <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                      "{testimonials[currentIndex]?.content}"
                    </blockquote>

                    {/* Student info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {testimonials[currentIndex]?.name}
                        </h4>
                        <p className="text-gray-600">{testimonials[currentIndex]?.role}</p>
                        
                        {/* Rating */}
                        <div className="flex items-center space-x-1 mt-2">
                          {getRatingStars(testimonials[currentIndex]?.rating || 5)}
                          <span className="text-sm text-gray-500 ml-2">
                            {testimonials[currentIndex]?.rating}/5
                          </span>
                        </div>
                      </div>

                      {/* Improvement stats */}
                      {testimonials[currentIndex]?.improvement && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {testimonials[currentIndex]?.improvement}
                          </div>
                          <div className="text-sm text-gray-500">Improvement</div>
                          {testimonials[currentIndex]?.duration && (
                            <div className="text-xs text-gray-400">
                              in {testimonials[currentIndex]?.duration}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Subject and verification */}
                    <div className="flex items-center space-x-4 mt-4">
                      {testimonials[currentIndex]?.subject && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {testimonials[currentIndex]?.subject}
                        </Badge>
                      )}
                      {testimonials[currentIndex]?.verified && (
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <Button
              variant="outline"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Dots indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card 
                className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedTestimonial(testimonial)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    {getRatingStars(testimonial.rating)}
                    <span className="text-sm text-gray-500 ml-2">
                      {testimonial.rating}/5
                    </span>
                  </div>

                  {/* Content preview */}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    "{testimonial.content}"
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {testimonial.improvement && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {testimonial.improvement}
                        </div>
                        <div className="text-xs text-gray-500">Improvement</div>
                      </div>
                    )}
                    {testimonial.duration && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {testimonial.duration}
                        </div>
                        <div className="text-xs text-gray-500">Duration</div>
                      </div>
                    )}
                  </div>

                  {/* Subject badge */}
                  {testimonial.subject && (
                    <Badge variant="outline" className="w-full justify-center">
                      {testimonial.subject}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button size="lg" variant="outline">
            View All Testimonials
          </Button>
        </motion.div>
      </div>

      {/* Detailed testimonial modal */}
      <AnimatePresence>
        {selectedTestimonial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTestimonial(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                      {selectedTestimonial.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedTestimonial.name}</h3>
                    <p className="text-gray-600">{selectedTestimonial.role}</p>
                    <div className="flex items-center space-x-1 mt-2">
                      {getRatingStars(selectedTestimonial.rating)}
                      <span className="text-sm text-gray-500 ml-2">
                        {selectedTestimonial.rating}/5
                      </span>
                    </div>
                  </div>
                </div>

                <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                  "{selectedTestimonial.content}"
                </blockquote>

                {/* Achievements */}
                {selectedTestimonial.achievements && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Key Achievements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedTestimonial.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {getAchievementIcon(achievement)}
                          <span className="text-sm">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {selectedTestimonial.improvement && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedTestimonial.improvement}
                      </div>
                      <div className="text-sm text-gray-500">Improvement</div>
                    </div>
                  )}
                  {selectedTestimonial.duration && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedTestimonial.duration}
                      </div>
                      <div className="text-sm text-gray-500">Duration</div>
                    </div>
                  )}
                  {selectedTestimonial.subject && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm font-bold text-purple-600">
                        {selectedTestimonial.subject}
                      </div>
                      <div className="text-sm text-gray-500">Subject</div>
                    </div>
                  )}
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedTestimonial.rating}/5
                    </div>
                    <div className="text-sm text-gray-500">Rating</div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setSelectedTestimonial(null)}>
                    Close
                  </Button>
                  <Button>
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default TestimonialsEnhanced