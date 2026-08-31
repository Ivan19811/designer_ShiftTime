// js/design/widgets/photo-gallery/photo-gallery-widget.js
// [00359][PHOTO GALLERY TEMPLATES STAGE 7]
// Віджет "Фотогалерея" + секція галереї з меню зверху і placeholder-фото.
// Етап 6: стрілки, клавіатура, ESC, свайп, lightbox/fullscreen navigation.
// Основне правило: створюємо звичайні st-section / st-row / st-block, щоб усе редагувалось стандартними віджетами.

import { openGalleryModal } from '../gallery-widget/gallery-widget.js';
import { galListItems, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';
import { addTemplate } from '../templates/store/templates-store.js';

const SEC_ID = 'st-photo-gallery-widget-section';
const STATE_KEY = 'st_photo_gallery_widget_state_v1';
const PG_LAYOUT_STAGE = '00392';
const PG_DESIGN_CHANGE_CTX_KEY = 'st_photo_gallery_template_change_ctx_v1';
const PG_DESIGN_CHANGE_BACKUP_KEY = 'st_photo_gallery_design_change_backup_v1';
const PG_CAPTION_EDIT_BACKUP_KEY = 'st_photo_gallery_caption_edit_backup_v1';
const PG_GRID_LAYOUT_MODE = 'photo-gallery-grid';
const PG_CAPTION_STYLE_STAGE = '00392';

const GALLERY_CATEGORIES = [
  { slug: 'all', label: 'Усі', folderId: 'sys_photo_gallery' },
  { slug: 'skovorody', label: 'Сковороди', folderId: 'pgcat_skovorody' },
  { slug: 'mangaly', label: 'Мангали', folderId: 'pgcat_mangaly' },
  { slug: 'kazany', label: 'Казани', folderId: 'pgcat_kazany' },
  { slug: 'engraving', label: 'Гравіювання', folderId: 'pgcat_engraving' },
  { slug: 'print', label: 'Друк', folderId: 'pgcat_print' },
  { slug: 'reviews', label: 'Фото відгуки', folderId: 'pgcat_photo_reviews' }
];

const GALLERY_LAYOUTS = {
  'grid-3x4': {
    label: '3×4',
    min: 12,
    grid: 'repeat(3,minmax(0,1fr))',
    autoRows: '220px',
    gap: '18px',
    mode: 'equal'
  },
  'grid-4x4': {
    label: '4×4',
    min: 16,
    grid: 'repeat(4,minmax(0,1fr))',
    autoRows: '190px',
    gap: '16px',
    mode: 'equal'
  },
  'bento': {
    label: 'Bento',
    min: 8,
    grid: 'repeat(4,minmax(0,1fr))',
    autoRows: '150px',
    gap: '18px',
    mode: 'bento'
  },
  'masonry': {
    label: 'Masonry',
    min: 10,
    grid: 'repeat(4,minmax(0,1fr))',
    autoRows: '44px',
    gap: '16px',
    mode: 'masonry'
  },
  'random': {
    label: 'Random',
    min: 12,
    grid: 'repeat(6,minmax(0,1fr))',
    autoRows: '88px',
    gap: '16px',
    mode: 'random'
  }
};

const GALLERY_PREVIEW_MODES = {
  off: 'Вимкнено',
  right: 'Вікно справа',
  left: 'Вікно зліва',
  top: 'Велике фото зверху + лента знизу',
  modal: 'Випадаюче велике вікно',
  fullscreen: 'На весь екран'
};

function normalizePreviewMode(value) {
  const raw = String(value || '').trim().toLowerCase();
  const map = {
    'off': 'off',
    'none': 'off',
    'вимкнено': 'off',
    'right': 'right',
    'справа': 'right',
    'preview-right': 'right',
    'left': 'left',
    'зліва': 'left',
    'preview-left': 'left',
    'top': 'top',
    'зверху': 'top',
    'top-strip': 'top',
    'modal': 'modal',
    'window': 'modal',
    'вікно': 'modal',
    'fullscreen': 'fullscreen',
    'full': 'fullscreen',
    'повний екран': 'fullscreen'
  };
  return map[raw] || (GALLERY_PREVIEW_MODES[raw] ? raw : 'off');
}

function previewModeLabel(value) {
  const mode = normalizePreviewMode(value);
  return GALLERY_PREVIEW_MODES[mode] || GALLERY_PREVIEW_MODES.off;
}

function normalizeLayoutMode(value) {
  const raw = String(value || '').trim().toLowerCase();
  const map = {
    '3x4': 'grid-3x4',
    '3×4': 'grid-3x4',
    'grid-3x4': 'grid-3x4',
    '4x4': 'grid-4x4',
    '4×4': 'grid-4x4',
    'grid-4x4': 'grid-4x4',
    'bento': 'bento',
    'бенто': 'bento',
    'masonry': 'masonry',
    'масонрі': 'masonry',
    'random': 'random',
    'рандом': 'random',
    'random-mix': 'random'
  };
  return map[raw] || (GALLERY_LAYOUTS[raw] ? raw : 'bento');
}

function layoutLabel(value) {
  const mode = normalizeLayoutMode(value);
  return GALLERY_LAYOUTS[mode]?.label || 'Bento';
}

function normalizeCategorySlug(value) {
  const raw = String(value || '').trim().toLowerCase();
  const map = {
    'усі': 'all',
    'всі': 'all',
    'all': 'all',
    'сковороди': 'skovorody',
    'сковорода': 'skovorody',
    'skovorody': 'skovorody',
    'skovoroda': 'skovorody',
    'мангали': 'mangaly',
    'мангал': 'mangaly',
    'mangaly': 'mangaly',
    'mangal': 'mangaly',
    'казани': 'kazany',
    'казан': 'kazany',
    'kazany': 'kazany',
    'kazan': 'kazany',
    'гравіювання': 'engraving',
    'гравировка': 'engraving',
    'engraving': 'engraving',
    'друк': 'print',
    'печать': 'print',
    'print': 'print',
    'фото відгуки': 'reviews',
    'фотовідгуки': 'reviews',
    'відгуки': 'reviews',
    'reviews': 'reviews',
    'photo-reviews': 'reviews'
  };
  const compact = raw.replace(/[ʼ’`]/g, '').replace(/\s+/g, ' ');
  if (map[compact]) return map[compact];
  return compact
    .replace(/[ґ]/g, 'г')
    .replace(/[^a-zа-яіїє0-9]+/giu, '-')
    .replace(/^-+|-+$/g, '') || 'all';
}

function categoryLabelBySlug(slug) {
  const normalized = normalizeCategorySlug(slug);
  const found = GALLERY_CATEGORIES.find((item) => item.slug === normalized);
  return found ? found.label : String(slug || 'Усі');
}

function categoryByIndex(index) {
  return GALLERY_CATEGORIES[((Number(index || 1) - 1) % (GALLERY_CATEGORIES.length - 1)) + 1] || GALLERY_CATEGORIES[1];
}

function findCategoryByFolderId(folderId) {
  const id = String(folderId || '').trim();
  return GALLERY_CATEGORIES.find((item) => String(item.folderId || '') === id) || null;
}

function categoryFromAsset(asset = {}) {
  const folderId = String(asset.folderId || '').trim();
  const known = findCategoryByFolderId(folderId);
  if (known) return known;
  const folderName = String(asset.folderName || '').trim();
  if (folderName) {
    return {
      slug: normalizeCategorySlug(folderName),
      label: folderName,
      folderId: folderId || `pgcat_${normalizeCategorySlug(folderName)}`
    };
  }
  return {
    slug: 'photo-gallery',
    label: 'Фото-галерея',
    folderId: folderId || 'sys_photo_gallery'
  };
}

function normalizePickedAssets(payload) {
  const list = Array.isArray(payload?.selectedItems) ? payload.selectedItems
    : Array.isArray(payload?.items) ? payload.items
    : payload ? [payload] : [];
  return list
    .map((item, idx) => ({
      itemId: String(item.itemId || item.id || `picked_${idx + 1}`),
      name: String(item.name || `Фото ${idx + 1}`),
      url: String(item.url || item.path || ''),
      path: String(item.path || item.url || ''),
      mime: String(item.mime || ''),
      cat: String(item.cat || payload?.cat || 'images'),
      folderId: String(item.folderId || payload?.folderId || ''),
      folderName: String(item.folderName || payload?.folderName || ''),
      parentFolderId: String(item.parentFolderId || payload?.parentFolderId || '')
    }))
    .filter((item) => item.url || item.name);
}

function chooseLayoutForPhotoCount(count) {
  const n = Number(count || 0);
  if (n <= 4) return 'grid-3x4';
  if (n <= 8) return 'bento';
  if (n <= 12) return 'grid-3x4';
  if (n <= 16) return 'grid-4x4';
  if (n <= 24) return 'masonry';
  return 'random';
}


function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function uid(prefix = 'st') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function getSiteRoot() {
  return document.getElementById('site-root') || document.querySelector('.site-root') || null;
}

function getFooterSlot(root) {
  return root?.querySelector?.('#st-site-footer-slot') || null;
}

function insertBeforeFooter(root, node) {
  if (!root || !node) return;
  const footer = getFooterSlot(root);
  if (footer && footer.parentElement === root) root.insertBefore(node, footer);
  else root.appendChild(node);
}

function setDataset(el, map) {
  Object.entries(map || {}).forEach(([key, value]) => {
    try { el.dataset[key] = String(value); } catch (_) {}
  });
}

function notifyChanged(reason = 'photo-gallery-widget-change') {
  try { window.ST_RESCAN_SITE_STATE?.(); } catch (_) {}
  try { window.ST_SAVE_ROOT_DOM_HTML?.(); } catch (_) {}
  try { window.SiteCanvas?.refreshEnhancers?.(getSiteRoot()); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason } })); } catch (_) {}
  try { window.dispatchEvent(new CustomEvent('st:photo-gallery:changed', { detail: { reason } })); } catch (_) {}
}

function selectElement(el, type = '') {
  if (!el) return;
  try {
    const root = getSiteRoot();
    if (root) {
      root.querySelectorAll('.is-active, .is-selected').forEach((n) => n.classList.remove('is-active', 'is-selected'));
    }
    el.classList.add('is-active', 'is-selected');
    const finalType = type || (el.classList.contains('st-section') ? 'section' : (el.classList.contains('st-row') ? 'row' : 'block'));
    if (window.ST_SELECTION && typeof window.ST_SELECTION.setSingle === 'function') {
      window.ST_SELECTION.setSingle(el, { type: finalType });
    }
    document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { type: finalType, elements: [el] } }));
  } catch (_) {}
}

function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeState(state) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state || {})); } catch (_) {}
}

function ensureOpen(sectionEl, open) {
  if (!sectionEl) return;
  const body = sectionEl.querySelector('.design-section__body');
  sectionEl.classList.toggle('is-open', !!open);
  if (body) body.hidden = !open;
}

function galleryMenuHtml() {
  return `
    <div class="st-photo-gallery-menu" data-photo-gallery-menu="1" data-gallery-active-filter="all" style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;width:100%;padding:10px 12px;border-radius:20px;background:rgba(15,23,42,.04);border:1px solid rgba(15,23,42,.08);box-sizing:border-box;">
      <style>
        .st-photo-gallery-menu__item.is-active{
          border-color:rgba(37,99,235,.50)!important;
          background:linear-gradient(135deg,#2563eb,#06b6d4)!important;
          color:#fff!important;
          box-shadow:0 12px 30px rgba(37,99,235,.18)!important;
        }
      </style>
      ${GALLERY_CATEGORIES.map((item, idx) => `
        <button class="st-photo-gallery-menu__item ${idx === 0 ? 'is-active' : ''}" type="button" data-gallery-filter="${esc(item.label)}" data-gallery-filter-slug="${esc(item.slug)}" data-gallery-folder-id="${esc(item.folderId)}" contenteditable="true" spellcheck="false" style="appearance:none;border:${idx === 0 ? '1px solid rgba(37,99,235,.45)' : '1px solid rgba(15,23,42,.10)'};border-radius:999px;background:${idx === 0 ? 'linear-gradient(135deg,#2563eb,#06b6d4)' : '#ffffff'};color:${idx === 0 ? '#ffffff' : '#334155'};padding:9px 14px;font-size:13px;font-weight:900;box-shadow:${idx === 0 ? '0 12px 30px rgba(37,99,235,.18)' : '0 8px 18px rgba(15,23,42,.06)'};cursor:pointer;white-space:nowrap;">${esc(item.label)}</button>
      `).join('')}
    </div>`;
}

function imagePlaceholderHtml(index) {
  const colors = [
    ['#dbeafe', '#67e8f9'],
    ['#dcfce7', '#86efac'],
    ['#fef3c7', '#fbbf24'],
    ['#fce7f3', '#f472b6'],
    ['#ede9fe', '#a78bfa'],
    ['#fee2e2', '#fb7185']
  ];
  const [bg1, bg2] = colors[(index - 1) % colors.length];
  const category = categoryByIndex(index);
  return `
    <div class="st-photo-gallery-photo" data-photo-category="${esc(category.label)}" data-photo-category-slug="${esc(category.slug)}" style="position:relative;width:100%;min-height:${index === 1 ? '260px' : '210px'};border-radius:24px;overflow:hidden;background:radial-gradient(circle at 24% 20%,rgba(255,255,255,.70),transparent 30%),linear-gradient(135deg,${bg1},${bg2});border:1px solid rgba(15,23,42,.08);box-shadow:0 20px 52px rgba(15,23,42,.10);box-sizing:border-box;display:grid;place-items:center;">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(15,23,42,.30));pointer-events:none;"></div>
      <div style="position:relative;display:grid;place-items:center;width:72px;height:72px;border-radius:22px;background:rgba(255,255,255,.52);border:1px solid rgba(255,255,255,.70);box-shadow:0 18px 42px rgba(15,23,42,.12);font-size:30px;">📷</div>
      <div class="st-photo-gallery-caption" contenteditable="true" spellcheck="false" style="position:absolute;left:14px;right:14px;bottom:14px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.78);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.62);color:#0f172a;font-size:13px;font-weight:900;line-height:1.25;">Фото ${index} · ${esc(category.label)}</div>
    </div>`;
}

function imageAssetHtml(index, asset = {}) {
  const category = categoryFromAsset(asset);
  const name = asset.name || `Фото ${index}`;
  const src = asset.url || '';
  const caption = `${name}${category.label ? ` · ${category.label}` : ''}`;
  if (!src) return imagePlaceholderHtml(index);
  return `
    <div class="st-photo-gallery-photo" data-photo-category="${esc(category.label)}" data-photo-category-slug="${esc(category.slug)}" data-photo-src="${esc(src)}" data-photo-name="${esc(name)}" data-photo-item-id="${esc(asset.itemId || asset.id || '')}" data-photo-folder-id="${esc(asset.folderId || '')}" data-photo-path="${esc(asset.path || asset.url || '')}" style="position:relative;width:100%;min-height:${index === 1 ? '260px' : '210px'};border-radius:24px;overflow:hidden;background:#0f172a;border:1px solid rgba(15,23,42,.08);box-shadow:0 20px 52px rgba(15,23,42,.12);box-sizing:border-box;display:grid;place-items:center;">
      <img src="${esc(src)}" alt="${esc(name)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.02) 30%,rgba(15,23,42,.48));pointer-events:none;"></div>
      <div class="st-photo-gallery-caption" contenteditable="true" spellcheck="false" style="position:absolute;left:14px;right:14px;bottom:14px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.80);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.62);color:#0f172a;font-size:13px;font-weight:900;line-height:1.25;">${esc(caption)}</div>
    </div>`;
}

function makePhotoBlock(index, asset = null) {
  const block = document.createElement('div');
  const category = asset ? categoryFromAsset(asset) : categoryByIndex(index);
  block.className = 'st-block st-photo-gallery-image-block';
  setDataset(block, {
    uid: uid('pgb'),
    fr: index === 1 ? '2' : '1',
    blockKind: 'photo-gallery-image',
    galleryBlock: 'image',
    galleryCategory: category.slug,
    galleryCategoryLabel: category.label,
    galleryFolderId: category.folderId,
    galleryAssetId: asset?.itemId || '',
    galleryAssetName: asset?.name || '',
    galleryAssetUrl: asset?.url || asset?.path || '',
    galleryAssetPath: asset?.path || asset?.url || '',
    galleryVersion: PG_LAYOUT_STAGE
  });
  block.setAttribute('draggable', 'true');
  block.setAttribute('style', 'width:100%;min-width:0;min-height:210px;height:100%;border-radius:24px;padding:0;background:transparent;border:0;box-shadow:none;box-sizing:border-box;overflow:hidden;align-self:stretch;justify-self:stretch;');
  block.innerHTML = asset ? imageAssetHtml(index, asset) : imagePlaceholderHtml(index);
  return block;
}

function makeGallerySection() {
  const sec = document.createElement('section');
  sec.className = 'st-section st-photo-gallery-section';
  setDataset(sec, {
    secId: uid('pgs'),
    stArea: 'removed-content',
    secRole: 'photo-gallery-section',
    gallerySection: 'photo-gallery',
    galleryLayout: 'bento',
    galleryActiveFilter: 'all',
    galleryMenuEnabled: '1',
    galleryPreviewMode: 'off',
    galleryPreviewIndex: '0',
    galleryVersion: PG_LAYOUT_STAGE
  });
  sec.setAttribute('style', 'padding:56px 32px;background:linear-gradient(135deg,#f8fafc,#eef2ff);box-sizing:border-box;');

  const menuRow = document.createElement('div');
  menuRow.className = 'st-row st-photo-gallery-menu-row';
  setDataset(menuRow, {
    uid: uid('pgr'),
    stNode: 'level',
    stArea: 'removed-content',
    layoutMode: 'fr',
    layoutOrient: 'row',
    frs: '1',
    galleryRow: 'menu'
  });
  menuRow.setAttribute('style', 'display:grid;width:100%;max-width:1220px;margin:0 auto 22px;grid-template-columns:1fr;gap:12px;box-sizing:border-box;');
  const menuBlock = document.createElement('div');
  menuBlock.className = 'st-block st-photo-gallery-menu-block';
  setDataset(menuBlock, { uid: uid('pgm'), fr: '1', blockKind: 'photo-gallery-menu', galleryBlock: 'menu', galleryVersion: PG_LAYOUT_STAGE });
  menuBlock.setAttribute('draggable', 'true');
  menuBlock.setAttribute('style', 'width:100%;min-height:54px;padding:0;border:0;background:transparent;box-shadow:none;box-sizing:border-box;');
  menuBlock.innerHTML = galleryMenuHtml();
  menuRow.appendChild(menuBlock);

  const gridRow = document.createElement('div');
  gridRow.className = 'st-row st-photo-gallery-grid-row';
  setDataset(gridRow, {
    uid: uid('pgr'),
    stNode: 'level',
    stArea: 'removed-content',
    layoutMode: PG_GRID_LAYOUT_MODE,
    layoutOrient: 'row',
    galleryGridMode: '1',
    galleryRow: 'grid'
  });
  gridRow.setAttribute('style', 'display:grid;width:100%;max-width:1220px;margin:0 auto;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:150px;gap:18px;align-items:stretch;box-sizing:border-box;grid-auto-flow:dense;');

  const blocks = Array.from({ length: 8 }, (_, i) => makePhotoBlock(i + 1));
  blocks.forEach((block) => gridRow.appendChild(block));

  sec.appendChild(menuRow);
  sec.appendChild(gridRow);
  applyGalleryLayout(sec, 'bento', { silent: true, preserveSelection: true });
  return { sec, menuRow, gridRow, blocks };
}

function addGallerySection() {
  const root = getSiteRoot();
  if (!root) {
    try { alert('Не знайдено #site-root. Спочатку відкрий сторінку конструктора.'); } catch (_) {}
    return null;
  }
  const made = makeGallerySection();
  insertBeforeFooter(root, made.sec);
  notifyChanged('photo-gallery-add-section');
  selectElement(made.sec, 'section');
  return made;
}

function findActiveGallerySection() {
  const root = getSiteRoot();
  if (!root) return null;
  const selected = root.querySelector('.st-photo-gallery-section.is-active, .st-photo-gallery-section.is-selected');
  if (selected) return selected;
  const activeInner = root.querySelector('.st-photo-gallery-section .is-active, .st-photo-gallery-section .is-selected');
  if (activeInner) return activeInner.closest('.st-photo-gallery-section');
  return root.querySelector('.st-photo-gallery-section');
}

function findSelectedGallerySection() {
  const root = getSiteRoot();
  if (!root) return null;
  const selected = root.querySelector('.st-photo-gallery-section.is-active, .st-photo-gallery-section.is-selected');
  if (selected) return selected;
  const activeInner = root.querySelector('.st-photo-gallery-section .is-active, .st-photo-gallery-section .is-selected');
  if (activeInner) return activeInner.closest('.st-photo-gallery-section');
  return null;
}

function getGallerySectionUid(section) {
  if (!section) return '';
  return String(section.dataset?.secId || section.dataset?.uid || section.id || '').trim();
}

function findGallerySectionByUid(uid) {
  const root = getSiteRoot();
  const id = String(uid || '').trim();
  if (!root || !id) return null;
  const escId = (window.CSS && CSS.escape) ? CSS.escape(id) : id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  return root.querySelector(`.st-photo-gallery-section[data-sec-id="${escId}"], .st-photo-gallery-section[data-uid="${escId}"]`)
    || root.querySelector(`.st-section[data-gallery-section="photo-gallery"][data-sec-id="${escId}"], .st-section[data-gallery-section="photo-gallery"][data-uid="${escId}"]`);
}

function readDesignChangeBackup() {
  try {
    const raw = localStorage.getItem(PG_DESIGN_CHANGE_BACKUP_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === 'object' ? data : null;
  } catch (_) {
    return null;
  }
}

function writeDesignChangeBackup(data) {
  try { localStorage.setItem(PG_DESIGN_CHANGE_BACKUP_KEY, JSON.stringify(data || {})); } catch (_) {}
}

function clearDesignChangeState() {
  try { localStorage.removeItem(PG_DESIGN_CHANGE_CTX_KEY); } catch (_) {}
  try { localStorage.removeItem(PG_DESIGN_CHANGE_BACKUP_KEY); } catch (_) {}
}

function isDesignChangePending() {
  const b = readDesignChangeBackup();
  return !!(b && b.pending && b.targetUid && b.originalOuterHTML);
}

function isDesignChangeContextActive() {
  try {
    const ctx = JSON.parse(localStorage.getItem(PG_DESIGN_CHANGE_CTX_KEY) || 'null');
    const b = readDesignChangeBackup();
    return !!(ctx && ctx.mode === 'photo-gallery-design-change' && b?.targetUid && b?.originalOuterHTML);
  } catch (_) {
    return false;
  }
}

function getDesignChangeTarget() {
  const b = readDesignChangeBackup();
  if (b?.targetUid) return findGallerySectionByUid(b.targetUid);
  return findSelectedGallerySection();
}

function getPhotoBlocks(section) {
  return Array.from(section?.querySelectorAll?.('.st-photo-gallery-image-block') || []);
}


function getGalleryGridRow(section) {
  return section?.querySelector?.('.st-photo-gallery-grid-row') || null;
}

function getGalleryPreviewRow(section) {
  return section?.querySelector?.('.st-photo-gallery-preview-row') || null;
}

function getVisiblePhotoBlocks(section) {
  return getPhotoBlocks(section).filter((block) => !block.hidden && block.style.display !== 'none');
}

function photoInfoFromBlock(block, index = 0) {
  const img = block?.querySelector?.('img');
  const caption = block?.querySelector?.('.st-photo-gallery-caption');
  const category = block?.dataset?.galleryCategoryLabel || block?.querySelector?.('[data-photo-category]')?.dataset?.photoCategory || '';
  return {
    src: block?.dataset?.galleryAssetUrl || img?.getAttribute?.('src') || '',
    title: block?.dataset?.galleryAssetName || caption?.textContent?.trim?.() || `Фото ${index + 1}`,
    category: category || categoryLabelBySlug(block?.dataset?.galleryCategory || ''),
    index
  };
}

function previewPlaceholderHtml(info = {}) {
  return `
    <div class="st-photo-gallery-preview__placeholder" style="position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 24% 20%,rgba(255,255,255,.42),transparent 34%),linear-gradient(135deg,#dbeafe,#67e8f9);">
      <div style="display:grid;place-items:center;width:92px;height:92px;border-radius:28px;background:rgba(255,255,255,.46);border:1px solid rgba(255,255,255,.72);box-shadow:0 20px 50px rgba(15,23,42,.14);font-size:38px;">📷</div>
    </div>`;
}

function ensureGalleryPreviewRow(section) {
  if (!section) return null;
  let row = getGalleryPreviewRow(section);
  if (row) return row;
  row = document.createElement('div');
  row.className = 'st-row st-photo-gallery-preview-row';
  setDataset(row, {
    uid: uid('pgpr'),
    stNode: 'level',
    stArea: 'removed-content',
    layoutMode: 'fr',
    layoutOrient: 'row',
    frs: '1',
    galleryRow: 'preview',
    galleryPreviewRow: '1'
  });
  row.setAttribute('style', 'display:none;width:100%;max-width:1220px;margin:0 auto 18px;grid-template-columns:1fr;gap:12px;box-sizing:border-box;');
  const block = document.createElement('div');
  block.className = 'st-block st-photo-gallery-preview-block';
  setDataset(block, { uid: uid('pgpb'), fr: '1', blockKind: 'photo-gallery-preview', galleryBlock: 'preview', galleryVersion: PG_LAYOUT_STAGE });
  block.setAttribute('draggable', 'true');
  block.setAttribute('style', 'position:relative;width:100%;min-height:360px;border-radius:28px;overflow:hidden;background:#0f172a;border:1px solid rgba(15,23,42,.10);box-shadow:0 24px 70px rgba(15,23,42,.16);box-sizing:border-box;');
  block.innerHTML = `
    <style>
      .st-photo-gallery-preview-btn{position:absolute;z-index:3;display:grid;place-items:center;width:42px;height:42px;border-radius:999px;border:1px solid rgba(255,255,255,.48);background:rgba(15,23,42,.28);color:#fff;backdrop-filter:blur(10px);font-size:24px;font-weight:950;cursor:pointer;box-shadow:0 12px 30px rgba(15,23,42,.18);}
      .st-photo-gallery-preview-btn:hover{background:rgba(37,99,235,.54);border-color:rgba(125,211,252,.74);}
      .st-photo-gallery-preview-btn--prev{top:50%;left:16px;transform:translateY(-50%);}
      .st-photo-gallery-preview-btn--next{top:50%;right:16px;transform:translateY(-50%);}
      .st-photo-gallery-preview__hint{position:absolute;top:16px;left:16px;z-index:2;padding:8px 11px;border-radius:999px;background:rgba(15,23,42,.34);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.24);color:#fff;font-size:11px;font-weight:900;letter-spacing:.04em;}
    </style>
    <div class="st-photo-gallery-preview__media" data-gallery-preview-media style="position:absolute;inset:0;overflow:hidden;">${previewPlaceholderHtml({})}</div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.05) 30%,rgba(15,23,42,.58));pointer-events:none;"></div>
    <button type="button" class="st-photo-gallery-preview-btn st-photo-gallery-preview-btn--prev" data-pg-preview-nav="prev" aria-label="Попереднє фото">‹</button>
    <button type="button" class="st-photo-gallery-preview-btn st-photo-gallery-preview-btn--next" data-pg-preview-nav="next" aria-label="Наступне фото">›</button>
    <div class="st-photo-gallery-preview__hint">← / → · Swipe</div>
    <div class="st-photo-gallery-preview__badge" data-gallery-preview-count style="position:absolute;top:16px;right:16px;padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.82);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.64);color:#0f172a;font-size:12px;font-weight:900;">1 / 1</div>
    <div class="st-photo-gallery-preview__caption" style="position:absolute;left:18px;right:18px;bottom:18px;padding:14px 16px;border-radius:20px;background:rgba(255,255,255,.82);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.64);color:#0f172a;display:grid;gap:4px;">
      <div data-gallery-preview-title contenteditable="true" spellcheck="false" style="font-size:17px;font-weight:950;line-height:1.2;">Фото для перегляду</div>
      <div data-gallery-preview-category style="font-size:12px;font-weight:850;color:#475569;">Категорія галереї</div>
    </div>`;
  row.appendChild(block);
  const menuRow = section.querySelector('.st-photo-gallery-menu-row');
  const gridRow = getGalleryGridRow(section);
  if (menuRow && menuRow.nextSibling) section.insertBefore(row, menuRow.nextSibling);
  else if (gridRow) section.insertBefore(row, gridRow);
  else section.appendChild(row);
  return row;
}

function markActivePhotoBlock(section, activeBlock) {
  getPhotoBlocks(section).forEach((block) => {
    const active = block === activeBlock;
    block.classList.toggle('is-gallery-preview-active', active);
    block.dataset.galleryPreviewActive = active ? '1' : '0';
    if (active) block.style.outline = '3px solid rgba(37,99,235,.50)';
    else block.style.outline = '';
  });
}

function updateGalleryPreview(section, blockOrIndex = 0) {
  if (!section) return false;
  const blocks = getVisiblePhotoBlocks(section);
  if (!blocks.length) return false;
  let index = 0;
  let block = null;
  if (blockOrIndex instanceof HTMLElement) {
    block = blockOrIndex;
    index = Math.max(0, blocks.indexOf(block));
  } else {
    index = Math.max(0, Math.min(blocks.length - 1, Number(blockOrIndex || 0)));
    block = blocks[index];
  }
  if (!block) return false;
  section.dataset.galleryPreviewIndex = String(index);
  const info = photoInfoFromBlock(block, index);
  const row = ensureGalleryPreviewRow(section);
  const media = row?.querySelector?.('[data-gallery-preview-media]');
  const title = row?.querySelector?.('[data-gallery-preview-title]');
  const cat = row?.querySelector?.('[data-gallery-preview-category]');
  const count = row?.querySelector?.('[data-gallery-preview-count]');
  if (media) {
    media.innerHTML = info.src
      ? `<img src="${esc(info.src)}" alt="${esc(info.title)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">`
      : previewPlaceholderHtml(info);
  }
  if (title) title.textContent = info.title || `Фото ${index + 1}`;
  if (cat) cat.textContent = info.category || 'Галерея';
  if (count) count.textContent = `${index + 1} / ${blocks.length}`;
  markActivePhotoBlock(section, block);
  return true;
}

function moveGalleryPreview(section, delta = 1) {
  if (!section) return false;
  const blocks = getVisiblePhotoBlocks(section);
  if (!blocks.length) return false;
  const currentIndex = Math.max(0, Math.min(blocks.length - 1, Number(section.dataset.galleryPreviewIndex || 0)));
  const nextIndex = (currentIndex + Number(delta || 0) + blocks.length) % blocks.length;
  return updateGalleryPreview(section, nextIndex);
}

function openGalleryCurrentPreview(section, mode = 'modal') {
  if (!section) return false;
  const blocks = getVisiblePhotoBlocks(section);
  if (!blocks.length) return false;
  const index = Math.max(0, Math.min(blocks.length - 1, Number(section.dataset.galleryPreviewIndex || 0)));
  return openGalleryOverlay(section, index, mode);
}

function isEditableTarget(target) {
  try {
    return !!target?.closest?.('[contenteditable="true"], [contenteditable=true], input, textarea, select');
  } catch (_) { return false; }
}

function shouldHandleGalleryKeyboard(section) {
  if (!section) return false;
  const mode = normalizePreviewMode(section.dataset.galleryPreviewMode || 'off');
  if (!(mode === 'left' || mode === 'right' || mode === 'top')) return false;
  const active = document.activeElement;
  if (active && active !== document.body && section.contains(active)) return true;
  if (section.classList.contains('is-active') || section.classList.contains('is-selected')) return true;
  if (section.querySelector('.is-gallery-preview-active')) return true;
  return false;
}

function setGalleryPreviewMode(section, modeValue = 'off', options = {}) {
  if (!section) return false;
  const mode = normalizePreviewMode(modeValue);
  const row = ensureGalleryPreviewRow(section);
  const gridRow = getGalleryGridRow(section);
  const menuRow = section.querySelector('.st-photo-gallery-menu-row');
  section.dataset.galleryPreviewMode = mode;
  section.classList.toggle('st-photo-gallery-preview-enabled', mode === 'left' || mode === 'right' || mode === 'top');
  section.classList.toggle('st-photo-gallery-preview-side', mode === 'left' || mode === 'right');
  section.classList.toggle('st-photo-gallery-preview-left', mode === 'left');
  section.classList.toggle('st-photo-gallery-preview-right', mode === 'right');
  section.classList.toggle('st-photo-gallery-preview-top', mode === 'top');
  section.classList.toggle('st-photo-gallery-preview-modal-mode', mode === 'modal');
  section.classList.toggle('st-photo-gallery-preview-fullscreen-mode', mode === 'fullscreen');

  if (mode === 'off' || mode === 'modal' || mode === 'fullscreen') {
    if (row) row.style.display = 'none';
    section.style.display = '';
    section.style.gridTemplateColumns = '';
    section.style.gridTemplateRows = '';
    section.style.gap = '';
    if (menuRow) {
      menuRow.style.gridColumn = '';
      menuRow.style.margin = '0 auto 22px';
      menuRow.style.maxWidth = '1220px';
    }
    if (gridRow) {
      gridRow.style.gridColumn = '';
      gridRow.style.margin = '0 auto';
      gridRow.style.maxWidth = gridRow.dataset.galleryLayout === 'random' ? '1280px' : '1220px';
    }
  } else if (mode === 'right' || mode === 'left') {
    section.style.display = 'grid';
    section.style.gridTemplateColumns = mode === 'right' ? 'minmax(0,1.12fr) minmax(320px,.72fr)' : 'minmax(320px,.72fr) minmax(0,1.12fr)';
    section.style.gridTemplateRows = 'auto minmax(360px,auto)';
    section.style.gap = '22px';
    if (menuRow) {
      menuRow.style.gridColumn = '1 / -1';
      menuRow.style.margin = '0';
      menuRow.style.maxWidth = 'none';
    }
    if (gridRow) {
      gridRow.style.gridColumn = mode === 'right' ? '1' : '2';
      gridRow.style.margin = '0';
      gridRow.style.maxWidth = 'none';
      gridRow.style.alignSelf = 'stretch';
    }
    if (row) {
      row.style.display = 'grid';
      row.style.gridColumn = mode === 'right' ? '2' : '1';
      row.style.margin = '0';
      row.style.maxWidth = 'none';
      row.style.alignSelf = 'stretch';
      row.querySelector('.st-photo-gallery-preview-block')?.style?.setProperty('min-height', '100%');
    }
    updateGalleryPreview(section, Number(section.dataset.galleryPreviewIndex || 0));
  } else if (mode === 'top') {
    section.style.display = '';
    section.style.gridTemplateColumns = '';
    section.style.gridTemplateRows = '';
    section.style.gap = '';
    if (menuRow) {
      menuRow.style.gridColumn = '';
      menuRow.style.margin = '0 auto 18px';
      menuRow.style.maxWidth = '1220px';
    }
    if (row) {
      row.style.display = 'grid';
      row.style.gridColumn = '';
      row.style.margin = '0 auto 16px';
      row.style.maxWidth = '1220px';
      row.querySelector('.st-photo-gallery-preview-block')?.style?.setProperty('min-height', '460px');
    }
    if (gridRow) {
      gridRow.style.gridColumn = '';
      gridRow.style.margin = '0 auto';
      gridRow.style.maxWidth = '1220px';
    }
    updateGalleryPreview(section, Number(section.dataset.galleryPreviewIndex || 0));
  }

  if (!options.silent) notifyChanged(`photo-gallery-preview-${mode}`);
  return true;
}

let __stPhotoGalleryOverlayState = null;
function ensureGalleryOverlay() {
  let overlay = document.getElementById('st-photo-gallery-preview-overlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'st-photo-gallery-preview-overlay';
  overlay.className = 'st-photo-gallery-preview-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <style>
      .st-photo-gallery-preview-overlay{position:fixed;inset:0;z-index:2147482500;display:grid;place-items:center;background:rgba(2,6,23,.74);backdrop-filter:blur(14px);padding:28px;box-sizing:border-box;}
      .st-photo-gallery-preview-overlay[hidden]{display:none!important;}
      .st-photo-gallery-preview-overlay.is-fullscreen{padding:0;background:rgba(2,6,23,.94);}
      .st-photo-gallery-preview-overlay__shell{position:relative;width:min(1120px,calc(100vw - 56px));height:min(760px,calc(100vh - 56px));border-radius:30px;overflow:hidden;background:#020617;border:1px solid rgba(125,211,252,.22);box-shadow:0 36px 110px rgba(0,0,0,.48);}
      .st-photo-gallery-preview-overlay.is-fullscreen .st-photo-gallery-preview-overlay__shell{width:100vw;height:100vh;border-radius:0;border:0;}
      .st-photo-gallery-preview-overlay__media{position:absolute;inset:0;display:grid;place-items:center;background:#020617;}
      .st-photo-gallery-preview-overlay__media img{width:100%;height:100%;object-fit:contain;display:block;}
      .st-photo-gallery-preview-overlay__caption{position:absolute;left:22px;right:22px;bottom:22px;padding:14px 16px;border-radius:20px;background:rgba(255,255,255,.86);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.72);color:#0f172a;display:grid;gap:4px;}
      .st-photo-gallery-preview-overlay__caption strong{font-size:17px;line-height:1.2;}
      .st-photo-gallery-preview-overlay__caption span{font-size:12px;font-weight:850;color:#475569;}
      .st-photo-gallery-preview-overlay__btn{position:absolute;z-index:2;display:grid;place-items:center;width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.38);background:rgba(255,255,255,.16);color:#fff;backdrop-filter:blur(10px);font-size:24px;font-weight:900;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.22);}
      .st-photo-gallery-preview-overlay__close{top:18px;right:18px;}
      .st-photo-gallery-preview-overlay__prev{top:50%;left:18px;transform:translateY(-50%);}
      .st-photo-gallery-preview-overlay__next{top:50%;right:18px;transform:translateY(-50%);}
      .st-photo-gallery-preview-overlay__counter{position:absolute;top:18px;left:18px;z-index:2;padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.34);color:#fff;font-size:12px;font-weight:900;backdrop-filter:blur(10px);}
      .st-photo-gallery-preview-overlay__hint{position:absolute;top:18px;left:50%;transform:translateX(-50%);z-index:2;padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:11px;font-weight:900;letter-spacing:.04em;backdrop-filter:blur(10px);}
      .st-photo-gallery-preview-overlay.is-swipe-left .st-photo-gallery-preview-overlay__shell{animation:stPgSwipeLeft .18s ease;}
      .st-photo-gallery-preview-overlay.is-swipe-right .st-photo-gallery-preview-overlay__shell{animation:stPgSwipeRight .18s ease;}
      @keyframes stPgSwipeLeft{0%{transform:translateX(0)}50%{transform:translateX(-14px)}100%{transform:translateX(0)}}
      @keyframes stPgSwipeRight{0%{transform:translateX(0)}50%{transform:translateX(14px)}100%{transform:translateX(0)}}
    </style>
    <div class="st-photo-gallery-preview-overlay__shell" role="dialog" aria-modal="true" aria-label="Перегляд фото">
      <button type="button" class="st-photo-gallery-preview-overlay__btn st-photo-gallery-preview-overlay__close" data-pg-overlay="close" aria-label="Закрити">×</button>
      <button type="button" class="st-photo-gallery-preview-overlay__btn st-photo-gallery-preview-overlay__prev" data-pg-overlay="prev" aria-label="Попереднє">‹</button>
      <button type="button" class="st-photo-gallery-preview-overlay__btn st-photo-gallery-preview-overlay__next" data-pg-overlay="next" aria-label="Наступне">›</button>
      <div class="st-photo-gallery-preview-overlay__counter" data-pg-overlay-counter>1 / 1</div>
      <div class="st-photo-gallery-preview-overlay__hint">ESC · ← / → · Swipe</div>
      <div class="st-photo-gallery-preview-overlay__media" data-pg-overlay-media></div>
      <div class="st-photo-gallery-preview-overlay__caption"><strong data-pg-overlay-title>Фото</strong><span data-pg-overlay-category>Категорія</span></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (ev) => {
    const act = ev.target?.closest?.('[data-pg-overlay]')?.dataset?.pgOverlay;
    if (!act) {
      if (ev.target === overlay) closeGalleryOverlay();
      return;
    }
    ev.preventDefault();
    if (act === 'close') closeGalleryOverlay();
    if (act === 'prev') moveGalleryOverlay(-1);
    if (act === 'next') moveGalleryOverlay(1);
  });
  let sx = 0;
  let sy = 0;
  let st = 0;
  overlay.addEventListener('touchstart', (ev) => {
    const t = ev.touches && ev.touches[0];
    if (!t) return;
    sx = t.clientX;
    sy = t.clientY;
    st = Date.now();
  }, { passive: true });
  overlay.addEventListener('touchend', (ev) => {
    const t = ev.changedTouches && ev.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    const dt = Date.now() - st;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.2 || dt > 900) return;
    ev.preventDefault?.();
    const dir = dx < 0 ? 1 : -1;
    overlay.classList.remove('is-swipe-left', 'is-swipe-right');
    overlay.classList.add(dir > 0 ? 'is-swipe-left' : 'is-swipe-right');
    setTimeout(() => overlay.classList.remove('is-swipe-left', 'is-swipe-right'), 220);
    moveGalleryOverlay(dir);
  }, { passive: false });
  return overlay;
}

function renderGalleryOverlay() {
  const state = __stPhotoGalleryOverlayState;
  if (!state?.section) return;
  const overlay = ensureGalleryOverlay();
  const blocks = getVisiblePhotoBlocks(state.section);
  if (!blocks.length) return closeGalleryOverlay();
  state.index = Math.max(0, Math.min(blocks.length - 1, state.index || 0));
  const block = blocks[state.index];
  const info = photoInfoFromBlock(block, state.index);
  overlay.classList.toggle('is-fullscreen', state.mode === 'fullscreen');
  overlay.hidden = false;
  const media = overlay.querySelector('[data-pg-overlay-media]');
  const title = overlay.querySelector('[data-pg-overlay-title]');
  const cat = overlay.querySelector('[data-pg-overlay-category]');
  const counter = overlay.querySelector('[data-pg-overlay-counter]');
  if (media) media.innerHTML = info.src ? `<img src="${esc(info.src)}" alt="${esc(info.title)}">` : previewPlaceholderHtml(info);
  if (title) title.textContent = info.title || `Фото ${state.index + 1}`;
  if (cat) cat.textContent = info.category || 'Галерея';
  if (counter) counter.textContent = `${state.index + 1} / ${blocks.length}`;
  markActivePhotoBlock(state.section, block);
}

function openGalleryOverlay(section, blockOrIndex = 0, mode = 'modal') {
  if (!section) return false;
  const blocks = getVisiblePhotoBlocks(section);
  if (!blocks.length) return false;
  let index = 0;
  if (blockOrIndex instanceof HTMLElement) index = Math.max(0, blocks.indexOf(blockOrIndex));
  else index = Math.max(0, Math.min(blocks.length - 1, Number(blockOrIndex || 0)));
  __stPhotoGalleryOverlayState = { section, index, mode: normalizePreviewMode(mode) === 'fullscreen' ? 'fullscreen' : 'modal' };
  renderGalleryOverlay();
  return true;
}

function closeGalleryOverlay() {
  const overlay = document.getElementById('st-photo-gallery-preview-overlay');
  if (overlay) overlay.hidden = true;
  __stPhotoGalleryOverlayState = null;
}

function moveGalleryOverlay(delta = 1) {
  const state = __stPhotoGalleryOverlayState;
  if (!state?.section) return;
  const blocks = getVisiblePhotoBlocks(state.section);
  if (!blocks.length) return;
  state.index = (Number(state.index || 0) + Number(delta || 0) + blocks.length) % blocks.length;
  renderGalleryOverlay();
}

function bindGalleryPreviewOnce() {
  if (window.__ST_PHOTO_GALLERY_PREVIEW_00357__) return;
  window.__ST_PHOTO_GALLERY_PREVIEW_00357__ = true;
  document.addEventListener('click', (ev) => {
    const block = ev.target?.closest?.('.st-photo-gallery-image-block');
    if (!block) return;
    if (ev.target?.closest?.('[contenteditable="true"], [contenteditable=true], button, a, input, textarea, select')) return;
    const section = block.closest('.st-photo-gallery-section');
    if (!section) return;
    const mode = normalizePreviewMode(section.dataset.galleryPreviewMode || 'off');
    if (mode === 'off') return;
    ev.preventDefault();
    ev.stopPropagation();
    if (mode === 'modal' || mode === 'fullscreen') openGalleryOverlay(section, block, mode);
    else updateGalleryPreview(section, block);
    selectElement(block, 'block');
  }, true);
  document.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('[data-pg-preview-nav]');
    if (!btn) return;
    const section = btn.closest('.st-photo-gallery-section');
    if (!section) return;
    ev.preventDefault();
    ev.stopPropagation();
    moveGalleryPreview(section, btn.dataset.pgPreviewNav === 'prev' ? -1 : 1);
    selectElement(section, 'section');
  }, true);

  document.addEventListener('keydown', (ev) => {
    if (isEditableTarget(ev.target)) return;
    if (__stPhotoGalleryOverlayState) {
      if (ev.key === 'Escape') { ev.preventDefault(); closeGalleryOverlay(); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); moveGalleryOverlay(-1); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); moveGalleryOverlay(1); }
      return;
    }
    const section = findActiveGallerySection();
    if (!shouldHandleGalleryKeyboard(section)) return;
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); moveGalleryPreview(section, -1); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); moveGalleryPreview(section, 1); }
    if (ev.key === 'Enter') {
      const mode = normalizePreviewMode(section.dataset.galleryPreviewMode || 'off');
      if (mode === 'left' || mode === 'right' || mode === 'top') { ev.preventDefault(); openGalleryCurrentPreview(section, 'modal'); }
    }
  }, true);

  let psx = 0;
  let psy = 0;
  let pst = 0;
  document.addEventListener('touchstart', (ev) => {
    const preview = ev.target?.closest?.('.st-photo-gallery-preview-block');
    if (!preview) return;
    const t = ev.touches && ev.touches[0];
    if (!t) return;
    psx = t.clientX;
    psy = t.clientY;
    pst = Date.now();
  }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    const preview = ev.target?.closest?.('.st-photo-gallery-preview-block');
    if (!preview) return;
    const section = preview.closest('.st-photo-gallery-section');
    if (!section) return;
    const t = ev.changedTouches && ev.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - psx;
    const dy = t.clientY - psy;
    const dt = Date.now() - pst;
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.2 || dt > 900) return;
    ev.preventDefault?.();
    moveGalleryPreview(section, dx < 0 ? 1 : -1);
  }, { passive: false });
}


function queuePhotoGalleryFlowGuard(section) {
  // [00391][PHOTO GALLERY FLOW GUARD]
  // Коли site-root працює як flex-column для sticky-bottom футера, важкі grid-галереї
  // не повинні shrink-итись. Інакше футер піднімається поверх галереї, а фото йдуть під ним.
  if (!(section instanceof HTMLElement)) return;
  const run = () => {
    try {
      if (!section.isConnected) return;
      const secRect = section.getBoundingClientRect();
      if (!secRect || !Number.isFinite(secRect.top)) return;
      let maxBottom = 0;
      section.querySelectorAll('.st-photo-gallery-menu-row,.st-photo-gallery-preview-row,.st-photo-gallery-grid-row,.st-photo-gallery-image-block').forEach((node) => {
        if (!(node instanceof HTMLElement) || node.hidden || node.style.display === 'none') return;
        const r = node.getBoundingClientRect();
        if (r && Number.isFinite(r.bottom)) maxBottom = Math.max(maxBottom, r.bottom - secRect.top);
      });
      const cs = window.getComputedStyle ? getComputedStyle(section) : null;
      const padBottom = cs ? (parseFloat(cs.paddingBottom || '0') || 0) : 0;
      const needed = Math.ceil(maxBottom + padBottom);
      if (needed > 0) section.style.minHeight = `${needed}px`;
      section.dataset.galleryFlowGuard = PG_LAYOUT_STAGE;
    } catch (_) {}
  };
  try { requestAnimationFrame(() => { run(); requestAnimationFrame(run); }); }
  catch (_) { setTimeout(run, 0); }
}

function protectPhotoGallerySectionFlow(section) {
  if (!(section instanceof HTMLElement)) return;
  section.classList.add('st-photo-gallery-section');
  section.dataset.gallerySection = 'photo-gallery';
  section.dataset.galleryVersion = PG_LAYOUT_STAGE;
  section.style.flexShrink = '0';
  section.style.height = 'auto';
  section.style.position = section.style.position || 'relative';
  section.style.boxSizing = 'border-box';
  queuePhotoGalleryFlowGuard(section);
}

function lockPhotoGalleryRows(section) {
  // [00391][PHOTO GALLERY GRID LOCK]
  protectPhotoGallerySectionFlow(section);
  // [00390][PHOTO GALLERY GRID LOCK]
  // Фотогалерея має власні CSS-grid рядки. Не даємо стандартному FR-reflow
  // перетворювати фото на один довгий ряд вузьких колонок.
  if (!section) return;
  section.querySelectorAll?.('.st-row[data-gallery-row]').forEach((row) => {
    if (!(row instanceof HTMLElement)) return;
    const kind = String(row.dataset.galleryRow || '').toLowerCase();
    if (kind === 'grid') {
      row.dataset.layoutMode = PG_GRID_LAYOUT_MODE;
      row.dataset.galleryGridMode = '1';
      try { delete row.dataset.frs; } catch (_) {}
      row.style.display = 'grid';
      row.style.gridAutoFlow = 'dense';
      row.style.alignItems = 'stretch';
      row.style.boxSizing = 'border-box';
    } else if (kind === 'layout' || kind === 'preview-layout') {
      row.dataset.layoutMode = 'photo-gallery-layout';
      row.dataset.galleryGridMode = '1';
      try { delete row.dataset.frs; } catch (_) {}
    } else if (kind === 'preview') {
      row.dataset.layoutMode = 'photo-gallery-preview';
      row.dataset.galleryGridMode = '1';
    } else if (kind === 'menu') {
      row.dataset.layoutMode = 'photo-gallery-menu';
      row.dataset.galleryGridMode = '1';
    }
  });
}

function repairPhotoGalleryLayout(section, options = {}) {
  if (!section) return false;
  lockPhotoGalleryRows(section);
  const row = getGalleryGridRow(section);
  if (!row) return false;
  const mode = normalizeLayoutMode(section.dataset.galleryLayout || row.dataset.galleryLayout || 'bento');
  const cfg = GALLERY_LAYOUTS[mode] || GALLERY_LAYOUTS.bento;
  row.dataset.layoutMode = PG_GRID_LAYOUT_MODE;
  row.dataset.galleryGridMode = '1';
  row.dataset.galleryLayout = mode;
  row.dataset.galleryGridTemplate = cfg.grid;
  row.dataset.galleryAutoRows = cfg.autoRows;
  try { delete row.dataset.frs; } catch (_) {}
  row.style.display = 'grid';
  row.style.gridTemplateColumns = cfg.grid;
  row.style.gridAutoRows = cfg.autoRows;
  row.style.gap = cfg.gap;
  row.style.gridAutoFlow = 'dense';
  row.style.alignItems = 'stretch';
  row.style.maxWidth = mode === 'random' ? '1280px' : '1220px';
  row.style.width = '100%';
  getPhotoBlocks(section).forEach((block) => {
    if (!(block instanceof HTMLElement)) return;
    block.style.width = '100%';
    block.style.minWidth = '0';
    block.style.maxWidth = '100%';
    block.style.height = '100%';
    block.style.overflow = 'hidden';
    block.style.alignSelf = 'stretch';
    block.style.justifySelf = 'stretch';
    const inner = block.querySelector('.st-photo-gallery-photo');
    if (inner instanceof HTMLElement) {
      inner.style.width = '100%';
      inner.style.height = '100%';
      inner.style.minHeight = '0';
    }
  });
  if (!options.skipSpans) {
    applyGalleryLayout(section, mode, { silent: true, preserveSelection: true });
  }
  applyGalleryCaptionSettings(section, getGalleryCaptionSettings(section), { skipNotify: true });
  protectPhotoGallerySectionFlow(section);
  return true;
}

function repairAllPhotoGalleries(options = {}) {
  const root = getSiteRoot();
  if (!root) return 0;
  let count = 0;
  root.querySelectorAll('.st-photo-gallery-section, .st-section[data-gallery-section="photo-gallery"]').forEach((section) => {
    if (repairPhotoGalleryLayout(section, options)) count += 1;
  });
  if (count && !options.silentNotify) {
    try { window.dispatchEvent(new CustomEvent('st:photo-gallery:layout-repaired', { detail: { count, stage: PG_LAYOUT_STAGE } })); } catch (_) {}
  }
  return count;
}

function ensurePhotoBlockCount(section, count) {
  const row = getGalleryGridRow(section);
  if (!row) return [];
  const blocks = getPhotoBlocks(section);
  const start = blocks.length + 1;
  for (let i = start; i <= count; i += 1) {
    row.appendChild(makePhotoBlock(i));
  }
  return getPhotoBlocks(section);
}

function replaceGalleryBlocksWithAssets(section, assets = []) {
  const row = getGalleryGridRow(section);
  if (!row) return [];
  row.innerHTML = '';
  row.dataset.layoutMode = PG_GRID_LAYOUT_MODE;
  row.dataset.galleryGridMode = '1';
  try { delete row.dataset.frs; } catch (_) {}
  assets.forEach((asset, idx) => row.appendChild(makePhotoBlock(idx + 1, asset)));
  section.dataset.galleryExactPhotoCount = String(assets.length);
  section.dataset.galleryUsesAssets = '1';
  section.dataset.galleryAssetSource = 'asset-gallery';
  applyGalleryCaptionSettings(section, getGalleryCaptionSettings(section), { skipNotify: true });
  setTimeout(() => hydrateGalleryPhotoAssets(section, { skipNotify: true }), 40);
  return getPhotoBlocks(section);
}

function resetGalleryBlockLayoutStyles(block) {
  if (!block) return;
  block.style.gridColumn = '';
  block.style.gridRow = '';
  block.style.minHeight = '160px';
  block.style.height = '100%';
  block.style.overflow = 'hidden';
  block.style.alignSelf = 'stretch';
  block.style.justifySelf = 'stretch';
  const inner = block.querySelector('.st-photo-gallery-photo');
  if (inner) { inner.style.minHeight = '0'; inner.style.height = '100%'; }
}

function setGalleryBlockSpan(block, colSpan = 1, rowSpan = 1, minHeight = '') {
  if (!block) return;
  block.style.gridColumn = `span ${Math.max(1, Number(colSpan) || 1)}`;
  block.style.gridRow = `span ${Math.max(1, Number(rowSpan) || 1)}`;
  block.style.minHeight = minHeight || '160px';
  block.style.height = '100%';
  block.style.overflow = 'hidden';
  block.style.alignSelf = 'stretch';
  block.style.justifySelf = 'stretch';
  const inner = block.querySelector('.st-photo-gallery-photo');
  if (inner) { inner.style.minHeight = '0'; inner.style.height = '100%'; }
}

function applyGalleryResponsiveCss(section) {
  if (!section || section.querySelector('style[data-photo-gallery-responsive-css="00392"]')) return;
  const style = document.createElement('style');
  style.dataset.photoGalleryResponsiveCss = PG_LAYOUT_STAGE;
  style.textContent = `
    .st-photo-gallery-section{flex:0 0 auto!important;flex-shrink:0!important;height:auto!important;position:relative!important;box-sizing:border-box!important;}
    .st-photo-gallery-section .st-photo-gallery-grid-row{grid-auto-flow:dense;position:relative!important;}
    .st-photo-gallery-section .st-photo-gallery-grid-row{display:grid!important;grid-auto-flow:dense!important;align-items:stretch!important;}
    .st-photo-gallery-section .st-photo-gallery-grid-row > .st-photo-gallery-image-block{width:100%!important;max-width:100%!important;min-width:0!important;height:100%!important;overflow:hidden!important;align-self:stretch!important;justify-self:stretch!important;}
    .st-photo-gallery-section .st-photo-gallery-image-block > .st-photo-gallery-photo{height:100%!important;min-height:0!important;}
    .st-photo-gallery-section .st-photo-gallery-preview-row{transition:opacity .18s ease, transform .18s ease;}
    .st-photo-gallery-section .st-photo-gallery-image-block.is-gallery-preview-active .st-photo-gallery-photo{box-shadow:0 20px 60px rgba(37,99,235,.24)!important;}
    .st-photo-gallery-section.st-photo-gallery-preview-side .st-photo-gallery-preview-block{height:100%;}
    @media (max-width: 1120px){
      .st-photo-gallery-section.st-photo-gallery-preview-side{display:block!important;}
      .st-photo-gallery-section.st-photo-gallery-preview-side .st-photo-gallery-menu-row,
      .st-photo-gallery-section.st-photo-gallery-preview-side .st-photo-gallery-preview-row,
      .st-photo-gallery-section.st-photo-gallery-preview-side .st-photo-gallery-grid-row{max-width:1220px!important;margin-left:auto!important;margin-right:auto!important;}
      .st-photo-gallery-section.st-photo-gallery-preview-side .st-photo-gallery-preview-row{margin-bottom:16px!important;}
      .st-photo-gallery-section.st-photo-gallery-preview-side .st-photo-gallery-preview-block{min-height:380px!important;}
    }
    .st-photo-gallery-section[data-gallery-layout="masonry"] .st-photo-gallery-image-block,
    .st-photo-gallery-section[data-gallery-layout="random"] .st-photo-gallery-image-block,
    .st-photo-gallery-section[data-gallery-layout="bento"] .st-photo-gallery-image-block{align-self:stretch;}
    @media (max-width: 980px){
      .st-photo-gallery-section .st-photo-gallery-grid-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:180px!important;}
      .st-photo-gallery-section .st-photo-gallery-image-block{grid-column:span 1!important;grid-row:span 1!important;}
    }
    @media (max-width: 620px){
      .st-photo-gallery-section{padding:34px 16px!important;}
      .st-photo-gallery-section .st-photo-gallery-grid-row{grid-template-columns:1fr!important;grid-auto-rows:220px!important;gap:14px!important;}
      .st-photo-gallery-section .st-photo-gallery-image-block{grid-column:span 1!important;grid-row:span 1!important;}
    }
  `;
  section.insertBefore(style, section.firstChild);
}

function applyGalleryLayout(section, layoutMode = 'bento', options = {}) {
  if (!section) return false;
  const mode = normalizeLayoutMode(layoutMode);
  const cfg = GALLERY_LAYOUTS[mode] || GALLERY_LAYOUTS.bento;
  const row = getGalleryGridRow(section);
  if (!row) return false;
  const exactCount = Math.max(0, Number(section.dataset.galleryExactPhotoCount || 0));
  const blocks = ensurePhotoBlockCount(section, exactCount > 0 ? exactCount : cfg.min);
  section.dataset.galleryLayout = mode;
  section.dataset.galleryLayoutLabel = cfg.label;
  section.dataset.galleryVersion = PG_LAYOUT_STAGE;
  row.dataset.galleryLayout = mode;
  row.dataset.layoutMode = PG_GRID_LAYOUT_MODE;
  row.dataset.galleryGridMode = '1';
  row.dataset.galleryGridTemplate = cfg.grid;
  row.dataset.galleryAutoRows = cfg.autoRows;
  try { delete row.dataset.frs; } catch (_) {}
  row.style.display = 'grid';
  row.style.gridTemplateColumns = cfg.grid;
  row.style.gridAutoRows = cfg.autoRows;
  row.style.gap = cfg.gap;
  row.style.alignItems = 'stretch';
  row.style.gridAutoFlow = 'dense';
  row.style.maxWidth = mode === 'random' ? '1280px' : '1220px';
  applyGalleryResponsiveCss(section);
  lockPhotoGalleryRows(section);

  blocks.forEach(resetGalleryBlockLayoutStyles);

  if (cfg.mode === 'equal') {
    blocks.forEach((block) => setGalleryBlockSpan(block, 1, 1, cfg.autoRows));
  } else if (cfg.mode === 'bento') {
    const pattern = [
      [2, 2], [1, 1], [1, 1],
      [1, 1], [1, 1], [2, 1],
      [1, 1], [1, 1], [1, 1], [1, 1]
    ];
    blocks.forEach((block, idx) => {
      const [c, r] = pattern[idx % pattern.length];
      setGalleryBlockSpan(block, c, r, `${150 * r + 18 * (r - 1)}px`);
    });
  } else if (cfg.mode === 'masonry') {
    const heights = [6, 4, 7, 5, 4, 8, 5, 6, 4, 7, 5, 4, 6, 8, 5, 4];
    blocks.forEach((block, idx) => {
      const rows = heights[idx % heights.length];
      setGalleryBlockSpan(block, 1, rows, `${rows * 44 + Math.max(0, rows - 1) * 16}px`);
    });
  } else if (cfg.mode === 'random') {
    const pattern = [
      [2, 2], [1, 1], [1, 2], [2, 1],
      [1, 1], [2, 2], [1, 1], [1, 1],
      [3, 1], [1, 2], [2, 1], [1, 1]
    ];
    blocks.forEach((block, idx) => {
      const [c, r] = pattern[idx % pattern.length];
      setGalleryBlockSpan(block, c, r, `${88 * r + 16 * (r - 1)}px`);
    });
  }

  // Після перебудови не міняємо активний фільтр: приховані категорії лишаються прихованими.
  applyGalleryFilter(section, section.dataset.galleryActiveFilter || 'all', { skipNotify: true });
  protectPhotoGallerySectionFlow(section);
  if (!options.silent) notifyChanged(`photo-gallery-layout-${mode}`);
  if (!options.preserveSelection) selectElement(section, 'section');
  return true;
}

function getBlockCategorySlug(block) {
  const own = block?.dataset?.galleryCategory || block?.dataset?.galleryCategorySlug || '';
  if (own) return normalizeCategorySlug(own);
  const inner = block?.querySelector?.('[data-photo-category-slug], [data-photo-category]');
  return normalizeCategorySlug(inner?.dataset?.photoCategorySlug || inner?.dataset?.photoCategory || '');
}

function updateMenuActiveState(section, filterSlug) {
  const slug = normalizeCategorySlug(filterSlug || 'all');
  const menu = section?.querySelector?.('[data-photo-gallery-menu="1"]');
  if (!menu) return;
  menu.dataset.galleryActiveFilter = slug;
  section.dataset.galleryActiveFilter = slug;
  menu.querySelectorAll('.st-photo-gallery-menu__item').forEach((btn) => {
    const btnSlug = normalizeCategorySlug(btn.dataset.galleryFilterSlug || btn.dataset.galleryFilter || btn.textContent || '');
    const active = btnSlug === slug || (slug === 'all' && btnSlug === 'all');
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function applyGalleryFilter(section, filterSlug = 'all', options = {}) {
  if (!section) return false;
  const slug = normalizeCategorySlug(filterSlug || 'all');
  let visibleCount = 0;
  let totalCount = 0;
  getPhotoBlocks(section).forEach((block) => {
    totalCount += 1;
    const blockSlug = getBlockCategorySlug(block);
    const show = slug === 'all' || blockSlug === slug;
    block.hidden = !show;
    block.style.display = show ? '' : 'none';
    block.dataset.galleryVisible = show ? '1' : '0';
    if (show) visibleCount += 1;
  });
  updateMenuActiveState(section, slug);
  const previewMode = normalizePreviewMode(section.dataset.galleryPreviewMode || 'off');
  if (previewMode === 'left' || previewMode === 'right' || previewMode === 'top') {
    updateGalleryPreview(section, 0);
  }
  section.dataset.galleryVisibleCount = String(visibleCount);
  section.dataset.galleryTotalCount = String(totalCount);
  try {
    section.dispatchEvent(new CustomEvent('st:photo-gallery:filter-applied', {
      bubbles: true,
      detail: { filter: slug, label: categoryLabelBySlug(slug), visibleCount, totalCount }
    }));
  } catch (_) {}
  if (!options.skipNotify) notifyChanged('photo-gallery-filter');
  return true;
}

function syncGalleryMenuCategories(section) {
  if (!section) return false;
  const menu = section.querySelector('[data-photo-gallery-menu="1"]');
  if (!menu) return false;

  const existing = new Set(Array.from(menu.querySelectorAll('[data-gallery-filter-slug]')).map((btn) => normalizeCategorySlug(btn.dataset.galleryFilterSlug)));
  const found = new Map();
  getPhotoBlocks(section).forEach((block) => {
    const slug = getBlockCategorySlug(block);
    if (!slug || slug === 'all') return;
    const label = block.dataset.galleryCategoryLabel || categoryLabelBySlug(slug);
    found.set(slug, label);
  });

  found.forEach((label, slug) => {
    if (existing.has(slug)) return;
    const btn = document.createElement('button');
    btn.className = 'st-photo-gallery-menu__item';
    btn.type = 'button';
    btn.dataset.galleryFilter = label;
    btn.dataset.galleryFilterSlug = slug;
    btn.setAttribute('contenteditable', 'true');
    btn.setAttribute('spellcheck', 'false');
    btn.setAttribute('style', 'appearance:none;border:1px solid rgba(15,23,42,.10);border-radius:999px;background:#ffffff;color:#334155;padding:9px 14px;font-size:13px;font-weight:900;box-shadow:0 8px 18px rgba(15,23,42,.06);cursor:pointer;white-space:nowrap;');
    btn.textContent = label;
    menu.appendChild(btn);
  });

  applyGalleryFilter(section, section.dataset.galleryActiveFilter || 'all');
  return true;
}

function bindGalleryFilteringOnce() {
  if (window.__ST_PHOTO_GALLERY_FILTERING_00356__) return;
  window.__ST_PHOTO_GALLERY_FILTERING_00356__ = true;
  document.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('.st-photo-gallery-menu__item');
    if (!btn) return;
    const section = btn.closest('.st-photo-gallery-section');
    if (!section) return;
    // Якщо користувач редагує текст кнопки меню, подвійний клік/виділення не ламаємо,
    // але звичайний клік працює як фільтр.
    ev.preventDefault();
    ev.stopPropagation();
    const slug = normalizeCategorySlug(btn.dataset.galleryFilterSlug || btn.dataset.galleryFilter || btn.textContent || 'all');
    applyGalleryFilter(section, slug);
    selectElement(section, 'section');
  }, true);
}



function parsePhotoGallerySectionFromHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = String(html || '').trim();
  return tmp.querySelector('.st-photo-gallery-section, .st-section[data-gallery-section="photo-gallery"], .st-section[data-sec-role="photo-gallery-section"]') || null;
}

function collectGalleryAssets(section) {
  return getPhotoBlocks(section).map((block, idx) => {
    const inner = block.querySelector('.st-photo-gallery-photo');
    const img = inner?.querySelector?.('img');
    const url = block.dataset.galleryAssetUrl || inner?.dataset?.photoSrc || img?.getAttribute?.('src') || '';
    const path = block.dataset.galleryAssetPath || inner?.dataset?.photoPath || '';
    const name = block.dataset.galleryAssetName || inner?.dataset?.photoName || img?.getAttribute?.('alt') || `Фото ${idx + 1}`;
    const folderId = block.dataset.galleryFolderId || '';
    const folderName = block.dataset.galleryCategoryLabel || inner?.dataset?.photoCategory || '';
    const slug = block.dataset.galleryCategory || inner?.dataset?.photoCategorySlug || '';
    return {
      itemId: block.dataset.galleryAssetId || `kept_${idx + 1}`,
      name,
      url: url || path,
      path,
      mime: 'image/*',
      folderId,
      folderName: folderName || categoryLabelBySlug(slug),
      cat: 'images'
    };
  }).filter((item) => item.url || item.name);
}

function regenerateGalleryChildIds(section) {
  if (!section) return;
  section.querySelectorAll('[data-uid]').forEach((el) => {
    if (el instanceof HTMLElement) el.dataset.uid = uid(el.classList.contains('st-row') ? 'pgr' : 'pgb');
  });
}


function isProbablyDeadBlobUrl(url) {
  return /^blob:/i.test(String(url || '').trim());
}

async function resolveGalleryAssetById(itemId, folderId = '') {
  const id = String(itemId || '').trim();
  if (!id) return null;
  const folders = [];
  const push = (v) => {
    const val = String(v || '').trim();
    if (val && !folders.includes(val)) folders.push(val);
  };
  push(folderId);
  GALLERY_CATEGORIES.forEach((cat) => push(cat.folderId));
  push('sys_photo_gallery');
  for (const fid of folders) {
    try {
      const items = await galListItems('images', fid);
      const found = (items || []).find((item) => String(item?.id || item?.itemId || '') === id);
      if (found) return { item: found, folderId: fid };
    } catch (_) {}
  }
  return null;
}

async function hydratePhotoBlockAsset(block, options = {}) {
  if (!(block instanceof HTMLElement)) return false;
  const inner = block.querySelector('.st-photo-gallery-photo');
  if (!(inner instanceof HTMLElement)) return false;
  let img = inner.querySelector('img');
  const itemId = block.dataset.galleryAssetId || inner.dataset.photoItemId || '';
  const folderId = block.dataset.galleryFolderId || inner.dataset.photoFolderId || '';
  const storedUrl = block.dataset.galleryAssetUrl || inner.dataset.photoSrc || img?.getAttribute?.('src') || '';
  const storedPath = block.dataset.galleryAssetPath || inner.dataset.photoPath || '';

  // Якщо URL звичайний і картинка вже є, нічого не чіпаємо.
  if (storedUrl && !isProbablyDeadBlobUrl(storedUrl) && img && img.getAttribute('src')) return false;

  let nextUrl = storedPath && !isProbablyDeadBlobUrl(storedPath) ? storedPath : '';
  let found = null;
  if (itemId) found = await resolveGalleryAssetById(itemId, folderId);
  if (found?.item) {
    const made = galMakeObjectUrl(found.item) || found.item.url || found.item.path || '';
    if (made) nextUrl = made;
    block.dataset.galleryAssetId = String(found.item.id || itemId);
    block.dataset.galleryFolderId = String(found.item.folderId || found.folderId || folderId || '');
    block.dataset.galleryAssetName = String(block.dataset.galleryAssetName || found.item.name || '');
    if (found.item.path || found.item.url) block.dataset.galleryAssetPath = String(found.item.path || found.item.url || '');
    inner.dataset.photoItemId = String(found.item.id || itemId);
    inner.dataset.photoFolderId = String(found.item.folderId || found.folderId || folderId || '');
  }
  if (!nextUrl) return false;

  block.dataset.galleryAssetUrl = nextUrl;
  inner.dataset.photoSrc = nextUrl;
  if (!img) {
    img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = block.dataset.galleryAssetName || inner.dataset.photoName || 'Фото';
    img.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;');
    inner.insertBefore(img, inner.firstChild);
  }
  img.src = nextUrl;
  if (!img.alt) img.alt = block.dataset.galleryAssetName || inner.dataset.photoName || 'Фото';
  return true;
}

async function hydrateGalleryPhotoAssets(section, options = {}) {
  if (!(section instanceof HTMLElement)) return 0;
  let changed = 0;
  const blocks = getPhotoBlocks(section);
  for (const block of blocks) {
    try {
      if (await hydratePhotoBlockAsset(block, options)) changed += 1;
    } catch (_) {}
  }
  if (changed) {
    section.dataset.galleryAssetsHydrated = PG_LAYOUT_STAGE;
    repairPhotoGalleryLayout(section, { silentNotify: true, skipSpans: true });
    protectPhotoGallerySectionFlow(section);
    if (!options.skipNotify) notifyChanged('photo-gallery-assets-hydrated');
  }
  return changed;
}

function hydrateAllPhotoGalleryAssets(options = {}) {
  const root = getSiteRoot();
  if (!root) return Promise.resolve(0);
  const galleries = Array.from(root.querySelectorAll('.st-photo-gallery-section, .st-section[data-gallery-section="photo-gallery"]'));
  return Promise.all(galleries.map((section) => hydrateGalleryPhotoAssets(section, { ...options, skipNotify: true })))
    .then((items) => {
      const count = items.reduce((sum, n) => sum + (Number(n) || 0), 0);
      if (count && !options.skipNotify) notifyChanged('photo-gallery-all-assets-hydrated');
      return count;
    })
    .catch(() => 0);
}



function normalizeCaptionMode(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['off', 'hidden', 'hide', 'none', 'вимкнути', 'вимкнено', 'без назви'].includes(raw)) return 'off';
  if (['hover', 'on-hover', 'при наведенні', 'наведення'].includes(raw)) return 'hover';
  return 'show';
}

function normalizeCaptionPosition(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['above', 'top', 'над фото', 'над'].includes(raw)) return 'above';
  if (['below', 'bottom', 'під фото', 'під'].includes(raw)) return 'below';
  return 'inside';
}

function normalizeCaptionBox(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'none' || raw === 'no-box' || raw === 'без блока') return '0';
  return '1';
}

function readCaptionBackup() {
  try {
    const raw = localStorage.getItem(PG_CAPTION_EDIT_BACKUP_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === 'object' ? data : null;
  } catch (_) { return null; }
}

function writeCaptionBackup(data) {
  try { localStorage.setItem(PG_CAPTION_EDIT_BACKUP_KEY, JSON.stringify(data || {})); } catch (_) {}
}

function clearCaptionEditState() {
  try { localStorage.removeItem(PG_CAPTION_EDIT_BACKUP_KEY); } catch (_) {}
  stopCaptionStyleMirror();
}

function isCaptionEditPending() {
  const b = readCaptionBackup();
  return !!(b && b.pending && b.targetUid && b.originalOuterHTML);
}

function getGalleryCaptionSettings(section) {
  return {
    mode: normalizeCaptionMode(section?.dataset?.galleryCaptionMode || 'show'),
    position: normalizeCaptionPosition(section?.dataset?.galleryCaptionPosition || 'inside'),
    box: normalizeCaptionBox(section?.dataset?.galleryCaptionBox || '1')
  };
}

function getCaptionBlocks(section) {
  return Array.from(section?.querySelectorAll?.('.st-photo-gallery-caption') || []);
}

function getDefaultCaptionText(block, index = 0) {
  const inner = block?.querySelector?.('.st-photo-gallery-photo');
  const name = block?.dataset?.galleryAssetName || inner?.dataset?.photoName || `Фото ${index + 1}`;
  const category = block?.dataset?.galleryCategoryLabel || inner?.dataset?.photoCategory || '';
  return `${name}${category ? ` · ${category}` : ''}`;
}

function ensureCaptionForBlock(block, index = 0) {
  if (!(block instanceof HTMLElement)) return null;
  let caption = block.querySelector('.st-photo-gallery-caption');
  if (!(caption instanceof HTMLElement)) {
    caption = document.createElement('div');
    caption.className = 'st-photo-gallery-caption';
    caption.textContent = getDefaultCaptionText(block, index);
    caption.setAttribute('contenteditable', 'true');
    caption.setAttribute('spellcheck', 'false');
  }
  caption.classList.add('st-photo-gallery-caption');
  caption.dataset.galleryCaptionBlock = 'title';
  caption.dataset.captionStyleStage = PG_CAPTION_STYLE_STAGE;
  caption.setAttribute('contenteditable', 'true');
  caption.setAttribute('spellcheck', 'false');
  return caption;
}

function applyCaptionBoxMode(caption, boxMode) {
  if (!(caption instanceof HTMLElement)) return;
  caption.dataset.galleryCaptionBox = boxMode;
  if (boxMode === '0') {
    caption.style.background = 'transparent';
    caption.style.borderColor = 'transparent';
    caption.style.boxShadow = 'none';
    caption.style.backdropFilter = 'none';
    caption.style.webkitBackdropFilter = 'none';
    caption.style.padding = '0';
  } else {
    if (!caption.style.background || caption.style.background === 'transparent') caption.style.background = 'rgba(255,255,255,.82)';
    if (!caption.style.border || caption.style.borderColor === 'transparent') caption.style.border = '1px solid rgba(255,255,255,.64)';
    if (!caption.style.padding || caption.style.padding === '0px') caption.style.padding = '10px 12px';
    if (!caption.style.borderRadius) caption.style.borderRadius = '16px';
    if (!caption.style.backdropFilter) caption.style.backdropFilter = 'blur(10px)';
  }
}

function placeCaptionBlock(block, caption, settings) {
  if (!(block instanceof HTMLElement) || !(caption instanceof HTMLElement)) return;
  const photo = block.querySelector('.st-photo-gallery-photo');
  const pos = normalizeCaptionPosition(settings.position);
  const mode = normalizeCaptionMode(settings.mode);
  const box = normalizeCaptionBox(settings.box);
  caption.dataset.galleryCaptionMode = mode;
  caption.dataset.galleryCaptionPosition = pos;
  applyCaptionBoxMode(caption, box);

  caption.style.boxSizing = 'border-box';
  caption.style.maxWidth = '100%';
  caption.style.whiteSpace = 'normal';
  caption.style.wordBreak = 'normal';
  caption.style.overflowWrap = 'break-word';
  caption.style.lineHeight = caption.style.lineHeight || '1.25';
  caption.style.fontWeight = caption.style.fontWeight || '900';

  if (pos === 'inside') {
    if (photo instanceof HTMLElement && caption.parentElement !== photo) photo.appendChild(caption);
    block.style.display = '';
    block.style.flexDirection = '';
    block.style.gap = '';
    if (photo instanceof HTMLElement) {
      photo.style.flex = '';
      photo.style.minHeight = '0';
      photo.style.height = '100%';
    }
    caption.style.position = 'absolute';
    caption.style.left = '14px';
    caption.style.right = '14px';
    caption.style.bottom = '14px';
    caption.style.top = '';
    caption.style.width = '';
    caption.style.zIndex = '4';
  } else {
    block.style.display = 'flex';
    block.style.flexDirection = 'column';
    block.style.gap = '8px';
    block.style.alignItems = 'stretch';
    if (photo instanceof HTMLElement) {
      photo.style.position = photo.style.position || 'relative';
      photo.style.flex = '1 1 auto';
      photo.style.minHeight = '0';
      photo.style.height = 'auto';
      if (pos === 'above') block.insertBefore(caption, photo);
      else block.appendChild(caption);
    } else {
      block.appendChild(caption);
    }
    caption.style.position = 'relative';
    caption.style.left = '';
    caption.style.right = '';
    caption.style.bottom = '';
    caption.style.top = '';
    caption.style.width = '100%';
    caption.style.zIndex = '4';
  }
}

function applyGalleryCaptionSettings(section, settings = {}, options = {}) {
  if (!(section instanceof HTMLElement)) return false;
  const next = {
    ...getGalleryCaptionSettings(section),
    ...(settings || {})
  };
  next.mode = normalizeCaptionMode(next.mode);
  next.position = normalizeCaptionPosition(next.position);
  next.box = normalizeCaptionBox(next.box);
  section.dataset.galleryCaptionMode = next.mode;
  section.dataset.galleryCaptionPosition = next.position;
  section.dataset.galleryCaptionBox = next.box;
  section.dataset.galleryCaptionStage = PG_CAPTION_STYLE_STAGE;
  section.classList.toggle('st-photo-gallery-caption-edit-mode', section.dataset.galleryCaptionEditing === '1');

  getPhotoBlocks(section).forEach((block, idx) => {
    const caption = ensureCaptionForBlock(block, idx);
    if (caption) placeCaptionBlock(block, caption, next);
  });
  protectPhotoGallerySectionFlow(section);
  if (!options.skipNotify) notifyChanged('photo-gallery-caption-settings');
  return true;
}

function copyCaptionVisualStyleToAll(section, sourceCaption) {
  if (!(section instanceof HTMLElement) || !(sourceCaption instanceof HTMLElement)) return;
  const style = sourceCaption.getAttribute('style') || '';
  section.dataset.galleryCaptionStyle = style;
  getCaptionBlocks(section).forEach((caption) => {
    if (!(caption instanceof HTMLElement) || caption === sourceCaption) return;
    const oldText = caption.textContent;
    caption.setAttribute('style', style);
    if (oldText != null) caption.textContent = oldText;
    caption.classList.add('st-photo-gallery-caption');
    caption.dataset.galleryCaptionBlock = 'title';
  });
  applyGalleryCaptionSettings(section, getGalleryCaptionSettings(section), { skipNotify: true });
  protectPhotoGallerySectionFlow(section);
}

let __captionStyleMirrorObserver = null;
let __captionStyleMirrorTimer = null;

function stopCaptionStyleMirror() {
  try { __captionStyleMirrorObserver?.disconnect?.(); } catch (_) {}
  __captionStyleMirrorObserver = null;
  clearTimeout(__captionStyleMirrorTimer);
  __captionStyleMirrorTimer = null;
  try {
    document.querySelectorAll('.st-photo-gallery-caption-edit-mode').forEach((section) => {
      section.classList.remove('st-photo-gallery-caption-edit-mode');
      if (section instanceof HTMLElement) section.dataset.galleryCaptionEditing = '0';
    });
  } catch (_) {}
}

function startCaptionStyleMirror(section) {
  stopCaptionStyleMirror();
  if (!(section instanceof HTMLElement)) return false;
  applyGalleryCaptionSettings(section, getGalleryCaptionSettings(section), { skipNotify: true });
  const source = getCaptionBlocks(section)[0];
  if (!(source instanceof HTMLElement)) return false;
  section.dataset.galleryCaptionEditing = '1';
  section.classList.add('st-photo-gallery-caption-edit-mode');
  selectElement(source, 'block');
  __captionStyleMirrorObserver = new MutationObserver((mutations) => {
    if (!mutations.some((m) => m.type === 'attributes' && (m.attributeName === 'style' || m.attributeName === 'class'))) return;
    clearTimeout(__captionStyleMirrorTimer);
    __captionStyleMirrorTimer = window.setTimeout(() => {
      copyCaptionVisualStyleToAll(section, source);
      notifyChanged('photo-gallery-caption-style-edit');
    }, 80);
  });
  __captionStyleMirrorObserver.observe(source, { attributes: true, attributeFilter: ['style', 'class'] });
  return true;
}

function beginCaptionChangeSession(sectionEl, options = {}) {
  const gallery = findSelectedGallerySection() || findActiveGallerySection();
  if (!gallery) {
    try { alert('Спочатку виберіть секцію з фотогалереєю.'); } catch (_) {}
    updateSummary(sectionEl);
    return null;
  }
  const targetUid = getGallerySectionUid(gallery) || uid('pgs');
  if (!getGallerySectionUid(gallery)) gallery.dataset.secId = targetUid;
  const current = readCaptionBackup();
  if (!current?.pending) {
    writeCaptionBackup({
      pending: true,
      targetUid,
      originalOuterHTML: gallery.outerHTML,
      startedAt: Date.now(),
      mode: 'caption-style-edit'
    });
  }
  if (options.editBlock) startCaptionStyleMirror(gallery);
  else applyGalleryCaptionSettings(gallery, getGalleryCaptionSettings(gallery), { skipNotify: true });
  updateSummary(sectionEl);
  return gallery;
}

function commitCaptionChange(sectionEl) {
  const backup = readCaptionBackup();
  if (!backup?.pending) return false;
  const gallery = backup.targetUid ? findGallerySectionByUid(backup.targetUid) : findSelectedGallerySection();
  stopCaptionStyleMirror();
  clearCaptionEditState();
  if (gallery) {
    gallery.dataset.galleryCaptionEditing = '0';
    gallery.classList.remove('st-photo-gallery-caption-edit-mode');
    applyGalleryCaptionSettings(gallery, getGalleryCaptionSettings(gallery), { skipNotify: true });
    selectElement(gallery, 'section');
  }
  notifyChanged('photo-gallery-caption-change-commit');
  updateSummary(sectionEl);
  return true;
}

function cancelCaptionChange(sectionEl) {
  const backup = readCaptionBackup();
  if (!backup?.originalOuterHTML) return false;
  const current = backup.targetUid ? findGallerySectionByUid(backup.targetUid) : findSelectedGallerySection();
  const tmp = document.createElement('div');
  tmp.innerHTML = String(backup.originalOuterHTML || '').trim();
  const original = tmp.firstElementChild;
  stopCaptionStyleMirror();
  if (current && original) {
    current.replaceWith(original);
    repairPhotoGalleryLayout(original, { silentNotify: true });
    applyGalleryCaptionSettings(original, getGalleryCaptionSettings(original), { skipNotify: true });
    selectElement(original, 'section');
  }
  clearCaptionEditState();
  notifyChanged('photo-gallery-caption-change-cancel');
  updateSummary(sectionEl);
  return true;
}

function handleCaptionControlChange(sectionEl, input) {
  if (!(input instanceof HTMLElement)) return;
  const key = input.dataset.pgCaptionControl || '';
  const gallery = beginCaptionChangeSession(sectionEl, { editBlock: key === 'edit' && input.checked });
  if (!gallery) return;
  if (key === 'mode') applyGalleryCaptionSettings(gallery, { mode: input.value }, { skipNotify: false });
  if (key === 'position') applyGalleryCaptionSettings(gallery, { position: input.value }, { skipNotify: false });
  if (key === 'box') applyGalleryCaptionSettings(gallery, { box: input.value }, { skipNotify: false });
  if (key === 'edit') {
    if (input.checked) startCaptionStyleMirror(gallery);
    else stopCaptionStyleMirror();
  }
  updateSummary(sectionEl);
}

function applyGalleryTemplateDesignToSection(target, templateHtml, tpl = null, options = {}) {
  if (!(target instanceof HTMLElement)) return { ok: false, reason: 'no-target' };
  const next = parsePhotoGallerySectionFromHtml(templateHtml);
  if (!(next instanceof HTMLElement)) return { ok: false, reason: 'bad-template' };

  const keptAssets = collectGalleryAssets(target);
  const keptCaptionSettings = getGalleryCaptionSettings(target);
  const keptCaptionStyle = target.dataset.galleryCaptionStyle || getCaptionBlocks(target)[0]?.getAttribute?.('style') || '';
  const keepUid = getGallerySectionUid(target);
  const keepSecId = target.dataset.secId || '';
  const keepUidData = target.dataset.uid || '';
  const wasActive = target.classList.contains('is-active') || target.classList.contains('is-selected');

  // Секція як контейнер лишається та сама: замінюємо тільки внутрішню галерею/ряди.
  target.innerHTML = next.innerHTML;
  target.classList.add('st-photo-gallery-section');
  target.dataset.gallerySection = 'photo-gallery';
  target.dataset.secRole = target.dataset.secRole || 'photo-gallery-section';
  target.dataset.galleryVersion = PG_LAYOUT_STAGE;
  if (keepSecId) target.dataset.secId = keepSecId;
  if (keepUidData) target.dataset.uid = keepUidData;
  if (!getGallerySectionUid(target) && keepUid) target.dataset.secId = keepUid;

  const layout = normalizeLayoutMode(next.dataset.galleryLayout || tpl?.meta?.layout || target.dataset.galleryLayout || 'bento');
  const previewMode = normalizePreviewMode(next.dataset.galleryPreviewMode || tpl?.meta?.previewMode || target.dataset.galleryPreviewMode || 'off');
  target.dataset.galleryLayout = layout;
  target.dataset.galleryPreviewMode = previewMode;
  target.dataset.galleryMenuEnabled = next.dataset.galleryMenuEnabled || target.dataset.galleryMenuEnabled || '1';
  target.dataset.galleryActiveFilter = 'all';
  target.dataset.galleryDesignTemplateId = tpl?.id || '';
  target.dataset.galleryDesignTemplateName = tpl?.name || '';
  regenerateGalleryChildIds(target);

  lockPhotoGalleryRows(target);
  applyGalleryResponsiveCss(target);

  if (keptAssets.length) {
    replaceGalleryBlocksWithAssets(target, keptAssets);
    target.dataset.galleryExactPhotoCount = String(keptAssets.length);
    applyGalleryLayout(target, layout || chooseLayoutForPhotoCount(keptAssets.length), { exactPhotoCount: keptAssets.length, preserveSelection: true, silent: true });
    setTimeout(() => hydrateGalleryPhotoAssets(target, { skipNotify: true }), 40);
  } else {
    repairPhotoGalleryLayout(target, { skipSpans: false, silentNotify: true });
  }

  if (keptCaptionStyle) {
    target.dataset.galleryCaptionStyle = keptCaptionStyle;
    getCaptionBlocks(target).forEach((caption) => { try { caption.setAttribute('style', keptCaptionStyle); } catch (_) {} });
  }
  applyGalleryCaptionSettings(target, keptCaptionSettings, { skipNotify: true });

  syncGalleryMenuCategories(target);
  applyGalleryFilter(target, 'all', { skipNotify: true });
  if (previewMode !== 'off' && previewMode !== 'modal' && previewMode !== 'fullscreen') {
    setGalleryPreviewMode(target, previewMode, { silent: true });
  }
  protectPhotoGallerySectionFlow(target);
  if (wasActive || options.select !== false) selectElement(target, 'section');
  return { ok: true, target };
}

function beginGalleryDesignChange(sectionEl) {
  const gallery = findSelectedGallerySection();
  if (!gallery) {
    try { alert('Спочатку виберіть саме секцію з фотогалереєю.'); } catch (_) {}
    updateSummary(sectionEl);
    return false;
  }
  const targetUid = getGallerySectionUid(gallery) || uid('pgs');
  if (!getGallerySectionUid(gallery)) gallery.dataset.secId = targetUid;
  writeDesignChangeBackup({
    pending: false,
    targetUid,
    originalOuterHTML: gallery.outerHTML,
    startedAt: Date.now()
  });
  try {
    localStorage.setItem(PG_DESIGN_CHANGE_CTX_KEY, JSON.stringify({ mode: 'photo-gallery-design-change', targetUid, startedAt: Date.now() }));
  } catch (_) {}
  openPhotoGalleryTemplates({ keepDesignContext: true });
  updateSummary(sectionEl);
  return true;
}

function applyGalleryTemplateDesignFromGallery(templateHtml, tpl = null) {
  const backup = readDesignChangeBackup();
  if (!backup?.targetUid || !backup?.originalOuterHTML) return { ok: false, reason: 'no-design-change-context' };
  const target = findGallerySectionByUid(backup.targetUid) || findSelectedGallerySection();
  if (!target) return { ok: false, reason: 'target-not-found' };
  const res = applyGalleryTemplateDesignToSection(target, templateHtml, tpl, { select: true });
  if (!res?.ok) return res;
  writeDesignChangeBackup({ ...backup, pending: true, appliedTemplateId: tpl?.id || '', appliedTemplateName: tpl?.name || '', appliedAt: Date.now() });
  try { localStorage.setItem(PG_DESIGN_CHANGE_CTX_KEY, JSON.stringify({ mode: 'photo-gallery-design-change', targetUid: backup.targetUid, pending: true })); } catch (_) {}
  try { window.dispatchEvent(new CustomEvent('st:photo-gallery:design-preview-applied', { detail: { templateId: tpl?.id || '', templateName: tpl?.name || '' } })); } catch (_) {}
  updateAllPhotoGalleryWidgetUis();
  return { ok: true, target: res.target };
}

function commitGalleryDesignChange(sectionEl) {
  const backup = readDesignChangeBackup();
  if (!backup?.pending) return false;
  clearDesignChangeState();
  const gallery = backup.targetUid ? findGallerySectionByUid(backup.targetUid) : findSelectedGallerySection();
  if (gallery) {
    protectPhotoGallerySectionFlow(gallery);
    selectElement(gallery, 'section');
  }
  notifyChanged('photo-gallery-design-change-commit');
  updateSummary(sectionEl);
  return true;
}

function cancelGalleryDesignChange(sectionEl) {
  const backup = readDesignChangeBackup();
  if (!backup?.originalOuterHTML) return false;
  const current = backup.targetUid ? findGallerySectionByUid(backup.targetUid) : findSelectedGallerySection();
  const tmp = document.createElement('div');
  tmp.innerHTML = String(backup.originalOuterHTML || '').trim();
  const original = tmp.firstElementChild;
  if (current && original) {
    current.replaceWith(original);
    repairPhotoGalleryLayout(original, { silentNotify: true });
    selectElement(original, 'section');
  }
  clearDesignChangeState();
  notifyChanged('photo-gallery-design-change-cancel');
  updateSummary(sectionEl);
  return true;
}


function updateCaptionControlsState(sectionEl) {
  if (!sectionEl) return;
  const gallery = findSelectedGallerySection() || findActiveGallerySection();
  const settings = getGalleryCaptionSettings(gallery);
  const disabled = !gallery;
  sectionEl.querySelectorAll('[data-pg-caption-control]').forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    input.disabled = disabled;
    const key = input.dataset.pgCaptionControl || '';
    if (key === 'mode') input.checked = input.value === settings.mode;
    if (key === 'position') input.checked = input.value === settings.position;
    if (key === 'box') input.checked = input.value === settings.box;
    if (key === 'edit') input.checked = !!(gallery && gallery.dataset.galleryCaptionEditing === '1' && isCaptionEditPending());
  });
}

function updatePhotoGalleryDesignButtons(sectionEl) {
  if (!sectionEl) return;
  const changeBtn = sectionEl.querySelector('[data-pg-act="change-gallery-design"]');
  const cancelBtn = sectionEl.querySelector('[data-pg-act="cancel-gallery-design"]');
  const hasSelectedGallery = !!findSelectedGallerySection();
  const designPending = isDesignChangePending();
  const captionPending = isCaptionEditPending();
  const pending = designPending || captionPending;
  if (changeBtn) {
    changeBtn.disabled = !hasSelectedGallery && !pending;
    changeBtn.classList.toggle('is-disabled', !hasSelectedGallery && !pending);
    changeBtn.classList.toggle('is-green', hasSelectedGallery && !pending);
    changeBtn.classList.toggle('is-primary', pending);
    changeBtn.textContent = captionPending ? 'Зберегти назви' : (designPending ? 'Зберегти' : (hasSelectedGallery ? 'Змінити дизайн' : 'Виберіть фотогалерею'));
  }
  if (cancelBtn) {
    cancelBtn.disabled = !pending;
    cancelBtn.classList.toggle('is-disabled', !pending);
    cancelBtn.classList.toggle('is-danger', pending);
  }
  updateCaptionControlsState(sectionEl);
}

function updateAllPhotoGalleryWidgetUis() {
  document.querySelectorAll(`#${SEC_ID}`).forEach((el) => updateSummary(el));
}

function setGalleryMenuVisible(section, visible) {
  if (!section) return false;
  const row = section.querySelector('.st-photo-gallery-menu-row');
  if (!row) return false;
  row.style.display = visible ? 'grid' : 'none';
  section.dataset.galleryMenuEnabled = visible ? '1' : '0';
  if (!visible) applyGalleryFilter(section, 'all');
  else applyGalleryFilter(section, section.dataset.galleryActiveFilter || 'all');
  notifyChanged('photo-gallery-toggle-menu');
  return true;
}

function countSummaryHtml() {
  const root = getSiteRoot();
  if (!root) return '<b>0</b> секц. · <b>0</b> фото';
  const galleries = root.querySelectorAll('.st-photo-gallery-section').length;
  const photos = root.querySelectorAll('.st-photo-gallery-image-block').length;
  const activeGallery = findActiveGallerySection();
  const activeFilter = activeGallery?.dataset?.galleryActiveFilter || 'all';
  const suffix = activeGallery ? ` · <b>${esc(categoryLabelBySlug(activeFilter))}</b>` : '';
  return `<b>${galleries}</b> секц. · <b>${photos}</b> фото${suffix}`;
}

function buildWidgetHtml() {
  return `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title"><span>Фотогалерея</span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden>
      <style>
        #${SEC_ID} .st-pg-ui{display:grid;gap:10px;padding:10px;border:1px solid rgba(148,163,184,.18);border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,.74),rgba(2,6,23,.64));color:rgba(226,232,240,.95)}
        #${SEC_ID} .st-pg-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 2px 8px;border-bottom:1px solid rgba(148,163,184,.14)}
        #${SEC_ID} .st-pg-badge{font-size:11px;font-weight:900;padding:6px 8px;border-radius:999px;background:rgba(14,165,233,.12);border:1px solid rgba(14,165,233,.25);color:#bae6fd;white-space:nowrap}
        #${SEC_ID} .st-pg-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        #${SEC_ID} .st-pg-caption-panel{display:grid;gap:9px;padding:10px;border:1px solid rgba(14,165,233,.18);border-radius:14px;background:rgba(15,23,42,.34)}
        #${SEC_ID} .st-pg-caption-title{font-size:12px;font-weight:950;color:#bae6fd;letter-spacing:.02em}
        #${SEC_ID} .st-pg-radio-row{display:flex;flex-wrap:wrap;gap:7px}
        #${SEC_ID} .st-pg-radio{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid rgba(148,163,184,.18);border-radius:999px;background:rgba(255,255,255,.04);font-size:11px;font-weight:850;color:rgba(226,232,240,.92);cursor:pointer}
        #${SEC_ID} .st-pg-radio input{accent-color:#38bdf8}
        #${SEC_ID} .st-pg-note{font-size:12px;line-height:1.45;color:rgba(203,213,225,.86);padding:10px;border:1px solid rgba(148,163,184,.14);border-radius:12px;background:rgba(255,255,255,.035)}
        #${SEC_ID} .st-pg-btn{appearance:none;border:1px solid rgba(148,163,184,.20);background:linear-gradient(180deg,rgba(30,41,59,.82),rgba(15,23,42,.82));color:rgba(241,245,249,.96);border-radius:12px;padding:9px 10px;font-size:12px;font-weight:850;cursor:pointer;text-align:left;box-shadow:0 8px 18px rgba(0,0,0,.16);transition:transform .08s ease,border-color .12s ease,background .12s ease}
        #${SEC_ID} .st-pg-btn:hover{border-color:rgba(56,189,248,.42);background:linear-gradient(180deg,rgba(30,64,175,.58),rgba(15,23,42,.9))}
        #${SEC_ID} .st-pg-btn:active{transform:translateY(1px)}
        #${SEC_ID} .st-pg-btn.is-primary{background:linear-gradient(135deg,#2563eb,#0891b2);border-color:rgba(125,211,252,.42);color:#fff;text-align:center}
        #${SEC_ID} .st-pg-btn.is-green{background:linear-gradient(135deg,#16a34a,#0f766e);border-color:rgba(134,239,172,.34);color:#fff;text-align:center}
        #${SEC_ID} .st-pg-btn.is-danger{background:linear-gradient(135deg,#b91c1c,#7f1d1d);border-color:rgba(252,165,165,.44);color:#fff;text-align:center}
        #${SEC_ID} .st-pg-btn.is-disabled,#${SEC_ID} .st-pg-btn:disabled{opacity:.48;cursor:not-allowed;background:rgba(30,41,59,.62)!important;color:rgba(148,163,184,.86)!important;border-color:rgba(100,116,139,.22)!important;box-shadow:none!important}
      </style>
      <div class="st-pg-ui">
        <div class="st-pg-top">
          <div class="st-pg-badge">Етап 7 · Шаблони галереї</div>
          <div class="st-pg-badge" data-pg-summary>${countSummaryHtml()} · <b data-pg-layout-label>${esc(layoutLabel(findActiveGallerySection()?.dataset?.galleryLayout || 'bento'))}</b></div>
        </div>
        <div class="st-pg-grid">
          <button type="button" class="st-pg-btn is-primary" data-pg-act="add-gallery">+ Додати галерею</button>
          <button type="button" class="st-pg-btn is-green" data-pg-act="open-photo-assets">Відкрити Фото-галерею</button>
          <button type="button" class="st-pg-btn is-primary" data-pg-act="pick-gallery-photos">Вибрати фото в секцію</button>
          <button type="button" class="st-pg-btn" data-pg-act="show-menu">Увімкнути меню</button>
          <button type="button" class="st-pg-btn" data-pg-act="hide-menu">Вимкнути меню</button>
          <button type="button" class="st-pg-btn" data-pg-act="reset-filter">Показати всі фото</button>
          <button type="button" class="st-pg-btn" data-pg-act="sync-menu-categories">Оновити меню</button>
          <button type="button" class="st-pg-btn" data-pg-act="layout-3x4">Layout 3×4</button>
          <button type="button" class="st-pg-btn" data-pg-act="layout-4x4">Layout 4×4</button>
          <button type="button" class="st-pg-btn" data-pg-act="layout-bento">Layout Bento</button>
          <button type="button" class="st-pg-btn" data-pg-act="layout-masonry">Layout Masonry</button>
          <button type="button" class="st-pg-btn" data-pg-act="layout-random">Layout Random</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-off">Preview вимкнено</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-right">Preview справа</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-left">Preview зліва</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-top">Велике фото зверху</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-modal">Випадаюче вікно</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-fullscreen">На весь екран</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-prev">← Попереднє фото</button>
          <button type="button" class="st-pg-btn" data-pg-act="preview-next">Наступне фото →</button>
          <button type="button" class="st-pg-btn" data-pg-act="open-lightbox">Відкрити Lightbox</button>
          <button type="button" class="st-pg-btn" data-pg-act="open-fullscreen-now">Відкрити Fullscreen</button>
          <button type="button" class="st-pg-btn is-green" data-pg-act="open-gallery-templates">Відкрити шаблони галерей</button>
          <button type="button" class="st-pg-btn is-disabled" data-pg-act="change-gallery-design" disabled>Виберіть фотогалерею</button>
          <button type="button" class="st-pg-btn is-disabled" data-pg-act="cancel-gallery-design" disabled>Відмінити</button>
          <button type="button" class="st-pg-btn is-primary" data-pg-act="save-gallery-template">Зберегти шаблон галереї</button>
        </div>
        <div class="st-pg-caption-panel" data-pg-caption-panel>
          <div class="st-pg-caption-title">Назви фотографій</div>
          <div class="st-pg-radio-row" aria-label="Показ назви">
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-mode" value="show" data-pg-caption-control="mode"> Назва</label>
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-mode" value="off" data-pg-caption-control="mode"> Вимкнути назву</label>
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-mode" value="hover" data-pg-caption-control="mode"> При наведенні</label>
          </div>
          <div class="st-pg-radio-row" aria-label="Позиція назви">
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-position" value="inside" data-pg-caption-control="position"> У фото</label>
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-position" value="below" data-pg-caption-control="position"> Під фото</label>
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-position" value="above" data-pg-caption-control="position"> Над фото</label>
          </div>
          <div class="st-pg-radio-row" aria-label="Блок назви">
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-box" value="1" data-pg-caption-control="box"> Показувати назву в блоці</label>
            <label class="st-pg-radio"><input type="radio" name="st-pg-caption-box" value="0" data-pg-caption-control="box"> Без блока</label>
          </div>
          <label class="st-pg-radio" style="justify-content:center;border-radius:12px;"><input type="checkbox" value="1" data-pg-caption-control="edit"> Редагувати блок назви стандартними віджетами</label>
        </div>
        <div class="st-pg-note">
          Фото зберігаємо у галереї assets у папці <b>Фото-галерея</b>. Всередині папки є категоріями. Натисни <b>Вибрати фото в секцію</b>, виділи кілька фото у галереї та натисни вставку — секція сама створить потрібну кількість стандартних фото-блоків і прив’яже їх до категорії папки. У preview-режимах клік по фото відкриває велике фото в секції, у вікні або на весь екран. Працюють стрілки, клавіатура, ESC і свайп. Етап 7 додає папку шаблонів галерей: відкривай готові системні варіанти або збережи активну секцію як власний шаблон. Кнопка Змінити дизайн працює тільки коли вибрана секція фотогалереї: шаблон міняє внутрішню структуру/вигляд, а фото з поточної галереї зберігаються.
        </div>
      </div>
    </div>
  `;
}

function updateSummary(sectionEl) {
  const summary = sectionEl?.querySelector?.('[data-pg-summary]');
  const gallery = findActiveGallerySection();
  if (summary) summary.innerHTML = `${countSummaryHtml()} · <b data-pg-layout-label>${esc(layoutLabel(gallery?.dataset?.galleryLayout || 'bento'))}</b> · <b>${esc(previewModeLabel(gallery?.dataset?.galleryPreviewMode || 'off'))}</b>`;
  updatePhotoGalleryDesignButtons(sectionEl);
}

function bindEditablePersistenceOnce() {
  if (window.__ST_PHOTO_GALLERY_EDITABLE_PERSISTENCE_00356__) return;
  window.__ST_PHOTO_GALLERY_EDITABLE_PERSISTENCE_00356__ = true;
  let timer = null;
  document.addEventListener('input', (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.closest?.('.st-photo-gallery-section')) return;
    if (!target.matches?.('[contenteditable="true"], [contenteditable=true]')) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => notifyChanged('photo-gallery-edit'), 350);
  }, true);
}

