import type { Metadata, Viewport } from "next";
import "@/components/motion/serverLocalStorageShim";
import "./styles.css";
import PrivacyChoicesManager from "@/components/CookieConsent";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CALCULATOR_DRAFT_NONE } from "@/lib/calculatorDraft";
import {
  GOOGLE_SITE_VERIFICATION,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_NAME,
  SITE_ORIGIN,
  buildPageMetadata
} from "@/lib/seo";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'California Car Accident Settlement Calculator',
    description: SITE_DESCRIPTION,
    path: '/',
    keywords: [
      'California car accident settlement calculator',
      'California auto injury settlement calculator',
      'car accident settlement calculator California',
      'personal injury settlement estimate California',
      'auto accident compensation calculator'
    ]
  }),
  ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
  category: 'Education',
  metadataBase: new URL(SITE_ORIGIN),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Settlement Calc',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'application-name': SITE_LEGAL_NAME,
    'apple-mobile-web-app-title': SITE_NAME,
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
      data-calculator-draft={CALCULATOR_DRAFT_NONE}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <TooltipProvider>
          {children}
          <PrivacyChoicesManager />
        </TooltipProvider>
      </body>
    </html>
  );
}
