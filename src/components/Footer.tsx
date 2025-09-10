"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faTwitter, faInstagram, faWhatsapp, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";  // Import useAuth hook

export default function Footer() {
  const whatsappLink = "https://wa.me/27793867427";
  const { user } = useAuth();  // Get user from auth context

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-[#1B264F] text-white py-12"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Contact Us Section */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <div className="text-gray-300">
              <p>Phone: +27 79 386 7427</p>
              <p>Email: ExcellenceAcademia2025@gmail.com</p>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/about-us" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Admissions</Link></li>
              <li><Link to="/subjects" className="text-gray-300 hover:text-white transition-colors">Programs</Link></li>
              <li><Link to="/university-application" className="text-gray-300 hover:text-white transition-colors">University Application</Link></li>

            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/student-login" className="text-gray-300 hover:text-white transition-colors">Student Portal</Link></li>
              <li><Link to="/tutor-login" className="text-gray-300 hover:text-white transition-colors">Tutor Portal</Link></li>
              <li><Link to="/admin-login" className="text-gray-300 hover:text-white transition-colors">Admin Portal</Link></li>
              <li><Link to="/exam-rewrite" className="text-gray-300 hover:text-white transition-colors">Exam Rewrite</Link></li>
              <li><Link to="/become-tutor" className="text-gray-300 hover:text-white transition-colors">Become a Tutor</Link></li>
              <li><Link to="/testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          {/* Connect With Us Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-3 text-blue-200">
                EXCELLENCE Akademie 25
              </h3>
              <p className="text-blue-100 mb-6">Empowering Minds, One Click at a Time!</p>

              <h4 className="text-xl font-semibold mb-3 text-blue-200">
                Contact:
              </h4>
              <p className="text-blue-100">Roshan Singh</p>
              <p className="text-blue-100">+27 79 386 7427</p>
              <p className="text-blue-100 mb-6">ExcellenceAcademia2025@gmail.com</p>

              <h4 className="text-xl font-semibold mb-3 text-blue-200">
                Connect With Us:
              </h4>
              {/* Social Media Links */}
              <div className="flex justify-center gap-4 mb-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faFacebook} size="2x" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faTwitter} size="2x" />
                </a>
                <a
                  href="https://www.instagram.com/excellence.academia25?igsh=eHAxMjJ0ZGVzbzk1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faInstagram} size="2x" />
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faWhatsapp} size="2x" />
                </a>
                <a
                  href="https://www.tiktok.com/@excellence.academia25?_t=ZM-8tahfNmyA3a&_r=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faTiktok} size="2x" />
                </a>
              </div>
              {/* WhatsApp QR Code */}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(whatsappLink)}`}
                  alt="WhatsApp QR Code"
                  width={100}
                  height={100}
                  className="rounded-lg shadow-lg border-2 border-blue-700"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-300">
          <p>© 2025 Excellence Academia. All rights reserved.</p>
        </div>
      </div>
    </motion.footer>
  );
}