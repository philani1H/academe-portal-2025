"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

const features = [
  "Comprehensive Curriculum",
  "Expert Tutors",
  "Cost-Effective",
  "Better Focus",
  "Technology Integration",
  "Global Access",
]

const Features = () => {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 p-6 rounded-lg flex items-start space-x-4"
            >
              <CheckCircle className="text-blue-900 w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">{feature}</h3>
                <p className="text-gray-600">
                  {getFeatureDescription(feature)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const getFeatureDescription = (feature: string): string => {
  const descriptions: Record<string, string> = {
    "Comprehensive Curriculum": "Structured learning paths covering all essential topics and concepts.",
    "Expert Tutors": "Learn from experienced and qualified tutors in your field.",
    "Cost-Effective": "Quality education at competitive rates with flexible pricing options.",
    "Better Focus": "Personalized attention and customized learning approaches for each student.",
    "Technology Integration": "Modern learning tools and platforms for enhanced educational experience.",
    "Global Access": "Connect with tutors and learn from anywhere in the world.",
  };
  
  return descriptions[feature] || "";
};

export default Features;