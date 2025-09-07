"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Calendar, 
  Users, 
  MessageSquare,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  Star,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Avatar, AvatarFallback } from "./ui/avatar"

interface Feature {
  id: string
  title: string
  description: string
  icon: string
  benefits: string[]
  isActive: boolean
  order: number
  statistics?: {
    totalTutors?: number
    averageExperience?: number
    satisfactionRate?: number
    personalizedPlans?: number
    averageImprovement?: number
    completionRate?: number
    successRate?: number
    averageGradeImprovement?: number
    universityAcceptance?: number
    availableSlots?: number
    averageResponseTime?: number
    flexibilityRating?: number
    interactiveTools?: number
    engagementRate?: number
    retentionRate?: number
    supportHours?: number
  }
  testimonials?: Array<{
    name: string
    subject: string
    experience: string
    quote: string
  }>
  lastUpdated?: string
}

const FeaturesEnhanced = () => {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/content/features-enhanced')
      if (response.ok) {
        const data = await response.json()
        setFeatures(data)
      } else {
        setFeatures(getDefaultFeatures())
      }
    } catch (error) {
      console.error('Error fetching features:', error)
      setFeatures(getDefaultFeatures())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultFeatures = (): Feature[] => [
    {
      id: '1',
      title: 'Expert Tutors',
      description: 'Learn from qualified professionals with years of teaching experience.',
      icon: 'GraduationCap',
      benefits: ['Certified educators', 'Subject experts', 'Personalized approach'],
      isActive: true,
      order: 1
    }
  ]

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      GraduationCap,
      BookOpen,
      Award,
      Calendar,
      Users,
      MessageSquare,
      TrendingUp,
      Target,
      Clock
    }
    return icons[iconName] || GraduationCap
  }

  const getFeatureStats = (feature: Feature) => {
    if (!feature.statistics) return null
    
    const stats = feature.statistics
    return {
      primary: stats.totalTutors || stats.personalizedPlans || stats.successRate || stats.availableSlots || stats.interactiveTools || stats.supportHours,
      secondary: stats.averageExperience || stats.averageImprovement || stats.averageGradeImprovement || stats.averageResponseTime || stats.engagementRate || stats.satisfactionRate,
      label: stats.totalTutors ? 'Expert Tutors' : 
             stats.personalizedPlans ? 'Plans Created' :
             stats.successRate ? 'Success Rate' :
             stats.availableSlots ? 'Available Slots' :
             stats.interactiveTools ? 'Interactive Tools' :
             stats.supportHours ? 'Support Hours' : 'Satisfaction Rate'
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading features...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50">
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
            Why Choose Excellence Academia?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide comprehensive educational solutions designed to help students achieve their academic goals through innovative learning methods and expert guidance.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = getIcon(feature.icon)
            const stats = getFeatureStats(feature)
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedFeature(feature)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Statistics */}
                    {stats && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.primary}</div>
                          <div className="text-xs text-gray-500">{stats.label}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.secondary}%</div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Key Benefits:</h4>
                      <ul className="space-y-1">
                        {feature.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                        {feature.benefits.length > 3 && (
                          <li className="text-xs text-blue-600 font-medium">
                            +{feature.benefits.length - 3} more benefits
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Action button */}
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                    >
                      Learn More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="py-12">
              <h3 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h3>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of successful students who have transformed their academic performance with our expert tutoring services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Get Started Today
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feature detail modal */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedFeature(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    {React.createElement(getIcon(selectedFeature.icon), { className: "h-8 w-8 text-blue-600" })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedFeature.title}</h3>
                    <p className="text-gray-600">{selectedFeature.description}</p>
                  </div>
                </div>

                {/* Statistics */}
                {selectedFeature.statistics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(selectedFeature.statistics).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{value}</div>
                        <div className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Benefits */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">Key Benefits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedFeature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonials */}
                {selectedFeature.testimonials && selectedFeature.testimonials.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">What Our Experts Say</h4>
                    <div className="space-y-3">
                      {selectedFeature.testimonials.map((testimonial, index) => (
                        <div key={index} className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {testimonial.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-sm">{testimonial.name}</div>
                              <div className="text-xs text-gray-500">{testimonial.subject} • {testimonial.experience}</div>
                              <p className="text-sm text-gray-700 mt-1 italic">"{testimonial.quote}"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setSelectedFeature(null)}>
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

export default FeaturesEnhanced