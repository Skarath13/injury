import type { Metadata } from "next";
import "./styles.css";
import PrivacyChoicesManager from "@/components/CookieConsent";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    title: 'California Auto Injury Settlement Calculator',
    description: 'Build a California auto injury case profile and unlock an educational insurance settlement estimate after phone verification.',
    images: ['/CDA92563-FA4A-4D3E-A231-F28BDAD0D4F3.png'],
    creator: '@CAInjuryCalc',
  },
  alternates: {
    canonical: 'https://californiasettlementcalculator.com',
  },
  category: 'Legal Services',
  metadataBase: new URL('https://californiasettlementcalculator.com'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
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
  const serviceWorkerScript = process.env.NODE_ENV === 'production'
    ? `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
              console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
              console.warn('SW registration failed: ', registrationError);
            });
        });
      }
    `
    : `
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(function(registrations) {
            return Promise.all(registrations.map(function(registration) {
              return registration.unregister();
            }));
          })
          .then(function() {
            if ('caches' in window) {
              return caches.keys().then(function(keys) {
                return Promise.all(keys.map(function(key) {
                  return caches.delete(key);
                }));
              });
            }
          })
          .catch(function(error) {
            console.warn('Dev service worker cleanup failed: ', error);
          });
      }
    `;

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <TooltipProvider>
          {children}
          <PrivacyChoicesManager />
        </TooltipProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: serviceWorkerScript,
          }}
        />
      </body>
    </html>
  );
}
