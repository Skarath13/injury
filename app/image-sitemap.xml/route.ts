import {
  IMAGE_ASSETS,
  absoluteUrl
} from '@/lib/seo';

export const dynamic = 'force-static';

export function GET() {
  const urls = new Map<string, typeof IMAGE_ASSETS>();

  for (const image of IMAGE_ASSETS) {
    const pageUrl = absoluteUrl(image.pagePath);
    const images = urls.get(pageUrl) || [];
    images.push(image);
    urls.set(pageUrl, images);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${Array.from(urls.entries()).map(([pageUrl, images]) => `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
${images.map((image) => `    <image:image>
      <image:loc>${escapeXml(absoluteUrl(image.url))}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
      <image:caption>${escapeXml(image.caption)}</image:caption>
    </image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=86400, s-maxage=86400'
    }
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
