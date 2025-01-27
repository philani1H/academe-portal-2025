"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

const plans = [
  {
    name: "BASIC",
    price: "R 150 p/m",
    features: [
      "Pay every month for all subjects",
      "Access to online tutoring links",
      "Access to all academic resources",
    ],
    notIncluded: ["Cheatsheet", "Career Counselling", "Psychology Wellness Services"],
  },
  {
    name: "STANDARD",
    price: "R 400 p/t",
    features: [
      "Tutoring for all subjects",
      "Access to all online links",
      "Free Cheat Sheets",
      "Access to all academic resources",
      "Career Counselling",
    ],
    notIncluded: ["Psychology Wellness Services"],
  },
  {
    name: "PREMIUM",
    price: "R 500 6/12",
    features: [
      "Tutoring for all subjects",
      "Access to all online tutoring links",
      "Free Cheat Sheets",
      "Access to all academic resources",
      "Career Counselling",
      "Psychology Wellness Services",
    ],
    notIncluded: [],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-8 rounded-lg shadow-lg ${
                plan.name === "STANDARD" 
                  ? "bg-blue-900 text-white" 
                  : "bg-white border border-gray-200"
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <p className="text-3xl font-semibold mb-6">{plan.price}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className={`w-5 h-5 mr-2 ${
                      plan.name === "STANDARD" ? "text-blue-200" : "text-green-500"
                    }`} />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-center opacity-50">
                    <X className={`w-5 h-5 mr-2 ${
                      plan.name === "STANDARD" ? "text-blue-200" : "text-red-500"
                    }`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 rounded-full font-semibold transition-colors ${
                  plan.name === "STANDARD"
                    ? "bg-white text-blue-900 hover:bg-blue-50"
                    : "bg-blue-900 text-white hover:bg-blue-800"
                }`}
              >
                Choose Plan
              </motion.button>
            </motion.div>
          ))}
        </div>
        <p className="text-center mt-8 text-lg text-gray-600">
          Private Tutoring Will Also Be Offered
        </p>
      </div>
    </section>
  )
}