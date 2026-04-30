import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-car-accident-pain-and-suffering-calculator');

export default function CaliforniaPainAndSufferingCalculatorPage() {
  return <SeoGuidePage slug="california-car-accident-pain-and-suffering-calculator" />;
}
