import type { Metadata } from "next";
import "./styles.css";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "California Auto Injury Settlement Calculator - Free Realistic Estimates",
  description: "Free California auto injury settlement calculator based on real insurance data. Get realistic settlement estimates for car accident injuries, medical bills, and pain & suffering. No inflated promises.",
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
    url: 'https://cainjurysettlement.com',
    siteName: 'California Auto Injury Settlement Calculator',
    title: 'California Auto Injury Settlement Calculator - Free Realistic Estimates',
    description: 'Free California auto injury settlement calculator based on real insurance data. Get realistic settlement estimates for car accident injuries.',
    images: [
      {
        url: '/CDA92563-FA4A-4D3E-A231-F28BDAD0D4F3.png',
        width: 1200,
        height: 630,
        alt: 'California Auto Injury Settlement Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'California Auto Injury Settlement Calculator - Free Realistic Estimates',
    description: 'Free California auto injury settlement calculator based on real insurance data.',
    images: ['/CDA92563-FA4A-4D3E-A231-F28BDAD0D4F3.png'],
    creator: '@CAInjuryCalc',
  },
  alternates: {
    canonical: 'https://cainjurysettlement.com',
  },
  category: 'Legal Services',
  metadataBase: new URL('https://cainjurysettlement.com'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'google-site-verification': 'google-site-verification-code', // Replace with actual verification code
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e293b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}