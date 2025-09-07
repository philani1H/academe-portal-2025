"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  // Handle scroll effect with throttling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const [navLinks, setNavLinks] = useState<{ path: string; label: string }[]>([])
  const [mobileOnlyLinks, setMobileOnlyLinks] = useState<{ path: string; label: string }[]>([])

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/admin/content/navigation')
        if (!res.ok) throw new Error('Failed to load navigation')
        const data = await res.json()
        const mains = data.filter((i) => i.type === 'main').map(({ path, label }) => ({ path, label }))
        const mobile = data.filter((i) => i.type === 'mobile').map(({ path, label }) => ({ path, label }))
        setNavLinks(mains)
        setMobileOnlyLinks(mobile)
      } catch (e) {
        setNavLinks([])
        setMobileOnlyLinks([])
      }
    }
    fetchNavigation()
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <nav
      className={`backdrop-blur-lg bg-gradient-to-r from-blue-900/85 to-blue-800/85 text-white border-b border-white/10 sticky top-0 z-50 transition-all duration-500 ${
        isScrolled ? "shadow-xl" : ""
      }`}
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center group" aria-label="Excellence Akademie Home">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:to-blue-300 transition-all duration-300">
                Excellence Akademie
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 mx-1 ${
                  isActive(link.path)
                    ? "bg-white/20 text-white shadow-md backdrop-blur-md"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
                aria-current={isActive(link.path) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Tablet Navigation - Condensed Menu */}
          <div className="hidden md:flex lg:hidden items-center">
            {/* Main links on tablet - limited to first 3 to prevent overlap */}
            <div className="flex space-x-1">
              {navLinks.slice(0, 3).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? "bg-white/20 text-white shadow-md backdrop-blur-md"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-current={isActive(link.path) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* More dropdown for tablet */}
            <div className="relative ml-1 group">
              <button
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center"
                aria-expanded="false"
                aria-haspopup="true"
                aria-label="More navigation options"
              >
                More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className="absolute right-0 mt-2 w-56 bg-blue-900/95 backdrop-blur-xl rounded-md shadow-lg py-1 z-50 hidden group-hover:block border border-white/10"
                role="menu"
              >
                {navLinks
                  .slice(3)
                  .concat(mobileOnlyLinks)
                  .map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-4 py-2 text-sm ${
                        isActive(link.path)
                          ? "bg-white/20 text-white"
                          : "text-blue-100 hover:bg-white/10 hover:text-white"
                      }`}
                      aria-current={isActive(link.path) ? "page" : undefined}
                      role="menuitem"
                    >
                      {link.label}
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - fixed height and proper spacing */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "block" : "hidden"}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-900/90 backdrop-blur-xl border-t border-white/10">
          {navLinks.concat(mobileOnlyLinks).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.path) ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
              aria-current={isActive(link.path) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
