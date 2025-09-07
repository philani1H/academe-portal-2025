"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { CheckCircle, Calendar, FileText, Users, ArrowRight, BookOpen, Award } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

const ExamRewrite = () => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [showGrade11Form, setShowGrade11Form] = useState(false)
  const [showGrade12Form, setShowGrade12Form] = useState(false)

  // Refs for scroll animations
  const processRef = useRef(null)
  const subjectsRef = useRef(null)
  const benefitsRef = useRef(null)

  // Check if elements are in view
  const processInView = useInView(processRef, { once: true, amount: 0.3 })
  const subjectsInView = useInView(subjectsRef, { once: true, amount: 0.3 })
  const benefitsInView = useInView(benefitsRef, { once: true, amount: 0.3 })

  const handleHover = () => {
    setIsAnimating(true)
  }

  const handleHoverEnd = () => {
    setIsAnimating(false)
  }

  // Google Forms student application URL
  const studentApplicationFormUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLScZUhGQsFhbgqLRdZ3PrZwr64pBIBgxKyY8EyQSE4REUxwWeA/viewform"

  const handleApplyClick = () => {
    setShowGradeDialog(true)
  }

  const handleGradeSelection = (grade) => {
    setSelectedGrade(grade)
    setShowGradeDialog(false)

    // Show the appropriate form dialog based on grade
    if (grade === "Grade 11") {
      setShowGrade11Form(true)
    } else if (grade === "Grade 12") {
      setShowGrade12Form(true)
    }
  }

  const requirements = [
    "Must be a Grade 11 or 12 student",
    "Previous exam mark of at least 30%",
    "Valid school report or results statement",
    "Proof of identity (ID or passport)",
    "Parent/guardian consent if under 18",
  ]

  const availableSubjects = {
    "Mathematics & Sciences": ["Mathematics", "Physical Sciences", "Life Sciences", "Mathematical Literacy"],
    Languages: ["English Home Language", "English First Additional Language", "Afrikaans"],
    Commerce: ["Accounting", "Business Studies", "Economics"],
    "Humanities & Other": ["Geography", "Tourism", "Computer Applications Technology (CAT)"],
  }

  const programBenefits = [
    {
      title: "Expert Teachers",
      description: "Learn from qualified educators with proven track records",
      icon: <Users className="h-5 w-5 text-blue-300" />,
    },
    {
      title: "Small Classes",
      description: "Personalized attention in small group settings",
      icon: <Users className="h-5 w-5 text-blue-300" />,
    },
    {
      title: "Practice Materials",
      description: "Access to past papers and comprehensive study guides",
      icon: <FileText className="h-5 w-5 text-blue-300" />,
    },
    {
      title: "Flexible Schedule",
      description: "Classes offered at various times to fit your needs",
      icon: <Calendar className="h-5 w-5 text-blue-300" />,
    },
    {
      title: "Progress Tracking",
      description: "Regular assessments to monitor your improvement",
      icon: <Award className="h-5 w-5 text-blue-300" />,
    },
  ]

  const testimonials = [
    {
      name: "Thabo M.",
      grade: "Grade 12",
      subject: "Mathematics",
      improvement: "From 42% to 68%",
      quote:
        "The exam rewrite program helped me understand concepts I had struggled with for years. My marks improved dramatically!",
    },
    {
      name: "Lerato K.",
      grade: "Grade 11",
      subject: "Physical Sciences",
      improvement: "From 38% to 72%",
      quote:
        "The teachers explained difficult topics in a way that finally made sense to me. I'm now confident about my final exams.",
    },
    {
      name: "Michael P.",
      grade: "Grade 12",
      subject: "Accounting",
      improvement: "From 45% to 76%",
      quote:
        "Thanks to Excellence Akademie, I was able to secure admission to my dream university program after rewriting my accounting exam.",
    },
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white">
      {/* Hero Section with Parallax Effect */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 to-blue-800/80 backdrop-blur-sm"></div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20"
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
              }}
              animate={{
                x: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
                y: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
              }}
              transition={{
                duration: 20 + Math.random() * 30,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row items-center gap-12"
          >
            <div className="lg:w-1/2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Badge className="bg-blue-600/80 text-white mb-4 px-3 py-1 text-sm">Excellence Akademie</Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent leading-tight">
                  Grade 11 & 12 <br />
                  Exam Rewrite Program
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-blue-100 max-w-xl"
              >
                Your second chance to improve your marks and achieve your academic goals. Our specialized program helps
                students rewrite exams and significantly improve their results.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-600/20 transform hover:-translate-y-1"
                  onMouseEnter={handleHover}
                  onMouseLeave={handleHoverEnd}
                  onClick={handleApplyClick}
                >
                  <motion.span
                    animate={isAnimating ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center"
                  >
                    Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 rounded-xl font-medium transition-all duration-300"
                >
                  Learn More
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl blur-2xl transform -rotate-6 scale-105"></div>
              <img
                src="https://media-hosting.imagekit.io/a986885f86804985/IMG_0444.PNG?Expires=1838011954&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=BlkcPPzw4VS1-HFpajZ3y4yrFlB8dE3sZH4ZMLgC-6BInO9KuR~9MRGN5czgVskTPD~w7GL08y7VW-HUUtrlJRNMt8WQ1kCGbkcaef~OCiuISSTaVp7LFSZ7muRItb8-yb5btHlmcBKqJY2IN8nVsvJSGbECHOmYp-lvnJWJ0EJWQnfNJmgI3z4CR2rDSP2K9zZA6jrCH7kHDBdC4qubb0QHN~pYv4XS4VVNlrEpTVumtcmsHS47lkKRHfbxAGHs87g~S3SQFfazJnn6OWvWfQttl2bMwD4aI97-KOYVnVWtkeFC5joEDfOt~sjGusH6wdaT31yWzSSW3AVVS4R1yg__"
                alt="Exam Rewrite Program"
                className="w-full h-auto rounded-2xl shadow-2xl relative z-10 border-2 border-white/10"
              />

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-5 -left-5 bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-2 rounded-lg shadow-lg z-20 border border-blue-500/50"
              >
                <div className="text-sm font-medium">Success Rate</div>
                <div className="text-2xl font-bold">92%</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -top-5 -right-5 bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-2 rounded-lg shadow-lg z-20 border border-blue-500/50"
              >
                <div className="text-sm font-medium">Average Improvement</div>
                <div className="text-2xl font-bold">+28%</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Requirements & Benefits Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4">
              Program Overview
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Our comprehensive exam rewrite program is designed to help students significantly improve their academic
              performance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Requirements Card */}
            <motion.div
              ref={benefitsRef}
              variants={containerVariants}
              initial="hidden"
              animate={benefitsInView ? "visible" : "hidden"}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl shadow-lg p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-300" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mt-4">
                  {requirements.map((req, index) => (
                    <motion.li key={index} variants={itemVariants} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-300 mt-0.5 flex-shrink-0" />
                      <span className="text-blue-100">{req}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </motion.div>

            {/* Benefits Card */}
            <motion.div
              ref={processRef}
              variants={containerVariants}
              initial="hidden"
              animate={processInView ? "visible" : "hidden"}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl shadow-lg p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-300" />
                  Program Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mt-4">
                  {programBenefits.map((benefit, index) => (
                    <motion.li key={index} variants={itemVariants} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{benefit.icon}</div>
                      <div>
                        <div className="font-medium text-white">{benefit.title}</div>
                        <div className="text-sm text-blue-200">{benefit.description}</div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </motion.div>

            {/* Testimonials Card */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl shadow-lg p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-300" />
                  Success Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  {testimonials.map((testimonial, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="bg-blue-700/30 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-white">{testimonial.name}</div>
                          <div className="text-sm text-blue-200">{testimonial.grade}</div>
                        </div>
                        <Badge className="bg-green-600/80">{testimonial.improvement}</Badge>
                      </div>
                      <p className="text-sm text-blue-100 italic">"{testimonial.quote}"</p>
                      <div className="mt-2 text-xs text-blue-300">{testimonial.subject}</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-20 relative bg-blue-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4">
              Available Subjects
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We offer exam rewrite opportunities for a wide range of Grade 11 and Grade 12 subjects
            </p>
          </motion.div>

          <Tabs defaultValue="Mathematics & Sciences" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8 bg-blue-800/40 p-1 rounded-lg">
              {Object.keys(availableSubjects).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(availableSubjects).map(([category, subjects]) => (
              <TabsContent key={category} value={category}>
                <motion.div
                  ref={subjectsRef}
                  variants={containerVariants}
                  initial="hidden"
                  animate={subjectsInView ? "visible" : "hidden"}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ y: -5 }}
                      className="backdrop-blur-md bg-blue-800/40 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-3"
                    >
                      <BookOpen className="h-5 w-5 text-blue-300 flex-shrink-0" />
                      <span className="text-blue-100">{subject}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4">
              Application Process
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Follow these simple steps to enroll in our exam rewrite program
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-12 h-12 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-semibold">1</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">Submit Application</h3>
              <p className="text-blue-100">
                Complete the online application form with your personal details and subject choices
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-12 h-12 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-semibold">2</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">Document Verification</h3>
              <p className="text-blue-100">Submit your previous exam results and required documents</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-12 h-12 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-semibold">3</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">Payment</h3>
              <p className="text-blue-100">Process the registration fee for your selected subjects</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-12 h-12 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-semibold">4</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">Class Placement</h3>
              <p className="text-blue-100">Get your class schedule and start your rewrite journey</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 relative bg-blue-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4">
              Program Pricing
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Affordable options to help you achieve your academic goals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-16 h-16 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-bold text-xl">R150</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">Grade 11</h3>
              <p className="text-blue-100">Standard program for Grade 11 students looking to improve their marks</p>
              <Badge className="mt-4 bg-blue-600">Regular Program</Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-16 h-16 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-bold text-xl">R450</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">Matric Rewrite</h3>
              <p className="text-blue-100">May/June exam rewrite for Grade 12 students</p>
              <Badge className="mt-4 bg-green-600">Most Popular</Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-16 h-16 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-bold text-xl">R350</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">Finals</h3>
              <p className="text-blue-100">May/June finals preparation program</p>
              <Badge className="mt-4 bg-blue-600">Comprehensive</Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-700/50 rounded-full w-16 h-16 flex items-center justify-center mb-4 border border-white/10">
                <span className="text-white font-bold text-xl">R250</span>
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">November</h3>
              <p className="text-blue-100">November exam preparation program</p>
              <Badge className="mt-4 bg-blue-600">Year-End Special</Badge>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/0 via-blue-800/50 to-blue-900/0"></div>
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-md bg-blue-800/40 rounded-2xl p-8 border border-white/10 shadow-xl"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4">
              Ready to Improve Your Grades?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Take the first step towards academic excellence and a brighter future
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-600/20 transform hover:-translate-y-1"
              onMouseEnter={handleHover}
              onMouseLeave={handleHoverEnd}
              onClick={handleApplyClick}
            >
              <motion.span
                animate={isAnimating ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center"
              >
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </motion.span>
            </Button>
            <p className="mt-4 text-blue-200 text-sm">
              Applications for the next intake close soon. Limited spots available.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grade Selection Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-800 text-white border-blue-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-blue-100">Select Your Grade</DialogTitle>
            <DialogDescription className="text-center text-blue-200">
              Choose your current grade to proceed with the application
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Card
              className="bg-blue-800/50 hover:bg-blue-700/50 border-blue-600/30 text-white cursor-pointer transition-all duration-300 transform hover:scale-105"
              onClick={() => handleGradeSelection("Grade 11")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600/50 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">11</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Grade 11</h3>
                <p className="text-blue-200 text-sm">For current Grade 11 students looking to improve their marks</p>
                <Badge className="mt-4 bg-blue-600">R150</Badge>
              </CardContent>
            </Card>

            <Card
              className="bg-blue-800/50 hover:bg-blue-700/50 border-blue-600/30 text-white cursor-pointer transition-all duration-300 transform hover:scale-105"
              onClick={() => handleGradeSelection("Grade 12")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600/50 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">12</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Grade 12</h3>
                <p className="text-blue-200 text-sm">
                  For current Grade 12 students or graduates looking to improve their matric results
                </p>
                <Badge className="mt-4 bg-green-600">From R250</Badge>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGradeDialog(false)}
              className="border-blue-500 text-blue-200 hover:bg-blue-700/50"
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => {
                setShowGradeDialog(false)
                setShowGrade12Form(true)
              }}
            >
              Continue Without Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade 11 Form Dialog */}
      <Dialog open={showGrade11Form} onOpenChange={setShowGrade11Form} className="w-full max-w-4xl">
        <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-800 text-white border-blue-700 max-w-4xl w-full p-1 sm:p-2 md:p-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-blue-100">
              Grade 11 Application Form
            </DialogTitle>
          </DialogHeader>
          <div className="w-full overflow-hidden rounded-lg bg-white">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSdn3-0c3DlpFno8HwhhU7HnYCvr8IXp8HJ5uoOdasKY2QBpEA/viewform?embedded=true"
              width="100%"
              height="600"
              style={{ border: "none" }}
              title="Grade 11 Application Form"
            >
              Loading...
            </iframe>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowGrade11Form(false)}
              className="border-blue-500 text-blue-200 hover:bg-blue-700/50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade 12 Form Dialog */}
      <Dialog open={showGrade12Form} onOpenChange={setShowGrade12Form} className="w-full max-w-4xl">
        <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-800 text-white border-blue-700 max-w-4xl w-full p-1 sm:p-2 md:p-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-blue-100">
              Grade 12 Application Form
            </DialogTitle>
          </DialogHeader>
          <div className="w-full overflow-hidden rounded-lg bg-white">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScZUhGQsFhbgqLRdZ3PrZwr64pBIBgxKyY8EyQSE4REUxwWeA/viewform?embedded=true"
              width="100%"
              height="600"
              style={{ border: "none" }}
              title="Grade 12 Application Form"
            >
              Loading...
            </iframe>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowGrade12Form(false)}
              className="border-blue-500 text-blue-200 hover:bg-blue-700/50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ExamRewrite
