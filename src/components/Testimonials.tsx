"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  subject: string;
  improvement: string;
  image: string;
  rating: number;
  isActive: boolean;
  order: number;
}

const defaultTestimonials: Testimonial[] = []

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials);
  const [activeIndex, setActiveIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [autoplay, setAutoplay] = useState(true)
  const autoplayRef = useRef(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/admin/content/testimonials');
      if (!response.ok) throw new Error('Failed to load testimonials')
      const data = await response.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials([])
    } finally {
      setLoading(false);
    }
  };

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