function openPhotoAssets() {
  try {
    openGalleryModal({ cat: 'images', folderId: 'sys_photo_gallery', pickerMode: false, view: 'big' });
  } catch (err) {
    console.warn('[photo-gallery-widget] Не вдалося відкрити папку Фото-галерея:', err);
  }
}

function openPhotoAssetPicker(sectionEl) {
  try {
    const gallery = findActiveGallerySection() || addGallerySection()?.sec;
    if (!gallery) return;
    openGalleryModal({
      cat: 'images',
      folderId: 'sys_photo_gallery',
      pickerMode: true,
      view: 'big',
      onPick(payload) {
        const assets = normalizePickedAssets(payload).filter((item) => !item.mime || String(item.mime).startsWith('image/') || item.url);
        if (!assets.length) {
          try { alert('Вибери одне або кілька фото.'); } catch (_) {}
          return;
        }
        replaceGalleryBlocksWithAssets(gallery, assets);
        const autoLayout = chooseLayoutForPhotoCount(assets.length);
        applyGalleryLayout(gallery, autoLayout, { exactPhotoCount: assets.length, preserveSelection: true });
        const previewMode = normalizePreviewMode(gallery.dataset.galleryPreviewMode || 'off');
        if (previewMode !== 'off' && previewMode !== 'modal' && previewMode !== 'fullscreen') setGalleryPreviewMode(gallery, previewMode, { silent: true });
        syncGalleryMenuCategories(gallery);
        applyGalleryFilter(gallery, 'all', { skipNotify: true });
        protectPhotoGallerySectionFlow(gallery);
        notifyChanged('photo-gallery-assets-picked');
        selectElement(gallery, 'section');
        updateSummary(sectionEl);
      }
    });
  } catch (err) {
    console.warn('[photo-gallery-widget] Не вдалося вибрати фото для галереї:', err);
  }
}

