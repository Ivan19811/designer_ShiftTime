// js/design/ai-command/selection/selection-command-layer.js
// Окремий безпечний шар AI/voice-команд виділення.
// Не змінює стилі, не виконує runtime-операції, не створює блоки.
// Перетворює команди типу "виділи другу кнопку в шапці" у реальний selection.

const WORD_LEFT = String.raw`(^|[^\p{L}\p{N}_-])`;
const WORD_RIGHT = String.raw`(?=$|[^\p{L}\p{N}_-])`;

function normalizeText(text){
  return String(text || '')
    .toLowerCase()
    .replace(/[’'`ʼ]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordRe(source, flags = 'iu'){
  return new RegExp(`${WORD_LEFT}(?:${source})${WORD_RIGHT}`, flags);
}

function hasWord(text, source){
  return wordRe(source, 'iu').test(String(text || ''));
}

function escapeRegExp(value){
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasAnyPhrase(text, phrases){
  const normalized = normalizeText(text);
  return (phrases || []).some((phrase) => {
    const src = escapeRegExp(normalizeText(phrase)).replace(/\\s\+/g, String.raw`\s+`);
    return wordRe(src, 'iu').test(normalized);
  });
}

function escapeCss(value){
  try {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
  } catch (_) {}
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

const SELECTION_ACTION_RE = String.raw`виділ(?:и|ити|іть|ив|ила|і)|вибер(?:и|іть|у)|вибрав|вибрала|обер(?:и|іть)|активуй|зроби\s+активн(?:им|ою|е|ий)|постав\s+активн(?:им|ою|е|ий)|перейди\s+до|select|activate`;

export function isSelectionCommandPrompt(text){
  const normalized = normalizeText(text);
  if (!normalized) return false;
  return wordRe(SELECTION_ACTION_RE, 'iu').test(normalized);
}

const TARGET_DEFS = [
  {
    type: 'menu_item',
    label: 'пункт меню',
    pattern: String.raw`пункт(?:\s+меню)?|пункти\s+меню|елемент(?:и)?\s+меню|menu\s*item|menu\s*items`,
    selector: '.st-block--menu-item, [data-st-menu-item], .st-menu__link',
    selectionType: 'block',
  },
  {
    type: 'button',
    label: 'кнопка',
    pattern: String.raw`кнопк[а-яіїєґ]*|button|buttons|cta`,
    selector: '.st-block--button',
    selectionType: 'block',
  },
  {
    type: 'logo',
    label: 'логотип',
    pattern: String.raw`логотип[а-яіїєґ]*|лого|logo`,
    selector: '.st-block--logo',
    selectionType: 'block',
  },
  {
    type: 'phone',
    label: 'телефон',
    pattern: String.raw`телефон[а-яіїєґ]*|номер[а-яіїєґ]*|контактн(?:ий|ого|ому)?\s+номер|phone`,
    selector: '.st-block--phone',
    selectionType: 'block',
  },
  {
    type: 'menu',
    label: 'меню',
    pattern: String.raw`меню|навігац[а-яіїєґ]*|nav|navigation`,
    selector: '.st-block--menu, [data-st-menu]',
    selectionType: 'block',
  },
  {
    type: 'heading',
    label: 'заголовок',
    pattern: String.raw`заголовк[а-яіїєґ]*|блок\s+заголовк[а-яіїєґ]*|heading|title|h[1-6]`,
    selector: '.st-block--heading, [data-block-kind="heading"], [data-block-role="heading"]',
    selectionType: 'block',
  },
  {
    type: 'text',
    label: 'текст',
    pattern: String.raw`текстов(?:ий|ого|ому|у)?\s+блок|текст[а-яіїєґ]*|напис[а-яіїєґ]*|підпис[а-яіїєґ]*|text`,
    selector: '.st-block--text, [data-block-kind="text"], [data-block-role="text"]',
    selectionType: 'block',
  },
  {
    type: 'article',
    label: 'стаття',
    pattern: String.raw`статт[яіюі]|article|абзацн(?:ий|ого|ому)?\s+блок`,
    selector: '.st-block--article, [data-block-kind="article"], [data-block-role="article"]',
    selectionType: 'block',
  },
  {
    type: 'icon',
    label: 'іконка',
    pattern: String.raw`іконк[а-яіїєґ]*|значок|icon`,
    selector: '.st-block--icon, [data-block-kind="icon"], [data-block-role="icon"]',
    selectionType: 'block',
  },
  {
    type: 'image',
    label: 'зображення',
    pattern: String.raw`картинк[а-яіїєґ]*|зображенн[яюі]|фото|png|image|picture`,
    selector: '.st-block--png, .st-png__media, [data-block-kind="png"], [data-block-kind="image"]',
    selectionType: 'block',
  },
  {
    type: 'line',
    label: 'лінія',
    pattern: String.raw`ліні[яюі]|розділювач[а-яіїєґ]*|divider|line`,
    selector: '.st-block--line, [data-block-kind="line"], [data-block-role="line"]',
    selectionType: 'block',
  },
  {
    type: 'row',
    label: 'рівень/ряд',
    pattern: String.raw`рівен[ьяі]?|рівн[іяю]|ряд[а-яіїєґ]*|row|level`,
    selector: '.st-row',
    selectionType: 'row',
  },
  {
    type: 'section',
    label: 'секція',
    pattern: String.raw`секці[яєюії]|розділ[а-яіїєґ]*|section`,
    selector: '.st-section',
    selectionType: 'section',
  },
  {
    type: 'container',
    label: 'контейнер',
    pattern: String.raw`контейнер[а-яіїєґ]*|обгортк[а-яіїєґ]*|коробк[а-яіїєґ]*|container`,
    selector: '.st-block',
    selectionType: 'block',
  },
  {
    type: 'block',
    label: 'блок',
    pattern: String.raw`блок[а-яіїєґ]*|елемент[а-яіїєґ]*|block|element`,
    selector: '.st-block',
    selectionType: 'block',
  },
];

function findTargetDef(text){
  const normalized = normalizeText(text);
  let best = null;
  for (const def of TARGET_DEFS) {
    const re = wordRe(def.pattern, 'iu');
    const match = re.exec(normalized);
    if (!match) continue;
    const index = match.index + String(match[1] || '').length;
    const item = { def, index, length: match[0].length - String(match[1] || '').length, matchText: match[0].trim() };
    if (!best || item.index < best.index || (item.index === best.index && item.length > best.length)) best = item;
  }
  return best;
}

function findTargetDefInText(text, allowedTypes = null){
  const normalized = normalizeText(text);
  let best = null;
  const allowed = allowedTypes ? new Set(allowedTypes) : null;
  for (const def of TARGET_DEFS) {
    if (allowed && !allowed.has(def.type)) continue;
    const re = wordRe(def.pattern, 'iu');
    const match = re.exec(normalized);
    if (!match) continue;
    const index = match.index + String(match[1] || '').length;
    const item = { def, index, length: match[0].length - String(match[1] || '').length, matchText: match[0].trim() };
    if (!best || item.index < best.index || (item.index === best.index && item.length > best.length)) best = item;
  }
  return best;
}

const ORDINAL_PATTERNS = [
  [50, String.raw`пятдесят[\p{L}\p{N}_-]*`],
  [49, String.raw`сорок\s+девят[\p{L}\p{N}_-]*`], [48, String.raw`сорок\s+восьм[\p{L}\p{N}_-]*`], [47, String.raw`сорок\s+сьом[\p{L}\p{N}_-]*`],
  [46, String.raw`сорок\s+шост[\p{L}\p{N}_-]*`], [45, String.raw`сорок\s+пят[\p{L}\p{N}_-]*`], [44, String.raw`сорок\s+четверт[\p{L}\p{N}_-]*`],
  [43, String.raw`сорок\s+трет[\p{L}\p{N}_-]*`], [42, String.raw`сорок\s+друг[\p{L}\p{N}_-]*`], [41, String.raw`сорок\s+перш[\p{L}\p{N}_-]*`],
  [40, String.raw`сороков[\p{L}\p{N}_-]*`],
  [39, String.raw`тридцять\s+девят[\p{L}\p{N}_-]*`], [38, String.raw`тридцять\s+восьм[\p{L}\p{N}_-]*`], [37, String.raw`тридцять\s+сьом[\p{L}\p{N}_-]*`],
  [36, String.raw`тридцять\s+шост[\p{L}\p{N}_-]*`], [35, String.raw`тридцять\s+пят[\p{L}\p{N}_-]*`], [34, String.raw`тридцять\s+четверт[\p{L}\p{N}_-]*`],
  [33, String.raw`тридцять\s+трет[\p{L}\p{N}_-]*`], [32, String.raw`тридцять\s+друг[\p{L}\p{N}_-]*`], [31, String.raw`тридцять\s+перш[\p{L}\p{N}_-]*`],
  [30, String.raw`тридцят[\p{L}\p{N}_-]*`],
  [29, String.raw`двадцять\s+девят[\p{L}\p{N}_-]*`], [28, String.raw`двадцять\s+восьм[\p{L}\p{N}_-]*`], [27, String.raw`двадцять\s+сьом[\p{L}\p{N}_-]*`],
  [26, String.raw`двадцять\s+шост[\p{L}\p{N}_-]*`], [25, String.raw`двадцять\s+пят[\p{L}\p{N}_-]*`], [24, String.raw`двадцять\s+четверт[\p{L}\p{N}_-]*`],
  [23, String.raw`двадцять\s+трет[\p{L}\p{N}_-]*`], [22, String.raw`двадцять\s+друг[\p{L}\p{N}_-]*`], [21, String.raw`двадцять\s+перш[\p{L}\p{N}_-]*`],
  [20, String.raw`двадцят[\p{L}\p{N}_-]*`],
  [19, String.raw`девятнадц[\p{L}\p{N}_-]*`], [18, String.raw`вісімнадц[\p{L}\p{N}_-]*`], [17, String.raw`сімнадц[\p{L}\p{N}_-]*`],
  [16, String.raw`шістнадц[\p{L}\p{N}_-]*`], [15, String.raw`пятнадц[\p{L}\p{N}_-]*`], [14, String.raw`чотирнадц[\p{L}\p{N}_-]*`],
  [13, String.raw`тринадц[\p{L}\p{N}_-]*`], [12, String.raw`дванадц[\p{L}\p{N}_-]*`], [11, String.raw`одинадц[\p{L}\p{N}_-]*`],
  [10, String.raw`десят[\p{L}\p{N}_-]*`],
  [9, String.raw`девят[\p{L}\p{N}_-]*`], [8, String.raw`восьм[\p{L}\p{N}_-]*`], [7, String.raw`сьом[\p{L}\p{N}_-]*`], [6, String.raw`шост[\p{L}\p{N}_-]*`],
  [5, String.raw`пят[\p{L}\p{N}_-]*`], [4, String.raw`четверт[\p{L}\p{N}_-]*`], [3, String.raw`трет[\p{L}\p{N}_-]*`], [2, String.raw`друг[\p{L}\p{N}_-]*`], [1, String.raw`перш[\p{L}\p{N}_-]*`],
];

function findOrdinalMatches(text){
  const normalized = normalizeText(text);
  const hits = [];

  const numericRe = /(^|[^\d])(\d{1,2})(?:\s*(?:-?й|-?а|-?у|-?е|ша|га|тя))?(?=$|[^\d])/giu;
  let numericMatch;
  while ((numericMatch = numericRe.exec(normalized))) {
    const n = Number.parseInt(numericMatch[2], 10);
    if (Number.isInteger(n) && n >= 1 && n <= 50) {
      hits.push({ value: n, index: numericMatch.index + String(numericMatch[1] || '').length, text: numericMatch[2] });
    }
  }

  for (const [value, pattern] of ORDINAL_PATTERNS) {
    const re = wordRe(pattern, 'giu');
    let match;
    while ((match = re.exec(normalized))) {
      const index = match.index + String(match[1] || '').length;
      hits.push({ value, index, text: match[0].trim() });
    }
  }

  hits.sort((a, b) => a.index - b.index || String(b.text || '').length - String(a.text || '').length);
  const deduped = [];
  for (const hit of hits) {
    const overlaps = deduped.some((item) => Math.abs(item.index - hit.index) < 2 || (hit.index >= item.index && hit.index < item.index + String(item.text || '').length));
    if (!overlaps) deduped.push(hit);
  }
  return deduped;
}

function parseSingleOrdinal(text){
  const hits = findOrdinalMatches(text);
  return hits.length ? hits[0].value : null;
}

function selectionIsExplicit(selection){
  if (!selection) return false;
  if (selection.mode === 'single') {
    return selection.label !== 'перший за замовчуванням';
  }
  return ['all', 'last', 'last_offset', 'range', 'indices'].includes(selection.mode);
}

function ordinalHitEnd(hit){
  return Number(hit?.index || 0) + String(hit?.text || '').length;
}

function parseOrdinalRange(text){
  const p = normalizeText(text)
    .replace(/([\p{L}]+)\s*[-–—]\s*([\p{L}]+)/giu, '$1 - $2');
  if (!p) return null;

  const hits = findOrdinalMatches(p).filter((item) => item.value >= 1 && item.value <= 50);
  for (let i = 0; i < hits.length - 1; i += 1) {
    const fromHit = hits[i];
    const toHit = hits[i + 1];
    const between = p.slice(ordinalHitEnd(fromHit), toHit.index).trim();
    const before = p.slice(Math.max(0, fromHit.index - 18), fromHit.index).trim();
    const hasRangeConnector = /^(?:-|–|—|по|до)$/u.test(between);
    const hasRangePrefix = /(?:^|\s)(?:з|із|від)$/u.test(before);
    if (!hasRangeConnector) continue;
    if (between === '-' || between === '–' || between === '—' || hasRangePrefix || /^(?:по|до)$/u.test(between)) {
      const from = fromHit.value;
      const to = toHit.value;
      if (from >= 1 && to >= from && to <= 50) return { mode: 'range', from, to, label: `${from}-${to}` };
    }
  }

  return null;
}

function startsWithSelectionToken(text){
  const p = normalizeText(text);
  if (!p) return false;
  if (/^(?:з|із|від)\s+/u.test(p)) return true;
  if (/^\d{1,2}\s*(?:-|–|—|по|до)\s*\d{1,2}(?=$|\s|[.,;:!?])/u.test(p)) return true;
  const firstOrdinal = findOrdinalMatches(p)[0];
  return !!(firstOrdinal && firstOrdinal.index === 0);
}

function parseSelectionMode(source){
  const p = normalizeText(source);
  if (!p) return { mode: 'single', indices: [1], label: 'перший за замовчуванням' };

  if (hasWord(p, String.raw`усі|всі|весь|всю|all|every`)) {
    return { mode: 'all', indices: [], label: 'усі' };
  }
  if (hasWord(p, String.raw`останн[\p{L}\p{N}_-]*|last`)) {
    return { mode: 'last', indices: [], label: 'останній' };
  }
  if (hasWord(p, String.raw`передостанн[\p{L}\p{N}_-]*`)) {
    return { mode: 'last_offset', offset: 1, indices: [], label: 'передостанній' };
  }

  const numericRange = /(?:^|\s)(?:з|із|від)?\s*(\d{1,2})\s*(?:-|–|—|по|до)\s*(\d{1,2})(?=$|\s|[.,;:!?])/u.exec(p);
  if (numericRange) {
    const from = Number.parseInt(numericRange[1], 10);
    const to = Number.parseInt(numericRange[2], 10);
    if (from >= 1 && to >= from && to <= 50) return { mode: 'range', from, to, label: `${from}-${to}` };
  }

  const ordinalRange = parseOrdinalRange(p);
  if (ordinalRange) return ordinalRange;

  const rangeRe = /(?:^|\s)(?:з|із|від)\s+([\p{L}\p{N}\s-]{1,60}?)\s+(?:по|до)\s+([\p{L}\p{N}\s-]{1,60}?)(?=$|\s|,|[.;:!?])/u;
  const rangeMatch = rangeRe.exec(p);
  if (rangeMatch) {
    const from = parseSingleOrdinal(rangeMatch[1]);
    const to = parseSingleOrdinal(rangeMatch[2]);
    if (from && to && to >= from) return { mode: 'range', from, to, label: `${from}-${to}` };
  }

  const ordinals = findOrdinalMatches(p).map((item) => item.value);
  const unique = Array.from(new Set(ordinals)).filter((n) => n >= 1 && n <= 50);
  if (unique.length > 1) return { mode: 'indices', indices: unique, label: unique.join(', ') };
  if (unique.length === 1) return { mode: 'single', indices: [unique[0]], label: String(unique[0]) };

  return { mode: 'single', indices: [1], label: 'перший за замовчуванням' };
}

function parseTargetSelection(normalizedText, targetMatch){
  const prefix = normalizeText(String(normalizedText || '').slice(0, targetMatch?.index || 0));
  const fromPrefix = parseSelectionMode(prefix);
  if (selectionIsExplicit(fromPrefix)) return fromPrefix;

  const afterTarget = normalizeText(String(normalizedText || '').slice((targetMatch?.index || 0) + (targetMatch?.length || 0)));
  if (startsWithSelectionToken(afterTarget)) {
    const fromTail = parseSelectionMode(afterTarget);
    if (selectionIsExplicit(fromTail)) return fromTail;
  }

  return fromPrefix;
}

const REGION_SYNONYMS = {
  site: [
    'весь сайт', 'всю сторінку', 'вся сторінка', 'весь canvas',
    'сайт', 'сайті', 'сайту', 'сайта', 'на сайті', 'у сайті', 'в сайті',
    'сторінка', 'сторінці', 'сторінку', 'на сторінці', 'у сторінці',
    'полотно', 'полотні', 'canvas', 'site',
  ],
  header: [
    'шапка', 'шапці', 'шапку', 'шапки', 'хедер', 'хедері', 'хедеру', 'header', 'верх сайту', 'верх сайта', 'верхня частина сайту',
  ],
  footer: [
    'футер', 'футері', 'футеру', 'підвал', 'підвалі', 'низ сайту', 'низ сайта', 'footer', 'нижня частина сайту',
  ],
  main: [
    'тіло сайту', 'тілі сайту', 'тілу сайту', 'тіло', 'тілі', 'тілу',
    'main', 'body', 'боді', 'бади', 'контент', 'основна частина', 'основній частині', 'середина сайту', 'середині сайту',
    'мейн', 'мейні', 'мейну', 'мейна', 'мейни',
    'маін', 'маіні', 'маїні', 'маину', 'маини', 'маїн', 'маїні',
    'майн', 'майні', 'майну', 'майни',
    'меїн', 'меїні', 'меину', 'меини',
  ],
};

function getRegion(text){
  const p = normalizeText(text);
  const explicitAllSite = /(?:весь|всю|ус[еі]|всі[єю]?)\s+(?:сайт|сторінк|полотно)|(?:site|canvas)/iu.test(p);
  const explicitSiteLocation = /(?:^|\s)(?:в|у|на)\s+(?:сайті|сайту|сайта|сторінці|сторінку|полотні)(?=$|[\s.,;:!?])/iu.test(p);
  if (explicitAllSite || explicitSiteLocation || hasAnyPhrase(p, REGION_SYNONYMS.site) || hasAnyPhrase(p, ['весь сайт', 'всю сторінку', 'весь canvas'])) return { key: 'site', label: 'весь сайт' };
  if (hasAnyPhrase(p, REGION_SYNONYMS.header)) return { key: 'header', label: 'шапка' };
  if (hasAnyPhrase(p, REGION_SYNONYMS.footer)) return { key: 'footer', label: 'футер' };
  if (hasAnyPhrase(p, REGION_SYNONYMS.main)) return { key: 'main', label: 'тіло сайту' };
  return { key: 'auto', label: 'поточний контекст або сайт' };
}

function inferActiveRegionKey(){
  try {
    const headerSlot = document.getElementById('st-site-header-slot');
    const footerSlot = document.getElementById('st-site-footer-slot');
    const siteRoot = document.getElementById('site-root');
    const active = document.querySelector('.is-active') || document.querySelector('.is-selected');
    if (!active) return 'site';
    if (headerSlot && headerSlot.contains(active)) return 'header';
    if (footerSlot && footerSlot.contains(active)) return 'footer';
    if (siteRoot && siteRoot.contains(active)) return 'main';
  } catch (_) {}
  return 'site';
}

function getRegionRoot(regionKey){
  const siteRoot = document.getElementById('site-root');
  const headerSlot = document.getElementById('st-site-header-slot');
  const footerSlot = document.getElementById('st-site-footer-slot');
  if (regionKey === 'header') return headerSlot || null;
  if (regionKey === 'footer') return footerSlot || null;
  return siteRoot || document.body || null;
}

function isInsideRegion(el, regionKey){
  if (!el) return false;
  const headerSlot = document.getElementById('st-site-header-slot');
  const footerSlot = document.getElementById('st-site-footer-slot');
  if (regionKey === 'header') return !!(headerSlot && headerSlot.contains(el));
  if (regionKey === 'footer') return !!(footerSlot && footerSlot.contains(el));
  if (regionKey === 'main') {
    if (headerSlot && headerSlot.contains(el)) return false;
    if (footerSlot && footerSlot.contains(el)) return false;
    return !!(document.getElementById('site-root')?.contains(el));
  }
  if (regionKey === 'site' || regionKey === 'auto') return !!(document.getElementById('site-root')?.contains(el));
  return true;
}

function isIgnoredElement(el){
  return !!(el && el.closest && el.closest('.hb-panel, .fb-panel, #design-panel-root, .builder__settings, .builder__settings-panels, .builder__sidebar'));
}

function uniqueElements(elements){
  const seen = new Set();
  const out = [];
  for (const el of elements || []) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    out.push(el);
  }
  return out;
}

function sortElementsForSelection(elements){
  return uniqueElements(elements).sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition ? a.compareDocumentPosition(b) : 0;
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function queryCandidates(scopeRoot, selector, regionKey){
  if (!scopeRoot || !selector) return [];
  let list = [];
  try {
    list = Array.from(scopeRoot.querySelectorAll(selector));
    if (scopeRoot.matches && scopeRoot.matches(selector)) list.unshift(scopeRoot);
  } catch (error) {
    console.warn('[selection-command-layer] bad selector', selector, error);
  }
  return sortElementsForSelection(list.filter((el) => isInsideRegion(el, regionKey) && !isIgnoredElement(el)));
}

function parseParentScope(text, targetMatch, regionKey){
  const tail = normalizeText(String(text || '').slice((targetMatch?.index || 0) + (targetMatch?.length || 0)));
  if (!tail) return null;
  const parentTarget = findTargetDefInText(tail, ['container', 'block', 'section', 'row']);
  if (!parentTarget) return null;

  // Parent scope should be explicitly nested, not just a second target word.
  const beforeParent = tail.slice(0, parentTarget.index);
  if (!/(?:^|\s)(?:у|в|всередині|внутрі|всередин[а-яіїєґ]*)\s*$/u.test(beforeParent.slice(-24))) {
    if (!/(?:^|\s)(?:у|в|всередині|внутрі|всередин[а-яіїєґ]*)\s+/u.test(beforeParent)) return null;
  }

  const parentPrefix = tail.slice(0, parentTarget.index);
  const selection = parseSelectionMode(parentPrefix);
  const parentIndex = selection.mode === 'single' && selection.indices?.[0] ? selection.indices[0] : 1;
  return {
    type: parentTarget.def.type,
    label: parentTarget.def.label,
    selector: parentTarget.def.selector,
    index: parentIndex,
    selection,
    regionKey,
  };
}

function pickBySelection(candidates, selection){
  const total = candidates.length;
  if (!total) return [];
  const sel = selection || { mode: 'single', indices: [1] };
  if (sel.mode === 'all') return candidates.slice();
  if (sel.mode === 'last') return [candidates[total - 1]].filter(Boolean);
  if (sel.mode === 'last_offset') return [candidates[Math.max(0, total - 1 - Number(sel.offset || 0))]].filter(Boolean);
  if (sel.mode === 'range') {
    const from = Math.max(1, Number(sel.from || 1));
    const to = Math.min(total, Number(sel.to || from));
    return candidates.slice(from - 1, to);
  }
  const indices = Array.isArray(sel.indices) && sel.indices.length ? sel.indices : [1];
  return indices.map((n) => candidates[Number(n) - 1]).filter(Boolean);
}

function elementLabel(el, index){
  if (!el) return `#${index + 1}`;
  const id = el.id ? `#${el.id}` : '';
  const role = el.dataset?.blockRole || el.dataset?.blockKind || el.dataset?.secRole || '';
  const cls = String(el.className || '').split(/\s+/).filter(Boolean).slice(0, 4).join('.');
  return `${index + 1}: ${el.tagName?.toLowerCase?.() || 'el'}${id}${role ? `[${role}]` : ''}${cls ? `.${cls}` : ''}`;
}

function selectedCandidateDetails(candidates, selected){
  const selectedSet = new Set(selected || []);
  return (candidates || [])
    .map((el, index) => selectedSet.has(el) ? { index: index + 1, element: el, label: elementLabel(el, index) } : null)
    .filter(Boolean);
}

function getSelectionTypeForResult(targetType, regionKey){
  if (regionKey === 'header') return 'header-inner';
  if (regionKey === 'footer') return 'footer-inner';
  if (targetType === 'section') return 'section';
  if (targetType === 'row') return 'row';
  return 'block';
}

function applySelection(elements, targetType, regionKey){
  const safe = uniqueElements(elements).filter(Boolean);
  const type = getSelectionTypeForResult(targetType, regionKey);
  const SEL = window.ST_SELECTION || null;

  if (SEL && typeof SEL.setMany === 'function') {
    return SEL.setMany(safe, { type });
  }

  if (SEL && typeof SEL.clear === 'function') {
    SEL.clear();
  } else {
    document.querySelectorAll('.is-selected, .is-active, .hb-dom-active, .hb-dom-selected').forEach((el) => {
      if (!isIgnoredElement(el)) el.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
    });
  }

  safe.forEach((el, index) => {
    el.classList.add('is-selected', 'hb-dom-selected');
    if (index === 0) el.classList.add('is-active', 'hb-dom-active');
    else el.classList.remove('is-active', 'hb-dom-active');
  });

  const detail = { type, elements: safe };
  document.dispatchEvent(new CustomEvent('st:selection-changed', { detail }));
  return detail;
}

function countInRegion(regionKey, targetDef, parent = null){
  const root = parent || getRegionRoot(regionKey === 'auto' ? 'site' : regionKey);
  return queryCandidates(root, targetDef.selector, regionKey === 'auto' ? 'site' : regionKey).length;
}

export function parseSelectionCommand(text){
  const normalized = normalizeText(text);
  if (!isSelectionCommandPrompt(normalized)) return { ok: false, handled: false, reason: 'not_selection_command' };

  const targetMatch = findTargetDef(normalized);
  if (!targetMatch) {
    return { ok: false, handled: true, reason: 'target_not_found', normalizedText: normalized, message: 'Не зрозумів, який елемент потрібно виділити.' };
  }

  const region = getRegion(normalized);
  const effectiveRegionKey = region.key === 'auto' ? inferActiveRegionKey() : region.key;
  const targetSelection = parseTargetSelection(normalized, targetMatch);
  const parentScope = parseParentScope(normalized, targetMatch, effectiveRegionKey);

  return {
    ok: true,
    handled: true,
    sourceText: String(text || ''),
    normalizedText: normalized,
    action: 'select_elements',
    targetType: targetMatch.def.type,
    targetLabel: targetMatch.def.label,
    targetSelector: targetMatch.def.selector,
    selectionType: targetMatch.def.selectionType,
    selection: targetSelection,
    region,
    effectiveRegionKey,
    parentScope,
  };
}

export function previewSelectionCommand(parsed){
  if (!parsed || parsed.ok === false) {
    return {
      ok: false,
      handled: !!parsed?.handled,
      status: 'FAIL',
      message: parsed?.message || 'Команду виділення не підготовлено.',
      parsedCommand: parsed || null,
      candidatesCount: 0,
      selectedCount: 0,
      selectedIndexes: [],
      candidatesPreview: [],
    };
  }

  const regionKey = parsed.effectiveRegionKey || 'site';
  let scopeRoot = getRegionRoot(regionKey);
  if (!scopeRoot) {
    return {
      ok: false,
      handled: true,
      status: 'FAIL',
      message: `Не знайшов область: ${parsed.region?.label || regionKey}.`,
      parsedCommand: parsed,
      candidatesCount: 0,
      selectedCount: 0,
      selectedIndexes: [],
      candidatesPreview: [],
    };
  }

  let parentResult = null;
  if (parsed.parentScope) {
    const parentCandidates = queryCandidates(scopeRoot, parsed.parentScope.selector, regionKey);
    const parentEl = parentCandidates[Math.max(0, Number(parsed.parentScope.index || 1) - 1)] || null;
    parentResult = {
      requestedType: parsed.parentScope.type,
      requestedIndex: parsed.parentScope.index,
      candidatesCount: parentCandidates.length,
      found: !!parentEl,
      label: parentEl ? elementLabel(parentEl, Number(parsed.parentScope.index || 1) - 1) : null,
      candidatesPreview: parentCandidates.slice(0, 12).map(elementLabel),
    };
    if (!parentEl) {
      return {
        ok: false,
        handled: true,
        status: 'FAIL',
        message: `Не знайшов ${parsed.parentScope.index}-й ${parsed.parentScope.label} у області "${parsed.region?.label || regionKey}".`,
        parsedCommand: parsed,
        parentResult,
        candidatesCount: 0,
        selectedCount: 0,
        selectedIndexes: [],
        candidatesPreview: [],
      };
    }
    scopeRoot = parentEl;
  }

  const candidates = queryCandidates(scopeRoot, parsed.targetSelector, regionKey);
  const selected = pickBySelection(candidates, parsed.selection);
  const selectedDetails = selectedCandidateDetails(candidates, selected);
  const selectedIndexes = selectedDetails.map((item) => item.index);
  return {
    ok: selected.length > 0,
    handled: true,
    status: selected.length > 0 ? 'PASS' : 'FAIL',
    message: selected.length > 0
      ? `План: буде виділено ${selected.length} з ${candidates.length}: ${parsed.targetLabel} · область: ${parsed.region?.label || regionKey}.`
      : `План: не знайдено ${parsed.selection?.label || ''} ${parsed.targetLabel} у області "${parsed.region?.label || regionKey}". Кандидатів: ${candidates.length}.`,
    parsedCommand: parsed,
    parentResult,
    candidatesCount: candidates.length,
    selectedCount: selected.length,
    selectedIndexes,
    candidatesPreview: candidates.slice(0, 20).map(elementLabel),
    selectedPreview: selectedDetails.map((item) => item.label),
  };
}

export function executeSelectionCommand(parsed){
  if (!parsed || parsed.ok === false) {
    return {
      ok: false,
      handled: !!parsed?.handled,
      status: 'FAIL',
      message: parsed?.message || 'Команду виділення не виконано.',
      parsedCommand: parsed || null,
    };
  }

  const regionKey = parsed.effectiveRegionKey || 'site';
  let scopeRoot = getRegionRoot(regionKey);
  if (!scopeRoot) {
    return {
      ok: false,
      handled: true,
      status: 'FAIL',
      message: `Не знайшов область: ${parsed.region?.label || regionKey}.`,
      parsedCommand: parsed,
      candidatesCount: 0,
      selectedCount: 0,
    };
  }

  let parentResult = null;
  if (parsed.parentScope) {
    const parentCandidates = queryCandidates(scopeRoot, parsed.parentScope.selector, regionKey);
    const parentEl = parentCandidates[Math.max(0, Number(parsed.parentScope.index || 1) - 1)] || null;
    parentResult = {
      requestedType: parsed.parentScope.type,
      requestedIndex: parsed.parentScope.index,
      candidatesCount: parentCandidates.length,
      found: !!parentEl,
      label: parentEl ? elementLabel(parentEl, Number(parsed.parentScope.index || 1) - 1) : null,
    };
    if (!parentEl) {
      return {
        ok: false,
        handled: true,
        status: 'FAIL',
        message: `Не знайшов ${parsed.parentScope.index}-й ${parsed.parentScope.label} у області "${parsed.region?.label || regionKey}".`,
        parsedCommand: parsed,
        parentResult,
        candidatesCount: 0,
        selectedCount: 0,
      };
    }
    scopeRoot = parentEl;
  }

  const candidates = queryCandidates(scopeRoot, parsed.targetSelector, regionKey);
  const selected = pickBySelection(candidates, parsed.selection);
  if (!selected.length) {
    return {
      ok: false,
      handled: true,
      status: 'FAIL',
      message: `Не знайшов ${parsed.selection?.label || ''} ${parsed.targetLabel} у області "${parsed.region?.label || regionKey}". Знайдено кандидатів: ${candidates.length}.`,
      parsedCommand: parsed,
      parentResult,
      candidatesCount: candidates.length,
      selectedCount: 0,
      candidates: candidates.map(elementLabel),
    };
  }

  const selectedDetails = selectedCandidateDetails(candidates, selected);
  const selectionDetail = applySelection(selected, parsed.targetType, regionKey);
  const allLabel = parsed.selection?.mode === 'all' ? 'усі ' : '';
  const message = `Виділено ${allLabel}${selected.length} з ${candidates.length}: ${parsed.targetLabel} · область: ${parsed.region?.label || regionKey}.`;
  return {
    ok: true,
    handled: true,
    status: 'PASS',
    message,
    parsedCommand: parsed,
    parentResult,
    candidatesCount: candidates.length,
    selectedCount: selected.length,
    selectedIndexes: selectedDetails.map((item) => item.index),
    selected: selectedDetails.map((item) => item.label),
    selectionAfter: {
      type: selectionDetail.type,
      selectedCount: selected.length,
      selectedElements: selected.map((el, index) => ({
        index,
        candidateIndex: selectedDetails[index]?.index || null,
        id: el.id || null,
        tag: el.tagName?.toLowerCase?.() || null,
        className: String(el.className || ''),
        blockKind: el.dataset?.blockKind || null,
        blockRole: el.dataset?.blockRole || null,
      })),
    },
  };
}

export function handleSelectionCommandPrompt(text, options = {}){
  const parsed = parseSelectionCommand(text);
  if (!parsed.handled) return { handled: false };
  const result = executeSelectionCommand(parsed);
  const detail = {
    handled: true,
    ok: result.ok !== false,
    status: result.status || (result.ok === false ? 'FAIL' : 'PASS'),
    message: result.message,
    parsedCommand: parsed,
    executionResult: result,
  };
  if (typeof options.onHandled === 'function') {
    try { options.onHandled(detail); } catch (error) { console.warn('[selection-command-layer] onHandled failed', error); }
  }
  return detail;
}
