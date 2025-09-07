'use client'

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const Subject = () => {
  const [subjects, setSubjects] = useState<string[]>([])

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/admin/content/subjects')
        if (!res.ok) throw new Error('Failed to load subjects')
        const data = await res.json()
        const names = Array.isArray(data) ? data.map((s) => s.name) : []
        setSubjects(names)
      } catch (e) {
        setSubjects([])
      }
    }
    fetchSubjects()
  }, [])

  return (
    <section id="subjects" className="py-20 bg-gray-200">
      <div className="container mx-auto">
        {/* Logo Image */}
        <div className="mb-6">
          <img 
            src="https://i.imgur.com/mrQ0rDu.png" 
            alt="Logo" 
            className="h-16 mx-auto" // Adjust size as needed
          />
        </div>

        <h2 className="text-3xl font-bold text-center mb-12">Our Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <h3 className="text-xl font-semibold mb-2">{subject}</h3>
              <p className="text-gray-600">Comprehensive curriculum and expert tutoring</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Subject;
