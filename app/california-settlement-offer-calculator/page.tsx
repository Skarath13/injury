import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-settlement-offer-calculator');

export default function CaliforniaSettlementOfferCalculatorPage() {
  return <SeoGuidePage slug="california-settlement-offer-calculator" />;
}
