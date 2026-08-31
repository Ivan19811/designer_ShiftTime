// js/design/widgets/gallery-widget/gallery-db.js
// IndexedDB storage for gallery: categories -> folders -> items(files)
// Items store: { id, cat, folderId, name, mime, size, createdAt, blob }

const DB_NAME = 'ShiftTimeGalleryDB';
const DB_VER  = 1;

const STORE_FOLDERS = 'folders';
const STORE_ITEMS   = 'items';

// System folders are still stored in the same IndexedDB as user folders,
// but their ids are stable and protected. Files dropped into these folders
// get systemAsset metadata so AI/runtime code can later search them.
const SYSTEM_FOLDERS = [
  { id: 'sys_images',        cat: 'images', parentId: 'root_images', name: '⭐ Системні картинки', role: 'image',         kind: 'system-images',        description: 'Постійна системна бібліотека зображень для конструктора та AI.' },
  { id: 'sys_backgrounds',   cat: 'images', parentId: 'root_images', name: '⭐ Системні фони',     role: 'background',    kind: 'system-backgrounds',   description: 'Постійні фони для секцій, шапок, блоків і сторінок.' },
  { id: 'sys_photo_gallery', cat: 'images', parentId: 'root_images', name: '📁 Фото-галерея',      role: 'photo-gallery', kind: 'photo-gallery-root',   description: 'Коренева папка для фото-галерей. Всередині створюємо папки-категорії: Сковороди, Мангали, Казани, Гравіювання, Друк, Фото відгуки тощо.' },
  { id: 'sys_logos',         cat: 'logos',  parentId: 'root_logos',  name: '⭐ Системні логотипи', role: 'logo',          kind: 'system-logos',        description: 'Постійні логотипи брендів, сайтів і шаблонів.' },
  { id: 'sys_icons',         cat: 'icons',  parentId: 'root_icons',  name: '⭐ Системні іконки',   role: 'icon',          kind: 'system-icons',        description: 'Постійні SVG/PNG іконки для кнопок, меню, карток і блоків.' }
];

const STATIC_SYSTEM_MANIFEST_PATH = 'assets/system/manifest.json';

// Project-level system folders: these files live in the ZIP/project folder,
// not in browser IndexedDB. They are listed through assets/system/manifest.json.
// Empty physical folders are also created in assets/system/... for future files.
const STATIC_SYSTEM_FOLDERS = [
  { id: 'static_sys_backgrounds', cat: 'images', parentId: 'root_images', name: '📦 Проєкт: системні фони', role: 'background', kind: 'project-backgrounds', description: 'Фони, які лежать у папках проєкту assets/system/backgrounds і їдуть разом із ZIP.' },
  { id: 'static_sys_images',      cat: 'images', parentId: 'root_images', name: '📦 Проєкт: системні картинки', role: 'image', kind: 'project-images', description: 'Картинки, які лежать у папках проєкту assets/system/images і їдуть разом із ZIP.' },
  { id: 'static_sys_logos',       cat: 'logos',  parentId: 'root_logos',  name: '📦 Проєкт: системні логотипи', role: 'logo', kind: 'project-logos', description: 'Логотипи, які лежать у папках проєкту assets/system/logos і їдуть разом із ZIP.' },
  { id: 'static_sys_icons',       cat: 'icons',  parentId: 'root_icons',  name: '📦 Проєкт: системні іконки', role: 'icon', kind: 'project-icons', description: 'Іконки, які лежать у папках проєкту assets/system/icons і їдуть разом із ZIP.' }
];

// [00956] Named asset packs remain children of their canonical project folder.
// Their metadata still has one authority: assets/system/manifest.json.
const STATIC_COLLECTION_FOLDERS = [
  {
    id: 'static_sys_images_school_01',
    cat: 'images',
    parentId: 'static_sys_images',
    name: '🏫 Школа — 01',
    role: 'image',
    kind: 'template-collection-assets',
    collectionId: 'school-01',
    description: 'Зображення колекції «Школа — 01» з описами, рейтингами та правилами повторного використання.'
  }
];