function openPhotoGalleryTemplates(options = {}) {
  try {
    if (!options.keepDesignContext) {
      try { localStorage.removeItem(PG_DESIGN_CHANGE_CTX_KEY); } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent('st:open-templates-gallery', { detail: { tab: 'photo-gallery' } }));
  } catch (err) {
    console.warn('[photo-gallery-widget] Не вдалося відкрити шаблони Фото-галереї:', err);
  }
}

function cleanGalleryTemplateHtml(section) {
  if (!section) return '';
  const clone = section.cloneNode(true);
  try {
    clone.classList.remove('is-active', 'is-selected');
    clone.querySelectorAll('.is-active,.is-selected,.is-gallery-preview-active').forEach((el) => {
      try { el.classList.remove('is-active', 'is-selected', 'is-gallery-preview-active'); } catch (_) {}
    });
    clone.querySelectorAll('[data-st-resize-handle],.st-resize,.st-resize-handle,.st-section-handle,.st-block-handle,.st-drag-handle,.st-col-resizer,.st-sec-resizer').forEach((el) => {
      try { el.remove(); } catch (_) {}
    });
    clone.querySelectorAll('.st-photo-gallery-overlay').forEach((el) => {
      try { el.remove(); } catch (_) {}
    });
  } catch (_) {}
  return clone.outerHTML || '';
}

