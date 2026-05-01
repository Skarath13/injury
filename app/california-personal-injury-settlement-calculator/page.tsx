import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-personal-injury-settlement-calculator');

export default function CaliforniaPersonalInjurySettlementCalculatorPage() {
  return <SeoGuidePage slug="california-personal-injury-settlement-calculator" />;
}
