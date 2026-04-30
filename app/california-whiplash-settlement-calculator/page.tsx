import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-whiplash-settlement-calculator');

export default function CaliforniaWhiplashSettlementCalculatorPage() {
  return <SeoGuidePage slug="california-whiplash-settlement-calculator" />;
}
