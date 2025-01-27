"use client"

import { motion } from "framer-motion"

export default function Footer() {
  // WhatsApp link with your phone number
  const whatsappLink = "https://wa.me/27793867427"

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-blue-900 text-white py-12"
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
        <div className="mb-8 md:mb-0">
          <h3 className="text-2xl font-bold mb-3 text-blue-200">EXCELLENCE ACADEMIA 25</h3>
          <p className="text-blue-100">Empowering Minds, One Click at a Time!</p>
        </div>
        <div className="text-center md:text-right">
          <h4 className="text-xl font-semibold mb-3 text-blue-200">Contact:</h4>
          <p className="text-blue-100">Roshan Singh</p>
          <p className="text-blue-100 mb-4">+27 79 386 7427</p>
          <div className="mt-4">
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <img 
                src="/placeholder.svg" 
                alt="WhatsApp QR Code" 
                width={100} 
                height={100} 
                className="rounded-lg shadow-lg border-2 border-blue-700"
              />
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}