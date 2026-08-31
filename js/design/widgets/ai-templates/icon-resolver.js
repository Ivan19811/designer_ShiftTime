// js/design/widgets/ai-templates/icon-resolver.js
// Resolver для AI-іконок: використовує окремий manifest по всіх built-in Lucide іконках
// + підхоплює кастомні SVG-іконки з IndexedDB-галереї.

import { galEnsureSeed, galListFolders, galListItems, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';

const STOP_WORDS = new Set([
  'і','й','та','або','у','в','на','до','для','з','із','по','за','під','над','як','щоб','через','про','від','після','перед','біля',
  'the','a','an','to','for','of','in','on','with','and','or','from','by',
  'кнопка','кнопку','кнопки','logo','лого','логотип','header','шапка','іконка','іконку','іконки','icon','icons','svg',
  'left','right','top','bottom','зліва','справа','ліворуч','праворуч','вгорі','внизу',
  'small','big','large','mini','btn','button','same','style','styles','самий','самі','такий','такі','стиль','стилі',
  'будь','ласка','будьласка','please','new','новий','нова','нове','variant','варіант','mode','режим','side','position','позиція',
  'додай','добав','добавити','створи','створити','зроби','зробити','постав','підбери','підібери','встав','вставити',
  'хочу','потрібно','треба','мені','нам','цей','ця','це','ось','аби','щось','який','яка','яке','які'
]);

let _manifestPromise = null;

function normalizeText(value){
  return String(value || '')
    .toLowerCase()
    .replace(/[ʼ'`]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-яіїє0-9+\-]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value){
  const norm = normalizeText(value);
  if (!norm) return [];
  return Array.from(new Set(
    norm.split(' ')
      .map((x) => x.trim())
      .filter((x) => x && x.length >= 2 && !STOP_WORDS.has(x))
  ));
}

function buildPhraseSet(tokens){
  const out = new Set();
  const safe = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
  for (let n = 1; n <= 3; n += 1) {
    for (let i = 0; i <= safe.length - n; i += 1) {
      const phrase = safe.slice(i, i + n).join(' ').trim();
      if (phrase) out.add(phrase);
    }
  }
  return out;
}

function buildProfile(prompt){
  const raw = String(prompt || '');
  const normalized = normalizeText(raw);
  const tokens = tokenize(raw);
  const phraseSet = buildPhraseSet(tokens);
  const tokenSet = new Set(tokens);
  const explicitIconRequest = /(ікон|icon|svg)/i.test(raw);
  return { raw, normalized, tokens, tokenSet, phraseSet, explicitIconRequest };
}

function splitNameTokens(name){
  return tokenize(String(name || '').replace(/[._]/g, ' ').replace(/-/g, ' '));
}

function normalizeSvgToCurrentColor(svgText) {
  if (!svgText || typeof svgText !== 'string') return '';
  let s = svgText;
  s = s.replace(/<\?xml[^>]*>\s*/gi, '');
  s = s.replace(/<!doctype[^>]*>\s*/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>\s*/gi, '');
  s = s.replace(/\sstroke="[^"]*"/gi, ' stroke="currentColor"');
  s = s.replace(/\sfill="(?!none)(?!url\()[^"]*"/gi, ' fill="currentColor"');
  s = s.replace(/style="([\s\S]*?)"/gi, (m, css) => {
    let c = String(css || '');
    c = c.replace(/fill\s*:\s*(?!none)(?!url\()[^;\"]+/gi, 'fill:currentColor');
    c = c.replace(/stroke\s*:\s*[^;\"]+/gi, 'stroke:currentColor');
    return `style="${c}"`;
  });
  s = s.replace(/\s(width|height)="[^"]*"/gi, '');
  return s.trim();
}

async function fetchSvgText(url){
  if (!url) return '';
  try {
    const res = await fetch(String(url), { cache:'no-cache' });
    if (!res.ok) return '';
    const txt = await res.text();
    return normalizeSvgToCurrentColor(txt);
  } catch(e) {
    return '';
  }
}

async function loadManifest(){
  if (_manifestPromise) return _manifestPromise;
  _manifestPromise = fetch('assets/icons/icon-manifest.json', { cache:'no-cache' })
    .then((res) => res.ok ? res.json() : [])
    .then((json) => Array.isArray(json) ? json : [])
    .catch(() => []);
  return _manifestPromise;
}

async function loadCustomGalleryEntries(){
  try {
    await galEnsureSeed();
    const folders = await galListFolders('icons');
    const out = [];
    for (const folder of (folders || [])) {
      const fid = String(folder && folder.id || '');
      if (!fid || fid === 'root_icons' || fid.startsWith('lucide_')) continue;
      const items = await galListItems('icons', fid);
      for (const item of (items || [])) {
        const mime = String(item && item.mime || '').toLowerCase();
        const rawName = String(item && item.name || '').trim();
        if (!mime.includes('svg') && !/\.svg$/i.test(rawName)) continue;
        const url = galMakeObjectUrl(item);
        if (!url) continue;
        const cleanName = rawName.replace(/\.svg$/i, '');
        const tokens = splitNameTokens(cleanName);
        out.push({
          source: 'gallery',
          name: cleanName,
          file: '',
          url,
          category: 'custom',
          tags: tokens,
          label: rawName,
          nameAliases: Array.from(new Set([cleanName, cleanName.replace(/[-_]/g, ' '), ...tokens])),
          categoryAliases: ['кастомна іконка','власна іконка','custom icon'],
          conceptAliases: [],
          useCases: ['SVG іконка з вашої галереї'],
          priority: 260,
        });
      }
    }
    return out;
  } catch(e) {
    return [];
  }
}

function aliasScore(alias, profile){
  const a = normalizeText(alias);
  if (!a) return 0;
  let score = 0;

  if (a === profile.normalized) score = Math.max(score, 1400);
  if (profile.phraseSet.has(a)) score = Math.max(score, 980 + Math.min(120, a.length * 4));

  const full = ` ${profile.normalized} `;
  const probe = ` ${a} `;
  if (a.length >= 3 && full.includes(probe)) {
    score = Math.max(score, Math.min(820, 280 + a.length * 16));
  }

  const aliasTokens = a.split(' ').filter(Boolean);
  if (aliasTokens.length) {
    let hits = 0;
    for (const part of aliasTokens) {
      if (profile.tokenSet.has(part)) {
        hits += 1;
        continue;
      }
      for (const token of profile.tokens) {
        if (token.startsWith(part) || part.startsWith(token)) {
          hits += 1;
          break;
        }
      }
    }
    if (hits === aliasTokens.length) score = Math.max(score, 180 + hits * 90 + Math.min(80, a.length * 2));
    else if (hits > 0) score = Math.max(score, 55 + hits * 42);
  }

  return score;
}

function overlapScore(listA, listB){
  const a = Array.isArray(listA) ? listA.filter(Boolean) : [];
  const b = Array.isArray(listB) ? listB.filter(Boolean) : [];
  if (!a.length || !b.length) return 0;
  let score = 0;
  for (const x of a) {
    const nx = normalizeText(x);
    if (!nx) continue;
    for (const y of b) {
      const ny = normalizeText(y);
      if (!ny) continue;
      if (nx === ny) {
        score += 32;
        break;
      }
      if (nx.length >= 3 && (nx.includes(ny) || ny.includes(nx))) {
        score += 12;
        break;
      }
    }
  }
  return score;
}

function scoreEntry(entry, profile){
  if (!entry || !profile) return 0;

  const nameAliases = Array.isArray(entry.nameAliases) ? entry.nameAliases : [];
  const categoryAliases = Array.isArray(entry.categoryAliases) ? entry.categoryAliases : [];
  const conceptAliases = Array.isArray(entry.conceptAliases) ? entry.conceptAliases : [];
  const useCases = Array.isArray(entry.useCases) ? entry.useCases : [];
  const tags = Array.isArray(entry.tags) ? entry.tags : [];
  const nameTokens = splitNameTokens(entry.name || '');

  let score = Number(entry.priority || 0) || 0;
  let bestName = 0;
  let bestConcept = 0;
  let bestCategory = 0;
  let bestUse = 0;

  for (const alias of nameAliases) bestName = Math.max(bestName, aliasScore(alias, profile));
  for (const alias of conceptAliases) bestConcept = Math.max(bestConcept, aliasScore(alias, profile));
  for (const alias of categoryAliases) bestCategory = Math.max(bestCategory, aliasScore(alias, profile));
  for (const alias of useCases) bestUse = Math.max(bestUse, aliasScore(alias, profile));

  score += bestName;
  score += Math.round(bestConcept * 0.82);
  score += Math.round(bestUse * 0.58);
  score += Math.round(bestCategory * 0.28);
  score += overlapScore(profile.tokens, [...nameTokens, ...tags]) * 1.4;
  score += overlapScore(profile.tokens, conceptAliases) * 1.15;
  score += overlapScore(profile.tokens, useCases) * 0.8;

  if (entry.source === 'gallery') score += 28;
  if (profile.normalized && normalizeText(entry.name || '') === profile.normalized) score += 240;

  return score;
}

function normalizeManifestEntries(manifest){
  const list = Array.isArray(manifest) ? manifest : [];
  return list.map((entry) => ({
    ...entry,
    source: 'lucide',
    url: entry && entry.file ? `assets/icons/lucide/${String(entry.file)}` : '',
  })).filter((entry) => entry.name && entry.url);
}

export async function resolveAiIconFromManifest({ prompt = '', fallbackIcon = null } = {}){
  const profile = buildProfile(prompt);
  if (!profile.normalized) return null;

  const [manifest, customEntries] = await Promise.all([
    loadManifest(),
    loadCustomGalleryEntries(),
  ]);

  const builtInEntries = normalizeManifestEntries(manifest);
  const allEntries = [...(customEntries || []), ...builtInEntries];
  if (!allEntries.length) return null;

  let best = null;
  let bestScore = 0;
  for (const entry of allEntries) {
    const score = scoreEntry(entry, profile);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  const hasUsefulTokens = profile.tokens.length > 0;
  const threshold = hasUsefulTokens ? 120 : 220;
  if (!best) return null;
  if (bestScore < threshold && !profile.explicitIconRequest) return null;
  if (bestScore < 45) return null;

  const svg = await fetchSvgText(best.url);
  if (!svg) return null;

  return {
    svg,
    defaultColor: String((fallbackIcon && fallbackIcon.defaultColor) || '#ffffff'),
    __resolvedName: String(best.name || ''),
    __resolvedLabel: String(best.label || best.name || ''),
    __resolvedScore: Number(bestScore || 0),
    __resolvedSource: String(best.source || 'lucide'),
  };
}