const PHOTO_GALLERY_DEFAULT_FOLDERS = [
  { id: 'pgcat_skovorody',     cat: 'images', parentId: 'sys_photo_gallery', name: 'Сковороди',      slug: 'skovorody',     physicalPath: 'assets/photo-gallery/skovorody' },
  { id: 'pgcat_mangaly',       cat: 'images', parentId: 'sys_photo_gallery', name: 'Мангали',        slug: 'mangaly',       physicalPath: 'assets/photo-gallery/mangaly' },
  { id: 'pgcat_kazany',        cat: 'images', parentId: 'sys_photo_gallery', name: 'Казани',         slug: 'kazany',        physicalPath: 'assets/photo-gallery/kazany' },
  { id: 'pgcat_engraving',     cat: 'images', parentId: 'sys_photo_gallery', name: 'Гравіювання',    slug: 'engraving',     physicalPath: 'assets/photo-gallery/engraving' },
  { id: 'pgcat_print',         cat: 'images', parentId: 'sys_photo_gallery', name: 'Друк',           slug: 'print',         physicalPath: 'assets/photo-gallery/print' },
  { id: 'pgcat_photo_reviews', cat: 'images', parentId: 'sys_photo_gallery', name: 'Фото відгуки',   slug: 'reviews',       physicalPath: 'assets/photo-gallery/photo-reviews' }
];

const SYSTEM_FOLDER_MAP = Object.fromEntries(SYSTEM_FOLDERS.map(f => [f.id, f]));
const STATIC_FOLDER_LIST = [...STATIC_SYSTEM_FOLDERS, ...STATIC_COLLECTION_FOLDERS];
const STATIC_SYSTEM_FOLDER_MAP = Object.fromEntries(STATIC_FOLDER_LIST.map(f => [f.id, f]));
const STATIC_SYSTEM_FOLDER_BY_ROLE = Object.fromEntries(STATIC_SYSTEM_FOLDERS.map(f => [f.role, f]));
const STATIC_COLLECTION_FOLDER_BY_COLLECTION_ID = Object.fromEntries(
  STATIC_COLLECTION_FOLDERS.map(f => [f.collectionId, f])
);

export function galIsSystemFolder(folderId) {
  const id = String(folderId || '');
  return !!(SYSTEM_FOLDER_MAP[id] || STATIC_SYSTEM_FOLDER_MAP[id]);
}

export function galGetSystemFolderMeta(folderId) {
  const id = String(folderId || '');
  return SYSTEM_FOLDER_MAP[id] || STATIC_SYSTEM_FOLDER_MAP[id] || null;
}

function inferMimeFromPath_(path) {
  const p = String(path || '').toLowerCase();
  if (p.endsWith('.svg')) return 'image/svg+xml';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.gif')) return 'image/gif';
  return 'image/*';
}

