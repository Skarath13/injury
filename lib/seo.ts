import type { Metadata } from 'next';

export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://californiasettlementcalculator.com'
).replace(/\/$/, '');

export const SITE_NAME = 'California Settlement Calculator';
export const SITE_LEGAL_NAME = 'California Auto Injury Settlement Calculator';
export const SITE_DESCRIPTION =
  'Use a California car accident settlement calculator to build an educational auto injury claim profile and unlock a protected settlement estimate.';
export const SEO_LAST_REVIEWED = '2026-04-30';
export const SEO_LAST_MODIFIED = new Date('2026-04-30T12:00:00.000Z');
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '';

export interface SeoImageAsset {
  url: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  caption: string;
  pagePath: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export const DEFAULT_OPEN_GRAPH_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'California car accident settlement calculator estimate preview',
  title: 'California car accident settlement calculator preview',
  caption: 'Educational California auto injury settlement estimate preview',
  pagePath: '/'
} as const satisfies SeoImageAsset;

export const DEFAULT_TWITTER_IMAGE = DEFAULT_OPEN_GRAPH_IMAGE.url;

export const IMAGE_ASSETS: SeoImageAsset[] = [
  DEFAULT_OPEN_GRAPH_IMAGE,
  {
    url: '/marketing/settlement-hero.webp',
    width: 1080,
    height: 1920,
    alt: 'California auto accident claimant reviewing an estimate on a phone near a parked car',
    title: 'California auto injury estimate on a phone',
    caption: 'A California auto accident claimant reviews an educational settlement estimate.',
    pagePath: '/'
  },
  {
    url: '/marketing/settlement-trust.webp',
    width: 1080,
    height: 1920,
    alt: 'Young woman with a neck brace reviewing her settlement on a phone at a kitchen table',
    title: 'Auto injury claimant reviewing settlement estimate',
    caption: 'An injured claimant reviews California auto injury settlement factors at home.',
    pagePath: '/'
  },
  {
    url: '/vehicle-damage/light.png',
    width: 512,
    height: 512,
    alt: 'Light vehicle damage illustration for a car accident settlement calculator',
    title: 'Light vehicle damage',
    caption: 'Light vehicle damage context for an educational settlement estimate.',
    pagePath: '/'
  },
  {
    url: '/vehicle-damage/visible.png',
    width: 512,
    height: 512,
    alt: 'Visible vehicle damage illustration for a car accident settlement calculator',
    title: 'Visible vehicle damage',
    caption: 'Visible vehicle damage context for a California car accident claim profile.',
    pagePath: '/'
  },
  {
    url: '/vehicle-damage/major.png',
    width: 512,
    height: 512,
    alt: 'Major vehicle damage illustration for a car accident settlement calculator',
    title: 'Major vehicle damage',
    caption: 'Major vehicle damage context for a California auto injury estimate.',
    pagePath: '/'
  },
  {
    url: '/vehicle-damage/extreme.png',
    width: 512,
    height: 512,
    alt: 'Extreme vehicle damage illustration for a car accident settlement calculator',
    title: 'Extreme vehicle damage',
    caption: 'Extreme vehicle damage context for a California auto injury claim profile.',
    pagePath: '/'
  }
];

export const HOME_FAQS: FaqItem[] = [
  {
    question: 'How accurate is a California car accident settlement calculator?',
    answer:
      'A calculator can organize the factors that usually affect value, but it cannot guarantee an outcome. Actual settlements depend on liability, evidence, treatment history, injury severity, insurance coverage, liens, venue, deadlines, and negotiation.'
  },
  {
    question: 'What factors affect a California auto injury settlement?',
    answer:
      'Common factors include injury severity, treatment type and duration, medical specials, wage loss, daily-life disruption, vehicle impact, comparative fault, accident county, insurance context, and whether an attorney or lienholder is involved.'
  },
  {
    question: 'Does California comparative fault reduce a settlement?',
    answer:
      'Yes. California uses comparative fault principles, so an injured person may see a recovery reduced by their share of fault. The calculator asks about reported fault to keep the estimate grounded.'
  },
  {
    question: 'Is this calculator legal advice?',
    answer:
      'No. This calculator is an educational tool, not a law firm, attorney referral service, or substitute for legal advice. Deadlines can apply quickly, and case-specific questions should be reviewed by a qualified professional.'
  }
];

