// js/design/widgets/templates/store/templates-store.js
// Store для шаблонів + папок (Gallery).
// Версія: v2 (але ключ той самий, щоб не плодити)
// - templates: items[]
// - folders: дерево папок (root -> children)
// Store for template folders and items.

const LS_KEY = "st_templates_store_v1";
const LS_BACKUP_KEY = "st_templates_store_backup_v1";
const LS_EXPORT_VERSION = 1;


function isAdmin_() {
  try { return (localStorage.getItem('st_user_role') || '').toLowerCase() === 'admin'; } catch (e) { return false; }
}

function nowISO() {
  return new Date().toISOString();
}

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch (e) { return fallback; }
}

function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}


function stTplStoreLooksSystemItem00542_(item) {
  try {
    const src = String(item?.meta?.source || item?.source || '').toLowerCase();
    const fixedBy = String(item?.meta?.fixedBy || '').trim();
    const runtimeFallback = item?.meta?.runtimeFallback === true;
    const id = String(item?.id || '');
    const knownSystemId = /^(header_|footer_|page_|shop_|photo_gallery_|menu_|sidebar_)/.test(id);
    return src === 'system' || item?.system === true || runtimeFallback || (!!fixedBy && knownSystemId);
  } catch {
    return false;
  }
}

function stTplStripRuntimePayload00542_(item) {
  if (!item || typeof item !== 'object') return item;
  const { __runtimeOnly, ...rest } = item;
  return rest;
}

const ST_TPL_PACK_CODEC_01018 = 'lzw-u16-b64-v1';
const ST_TPL_PACK_RESET_01018 = 65535;

function stTplBytesToBase6401018_(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function stTplBase64ToBytes01018_(value) {
  const binary = atob(String(value || ''));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i) & 0xff;
  return out;
}

function stTplPackString01018_(value) {
  const source = String(value || '');
  if (!source) return '';
  const input = new TextEncoder().encode(source);
  const resetDict = () => {
    const d = new Map();
    for (let i = 0; i < 256; i += 1) d.set(String.fromCharCode(i), i);
    return d;
  };
  let dict = resetDict();
  let nextCode = 256;
  const codes = [];
  let phrase = '';
  for (let i = 0; i < input.length; i += 1) {
    const ch = String.fromCharCode(input[i]);
    const combined = phrase + ch;
    if (dict.has(combined)) {
      phrase = combined;
      continue;
    }
    if (phrase) codes.push(dict.get(phrase));
    if (nextCode < ST_TPL_PACK_RESET_01018) {
      dict.set(combined, nextCode++);
    } else {
      codes.push(ST_TPL_PACK_RESET_01018);
      dict = resetDict();
      nextCode = 256;
    }
    phrase = ch;
  }
  if (phrase) codes.push(dict.get(phrase));
  const packed = new Uint8Array(codes.length * 2);
  for (let i = 0; i < codes.length; i += 1) {
    packed[i * 2] = (codes[i] >>> 8) & 0xff;
    packed[i * 2 + 1] = codes[i] & 0xff;
  }
  return stTplBytesToBase6401018_(packed);
}

function stTplUnpackString01018_(value) {
  const encoded = String(value || '');
  if (!encoded) return '';
  const packed = stTplBase64ToBytes01018_(encoded);
  const codes = [];
  for (let i = 0; i + 1 < packed.length; i += 2) codes.push((packed[i] << 8) | packed[i + 1]);
  const resetDict = () => {
    const d = new Map();
    for (let i = 0; i < 256; i += 1) d.set(i, Uint8Array.of(i));
    return d;
  };
  const concat = (a, b) => {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0); out.set(b, a.length);
    return out;
  };
  let dict = resetDict();
  let nextCode = 256;
  let previous = null;
  const chunks = [];
  for (const code of codes) {
    if (code === ST_TPL_PACK_RESET_01018) {
      dict = resetDict();
      nextCode = 256;
      previous = null;
      continue;
    }
    let entry = dict.get(code);
    if (!entry && previous && code === nextCode) entry = concat(previous, previous.subarray(0, 1));
    if (!entry) throw new Error('Invalid packed template payload');
    chunks.push(entry);
    if (previous && nextCode < ST_TPL_PACK_RESET_01018) {
      dict.set(nextCode++, concat(previous, entry.subarray(0, 1)));
    }
    previous = entry;
  }
  let total = 0;
  for (const c of chunks) total += c.length;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  return new TextDecoder().decode(bytes);
}

function stTplCompactUserPayload01018_(item) {
  if (!item || typeof item !== 'object') return item;
  const next = { ...item };
  const html = String(next.html || '');
  const previewHtml = String(next.previewHtml || '');
  if (html.length >= 4096) {
    try {
      const packed = stTplPackString01018_(html);
      if (packed && packed.length < html.length) {
        next.htmlPacked01018 = packed;
        next.htmlCodec01018 = ST_TPL_PACK_CODEC_01018;
        delete next.html;
      }
    } catch (e) { console.warn('[TemplatesStore][01018] html pack failed:', e); }
  }
  if (previewHtml && previewHtml === html) {
    next.previewHtmlSameAsHtml01018 = true;
    delete next.previewHtml;
  } else if (previewHtml.length >= 4096) {
    try {
      const packedPreview = stTplPackString01018_(previewHtml);
      if (packedPreview && packedPreview.length < previewHtml.length) {
        next.previewHtmlPacked01018 = packedPreview;
        next.previewHtmlCodec01018 = ST_TPL_PACK_CODEC_01018;
        delete next.previewHtml;
      }
    } catch (e) { console.warn('[TemplatesStore][01018] preview pack failed:', e); }
  }
  return next;
}

function stTplInflateUserPayload01018_(item) {
  if (!item || typeof item !== 'object') return item;
  const next = { ...item };
  if (!next.html && next.htmlCodec01018 === ST_TPL_PACK_CODEC_01018 && next.htmlPacked01018) {
    try { next.html = stTplUnpackString01018_(next.htmlPacked01018); }
    catch (e) { console.warn('[TemplatesStore][01018] html unpack failed:', e); next.html = ''; }
  }
  if (!next.previewHtml && next.previewHtmlSameAsHtml01018 === true) next.previewHtml = String(next.html || '');
  if (!next.previewHtml && next.previewHtmlCodec01018 === ST_TPL_PACK_CODEC_01018 && next.previewHtmlPacked01018) {
    try { next.previewHtml = stTplUnpackString01018_(next.previewHtmlPacked01018); }
    catch (e) { console.warn('[TemplatesStore][01018] preview unpack failed:', e); next.previewHtml = ''; }
  }
  return next;
}

function stTplInflateStorePayloads01018_(store) {
  if (!store || typeof store !== 'object' || !Array.isArray(store.items)) return store;
  store.items = store.items.map(stTplInflateUserPayload01018_);
  return store;
}

function compactTemplatesStoreForLocalStorage00542_(store) {
  // 00542: системні HTML-шаблони не повинні роздувати localStorage.
  // Вони і так приходять напряму з JS-модулів через runtime fallback у галереї.
  // У localStorage залишаємо користувацькі шаблони, папки та meta.
  const src = (store && typeof store === 'object') ? store : defaultStore();
  const out = {
    ...src,
    items: Array.isArray(src.items)
      ? src.items
          .filter((item) => item && !stTplStoreLooksSystemItem00542_(item))
          .map(stTplStripRuntimePayload00542_)
          .map(stTplCompactUserPayload01018_)
      : []
  };
  return out;
}


function purgeHugeTemplateStoreBackup00543_() {
  try {
    const backup = localStorage.getItem(LS_BACKUP_KEY);
    if (backup && backup.length > 200000) localStorage.removeItem(LS_BACKUP_KEY);
  } catch {}
}



