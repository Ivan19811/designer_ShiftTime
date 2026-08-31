// js/design/widgets/ai-templates/ai-templates-apply.js
// Безпечне застосування demo recipe через наявний pipeline Header Builder
// + прямий fallback для звичайного режиму Дизайну шапки.
// Додатково: AI-іконки тепер підтягуються з локальної галереї / Lucide,
// а не падають у дефолтну стрілку, якщо в описі є конкретна іконка.

import { galEnsureSeed, galListFolders, galListItems, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';
import { resolveAiIconFromManifest } from './icon-resolver.js';

function inHeaderBuilder(){
  return !!(document.body && document.body.classList && document.body.classList.contains('st-header-builder-on'));
}

function dispatch(name, detail){
  try {
    window.dispatchEvent(new CustomEvent(name, detail === undefined ? undefined : { detail }));
    return true;
  } catch(e) {
    console.warn('[ai-templates] dispatch failed:', name, e);
    return false;
  }
}

function getHeaderAiApi(){
  return window.__ST_HEADER_AI_APPLY_API__ || null;
}

function selectedBlockFromSelection(getSelection){
  try {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    const el = sel && Array.isArray(sel.elements) ? sel.elements[0] : null;
    if (!el) return null;
    if (el.classList && el.classList.contains('st-block')) return el;
    return el.closest ? el.closest('.st-block') : null;
  } catch(e) {
    return null;
  }
}

function selectedHeaderElementFromSelection(getSelection){
  try {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    const el = sel && Array.isArray(sel.elements) ? sel.elements[0] : null;
    if (!el) return null;
    const headerSlot = document.getElementById('st-site-header-slot');
    if (!headerSlot) return null;
    if (el === headerSlot) return null;
    return headerSlot.contains(el) ? el : null;
  } catch(e) {
    return null;
  }
}

function ownerHeaderContainerFromEl(el){
  if (!el || !el.closest) return null;
  if (el.matches && el.matches('.st-row > .st-block')) return el;
  return el.closest('.st-row > .st-block') || null;
}


function isHeaderManagedBlock(el){
  return !!(el && el.classList && el.classList.contains('hb-elem'));
}

function isHeaderContainerBlock(el){
  return !!(
    el && el.matches && el.matches('.st-row > .st-block') &&
    !isHeaderManagedBlock(el) &&
    !el.classList.contains('st-block--button') &&
    !el.classList.contains('st-block--logo') &&
    !el.classList.contains('st-block--png') &&
    !el.classList.contains('st-block--phone') &&
    !el.classList.contains('st-block--heading') &&
    !el.classList.contains('st-block--menu')
  );
}

function safeOwnerHeaderContainerFromEl(el){
  if (!el || !el.closest) return null;
  if (isHeaderContainerBlock(el)) return el;
  const owner = el.closest('.st-row > .st-block');
  return isHeaderContainerBlock(owner) ? owner : null;
}

function selectorForItemType(type){
  const t = String(type || '').trim();
  if (t === 'button') return '.st-block--button';
  if (t === 'logo') return '.st-block--logo';
  if (t === 'png') return '.st-block--png';
  if (t === 'phone') return '.st-block--phone';
  if (t === 'heading') return '.st-block--heading';
  if (t === 'menu') return '.st-block--menu';
  return '';
}

function isInsideHeaderSlot(el){
  const slot = document.getElementById('st-site-header-slot');
  return !!(el && slot && slot.contains(el) && !(el.closest && el.closest('.hb-panel')));
}

function selectedItemOfTypeFromSelection(getSelection, type){
  const sel = selectorForItemType(type);
  if (!sel) return null;
  const selectedEl = selectedHeaderElementFromSelection(getSelection);
  if (!selectedEl) return null;
  if (selectedEl.matches && selectedEl.matches(sel)) return selectedEl;
  const closest = selectedEl.closest ? selectedEl.closest(sel) : null;
  return isInsideHeaderSlot(closest) ? closest : null;
}

function directChildrenByType(host, type){
  const sel = selectorForItemType(type);
  if (!host || !host.querySelectorAll || !sel) return [];
  try {
    return Array.from(host.querySelectorAll(`:scope > ${sel}`)).filter(isInsideHeaderSlot);
  } catch(e) {
    return Array.from(host.children || []).filter((el) => el.matches && el.matches(sel) && isInsideHeaderSlot(el));
  }
}

function headerDepth(el){
  const slot = document.getElementById('st-site-header-slot');
  let n = el;
  let depth = 0;
  while (n && n !== slot && n.parentElement) {
    depth += 1;
    n = n.parentElement;
  }
  return depth;
}

function findSameLevelContainerForItem(rootEl, type, getSelection = null){
  const sel = selectorForItemType(type);
  if (!sel) return null;

  const selectedSameType = selectedItemOfTypeFromSelection(getSelection, type);
  if (selectedSameType && selectedSameType.parentElement && isInsideHeaderSlot(selectedSameType.parentElement)) {
    return selectedSameType.parentElement;
  }

  const root = rootEl && isInsideHeaderSlot(rootEl) ? rootEl : null;
  if (!root || !root.querySelectorAll) return null;

  if (directChildrenByType(root, type).length) return root;

  const directOwner = safeOwnerHeaderContainerFromEl(root);
  if (directOwner && directChildrenByType(directOwner, type).length) return directOwner;

  const descendants = Array.from(root.querySelectorAll(sel)).filter(isInsideHeaderSlot);
  if (!descendants.length) return null;

  const candidates = new Map();
  for (const item of descendants) {
    const parent = item.parentElement;
    if (!parent || !isInsideHeaderSlot(parent)) continue;
    const prev = candidates.get(parent) || { parent, count: 0, depth: headerDepth(parent) };
    prev.count += 1;
    candidates.set(parent, prev);
  }

  const sorted = Array.from(candidates.values()).sort((a, b) => {
    if (b.depth !== a.depth) return b.depth - a.depth;
    return b.count - a.count;
  });
  return sorted.length ? sorted[0].parent : null;
}

function resolveTargetContainerForItem(getSelection, context, itemType){
  const selectedEl = selectedHeaderElementFromSelection(getSelection);
  const selectedBlock = selectedBlockFromSelection(getSelection);
  const root = selectedBlock || selectedEl;

  const sameLevel = findSameLevelContainerForItem(root, itemType, getSelection);
  if (sameLevel) return sameLevel;

  const selectedOwner = safeOwnerHeaderContainerFromEl(root);
  if (selectedOwner) return selectedOwner;

  if (context === 'selection') return null;
  return getActiveHeaderContainerFromDom();
}

function makeSameLevelPlacementPlan(targetContainer, itemType, getSelection){
  if (String(itemType || '') !== 'button') return null;
  const selectedEl = selectedHeaderElementFromSelection(getSelection);
  const selectedBlock = selectedBlockFromSelection(getSelection);
  const root = selectedBlock || selectedEl || targetContainer;
  const host = findSameLevelContainerForItem(root, itemType, getSelection) || targetContainer || null;
  if (!host || !isInsideHeaderSlot(host)) return null;
  const buttons = directChildrenByType(host, 'button');
  const selectedButton = selectedItemOfTypeFromSelection(getSelection, 'button');
  const reference = selectedButton && selectedButton.parentElement === host
    ? selectedButton
    : (buttons.length ? buttons[buttons.length - 1] : null);
  return { host, reference };
}

function applyHugButtonSizing(block){
  if (!block || !block.style || !(block.classList && block.classList.contains('st-block--button'))) return;
  try {
    block.dataset.sizeMode = 'hug';
    block.dataset.widthMode = 'hug';
    block.dataset.heightMode = 'hug';
    block.style.width = 'fit-content';
    block.style.maxWidth = 'fit-content';
    block.style.minWidth = 'max-content';
    block.style.height = 'fit-content';
    block.style.flex = '0 0 auto';
    block.style.alignSelf = 'center';
  } catch(e) {}
}

function normalizeAiCssHex(value){
  const raw = String(value || '').trim();
  const m = raw.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return '';
  const hex = m[1].toLowerCase();
  return '#' + (hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex);
}

function applyCreatedButtonAiPostStyles(block, detail){
  if (!block || !block.style || !(block.classList && block.classList.contains('st-block--button'))) return;
  const d = detail && typeof detail === 'object' ? detail : {};
  const textColor = normalizeAiCssHex(d.__aiTextColor || '');
  const shadowCss = String(d.__aiShadowCss || '').trim();
  let changed = false;
  try {
    if (textColor) {
      block.style.color = textColor;
      block.style.setProperty('--st-button-fg', textColor);
      const label = block.querySelector(':scope > .st-button__label');
      if (label && label.style) label.style.color = textColor;
      changed = true;
    }
    if (shadowCss) {
      block.style.boxShadow = shadowCss;
      block.style.setProperty('--st-button-shadow', shadowCss);
      changed = true;
    }
  } catch(e) {}
  if (changed) signalHeaderAiPlacementChanged();
}

function persistHeaderDomAfterAiPlacement(){
  try {
    const liveHeader = document.querySelector('#site-root [data-st-role="site-header"]');
    if (!liveHeader) return;
    const html = String(liveHeader.innerHTML || '').trim();
    if (!html) return;
    const raw = localStorage.getItem('st_header_state_v1');
    if (!raw) return;
    const state = JSON.parse(raw);
    if (!state || typeof state !== 'object') return;

    const siteRoot = document.getElementById('site-root');
    const pageId = String(siteRoot?.dataset?.pageId || localStorage.getItem('st_current_page_id') || localStorage.getItem('st_current_page_slug') || 'page_default');
    const pages = state.pages && typeof state.pages === 'object' ? state.pages : {};
    const pageState = pages[pageId] || null;
    const mode = pageState && pageState.mode ? String(pageState.mode) : String(state.defaultMode || 'global');

    if (mode === 'page' && pageState && pageState.pageHeader) {
      pageState.pageHeader.html = html;
    } else if (state.globalHeader) {
      state.globalHeader.html = html;
    } else if (pageState && pageState.pageHeader) {
      pageState.pageHeader.html = html;
    } else {
      return;
    }

    localStorage.setItem('st_header_state_v1', JSON.stringify(state));
  } catch(e) {}
}

function signalHeaderAiPlacementChanged(){
  try { window.dispatchEvent(new CustomEvent('st:header-ai:placement-changed')); } catch(e) {}
  try { window.dispatchEvent(new CustomEvent('st:header-builder:changed')); } catch(e) {}
  try { document.dispatchEvent(new CustomEvent('st:header-builder:changed')); } catch(e) {}
  try { persistHeaderDomAfterAiPlacement(); } catch(e) {}
}

function placeCreatedButtonAtSameLevel(createdEl, placementPlan){
  if (!createdEl || !(createdEl.classList && createdEl.classList.contains('st-block--button'))) return createdEl;
  applyHugButtonSizing(createdEl);
  const host = placementPlan && placementPlan.host;
  if (!host || !isInsideHeaderSlot(host)) return createdEl;
  try {
    const ref = placementPlan.reference && placementPlan.reference !== createdEl && placementPlan.reference.parentElement === host
      ? placementPlan.reference
      : null;
    if (createdEl.parentElement !== host || (ref && ref.nextElementSibling !== createdEl)) {
      if (ref && ref.nextSibling) host.insertBefore(createdEl, ref.nextSibling);
      else host.appendChild(createdEl);
      signalHeaderAiPlacementChanged();
    }
  } catch(e) {}
  return createdEl;
}

function parseJsonArray(value){
  try {
    const raw = String(value || '').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    return [];
  }
}

function buttonDetailFromDomBlock(block){
  if (!block || !block.classList || !block.classList.contains('st-block--button')) return null;
  const iconSvgEl = block.querySelector(':scope > .st-button__iconbtn .st-button__iconsvg');
  const labelEl = block.querySelector(':scope > .st-button__label');
  const iconSvg = String(block.dataset?.buttonIconSvg || (iconSvgEl ? iconSvgEl.innerHTML : '') || '').trim();
  const mode = String(block.dataset?.buttonMode || 'text-icon');
  const iconPosition = String(block.dataset?.buttonIconPos || 'left');
  return {
    text: String(labelEl ? labelEl.textContent : (block.dataset?.buttonText || 'Кнопка')).trim() || 'Кнопка',
    mode: ['text','text-icon','icon'].includes(mode) ? mode : 'text-icon',
    iconPosition: ['left','right','none'].includes(iconPosition) ? iconPosition : 'left',
    icon: iconSvg ? { svg: iconSvg, defaultColor: String(block.dataset?.buttonIconColor || '#ffffff') } : null,
    link: {
      mode: ['none','home','custom','tel','email'].includes(String(block.dataset?.buttonLinkMode || 'none')) ? String(block.dataset?.buttonLinkMode || 'none') : 'none',
      href: String(block.dataset?.buttonHref || ''),
      newTab: String(block.dataset?.buttonOpenInNewTab || '0') === '1',
      clickArea: ['all','icon','label'].includes(String(block.dataset?.buttonClickArea || 'all')) ? String(block.dataset?.buttonClickArea || 'all') : 'all',
    },
    adaptive: {
      mode: ['inherit','hide','icon-only'].includes(String(block.dataset?.buttonMobileMode || 'inherit')) ? String(block.dataset?.buttonMobileMode || 'inherit') : 'inherit',
      mobileLabel: String(block.dataset?.buttonMobileLabel || '').slice(0, 80),
      width: Math.min(360, Math.max(42, Number(block.dataset?.buttonMobileWidth) || 140)),
      labelSize: Math.min(48, Math.max(8, Number(block.dataset?.buttonMobileLabelSize) || 14)),
      iconSize: Math.min(64, Math.max(12, Number(block.dataset?.buttonMobileIconSize) || 18)),
      gap: Math.min(32, Math.max(0, Number(block.dataset?.buttonMobileGap) || 8)),
    },
    hover: {
      target: 'block',
      metrics: {
        block: {
          opacity: Number(block.dataset?.buttonHoverBlockOpacity || 100) || 100,
          scale: Number(block.dataset?.buttonHoverBlockScale || 100) || 100,
          offsetY: Number(block.dataset?.buttonHoverBlockOffsetY || 0) || 0,
        },
        label: {
          opacity: Number(block.dataset?.buttonHoverLabelOpacity || 100) || 100,
          scale: Number(block.dataset?.buttonHoverLabelScale || 100) || 100,
          offsetY: Number(block.dataset?.buttonHoverLabelOffsetY || 0) || 0,
        },
        icon: {
          opacity: Number(block.dataset?.buttonHoverIconOpacity || 100) || 100,
          scale: Number(block.dataset?.buttonHoverIconScale || 100) || 100,
          offsetY: Number(block.dataset?.buttonHoverIconOffsetY || 0) || 0,
        },
      }
    },
    extras: {
      preset: String(block.dataset?.buttonExtraPreset || 'primary'),
      shape: String(block.dataset?.buttonShape || 'rounded'),
      fillMode: String(block.dataset?.buttonFillMode || 'solid'),
      color1: String(block.dataset?.buttonColor1 || '#2563eb'),
      color2: String(block.dataset?.buttonColor2 || '#60a5fa'),
      angle: Number(block.dataset?.buttonGradientAngle || 135) || 135,
      gradientStops: parseJsonArray(block.dataset?.buttonGradientStops),
    },
    __sourceButtonRef: String(block.dataset?.hbRef || block.id || ''),
  };
}

function findReferenceButtonForNewButton(targetContainer, getSelection){
  const selected = selectedBlockFromSelection(getSelection);
  if (selected && selected.classList && selected.classList.contains('st-block--button')) return selected;
  if (targetContainer && targetContainer.querySelectorAll) {
    const directButtons = Array.from(targetContainer.querySelectorAll(':scope > .st-block--button'));
    if (directButtons.length) return directButtons[directButtons.length - 1];
    const nestedButtons = Array.from(targetContainer.querySelectorAll('.st-block--button'));
    if (nestedButtons.length) return nestedButtons[nestedButtons.length - 1];
  }
  const slot = document.getElementById('st-site-header-slot');
  if (!slot) return null;
  const all = Array.from(slot.querySelectorAll('.st-block--button'));
  return all.length ? all[all.length - 1] : null;
}

function promptHasExplicitButtonColor(prompt){
  return /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b|синь|блакит|голуб|жовт|золот|черв|зелен|помаранч|оранж|фіол|рожев|чорн|біло|сір|gray|grey|blue|red|green|yellow|orange|purple|pink|black|white/i.test(String(prompt || ''));
}

function promptHasExplicitButtonShape(prompt){
  return /pill|капсул|кругл|заокругл|округл|rounded|square|квадрат|прямокут/i.test(String(prompt || ''));
}

function promptHasExplicitButtonIcon(prompt){
  return /ікон|icon|стріл|arrow|phone|телефон|дзвін|call|mail|email|лист|конверт|кошик|cart|search|play|download|menu/i.test(String(prompt || ''));
}

function mergeNewButtonWithReference(detail, referenceDetail, prompt){
  const src = detail && typeof detail === 'object' ? { ...detail } : {};
  const ref = referenceDetail && typeof referenceDetail === 'object' ? referenceDetail : null;
  if (!ref) {
    src.__sizeMode = 'hug';
    return src;
  }

  const promptText = String(prompt || '');
  const explicitColor = promptHasExplicitButtonColor(promptText);
  const explicitShape = promptHasExplicitButtonShape(promptText);
  const explicitIcon = promptHasExplicitButtonIcon(promptText);
  const merged = {
    ...src,
    mode: explicitIcon ? (src.mode || ref.mode || 'text') : (ref.mode || src.mode || 'text'),
    iconPosition: explicitIcon ? (src.iconPosition || ref.iconPosition || 'left') : (ref.iconPosition || src.iconPosition || 'left'),
    icon: explicitIcon ? (src.icon || ref.icon || null) : (ref.icon || src.icon || null),
    adaptive: { ...(ref.adaptive || {}), ...(src.adaptive || {}) },
    hover: ref.hover || src.hover || null,
    extras: { ...(ref.extras || {}), ...(src.extras || {}) },
    __copiedVisualFromButtonRef: ref.__sourceButtonRef || '',
    __sizeMode: 'hug',
  };

  merged.text = String(src.text || '').trim() || 'Кнопка';
  merged.link = src.link || { mode:'none', href:'', newTab:false, clickArea:'all' };
  merged.__iconPrompt = explicitIcon ? String(src.__iconPrompt || promptText || '') : '';

  if (!explicitColor && ref.extras) {
    merged.extras.preset = ref.extras.preset;
    merged.extras.fillMode = ref.extras.fillMode;
    merged.extras.color1 = ref.extras.color1;
    merged.extras.color2 = ref.extras.color2;
    merged.extras.angle = ref.extras.angle;
    merged.extras.gradientStops = ref.extras.gradientStops;
  }
  if (!explicitShape && ref.extras) merged.extras.shape = ref.extras.shape;

  return merged;
}

function getActiveHeaderContainerFromDom(){
  const slot = document.getElementById('st-site-header-slot');
  if (!slot) return null;
  return slot.querySelector('.st-row > .st-block.is-selected, .st-row > .st-block.is-active, .st-row > .st-block.hb-dom-active') || null;
}

function activateHeaderContainer(contEl){
  if (!contEl) return false;
  try {
    contEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, cancelable:true, pointerType:'mouse', isPrimary:true }));
  } catch(e) {
    try { contEl.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, cancelable:true })); } catch(_) {}
  }
  try {
    if (window.ST_SELECTION && typeof window.ST_SELECTION.setSingle === 'function') {
      window.ST_SELECTION.setSingle(contEl, { type: 'header-inner' });
    }
  } catch(e) {}
  try {
    contEl.classList.add('is-active', 'is-selected');
    return true;
  } catch(e) {}
  return false;
}

