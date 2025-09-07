"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"

// Testimonial data
const testimonials = [
  {
    id: 1,
    content:
      "My grades improved significantly after just a few sessions. The tutors are knowledgeable and patient. I went from struggling with mathematics to scoring an A in my final exam!",
    author: "Sarah M.",
    role: "Mathematics Student",
    subject: "Mathematics",
    improvement: "C to A",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    id: 2,
    content:
      "The flexible scheduling made it easy to fit tutoring into my busy schedule. The tutors at Excellence Akademie truly care about your success and go the extra mile to ensure you understand the concepts.",
    author: "James R.",
    role: "Physics Student",
    subject: "Physics",
    improvement: "D to B+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    id: 3,
    content:
      "Excellence Akademie helped me prepare for my exams. The tutors are professional and supportive. Their exam preparation strategies were invaluable and helped me achieve results I never thought possible.",
    author: "Emily W.",
    role: "Language Student",
    subject: "English",
    improvement: "B- to A+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    id: 4,
    content:
      "I was struggling with Business Studies until I found Excellence Akademie. Their tutors explained complex concepts in a way that was easy to understand. My confidence has grown tremendously!",
    author: "Michael K.",
    role: "Business Student",
    subject: "Business Studies",
    improvement: "D to B",
    image: "/placeholder.svg?height=100&width=100",
    rating: 4,
  },
  {
    id: 5,
    content:
      "The personalized attention I received was incredible. My tutor identified my weak areas and created a custom study plan that addressed my specific needs. I'm now excelling in all my subjects!",
    author: "Thabo N.",
    role: "Science Student",
    subject: "Life Sciences",
    improvement: "C- to A-",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    id: 6,
    content:
      "Excellence Akademie's exam rewrite program was a game-changer for me. I was able to improve my matric results and secure admission to my dream university. Forever grateful!",
    author: "Lerato M.",
    role: "Grade 12 Graduate",
    subject: "Multiple Subjects",
    improvement: "University Admission Achieved",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
]

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [autoplay, setAutoplay] = useState(true)
  const autoplayRef = useRef(null)

  // Determine how many testimonials to show based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1)
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2)
      } else {
        setVisibleCount(3)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Autoplay functionality
  useEffect(() => {
    if (autoplay) {
      autoplayRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % (testimonials.length - visibleCount + 1))
      }, 5000)
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
    }
  }, [autoplay, visibleCount])

  // Handle navigation
  const handlePrev = () => {
    setAutoplay(false)
    setActiveIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setAutoplay(false)
    setActiveIndex((prev) => Math.min(testimonials.length - visibleCount, prev + 1))
  }

  // Render stars based on rating
  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star key={i} size={18} className={`${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-blue-900 mb-4">What Our Students Say</h2>
          <p className="text-xl text-blue-700/70 max-w-3xl mx-auto">
            Hear from our students about how Excellence Akademie has transformed their academic journey
          </p>
        </motion.div>

        <div className="relative">
          {/* Testimonial Cards */}
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-all duration-500 ease-in-out"
              style={{
                transform: `translateX(-${activeIndex * (100 / visibleCount)}%)`,
                width: `${(testimonials.length / visibleCount) * 100}%`,
              }}
            >
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  className="px-4"
                  style={{ width: `${(100 / testimonials.length) * visibleCount}%` }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-2xl shadow-xl p-8 h-full border border-blue-100 hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4">{renderStars(testimonial.rating)}</div>

                    <div className="relative mb-8">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-200 opacity-50" />
                      <p className="text-gray-700 relative z-10 pl-6">"{testimonial.content}"</p>
                    </div>

                    <div className="flex items-center mt-6">
                      <Avatar className="h-12 w-12 border-2 border-blue-100">
                        <AvatarImage src={testimonial.image || "/placeholder.svg"} alt={testimonial.author} />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {testimonial.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="ml-4">
                        <div className="font-semibold text-blue-900">{testimonial.author}</div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            {testimonial.subject}
                          </Badge>
                          {testimonial.improvement && (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                              {testimonial.improvement}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center mt-10 gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex gap-2">
              {Array(testimonials.length - visibleCount + 1)
                .fill(0)
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAutoplay(false)
                      setActiveIndex(i)
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeIndex === i ? "bg-blue-600 w-6" : "bg-blue-200 hover:bg-blue-300"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={activeIndex >= testimonials.length - visibleCount}
              className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* View All Link */}
          <div className="text-center mt-10">
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800"
              onClick={() => {
                window.location.href = '/testimonials'
              }}
            >
              View All Student Success Stories
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials