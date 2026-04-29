import routingConfig from '@/config/attorney-routing.v1.json';
import { normalizeCounty } from '@/lib/californiaCounties';
import { KVNamespaceLike, WorkerEnv } from '@/lib/cloudflareEnv';
import { ResponsibleAttorney } from '@/types/calculator';

interface AttorneyConfig {
  id: string;
  name: string;
  barNumber: string;
  officeLocation: string;
  active: boolean;
  approvedCounties: string[];
  disclosure?: string;
  consentCopyVersion?: string;
}

interface AttorneyRoutingConfig {
  version: string;
  disclosureCopyVersion: string;
  panelDisclosure: string;
  attorneys: AttorneyConfig[];
  countyRoutes: Record<string, string>;
}

export interface CountyRoutingResult {
  routingVersion: string;
  panelDisclosure: string;
  responsibleAttorney: ResponsibleAttorney | null;
}

const STATIC_ROUTING_CONFIG = routingConfig as AttorneyRoutingConfig;
const ROUTING_KV_KEY = 'attorney-routing:active';

async function readRoutingFromKv(kv?: KVNamespaceLike): Promise<AttorneyRoutingConfig | null> {
  if (!kv) return null;

  try {
    const value = await kv.get(ROUTING_KV_KEY, { type: 'json' });
    if (value && typeof value === 'object') {
      return value as AttorneyRoutingConfig;
    }
  } catch {
    return null;
  }

  return null;
}

function toResponsibleAttorney(
  attorney: AttorneyConfig,
  config: AttorneyRoutingConfig
): ResponsibleAttorney {
  return {
    id: attorney.id,
    name: attorney.name,
    barNumber: attorney.barNumber,
    officeLocation: attorney.officeLocation,
    disclosure: attorney.disclosure || `${attorney.name}, State Bar No. ${attorney.barNumber}, is responsible for this attorney advertisement in ${attorney.officeLocation}.`,
    consentCopyVersion: attorney.consentCopyVersion || config.disclosureCopyVersion
  };
}

export async function getCountyRouting(
  county: string,
  env?: WorkerEnv
): Promise<CountyRoutingResult> {
  const config = await readRoutingFromKv(env?.ATTORNEY_ROUTING) || STATIC_ROUTING_CONFIG;
  const normalizedCounty = normalizeCounty(county);
  const routeKey = normalizedCounty.toLowerCase();
  const attorneyId = config.countyRoutes[routeKey];
  const attorney = attorneyId
    ? config.attorneys.find((candidate) => candidate.id === attorneyId && candidate.active)
    : null;

  if (!attorney) {
    return {
      routingVersion: config.version,
      panelDisclosure: config.panelDisclosure,
      responsibleAttorney: null
    };
  }

  const approved = attorney.approvedCounties.some(
    (approvedCounty) => normalizeCounty(approvedCounty).toLowerCase() === routeKey
  );

  return {
    routingVersion: config.version,
    panelDisclosure: config.panelDisclosure,
    responsibleAttorney: approved ? toResponsibleAttorney(attorney, config) : null
  };
}

export function getStaticPanelDisclosure(): string {
  return STATIC_ROUTING_CONFIG.panelDisclosure;
}