function stripRemovedContentTemplates_(data) {
  try {
    const banned = new Set(['removed-content','sections']);
    const bannedIds = /^(fld_removed_content|fld_sections|removed_content_|section_)/i;
    const walk = (node) => {
      if (!node || typeof node !== 'object') return null;
      if (banned.has(String(node.type || '').toLowerCase())) return null;
      if (bannedIds.test(String(node.id || ''))) return null;
      const next = { ...node };
      if (Array.isArray(next.children)) next.children = next.children.map(walk).filter(Boolean);
      return next;
    };
    if (Array.isArray(data?.items)) data.items = data.items.filter((it) => it && !banned.has(String(it.type || '').toLowerCase()) && !bannedIds.test(String(it.id || '')) && !bannedIds.test(String(it.folderId || '')));
    if (data?.folders) data.folders = walk(data.folders) || data.folders;
  } catch {}
  return data;
}

function shrinkLoadedTemplateStore00543_(data) {
  try {
    if (!data || typeof data !== 'object' || !Array.isArray(data.items)) return data;
    const before = data.items.length;
    const compact = compactTemplatesStoreForLocalStorage00542_(data);
    const after = Array.isArray(compact.items) ? compact.items.length : 0;
    if (after !== before) {
      data.items = compact.items;
      data.version = Math.max(+data.version || 0, 11);
      try { saveTemplatesStore(data); } catch {}
    }
  } catch {}
  return stripRemovedContentTemplates_(data);
}

function defaultStore() {
  const sys = [
    { id: "fld_page",     type: "page",     name: "Сторінка", system: true },
    { id: "fld_header",   type: "header",   name: "Шапка",    system: true },
    { id: "fld_main",     type: "main",     name: "Маїн",      system: true },
    { id: "fld_shop",     type: "shop",     name: "Магазин",    system: true },
    { id: "fld_footer",   type: "footer",   name: "Футер",    system: true },
    { id: "fld_section_styles", type: "section-styles", name: "Стилі Секцій", system: true },
    { id: "fld_menu",     type: "menu",     name: "Меню",     system: true },
    { id: "fld_sidebar",  type: "sidebar",  name: "Сайтбар",  system: true }
  ];

  return stripRemovedContentTemplates_({
    version: 2,
    // meta: додаткові налаштування, які не є шаблонами/папками
    // deletedSiteFolderIds — список ID підкатегорій у вкладці "Сайт", які користувач видалив.
    // Це потрібно, бо ensureSiteFolderStructure() при кожному load() відновлює системні папки.
    meta: {
      deletedSiteFolderIds: [],
      deletedSystemTemplateIds: []
    },
    items: [], // templates
    folders: {
      id: "root",
      name: "Галерея шаблонів",
      system: true,
      children: sys.map(x => {
        if (x.type === "menu") return { id: x.id, type: x.type, name: x.name, system: true, children: buildMenuFolderChildren() };
        if (x.type === "sidebar") return { id: x.id, type: x.type, name: x.name, system: true, children: buildSidebarFolderChildren() };
        if (x.type === "main") return { id: x.id, type: x.type, name: x.name, system: true, children: buildMainFolderChildren01034_() };
        if (x.type === "shop") return { id: x.id, type: x.type, name: x.name, system: true, children: buildShopFolderChildren() };
        return { id: x.id, type: x.type, name: x.name, system: true, children: [] };
      })
    }
  });
}




function buildSiteFolderChildren() {
  return [
    { id: "fld_site_shop",      type: "site", name: "Магазин",     system: true, children: [] },
    { id: "fld_site_blog",      type: "site", name: "Блог",        system: true, children: [] },
    { id: "fld_site_education", type: "site", name: "Навчання",    system: true, children: [] },
    { id: "fld_site_medicine",  type: "site", name: "Медицина",    system: true, children: [] },
    { id: "fld_site_games",     type: "site", name: "Ігри",        system: true, children: [] },
    { id: "fld_site_society",   type: "site", name: "Суспільство", system: true, children: [] },
    { id: "fld_site_fishing",   type: "site", name: "Рибалка",     system: true, children: [] },
    { id: "fld_site_other",     type: "site", name: "Інше",        system: true, children: [] }
  ];
}

function buildShopFolderChildren() {
  return [
    { id: "fld_shop_category_cards", type: "shop", name: "Карточки категорій", system: true, children: [] },
    { id: "fld_shop_product_cards",  type: "shop", name: "Карточки товарів",  system: true, children: [] },
    { id: "fld_shop_product_pages",  type: "shop", name: "Сторінка товару",   system: true, children: [] }
  ];
}


function buildMenuFolderChildren() {
  return [
    { id: "fld_menu_header", type: "menu", name: "Меню шапки", system: true, children: [] },
    { id: "fld_menu_footer", type: "menu", name: "Меню Футера", system: true, children: [] },
    { id: "fld_menu_main", type: "menu", name: "Меню МАІН", system: true, children: [] }
  ];
}

function buildSidebarFolderChildren() {
  return [
    { id: "fld_sidebar_menu", type: "sidebar", name: "Меню сайтбара", system: true, children: [] }
  ];
}

function buildPhotoGalleryFolderChildren() {
  return [
    { id: "fld_photo_gallery_sections", type: "photo-gallery", name: "Шаблони секцій галереї", system: true, children: [] },
    { id: "fld_photo_gallery_categories", type: "photo-gallery", name: "Категорії фото", system: true, children: [
      { id: "fld_photo_gallery_cat_skovorody", type: "photo-gallery", name: "Сковороди", system: true, children: [] },
      { id: "fld_photo_gallery_cat_mangaly", type: "photo-gallery", name: "Мангали", system: true, children: [] },
      { id: "fld_photo_gallery_cat_kazany", type: "photo-gallery", name: "Казани", system: true, children: [] },
      { id: "fld_photo_gallery_cat_engraving", type: "photo-gallery", name: "Гравіювання", system: true, children: [] },
      { id: "fld_photo_gallery_cat_print", type: "photo-gallery", name: "Друк", system: true, children: [] },
      { id: "fld_photo_gallery_cat_reviews", type: "photo-gallery", name: "Фото відгуки", system: true, children: [] }
    ] }
  ];
}

function buildAiTemplatesFolderChildren() {
  return [
    { id: "fld_ai_site", type: "ai-templates", name: "Сайт-АІ", system: true, aiTemplateType: "site", children: [] },
    { id: "fld_ai_page", type: "ai-templates", name: "Сторінка-АІ", system: true, aiTemplateType: "page", children: [] },
    { id: "fld_ai_header", type: "ai-templates", name: "Шапка-АІ", system: true, aiTemplateType: "header", children: [] },
    { id: "fld_ai_footer", type: "ai-templates", name: "Футер-АІ", system: true, aiTemplateType: "footer", children: [] },
    { id: "fld_ai_shop", type: "ai-templates", name: "Магазин-АІ", system: true, aiTemplateType: "shop", children: [] },
    { id: "fld_ai_photo_gallery", type: "ai-templates", name: "Фото-галерея-АІ", system: true, aiTemplateType: "photo-gallery", children: [] },
    { id: "fld_ai_menu", type: "ai-templates", name: "Меню-АІ", system: true, aiTemplateType: "menu", children: [] },
    { id: "fld_ai_sidebar", type: "ai-templates", name: "Сайтбар-АІ", system: true, aiTemplateType: "sidebar", children: [] }
  ];
}



// =========================================================
// [00323][SHOP] Надійне засівання системних шаблонів магазину
// Причина: якщо вкладка/папки "Магазин" уже існували в localStorage,
// попередній seed міг не потрапити у реальний store або міг залишити stale-записи.
// Тому ремонтуємо саме store: додаємо відсутні 20+20 шаблонів карточок і 40 шаблонів сторінки товару, виправляємо folderId/type/html.
// =========================================================
function ensureShopSystemTemplatesSeededInStore(store) {
  // [00338][PERF]
  // Раніше кожен loadTemplatesStore() тягнув shop-card-templates.js і перевіряв/ремонтував
  // 120 важких HTML-шаблонів магазину. Це сповільнювало старт конструктора навіть тоді,
  // коли користувач взагалі не відкривав Галерею.
  // Тепер магазинні шаблони підсіюються тільки під час відкриття Галереї шаблонів
  // через ensureShopTemplates() у templates-gallery-view.js.
  return false;
}


