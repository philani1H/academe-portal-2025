"use client"

import { useEffect, useRef } from "react"
import { Sparkles } from "lucide-react"

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

interface GoogleAdBannerProps {
  className?: string
  placement?: string
  adSlot?: string
  adLayoutKey?: string
  adFormat?: string
  adClient?: string
  fullWidthResponsive?: boolean
  keywords?: string[]
}

const GoogleAdBanner = ({
  className = "",
  placement = "",
  adSlot = "9721429305",
  adLayoutKey = "-fb+5w+4e-db+86",
  adFormat = "fluid",
  adClient = "ca-pub-7526161424603297",
  fullWidthResponsive = true,
  keywords = []
}: GoogleAdBannerProps) => {
  const adRef = useRef<HTMLDivElement>(null)
  const isAdLoaded = useRef(false)

  useEffect(() => {
    // Load Google AdSense script if not already loaded
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script')
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7526161424603297"
      script.async = true
      script.crossOrigin = "anonymous"
      document.head.appendChild(script)
    }

    // Only load the ad once
    if (isAdLoaded.current) return
    
    try {
      // Push the ad to Google AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      isAdLoaded.current = true
    } catch (error) {
      console.error("AdSense error:", error)
    }
  }, [])

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-60" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Main container */}
      <div className="relative bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg shadow-blue-100/50">
        <div className="p-2 sm:p-5">
          {/* Header section */}
          <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-30 animate-pulse" />
                <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-blue-900">Featured Partner</span>
                <p className="text-xs text-blue-600/70">
                  Sponsored Content
                  {keywords.length > 0 && (
                    <span className="hidden sm:inline"> • {keywords.slice(0, 3).join(", ")}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-100/80 px-3 py-1.5 rounded-full border border-blue-200/50 shadow-sm">
                Ad
              </span>
            </div>
          </div>
          
          {/* Google AdSense container */}
          <div 
            ref={adRef}
            className="relative w-full min-h-[100px] bg-white rounded-xl border border-blue-100 shadow-inner overflow-hidden"
          >
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: "100%", textAlign: "center" }}
              data-ad-format={adFormat}
              data-ad-layout-key={adLayoutKey}
              data-ad-client={adClient}
              data-ad-slot={adSlot}
              data-full-width-responsive={fullWidthResponsive}
            />
          </div>
          
          {/* Footer section */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
            <p className="text-xs text-blue-500 font-medium px-3">
              Supporting quality education
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleAdBanner
