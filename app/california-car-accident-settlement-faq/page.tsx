import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-car-accident-settlement-faq');

export default function CaliforniaCarAccidentSettlementFaqPage() {
  return <SeoGuidePage slug="california-car-accident-settlement-faq" />;
}
