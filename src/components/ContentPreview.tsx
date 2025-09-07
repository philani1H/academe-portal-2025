"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Eye, 
  X, 
  ExternalLink, 
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Star,
  CheckCircle,
  TrendingUp,
  Users,
  Award
} from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"

interface ContentPreviewProps {
  contentType: 'hero' | 'features' | 'testimonials' | 'pricing' | 'tutors' | 'subjects'
  content: any
  isOpen: boolean
  onClose: () => void
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  contentType,
  content,
  isOpen,
  onClose
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isLoading, setIsLoading] = useState(false)

  const getDeviceWidth = () => {
    switch (deviceView) {
      case 'mobile': return 'w-80'
      case 'tablet': return 'w-96'
      default: return 'w-full'
    }
  }

  const renderHeroPreview = () => (
    <div className={`${getDeviceWidth()} mx-auto`}>
      <div className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${content.backgroundGradient || 'from-blue-600 via-purple-600 to-indigo-600'}`}>
          {/* Animated particles */}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen">
            {/* Left side */}
            <div className="text-white space-y-8">
              {/* Trust indicator */}
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>{content.trustIndicatorText || 'Trusted by 10,000+ Students'}</span>
              </div>

              {/* Main heading */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  {content.title || 'Excellence in Education Starts Here'}
                </h1>
                <h2 className="text-xl lg:text-2xl text-blue-100 font-medium">
                  {content.subtitle || 'Transform Your Learning Journey'}
                </h2>
              </div>

              {/* Description */}
              <p className="text-lg text-blue-100 leading-relaxed">
                {content.description || 'Join thousands of successful students who have achieved their academic goals.'}
              </p>

              {/* Statistics */}
              {content.statistics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{content.statistics.studentsHelped?.toLocaleString() || '10,000'}+</div>
                    <div className="text-xs text-blue-200">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{content.statistics.successRate || '95'}%</div>
                    <div className="text-xs text-blue-200">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{content.statistics.averageGradeImprovement || '25'}%</div>
                    <div className="text-xs text-blue-200">Improvement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{content.statistics.tutorSatisfaction || '98'}%</div>
                    <div className="text-xs text-blue-200">Satisfaction</div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  {content.buttonText || 'Start Learning Today'}
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  {content.secondaryButtonText || 'Explore Courses'}
                </Button>
              </div>

              {/* Universities */}
              <div className="space-y-3">
                <p className="text-sm text-blue-200">Trusted by students from:</p>
                <div className="flex flex-wrap gap-2">
                  {(content.universities || ['Harvard', 'MIT', 'Stanford']).map((university: string, index: number) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-white/20 text-white border-white/30"
                    >
                      {university}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Features */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(content.features || []).slice(0, 4).map((feature: any, index: number) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{feature.title || 'Feature'}</h3>
                          <p className="text-xs text-blue-100 mt-1">{feature.description || 'Feature description'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFeaturesPreview = () => (
    <div className={`${getDeviceWidth()} mx-auto`}>
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Excellence Academia?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive educational solutions designed to help students achieve their academic goals.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(content || []).slice(0, 6).map((feature: any, index: number) => (
              <Card key={index} className="h-full hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                    <Award className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title || 'Feature Title'}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description || 'Feature description goes here'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Statistics */}
                  {feature.statistics && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {feature.statistics.totalTutors || feature.statistics.successRate || '95'}
                        </div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">
                          {feature.statistics.satisfactionRate || '98'}%
                        </div>
                        <div className="text-xs text-gray-500">Satisfaction</div>
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {(feature.benefits || []).slice(0, 3).map((benefit: string, idx: number) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  const renderTestimonialsPreview = () => (
    <div className={`${getDeviceWidth()} mx-auto`}>
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our students have to say.
            </p>
          </div>

          {/* Main testimonial */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                      {(content[0]?.name || 'S').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                      "{(content[0]?.content || 'This is a sample testimonial content that shows how testimonials will appear on the website.')}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {content[0]?.name || 'Sarah Johnson'}
                        </h4>
                        <p className="text-gray-600">{content[0]?.role || 'Grade 12 Student'}</p>
                        <div className="flex items-center space-x-1 mt-2">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      {content[0]?.improvement && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {content[0].improvement}
                          </div>
                          <div className="text-sm text-gray-500">Improvement</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testimonials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(content || []).slice(0, 6).map((testimonial: any, index: number) => (
              <Card key={index} className="h-full hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {(testimonial.name || 'S').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name || 'Student Name'}</CardTitle>
                      <CardDescription>{testimonial.role || 'Student Role'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: testimonial.rating || 5 }, (_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3">
                    "{testimonial.content || 'Sample testimonial content that demonstrates how testimonials will appear on the website.'}"
                  </p>

                  {testimonial.improvement && (
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {testimonial.improvement}
                      </div>
                      <div className="text-xs text-gray-500">Improvement</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  const renderContent = () => {
    switch (contentType) {
      case 'hero':
        return renderHeroPreview()
      case 'features':
        return renderFeaturesPreview()
      case 'testimonials':
        return renderTestimonialsPreview()
      default:
        return (
          <div className="text-center py-20">
            <p className="text-gray-500">Preview not available for this content type</p>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Content Preview - {contentType.charAt(0).toUpperCase() + contentType.slice(1)}</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {/* Device view selector */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={deviceView === 'desktop' ? 'default' : 'ghost'}
                  onClick={() => setDeviceView('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={deviceView === 'tablet' ? 'default' : 'ghost'}
                  onClick={() => setDeviceView('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={deviceView === 'mobile' ? 'default' : 'ghost'}
                  onClick={() => setDeviceView('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              
              <Button size="sm" variant="outline" onClick={() => setIsLoading(true)}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          <div className="border rounded-lg bg-white shadow-lg">
            {renderContent()}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Previewing: {contentType} content
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Publish Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ContentPreview