function pathFileName_(path) {
  const clean = String(path || '').split(/[?#]/)[0];
  return clean.split('/').filter(Boolean).pop() || clean || 'asset';
}

function typeToStaticRole_(asset) {
  const type = String(asset?.type || asset?.role || '').trim().toLowerCase();
  if (['background','bg','фон','backgrounds'].includes(type)) return 'background';
  if (['logo','логотип','logos'].includes(type)) return 'logo';
  if (['icon','іконка','icons'].includes(type)) return 'icon';
  return 'image';
}

function staticRoleToCat_(role) {
  if (role === 'logo') return 'logos';
  if (role === 'icon') return 'icons';
  return 'images';
}

function normalizeArray_(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  return Array.from(new Set(raw.map(x => String(x || '').trim()).filter(Boolean)));
}


function normalizeTerm_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[ʼ’`]/g, "'")
    .replace(/\s+/g, '-');
}

function normalizeTerms_(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(/[,+;|]/);
  return Array.from(new Set(raw.map(normalizeTerm_).filter(Boolean)));
}

function scoreMapMatch_(scores, terms = []) {
  if (!scores || typeof scores !== 'object') return { score: 0, hits: [] };
  const normalized = new Map();
  Object.entries(scores).forEach(([key, value]) => {
    const k = normalizeTerm_(key);
    const v = Number(value || 0);
    if (k && Number.isFinite(v)) normalized.set(k, Math.max(0, Math.min(10, v)));
  });
  const hits = [];
  let total = 0;
  const list = normalizeTerms_(terms);
  list.forEach(term => {
    if (!term) return;
    const score = normalized.get(term) || 0;
    if (score > 0) hits.push({ term, score });
    total += score;
  });
  const avg = list.length ? total / list.length : 0;
  return { score: avg, hits };
}

function listMatch_(assetValues, terms = [], fallbackScore = 5) {
  const values = new Set(normalizeTerms_(assetValues));
  const list = normalizeTerms_(terms);
  const hits = [];
  let total = 0;
  list.forEach(term => {
    const ok = values.has(term);
    if (ok) hits.push({ term, score: fallbackScore });
    total += ok ? fallbackScore : 0;
  });
  return { score: list.length ? total / list.length : 0, hits };
}

function firstPositive_(...matches) {
  for (const match of matches) {
    if (match && Number(match.score || 0) > 0) return match;
  }
  return { score: 0, hits: [] };
}

function clampScore_(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

export function galScoreAiAsset(asset, criteria = {}) {
  const item = asset || {};
  const wantedRole = normalizeTerm_(criteria.role || criteria.type || criteria.assetRole || '');
  const role = normalizeTerm_(item.assetRole || item.type || item.role || '');

  const themeTerms = normalizeTerms_(criteria.themes || criteria.theme);
  const styleTerms = normalizeTerms_(criteria.styles || criteria.style);
  const moodTerms = normalizeTerms_(criteria.moods || criteria.mood);
  const colorTerms = normalizeTerms_(criteria.colors || criteria.color);
  const usageTerms = normalizeTerms_(criteria.usages || criteria.usage);
  const audienceTerms = normalizeTerms_(criteria.audience || criteria.audiences);
  const premiumTerms = normalizeTerms_(criteria.premium || criteria.premiumLevel || criteria.market);
  const eraTerms = normalizeTerms_(criteria.era || criteria.eraStyle || criteria.eraStyles);

  const weights = {
    role: 14,
    theme: 30,
    usage: 18,
    style: 12,
    mood: 12,
    color: 10,
    audience: 7,
    premium: 5,
    era: 5,
    readability: 10,
    visual: 6,
    priority: 6
  };

  const parts = [];
  const add = (key, rawScore, details = {}) => {
    const weight = weights[key] || 0;
    if (!weight) return;
    const score = clampScore_(rawScore);
    parts.push({ key, score, weight, weighted: score * weight, ...details });
  };

  if (wantedRole) add('role', role === wantedRole ? 10 : 0, { wanted: wantedRole, actual: role });

  if (themeTerms.length) {
    const byScores = scoreMapMatch_(item.themeScores, themeTerms);
    const byList = listMatch_([item.primaryTheme, ...(item.themes || [])], themeTerms, 6);
    const match = byScores.score > 0 ? byScores : byList;
    add('theme', match.score, { terms: themeTerms, hits: match.hits });
  }

  if (usageTerms.length) {
    const byScores = scoreMapMatch_(item.usageScores, usageTerms);
    const byList = listMatch_(item.usage || [], usageTerms, 6);
    const match = byScores.score > 0 ? byScores : byList;
    add('usage', match.score, { terms: usageTerms, hits: match.hits });
  }

  if (styleTerms.length) {
    const match = scoreMapMatch_(item.styleScores, styleTerms);
    add('style', match.score, { terms: styleTerms, hits: match.hits });
  }

  if (moodTerms.length) {
    const match = scoreMapMatch_(item.moodScores, moodTerms);
    add('mood', match.score, { terms: moodTerms, hits: match.hits });
  }

  if (colorTerms.length) {
    const byScores = scoreMapMatch_(item.colorScores, colorTerms);
    const metrics = item.imageMetrics || {};
    const byMetrics = listMatch_(metrics.dominantColors || metrics.colors || [], colorTerms, 6);
    const match = byScores.score > 0 ? byScores : byMetrics;
    add('color', match.score, { terms: colorTerms, hits: match.hits });
  }

  if (audienceTerms.length) {
    const match = scoreMapMatch_(item.audienceScores, audienceTerms);
    add('audience', match.score, { terms: audienceTerms, hits: match.hits });
  }

  if (premiumTerms.length) {
    const match = scoreMapMatch_(item.premiumScores, premiumTerms);
    add('premium', match.score, { terms: premiumTerms, hits: match.hits });
  }

  if (eraTerms.length) {
    const match = scoreMapMatch_(item.eraStyleScores, eraTerms);
    add('era', match.score, { terms: eraTerms, hits: match.hits });
  }

  const read = item.textReadability || {};
  const textMode = normalizeTerm_(criteria.text || criteria.textMode || criteria.textColor || '');
  if (textMode) {
    if (['light','white','світлий','білий','lighttext'].includes(textMode)) add('readability', Number(read.lightText || 0), { textMode: 'lightText' });
    else if (['dark','black','темний','чорний','darktext'].includes(textMode)) add('readability', Number(read.darkText || 0), { textMode: 'darkText' });
  }

  const visual = item.visualScores || {};
  if (criteria.preferClean || criteria.clean || criteria.lowNoise) {
    const clean = Number(visual.cleanliness || 0);
    const noise = Number(visual.noise || 0);
    const complexity = Number(visual.complexity || 0);
    const score = Math.max(0, Math.min(10, (clean || 0) - (noise * 0.25) - (complexity * 0.15)));
    add('visual', score, { prefer: 'clean-low-noise' });
  }

  add('priority', Number(item.priority || 0), { reason: 'manual/general priority' });

  const weightTotal = parts.reduce((sum, p) => sum + Number(p.weight || 0), 0) || 1;
  const weightedTotal = parts.reduce((sum, p) => sum + Number(p.weighted || 0), 0);
  const score10 = weightedTotal / weightTotal;
  const score100 = Math.round(score10 * 10);
  const topReasons = parts
    .filter(p => p.score > 0)
    .sort((a,b) => (b.weighted || 0) - (a.weighted || 0))
    .slice(0, 6)
    .map(p => {
      const terms = Array.isArray(p.terms) && p.terms.length ? ` (${p.terms.join(', ')})` : '';
      return `${p.key}${terms}: ${Math.round(p.score * 10)}/100`;
    });

  return {
    score: score100,
    score10: Number(score10.toFixed(2)),
    parts,
    topReasons,
    criteria: {
      role: wantedRole,
      themes: themeTerms,
      styles: styleTerms,
      moods: moodTerms,
      colors: colorTerms,
      usages: usageTerms,
      audience: audienceTerms,
      premium: premiumTerms,
      era: eraTerms,
      textMode,
      preferClean: !!(criteria.preferClean || criteria.clean || criteria.lowNoise)
    }
  };
}

let _staticSystemManifestCache = null;

export async function galLoadStaticSystemManifest({ force = false } = {}) {
  if (_staticSystemManifestCache && !force) return _staticSystemManifestCache;
  try {
    const res = await fetch(STATIC_SYSTEM_MANIFEST_PATH, { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const assets = Array.isArray(json?.assets) ? json.assets : [];
    _staticSystemManifestCache = { ...(json || {}), assets };
  } catch (e) {
    _staticSystemManifestCache = { version: 1, assets: [], error: String(e?.message || e || '') };
  }
  return _staticSystemManifestCache;
}

function normalizeStaticAsset_(asset, index = 0) {
  if (!asset || typeof asset !== 'object') return null;
  const path = String(asset.path || asset.url || '').trim();
  if (!path) return null;
  const role = typeToStaticRole_(asset);
  const collectionId = String(asset.collectionId || '').trim();
  const folder = STATIC_COLLECTION_FOLDER_BY_COLLECTION_ID[collectionId]
    || STATIC_SYSTEM_FOLDER_BY_ROLE[role]
    || STATIC_SYSTEM_FOLDER_BY_ROLE.image;
  const cat = staticRoleToCat_(role);
  const id = String(asset.id || `static:${path}`).replace(/\s+/g, '-');
  const name = String(asset.title || asset.name || pathFileName_(path)).trim() || pathFileName_(path);
  const tags = normalizeArray_(asset.tags);
  const themes = normalizeArray_(asset.themes || asset.theme || asset.primaryTheme);
  const usage = normalizeArray_(asset.usage || asset.usages);
  return {
    ...asset,
    id: id.startsWith('static:') ? id : `static:${id}`,
    cat,
    folderId: folder.id,
    name,
    mime: asset.mime || inferMimeFromPath_(path),
    size: Number(asset.size || 0),
    createdAt: asset.createdAt || 0,
    updatedAt: asset.updatedAt || asset.analyzedAt || 0,
    url: path,
    path,
    _builtin: true,
    _staticSystem: true,
    systemAsset: true,
    protected: true,
    assetRole: role,
    assetKind: folder.kind,
    collectionId,
    collectionName: String(asset.collectionName || folder.name || '').replace(/^\S+\s+/, '').trim(),
    description: String(asset.description || '').trim(),
    tags,
    themes,
    usage,
    primaryTheme: asset.primaryTheme || themes[0] || '',
    themeScores: asset.themeScores || {},
    styleScores: asset.styleScores || {},
    moodScores: asset.moodScores || {},
    colorScores: asset.colorScores || {},
    usageScores: asset.usageScores || {},
    textReadability: asset.textReadability || {},
    visualScores: asset.visualScores || {},
    rating: Math.max(0, Math.min(10, Number(asset.rating || 0))),
    reusable: asset.reusable === true,
    reusableThemes: normalizeArray_(asset.reusableThemes),
    reusePolicy: String(asset.reusePolicy || '').trim(),
    priority: Number(asset.priority || 0),
    analyzed: !!asset.analyzed,
    analysisVersion: asset.analysisVersion || null,
    checksum: asset.checksum || null,
    sortIndex: index
  };
}

async function galListStaticSystemItems_(cat, folderId = null) {
  const manifest = await galLoadStaticSystemManifest();
  const folder = folderId ? STATIC_SYSTEM_FOLDER_MAP[String(folderId)] : null;
  const items = (manifest.assets || [])
    .map((asset, index) => normalizeStaticAsset_(asset, index))
    .filter(Boolean)
    .filter(item => !cat || item.cat === cat)
    .filter(item => !folder || item.folderId === folder.id);

  return items.sort((a,b) => {
    const ra = Number(a.rating || 0);
    const rb = Number(b.rating || 0);
    if (rb !== ra) return rb - ra;
    const pa = Number(a.priority || 0);
    const pb = Number(b.priority || 0);
    if (pb !== pa) return pb - pa;
    return (a.name || '').localeCompare(b.name || '', 'uk');
  });
}

function defaultSystemItemDescription_(fileName, sysMeta, cat) {
  const clean = String(fileName || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();
  const label = clean || 'без назви';
  if (!sysMeta) return '';
  if (sysMeta.role === 'background') return `Системний фон: ${label}. Можна використовувати як фон секції, шапки, блока або сторінки.`;
  if (sysMeta.role === 'logo') return `Системний логотип: ${label}. Можна використовувати у шапці, футері або бренд-блоці.`;
  if (sysMeta.role === 'icon') return `Системна іконка: ${label}. Можна використовувати у кнопках, меню, картках або списках.`;
  return `Системне зображення: ${label}. Можна використовувати у блоках, секціях або шаблонах.`;
}

function defaultSystemTags_(fileName, sysMeta, cat) {
  const base = String(fileName || '')
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[^\p{L}\p{N}]+/u)
    .map(x => x.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
  const roleTags = sysMeta ? ['system', sysMeta.role, sysMeta.kind] : [cat].filter(Boolean);
  return Array.from(new Set([...roleTags, ...base]));
}

function openDB_() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        const st = db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
        st.createIndex('byCat', 'cat', { unique: false });
        st.createIndex('byCatParent', ['cat', 'parentId'], { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const st = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        st.createIndex('byCatFolder', ['cat', 'folderId'], { unique: false });
        st.createIndex('byCat', 'cat', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx_(db, storeNames, mode = 'readonly') {
  return db.transaction(storeNames, mode);
}

function uid_(p='id') {
  return `${p}_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`;
}

export async function galEnsureSeed() {
  const db = await openDB_();
  const t = tx_(db, [STORE_FOLDERS], 'readwrite');
  const st = t.objectStore(STORE_FOLDERS);

  // якщо нема кореневих папок — створимо по одній для кожної категорії
  const cats = ['images','logos','icons'];
  for (const cat of cats) {
    const rootId = `root_${cat}`;
    const got = await new Promise((res) => {
      const r = st.get(rootId);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
    if (!got) {
      st.put({
        id: rootId,
        cat,
        parentId: null,
        name: cat === 'images' ? 'Головна' : (cat === 'logos' ? 'Логотипи' : 'Іконки'),
        createdAt: Date.now()
      });
    }
  }

  // --- System asset folders (stable/protected) ---
  for (const meta of SYSTEM_FOLDERS) {
    const existing = await new Promise((res) => {
      const r = st.get(meta.id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });

    st.put({
      ...(existing || {}),
      id: meta.id,
      cat: meta.cat,
      parentId: meta.parentId,
      name: meta.name,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      systemFolder: true,
      protected: true,
      assetRole: meta.role,
      assetKind: meta.kind,
      description: meta.description
    });
  }


  // --- Photo gallery category folders (stage 2) ---
  // Це звичайні папки всередині "Фото-галерея". Їх можна використовувати як категорії:
  // Сковороди / Мангали / Казани / Гравіювання / Друк / Фото відгуки.
  for (const meta of PHOTO_GALLERY_DEFAULT_FOLDERS) {
    const existing = await new Promise((res) => {
      const r = st.get(meta.id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
    if (!existing) {
      st.put({
        id: meta.id,
        cat: meta.cat,
        parentId: meta.parentId,
        name: meta.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        photoGalleryCategory: true,
        galleryCategorySlug: meta.slug,
        physicalPath: meta.physicalPath,
        description: `Категорія фото-галереї: ${meta.name}. Фото з цієї папки можна привʼязувати до пункту меню "${meta.name}".`
      });
    } else {
      st.put({
        ...existing,
        cat: meta.cat,
        parentId: meta.parentId,
        name: existing.name || meta.name,
        updatedAt: Date.now(),
        photoGalleryCategory: true,
        galleryCategorySlug: existing.galleryCategorySlug || meta.slug,
        physicalPath: existing.physicalPath || meta.physicalPath,
        description: existing.description || `Категорія фото-галереї: ${meta.name}.`
      });
    }
  }

  // --- built-in packs (v1): Lucide icons folders ---
  // NOTE: items are static files; folders live in IndexedDB only to enable category navigation.
  const lucideFolders = [
    ['arrows',   'Lucide — Стрілки'],
    ['text',     'Lucide — Текст'],
    ['layout',   'Lucide — Розкладка'],
    ['media',    'Lucide — Медіа'],
    ['comms',    'Lucide — Звʼязок'],
    ['files',    'Lucide — Файли'],
    ['status',   'Lucide — Статуси'],
    ['settings', 'Lucide — Налаштування'],
    ['commerce', 'Lucide — Комерція'],
    ['time',     'Lucide — Час'],
    ['location', 'Lucide — Локація'],
    ['social',   'Соцмережі'],
    ['misc',     'Lucide — Інше']
  ];

  for (const [key, name] of lucideFolders) {
    const id = `lucide_${key}`;
    const got = await new Promise((res) => {
      const r = st.get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
    if (!got) {
      st.put({
        id,
        cat: 'icons',
        parentId: 'root_icons',
        name,
        createdAt: Date.now()
      });
    }
  }

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
  db.close();
}

export async function galListFolders(cat) {
  const db = await openDB_();
  const t = tx_(db, [STORE_FOLDERS], 'readonly');
  const st = t.objectStore(STORE_FOLDERS);
  const idx = st.index('byCat');

  const folders = await new Promise((resolve, reject) => {
    const req = idx.getAll(cat);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  db.close();

  const staticFolders = STATIC_FOLDER_LIST
    .filter(f => f.cat === cat)
    .map(f => ({
      ...f,
      createdAt: 0,
      updatedAt: 0,
      systemFolder: true,
      staticSystemFolder: true,
      protected: true,
      assetRole: f.role,
      assetKind: f.kind
    }));

  const merged = [...folders, ...staticFolders];
  const rank = (f) => {
    const id = String(f?.id || '');
    if (id.startsWith('root_')) return 0;
    if (f?.staticSystemFolder || STATIC_SYSTEM_FOLDER_MAP[id]) return 1;
    if (f?.systemFolder || SYSTEM_FOLDER_MAP[id]) return 2;
    if (id.startsWith('lucide_')) return 3;
    return 4;
  };
  return merged.sort((a,b)=> {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return (a.name||'').localeCompare(b.name||'', 'uk');
  });
}

export async function galCreateFolder({ cat, parentId, name }) {
  const db = await openDB_();
  const t = tx_(db, [STORE_FOLDERS], 'readwrite');
  const st = t.objectStore(STORE_FOLDERS);

  const folder = {
    id: uid_('fld'),
    cat,
    parentId: parentId ?? `root_${cat}`,
    name: String(name || 'Нова папка').trim() || 'Нова папка',
    createdAt: Date.now()
  };

  st.put(folder);

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
  db.close();
  return folder;
}

export async function galRenameFolder(folderId, newName) {
  const db = await openDB_();
  const t = tx_(db, [STORE_FOLDERS], 'readwrite');
  const st = t.objectStore(STORE_FOLDERS);

  const folder = await new Promise((res) => {
    const r = st.get(folderId);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => res(null);
  });
  if (!folder) { db.close(); return null; }

  folder.name = String(newName || '').trim() || folder.name;
  st.put(folder);

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
  db.close();
  return folder;
}

export async function galDeleteFolder(folderId) {
  // Видаляємо папку + її файли
  const db = await openDB_();
  const t = tx_(db, [STORE_FOLDERS, STORE_ITEMS], 'readwrite');
  const stF = t.objectStore(STORE_FOLDERS);
  const stI = t.objectStore(STORE_ITEMS);
  const idx = stI.index('byCatFolder');

  const folder = await new Promise((res) => {
    const r = stF.get(folderId);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => res(null);
  });
  if (!folder) { db.close(); return false; }

  const items = await new Promise((resolve) => {
    const r = idx.getAll([folder.cat, folderId]);
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => resolve([]);
  });

  for (const it of items) stI.delete(it.id);
  stF.delete(folderId);

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
  db.close();
  return true;
}

export async function galListItems(cat, folderId) {
  if (STATIC_SYSTEM_FOLDER_MAP[String(folderId || '')]) {
    return galListStaticSystemItems_(cat, folderId);
  }

  const db = await openDB_();
  const t = tx_(db, [STORE_ITEMS], 'readonly');
  const st = t.objectStore(STORE_ITEMS);
  const idx = st.index('byCatFolder');

  const items = await new Promise((resolve) => {
    const r = idx.getAll([cat, folderId]);
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => resolve([]);
  });

  db.close();
  return items.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
}

export async function galAddFiles({ cat, folderId, files }) {
  const db = await openDB_();
  const t = tx_(db, [STORE_ITEMS], 'readwrite');
  const st = t.objectStore(STORE_ITEMS);

  const out = [];
  for (const f of files) {
    const id = uid_('it');
    const sysMeta = galGetSystemFolderMeta(folderId);
    const item = {
      id,
      cat,
      folderId,
      name: f.name,
      mime: f.type || 'application/octet-stream',
      size: f.size || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blob: f,
      systemAsset: !!sysMeta,
      assetRole: sysMeta?.role || null,
      assetKind: sysMeta?.kind || null,
      description: sysMeta ? defaultSystemItemDescription_(f.name, sysMeta, cat) : '',
      tags: sysMeta ? defaultSystemTags_(f.name, sysMeta, cat) : []
    };
    st.put(item);
    out.push(item);
  }

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
  db.close();
  return out;
}

export async function galDeleteItem(itemId) {
  const db = await openDB_();
  const t = tx_(db, [STORE_ITEMS], 'readwrite');
  const st = t.objectStore(STORE_ITEMS);
  st.delete(itemId);

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
  db.close();
  return true;
}

export async function galUpdateItemMeta(itemId, patch = {}) {
  if (!itemId || String(itemId).startsWith('lucide:')) return null;

  const db = await openDB_();
  const t = tx_(db, [STORE_ITEMS], 'readwrite');
  const st = t.objectStore(STORE_ITEMS);

  const item = await new Promise((res) => {
    const r = st.get(itemId);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => res(null);
  });

  if (!item) { db.close(); return null; }

  if (Object.prototype.hasOwnProperty.call(patch, 'name')) {
    const name = String(patch.name || '').trim();
    if (name) item.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'description')) {
    item.description = String(patch.description || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'tags')) {
    const raw = Array.isArray(patch.tags) ? patch.tags : String(patch.tags || '').split(',');
    item.tags = Array.from(new Set(raw.map(x => String(x || '').trim().toLowerCase()).filter(Boolean)));
  }

  const sysMeta = galGetSystemFolderMeta(item.folderId);
  if (sysMeta) {
    item.systemAsset = true;
    item.assetRole = sysMeta.role;
    item.assetKind = sysMeta.kind;
  }

  item.updatedAt = Date.now();
  st.put(item);

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });

  db.close();
  return item;
}

export async function galListAiAssets({ cat = null, systemOnly = true } = {}) {
  await galEnsureSeed();
  const db = await openDB_();
  const t = tx_(db, [STORE_ITEMS], 'readonly');
  const st = t.objectStore(STORE_ITEMS);

  const all = await new Promise((resolve) => {
    const r = cat ? st.index('byCat').getAll(cat) : st.getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => resolve([]);
  });

  db.close();

  const dbItems = all
    .filter(it => !systemOnly || it.systemAsset || galIsSystemFolder(it.folderId))
    .map(it => ({
      id: it.id,
      cat: it.cat,
      folderId: it.folderId,
      name: it.name,
      mime: it.mime,
      size: it.size || 0,
      createdAt: it.createdAt || 0,
      updatedAt: it.updatedAt || it.createdAt || 0,
      systemAsset: !!(it.systemAsset || galIsSystemFolder(it.folderId)),
      assetRole: it.assetRole || galGetSystemFolderMeta(it.folderId)?.role || null,
      assetKind: it.assetKind || galGetSystemFolderMeta(it.folderId)?.kind || null,
      description: it.description || '',
      tags: Array.isArray(it.tags) ? it.tags : [],
      themes: Array.isArray(it.themes) ? it.themes : [],
      usage: Array.isArray(it.usage) ? it.usage : []
    }));

  const staticItems = await galListStaticSystemItems_(cat || null, null);
  const merged = [...staticItems, ...dbItems];
  return merged.sort((a,b) => {
    const pa = Number(a.priority || 0);
    const pb = Number(b.priority || 0);
    if (pb !== pa) return pb - pa;
    return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
  });
}


export async function galFindBestAiAssets(criteria = {}, { cat = null, limit = 12, systemOnly = true } = {}) {
  const items = await galListAiAssets({ cat, systemOnly });
  const scored = (items || []).map((item) => {
    const match = galScoreAiAsset(item, criteria);
    return { ...item, _aiMatch: match };
  });
  return scored
    .sort((a, b) => {
      const sa = Number(a._aiMatch?.score || 0);
      const sb = Number(b._aiMatch?.score || 0);
      if (sb !== sa) return sb - sa;
      const pa = Number(a.priority || 0);
      const pb = Number(b.priority || 0);
      if (pb !== pa) return pb - pa;
      return (a.name || '').localeCompare(b.name || '', 'uk');
    })
    .slice(0, Math.max(1, Number(limit || 12)));
}

export function galMakeObjectUrl(item) {
  // підтримка вбудованих (static) елементів галереї
  // item.url — відносний шлях (assets/...) або абсолютний URL
  if (!item) return '';
  if (item.url) return String(item.url);
  if (!item.blob) return '';
  return URL.createObjectURL(item.blob);
}

// --- rename item (file) ---
// --- rename item (file) ---
export async function galRenameItem(itemId, newName) {
  if (!itemId) return null;

  const name = String(newName || '').trim();
  if (!name) return null;

  const db = await openDB_();
  const t = tx_(db, [STORE_ITEMS], 'readwrite');
  // або якщо хочеш строго: const st = t.objectStore(STORE_ITEMS);
  const st = t.objectStore(STORE_ITEMS);

  const item = await new Promise((res) => {
    const r = st.get(itemId);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => res(null);
  });

  if (!item) {
    db.close();
    return null;
  }

  item.name = name;
  item.updatedAt = Date.now();
  st.put(item);

  await new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });

  db.close();
  return item;
}