function saveActiveGalleryTemplate(sectionEl) {
  const gallery = findActiveGallerySection();
  if (!gallery) {
    try { alert('Спочатку додай або вибери секцію Фотогалерея.'); } catch (_) {}
    return;
  }
  const html = cleanGalleryTemplateHtml(gallery);
  if (!html || !html.includes('st-photo-gallery-section')) {
    try { alert('Не вдалося зберегти: активна секція не схожа на Фотогалерею.'); } catch (_) {}
    return;
  }
  let name = '';
  try { name = prompt('Назва шаблону галереї:', 'Моя фотогалерея'); } catch (_) { name = 'Моя фотогалерея'; }
  name = String(name || '').trim();
  if (!name) return;
  try {
    const item = addTemplate({
      type: 'photo-gallery',
      name,
      folderId: 'fld_photo_gallery_sections',
      html,
      previewHtml: html,
      description: 'Власний шаблон секції фотогалереї',
      meta: {
        galleryTemplate: true,
        source: 'user',
        savedFrom: 'photo-gallery-widget',
        layout: gallery.dataset.galleryLayout || 'bento',
        previewMode: gallery.dataset.galleryPreviewMode || 'off',
        photoCount: getPhotoBlocks(gallery).length
      }
    });
    try { alert(`Шаблон галереї збережено: ${item?.name || name}`); } catch (_) {}
    updateSummary(sectionEl);
  } catch (err) {
    console.warn('[photo-gallery-widget] Не вдалося зберегти шаблон галереї:', err);
    try { alert('Не вдалося зберегти шаблон галереї. Перевір консоль.'); } catch (_) {}
  }
}

