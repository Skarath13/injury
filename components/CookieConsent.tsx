'use client'

import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isEUorCA, setIsEUorCA] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent')
    if (consent) return

    // Check if user is from EU or California
    checkUserLocation()
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Cookie Notice</h3>
              <p className="text-sm text-slate-600">
                We use cookies to analyze site usage and improve your experience. 
                {isEUorCA && ' Under GDPR and CCPA, you have the right to manage your cookie preferences.'}
                {' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                  Learn more
                </a>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={declineCookies}
              className="flex-1 sm:flex-none px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
              aria-label="Decline cookies"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Accept cookies"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}