function blockTypeFromEl(el){
  if (!el || !el.classList) return '';
  if (el.classList.contains('st-block--button')) return 'button';
  if (el.classList.contains('st-block--logo')) return 'logo';
  if (el.classList.contains('st-block--png')) return 'png';
  if (el.classList.contains('st-block--phone')) return 'phone';
  if (el.classList.contains('st-block--heading')) return 'heading';
  if (el.classList.contains('st-block--menu')) return 'menu';
  return el.dataset?.blockRole || el.dataset?.blockKind || '';
}

function activateSelectedBlock(el){
  if (!el) return false;
  try {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, cancelable:true, pointerType:'mouse', isPrimary:true }));
  } catch(e) {
    try { el.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, cancelable:true })); } catch(_) {}
  }
  try {
    if (window.ST_SELECTION && typeof window.ST_SELECTION.setSingle === 'function') {
      window.ST_SELECTION.setSingle(el, { type: 'header-inner' });
    }
  } catch(e) {}
  try {
    el.classList.add('is-active', 'is-selected');
    return true;
  } catch(e) {}
  return false;
}

function getActiveHeaderBlockByClass(cls){
  const slot = document.getElementById('st-site-header-slot');
  if (!slot) return null;
  return slot.querySelector(`.${cls}.is-active`) || slot.querySelector(`.${cls}`);
}