function handleAction(sectionEl, act) {
  if (act === 'add-gallery') {
    addGallerySection();
    updateSummary(sectionEl);
    return;
  }
  if (act === 'open-photo-assets') {
    openPhotoAssets();
    return;
  }
  if (act === 'pick-gallery-photos') {
    openPhotoAssetPicker(sectionEl);
    return;
  }
  if (act === 'open-gallery-templates') {
    openPhotoGalleryTemplates();
    return;
  }
  if (act === 'change-gallery-design') {
    if (isCaptionEditPending()) commitCaptionChange(sectionEl);
    else if (isDesignChangePending()) commitGalleryDesignChange(sectionEl);
    else beginGalleryDesignChange(sectionEl);
    return;
  }
  if (act === 'cancel-gallery-design') {
    if (isCaptionEditPending()) cancelCaptionChange(sectionEl);
    else cancelGalleryDesignChange(sectionEl);
    return;
  }
  if (act === 'save-gallery-template') {
    saveActiveGalleryTemplate(sectionEl);
    return;
  }
  if (act === 'reset-filter' || act === 'sync-menu-categories') {
    const gallery = findActiveGallerySection();
    if (!gallery) {
      try { alert('Спочатку додай або вибери секцію Фотогалерея.'); } catch (_) {}
      return;
    }
    if (act === 'sync-menu-categories') syncGalleryMenuCategories(gallery);
    applyGalleryFilter(gallery, 'all');
    updateSummary(sectionEl);
    return;
  }
  if (act === 'show-menu' || act === 'hide-menu') {
    const gallery = findActiveGallerySection();
    if (!gallery) {
      try { alert('Спочатку додай або вибери секцію Фотогалерея.'); } catch (_) {}
      return;
    }
    setGalleryMenuVisible(gallery, act === 'show-menu');
    return;
  }
  if (act === 'preview-prev' || act === 'preview-next' || act === 'open-lightbox' || act === 'open-fullscreen-now') {
    const gallery = findActiveGallerySection();
    if (!gallery) {
      try { alert('Спочатку додай або вибери секцію Фотогалерея.'); } catch (_) {}
      return;
    }
    if (act === 'preview-prev') moveGalleryPreview(gallery, -1);
    if (act === 'preview-next') moveGalleryPreview(gallery, 1);
    if (act === 'open-lightbox') openGalleryCurrentPreview(gallery, 'modal');
    if (act === 'open-fullscreen-now') openGalleryCurrentPreview(gallery, 'fullscreen');
    updateSummary(sectionEl);
    return;
  }
  if (act && act.startsWith('preview-')) {
    const gallery = findActiveGallerySection();
    if (!gallery) {
      try { alert('Спочатку додай або вибери секцію Фотогалерея.'); } catch (_) {}
      return;
    }
    const raw = act.replace(/^preview-/, '');
    const mode = raw === 'fullscreen' ? 'fullscreen' : raw;
    setGalleryPreviewMode(gallery, mode);
    updateSummary(sectionEl);
    return;
  }
  if (act && act.startsWith('layout-')) {
    const gallery = findActiveGallerySection();
    if (!gallery) {
      try { alert('Спочатку додай або вибери секцію Фотогалерея.'); } catch (_) {}
      return;
    }
    const layout = act.replace(/^layout-/, '')
      .replace('3x4', 'grid-3x4')
      .replace('4x4', 'grid-4x4');
    applyGalleryLayout(gallery, layout);
    updateSummary(sectionEl);
    return;
  }
}


