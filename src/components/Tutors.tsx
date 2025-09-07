"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Search, X, Filter, User, Phone, Mail, BookOpen, ThumbsUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Interface for tutor data
interface Tutor {
  id: string
  name: string
  subjects: string[]
  image: string
  contactName: string
  contactPhone: string
  contactEmail: string
  description: string
  ratings: Array<{
    id: number
    studentName: string
    rating: number
    comment: string
    date: string
  }>
}

// Default tutor data (fallback)
const defaultTutorList = [
  {
    id: 12,
    name: "Sir Raphael",
    subjects: ["Maths Literacy", "English FAL", "History"],
    image: "https://media-hosting.imagekit.io/b0f14e9cd7c04663/WhatsApp%20Image%202025-05-01%20at%2017.51.06_9b6f06d5.jpg?Expires=1841310263&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=ljztxmw-I6~Xh722izM58x2kFLzby8tvwS94aMVLD-VoFavdzLkPtLWovsyimHY97gAkebJyTLONPvBLRbebhXEIErl~bj7GkLUUHhxE0vgqBA~h9z~Jqhb3ZxZnfsHD8AmTfOs0Y63e61SjiIQd9gLrMcdFKtf-PFLcmq055kFgZNTt9t4jJNCNF95uJAyeWuCPmHxP7hx9RBk5McLl7pVWKNUC1LVfIQupvFqzJfRGLHLOsB~9K-Dp0tQLKQVI2a11Pogn6bKqnLBuW1eIWid0uV7QTzqRD2dDOB3UCgL2fDzIgTD2~l4D~fFPtF0VAeH-tKfb6YFkdPB5m8ZVEA__",
    contactName: "Sir Raphael",
    contactPhone: "+27698635814",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Sir Raphael specializes in Maths Literacy, English FAL, and History. He is dedicated to helping students achieve their academic goals through personalized instruction and comprehensive understanding.",
    ratings: [
      {
        id: 1,
        studentName: "Initial Rating",
        rating: 4,
        comment: "Excellent teaching methodology and student engagement.",
        date: "2025-04-02"
      }
    ]
  },
  {
    id: 1,
    name: "Roshan (mr mvp)",
    subjects: ["Geography", "Business Studies", "Economics"],
    image: "https://i.imgur.com/GqzI3ir.jpeg",
    contactName: "Roshan",
    contactPhone: "+27 79 386 7427",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Roshan, nicknamed (mr mvp), brings a wealth of knowledge in Economics and Geography. He believes in fostering critical thinking skills and a love for learning.",
    ratings: [
      {
        id: 1,
        studentName: "Michael S.",
        rating: 5,
        comment: "Excellent teacher! Made economics easy to understand.",
        date: "2025-03-15",
      },
      { id: 2, studentName: "Sarah J.", rating: 4, comment: "Very knowledgeable and patient.", date: "2025-02-28" },
    ],
  },
  {
    id: 2,
    name: "Paballo",
    subjects: ["Pure Mathematics", "Economics", "Business", "Accounting"],
    image: "https://i.imgur.com/mreslkv.jpeg",
    contactName: "Paballo A.L Sempe",
    contactPhone: "+27761328919",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Paballo has a strong background in pure mathematics, economics, and accounting. She focuses on making complex concepts accessible and engaging for students.",
    ratings: [
      {
        id: 1,
        studentName: "David K.",
        rating: 5,
        comment: "Paballo explains math concepts clearly and patiently.",
        date: "2025-03-20",
      },
    ],
  },
  {
    id: 3,
    name: "Promise Chabalala",
    subjects: ["Afrikaans FAL", "English HL", "Business Studies", "History"],
    image: "https://i.imgur.com/pf6NDEJ.jpeg",
    contactName: "Promise Chabalala",
    contactPhone: "+27 67 401 6982",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Promise brings a wealth of knowledge in language and humanities. She believes in fostering critical thinking skills and a love for learning.",
    ratings: [
      {
        id: 1,
        studentName: "Thabo M.",
        rating: 5,
        comment: "Amazing Afrikaans teacher! Helped me improve my grade significantly.",
        date: "2025-03-10",
      },
      { id: 2, studentName: "Lisa N.", rating: 4, comment: "Very supportive and knowledgeable.", date: "2025-02-15" },
    ],
  },
  {
    id: 4,
    name: "Mr Smooth-Accountant",
    subjects: ["Accounting", "Economics", "Business"],
    image: "https://i.imgur.com/Nsa0PWv.jpeg",
    contactName: "Mr. Smooth",
    contactPhone: "+27 63 416 1147",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Mr. Smooth specializes in accounting and business studies, providing real-world insights that bridge the gap between theory and practice.",
    ratings: [
      {
        id: 1,
        studentName: "James P.",
        rating: 5,
        comment: "Best accounting teacher I've ever had!",
        date: "2025-03-22",
      },
    ],
  },
  {
    id: 5,
    name: "Amanda (Miss Penguin)",
    subjects: ["Life Science", "Physical Science", "Geography", "English"],
    image: "https://i.imgur.com/WW80efP.jpeg",
    contactName: "Amanda Utembe",
    contactPhone: "+27 62 950 7687",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Amanda, also known as Miss Penguin, brings her expertise in life science, physical science, geography, and English. She strives to make learning both informative and fun.",
    ratings: [
      {
        id: 1,
        studentName: "Nomsa K.",
        rating: 5,
        comment: "Miss Penguin makes science fun and easy to understand!",
        date: "2025-03-18",
      },
      {
        id: 2,
        studentName: "Peter L.",
        rating: 4,
        comment: "Great teacher with creative teaching methods.",
        date: "2025-02-25",
      },
    ],
  },
    
  {
    id: 7,
    name: "Miss K",
    subjects: ["Accounting", "English", "Physical Science"],
    image: "https://i.imgur.com/grXHk5O.jpeg",
    contactName: "Miss K",
    contactPhone: "+27 83 520 7064",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Miss K specializes in accounting, English, and physical science. She is dedicated to helping students excel in these subjects with clarity and confidence.",
    ratings: [
      {
        id: 1,
        studentName: "Tumi S.",
        rating: 4,
        comment: "Miss K is very patient and explains concepts clearly.",
        date: "2025-03-12",
      },
    ],
  },
  {
    id: 8,
    name: "Jacob",
    subjects: ["Tourism", "English", "CAT", "Maths"],
    image: "https://i.imgur.com/SwZblK8.jpeg",
    contactName: "Jacob",
    contactPhone: "+27 71 683 5713",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Jacob specializes in tourism, English, CAT, and maths. He is dedicated to ensuring his students understand key concepts in an engaging and approachable way.",
    ratings: [
      {
        id: 1,
        studentName: "Sipho N.",
        rating: 5,
        comment: "Jacob is an excellent CAT teacher. Very knowledgeable!",
        date: "2025-03-08",
      },
    ],
  },
  {
    id: 9,
    name: "Rems Sibiya",
    subjects: ["Tourism", "Math Literacy"],
    image: "https://i.imgur.com/2dRSlGS.jpeg",
    contactName: "Rems Sibiya",
    contactPhone: "+27 78 401 9329",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Rems specializes in tourism and math literacy. His passion is helping students succeed with confidence in their academic journey.",
    ratings: [
      {
        id: 1,
        studentName: "Bongi M.",
        rating: 4,
        comment: "Rems makes math literacy easy to understand.",
        date: "2025-03-15",
      },
    ],
  },
  {
    id: 10,
    name: "Miss Keturah",
    subjects: ["Life Sciences", "Physical Sciences", "Mathematics"],
    image: "https://media-hosting.imagekit.io/ead232ae99dd4dc2/WhatsApp%20Image%202025-04-02%20at%2018.40.37_2e9a0094.jpg?Expires=1838456745&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=2GQwXVeBJ~2FqX3DA66OMXmKnzbh6LtLZeAsSVlbpXCSvE5u-KrFryvFGerhsw~tZZoXkhhaIa1eH-N7W0dbLWMoD7HF3mRx1Z0LfbcbkzHIp1bdEFMeEQ6Rb2hOWOIj37HugVCKXsyRCilCkFGSscSFF0~RnjCT6oX0dkfE1yRcM8AISo7PGibOFlzq8CbUvRrdtATM227iQhmkL51uxvT5beKcnt24rIyN62aHy7iaD1qWltwSt1MTZJNbL4X440ehX0XP34YYfbWJxrv04YbM14a0g6SsKnNFfmofW2yKj8NWGcmNqaqzmg~VdQJvVFWH~CBVva2XEz89PIM9hA__",
    contactName: "Miss Keturah",
    contactPhone: "083 669 4983",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Miss Keturah is dedicated to teaching Life Sciences, Physical Sciences, and Mathematics. She focuses on fostering deep understanding and academic excellence in her students.",
    ratings: [
      {
        id: 1,
        studentName: "Thandi K.",
        rating: 5,
        comment: "Miss Keturah is an amazing science teacher!",
        date: "2025-03-20",
      },
    ],
  },
  {
    id: 11,
    name: "Siyanda Shane Thomo",
    subjects: ["Geography", "Afrikaans", "English FAL", "Math Literacy"],
    image: "https://i.imgur.com/XFfT7VU.jpeg",
    contactName: "Thomo Shane",
    contactPhone: "+27 78 384 1756",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description:
      "Thomo Shane is dedicated to helping students excel in geography, Afrikaans, English FAL, and math literacy. He creates an engaging learning experience tailored to individual needs.",
    ratings: [
      {
        id: 1,
        studentName: "Mpho L.",
        rating: 5,
        comment: "Thomo is an excellent geography teacher!",
        date: "2025-03-10",
      },
    ],
  },
]