function blockSelectorFromType(type){
  if (type === 'button') return '.st-block--button';
  if (type === 'logo') return '.st-block--logo';
  if (type === 'png') return '.st-block--png';
  if (type === 'phone') return '.st-block--phone';
  if (type === 'heading') return '.st-block--heading';
  if (type === 'menu') return '.st-block--menu';
  return '';
}

function getLastHeaderBlockByType(type){
  const slot = document.getElementById('st-site-header-slot');
  const sel = blockSelectorFromType(type);
  if (!slot || !sel) return null;
  const list = slot.querySelectorAll(sel);
  return list && list.length ? list[list.length - 1] : null;
}

function setEditableText(el, text){
  if (!el) return;
  try {
    el.textContent = String(text || '');
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.dispatchEvent(new Event('change', { bubbles:true }));
  } catch(e) {}
}

function applyLogoTextValues(detail){
  const brandText = detail && detail.__brandText ? String(detail.__brandText) : '';
  const subtitleText = detail && detail.__subtitleText ? String(detail.__subtitleText) : '';
  setTimeout(() => {
    try {
      const logo = getActiveHeaderBlockByClass('st-block--logo');
      if (!logo) return;
      const title = logo.querySelector(':scope > .st-logo__title');
      const subtitle = logo.querySelector(':scope > .st-logo__subtitle');
      if (brandText && title) setEditableText(title, brandText);
      if (subtitle) setEditableText(subtitle, subtitleText);
    } catch(e) {}
  }, 40);
}

