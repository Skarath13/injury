import { redirect } from 'next/navigation';
import {
  appendCampaignSearchParams,
  calculatorPathForSlug,
  campaignSearchParamsFromRecord
} from '@/lib/calculatorRoutes';

interface EstimateIndexPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EstimateIndexPage({ searchParams }: EstimateIndexPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const campaignParams = campaignSearchParamsFromRecord(resolvedSearchParams);

  redirect(appendCampaignSearchParams(calculatorPathForSlug('start'), campaignParams));
}