function buildMainFolderChildren01034_() {
  return [
    { id: 'fld_main_clean', type: 'main', name: 'Чистий шаблон', system: true, mainRole: 'clean', children: [] },
    { id: 'fld_main_home', type: 'main', name: 'Головна', system: true, mainRole: 'home', children: [] },
    { id: 'fld_main_about', type: 'main', name: 'Про нас', system: true, mainRole: 'about', children: [] },
    { id: 'fld_main_contacts', type: 'main', name: 'Контакти', system: true, mainRole: 'contacts', children: [] },
    { id: 'fld_main_delivery', type: 'main', name: 'Оплата і доставка', system: true, mainRole: 'delivery', children: [] },
    { id: 'fld_main_warranty', type: 'main', name: 'Гарантія та повернення', system: true, mainRole: 'warranty', children: [] },
    { id: 'fld_main_faq', type: 'main', name: 'FAQ / Допомога', system: true, mainRole: 'faq', children: [] },
    { id: 'fld_main_services', type: 'main', name: 'Послуги / Персоналізація', system: true, mainRole: 'services', children: [] },
    { id: 'fld_main_wholesale', type: 'main', name: 'Оптовим клієнтам', system: true, mainRole: 'wholesale', children: [] },
    { id: 'fld_main_blog', type: 'main', name: 'Блог', system: true, mainRole: 'blog', children: [] },
    { id: 'fld_main_article', type: 'main', name: 'Стаття / Гайд', system: true, mainRole: 'article', children: [] },
    { id: 'fld_main_legal', type: 'main', name: 'Політики та умови', system: true, mainRole: 'legal', children: [] },
    { id: 'fld_main_other', type: 'main', name: 'Інше / Базові', system: true, mainRole: 'other', children: [] }
  ];
}

function ensureMainFolderStructure01034_(store) {
  const root = store?.folders;
  if (!root || !Array.isArray(root.children)) return false;
  let changed = false;
  let mainRoot = root.children.find(x => x && (x.id === 'fld_main' || x.type === 'main')) || null;
  if (!mainRoot) {
    mainRoot = { id: 'fld_main', type: 'main', name: 'Маїн', system: true, children: [] };
    root.children.push(mainRoot);
    changed = true;
  }
  if (mainRoot.name !== 'Маїн') { mainRoot.name = 'Маїн'; changed = true; }
  mainRoot.children = Array.isArray(mainRoot.children) ? mainRoot.children : [];

  const myId = 'fld_main_my_templates';
  const myFolder = mainRoot.children.find(x => x?.id === myId) || null;
  for (const child of buildMainFolderChildren01034_()) changed = ensureChildFolder(mainRoot, child) || changed;

  // Keep user templates first, then the canonical system categories.
  const order = [myId, ...buildMainFolderChildren01034_().map(x => x.id)];
  const ordered = [];
  for (const id of order) {
    const found = mainRoot.children.find(x => x?.id === id);
    if (found) ordered.push(found);
  }
  for (const child of mainRoot.children) {
    if (child && !ordered.includes(child)) ordered.push(child);
  }
  if (ordered.length === mainRoot.children.length && ordered.some((x,i)=>x!==mainRoot.children[i])) {
    mainRoot.children = ordered;
    changed = true;
  }
  return changed;
}

function buildPageThemeFolders01029_(roleKey) {
  const themes = [
    ['education', 'Освіта'],
    ['medicine', 'Медицина'],
    ['space', 'Космос'],
    ['technology', 'Технології'],
    ['shop', 'Магазин'],
    ['business', 'Бізнес'],
    ['restaurant', 'Ресторани / Їжа'],
    ['beauty', 'Краса'],
    ['building', 'Будівництво'],
    ['travel', 'Подорожі'],
    ['sport', 'Спорт'],
    ['auto', 'Авто'],
    ['realestate', 'Нерухомість'],
    ['services', 'Послуги'],
    ['other', 'Інше']
  ];
  return themes.map(([key, name]) => ({
    id: `fld_page_system_${roleKey}_${key}`,
    type: 'page',
    name,
    system: true,
    pageRole: roleKey,
    pageTheme: key,
    children: []
  }));
}

function buildPageSystemRole01029_(roleKey, name) {
  return {
    id: `fld_page_system_${roleKey}`,
    type: 'page',
    name,
    system: true,
    pageRole: roleKey,
    children: buildPageThemeFolders01029_(roleKey)
  };
}

function buildPageFolderChildren() {
  // 01029: canonical Page library hierarchy.
  // Page records stay lightweight Header/Main/Footer reference recipes.
  // User folders may be nested arbitrarily under "Мої сторінки".
  const pageUserTemplates = {
    id: 'fld_page_my_templates',
    type: 'page',
    name: 'Мої сторінки',
    system: true,
    userTemplatesRoot: true,
    children: []
  };

  const pageSystemTemplates = {
    id: 'fld_page_system',
    type: 'page',
    name: 'Системні сторінки',
    system: true,
    systemPagesRoot01029: true,
    children: [
      buildPageSystemRole01029_('clean', 'Чистий шаблон'),
      buildPageSystemRole01029_('home', 'Головна сторінка'),
      buildPageSystemRole01029_('about', 'Про нас'),
      buildPageSystemRole01029_('contacts', 'Контакти'),
      buildPageSystemRole01029_('services', 'Послуги'),
      buildPageSystemRole01029_('shop', 'Магазин / Каталог'),
      buildPageSystemRole01029_('category', 'Категорія / список товарів'),
      buildPageSystemRole01029_('product', 'Сторінка товару'),
      buildPageSystemRole01029_('blog', 'Блог'),
      buildPageSystemRole01029_('article', 'Стаття'),
      buildPageSystemRole01029_('pricing', 'Ціни'),
      buildPageSystemRole01029_('faq', 'FAQ'),
      buildPageSystemRole01029_('delivery', 'Доставка / Оплата'),
      buildPageSystemRole01029_('legal', 'Legal / 404')
    ]
  };

  return [pageUserTemplates, pageSystemTemplates];
}

function buildHmfMyTemplatesFolder01013_(area) {
  const safe = String(area || '').toLowerCase();
  const labels = { header: 'Шапка', main: 'Маїн', footer: 'Футер' };
  if (!labels[safe]) return null;
  return {
    id: `fld_${safe}_my_templates`,
    type: safe,
    name: 'МОЇ ШАБЛОНИ',
    system: true,
    userTemplatesRoot: true,
    areaLabel: labels[safe],
    children: []
  };
}

function ensureHmfMyTemplatesFolderStructure01013_(store) {
  const root = store?.folders;
  if (!root || !Array.isArray(root.children)) return false;
  let changed = false;
  for (const area of ['header', 'main', 'footer']) {
    const areaRoot = root.children.find((folder) => folder && (folder.id === `fld_${area}` || folder.type === area));
    if (!areaRoot) continue;
    areaRoot.children = Array.isArray(areaRoot.children) ? areaRoot.children : [];
    const wanted = buildHmfMyTemplatesFolder01013_(area);
    let current = areaRoot.children.find((folder) => folder && folder.id === wanted.id);
    if (!current) {
      current = wanted;
      areaRoot.children.unshift(current);
      changed = true;
    } else {
      current.type = area;
      current.name = 'МОЇ ШАБЛОНИ';
      current.system = true;
      current.userTemplatesRoot = true;
      current.children = Array.isArray(current.children) ? current.children : [];
      const index = areaRoot.children.indexOf(current);
      if (index > 0) {
        areaRoot.children.splice(index, 1);
        areaRoot.children.unshift(current);
        changed = true;
      }
    }
  }
  return changed;
}

