import type { Metadata, Viewport } from "next";
import "./styles.css";
import PrivacyChoicesManager from "@/components/CookieConsent";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CALCULATOR_DRAFT_NONE } from "@/lib/calculatorDraft";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "California Auto Injury Settlement Calculator",
  description: "Build a California auto injury case profile and unlock an educational insurance settlement estimate after phone verification.",
  keywords: "California auto injury settlement calculator, car accident settlement, personal injury calculator, California car accident lawyer, settlement estimate, auto accident compensation",
  authors: [{ name: "CA Injury Settlement Calculator" }],
  creator: "CA Injury Settlement Calculator",
  publisher: "CA Injury Settlement Calculator",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual Google Search Console verification
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://californiasettlementcalculator.com',
    siteName: 'California Auto Injury Settlement Calculator',
    title: 'California Auto Injury Settlement Calculator',
    description: 'Build a California auto injury case profile and unlock an educational insurance settlement estimate after phone verification.',
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'California Auto Injury Settlement Calculator',
    description: 'Build a California auto injury case profile and unlock an educational insurance settlement estimate after phone verification.',
    images: [DEFAULT_TWITTER_IMAGE],
    creator: '@CAInjuryCalc',
  },
  alternates: {
    canonical: 'https://californiasettlementcalculator.com',
  },
  category: 'Legal Services',
  metadataBase: new URL('https://californiasettlementcalculator.com'),
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
    'google-site-verification': 'google-site-verification-code', // Replace with actual verification code
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