window.ST_PHOTO_GALLERY_WIDGET = Object.assign(window.ST_PHOTO_GALLERY_WIDGET || {}, {
  applyLayout(section, layout) { return applyGalleryLayout(section || findActiveGallerySection(), layout); },
  applyFilter(section, filter) { return applyGalleryFilter(section || findActiveGallerySection(), filter || 'all'); },
  setPreviewMode(section, mode) { return setGalleryPreviewMode(section || findActiveGallerySection(), mode || 'off'); },
  updatePreview(section, index) { return updateGalleryPreview(section || findActiveGallerySection(), index || 0); },
  openPreview(section, index, mode) { return openGalleryOverlay(section || findActiveGallerySection(), index || 0, mode || 'modal'); },
  nextPhoto(section) { return moveGalleryPreview(section || findActiveGallerySection(), 1); },
  prevPhoto(section) { return moveGalleryPreview(section || findActiveGallerySection(), -1); },
  closePreview: closeGalleryOverlay,
  getActiveGallery: findActiveGallerySection,
  getSelectedGallery: findSelectedGallerySection,
  repairLayout(section) { return repairPhotoGalleryLayout(section || findActiveGallerySection()); },
  repairAll() { return repairAllPhotoGalleries(); },
  pickPhotos(section) { return openPhotoAssetPicker(document.getElementById(SEC_ID)); },
  openTemplates: openPhotoGalleryTemplates,
  beginDesignChange(sectionEl) { return beginGalleryDesignChange(sectionEl || document.getElementById(SEC_ID)); },
  isDesignChangeActive: isDesignChangeContextActive,
  isDesignChangePending,
  applyTemplateDesign(templateHtml, tpl) { return applyGalleryTemplateDesignFromGallery(templateHtml, tpl); },
  commitDesignChange(sectionEl) { return commitGalleryDesignChange(sectionEl || document.getElementById(SEC_ID)); },
  cancelDesignChange(sectionEl) { return cancelGalleryDesignChange(sectionEl || document.getElementById(SEC_ID)); },
  hydrateAssets(section) { return hydrateGalleryPhotoAssets(section || findActiveGallerySection()); },
  hydrateAllAssets() { return hydrateAllPhotoGalleryAssets(); },
  applyCaptionSettings(section, settings) { return applyGalleryCaptionSettings(section || findActiveGallerySection(), settings || {}); },
  beginCaptionEdit(sectionEl) { return beginCaptionChangeSession(sectionEl || document.getElementById(SEC_ID), { editBlock: true }); },
  commitCaptionEdit(sectionEl) { return commitCaptionChange(sectionEl || document.getElementById(SEC_ID)); },
  cancelCaptionEdit(sectionEl) { return cancelCaptionChange(sectionEl || document.getElementById(SEC_ID)); },
  saveTemplate() { return saveActiveGalleryTemplate(document.getElementById(SEC_ID)); },
  getLayouts() { return Object.keys(GALLERY_LAYOUTS).map((key) => ({ key, label: GALLERY_LAYOUTS[key].label })); },
  getPreviewModes() { return Object.keys(GALLERY_PREVIEW_MODES).map((key) => ({ key, label: GALLERY_PREVIEW_MODES[key] })); }
});

