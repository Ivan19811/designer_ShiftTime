// core/i18n.js
// Lightweight i18n with auto language discovery.
//
// Discovery strategy:
// 1) ./i18n/manifest.json (optional)
// 2) fetch('./i18n/') and parse hrefs (works on many dev servers)
// 3) fallback to [uk,en]

const FALLBACK_LANGS = [
  { code: 'uk', name: 'Українська', file: './i18n/uk.json' },
  { code: 'en', name: 'English',     file: './i18n/en.json' }
];

let current = 'uk';
let dict = {};
let langs = FALLBACK_LANGS.slice();
const subs = new Set();

function subscribe(fn){ subs.add(fn); return () => subs.delete(fn); }
function notify(){ for (const fn of subs){ try{ fn(); }catch{} } }

function safeCode(code){
  return String(code || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
}

async function tryFetchJson(url){
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function tryFetchText(url){
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function parseDirListingForJsonFiles(html){
  // naive but effective for simple directory listings
  const out = [];
  const re = /href\s*=\s*"([^"]+\.json)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    const file = href.startsWith('http') ? href : (`./i18n/${href.split('/').pop()}`);
    const base = (href.split('/').pop() || '').replace(/\.json$/i,'');
    const code = safeCode(base);
    if (!code) continue;
    out.push({ code, file });
  }
  // unique by code
  const map = new Map();
  for (const it of out) map.set(it.code, it);
  return [...map.values()];
}

async function discoverLanguages(){
  // 1) manifest.json
  const manifest = await tryFetchJson('./i18n/manifest.json');
  if (manifest && Array.isArray(manifest.languages) && manifest.languages.length){
    const list = manifest.languages
      .map(l => ({
        code: safeCode(l.code),
        name: String(l.name || l.code || '').trim(),
        // IMPORTANT: manifest may contain bare filenames like "uk.json".
        // Normalize them to "./i18n/uk.json" so fetch works in any base path.
        file: (() => {
          const raw = String(l.file || '').trim();
          const fallback = `./i18n/${safeCode(l.code)}.json`;
          const f = raw || fallback;
          // If it's just a filename (no / and doesn't start with .), prefix ./i18n/
          if (!f.includes('/') && !f.startsWith('.')) return `./i18n/${f}`;
          return f;
        })()
      }))
      .filter(x => x.code && x.file);
    if (list.length) return list;
  }

  // 2) directory listing
  const html = await tryFetchText('./i18n/');
  if (html){
    const list = parseDirListingForJsonFiles(html);
    if (list.length) {
      // fetch meta name from each file (optional)
      const enriched = [];
      for (const item of list){
        const data = await tryFetchJson(item.file);
        const name = data?.meta?.name || item.code.toUpperCase();
        enriched.push({ code: item.code, name, file: item.file });
      }
      return enriched;
    }
  }

  // 3) fallback
  return FALLBACK_LANGS.slice();
}

async function loadLanguage(code){
  const c = safeCode(code) || 'uk';
  const entry = langs.find(l => l.code === c) || FALLBACK_LANGS.find(l => l.code === c) || FALLBACK_LANGS[0];
  const data = await tryFetchJson(entry.file);
  if (!data || typeof data !== 'object') {
    // hard fallback
    dict = {};
    current = entry.code;
    notify();
    return;
  }
  current = entry.code;
  dict = data.strings || {};
  notify();
}

function t(key, vars){
  const raw = dict[key] ?? key;
  if (!vars) return String(raw);
  return String(raw).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

function getCurrent(){ return current; }
function getLanguages(){ return langs.slice(); }

async function initI18n(preferredCode){
  langs = await discoverLanguages();
  const wanted = safeCode(preferredCode) || current;
  const exists = langs.some(l => l.code === wanted);
  await loadLanguage(exists ? wanted : (langs[0]?.code || 'uk'));
  return { current, languages: getLanguages() };
}

function applyToDom(root=document){
  // textContent
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  // titles
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });
  // aria-label
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });
  // placeholders
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
}

export const i18n = {
  init: initI18n,
  load: loadLanguage,
  t,
  getCurrent,
  getLanguages,
  applyToDom,
  subscribe
};
