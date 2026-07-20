import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE_URL = 'https://hub.yamanashi.dev';
// src/main.tsx の START_YEAR と一致させること(イベント一覧の最古年)
const START_YEAR = 2010;
const GROUPS_API_URL = 'https://api.event.yamanashi.dev/groups?fields=key';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/sitemap.xml');

async function fetchGroupKeys() {
  try {
    const res = await fetch(GROUPS_API_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const groups = await res.json();
    return groups.map((group) => group.key).filter(Boolean);
  } catch (err) {
    console.warn(`sitemap.xml: groups API unavailable, group URLs omitted (${err.message})`);
    return [];
  }
}

const currentYear = new Date().getFullYear();
const paths = ['/', '/guide', '/events'];
for (let year = START_YEAR; year <= currentYear; year++) {
  paths.push(`/events/${year}`);
}
for (const key of await fetchGroupKeys()) {
  paths.push(`/groups/${encodeURIComponent(key)}`);
}

const urlEntries = paths
  .map((path) => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n  </url>`)
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

writeFileSync(outPath, xml);
console.log(`sitemap.xml generated: ${paths.length} URLs`);
