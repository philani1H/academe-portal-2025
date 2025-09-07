"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { Link, useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { 
  CheckCircle, 
  GraduationCap, 
  BookOpen, 
  ArrowRight, 
  Star, 
  Calendar, 
  Users, 
  Award
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
}

const Hero = () => {
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [animateParticles, setAnimateParticles] = useState(false)
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setAnimateParticles(true)
    fetchHeroContent()
  }, [])

  const fetchHeroContent = async () => {
    try {
      const response = await fetch('/api/admin/content/hero')
      if (!response.ok) throw new Error('Failed to load hero')
      const data = await response.json()
      setHeroContent(data)
    } catch (error) {
      console.error('Error fetching hero content:', error)
      setHeroContent(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanClick = (e) => {
    e.preventDefault()
    setShowGradeDialog(true)
  }

  const handleGradeSelection = (option) => {
    setShowGradeDialog(false)

    // Fixed navigation logic as requested
    if (option === "grade-11") {
      navigate("/exam-rewrite")
    } else if (option === "grade-12") {
      navigate("/pricing#standard") 
    } else if (option === "exam-rewrite") {
      navigate("/exam-rewrite")
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconMap = {
      'award': <Award className="h-10 w-10 text-blue-300 mb-2" />,
      'users': <Users className="h-10 w-10 text-blue-300 mb-2" />,
      'star': <Star className="h-10 w-10 text-blue-300 mb-2" />
    }
    return iconMap[iconName] || <Award className="h-10 w-10 text-blue-300 mb-2" />
  }

  // Better particle system
  const particles = Array(30).fill().map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 25,
    delay: Math.random() * 5
  }))

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1340] via-[#1B264F] to-[#3A5199] opacity-90" />
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!heroContent) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Enhanced Dynamic Background */}
      <div className={`absolute inset-0 ${heroContent.backgroundGradient} opacity-90`} />
      
      {/* Improved Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {animateParticles && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`,
              boxShadow: `0 0 ${particle.size * 2}px rgba(255, 255, 255, 0.4)`
            }}
            initial={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              opacity: 0
            }}
            animate={{
              x: [`${particle.x}vw`, `${(particle.x + 20) % 100}vw`],
              y: [`${particle.y}vh`, `${(particle.y + 20) % 100}vh`],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.5, 1]
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 z-10 py-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-3 tracking-tight">
              {heroContent.title}
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
              {heroContent.subtitle}
            </h2>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto"
          >
            {heroContent.description}
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {heroContent.features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10 flex flex-col items-center"
              >
                {getIconComponent(feature.icon)}
                <h3 className="text-2xl font-bold text-blue-200 mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="default"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 ease-in-out shadow-lg font-semibold px-10 py-7 rounded-xl text-lg"
                onClick={handlePlanClick}
              >
                {heroContent.buttonText}
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/become-tutor">
                <Button
                  variant="outline"
                  className="bg-transparent backdrop-blur-sm border-2 border-white/50 text-white hover:border-white hover:bg-white/10 transition-all duration-300 ease-in-out shadow-lg font-semibold px-10 py-7 rounded-xl text-lg"
                >
                  {heroContent.secondaryButtonText}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Added trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-16"
          >
            <p className="text-blue-200 mb-4 font-medium">{heroContent.trustIndicatorText}</p>
            <div className="flex justify-center space-x-8 opacity-70">
              {heroContent.universities.map((uni, index) => (
                <div key={index} className="text-white font-bold text-xl">
                  {uni}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Improved Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ 
          duration: 1.2, 
          delay: 1.5, 
          repeat: Infinity, 
          repeatType: "reverse" 
        }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-8 h-12 border-2 border-white/70 rounded-full flex justify-center">
          <motion.div 
            className="w-2 h-3 bg-white rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
        </div>
        <p className="text-white/70 text-xs mt-2 text-center">Scroll to explore</p>
      </motion.div>

      {/* Grade Selection Dialog - Improved Design */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="sm:max-w-[650px] bg-gradient-to-br from-[#0B1340] to-[#274690] text-white border-blue-300/20 p-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/path-to-pattern.svg')] opacity-5 pointer-events-none"></div>
          
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-3xl font-bold text-center text-blue-200">Choose Your Path to Success</DialogTitle>
            <DialogDescription className="text-center text-blue-100 text-lg mt-2">
              Select the option that best matches your educational journey
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
            {/* Grade 11 Option */}
            <Card
              className="bg-white/10 backdrop-filter backdrop-blur-lg border-blue-300/20 hover:bg-white/15 transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => handleGradeSelection("grade-11")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-xl text-blue-200 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Grade 11
                </CardTitle>
                <CardDescription className="text-blue-100/80">
                  Build your academic foundation
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Comprehensive curriculum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Expert teachers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Exam preparation</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="relative">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white group-hover:bg-blue-500"
                  onClick={() => handleGradeSelection("grade-11")}
                >
                  Choose Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Grade 12 Option */}
            <Card
              className="bg-white/10 backdrop-filter backdrop-blur-lg border-blue-300/20 hover:bg-white/15 transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => handleGradeSelection("grade-12")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-xl text-blue-200 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Grade 12
                </CardTitle>
                <CardDescription className="text-blue-100/80">
                  Excel in your final year
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Final exam focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Practice papers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">University preparation</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="relative">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white group-hover:bg-blue-500"
                  onClick={() => handleGradeSelection("grade-12")}
                >
                  Choose Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Grade 12 Rewrite Option */}
            <Card
              className="bg-white/10 backdrop-filter backdrop-blur-lg border-blue-300/20 hover:bg-white/15 transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => handleGradeSelection("exam-rewrite")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-xl text-blue-200 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Grade 12 Rewrite
                </CardTitle>
                <CardDescription className="text-blue-100/80">
                  Transform your results
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Subject specific focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Exam strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-100">Personalized support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="relative">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white group-hover:bg-blue-500"
                  onClick={() => handleGradeSelection("exam-rewrite")}
                >
                  Choose Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="text-center text-blue-100 text-sm p-6 pt-0 bg-blue-900/20">
            <p>
              Need help finding the right program?{" "}
              <a href="/contact" className="text-blue-300 hover:underline font-medium">
                Contact our education advisors
              </a>{" "}
              for personalized guidance.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default Hero