function ensureChildFolder(parent, child) {
  if (!parent || !child) return false;
  parent.children = Array.isArray(parent.children) ? parent.children : [];
  const idx = parent.children.findIndex(x => x && x.id === child.id);
  if (idx >= 0) {
    // якщо вже є — акуратно мерджимо children для системних груп
    const existing = parent.children[idx];
    if (child.children && Array.isArray(child.children)) {
      existing.children = Array.isArray(existing.children) ? existing.children : [];
      for (const k of child.children) {
        ensureChildFolder(existing, k);
      }
    }
    // підтягнемо divider/system/name якщо треба
    if (child.divider) existing.divider = true;
    if (typeof child.system === "boolean") existing.system = child.system;
    if (child.type) existing.type = child.type;
    // ⚠️ ВАЖЛИВО: не перезаписуємо name для підкатегорій "Сайт" (fld_site_*)
    // бо користувач може перейменувати ці підкатегорії у галереї.
    // Інакше ensureSiteFolderStructure() при кожному load() відкотить назву назад.
    const isSiteSubFolder = (typeof child.id === "string") && child.id.startsWith("fld_site_") && child.id !== "fld_site";
    if (child.name && !(isSiteSubFolder && existing.name)) existing.name = child.name;
    return false;
  }
  parent.children.push(child);
  return true;
}

function ensureRootSystemFolder(store, wantedRoot) {
  const root = store?.folders;
  if (!root || !Array.isArray(root.children) || !wantedRoot || !wantedRoot.id) return false;
  return ensureChildFolder(root, wantedRoot);
}

function ensureRemovedContentFolderStructure(store) { return false; }

function ensureShopFolderStructure(store) {
  const wantedRoot = { id: "fld_shop", type: "shop", name: "Магазин", system: true, children: buildShopFolderChildren() };
  let changed = ensureRootSystemFolder(store, wantedRoot);

  const root = store?.folders;
  const shopRoot = root?.children?.find?.(x => x && (x.id === "fld_shop" || x.type === "shop")) || null;
  if (!shopRoot) return changed;

  const wanted = buildShopFolderChildren();
  for (const ch of wanted) {
    changed = ensureChildFolder(shopRoot, ch) || changed;
  }
  return changed;
}

function ensurePhotoGalleryFolderStructure(store) {
  const wantedRoot = { id: "fld_photo_gallery", type: "photo-gallery", name: "Фото-галерея", system: true, children: buildPhotoGalleryFolderChildren() };
  let changed = ensureRootSystemFolder(store, wantedRoot);

  const root = store?.folders;
  const galleryRoot = root?.children?.find?.(x => x && (x.id === "fld_photo_gallery" || x.type === "photo-gallery")) || null;
  if (!galleryRoot) return changed;

  const wanted = buildPhotoGalleryFolderChildren();
  for (const ch of wanted) {
    changed = ensureChildFolder(galleryRoot, ch) || changed;
  }
  return changed;
}

function ensureAiTemplatesFolderStructure(store) {
  const wantedRoot = { id: "fld_ai_templates", type: "ai-templates", name: "АІ шаблони", system: true, children: buildAiTemplatesFolderChildren() };
  let changed = ensureRootSystemFolder(store, wantedRoot);

  const root = store?.folders;
  const aiRoot = root?.children?.find?.(x => x && (x.id === "fld_ai_templates" || x.type === "ai-templates")) || null;
  if (!aiRoot) return changed;

  const wanted = buildAiTemplatesFolderChildren();
  for (const ch of wanted) {
    changed = ensureChildFolder(aiRoot, ch) || changed;
  }
  return changed;
}

function ensureMenuFolderStructure(store) {
  const wantedRoot = { id: "fld_menu", type: "menu", name: "Меню", system: true, children: buildMenuFolderChildren() };
  let changed = ensureRootSystemFolder(store, wantedRoot);

  const root = store?.folders;
  const menuRoot = root?.children?.find?.(x => x && (x.id === "fld_menu" || x.type === "menu")) || null;
  if (!menuRoot) return changed;

  const wanted = buildMenuFolderChildren();
  for (const ch of wanted) changed = ensureChildFolder(menuRoot, ch) || changed;

  // [00382] Вертикальні шаблони меню більше не живуть у вкладці "Меню".
  // Якщо стара папка залишилась у localStorage — прибираємо її, щоб не дублювати шаблони.
  const before = Array.isArray(menuRoot.children) ? menuRoot.children.length : 0;
  menuRoot.children = (menuRoot.children || []).filter(ch => ch && ch.id !== "fld_menu_sidebar");
  if (menuRoot.children.length !== before) changed = true;
  return changed;
}

function ensureSidebarFolderStructure(store) {
  const wantedRoot = { id: "fld_sidebar", type: "sidebar", name: "Сайтбар", system: true, children: buildSidebarFolderChildren() };
  let changed = ensureRootSystemFolder(store, wantedRoot);

  const root = store?.folders;
  const sidebarRoot = root?.children?.find?.(x => x && (x.id === "fld_sidebar" || x.type === "sidebar")) || null;
  if (!sidebarRoot) return changed;

  const wanted = buildSidebarFolderChildren();
  for (const ch of wanted) changed = ensureChildFolder(sidebarRoot, ch) || changed;
  return changed;
}

function ensureSectionStylesFolderStructure00950_(store) {
  return ensureRootSystemFolder(store, {
    id: "fld_section_styles",
    type: "section-styles",
    name: "Стилі Секцій",
    system: true,
    children: []
  });
}

function migrateSidebarMenuTemplatesToSidebarTab_(store) {
  try {
    if (!store || !Array.isArray(store.items)) return false;
    let changed = false;
    for (const item of store.items) {
      if (!item) continue;
      const id = String(item.id || '');
      const fid = String(item.folderId || '');
      const target = String(item?.meta?.menuTarget || item?.menuTarget || '').toLowerCase();
      const isSidebarMenu = id.startsWith('menu_sidebar_') || fid === 'fld_menu_sidebar' || target === 'sidebar';
      if (!isSidebarMenu) continue;
      if (item.type !== 'sidebar') { item.type = 'sidebar'; changed = true; }
      if (item.folderId !== 'fld_sidebar_menu') { item.folderId = 'fld_sidebar_menu'; changed = true; }
      if (!item.meta || typeof item.meta !== 'object') item.meta = {};
      if (item.meta.menuTarget !== 'sidebar') { item.meta.menuTarget = 'sidebar'; changed = true; }
      if (item.meta.fixedBy !== '00382') { item.meta.fixedBy = '00382'; changed = true; }
    }
    return changed;
  } catch (e) {
    console.warn('[TemplatesStore][00382] migrateSidebarMenuTemplatesToSidebarTab_ failed:', e);
    return false;
  }
}