// Calculate average rating for a tutor
const calculateAverageRating = (ratings: { rating: number }[]) => {
  if (!ratings || ratings.length === 0) return "0.0"
  const sum = ratings.reduce((total, rating) => total + rating.rating, 0)
  return (sum / ratings.length).toFixed(1)
}

export default function TutorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [sortOption, setSortOption] = useState("name")
  const [imagesLoaded, setImagesLoaded] = useState({})
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [newRating, setNewRating] = useState({
    studentName: "",
    rating: 5,
    comment: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  // Refs for animations
  const headerRef = useRef(null)
  const searchRef = useRef(null)

  // Fetch tutors from API
  useEffect(() => {
    fetchTutors()
  }, [])

  const fetchTutors = async () => {
    try {
      const response = await fetch('/api/admin/content/tutors')
      if (response.ok) {
        const data = await response.json()
        setTutors(data)
        setFilteredTutors(data)
      } else {
        // Fallback to default tutors if API fails
        setTutors(defaultTutorList)
        setFilteredTutors(defaultTutorList)
      }
    } catch (error) {
      console.error('Error fetching tutors:', error)
      // Set fallback content
      setTutors(defaultTutorList)
      setFilteredTutors(defaultTutorList)
    } finally {
      setLoading(false)
    }
  }

  // Extract all unique subjects for the filter dropdown
  const allSubjects = [...new Set(tutors.flatMap((tutor) => tutor.subjects))].sort()

  // Filter and sort tutors
  useEffect(() => {
    let filtered = tutors.filter((tutor) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === "" ||
        tutor.name.toLowerCase().includes(searchLower) ||
        tutor.subjects.some((subject) => subject.toLowerCase().includes(searchLower))

      const matchesSubject = selectedSubject === "" || tutor.subjects.some((subject) => subject === selectedSubject)

      return matchesSearch && matchesSubject
    })

    // Sort tutors based on selected option
    filtered = [...filtered].sort((a, b) => {
      if (sortOption === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortOption === "rating") {
        const aRating = Number.parseFloat(calculateAverageRating(a.ratings))
        const bRating = Number.parseFloat(calculateAverageRating(b.ratings))
        return bRating - aRating
      } else if (sortOption === "subjects") {
        return a.subjects.length - b.subjects.length
      }
      return 0
    })

    setFilteredTutors(filtered)
  }, [searchTerm, selectedSubject, sortOption, tutors])

  // Handle image load status
  const handleImageLoad = (tutorName) => {
    setImagesLoaded((prev) => ({
      ...prev,
      [tutorName]: true,
    }))
  }

  const handleImageError = (tutorName) => {
    setImagesLoaded((prev) => ({
      ...prev,
      [tutorName]: false,
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedSubject("")
    setSortOption("name")
  }

  // Submit a new rating
  const handleRatingSubmit = () => {
    if (!newRating.studentName || !newRating.comment) return

    setIsSubmitting(true)

    // Simulate API call with timeout
    setTimeout(() => {
      const updatedTutors = tutors.map((tutor) => {
        if (tutor.id === selectedTutor.id) {
          const newRatingObj = {
            id: tutor.ratings.length + 1,
            studentName: newRating.studentName,
            rating: newRating.rating,
            comment: newRating.comment,
            date: new Date().toISOString().split("T")[0],
          }

          return {
            ...tutor,
            ratings: [...tutor.ratings, newRatingObj],
          }
        }
        return tutor
      })

      // Update the tutor list
      setTutors(updatedTutors)

      // Reset form and close dialog
      setNewRating({
        studentName: "",
        rating: 5,
        comment: "",
      })
      setIsSubmitting(false)
      setSelectedTutor(null)

      // Update filtered tutors
      setFilteredTutors(
        updatedTutors.filter((tutor) => {
          const searchLower = searchTerm.toLowerCase()
          const matchesSearch =
            searchTerm === "" ||
            tutor.name.toLowerCase().includes(searchLower) ||
            tutor.subjects.some((subject) => subject.toLowerCase().includes(searchLower))

          const matchesSubject = selectedSubject === "" || tutor.subjects.some((subject) => subject === selectedSubject)

          return matchesSearch && matchesSubject
        }),
      )
    }, 1000)
  }

  // Star rating component
  const StarRating = ({ rating, size = 16, interactive = false, onRatingChange = null }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onRatingChange(star) : undefined}
            className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            aria-label={interactive ? `Rate ${star} stars` : `Rated ${rating} out of 5 stars`}
          >
            <Star
              size={size}
              className={`${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} transition-colors`}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white py-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800/30 via-blue-900/30 to-blue-950/30 backdrop-blur-[1px]"></div>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative container mx-auto px-4 z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200 tracking-tight">
            Meet Our Expert Tutors
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed opacity-90">
            Our experienced tutors are here to help you excel in your academic journey. Browse our tutors, read reviews,
            and find the perfect match for your learning needs.
          </p>
        </motion.div>

        {/* Search and filter functionality */}
        <motion.div
          ref={searchRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="search" className="text-blue-100">
                  Search Tutors
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={18} />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-blue-300/30 text-white pl-10 placeholder:text-blue-200/70 focus:border-blue-200 focus:ring-blue-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-blue-300/30 text-blue-100 hover:text-white hover:bg-blue-800/50"
              >
                <Filter size={16} className="mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Advanced filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <Label htmlFor="subject-filter" className="text-blue-100">
                        Filter by Subject
                      </Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger
                          id="subject-filter"
                          className="bg-white/10 border-blue-300/30 text-white focus:ring-blue-400"
                        >
                          <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-900 border-blue-700 text-white">
                          <SelectItem value="all">All Subjects</SelectItem>
                          {allSubjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sort-option" className="text-blue-100">
                        Sort By
                      </Label>
                      <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger
                          id="sort-option"
                          className="bg-white/10 border-blue-300/30 text-white focus:ring-blue-400"
                        >
                          <SelectValue placeholder="Sort by Name" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-900 border-blue-700 text-white">
                          <SelectItem value="name">Name (A-Z)</SelectItem>
                          <SelectItem value="rating">Highest Rating</SelectItem>
                          <SelectItem value="subjects">Most Subjects</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={clearFilters}
                        variant="secondary"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-sm text-blue-200 mt-4">
              Showing {filteredTutors.length} of {tutors.length} tutors
              {(searchTerm || selectedSubject !== "") && <span> • Filtered results</span>}
            </div>
          </div>
        </motion.div>

        {/* Tutors grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence>
            {filteredTutors.map((tutor, index) => (
              <motion.div
                key={tutor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="h-full"
              >
                <Card className="h-full bg-white/95 backdrop-blur-md shadow-xl border-2 border-blue-100/30 rounded-2xl overflow-hidden hover:border-blue-200/40 transition-all duration-300">
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Image Container that shows full images without cutting */}
                    <div className="relative h-64 overflow-hidden bg-blue-100/20">
                      {/* Hidden preload image */}
                      <img
                        src={tutor.image || "/placeholder.svg"}
                        alt=""
                        className="hidden"
                        onLoad={() => handleImageLoad(tutor.name)}
                        onError={() => handleImageError(tutor.name)}
                      />

                      {/* Visible image with object-contain to show full image */}
                      <img
                        src={imagesLoaded[tutor.name] === false ? "/placeholder.svg?height=300&width=400" : tutor.image}
                        alt={`${tutor.name} - Tutor`}
                        className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 hover:scale-105"
                        loading="lazy"
                      />

                      {/* Dark background to ensure visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/40 z-0"></div>

                      {/* Rating badge */}
                      <div className="absolute top-3 right-3 bg-blue-900/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-medium border border-blue-700/50 shadow-lg z-10">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span>{calculateAverageRating(tutor.ratings)}</span>
                      </div>

                      {/* Subject count badge */}
                      <div className="absolute top-3 left-3 bg-blue-900/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-medium border border-blue-700/50 shadow-lg z-10">
                        <BookOpen size={16} />
                        <span>{tutor.subjects.length} subjects</span>
                      </div>

                      {/* Name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <h3 className="text-2xl font-bold text-white">{tutor.name}</h3>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-grow flex flex-col">
                      {/* Subjects tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tutor.subjects.slice(0, 3).map((subject, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-blue-100/90 text-blue-900 hover:bg-blue-200 transition-colors"
                          >
                            {subject}
                          </Badge>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <Badge variant="outline" className="text-blue-800 border-blue-200">
                            +{tutor.subjects.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Description Section */}
                      <p className="text-gray-700 mb-4 line-clamp-3">{tutor.description}</p>

                      {/* Contact Information Section - Preview */}
                      <div className="mt-auto space-y-3 pt-4 border-t border-blue-100/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-900">
                            <User size={16} className="text-blue-700" />
                            <span className="font-medium">{tutor.contactName}</span>
                          </div>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white text-gray-900 max-w-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-blue-900">{tutor.name}</DialogTitle>
                                <DialogDescription>
                                  <div className="flex items-center gap-2 text-blue-700">
                                    <StarRating
                                      rating={Number.parseFloat(calculateAverageRating(tutor.ratings))}
                                      size={18}
                                    />
                                    <span className="font-medium">{calculateAverageRating(tutor.ratings)} / 5.0</span>
                                    <span className="text-gray-500">({tutor.ratings.length} reviews)</span>
                                  </div>
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                  <div className="rounded-xl overflow-hidden shadow-md bg-gray-100 h-64">
                                    <img
                                      src={
                                        imagesLoaded[tutor.name] === false
                                          ? "/placeholder.svg?height=300&width=400"
                                          : tutor.image
                                      }
                                      alt={`${tutor.name} - Tutor`}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>

                                  <div className="mt-4 space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <h4 className="font-semibold text-blue-900">Contact Information</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <User size={16} className="text-blue-700" />
                                        <span>{tutor.contactName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <Phone size={16} className="text-blue-700" />
                                        <span>{tutor.contactPhone}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <Mail size={16} className="text-blue-700" />
                                        <span>{tutor.contactEmail}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-blue-900 mb-2">About</h4>
                                    <p className="text-gray-700">{tutor.description}</p>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-blue-900 mb-2">Subjects</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {tutor.subjects.map((subject, idx) => (
                                        <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-900">
                                          {subject}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-blue-900">Student Reviews</h4>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                        onClick={() => setSelectedTutor(tutor)}
                                      >
                                        <ThumbsUp size={14} className="mr-1" />
                                        Rate Tutor
                                      </Button>
                                    </div>

                                    {tutor.ratings.length > 0 ? (
                                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {tutor.ratings.map((rating) => (
                                          <div
                                            key={rating.id}
                                            className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                                          >
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-medium text-gray-900">{rating.studentName}</span>
                                              <span className="text-xs text-gray-500">{rating.date}</span>
                                            </div>
                                            <div className="mb-2">
                                              <StarRating rating={rating.rating} size={14} />
                                            </div>
                                            <p className="text-gray-700 text-sm">{rating.comment}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 text-sm italic">
                                        No reviews yet. Be the first to rate this tutor!
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No results message */}
        {filteredTutors.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 max-w-2xl mx-auto mt-8"
          >
            <Search className="w-16 h-16 mx-auto text-blue-200/70" />
            <p className="text-2xl font-semibold text-blue-100 mt-4">No tutors found</p>
            <p className="text-blue-200/70 mt-2 max-w-md mx-auto">
              We couldn't find any tutors matching your search criteria. Please try different keywords or clear your
              filters.
            </p>
            <Button className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </motion.div>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={!!selectedTutor} onOpenChange={(open) => !open && setSelectedTutor(null)}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Rate {selectedTutor?.name}</DialogTitle>
            <DialogDescription>Share your experience with this tutor to help other students.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="student-name" className="text-gray-700">
                Your Name
              </Label>
              <Input
                id="student-name"
                value={newRating.studentName}
                onChange={(e) => setNewRating({ ...newRating, studentName: e.target.value })}
                placeholder="Enter your name"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Your Rating</Label>
              <div className="p-2 border rounded-md bg-gray-50">
                <StarRating
                  rating={newRating.rating}
                  size={24}
                  interactive={true}
                  onRatingChange={(rating) => setNewRating({ ...newRating, rating })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment" className="text-gray-700">
                Your Review
              </Label>
              <Textarea
                id="comment"
                value={newRating.comment}
                onChange={(e) => setNewRating({ ...newRating, comment: e.target.value })}
                placeholder="Share your experience with this tutor..."
                className="border-gray-300 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-gray-300">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleRatingSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || !newRating.studentName || !newRating.comment}
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
