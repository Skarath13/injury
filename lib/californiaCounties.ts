export const CALIFORNIA_COUNTIES = [
  'Alameda',
  'Alpine',
  'Amador',
  'Butte',
  'Calaveras',
  'Colusa',
  'Contra Costa',
  'Del Norte',
  'El Dorado',
  'Fresno',
  'Glenn',
  'Humboldt',
  'Imperial',
  'Inyo',
  'Kern',
  'Kings',
  'Lake',
  'Lassen',
  'Los Angeles',
  'Madera',
  'Marin',
  'Mariposa',
  'Mendocino',
  'Merced',
  'Modoc',
  'Mono',
  'Monterey',
  'Napa',
  'Nevada',
  'Orange',
  'Placer',
  'Plumas',
  'Riverside',
  'Sacramento',
  'San Benito',
  'San Bernardino',
  'San Diego',
  'San Francisco',
  'San Joaquin',
  'San Luis Obispo',
  'San Mateo',
  'Santa Barbara',
  'Santa Clara',
  'Santa Cruz',
  'Shasta',
  'Sierra',
  'Siskiyou',
  'Solano',
  'Sonoma',
  'Stanislaus',
  'Sutter',
  'Tehama',
  'Trinity',
  'Tulare',
  'Tuolumne',
  'Ventura',
  'Yolo',
  'Yuba'
];

export function normalizeCounty(county: string): string {
  return county.trim().replace(/\s+county$/i, '').replace(/\s+/g, ' ');
}

export function formatCounty(county: string): string {
  const normalized = normalizeCounty(county);
  return normalized ? `${normalized} County` : '';
}

export function resolveCaliforniaCountySelection(
  county: string,
  counties: readonly string[] = CALIFORNIA_COUNTIES
): string | null {
  const normalized = normalizeCounty(county).toLowerCase();
  return counties.find((candidate) => candidate.toLowerCase() === normalized) || null;
}

export function isCaliforniaCounty(county: string): boolean {
  return Boolean(resolveCaliforniaCountySelection(county));
}

export function rankCaliforniaCountyMatches(
  query: string,
  limit = 8,
  counties: readonly string[] = CALIFORNIA_COUNTIES
): string[] {
  const normalized = normalizeCounty(query).toLowerCase();

  if (normalized.length < 2) {
    return [];
  }

  const startsWithMatches: string[] = [];
  const containsMatches: string[] = [];

  for (const county of counties) {
    const countyKey = county.toLowerCase();
    if (countyKey.startsWith(normalized)) {
      startsWithMatches.push(county);
    } else if (countyKey.includes(normalized)) {
      containsMatches.push(county);
    }
  }

  return [...startsWithMatches, ...containsMatches].slice(0, limit);
}

export function resolveCountyAutocompleteValue(
  input: string,
  counties: readonly string[] = CALIFORNIA_COUNTIES
): string | null {
  const exact = resolveCaliforniaCountySelection(input, counties);
  if (exact) return exact;

  const matches = rankCaliforniaCountyMatches(input, 8, counties);
  return matches.length === 1 ? matches[0] : null;
}