function ensurePageFolderStructure(store) {
  const root = store?.folders;
  if (!root || !Array.isArray(root.children)) return false;

  let changed = false;
  let pageRoot = root.children.find(x => x && (x.id === 'fld_page' || x.type === 'page')) || null;
  if (!pageRoot) {
    pageRoot = { id: 'fld_page', type: 'page', name: 'Сторінка', system: true, children: [] };
    root.children.push(pageRoot);
    changed = true;
  }
  if (pageRoot.name !== 'Сторінка') { pageRoot.name = 'Сторінка'; changed = true; }
  pageRoot.children = Array.isArray(pageRoot.children) ? pageRoot.children : [];

  const wanted = buildPageFolderChildren();
  for (const ch of wanted) changed = ensureChildFolder(pageRoot, ch) || changed;

  // 01029 migration: move any recipes saved by 01028 directly in thematic root
  // folders into the new System pages -> Home -> Theme tree. No template payloads
  // are duplicated; only folderId is updated.
  const oldThemeToNew = new Map([
    ['fld_page_education','fld_page_system_home_education'],
    ['fld_page_medicine','fld_page_system_home_medicine'],
    ['fld_page_space','fld_page_system_home_space'],
    ['fld_page_technology','fld_page_system_home_technology'],
    ['fld_page_marketplace','fld_page_system_home_shop'],
    ['fld_page_business','fld_page_system_home_business'],
    ['fld_page_restaurant','fld_page_system_home_restaurant'],
    ['fld_page_beauty','fld_page_system_home_beauty'],
    ['fld_page_building','fld_page_system_home_building'],
    ['fld_page_travel','fld_page_system_home_travel'],
    ['fld_page_sport','fld_page_system_home_sport'],
    ['fld_page_auto','fld_page_system_home_auto'],
    ['fld_page_realestate','fld_page_system_home_realestate'],
    ['fld_page_services','fld_page_system_home_services'],
    ['fld_page_other','fld_page_system_home_other']
  ]);
  for (const item of (store.items || [])) {
    const currentFolderId = String(item?.folderId || '');
    const next = oldThemeToNew.get(currentFolderId)
      || (/^fld_page_system_[^_]+_marketplace$/.test(currentFolderId)
        ? currentFolderId.replace(/_marketplace$/, '_shop')
        : '');
    if (next && next !== currentFolderId) { item.folderId = next; changed = true; }
  }

  // 01030: the theme is called "Магазин" in the Page library. 01029 used the
  // technical Marketplace folder under every page-role. Remove those obsolete
  // system-only aliases after migrating their lightweight recipes to *_shop.
  const systemRoot01030 = pageRoot.children.find(x => x?.id === 'fld_page_system') || null;
  if (systemRoot01030) {
    for (const roleFolder of (systemRoot01030.children || [])) {
      if (!roleFolder || !Array.isArray(roleFolder.children)) continue;
      const obsoleteId = `${String(roleFolder.id || '')}_marketplace`;
      const before = roleFolder.children.length;
      roleFolder.children = roleFolder.children.filter(child => String(child?.id || '') !== obsoleteId);
      if (roleFolder.children.length !== before) changed = true;
    }
  }

  // Old drafts become a normal user subfolder instead of a third top-level group.
  const oldDraft = pageRoot.children.find(x => x?.id === 'fld_page_my_drafts') || null;
  const mine = pageRoot.children.find(x => x?.id === 'fld_page_my_templates') || null;
  if (oldDraft && mine) {
    const hasDraftItems = (store.items || []).some(it => String(it?.folderId || '') === 'fld_page_my_drafts');
    if (hasDraftItems) {
      let draftChild = (mine.children || []).find(x => x?.id === 'fld_page_my_drafts') || null;
      if (!draftChild) {
        draftChild = { ...oldDraft, name: 'Чернетки', system: false, children: Array.isArray(oldDraft.children) ? oldDraft.children : [] };
        mine.children = Array.isArray(mine.children) ? mine.children : [];
        mine.children.push(draftChild);
      }
      changed = true;
    }
  }

  // Keep exactly the requested top-level order: My pages, System pages.
  const keepIds = new Set(['fld_page_my_templates','fld_page_system']);
  const extras = pageRoot.children.filter(x => x && !keepIds.has(String(x.id || '')));
  // Preserve truly custom user folders by moving them under My pages instead of deleting.
  if (mine) {
    mine.children = Array.isArray(mine.children) ? mine.children : [];
    for (const extra of extras) {
      const oldId = String(extra?.id || '');
      const isLegacySystem = oldThemeToNew.has(oldId) || oldId === 'fld_page_my_drafts' || oldId === 'fld_page_divider_1';
      if (!isLegacySystem && extra && extra.system !== true && !mine.children.some(x => x?.id === oldId)) {
        mine.children.push(extra);
      }
    }
  }
  const nextChildren = ['fld_page_my_templates','fld_page_system']
    .map(id => pageRoot.children.find(x => x?.id === id))
    .filter(Boolean);
  if (nextChildren.length !== pageRoot.children.length || nextChildren.some((x,i)=>x!==pageRoot.children[i])) {
    pageRoot.children = nextChildren;
    changed = true;
  }

  return changed;
}

function ensureSiteFolderStructure(store) {
  const root = store?.folders;
  if (!root || !Array.isArray(root.children)) return false;

  const siteRoot = root.children.find(x => x && (x.id === "fld_site" || x.type === "site")) || null;
  if (!siteRoot) return false;

  const wanted = buildSiteFolderChildren();

  // ✅ Якщо користувач видалив деякі підкатегорії у вкладці "Сайт",
  // то НЕ відновлюємо їх при ensure...
  const deletedIds = Array.isArray(store?.meta?.deletedSiteFolderIds)
    ? new Set(store.meta.deletedSiteFolderIds.filter(Boolean))
    : new Set();

  let changed = false;
  for (const ch of wanted) {
    if (ch && ch.id && deletedIds.has(ch.id)) continue;
    changed = ensureChildFolder(siteRoot, ch) || changed;
  }
  return changed;
}

export function loadTemplatesStore() {
  purgeHugeTemplateStoreBackup00543_();
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    const init = defaultStore();
    ensureHmfMyTemplatesFolderStructure01013_(init);
    ensureMainFolderStructure01034_(init);
    ensurePageFolderStructure(init);
    ensureShopFolderStructure(init);
    ensureShopSystemTemplatesSeededInStore(init);
    saveTemplatesStore(init);
    return init;
  }

  const data = stTplInflateStorePayloads01018_(safeParse(raw, null));
  if (!data || typeof data !== "object") {
    // try backup before hard reset
    const backupRaw = (() => { try { return localStorage.getItem(LS_BACKUP_KEY); } catch (e) { return null; } })();
    const backup = backupRaw ? stTplInflateStorePayloads01018_(safeParse(backupRaw, null)) : null;
    if (backup && typeof backup === "object") {
      // restore backup
      try { saveTemplatesStore(backup); } catch (e) {}
      return backup;
    }
    const reset = defaultStore();
    ensureHmfMyTemplatesFolderStructure01013_(reset);
    ensureMainFolderStructure01034_(reset);
    ensurePageFolderStructure(reset);
    ensureShopFolderStructure(reset);
    ensureShopSystemTemplatesSeededInStore(reset);
    saveTemplatesStore(reset);
    return reset;
  }

  // міграція на v2 (якщо стара версія без folders)
  if (!data.folders) {
    const migrated = defaultStore();
    migrated.items = Array.isArray(data.items) ? data.items : [];
    ensureHmfMyTemplatesFolderStructure01013_(migrated);
    ensureMainFolderStructure01034_(migrated);
    ensurePageFolderStructure(migrated);
    ensureShopFolderStructure(migrated);
    ensureShopSystemTemplatesSeededInStore(migrated);
    saveTemplatesStore(migrated);
    return migrated;
  }

  // базова валідація
  if (!Array.isArray(data.items)) data.items = [];
  if (!data.folders || !data.folders.children) data.folders = defaultStore().folders;
  shrinkLoadedTemplateStore00543_(data);

  // meta (сумісність зі старими версіями)
  if (!data.meta || typeof data.meta !== 'object') data.meta = defaultStore().meta;
  if (!Array.isArray(data.meta.deletedSiteFolderIds)) data.meta.deletedSiteFolderIds = [];

  // =========================================================
  // МІГРАЦІЯ: прибираємо старі тестові шаблони шапки (безповоротно)
  // - користувач вирішив більше їх не використовувати
  // - щоб не заважали у Галереї
  // =========================================================
  if (!Number.isFinite(+data.version) || +data.version < 3) {
    const DROP_IDS = new Set([
      // старі DEMO/TEST шаблони шапки
      "header_layout_basic",
      "header_global_green_v1",
      "header_page_red_v1"
    ]);

    const before = Array.isArray(data.items) ? data.items.length : 0;
    data.items = (data.items || []).filter(x => !(x && DROP_IDS.has(x.id)));
    const after = data.items.length;

    data.version = 3;
    if (before !== after) {
      saveTemplatesStore(data);
    } else {
      // все одно фіксуємо версію, щоб не повторювати міграцію
      saveTemplatesStore(data);
    }
  }


  // =========================================================
  // МІГРАЦІЯ 01034: структура папок Main + 01029 структура папок для вкладки "Сторінка"
  // - Мої сторінки + Системні сторінки -> тип сторінки -> тематика
  // - без видалення user-даних
  // =========================================================
  try {
    const changedFolders = ensurePageFolderStructure(data);
    const changedMainFolders01034 = ensureMainFolderStructure01034_(data);
    const changedSiteFolders = ensureSiteFolderStructure(data);
    const changedRemovedContentFolders = ensureRemovedContentFolderStructure(data);
    const changedShopFolders = ensureShopFolderStructure(data);
    const changedPhotoGalleryFolders = ensurePhotoGalleryFolderStructure(data);
    const changedAiTemplatesFolders = ensureAiTemplatesFolderStructure(data);
    const changedMenuFolders = ensureMenuFolderStructure(data);
    const changedSidebarFolders = ensureSidebarFolderStructure(data);
    const changedSectionStylesFolder00950 = ensureSectionStylesFolderStructure00950_(data);
    const changedHmfMyTemplates01013 = ensureHmfMyTemplatesFolderStructure01013_(data);
    const changedSidebarMenuTemplates = migrateSidebarMenuTemplatesToSidebarTab_(data);
    const changedAny = changedFolders || changedMainFolders01034 || changedSiteFolders || changedRemovedContentFolders || changedShopFolders || changedPhotoGalleryFolders || changedAiTemplatesFolders || changedMenuFolders || changedSidebarFolders || changedSectionStylesFolder00950 || changedHmfMyTemplates01013 || changedSidebarMenuTemplates;
    if (changedAny) {
      data.version = Math.max(+data.version || 0, 12);
      saveTemplatesStore(data);
    }
  } catch (e) {
    console.warn("[TemplatesStore] ensureFolderStructure failed:", e);
  }

  // Ensure meta defaults (for backward compatibility)
  if (!data.meta || typeof data.meta !== 'object') data.meta = {};
  if (!Array.isArray(data.meta.deletedSiteFolderIds)) data.meta.deletedSiteFolderIds = [];
  if (!Array.isArray(data.meta.deletedSystemTemplateIds)) data.meta.deletedSystemTemplateIds = [];


  // 00323: магазинні системні шаблони мають бути в store завжди,
  // а не лише після окремого виклику gallery seed.
  try {
    if (ensureShopSystemTemplatesSeededInStore(data)) {
      data.version = Math.max(+data.version || 0, 9);
      saveTemplatesStore(data);
    }
  } catch (e) {
    console.warn("[TemplatesStore] ensureShopSystemTemplatesSeededInStore failed:", e);
  }


  // =========================================================
  // МІГРАЦІЯ v5: заміна старих стандартних шаблонів Шапки
  // - прибираємо тільки старі системні/demo IDs;
  // - користувацькі шаблони шапки НЕ чіпаємо;
  // - нові 5 системних шаблонів додає ensureHeaderTemplates() через upsertSystemTemplatesOnce().
  // =========================================================
  if (!Number.isFinite(+data.version) || +data.version < 5) {
    const DROP_HEADER_IDS_V5 = new Set([
      "header_layout_basic",
      "header_global_green_v1",
      "header_page_red_v1",
      "header_canvas_global_v2",
      "header_canvas_page_v2",
      "header_global_green_demo",
      "header_page_red_demo"
    ]);

    data.items = (data.items || []).filter((x) => !(x && DROP_HEADER_IDS_V5.has(x.id)));
    data.version = 5;
    saveTemplatesStore(data);
  }


  // =========================================================
  // МІГРАЦІЯ v6: заміна старих стандартних шаблонів Футера
  // - прибираємо тільки старі системні/demo IDs футера;
  // - користувацькі футер-шаблони НЕ чіпаємо;
  // - нові 5 системних шаблонів додає ensureFooterTemplates() через upsertSystemTemplatesOnce().
  // =========================================================
  if (!Number.isFinite(+data.version) || +data.version < 6) {
    const DROP_FOOTER_IDS_V6 = new Set([
      "footer_canvas_minimal_v1",
      "footer_canvas_3cols_v1",
      "footer_canvas_center_cta_v1",
      "footer_global_demo",
      "footer_page_demo",
      "footer_layout_basic"
    ]);

    data.items = (data.items || []).filter((x) => !(x && DROP_FOOTER_IDS_V6.has(x.id)));
    data.version = 6;
    saveTemplatesStore(data);
  }

  return data;
}

