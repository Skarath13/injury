import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-car-accident-settlement-factors');

export default function CaliforniaCarAccidentSettlementFactorsPage() {
  return <SeoGuidePage slug="california-car-accident-settlement-factors" />;
}
