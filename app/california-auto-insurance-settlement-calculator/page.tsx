import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-auto-insurance-settlement-calculator');

export default function CaliforniaAutoInsuranceSettlementCalculatorPage() {
  return <SeoGuidePage slug="california-auto-insurance-settlement-calculator" />;
}
