'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, SlidersHorizontal, X } from 'lucide-react'
import {
  createDefaultPrivacyChoices,
  createPrivacyChoiceSnapshot,
  PrivacyChoices,
  PrivacyChoiceSnapshot,
  PRIVACY_CHOICES_STORAGE_KEY,
  readBrowserPrivacyChoices,
  writeBrowserPrivacyChoices
} from '@/lib/privacyChoices'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
    __metaPixelInitialized?: boolean
  }

  interface Navigator {
    globalPrivacyControl?: boolean
  }
}

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

function hasStoredChoices() {
  if (typeof window === 'undefined') return false

  try {
    if (typeof window.localStorage?.getItem !== 'function') return false
    return Boolean(window.localStorage.getItem(PRIVACY_CHOICES_STORAGE_KEY))
  } catch {
    return false
  }
}

function appendScript(id: string, src: string) {
  if (typeof document === 'undefined' || document.getElementById(id)) return

  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function ensureGoogleTag(tagId: string) {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtagShim(...args: unknown[]) {
    window.dataLayer?.push(args)
  }

  appendScript('google-tag-manager', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`)
  window.gtag('js', new Date())
}

function applyGoogleConsent(snapshot: PrivacyChoiceSnapshot) {
  const shouldLoadGoogle = Boolean((snapshot.effectiveAnalytics && gaMeasurementId) || (snapshot.effectiveMarketing && googleAdsId))
  const bootstrapId = gaMeasurementId || googleAdsId

  if (shouldLoadGoogle && bootstrapId) {
    ensureGoogleTag(bootstrapId)
  }

  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: snapshot.effectiveAnalytics ? 'granted' : 'denied',
      ad_storage: snapshot.effectiveMarketing ? 'granted' : 'denied',
      ad_user_data: snapshot.effectiveMarketing ? 'granted' : 'denied',
      ad_personalization: snapshot.effectiveMarketing ? 'granted' : 'denied'
    })

    if (snapshot.effectiveAnalytics && gaMeasurementId) {
      window.gtag('config', gaMeasurementId, { anonymize_ip: true })
    }

    if (snapshot.effectiveMarketing && googleAdsId) {
      window.gtag('config', googleAdsId)
    }
  }
}

function applyMetaPixel(snapshot: PrivacyChoiceSnapshot) {
  if (!snapshot.effectiveMarketing || !metaPixelId) return

  if (!window.fbq) {
    const fbq = function fbqShim(...args: unknown[]) {
      ;(fbq as typeof fbq & { queue?: unknown[] }).queue = (fbq as typeof fbq & { queue?: unknown[] }).queue || []
      ;(fbq as typeof fbq & { queue?: unknown[] }).queue?.push(args)
    }
    window.fbq = fbq
    window._fbq = fbq
    appendScript('meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js')
  }

  if (!window.__metaPixelInitialized) {
    window.fbq('init', metaPixelId)
    window.__metaPixelInitialized = true
  }

  window.fbq('track', 'PageView')
}

export default function PrivacyChoicesManager() {
  const [snapshot, setSnapshot] = useState<PrivacyChoiceSnapshot>(() => (
    createPrivacyChoiceSnapshot(createDefaultPrivacyChoices(), false)
  ))
  const [showNotice, setShowNotice] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const trackingConfigured = useMemo(
    () => Boolean(gaMeasurementId || googleAdsId || metaPixelId),
    []
  )

  useEffect(() => {
    const stored = hasStoredChoices()
    const nextSnapshot = readBrowserPrivacyChoices()
    setSnapshot(nextSnapshot)
    setShowNotice(!stored)
  }, [])

  useEffect(() => {
    applyGoogleConsent(snapshot)
    applyMetaPixel(snapshot)
  }, [snapshot])

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    const openPanel = () => {
      setIsOpen(true)
      setShowNotice(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleHash = () => {
      if (window.location.hash === '#privacy-choices') {
        openPanel()
      }
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest('a[href="#privacy-choices"]')
        : null
      if (!target) return

      event.preventDefault()
      openPanel()
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('hashchange', handleHash)
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  const saveChoices = (choices: PrivacyChoices) => {
    const nextChoices = {
      ...choices,
      updatedAt: new Date().toISOString()
    }
    writeBrowserPrivacyChoices(nextChoices)
    setSnapshot(createPrivacyChoiceSnapshot(nextChoices, snapshot.gpcEnabled))
    setShowNotice(false)
  }

  const keepEssentialOnly = () => {
    saveChoices({
      ...createDefaultPrivacyChoices(),
      updatedAt: new Date().toISOString()
    })
    setIsOpen(false)
  }

  const allowAnalytics = () => {
    saveChoices({
      version: snapshot.version,
      analytics: true,
      marketing: false,
      updatedAt: new Date().toISOString()
    })
    setIsOpen(false)
  }

  const allowAll = () => {
    saveChoices({
      version: snapshot.version,
      analytics: true,
      marketing: !snapshot.gpcEnabled,
      updatedAt: new Date().toISOString()
    })
    setIsOpen(false)
  }

  const updateDraftChoice = (key: 'analytics' | 'marketing', value: boolean) => {
    const nextChoices = {
      version: snapshot.version,
      analytics: key === 'analytics' ? value : snapshot.analytics,
      marketing: key === 'marketing' ? value : snapshot.marketing,
      updatedAt: new Date().toISOString()
    }
    setSnapshot(createPrivacyChoiceSnapshot(nextChoices, snapshot.gpcEnabled))
  }

  const saveCustomChoices = () => {
    saveChoices({
      version: snapshot.version,
      analytics: snapshot.analytics,
      marketing: snapshot.gpcEnabled ? false : snapshot.marketing,
      updatedAt: new Date().toISOString()
    })
    setIsOpen(false)
  }

  return (
    <>
      <span id="privacy-choices" className="sr-only" aria-hidden="true" />

      {showNotice && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:bottom-4 sm:px-4 sm:pb-0 sm:pt-0 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[min(28rem,calc(100vw-3rem))] lg:px-0">
          <div className="mx-auto max-w-4xl rounded-t-lg border border-slate-200 bg-white p-3 shadow-lg sm:rounded-lg sm:p-4 lg:max-w-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch lg:justify-start">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Privacy choices</h3>
                  <p className="text-xs leading-5 text-slate-600 sm:text-sm">
                    Essential cookies are always on. Analytics and marketing pixels stay off unless you allow them.
                    {snapshot.gpcHonored && ' Your browser privacy signal is honored.'}
                  </p>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center lg:grid lg:grid-cols-3">
                <button
                  type="button"
                  onClick={keepEssentialOnly}
                  className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 sm:flex-none"
                >
                  Essentials only
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                >
                  Manage
                </button>
                <button
                  type="button"
                  onClick={allowAnalytics}
                  className="col-span-2 min-h-[44px] rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 sm:col-span-1 sm:flex-none"
                >
                  Allow analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex min-h-[100dvh] items-end overflow-y-auto overscroll-contain bg-slate-950/40 px-3 pb-[env(safe-area-inset-bottom)] pt-6 sm:items-center sm:justify-center sm:p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false)
            }
          }}
        >
          <div
            className="flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] w-full max-w-lg flex-col overflow-hidden rounded-t-lg bg-white shadow-xl sm:max-h-[min(720px,calc(100dvh-2rem))] sm:rounded-lg lg:max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-choices-title"
          >
            <div className="flex flex-none items-start justify-between gap-4 border-b border-slate-200 p-4">
              <div>
                <h2 id="privacy-choices-title" className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <SlidersHorizontal className="h-5 w-5 text-sky-700" />
                  Your Privacy Choices
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  Choose whether this site may use analytics and marketing pixels. Essential security and session cookies cannot be turned off here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close privacy choices"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch]">
              {snapshot.gpcHonored && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-900">
                  Global Privacy Control is enabled in your browser, so marketing and sale/share pixels are disabled.
                </div>
              )}

              <label className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Analytics</span>
                  <span className="block text-xs leading-5 text-slate-600">
                    Helps measure site usage without enabling advertising pixels.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={snapshot.analytics}
                  onChange={(event) => updateDraftChoice('analytics', event.target.checked)}
                  className="mt-0.5 h-6 w-6 flex-none rounded border-slate-300 text-sky-700 focus:ring-sky-700"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Marketing pixels</span>
                  <span className="block text-xs leading-5 text-slate-600">
                    Allows ad measurement or retargeting pixels, unless your browser privacy signal opts out.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={snapshot.marketing && !snapshot.gpcEnabled}
                  disabled={snapshot.gpcEnabled}
                  onChange={(event) => updateDraftChoice('marketing', event.target.checked)}
                  className="mt-0.5 h-6 w-6 flex-none rounded border-slate-300 text-sky-700 focus:ring-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              {!trackingConfigured && (
                <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  No analytics or marketing pixel environment variables are currently configured.
                </p>
              )}
            </div>

            <div className="flex flex-none flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4">
              <button
                type="button"
                onClick={keepEssentialOnly}
                className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
              >
                Essentials only
              </button>
              <button
                type="button"
                onClick={saveCustomChoices}
                className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Save choices
              </button>
              <button
                type="button"
                onClick={allowAll}
                disabled={snapshot.gpcEnabled}
                className="min-h-[44px] rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Allow all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