export function saveTemplatesStore(store) {
  // 00542: перед записом стискаємо store — системні шаблони не пишемо у LS.
  // Це прибирає QuotaExceededError у консолі, але не прибирає системні шаблони з галереї,
  // бо вони мержаться з JS-модулів через runtime fallback.
  const storeToSave = compactTemplatesStoreForLocalStorage00542_(store);
  let serialized = '';
  try { serialized = JSON.stringify(storeToSave); } catch (e) {
    console.warn('[TemplatesStore] saveTemplatesStore stringify failed:', e);
    return false;
  }

  try {
    const prev = localStorage.getItem(LS_KEY);
    // [00546] Не дублюємо великі stores у backup — це створювало постійні perf warning-и і добивало quota.
    if (prev && prev.length < 200000) localStorage.setItem(LS_BACKUP_KEY, prev);
    else localStorage.removeItem(LS_BACKUP_KEY);
  } catch (e) {
    try { localStorage.removeItem(LS_BACKUP_KEY); } catch (_) {}
  }

  try {
    localStorage.setItem(LS_KEY, serialized);
    return true;
  } catch (e) {
    try { localStorage.removeItem(LS_BACKUP_KEY); } catch (_) {}
    try {
      localStorage.setItem(LS_KEY, serialized);
      return true;
    } catch (retryError) {
      console.warn('[TemplatesStore][00542] saveTemplatesStore failed even after compact save:', retryError || e);
      return false;
    }
  }
}

  // -------- templates API (як було) --------
export function listTemplatesByType(type) {
  const st = loadTemplatesStore();
  return st.items.filter(x => x && x.type === type);
}

export function getTemplateById(id) {
  const st = loadTemplatesStore();
  return st.items.find(x => x && x.id === id) || null;
}

export function addTemplate({ type, name, html, folderId, id = null, preview = "", previewHtml = "", description = "", meta = null } = {}) {
  const st = loadTemplatesStore();
  const now = nowISO();
  const srcMeta = (meta && typeof meta === "object") ? meta : {};
  const item = {
    id: id ? String(id) : uid(type || "template"),
    type,
    name: name || "Без назви",
    html: String(html || ""),
    folderId: folderId || null,
    meta: { createdAt: srcMeta.createdAt || now, updatedAt: srcMeta.updatedAt || now, source: srcMeta.source || "user", ...srcMeta }
  };
  if (preview) item.preview = String(preview);
  if (previewHtml) item.previewHtml = String(previewHtml);
  if (description) item.description = String(description);

  // Якщо шаблон з таким id уже є — оновлюємо в одному місці, а не дублюємо.
  const idx = (st.items || []).findIndex((x) => x && x.id === item.id);
  if (idx >= 0) st.items[idx] = { ...(st.items[idx] || {}), ...item };
  else st.items.unshift(item);

  const persisted01018 = saveTemplatesStore(st);
  let verified01018 = false;
  if (persisted01018) {
    try {
      const raw01018 = safeParse(localStorage.getItem(LS_KEY), null);
      verified01018 = !!raw01018?.items?.some?.((entry) => entry && entry.id === item.id);
    } catch {}
  }
  try { Object.defineProperty(item, '__persisted01018', { value: verified01018, enumerable: false, configurable: true }); } catch {}
  if (!verified01018) console.warn('[TemplatesStore][01018] template was not persisted:', item.id);
  return item;
}

// 00544: системні шаблони живуть у JS-модулях, localStorage зберігає лише користувацькі шаблони.
function stripRuntimeTemplatePayload00544_(it) {
  if (!it || typeof it !== 'object') return it;
  return it;
}

// Системні демо (як було)
export function upsertSystemTemplatesOnce(systemItems) {
  const st = loadTemplatesStore();
  st.items = Array.isArray(st.items) ? st.items : [];
  let changed = false;

  for (const it of systemItems) {
    if (!it || !it.id) continue;
    // If admin deleted a system template earlier, don't re-seed it
    const deleted = Array.isArray(st?.meta?.deletedSystemTemplateIds) ? st.meta.deletedSystemTemplateIds : [];
    if (deleted.includes(it.id)) continue;

    const cleanIt = stripRuntimeTemplatePayload00544_(it);
    const normalized = {
      ...cleanIt,
      folderId: cleanIt.folderId || null,
      meta: {
        ...(cleanIt.meta || {}),
        source: "system",
        createdAt: cleanIt.meta?.createdAt || nowISO(),
        updatedAt: nowISO(),
        fixedBy: cleanIt.meta?.fixedBy || "00371"
      }
    };

    const idx = st.items.findIndex(x => x && x.id === it.id);
    if (idx < 0) {
      st.items.push(normalized);
      changed = true;
      continue;
    }

    const prev = st.items[idx] || {};
    const prevSource = String(prev?.meta?.source || prev?.source || '').toLowerCase();
    const looksSystem = prevSource === 'system' || prev.system === true || String(prev.folderId || '').startsWith('fld_');
    if (!looksSystem) continue;

    // [00371] System templates must be repaired in existing localStorage too.
    // Previously this function only inserted missing IDs; users who already had
    // old header/footer HTML kept broken cached templates forever.
    st.items[idx] = {
      ...prev,
      ...normalized,
      meta: {
        ...(prev.meta || {}),
        ...(normalized.meta || {}),
        source: "system",
        createdAt: prev.meta?.createdAt || normalized.meta.createdAt,
        updatedAt: nowISO(),
        fixedBy: normalized.meta?.fixedBy || "00371"
      }
    };
    changed = true;
  }

  if (changed) saveTemplatesStore(st);
  return st;
}

