const CACHE = new Map();

function buildUrl(fileName){
  return new URL(`../data/${fileName}`, import.meta.url);
}

async function fetchJson(fileName){
  const url = buildUrl(fileName);
  if (url.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(url, 'utf-8');
    return JSON.parse(raw);
  }
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`AI command: cannot load ${fileName} (${res.status})`);
  }
  return res.json();
}

export async function loadAiCommandData(fileName){
  const key = String(fileName || '').trim();
  if (!key) throw new Error('AI command: fileName is required');
  if (CACHE.has(key)) return CACHE.get(key);
  const promise = fetchJson(key).catch((err) => {
    CACHE.delete(key);
    throw err;
  });
  CACHE.set(key, promise);
  return promise;
}

export async function loadAiCommandBundle(){
  const names = [
    'manifest-overview.json',
    'action-manifest.json',
    'target-manifest.json',
    'property-manifest.json',
    'value-manifest.json',
    'object-capabilities.json',
    'scope-rules.json',
    'clarify-rules.json',
    'color-manifest.json',
    'gradient-rules.json',
    'term-synonyms.json',
    'phrase-normalization.json',
    'term-wordforms.json',
    'common-typos.json',
    'noise-words.json',
  ];
  const values = await Promise.all(names.map((name) => loadAiCommandData(name)));
  return names.reduce((acc, name, index) => {
    acc[name] = values[index];
    return acc;
  }, {});
}

export function clearAiCommandManifestCache(){
  CACHE.clear();
}
