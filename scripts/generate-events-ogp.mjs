import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distIndexPath = join(__dirname, '../dist/index.html');
const outDir = join(__dirname, '../dist/events');
const outPath = join(outDir, 'index.html');

const replacements = [
  [
    '<title>Yamanashi Developer Hub</title>',
    '<title>イベントアーカイブ - Yamanashi Developer Hub</title>',
  ],
  [
    '<meta property="og:title" content="Yamanashi Developer Hub" />',
    '<meta property="og:title" content="イベントアーカイブ - Yamanashi Developer Hub" />',
  ],
  [
    '<meta property="og:description" content="Yamanashi Developer Hubは、山梨県内で開催されるIT勉強会の情報をまとめたサイトです" />',
    '<meta property="og:description" content="2010年から現在まで、山梨県内で開催されたIT勉強会の記録を振り返れるイベントアーカイブです。" />',
  ],
  [
    '<meta property="og:url" content="https://hub.yamanashi.dev" />',
    '<meta property="og:url" content="https://hub.yamanashi.dev/events" />',
  ],
  [
    '<meta property="og:image" content="https://hub.yamanashi.dev/ogp.png" />',
    '<meta property="og:image" content="https://hub.yamanashi.dev/ogp-events.png" />',
  ],
];

let html = readFileSync(distIndexPath, 'utf-8');

for (const [from, to] of replacements) {
  if (!html.includes(from)) {
    throw new Error(`generate-events-ogp: expected tag not found in dist/index.html: ${from}`);
  }
  html = html.replace(from, to);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, html);
console.log('dist/events/index.html generated with /events-specific OGP tags');