// -------- folders API --------

function walkFolders(node, cb) {
  cb(node);
  const kids = Array.isArray(node.children) ? node.children : [];
  for (const ch of kids) walkFolders(ch, cb);
}

// ВНУТРІШНІ хелпери: працюють із заданим деревом (без повторного load)
function findFolderByIdIn_(root, folderId) {
  if (!root || !folderId) return null;
  let found = null;
  walkFolders(root, (n) => {
    if (n && n.id === folderId) found = n;
  });
  return found;
}

function findParentByChildIdIn_(root, childId) {
  if (!root || !childId) return null;
  const walk = (node) => {
    const kids = Array.isArray(node?.children) ? node.children : [];
    for (const ch of kids) {
      if (ch && ch.id === childId) return node;
      const p = walk(ch);
      if (p) return p;
    }
    return null;
  };
  return walk(root);
}

function isDirectChildOfSiteRoot_(st, folderId) {
  try {
    const root = st?.folders;
    const parent = findParentByChildIdIn_(root, folderId);
    return !!parent && parent.id === 'fld_site';
  } catch (e) {
    return false;
  }
}

export function getMyTemplatesFolderId01013(area) {
  const safe = String(area || '').toLowerCase();
  return ['header','main','footer'].includes(safe) ? `fld_${safe}_my_templates` : '';
}

export function ensureMyTemplatesFolders01013() {
  const st = loadTemplatesStore();
  const changed = ensureHmfMyTemplatesFolderStructure01013_(st);
  if (changed) saveTemplatesStore(st);
  return { ok: true, changed, folders: st.folders };
}

export function listFoldersForArea01013(area, { myTemplatesOnly = false } = {}) {
  const safe = String(area || '').toLowerCase();
  const st = loadTemplatesStore();
  ensureHmfMyTemplatesFolderStructure01013_(st);
  const areaRoot = findFolderByIdIn_(st.folders, `fld_${safe}`);
  if (!areaRoot) return [];
  const start = myTemplatesOnly ? findFolderByIdIn_(areaRoot, `fld_${safe}_my_templates`) : areaRoot;
  if (!start) return [];
  const out = [];
  const walk = (node, depth = 0, path = []) => {
    if (!node) return;
    out.push({ id: node.id, type: node.type, name: node.name, system: !!node.system, userTemplatesRoot: !!node.userTemplatesRoot, depth, path: [...path, node.name] });
    for (const child of (Array.isArray(node.children) ? node.children : [])) {
      if (child?.divider) continue;
      walk(child, depth + 1, [...path, node.name]);
    }
  };
  walk(start, 0, []);
  return out;
}

export function getFoldersRoot() {
  return loadTemplatesStore().folders;
}

export function findFolderById(folderId) {
  const st = loadTemplatesStore();
  return findFolderByIdIn_(st.folders, folderId);
}

export function createFolder({ parentId = "root", type, name, system = false }) {
  const st = loadTemplatesStore();
  const parent = parentId === "root" ? st.folders : findFolderByIdIn_(st.folders, parentId);

  if (!parent) return null;

  const folder = {
    id: uid("fld"),
    type: type || null,         // для вкладок (може бути null для кастомних)
    name: name || "Нова категорія",
    system: !!system,
    children: []
  };

  parent.children = Array.isArray(parent.children) ? parent.children : [];
  parent.children.push(folder);

  saveTemplatesStore(st);
  return folder;
}


// -------- folder edit/delete API --------
// rename: only for non-system folders
export function renameFolderById(folderId, newName) {
  try {
    const name = String(newName || '').trim();
    if (!folderId) return { ok: false, reason: 'no_id' };
    if (!name) return { ok: false, reason: 'empty_name' };

    const st = loadTemplatesStore();
    const f = findFolderByIdIn_(st.folders, folderId);
    if (!f) return { ok: false, reason: 'not_found' };

    // System folders are normally locked.
    // Exception: "Сайт" categories (subfolders under the Site root)
    // are allowed to be renamed by the user.
    // Дозволяємо редагувати підкатегорії всередині папки "Сайт" (fld_site),
    // навіть якщо вони позначені як system.
    const allowSystemSiteFolder = (f.id !== 'fld_site' && isDirectChildOfSiteRoot_(st, folderId));
    if (f.system && !allowSystemSiteFolder) return { ok: false, reason: 'system_folder' };

    f.name = name;
    saveTemplatesStore(st);
    return { ok: true };
  } catch (e) {
    console.error('[TemplatesStore] renameFolderById error', e);
    return { ok: false, reason: 'exception' };
  }
}

// delete: only for non-system folders; forbidden if has children or templates
export function deleteFolderById(folderId) {
  try {
    if (!folderId) return { ok: false, reason: 'no_id' };

    const st = loadTemplatesStore();
    const root = st.folders;

    const target = findFolderByIdIn_(root, folderId);
    if (!target) return { ok: false, reason: 'not_found' };

    // System folders are normally locked.
    // Exception: "Сайт" categories (subfolders under the Site root)
    // are allowed to be deleted (but still forbidden if not empty).
    const allowSystemSiteFolder = (target.id !== 'fld_site' && isDirectChildOfSiteRoot_(st, folderId));
    if (target.system && !allowSystemSiteFolder) return { ok: false, reason: 'system_folder' };

    // forbid if has children
    if (Array.isArray(target.children) && target.children.length) {
      return { ok: false, reason: 'has_children' };
    }

    // forbid if templates exist in this folder
    const items = Array.isArray(st.items) ? st.items : [];
    const hasTemplates = items.some(it => it && it.folderId === folderId);
    if (hasTemplates) return { ok: false, reason: 'not_empty' };

    const parent = findParentByChildIdIn_(root, folderId);
    if (!parent || !Array.isArray(parent.children)) return { ok: false, reason: 'no_parent' };

    // ✅ Якщо це системна підкатегорія "Сайт" — ...
    if (allowSystemSiteFolder && target.system) {
      st.meta = st.meta && typeof st.meta === 'object' ? st.meta : defaultStore().meta;
      st.meta.deletedSiteFolderIds = Array.isArray(st.meta.deletedSiteFolderIds) ? st.meta.deletedSiteFolderIds : [];
      if (!st.meta.deletedSiteFolderIds.includes(folderId)) st.meta.deletedSiteFolderIds.push(folderId);
    }

    parent.children = parent.children.filter(ch => ch && ch.id !== folderId);
    saveTemplatesStore(st);
    return { ok: true };
  } catch (e) {
    console.error('[TemplatesStore] deleteFolderById error', e);
    return { ok: false, reason: 'exception' };
  }
}

