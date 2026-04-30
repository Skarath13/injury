import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-auto-injury-settlement-by-county');

export default function CaliforniaAutoInjurySettlementByCountyPage() {
  return <SeoGuidePage slug="california-auto-injury-settlement-by-county" />;
}
