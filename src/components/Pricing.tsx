"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, X, Star, Shield, Calendar, ChevronRight, Award } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Updated plan data with correct naming
const plans = [
  {
    id: "basic",
    name: "GRADE 12 BASIC",
    price: "R 150",
    period: "Monthly",
    features: [
      "Core subjects tutoring",
      "Basic study materials",
      "Online resources access",
      "Group tutoring sessions",
      "Weekly assessments",
    ],
    notIncluded: ["1-on-1 tutoring", "Advanced study materials", "Career guidance", "Exam techniques workshop"],
    color: "blue",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    id: "standard",
    name: "STANDARD",
    price: "R 250",
    period: "Monthly",
    popular: true,
    features: [
      "All subjects tutoring",
      "Comprehensive study guides",
      "Practice papers & solutions",
      "Monthly 1-on-1 sessions",
      "Progress tracking",
      "Exam preparation support",
    ],
    notIncluded: ["Career guidance", "Advanced exam techniques"],
    color: "indigo",
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: "R 350",
    period: "Monthly",
    features: [
      "Priority tutoring access",
      "Advanced study materials",
      "Unlimited 1-on-1 sessions",
      "Mock exam preparation",
      "Career guidance",
      "Exam techniques workshop",
      "Personal academic mentor",
    ],
    notIncluded: [],
    color: "purple",
    icon: <Award className="w-6 h-6" />,
  },
]

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [activeTab, setActiveTab] = useState("monthly")
  const [activeHash, setActiveHash] = useState("")

  // Handle hash changes for scrolling to specific plan
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        setActiveHash(hash)

        // Scroll to the plan and highlight it
        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" })
            // Add a flash effect
            element.classList.add("highlight-plan")
            setTimeout(() => {
              element.classList.remove("highlight-plan")
            }, 2000)
          }
        }, 500)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    // Run on initial load
    handleHashChange()

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  // Calculate annual price with discount
  const calculateAnnualPrice = (monthlyPrice) => {
    const priceNumber = Number.parseInt(monthlyPrice.replace("R ", ""))
    return `R ${Math.round(priceNumber * 10.2)}`
  }

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-white to-blue-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-blue-900">Investment in Your Future</h2>
            <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your educational journey</p>

            {/* Billing toggle */}
            <div className="inline-flex p-1 bg-blue-50 rounded-xl shadow-inner">
              <button
                className={`py-2 px-6 rounded-lg font-medium transition-all ${activeTab === "monthly" ? "bg-white text-blue-900 shadow-md" : "text-gray-500 hover:text-blue-700"}`}
                onClick={() => setActiveTab("monthly")}
              >
                Monthly
              </button>
              <button
                className={`py-2 px-6 rounded-lg font-medium transition-all ${activeTab === "annually" ? "bg-white text-blue-900 shadow-md" : "text-gray-500 hover:text-blue-700"}`}
                onClick={() => setActiveTab("annually")}
              >
                <span className="flex items-center gap-2">
                  Annually{" "}
                  <span className="text-xs font-bold text-green-500 bg-green-100 py-0.5 px-2 rounded-full">
                    Save 15%
                  </span>
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              id={plan.id}
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative p-1 rounded-2xl transition-all duration-500 transform hover:scale-105 ${activeHash === plan.id ? "ring-4 ring-blue-500 ring-opacity-50" : ""}`}
            >
              {/* Gradient border */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${plan.popular ? "from-blue-400 via-indigo-500 to-purple-600" : "from-gray-200 to-gray-300"} opacity-70`}
              ></div>

              <div
                className={`relative p-8 rounded-xl backdrop-blur-sm shadow-xl h-full flex flex-col ${plan.id === "standard" ? "bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 text-white" : "bg-white"}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-8 transform -translate-y-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-1 px-4 rounded-full font-semibold text-sm flex items-center gap-1 shadow-lg">
                      <Star className="w-4 h-4 fill-white" /> Most Popular
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.id === "standard" ? "bg-white/20" : `bg-blue-100`}`}>
                    {plan.icon}
                  </div>
                  <h3
                    className={`text-2xl font-bold ${plan.id === "standard" ? "text-white" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"}`}
                  >
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-8">
                  <div className="flex items-end">
                    <p className={`text-5xl font-bold ${plan.id === "standard" ? "text-white" : "text-gray-900"}`}>
                      {activeTab === "monthly" ? plan.price : calculateAnnualPrice(plan.price)}
                    </p>
                    <span className={`text-lg ml-2 mb-1 ${plan.id === "standard" ? "text-blue-200" : "text-gray-500"}`}>
                      /{activeTab === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${plan.id === "standard" ? "text-blue-200" : "text-gray-500"}`}>
                    Billed {activeTab === "monthly" ? "monthly" : "annually"}
                    {activeTab === "annually" && " (15% discount applied)"}
                  </p>
                </div>

                <ul className={`space-y-4 mb-8 flex-grow ${plan.id === "standard" ? "text-white" : ""}`}>
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check
                        className={`w-5 h-5 mr-3 mt-0.5 ${plan.id === "standard" ? "text-green-300" : "text-green-500"}`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, i) => (
                    <li key={i} className={`flex items-start ${plan.id === "standard" ? "opacity-40" : "opacity-50"}`}>
                      <X
                        className={`w-5 h-5 mr-3 mt-0.5 ${plan.id === "standard" ? "text-red-300" : "text-red-500"}`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 
                    ${
                      plan.id === "standard"
                        ? "bg-gradient-to-r from-white to-blue-100 text-blue-900 hover:from-blue-100 hover:to-white"
                        : "bg-gradient-to-r from-blue-700 to-indigo-700 text-white hover:from-blue-800 hover:to-indigo-800"
                    }`}
                >
                  Choose Plan <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="max-w-4xl mx-auto mt-12 bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="bg-blue-100 p-4 rounded-full">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Private Tutoring Available</h3>
              <p className="text-gray-600 mb-0">
                One-on-one personalized tutoring is available exclusively for registered members of Excellence Akademie
                25. Contact our education consultants for custom packages tailored to your specific needs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <AlertDialog open={selectedPlan !== null} onOpenChange={() => setSelectedPlan(null)}>
        <AlertDialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold">Subscribe to {selectedPlan?.name}</AlertDialogTitle>
              <p className="text-blue-100 mt-2">
                {selectedPlan?.price}/{selectedPlan?.period.toLowerCase()} • Unlock your academic potential
              </p>
            </AlertDialogHeader>
          </div>

          <div className="p-6">
            <AlertDialogDescription className="text-gray-700">
              <div className="text-center mb-6">
                <h4 className="text-xl font-semibold mb-3 text-gray-900">Complete Your Registration</h4>
                <p className="text-gray-600 mb-6">Fill out the form below to secure your place in our program.</p>
              </div>
              <div className="flex justify-center">
                <iframe
                  src="https://forms.gle/ebjp3aUsutZni8jd9"
                  width="100%"
                  height="450px"
                  frameBorder="0"
                  className="rounded-lg shadow-sm border border-gray-200"
                  title="Subscription Form"
                ></iframe>
              </div>
            </AlertDialogDescription>
          </div>

          <AlertDialogFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 mt-0">Close</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
              <a
                href="https://wa.me/27793867427"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.2.3-.767.966-.94 1.164-.173.199-.347.223-.646.075-.3-.15-1.267-.465-2.414-1.485-.893-.795-1.495-1.77-1.67-2.07-.173-.3-.018-.465.13-.615.134-.135.301-.345.451-.523.146-.181.194-.301.297-.501.1-.2.05-.375-.025-.524-.075-.15-.672-1.62-.922-2.216-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.453-8.413z" />
                </svg>
                Contact via WhatsApp
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        .animate-blob {
          animation: blob-bounce 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob-bounce {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .highlight-plan {
          animation: highlight-pulse 1.5s ease;
        }
        @keyframes highlight-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </section>
  )
}