// -------- delete API --------
// Видаляємо ТІЛЬКИ користувацькі шаблони (system-шаблони не видаляємо)
// Повертає { ok: boolean, reason?: string }
export function deleteTemplateById(templateId) {
  try {
    if (!templateId) return { ok: false, reason: 'no_id' };

    const st = loadTemplatesStore();
    const items = Array.isArray(st.items) ? st.items : [];
    const idx = items.findIndex((it) => it && it.id === templateId);
    if (idx === -1) return { ok: false, reason: 'not_found' };

    const it = items[idx];
    const isSystem = it?.meta?.source === 'system' || it?.folder?.system === true;

    // System-шаблони теж можна видаляти через галерею,
    // але ми запамʼятовуємо їх ID, щоб upsertSystemTemplatesOnce() не додав їх знову.
    if (isSystem) {
      if (!st.meta || typeof st.meta !== 'object') st.meta = {};
      if (!Array.isArray(st.meta.deletedSystemTemplateIds)) st.meta.deletedSystemTemplateIds = [];
      if (!st.meta.deletedSystemTemplateIds.includes(templateId)) st.meta.deletedSystemTemplateIds.push(templateId);
    }

    items.splice(idx, 1);
    st.items = items;
    saveTemplatesStore(st);
    return { ok: true };
  } catch (e) {
    console.warn('[templates-store] deleteTemplateById failed', e);
    return { ok: false, reason: 'error' };
  }
}


// =========================================================
// FS BACKUP (Variant 2): choose folder on disk and write backups there
// - uses File System Access API (Chrome/Edge)
// - stores DirectoryHandle in IndexedDB (so it survives reload)
// - MERGE import by template id
// =========================================================

const IDB_DB = 'st_fs_backup_db_v1';
const IDB_STORE = 'kv';
const IDB_KEY_DIR = 'templates_backup_dir_handle_v1';

function idbOpen_() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet_(key) {
  const db = await idbOpen_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const st = tx.objectStore(IDB_STORE);
    const req = st.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet_(key, val) {
  const db = await idbOpen_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const st = tx.objectStore(IDB_STORE);
    const req = st.put(val, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export function canUseFsAccessApi() {
  return !!(window.showDirectoryPicker && window.showOpenFilePicker);
}

function isoStamp_() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

export function mergeStoresById(current, incoming) {
  const out = JSON.parse(JSON.stringify(current || defaultStore()));
  const inc = incoming && typeof incoming === 'object' ? incoming : null;
  if (!inc) return out;

  // merge meta
  out.version = Math.max(+out.version || 0, +inc.version || 0);

  // merge folders by id (shallow), keep existing children union
  const outFolders = Array.isArray(out.folders) ? out.folders : [];
  const incFolders = Array.isArray(inc.folders) ? inc.folders : [];
  const map = new Map(outFolders.map(f => [f.id, f]));
  for (const f of incFolders) {
    if (!f || !f.id) continue;
    if (!map.has(f.id)) {
      outFolders.push(f);
      map.set(f.id, f);
    } else {
      const cur = map.get(f.id);
      // shallow merge
      for (const k of Object.keys(f)) cur[k] = f[k];
      // union children if both arrays
      if (Array.isArray(cur.children) && Array.isArray(f.children)) {
        const set = new Set(cur.children.filter(Boolean));
        for (const ch of f.children) set.add(ch);
        cur.children = Array.from(set);
      }
    }
  }
  out.folders = outFolders;

  // merge items by id (replace-by-id)
  const outItems = Array.isArray(out.items) ? out.items : [];
  const incItems = Array.isArray(inc.items) ? inc.items : [];
  const imap = new Map(outItems.map(t => [t.id, t]));
  for (const t of incItems) {
    if (!t || !t.id) continue;
    if (imap.has(t.id)) {
      const idx = outItems.findIndex(x => x && x.id === t.id);
      if (idx >= 0) outItems[idx] = t;
    } else {
      outItems.push(t);
    }
    imap.set(t.id, t);
  }
  out.items = outItems;

  // ensure required folder structure exists (esp. page tab)
  try { ensurePageFolderStructure(out); } catch(e) {}
  try { ensureSiteFolderStructure(out); } catch(e) {}
  try { ensureRemovedContentFolderStructure(out); } catch(e) {}
  try { ensureShopFolderStructure(out); } catch(e) {}
  try { ensurePhotoGalleryFolderStructure(out); } catch(e) {}
  try { ensureAiTemplatesFolderStructure(out); } catch(e) {}
  try { ensureMenuFolderStructure(out); } catch(e) {}
  try { ensureSidebarFolderStructure(out); } catch(e) {}
  try { ensureHmfMyTemplatesFolderStructure01013_(out); } catch(e) {}
  try { migrateSidebarMenuTemplatesToSidebarTab_(out); } catch(e) {}
  try { ensureSystemFolders(out); } catch(e) {}

  return out;
}

export function mergeTemplatesStore(incomingStore) {
  const cur = loadTemplatesStore();
  const merged = mergeStoresById(cur, incomingStore);
  saveTemplatesStore(merged);
  return merged;
}

export async function pickTemplatesBackupFolder() {
  if (!canUseFsAccessApi()) return { ok: false, reason: 'no-fs-api' };
  try {
    const dir = await window.showDirectoryPicker();
    // request permission up-front
    try { await dir.requestPermission({ mode: 'readwrite' }); } catch(e) {}
    await idbSet_(IDB_KEY_DIR, dir);
    return { ok: true };
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.code === 20)) return { ok: false, reason: 'aborted' };
    console.warn('[TPL][FS] pick folder failed', e);
    return { ok: false, reason: 'error' };
  }
}

export async function getPickedTemplatesBackupFolder() {
  try {
    const dir = await idbGet_(IDB_KEY_DIR);
    if (!dir) return null;
    // verify permission
    try {
      const perm = await dir.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        const req = await dir.requestPermission({ mode: 'readwrite' });
        if (req !== 'granted') return null;
      }
    } catch (e) {
      // ignore; will fail on write if no permission
    }
    return dir;
  } catch (e) {
    return null;
  }
}

export async function writeTemplatesBackupToFolder() {
  const dir = await getPickedTemplatesBackupFolder();
  if (!dir) return { ok: false, reason: 'no-folder' };
  try {
    const st = loadTemplatesStore();
    const payload = { exportVersion: 1, exportedAt: new Date().toISOString(), store: st };
    const fname = `shifttime-templates-backup-${isoStamp_()}.json`;
    const fh = await dir.getFileHandle(fname, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(payload, null, 2));
    await w.close();
    return { ok: true, filename: fname };
  } catch (e) {
    console.warn('[TPL][FS] backup write failed', e);
    return { ok: false, reason: 'error' };
  }
}

export async function importTemplatesFromBackupFileMerge() {
  if (!canUseFsAccessApi()) return { ok: false, reason: 'no-fs-api' };
  try {
    const dir = await getPickedTemplatesBackupFolder();
    const pickerOpts = {
      types: [{ description: 'ShiftTime Templates Backup', accept: { 'application/json': ['.json'] } }],
      excludeAcceptAllOption: false,
      multiple: false,
    };
    if (dir) pickerOpts.startIn = dir;

    const [fh] = await window.showOpenFilePicker(pickerOpts);
    const file = await fh.getFile();
    const txt = await file.text();
    const parsed = JSON.parse(txt);
    const st = parsed && parsed.store ? parsed.store : parsed;
    if (!st || typeof st !== 'object') return { ok: false, reason: 'bad-file' };
    mergeTemplatesStore(st);
    return { ok: true, filename: file.name };
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, reason: 'aborted' };
    console.warn('[TPL][FS] import merge failed', e);
    return { ok: false, reason: 'error' };
  }
}

// =========================================================
// COMPAT EXPORTS (gallery/view layer expects these names)
// =========================================================
// NOTE: В сторі джерело правди — st.items (масив шаблонів).
// Галерея оперує "folderId" і очікує функції з назвами
// getTemplatesByFolderId / createTemplate / updateTemplateById / deleteTemplateById.

export function getTemplatesByFolderId(folderId) {
  const st = loadTemplatesStore();
  return st.items.filter((t) => t.folderId === folderId);
}

export function getTemplatesSummary({ folderId = null } = {}) {
  const st = loadTemplatesStore();
  const items = folderId ? st.items.filter((t) => t.folderId === folderId) : st.items;
  const byType = items.reduce((acc, t) => {
    const k = String(t.type || 'unknown');
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  return { total: items.length, byType };
}

export function createTemplate(payload) {
  return addTemplate(payload);
}

export function updateTemplateById(templateId, patch) {
  return updateTemplate(templateId, patch);
}