function sleep(ms){
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function cloneItem(item){
  try {
    return JSON.parse(JSON.stringify(item || null));
  } catch(e) {
    return item ? { ...item } : null;
  }
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

function normalizeSearchText(value){
  return String(value || '')
    .toLowerCase()
    .replace(/[ʼ'`]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-яіїє0-9+\-]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ICON_STOP_WORDS = new Set([
  'і','й','та','або','у','в','на','до','для','з','із','по','за','під','над','як','щоб','через','потрібно','треба','хочу','додай','добав','добавити','створи','створити','зроби','зробити',
  'кнопка','кнопку','лого','логотип','header','шапка','іконка','іконку','icon','icons','svg','left','right','top','bottom','зліва','справа','ліворуч','праворуч','вгорі','внизу','small','big','large','mini','btn','button',
  'same','style','styles','самий','самі','такі','такий','стиль','стилі','будь','ласка','будьласка','please','new','новий','нова','нове','variant','варіант','mode','режим','side','position','позиція'
]);

const ICON_RULES = [
  { re: /(конверт|конвертик|лист|пошта|email|e-mail|mail)/i, names: ['mail','mail-open','mailbox','mails'] },
  { re: /(телефон|дзвін|подзвон|call|phone)/i, names: ['phone','phone-call','phone-outgoing'] },
  { re: /(чат|повідомл|message|msg|sms)/i, names: ['message-circle','message-square','message-circle-more'] },
  { re: /(кошик|корзин|cart|basket|bag|shop|купити|замовити)/i, names: ['shopping-cart','shopping-basket','shopping-bag','tag'] },
  { re: /(пошук|лупа|search|find)/i, names: ['search','mail-search'] },
  { re: /(меню|бургер|menu)/i, names: ['menu'] },
  { re: /(відправ|send|paper plane|plane)/i, names: ['send-horizontal','send'] },
  { re: /(завантаж|download|скачат)/i, names: ['download','cloud-download','hard-drive-download'] },
  { re: /(відео|play|програти|пуск)/i, names: ['play','circle-play'] },
  { re: /(користувач|аккаунт|акаунт|user|profile|person)/i, names: ['user','user-round','circle-user'] },
  { re: /(карта|локац|адрес|map|pin|location)/i, names: ['map-pin','map-pinned','map','globe'] },
  { re: /(замок|безпек|lock|secure|shield)/i, names: ['lock','shield','shield-user'] },
  { re: /(календар|calendar|date)/i, names: ['calendar'] },
  { re: /(годин|clock|time)/i, names: ['clock','clock-3'] },
  { re: /(дзвіноч|bell|notify|сповіщ)/i, names: ['bell','bell-ring'] },
  { re: /(зірк|star|favorite|fav)/i, names: ['circle-star','moon-star'] },
  { re: /(стріл|arrow|next|далі|forward)/i, names: ['arrow-right','circle-arrow-right','chevron-right'] }
];

let _lucideIndexPromise = null;
async function loadLucideIndex(){
  if (_lucideIndexPromise) return _lucideIndexPromise;
  _lucideIndexPromise = fetch('assets/icons/lucide/index.json', { cache:'no-cache' })
    .then((res) => res.ok ? res.json() : [])
    .then((json) => Array.isArray(json) ? json : [])
    .catch(() => []);
  return _lucideIndexPromise;
}

function tokenizeSearchText(value){
  const norm = normalizeSearchText(value);
  if (!norm) return [];
  const parts = norm.split(' ').filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (!p || p.length < 2) continue;
    if (ICON_STOP_WORDS.has(p)) continue;
    out.push(p);
  }
  return Array.from(new Set(out));
}

function buildIconProfile(prompt){
  const raw = String(prompt || '');
  const normalized = normalizeSearchText(raw);
  const preferredNames = [];
  for (const rule of ICON_RULES) {
    if (rule.re.test(raw) || rule.re.test(normalized)) {
      for (const n of (rule.names || [])) {
        if (n) preferredNames.push(String(n));
      }
    }
  }
  const tokens = tokenizeSearchText(raw);
  const genericIconMention = /(ікон|icon|svg)/i.test(raw);
  const hasSpecificIntent = preferredNames.length > 0 || tokens.some((t) => !ICON_STOP_WORDS.has(t));
  return {
    raw,
    normalized,
    tokens,
    preferredNames: Array.from(new Set(preferredNames)),
    genericIconMention,
    hasSpecificIntent,
  };
}

function scoreIconEntry(entry, profile){
  if (!entry || !profile) return 0;
  const name = normalizeSearchText(entry.name || '');
  const tags = Array.isArray(entry.tags) ? entry.tags.map(normalizeSearchText) : [];
  const hay = `${name} ${tags.join(' ')}`.trim();
  let score = 0;

  for (const pref of (profile.preferredNames || [])) {
    const p = normalizeSearchText(pref);
    if (!p) continue;
    if (name === p) score += 700;
    else if (name.startsWith(p)) score += 520;
    else if (name.includes(p)) score += 420;
    if (tags.includes(p)) score += 460;
  }

  for (const token of (profile.tokens || [])) {
    if (!token) continue;
    if (name === token) score += 200;
    else if (name.startsWith(token)) score += 140;
    else if (name.includes(token)) score += 90;
    if (tags.includes(token)) score += 120;
    else if (hay.includes(token)) score += 40;
  }

  if (profile.normalized && name && profile.normalized.includes(name)) score += 120;
  if (profile.normalized && name && name.includes(profile.normalized)) score += 80;

  if (entry.source === 'lucide') score += 8;
  return score;
}

async function loadCustomGallerySvgIcons(){
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
        const name = String(item && item.name || '');
        if (!mime.includes('svg') && !/\.svg$/i.test(name)) continue;
        const url = galMakeObjectUrl(item);
        if (!url) continue;
        out.push({
          source: 'gallery',
          name,
          tags: tokenizeSearchText(name),
          url,
        });
      }
    }
    return out;
  } catch(e) {
    return [];
  }
}

