import SeoGuidePage from '@/components/SeoGuidePage';
import { buildGuideMetadata } from '@/lib/seoGuides';

export const metadata = buildGuideMetadata('california-car-accident-medical-bills-and-liens');

export default function CaliforniaCarAccidentMedicalBillsAndLiensPage() {
  return <SeoGuidePage slug="california-car-accident-medical-bills-and-liens" />;
}
