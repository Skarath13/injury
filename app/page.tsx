import CalculatorPageShell from '@/components/CalculatorPageShell';
import { SITE_DESCRIPTION, buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'California Car Accident Settlement Calculator',
  description: SITE_DESCRIPTION,
  path: '/',
  keywords: [
    'California car accident settlement calculator',
    'California auto injury settlement calculator',
    'car accident settlement estimate California',
    'whiplash settlement calculator California',
    'pain and suffering calculator California'
  ]
});

export default function Home() {
  return <CalculatorPageShell />;
}
