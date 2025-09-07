"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faTwitter, faInstagram, faWhatsapp, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";  // Import useAuth hook

export default function Footer() {
  const [footerContent, setFooterContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();  // Get user from auth context

  // Default content (fallback)
  const defaultFooterContent = {
    companyName: "EXCELLENCE Akademie 25",
    tagline: "Empowering Minds, One Click at a Time!",
    contactPhone: "+27 79 386 7427",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    contactPerson: "Roshan Singh",
    whatsappLink: "https://wa.me/27793867427",
    socialLinks: {
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      instagram: "https://www.instagram.com/excellence.academia25?igsh=eHAxMjJ0ZGVzbzk1",
      whatsapp: "https://wa.me/27793867427",
      tiktok: "https://www.tiktok.com/@excellence.academia25?_t=ZM-8tahfNmyA3a&_r=1"
    },
    quickLinks: [
      { path: "/about-us", label: "About Us" },
      { path: "/pricing", label: "Admissions" },
      { path: "/subjects", label: "Programs" },
      { path: "/university-application", label: "University Application" }
    ],
    resourceLinks: [
      { path: "/student-login", label: "Student Portal" },
      { path: "/tutor-login", label: "Tutor Portal" },
      { path: "/admin-login", label: "Admin Portal" },
      { path: "/exam-rewrite", label: "Exam Rewrite" },
      { path: "/become-tutor", label: "Become a Tutor" },
      { path: "/testimonials", label: "Testimonials" }
    ],
    copyrightText: "© 2025 Excellence Academia. All rights reserved."
  };

  // Fetch footer content from API
  useEffect(() => {
    fetchFooterContent();
  }, []);

  const fetchFooterContent = async () => {
    try {
      const response = await fetch('/api/admin/content/footer');
      if (response.ok) {
        const data = await response.json();
        setFooterContent(data);
      } else {
        setFooterContent(defaultFooterContent);
      }
    } catch (error) {
      console.error('Error fetching footer content:', error);
      setFooterContent(defaultFooterContent);
    } finally {
      setLoading(false);
    }
  };

  const content = footerContent || defaultFooterContent;

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
              <p>Phone: {content.contactPhone}</p>
              <p>Email: {content.contactEmail}</p>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {content.quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {content.resourceLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect With Us Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-3 text-blue-200">
                {content.companyName}
              </h3>
              <p className="text-blue-100 mb-6">{content.tagline}</p>

              <h4 className="text-xl font-semibold mb-3 text-blue-200">
                Contact:
              </h4>
              <p className="text-blue-100">{content.contactPerson}</p>
              <p className="text-blue-100">{content.contactPhone}</p>
              <p className="text-blue-100 mb-6">{content.contactEmail}</p>

              <h4 className="text-xl font-semibold mb-3 text-blue-200">
                Connect With Us:
              </h4>
              {/* Social Media Links */}
              <div className="flex justify-center gap-4 mb-4">
                <a
                  href={content.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faFacebook} size="2x" />
                </a>
                <a
                  href={content.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faTwitter} size="2x" />
                </a>
                <a
                  href={content.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faInstagram} size="2x" />
                </a>
                <a
                  href={content.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faWhatsapp} size="2x" />
                </a>
                <a
                  href={content.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity text-blue-100"
                >
                  <FontAwesomeIcon icon={faTiktok} size="2x" />
                </a>
              </div>
              {/* WhatsApp QR Code */}
              <a
                href={content.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(content.whatsappLink)}`}
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
          <p>{content.copyrightText}</p>
        </div>
      </div>
    </motion.footer>
  );
}