export function initPhotoGalleryWidget(host) {
  if (!host) return;
  bindEditablePersistenceOnce();
  bindGalleryFilteringOnce();
  bindGalleryPreviewOnce();
  if (host.querySelector(`#${SEC_ID}`)) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;
  sectionEl.dataset.widget = 'photo-gallery';
  sectionEl.innerHTML = buildWidgetHtml();

  const header = sectionEl.querySelector('.design-section__header');
  if (header) {
    header.addEventListener('click', (ev) => {
      ev.preventDefault();
      const isOpen = sectionEl.classList.contains('is-open');
      ensureOpen(sectionEl, !isOpen);
      const st = readState();
      st.open = !isOpen;
      writeState(st);
    });
  }

  const st = readState();
  ensureOpen(sectionEl, !!st.open);

  sectionEl.addEventListener('click', (ev) => {
    const actionBtn = ev.target.closest('[data-pg-act]');
    if (!actionBtn || !sectionEl.contains(actionBtn)) return;
    ev.preventDefault();
    ev.stopPropagation();
    handleAction(sectionEl, actionBtn.dataset.pgAct);
  });

  sectionEl.addEventListener('change', (ev) => {
    const input = ev.target?.closest?.('[data-pg-caption-control]');
    if (!input || !sectionEl.contains(input)) return;
    handleCaptionControlChange(sectionEl, input);
  });

  host.appendChild(sectionEl);
  setTimeout(() => { repairAllPhotoGalleries({ silentNotify: true }); hydrateAllPhotoGalleryAssets({ skipNotify: true }); }, 60);
  updateSummary(sectionEl);
  window.addEventListener('st:photo-gallery:changed', () => updateSummary(sectionEl));
  window.addEventListener('st:canvas-snapshot-applied', () => { setTimeout(() => { repairAllPhotoGalleries({ silentNotify: true }); hydrateAllPhotoGalleryAssets({ skipNotify: true }); }, 40); updateSummary(sectionEl); });
  window.addEventListener('st-page-selected', () => setTimeout(() => { repairAllPhotoGalleries({ silentNotify: true }); hydrateAllPhotoGalleryAssets({ skipNotify: true }); updateSummary(sectionEl); }, 50));
  window.addEventListener('builder:structureChanged', () => setTimeout(() => updateSummary(sectionEl), 30));
  document.addEventListener('st:selection-changed', () => setTimeout(() => updateSummary(sectionEl), 20));
  document.addEventListener('builder:selectionChanged', () => setTimeout(() => updateSummary(sectionEl), 20));
}

