"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Search, Filter, ChevronRight, BookOpen, Users, Award, Clock } from "lucide-react"
import { Input } from "./ui/input"

// Interface for subject data
interface Subject {
  id: string
  name: string
  description: string
  image: string
  category: string
  tutorsCount: number
  popularTopics: string[]
  difficulty: string[]
}

// Default subject data (fallback)
const defaultSubjectData = [
  {
    id: 1,
    name: "Mathematics",
    description: "From algebra to calculus, master any math topic with our expert tutors.",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    category: "STEM",
    tutorsCount: 12,
    popularTopics: ["Algebra", "Calculus", "Geometry", "Trigonometry"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 2,
    name: "Physical Sciences",
    description: "Comprehensive physics and chemistry tutoring to help you excel in your studies.",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
    category: "STEM",
    tutorsCount: 8,
    popularTopics: ["Mechanics", "Electricity", "Chemical Reactions", "Organic Chemistry"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 3,
    name: "Life Sciences",
    description: "Explore biology and related topics with our experienced life sciences tutors.",
    image: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8",
    category: "STEM",
    tutorsCount: 6,
    popularTopics: ["Cell Biology", "Genetics", "Human Physiology", "Ecology"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 4,
    name: "English",
    description: "Improve your language skills, essay writing, and literature analysis.",
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d",
    category: "Languages",
    tutorsCount: 10,
    popularTopics: ["Grammar", "Essay Writing", "Literature", "Comprehension"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 5,
    name: "Afrikaans",
    description: "Master Afrikaans language skills with our dedicated language tutors.",
    image: "https://images.unsplash.com/photo-1544306094-e2dcf9479da3",
    category: "Languages",
    tutorsCount: 7,
    popularTopics: ["Grammar", "Comprehension", "Literature", "Oral Skills"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 6,
    name: "Accounting",
    description: "Learn accounting principles, financial statements, and business calculations.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
    category: "Commerce",
    tutorsCount: 9,
    popularTopics: ["Financial Statements", "Cash Flow", "Inventory Valuation", "Companies"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 7,
    name: "Economics",
    description: "Understand economic principles, market dynamics, and financial systems.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
    category: "Commerce",
    tutorsCount: 8,
    popularTopics: ["Microeconomics", "Macroeconomics", "Economic Development", "Inflation"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 8,
    name: "Business Studies",
    description: "Master business concepts, entrepreneurship, and management principles.",
    image: "https://media.geeksforgeeks.org/wp-content/uploads/20230613172545/Commerce-Landing-page-copy.webp",
    category: "Commerce",
    tutorsCount: 7,
    popularTopics: ["Entrepreneurship", "Business Ventures", "Business Roles", "Operations"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 9,
    name: "Geography",
    description: "Explore physical and human geography with our expert tutors.",
    image: "https://images.unsplash.com/photo-1519500099198-fd81846bc57f",
    category: "Humanities",
    tutorsCount: 5,
    popularTopics: ["Climate", "Geomorphology", "Population", "Economic Geography"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 10,
    name: "History",
    description: "Understand historical events, their causes, and their impact on society.",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1",
    category: "Humanities",
    tutorsCount: 4,
    popularTopics: ["South African History", "World History", "Cold War", "Civil Rights"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 11,
    name: "Computer Applications Technology",
    description: "Learn essential computer skills, software applications, and information systems.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
    category: "Technology",
    tutorsCount: 6,
    popularTopics: ["MS Office", "HTML", "Database Design", "System Technologies"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
  {
    id: 12,
    name: "Tourism",
    description: "Explore the tourism industry, destinations, and customer service principles.",
    image: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d",
    category: "Humanities",
    tutorsCount: 3,
    popularTopics: ["Tourism Attractions", "Customer Service", "Domestic Tourism", "Foreign Exchange"],
    difficulty: ["Grade 10", "Grade 11", "Grade 12"],
  },
]

// Categories for filtering
const categories = ["All", "STEM", "Languages", "Commerce", "Humanities", "Technology"]

const Subjects = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [visibleSubjects, setVisibleSubjects] = useState(8)
  const [loading, setLoading] = useState(true)

  // Fetch subjects from API
  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/content/subjects')
      if (response.ok) {
        const data = await response.json()
        // Normalize subject data to ensure array fields are arrays
        const normalized = Array.isArray(data)
          ? data.map((s) => ({
              ...s,
              popularTopics: Array.isArray(s?.popularTopics) ? s.popularTopics : [],
              difficulty: Array.isArray(s?.difficulty) ? s.difficulty : [],
            }))
          : []
        setSubjects(normalized)
      } else {
        // Fallback to default subjects if API fails
        setSubjects(defaultSubjectData)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      // Set fallback content
      setSubjects(defaultSubjectData)
    } finally {
      setLoading(false)
    }
  }

  // Filter subjects based on search term and category
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || subject.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Load more subjects
  const handleLoadMore = () => {
    setVisibleSubjects((prev) => Math.min(prev + 4, filteredSubjects.length))
  }

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
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Explore Our Subjects</h2>
          <p className="text-xl text-blue-700/70 max-w-3xl mx-auto">
            Find expert tutors for a wide range of academic subjects to help you excel in your studies
          </p>
        </motion.div>

        {/* Search and Filter */}
        <div className="mb-10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={18} />
              <Input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 flex-nowrap md:flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap ${
                    selectedCategory === category
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-blue-200 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {category === "All" && <Filter size={16} className="mr-1" />}
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredSubjects.slice(0, visibleSubjects).map((subject) => (
              <motion.div
                key={subject.id}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={subject.image || "/placeholder.svg"}
                      alt={subject.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-blue-600 text-white hover:bg-blue-700">{subject.category}</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-0">
                        <Users size={14} className="mr-1" /> {subject.tutorsCount} tutors
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-xl text-blue-900 mb-2 group-hover:text-blue-700 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{subject.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {subject.popularTopics.slice(0, 3).map((topic, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs"
                        >
                          {topic}
                        </Badge>
                      ))}
                      {subject.popularTopics.length > 3 && (
                        <Badge variant="outline" className="text-blue-600 text-xs">
                          +{subject.popularTopics.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <Award size={16} className="mr-1 text-blue-500" />
                        <span>{subject.difficulty.join(", ")}</span>
                      </div>

                      <Link to={`/tutors?subject=${subject.name}`}>
                        <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium">
                          Find tutors <ChevronRight size={16} className="ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100 max-w-2xl mx-auto">
            <BookOpen className="w-16 h-16 mx-auto text-blue-300" />
            <p className="text-2xl font-semibold text-blue-900 mt-4">No subjects found</p>
            <p className="text-blue-700/70 mt-2 max-w-md mx-auto">
              We couldn't find any subjects matching your search criteria. Please try different keywords or categories.
            </p>
            <Button
              className="mt-6 bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("All")
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Load More Button */}
        {filteredSubjects.length > visibleSubjects && (
          <div className="text-center mt-12">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            >
              <Clock className="mr-2 h-4 w-4" />
              Load More Subjects
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center bg-blue-50 rounded-2xl p-8 border border-blue-100"
        >
          <h3 className="text-2xl font-bold text-blue-900 mb-4">Can't find what you're looking for?</h3>
          <p className="text-blue-700/70 max-w-2xl mx-auto mb-6">
            We offer tutoring in many more subjects. Contact us to inquire about a specific subject or to request a
            custom tutoring plan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact-us">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Contact Us</Button>
            </Link>
            <Link to="/tutors">
              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                Browse All Tutors
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Subjects