export const PUBLIC_INDEXABLE_ROUTES = [
  {
    path: '/',
    title: 'California Car Accident Settlement Calculator',
    description: SITE_DESCRIPTION,
    priority: 1,
    changeFrequency: 'weekly' as const
  },
  {
    path: '/about',
    title: 'About Our California Auto Injury Calculator',
    description: 'Learn how the California auto injury settlement calculator builds educational case profiles and estimate ranges.',
    priority: 0.55,
    changeFrequency: 'monthly' as const
  },
  {
    path: '/contact',
    title: 'Contact California Settlement Calculator',
    description: 'Contact the California auto injury settlement calculator team for calculator questions, privacy requests, or feedback.',
    priority: 0.35,
    changeFrequency: 'yearly' as const
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'Privacy policy for the California auto injury settlement calculator.',
    priority: 0.25,
    changeFrequency: 'yearly' as const
  },
  {
    path: '/terms',
    title: 'Terms of Use',
    description: 'Terms of use for the California auto injury settlement calculator.',
    priority: 0.25,
    changeFrequency: 'yearly' as const
  }
];

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
}

export function buildPageTitle(title: string): string {
  return title.includes(SITE_NAME) || title.includes(SITE_LEGAL_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
  image = DEFAULT_OPEN_GRAPH_IMAGE,
  type = 'website'
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  image?: SeoImageAsset;
  type?: 'website' | 'article';
}): Metadata {
  const fullTitle = buildPageTitle(title);
  const canonical = absoluteUrl(path);
  const robots = {
    index: !noIndex,
    follow: true,
    googleBot: {
      index: !noIndex,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1
    }
  };

  return {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots,
    alternates: {
      canonical
    },
    openGraph: {
      type,
      locale: 'en_US',
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: image.url,
          width: image.width,
          height: image.height,
          alt: image.alt
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.url],
      creator: '@CAInjuryCalc'
    }
  };
}

export function createOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: SITE_ORIGIN,
    logo: absoluteUrl('/logo.png')
  };
}

export function createWebApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_LEGAL_NAME,
    alternateName: 'California Car Accident Settlement Calculator',
    description: SITE_DESCRIPTION,
    url: SITE_ORIGIN,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Settlement calculator',
    operatingSystem: 'Web browser',
    image: absoluteUrl(DEFAULT_OPEN_GRAPH_IMAGE.url),
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'California auto accident claimants'
    },
    serviceArea: {
      '@type': 'State',
      name: 'California'
    },
    featureList: [
      'California car accident settlement estimate',
      'Injury severity and treatment factor review',
      'Medical specials estimate context',
      'Comparative fault context',
      'County venue context',
      'Educational settlement range'
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };
}

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function createFaqJsonLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function createImageObjectJsonLd(image: SeoImageAsset) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: absoluteUrl(image.url),
    url: absoluteUrl(image.url),
    name: image.title,
    caption: image.caption,
    description: image.alt,
    width: image.width,
    height: image.height,
    representativeOfPage: image.url === DEFAULT_OPEN_GRAPH_IMAGE.url
  };
}

export function createArticleJsonLd({
  title,
  description,
  path,
  dateModified = SEO_LAST_REVIEWED,
  image = DEFAULT_OPEN_GRAPH_IMAGE
}: {
  title: string;
  description: string;
  path: string;
  dateModified?: string;
  image?: SeoImageAsset;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: absoluteUrl(image.url),
    mainEntityOfPage: absoluteUrl(path),
    datePublished: SEO_LAST_REVIEWED,
    dateModified,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png')
      }
    }
  };
}
