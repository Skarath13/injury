'use client'

import { useState, useEffect } from 'react'
import { Cookie } from 'lucide-react'

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isEUorCA, setIsEUorCA] = useState(false)

  useEffect(() => {
    // Prevent hydration mismatch by delaying until client-side
    const timeout = setTimeout(() => {
      // Check if user has already consented
      const consent = localStorage.getItem('cookieConsent')
      if (consent) return

      // Check if user is from EU or California
      checkUserLocation()
    }, 100)

    return () => clearTimeout(timeout)
  }, [])

  const checkUserLocation = async () => {
    try {
      // Use timezone to detect EU users
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const isEU = timezone.includes('Europe') || 
                   timezone.includes('London') || 
                   timezone.includes('Dublin') ||
                   timezone.includes('Lisbon')
      
      // For California detection, we'd need a proper geolocation service
      // For now, we'll show to all US users to be safe
      const isUS = timezone.includes('America')
      
      if (isEU || isUS) {
        setIsEUorCA(true)
        setShowBanner(true)
      }
    } catch (error) {
      // If detection fails, show banner to be safe
      setShowBanner(true)
    }
  }

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setShowBanner(false)
    
    // Initialize analytics only after consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      })
    }
  }

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined')
    setShowBanner(false)
    
    // Ensure analytics remains disabled
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      })
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 animate-slide-up sm:bottom-4">
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-3 shadow-lg sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Cookie className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Cookie notice</h3>
              <p className="text-xs leading-5 text-slate-600 sm:text-sm">
                We use cookies for site analytics and preferences.
                {isEUorCA && ' You can decline analytics cookies.'}
                {' '}
                <a href="/privacy" className="font-medium text-sky-700 hover:text-sky-800 underline">
                  Learn more
                </a>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={declineCookies}
              className="min-h-[40px] flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 sm:flex-none"
              aria-label="Decline cookies"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="min-h-[40px] flex-1 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 sm:flex-none"
              aria-label="Accept cookies"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