async function fetchSvgTextFromUrl(url){
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

async function resolveIconFromGallery(prompt, fallbackIcon = null){
  return resolveAiIconFromManifest({ prompt, fallbackIcon });
}

async function hydrateRecipeItemIcons(item, recipe){
  const next = cloneItem(item);
  if (!next || !next.detail) return next;

  const detail = next.detail || {};
  const prompt = String(detail.__iconPrompt || recipe?.__meta?.prompt || '');

  if (next.type === 'button') {
    const mode = String(detail.mode || 'text');
    if ((mode === 'text-icon' || mode === 'icon') && prompt) {
      const resolved = await resolveIconFromGallery(prompt, detail.icon || null);
      if (resolved) detail.icon = resolved;
    }
  }

  if (next.type === 'logo') {
    if (String(detail.source || '') === 'icon' && prompt) {
      const resolved = await resolveIconFromGallery(prompt, detail.icon || null);
      if (resolved) detail.icon = resolved;
    }
  }

  next.detail = detail;
  return next;
}

async function applyButtonUpdate(item, recipe){
  const hydrated = await hydrateRecipeItemIcons(item, recipe);
  const d = hydrated && hydrated.detail ? hydrated.detail : null;
  if (!d) return;
  dispatch('st:header-insert:button:text:apply', { text: d.text || 'Кнопка' });
  dispatch('st:header-insert:button:mode:apply', { mode: d.mode || 'text' });
  dispatch('st:header-insert:button:icon-pos:apply', { iconPosition: d.iconPosition || 'left' });
  if (d.icon) dispatch('st:header-insert:button:icon:apply', d.icon);
  if (d.link) dispatch('st:header-insert:button:link:apply', d.link);
  if (d.adaptive) dispatch('st:header-insert:button:adaptive:apply', d.adaptive);
  if (d.hover) dispatch('st:header-insert:button:hover:apply', d.hover);
  if (d.extras) dispatch('st:header-insert:button:extras:apply', d.extras);
}

async function applyLogoUpdate(item, recipe){
  const hydrated = await hydrateRecipeItemIcons(item, recipe);
  const d = hydrated && hydrated.detail ? hydrated.detail : null;
  if (!d) return;
  dispatch('st:header-insert:logo:mode:apply', { mode: d.mode || 'logo-text' });
  dispatch('st:header-insert:logo:source:apply', { source: d.source || 'image' });
  dispatch('st:header-insert:logo:pos:apply', { position: d.position || 'left' });
  if (d.layout) dispatch('st:header-insert:logo:layout:apply', d.layout);
  if (d.link) dispatch('st:header-insert:logo:link:apply', d.link);
  if (d.adaptive) dispatch('st:header-insert:logo:adaptive:apply', d.adaptive);
  if (d.hover) dispatch('st:header-insert:logo:hover:apply', d.hover);
  if (d.source === 'icon' && d.icon) dispatch('st:header-insert:logo:icon:apply', d.icon);
  if (d.source === 'image' && d.image) dispatch('st:header-insert:logo:image:apply', d.image);
  applyLogoTextValues(d);
}

function applyPngUpdate(item){
  const d = item && item.detail ? item.detail : null;
  if (!d) return;
  if (d.image) dispatch('st:header-insert:png:image:apply', d.image);
  if (d.link) dispatch('st:header-insert:png:link:apply', d.link);
  if (d.adaptive) dispatch('st:header-insert:png:adaptive:apply', d.adaptive);
  if (d.hover) dispatch('st:header-insert:png:hover:apply', d.hover);
  if (d.extras) dispatch('st:header-insert:png:extras:apply', d.extras);
}

function resolveTargetContainer(getSelection, context, itemType = ''){
  return resolveTargetContainerForItem(getSelection, context, itemType);
}

async function createItemsInBuilder(recipe, targetContainer = null, getSelection = null){
  let created = 0;
  for (let index = 0; index < (recipe.items || []).length; index += 1) {
    const item = await hydrateRecipeItemIcons(recipe.items[index], recipe);
    if (!item || !item.type) continue;

    const placementPlan = item.type === 'button'
      ? makeSameLevelPlacementPlan(targetContainer, item.type, getSelection)
      : null;

    if (item.type === 'button') {
      const refDetail = buttonDetailFromDomBlock(findReferenceButtonForNewButton((placementPlan && placementPlan.host) || targetContainer, getSelection));
      dispatch('st:header-insert:button:add', mergeNewButtonWithReference(item.detail || null, refDetail, recipe?.__meta?.prompt || ''));
    }
    else if (item.type === 'logo') dispatch('st:header-insert:logo:add', item.detail || null);
    else if (item.type === 'png') dispatch('st:header-insert:png:add', item.detail || null);
    else if (item.type === 'menu') dispatch('st:header-insert:menu:add', item.detail || { variant:'big' });
    else if (item.type === 'heading') dispatch('st:header-insert:heading:add');
    else if (item.type === 'phone') dispatch('st:header-insert:phone:add', item.detail || null);
    else continue;

    created += 1;
    await sleep(60);
    let block = getLastHeaderBlockByType(item.type);
    if (item.type === 'button') block = placeCreatedButtonAtSameLevel(block, placementPlan);
    if (item.type === 'button') applyCreatedButtonAiPostStyles(block, item.detail || null);
    if (block) activateSelectedBlock(block);
    if (item.type === 'logo' && item.detail) applyLogoTextValues(item.detail);
    await sleep(40);
  }
  return created;
}

async function createItemsViaApi(recipe, api, targetContainer = null, getSelection = null){
  let created = 0;
  for (const srcItem of (recipe.items || [])) {
    const item = await hydrateRecipeItemIcons(srcItem, recipe);
    if (!item || !item.type) continue;

    const placementPlan = item.type === 'button'
      ? makeSameLevelPlacementPlan(targetContainer, item.type, getSelection)
      : null;
    const referenceHost = (placementPlan && placementPlan.host) || targetContainer;

    const itemForCreate = item.type === 'button'
      ? { ...item, detail: mergeNewButtonWithReference(item.detail || null, buttonDetailFromDomBlock(findReferenceButtonForNewButton(referenceHost, getSelection)), recipe?.__meta?.prompt || '') }
      : item;
    let createdEl = api.createItem(itemForCreate);
    if (item.type === 'button') createdEl = placeCreatedButtonAtSameLevel(createdEl, placementPlan);
    if (item.type === 'button') applyCreatedButtonAiPostStyles(createdEl, item.detail || null);
    if (createdEl) {
      created += 1;
      activateSelectedBlock(createdEl);
      if (item.type === 'logo' && item.detail) applyLogoTextValues(item.detail);
      await sleep(20);
    }
  }
  return created;
}

export async function applyAiTemplateRecipe(recipe, options = {}){
  if (!recipe || !Array.isArray(recipe.items) || !recipe.items.length) {
    return { ok:false, message:'Немає recipe для застосування.' };
  }

  const context = String(options.context || 'selection');
  const action = String(options.action || 'create');
  const getSelection = options.getSelection;
  const api = getHeaderAiApi();
  const builderMode = inHeaderBuilder();

  if (!['selection','header'].includes(context)) {
    return { ok:false, message:'Цей контекст ще не активний. Поки що використовуй «Вибране» або «Активний контейнер».' };
  }

  if (action === 'update') {
    const selected = selectedBlockFromSelection(getSelection);
    if (!selected) return { ok:false, message:'Для «Змінити вибране» спочатку вибери сумісний блок у шапці.' };
    if (recipe.items.length !== 1) return { ok:false, message:'Оновлення працює для одного блока за раз: Button / Logo / PNG.' };
    const selectedType = blockTypeFromEl(selected);
    const item = await hydrateRecipeItemIcons(recipe.items[0], recipe);
    if (selectedType !== item.type) {
      return { ok:false, message:`Вибраний блок має тип «${selectedType || 'невідомо'}», а recipe згенерував «${item.type}». Для update типи мають збігатися.` };
    }

    activateSelectedBlock(selected);

    if (builderMode) {
      await sleep(20);
      if (item.type === 'button') await applyButtonUpdate(item, recipe);
      else if (item.type === 'logo') await applyLogoUpdate(item, recipe);
      else if (item.type === 'png') applyPngUpdate(item);
      return { ok:true, message:'Recipe застосовано до вибраного блока. Іконка теж береться з локальної галереї, якщо її описано в задачі.' };
    }

    if (!api || typeof api.setActiveBlockFromElement !== 'function' || typeof api.updateItem !== 'function') {
      return { ok:false, message:'Не вдалося застосувати update у звичайному режимі. Відкрий шапку ще раз або спробуй через конструктор шапки.' };
    }

    if (!api.setActiveBlockFromElement(selected)) {
      return { ok:false, message:'Не вдалося визначити активний блок у шапці для update. Клікни по ньому ще раз.' };
    }

    const ok = api.updateItem(item);
    if (item.type === 'logo' && item.detail) applyLogoTextValues(item.detail);
    return ok
      ? { ok:true, message:'Recipe застосовано до вибраного блока у звичайному режимі Дизайну. Якщо в описі була іконка, AI взяв її з вашої галереї / Lucide.' }
      : { ok:false, message:'Оновлення не спрацювало. Спробуй ще раз вибрати блок у шапці.' };
  }

  const firstRecipeItemType = recipe && Array.isArray(recipe.items) && recipe.items[0] ? String(recipe.items[0].type || '') : '';
  const targetContainer = resolveTargetContainer(getSelection, context, firstRecipeItemType);
  if (context === 'selection' && !targetContainer) {
    return { ok:false, message:'Для контексту «Вибране» спочатку вибери блок або контейнер у шапці.' };
  }
  if (!targetContainer && !builderMode) {
    return { ok:false, message:'Не вдалося визначити контейнер у шапці. Клікни по потрібному контейнеру або елементу шапки ще раз.' };
  }

  if (targetContainer) activateHeaderContainer(targetContainer);

  let createdCount = 0;

  if (builderMode) {
    createdCount = await createItemsInBuilder(recipe, targetContainer, getSelection);
  } else {
    if (!api || typeof api.setActiveContainerFromElement !== 'function' || typeof api.createItem !== 'function') {
      return { ok:false, message:'Не вдалося застосувати шаблон у звичайному режимі. Спробуй ще раз або відкрий конструктор шапки.' };
    }
    if (!api.setActiveContainerFromElement(targetContainer)) {
      return { ok:false, message:'Не вдалося активувати контейнер у шапці. Клікни по контейнеру ще раз.' };
    }
    createdCount = await createItemsViaApi(recipe, api, targetContainer, getSelection);
  }

  if (!createdCount) {
    return { ok:false, message:'Шаблон не зміг створити новий елемент. Перевір вибраний контейнер у шапці.' };
  }

  if (action === 'variant') {
    return { ok:true, message:`Створено варіант (${createdCount}) у поточному контейнері шапки. AI також підбирає іконки з вашої галереї / Lucide, якщо вони описані в задачі.` };
  }
  return { ok:true, message:`Шаблон застосовано (${createdCount}). Іконки тепер беруться з вашої локальної галереї / Lucide за описом, а не зі стандартної стрілки.` };
}
