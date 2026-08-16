const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const configured = Number(config.safeFetchLimit ?? 15);
const limit = Number.isInteger(configured) && configured > 0 ? Math.min(configured, 15) : 15;

const jobs = [
  ['reading-one-page.json', 'reading-export.json'],
  ['wish-one-page.json', 'wish-export.json'],
  ['read-one-page.json', 'read-export.json']
];

for (const [inputName, outputName] of jobs) {
  const inputPath = path.join(ROOT, inputName);
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const items = Array.isArray(raw) ? raw : Array.isArray(raw.items) ? raw.items : [];
  const sliced = items.slice(0, limit);
  fs.writeFileSync(
    path.join(ROOT, outputName),
    JSON.stringify({ items: sliced, fetchLimit: limit, fetched: sliced.length }, null, 2) + '\n'
  );
  console.log(`${outputName}: ${sliced.length} items (safe limit ${limit})`);
}
