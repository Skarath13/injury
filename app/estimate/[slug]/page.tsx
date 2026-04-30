import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CalculatorPageShell from '@/components/CalculatorPageShell';
import {
  ESTIMATE_ROUTE_SLUGS,
  calculatorPathForSlug,
  parseEstimateSlug,
  routeStateForSlug,
  type CalculatorRouteSlug
} from '@/lib/calculatorRoutes';

interface EstimateSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const routeTitleBySlug: Record<CalculatorRouteSlug, string> = {
  start: 'Start Your California Auto Injury Estimate',
  'quick-facts': 'Quick Facts | California Auto Injury Estimate',
  'injury-map': 'Injury Map | California Auto Injury Estimate',
  treatment: 'Treatment | California Auto Injury Estimate',
  'work-life': 'Work and Daily Life | California Auto Injury Estimate',
  unlock: 'Unlock Estimate | California Auto Injury Estimate',
  preparing: 'Preparing Estimate | California Auto Injury Estimate',
  preview: 'Estimate Preview | California Auto Injury Estimate',
  success: 'Estimate Ready | California Auto Injury Estimate'
};

export function generateStaticParams() {
  return ESTIMATE_ROUTE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: EstimateSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = parseEstimateSlug(slug);

  if (!route) {
    return {
      title: 'Page Not Found | California Settlement Calculator',
      robots: {
        index: false,
        follow: true
      }
    };
  }

  const routeSlug = routeStateForSlug(route.slug).slug;

  return {
    title: routeTitleBySlug[routeSlug],
    description: 'Continue the California auto injury settlement calculator flow with protected step-by-step validation.',
    robots: {
      index: false,
      follow: true
    },
    alternates: {
      canonical: `https://californiasettlementcalculator.com${calculatorPathForSlug(routeSlug)}`
    },
    openGraph: {
      title: routeTitleBySlug[routeSlug],
      description: 'Continue the California auto injury settlement calculator flow with protected step-by-step validation.',
      url: `https://californiasettlementcalculator.com${calculatorPathForSlug(routeSlug)}`
    }
  };
}

export default async function EstimateSlugPage({ params }: EstimateSlugPageProps) {
  const { slug } = await params;
  const route = parseEstimateSlug(slug);

  if (!route) {
    notFound();
  }

  return <CalculatorPageShell initialEstimateSlug={route.slug} />;
}
