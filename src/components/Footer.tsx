"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function Footer() {
  // WhatsApp link with your phone number
  const whatsappLink = "https://wa.me/27793867427"

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-blue-600 text-white py-8"
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
        <div className="mb-4 md:mb-0">
          <h3 className="text-xl font-bold mb-2">EXCELLENCE ACADEMIA 25</h3>
          <p>Empowering Minds, One Click at a Time!</p>
        </div>
        <div className="text-center md:text-right">
          <h4 className="text-lg font-semibold mb-2">Contact:</h4>
          <p>Roshan Singh</p>
          <p>+27 79 386 7427</p>
          <div className="mt-4">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Image 
                src="/placeholder.svg" 
                alt="WhatsApp QR Code" 
                width={100} 
                height={100} 
                className="inline-block hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}