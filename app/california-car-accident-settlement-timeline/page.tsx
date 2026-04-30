import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-car-accident-settlement-timeline');

export default function CaliforniaCarAccidentSettlementTimelinePage() {
  return <SeoGuidePage slug="california-car-accident-settlement-timeline" />;
}
