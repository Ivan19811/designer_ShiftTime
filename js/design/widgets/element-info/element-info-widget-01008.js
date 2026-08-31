// js/design/widgets/element-info/element-info-widget-01008.js
// 01008 — "Інформація елемента": read-only SiteFrameStore hydration + exact-property editor.
// Source of truth is always SiteFrameStore JSON. Selection only reads. Live edit only previews DOM;
// Apply performs exactly one canonical Store transaction through runtime authority.

const SECTION_ID = 'st-element-info-widget-01008';
const TOOLTIP_ID = 'st-element-info-help-01008';
const VERSION = '01008-element-info-site-frame-store-parity';

const READONLY_KEYS = new Set([
  '--st-block-surface-source-b64',
  '--st-fill-authority-v',
]);

const KIND_LABELS = Object.freeze({
  site: 'Сайт', area: 'Область', section: 'Секція', level: 'Рівень', row: 'Рівень',
  container: 'Контейнер', block: 'Блок', text: 'Текст', image: 'Зображення', button: 'Кнопка',
  link: 'Посилання', icon: 'Іконка', menu: 'Меню', item: 'Елемент'
});

const EXACT_WIDGET_MAP = Object.freeze({
  '--st-bgfx-bg': { title: 'Заливка', selector: '[data-fill-modes]', coverage: 'full', label: 'Тип заливки' },
  '--st-bgfx-gradient-c1': { title: 'Заливка', selector: '[data-fill="gradColor1"]', coverage: 'full', label: 'Колір градієнта 1' },
  '--st-bgfx-gradient-c2': { title: 'Заливка', selector: '[data-fill="gradColor2"]', coverage: 'full', label: 'Колір градієнта 2' },
  '--st-bgfx-gradient-c3': { title: 'Заливка', selector: '[data-fill="gradColor3"]', coverage: 'full', label: 'Колір градієнта 3' },
  '--st-bgfx-gradient-angle': { title: 'Заливка', selector: '[data-fill="gradAngleRange"]', coverage: 'full', label: 'Кут градієнта' },
  '--st-bgfx-bg-opacity': { title: 'Заливка', selector: '[data-fill="opacityRange"]', coverage: 'full', label: 'Прозорість фону' },
  '--st-bgfx-gray': { title: 'Заливка', selector: '[data-fill="grayRange"]', coverage: 'full', label: 'Чорно-білий ефект' },
  '--st-bgfx-image-scale': { title: 'Заливка', selector: '[data-fill="imageScale"]', coverage: 'full', label: 'Масштаб картинки' },
  '--st-bgfx-image-scale-x': { title: 'Заливка', selector: '[data-fill="imageScaleX"]', coverage: 'full', label: 'Масштаб X' },
  '--st-bgfx-image-scale-y': { title: 'Заливка', selector: '[data-fill="imageScaleY"]', coverage: 'full', label: 'Масштаб Y' },
  '--st-bgfx-bg-pos-x': { title: 'Заливка', selector: '[data-fill="imagePosX"]', coverage: 'full', label: 'Позиція X' },
  '--st-bgfx-bg-pos-y': { title: 'Заливка', selector: '[data-fill="imagePosY"]', coverage: 'full', label: 'Позиція Y' },
  '--st-element-fx-opacity': { title: 'Заливка', selector: '[data-fill="elementOpacityRange"]', coverage: 'full', label: 'Прозорість елемента' },
  '--st-element-fx-blur': { title: 'Заливка', selector: '[data-fill="elementBlurRange"]', coverage: 'full', label: 'Розмитість елемента' },
  '--st-block-surface-alpha': { title: 'Заливка', selector: '[data-fill="blockTransparencyRange"]', coverage: 'full', label: 'Прозорість блока' },
  '--st-block-surface-blur': { title: 'Заливка', selector: '[data-fill="blockBlurRange"]', coverage: 'full', label: 'Розмитість блока' },
  '--st-bgfx-filter': { title: 'Заливка', selector: '[data-filter-mode]', coverage: 'full', label: 'Тип фільтра' },
  '--st-bgfx-filter-color': { title: 'Заливка', selector: '[data-fill="filterColor"]', coverage: 'full', label: 'Колір фільтра' },
  '--st-bgfx-filter-c1': { title: 'Заливка', selector: '[data-fill="filterGradColor1"]', coverage: 'full', label: 'Фільтр градієнт 1' },
  '--st-bgfx-filter-c2': { title: 'Заливка', selector: '[data-fill="filterGradColor2"]', coverage: 'full', label: 'Фільтр градієнт 2' },
  '--st-bgfx-filter-c3': { title: 'Заливка', selector: '[data-fill="filterGradColor3"]', coverage: 'full', label: 'Фільтр градієнт 3' },
  '--st-bgfx-filter-angle': { title: 'Заливка', selector: '[data-fill="filterAngleRange"]', coverage: 'full', label: 'Кут фільтра' },
  '--st-bgfx-filter-opacity': { title: 'Заливка', selector: '[data-fill="filterOpacityRange"]', coverage: 'full', label: 'Прозорість фільтра' },
});

const ENUM_VALUES = Object.freeze({
  display: ['block','inline','inline-block','flex','inline-flex','grid','inline-grid','none'],
  overflow: ['visible','hidden','clip','auto','scroll'],
  'overflow-x': ['visible','hidden','clip','auto','scroll'],
  'overflow-y': ['visible','hidden','clip','auto','scroll'],
  position: ['static','relative','absolute','fixed','sticky'],
  'flex-direction': ['row','row-reverse','column','column-reverse'],
  'flex-wrap': ['nowrap','wrap','wrap-reverse'],
  'justify-content': ['flex-start','center','flex-end','space-between','space-around','space-evenly'],
  'align-items': ['stretch','flex-start','center','flex-end','baseline'],
  'align-self': ['auto','stretch','flex-start','center','flex-end','baseline'],
  'text-align': ['left','center','right','justify','start','end'],
  'white-space': ['normal','nowrap','pre','pre-wrap','pre-line','break-spaces'],
  'background-attachment': ['scroll','fixed','local'],
  'background-repeat': ['repeat','repeat-x','repeat-y','no-repeat','space','round'],
  'background-size': ['auto','cover','contain'],
  'box-sizing': ['content-box','border-box'],
});

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch]));
}
function cssEscape(value) {
  try { return CSS.escape(String(value || '')); } catch (_) { return String(value || '').replace(/["\\]/g, '\\$&'); }
}
function runtime() { return window.ST_SITE_FRAME_STORE_AUTHORITY_00876 || null; }
function clonePlain(v) { try { return JSON.parse(JSON.stringify(v)); } catch (_) { return v; } }
function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

function selectionElement(getSelection) {
  let sel = null;
  try { sel = getSelection?.() || null; } catch (_) {}
  const candidates = [sel?.element, sel?.el, ...(Array.isArray(sel?.elements) ? sel.elements : [])];
  for (const el of candidates) if (el instanceof HTMLElement) return el;
  const explicit = document.querySelector('.sf-selection-current[data-sf-id], .is-selected[data-sf-id], .hb-dom-selected[data-sf-id], [data-st-node-id].is-selected');
  return explicit instanceof HTMLElement ? explicit : null;
}

function resolveNodeId(getSelection) {
  const el = selectionElement(getSelection);
  if (!el) return '';
  const owner = el.closest?.('[data-sf-id],[data-st-node-id],[data-node-id]') || el;
  return String(owner?.dataset?.sfId || owner?.dataset?.stNodeId || owner?.dataset?.nodeId || '').trim();
}

function effectiveNodeState(node, rt) {
  const base = clonePlain(node || {}) || {};
  const scope = rt?.getResponsiveEditScope?.() || { scoped:false, profileId:'base' };
  const profileId = scope?.scoped ? String(scope.profileId || '') : '';
  const responsive = profileId && isObj(node?.responsive?.[profileId]) ? node.responsive[profileId] : null;
  const effective = { ...base };
  if (responsive) {
    for (const key of ['layout','box','constraints','style','content']) {
      if (isObj(base[key]) || isObj(responsive[key])) effective[key] = { ...(base[key] || {}), ...(responsive[key] || {}) };
      else if (responsive[key] !== undefined) effective[key] = clonePlain(responsive[key]);
    }
  }
  return { effective, profileId: profileId || 'base', responsive };
}

function effectiveStyleRows(node, state) {
  const authored = isObj(node?.meta?.authoredStyle00960) ? node.meta.authoredStyle00960 : {};
  const base = isObj(node?.style) ? node.style : {};
  const resp = isObj(state?.responsive?.style) ? state.responsive.style : {};
  const keys = Array.from(new Set([...Object.keys(authored), ...Object.keys(base), ...Object.keys(resp)])).sort((a,b) => a.localeCompare(b));
  return keys.map((key) => {
    const fromResp = Object.prototype.hasOwnProperty.call(resp, key);
    const fromBase = Object.prototype.hasOwnProperty.call(base, key);
    const value = fromResp ? resp[key] : (fromBase ? base[key] : authored[key]);
    return {
      key,
      value: String(value ?? ''),
      source: fromResp ? 'responsive' : (fromBase ? 'json' : 'template'),
      authoredValue: Object.prototype.hasOwnProperty.call(authored, key) ? String(authored[key] ?? '') : null,
      baseValue: Object.prototype.hasOwnProperty.call(base, key) ? String(base[key] ?? '') : null,
    };
  });
}

function flattenObject(value, prefix = '', out = [], depth = 0) {
  if (depth > 5) return out;
  if (Array.isArray(value)) {
    out.push({ key: prefix, value: JSON.stringify(value), kind: 'array' });
    return out;
  }
  if (!isObj(value)) {
    out.push({ key: prefix, value: String(value ?? ''), kind: typeof value });
    return out;
  }
  for (const [k,v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (isObj(v)) flattenObject(v, path, out, depth + 1);
    else if (Array.isArray(v)) out.push({ key:path, value:JSON.stringify(v), kind:'array' });
    else out.push({ key:path, value:String(v ?? ''), kind:typeof v });
  }
  return out;
}

function getNodeLabel(node, rt) {
  const explicit = node?.meta?.treeName || node?.meta?.name || node?.meta?.label || node?.content?.label || node?.content?.name;
  if (explicit) return String(explicit);
  const baseLabel = KIND_LABELS[String(node?.kind || '').toLowerCase()] || 'Елемент';
  let index = Number(node?.tree?.indexInParent);
  if (!Number.isFinite(index)) {
    const parent = node?.parentId ? rt?.store?.maybeGet?.(node.parentId) : null;
    const children = Array.isArray(parent?.children) ? parent.children : [];
    const found = children.indexOf(node?.id);
    index = found >= 0 ? found : 0;
  }
  return `${baseLabel} ${index + 1}`;
}

function mappingForProperty(key) {
  if (EXACT_WIDGET_MAP[key]) return EXACT_WIDGET_MAP[key];
  const k = String(key || '').toLowerCase();
  if (k.startsWith('--sf-') || READONLY_KEYS.has(key)) return { coverage:'system', title:'', selector:'', label:'Системна властивість' };
  if (k.includes('background') || k === 'opacity' || k === 'filter' || k === 'backdrop-filter' || k === '-webkit-backdrop-filter' || k.startsWith('--st-bgfx') || k.startsWith('--st-block-surface') || k.startsWith('--st-element-fx')) return { coverage:'partial', title:'Заливка', selector:'', label:'Заливка / фон' };
  if (k.startsWith('--st-fx-')) return { coverage:'partial', title:'Спецефекти', selector:'', label:'Спецефекти' };
  if (k.includes('border') || k.includes('radius') || k.includes('outline')) return { coverage:'partial', title:'Лінії', selector:'', label:'Рамка / радіус' };
  if (k.includes('shadow')) return { coverage:'partial', title:'Тіні', selector:'', label:'Тінь' };
  if (k === 'position' || k === 'z-index' || k.includes('overflow') || k === 'isolation' || k === 'clip-path') return { coverage:'partial', title:'Слої / Межі', selector:'', label:'Слої / межі' };
  if (/^(width|height|min-width|max-width|min-height|max-height|aspect-ratio)$/u.test(k)) return { coverage:'partial', title:'Розміри', selector:'', label:'Розміри' };
  if (k.includes('font') || k === 'color' || k.includes('text-') || k.includes('letter-') || k.includes('line-height') || k.includes('word-') || k === 'white-space') return { coverage:'partial', title:'Текст', selector:'', label:'Текст' };
  if (k.includes('animation') || k.includes('transition') || k.includes('transform')) return { coverage:'partial', title:'Анімація', selector:'', label:'Анімація' };
  if (k.includes('margin') || k.includes('padding') || k === 'gap' || k.includes('column-gap') || k.includes('row-gap') || k === 'display' || k.startsWith('flex') || k.startsWith('grid') || k.includes('align-') || k.includes('justify-') || k === 'place-items' || k === 'place-content') return { coverage:'partial', title:'Розмітка', selector:'', label:'Розмітка' };
  return { coverage:'direct', title:'', selector:'', label:'Пряме редагування' };
}

function coverageText(type) {
  return ({ full:'Є у віджеті', partial:'Є групове', direct:'Редагування тут', system:'Системне' })[type] || 'Редагування тут';
}
function sourceText(source) {
  return ({ responsive:'Адаптив', json:'JSON', template:'Шаблон' })[source] || 'JSON';
}

function looksLikeColor(key, value) {
  const k = String(key || '').toLowerCase();
  const v = String(value || '').trim();
  if (k.includes('color') || /(?:^|-)c[123]$/u.test(k) || k.endsWith('-color')) return true;
  return /^#(?:[0-9a-f]{3,8})$/iu.test(v) || /^rgba?\(/iu.test(v) || /^hsla?\(/iu.test(v);
}

function parseColor(value) {
  const v = String(value || '').trim();
  let m = v.match(/^#([0-9a-f]{3,8})$/iu);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map(c => c+c).join('');
    if (h.length === 6 || h.length === 8) {
      return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16), a:h.length===8 ? +(parseInt(h.slice(6,8),16)/255).toFixed(3) : 1 };
    }
  }
  m = v.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/iu);
  if (m) return { r:+m[1], g:+m[2], b:+m[3], a:m[4] == null ? 1 : +m[4] };
  return null;
}
function rgbaString(c) {
  const r = Math.max(0, Math.min(255, Math.round(+c.r || 0)));
  const g = Math.max(0, Math.min(255, Math.round(+c.g || 0)));
  const b = Math.max(0, Math.min(255, Math.round(+c.b || 0)));
  const a = Math.max(0, Math.min(1, Number(c.a ?? 1)));
  if (a >= .999) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
}
function hex6(c) {
  return `#${[c.r,c.g,c.b].map(n => Math.max(0,Math.min(255,Math.round(+n||0))).toString(16).padStart(2,'0')).join('')}`;
}

function parseNumberCss(value) {
  const m = String(value || '').trim().match(/^(-?(?:\d+\.?\d*|\.\d+))\s*([a-z%]*)$/iu);
  return m ? { number:+m[1], unit:m[2] || '' } : null;
}
function numberSpec(key, parsed) {
  const k = String(key || '').toLowerCase();
  const unit = parsed?.unit || '';
  let min = -500, max = 500, step = unit === 'px' ? 1 : .1;
  if (unit === '%' || k.includes('opacity') || k.includes('alpha')) { min = 0; max = unit === '%' ? 100 : 1; step = unit === '%' ? 1 : .01; }
  if (unit === 'deg' || k.includes('angle') || k.includes('rotate')) { min = 0; max = 360; step = 1; }
  if (k === 'z-index') { min = -100; max = 1000; step = 1; }
  if (k.includes('blur')) { min = 0; max = unit === 'px' ? 100 : 100; step = unit === 'px' ? 1 : .1; }
  if (/width|height|margin|padding|gap|top|left|right|bottom|radius/u.test(k)) { min = k.includes('margin') || /top|left|right|bottom/u.test(k) ? -500 : 0; max = 2000; step = unit === 'px' || !unit ? 1 : .1; }
  return { min, max, step };
}

function findSectionByTitle(title) {
  const sections = Array.from(document.querySelectorAll('#design-panel-root .design-section'));
  return sections.find(sec => String(sec.querySelector('.design-section__header-title')?.textContent || '').trim() === title) || null;
}
function jumpToWidget(map) {
  if (!map?.title) return;
  const sec = findSectionByTitle(map.title);
  if (!sec) return;
  const body = sec.querySelector('.design-section__body');
  sec.classList.add('is-open');
  if (body) body.hidden = false;
  let target = null;
  if (map.selector) {
    try { target = sec.querySelector(map.selector); } catch (_) {}
  }
  const focus = target || sec;
  focus.scrollIntoView({ behavior:'smooth', block:'center' });
  if (target instanceof HTMLElement) {
    target.classList.add('st-element-info-jump-01008');
    try { target.focus({ preventScroll:true }); } catch (_) {}
    setTimeout(() => target.classList.remove('st-element-info-jump-01008'), 1600);
  }
}

function liveOwner(nodeId) {
  if (!nodeId) return null;
  const s = cssEscape(nodeId);
  return document.querySelector(`[data-sf-id="${s}"], [data-st-node-id="${s}"], [data-node-id="${s}"]`);
}

function makeTooltip() {
  let tip = document.getElementById(TOOLTIP_ID);
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = TOOLTIP_ID;
  tip.className = 'st-element-info-tooltip-01008';
  tip.hidden = true;
  tip.innerHTML = `
    <div class="st-element-info-tooltip-01008__eyebrow">SITEFRAMESTORE · ДЖЕРЕЛО ПРАВДИ</div>
    <div class="st-element-info-tooltip-01008__title">Інформація активного елемента</div>
    <div class="st-element-info-tooltip-01008__text">
      Клікніть на будь-яку секцію, рівень, контейнер, текст або інший елемент полотна. Тут буде показано саме його JSON: назву, ID, тип, усі записані стилі, адаптивні значення, геометрію та службовий контракт. Кружечок біля властивості відкриває відповідне місце інспектора, а олівець дозволяє змінити лише значення властивості. Під час редагування працює live-preview без Store/history; «Застосувати» робить один фінальний commit. Ключі, селектори та системні поля не редагуються.
    </div>`;
  document.body.appendChild(tip);
  return tip;
}

function positionTooltip(tip, anchor) {
  const r = anchor.getBoundingClientRect();
  const width = Math.min(560, Math.max(360, window.innerWidth - 32));
  const left = Math.max(16, Math.min(window.innerWidth - width - 16, r.right + 14));
  const top = Math.max(16, Math.min(window.innerHeight - 310, r.top - 18));
  tip.style.width = `${width}px`;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function editorMarkup(row) {
  const value = row.value;
  if (looksLikeColor(row.key, value)) {
    const c = parseColor(value) || { r:0,g:0,b:0,a:1 };
    return `
      <div class="stei-editor stei-editor--color" data-editor-kind="color">
        <div class="stei-editor__color-preview" data-ei-color-preview style="--ei-color:${esc(value)}"></div>
        ${[['R','r',0,255,1,c.r],['G','g',0,255,1,c.g],['B','b',0,255,1,c.b],['A','a',0,1,.01,c.a]].map(([label,name,min,max,step,val]) => `
          <label class="stei-editor__channel"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-ei-channel="${name}"><input type="number" min="${min}" max="${max}" step="${step}" value="${val}" data-ei-channel-number="${name}"></label>`).join('')}
        <label class="stei-editor__manual"><span>Значення</span><input type="text" value="${esc(value)}" data-ei-manual></label>
      </div>`;
  }
  const n = parseNumberCss(value);
  if (n) {
    const spec = numberSpec(row.key, n);
    return `
      <div class="stei-editor stei-editor--number" data-editor-kind="number" data-unit="${esc(n.unit)}">
        <input type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${n.number}" data-ei-number-range>
        <div class="stei-editor__number-row">
          <button type="button" class="stei-nudge" data-ei-nudge="-1" title="Зменшити на крок">◀</button>
          <input type="number" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${n.number}" data-ei-number>
          <span class="stei-unit">${esc(n.unit || '—')}</span>
          <button type="button" class="stei-nudge" data-ei-nudge="1" title="Збільшити на крок">▶</button>
        </div>
        <label class="stei-editor__manual"><span>Вручну</span><input type="text" value="${esc(value)}" data-ei-manual></label>
      </div>`;
  }
  const enums = ENUM_VALUES[row.key];
  if (enums) {
    const opts = Array.from(new Set([value, ...enums])).map(v => `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(v)}</option>`).join('');
    return `
      <div class="stei-editor stei-editor--enum" data-editor-kind="enum">
        <select data-ei-enum>${opts}</select>
        <label class="stei-editor__manual"><span>Вручну</span><input type="text" value="${esc(value)}" data-ei-manual></label>
      </div>`;
  }
  const complex = value.length > 76 || /gradient\(|shadow|calc\(|var\(|url\(/iu.test(value);
  return `<div class="stei-editor stei-editor--text" data-editor-kind="text"><label class="stei-editor__manual"><span>Значення</span>${complex ? `<textarea rows="3" data-ei-manual>${esc(value)}</textarea>` : `<input type="text" value="${esc(value)}" data-ei-manual>`}</label></div>`;
}

function rowMarkup(row, index) {
  const map = mappingForProperty(row.key);
  const system = map.coverage === 'system';
  const swatch = looksLikeColor(row.key, row.value) ? `<span class="stei-swatch" style="--ei-swatch:${esc(row.value)}" title="${esc(row.value)}"></span>` : '';
  return `
    <article class="stei-row" data-style-row="${index}" data-property="${esc(row.key)}">
      <div class="stei-row__top">
        <div class="stei-row__identity">
          <code class="stei-key">${esc(row.key)}</code>
          <span class="stei-source stei-source--${esc(row.source)}">${sourceText(row.source)}</span>
          <span class="stei-coverage stei-coverage--${esc(map.coverage)}">${coverageText(map.coverage)}</span>
        </div>
        <div class="stei-row__actions">
          ${map.title ? `<button type="button" class="stei-jump" data-ei-jump title="Відкрити: ${esc(map.title)}">●</button>` : `<span class="stei-jump stei-jump--empty" aria-hidden="true">●</span>`}
          <button type="button" class="stei-edit" data-ei-edit ${system?'disabled':''} title="${system?'Системна властивість не редагується':'Редагувати значення'}">✎</button>
        </div>
      </div>
      <div class="stei-row__value">${swatch}<span>${esc(row.value || '∅')}</span></div>
      <div class="stei-row__editor" data-ei-editor hidden>
        ${system ? '' : editorMarkup(row)}
        <div class="stei-row__editor-actions">
          <button type="button" class="stei-btn stei-btn--ghost" data-ei-cancel>Скасувати</button>
          ${row.authoredValue !== null ? `<button type="button" class="stei-btn stei-btn--ghost" data-ei-authored title="Підставити авторське значення шаблона">Початкове</button>` : ''}
          <button type="button" class="stei-btn stei-btn--primary" data-ei-apply>Застосувати</button>
        </div>
      </div>
    </article>`;
}

function metaTable(node, state, rt) {
  const rows = [
    ['Назва', getNodeLabel(node, rt)],
    ['ID', node.id || '—'],
    ['Тип', `${KIND_LABELS[String(node.kind||'').toLowerCase()] || node.kind || '—'} · ${node.kind || '—'}`],
    ['componentType', node.componentType || '—'],
    ['Область', node.area || '—'],
    ['Батьківський ID', node.parentId || '—'],
    ['Адаптивний профіль', state.profileId || 'base'],
    ['Дітей', Array.isArray(node.children) ? node.children.length : 0],
  ];
  return rows.map(([k,v]) => `<div class="stei-meta__row"><span>${esc(k)}</span><code>${esc(v)}</code></div>`).join('');
}

function renderSection(section, getSelection) {
  const rt = runtime();
  const body = section.querySelector('[data-ei-body]');
  const name = section.querySelector('[data-ei-active-name]');
  const status = section.querySelector('[data-ei-status]');
  if (!body || !name || !status) return;
  const nodeId = resolveNodeId(getSelection);
  const previousPreviewId = String(section.__stElementInfoPreviewNodeId01008 || '');
  if (previousPreviewId && previousPreviewId !== nodeId) {
    try { rt?.renderElementInfoNode01008?.(previousPreviewId); } catch (_) {}
    section.__stElementInfoPreviewNodeId01008 = '';
  }
  const node = nodeId && rt?.store?.maybeGet?.(nodeId);
  section.dataset.activeNodeId = node?.id || '';
  if (!rt?.store) {
    name.textContent = 'Store недоступний';
    status.textContent = 'SiteFrameStore authority ще не завантажено.';
    body.innerHTML = '<div class="stei-empty">SiteFrameStore недоступний.</div>';
    return;
  }
  if (!node) {
    name.textContent = 'Немає активного елемента';
    status.textContent = 'Клікніть по елементу на полотні.';
    body.innerHTML = '<div class="stei-empty">Оберіть секцію, рівень, контейнер, текст або інший елемент на полотні.</div>';
    return;
  }
  const state = effectiveNodeState(node, rt);
  const rows = effectiveStyleRows(node, state);
  const counts = { full:0, partial:0, direct:0, system:0 };
  rows.forEach(row => { counts[mappingForProperty(row.key).coverage]++; });
  name.textContent = getNodeLabel(node, rt);
  status.textContent = `${rows.length} стилів · ${counts.full} точних контролів · ${counts.partial} групових · ${counts.direct} прямо тут · ${counts.system} системних`;
  const structural = {
    layout: state.effective.layout || {},
    box: state.effective.box || {},
    constraints: state.effective.constraints || {},
    tree: state.effective.tree || {},
  };
  const flat = flattenObject(structural).filter(x => x.key && !/^tree\.(?:ancestorIds|path)$/u.test(x.key));
  body.innerHTML = `
    <div class="stei-active-card">
      <div class="stei-active-card__head"><div><div class="stei-eyebrow">АКТИВНИЙ ЕЛЕМЕНТ</div><strong>${esc(getNodeLabel(node, rt))}</strong></div><button type="button" class="stei-copy" data-ei-copy-json>Копіювати JSON</button></div>
      <div class="stei-meta">${metaTable(node, state, rt)}</div>
    </div>
    <div class="stei-audit">
      <div class="stei-audit__title">Покриття налаштувань</div>
      <div class="stei-audit__grid">
        <span><b>${counts.full}</b> є точний контрол</span><span><b>${counts.partial}</b> є груповий віджет</span><span><b>${counts.direct}</b> редагуються тут</span><span><b>${counts.system}</b> системні</span>
      </div>
      <p>Кожний візуальний CSS-стиль нижче має або перехід у наявний віджет, або прямий редактор у «Інформації елемента». Системні ключі не змінюються.</p>
    </div>
    <div class="stei-group">
      <div class="stei-group__title"><span>Стилі з SiteFrameStore JSON</span><b>${rows.length}</b></div>
      <div class="stei-style-list">${rows.length ? rows.map(rowMarkup).join('') : '<div class="stei-empty">Для цього node у JSON немає style-властивостей.</div>'}</div>
    </div>
    <details class="stei-contract">
      <summary>Геометрія / layout / constraints <b>${flat.length}</b></summary>
      <div class="stei-contract__rows">${flat.map(x => `<div><code>${esc(x.key)}</code><span>${esc(x.value)}</span></div>`).join('') || '<span>Немає значень.</span>'}</div>
    </details>
    <details class="stei-contract stei-contract--json">
      <summary>Повний JSON активного елемента</summary>
      <pre>${esc(JSON.stringify(node, null, 2))}</pre>
    </details>`;
  bindRenderedBody(section, getSelection, node, state, rows);
}

function bindRenderedBody(section, getSelection, node, state, rows) {
  const body = section.querySelector('[data-ei-body]');
  if (!body) return;
  body.querySelector('[data-ei-copy-json]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(node, null, 2)); } catch (_) {}
  });
  body.querySelectorAll('[data-style-row]').forEach((rowEl) => {
    const index = Number(rowEl.dataset.styleRow);
    const row = rows[index];
    if (!row) return;
    const map = mappingForProperty(row.key);
    rowEl.querySelector('[data-ei-jump]')?.addEventListener('click', () => jumpToWidget(map));
    const editor = rowEl.querySelector('[data-ei-editor]');
    rowEl.querySelector('[data-ei-edit]')?.addEventListener('click', () => {
      if (!editor) return;
      const wasHidden = editor.hidden;
      body.querySelectorAll('[data-ei-editor]').forEach(x => { if (x !== editor) x.hidden = true; });
      editor.hidden = !wasHidden;
      if (wasHidden) editor.scrollIntoView({ behavior:'smooth', block:'nearest' });
    });
    if (!editor) return;
    bindEditor(section, getSelection, node, row, editor);
  });
}

function bindEditor(section, getSelection, node, row, editor) {
  let current = row.value;
  const owner = () => liveOwner(node.id);
  const manual = editor.querySelector('[data-ei-manual]');
  function preview(next) {
    current = String(next ?? '');
    if (manual && manual.value !== current) manual.value = current;
    const el = owner();
    if (el) {
      section.__stElementInfoPreviewNodeId01008 = node.id;
      try { el.style.setProperty(row.key, current, 'important'); } catch (_) {}
    }
    const valueEl = editor.closest('.stei-row')?.querySelector('.stei-row__value span:last-child');
    if (valueEl) valueEl.textContent = current || '∅';
    const swatch = editor.closest('.stei-row')?.querySelector('.stei-swatch');
    if (swatch) swatch.style.setProperty('--ei-swatch', current);
  }
  function restoreFromStore() {
    section.__stElementInfoPreviewNodeId01008 = '';
    runtime()?.renderElementInfoNode01008?.(node.id);
    renderSection(section, getSelection);
  }

  const kind = editor.querySelector('[data-editor-kind]')?.dataset.editorKind || '';
  if (kind === 'color') {
    const ch = parseColor(row.value) || { r:0,g:0,b:0,a:1 };
    const values = { ...ch };
    const refreshColor = () => {
      const val = rgbaString(values);
      preview(val);
      const p = editor.querySelector('[data-ei-color-preview]');
      if (p) p.style.setProperty('--ei-color', val);
      const m = editor.querySelector('[data-ei-manual]'); if (m) m.value = val;
    };
    editor.querySelectorAll('[data-ei-channel]').forEach(inp => {
      inp.addEventListener('input', () => {
        values[inp.dataset.eiChannel] = +inp.value;
        const num = editor.querySelector(`[data-ei-channel-number="${inp.dataset.eiChannel}"]`); if (num) num.value = inp.value;
        refreshColor();
      });
    });
    editor.querySelectorAll('[data-ei-channel-number]').forEach(inp => {
      inp.addEventListener('input', () => {
        values[inp.dataset.eiChannelNumber] = +inp.value;
        const range = editor.querySelector(`[data-ei-channel="${inp.dataset.eiChannelNumber}"]`); if (range) range.value = inp.value;
        refreshColor();
      });
    });
    manual?.addEventListener('input', () => {
      const parsed = parseColor(manual.value);
      if (parsed) {
        Object.assign(values, parsed);
        for (const key of ['r','g','b','a']) {
          const a = editor.querySelector(`[data-ei-channel="${key}"]`); if (a) a.value = values[key];
          const b = editor.querySelector(`[data-ei-channel-number="${key}"]`); if (b) b.value = values[key];
        }
        preview(manual.value);
      }
    });
  } else if (kind === 'number') {
    const range = editor.querySelector('[data-ei-number-range]');
    const num = editor.querySelector('[data-ei-number]');
    const unit = editor.querySelector('[data-editor-kind]')?.dataset.unit || '';
    const setNumber = (raw) => {
      const val = Number(raw);
      if (!Number.isFinite(val)) return;
      if (range) range.value = String(val); if (num) num.value = String(val);
      preview(`${val}${unit}`);
    };
    range?.addEventListener('input', () => setNumber(range.value));
    num?.addEventListener('input', () => setNumber(num.value));
    editor.querySelectorAll('[data-ei-nudge]').forEach(btn => btn.addEventListener('click', () => {
      const step = Number(num?.step || range?.step || 1) || 1;
      setNumber((Number(num?.value || 0) || 0) + step * Number(btn.dataset.eiNudge || 0));
    }));
    manual?.addEventListener('input', () => preview(manual.value));
  } else if (kind === 'enum') {
    const select = editor.querySelector('[data-ei-enum]');
    select?.addEventListener('change', () => { if (manual) manual.value = select.value; preview(select.value); });
    manual?.addEventListener('input', () => preview(manual.value));
  } else {
    manual?.addEventListener('input', () => preview(manual.value));
  }

  editor.querySelector('[data-ei-authored]')?.addEventListener('click', () => {
    if (row.authoredValue !== null) preview(row.authoredValue);
  });
  editor.querySelector('[data-ei-cancel]')?.addEventListener('click', restoreFromStore);
  editor.querySelector('[data-ei-apply]')?.addEventListener('click', () => {
    const latestId = resolveNodeId(getSelection);
    if (latestId !== node.id) { restoreFromStore(); return; }
    section.__stElementInfoPreviewNodeId01008 = '';
    const result = runtime()?.commitElementInfoStyle01008?.({ nodeId:node.id, property:row.key, value:current, reason:`element-info:${row.key}` });
    if (!result?.ok) restoreFromStore();
    else renderSection(section, getSelection);
  });
}

export function initElementInfoWidget(host, getSelection) {
  if (!host || host.querySelector(`#${SECTION_ID}`)) return host?.querySelector?.(`#${SECTION_ID}`) || null;
  const section = document.createElement('section');
  section.id = SECTION_ID;
  section.className = 'design-section st-element-info-01008';
  section.dataset.elementInfoVersion = VERSION;
  section.innerHTML = `
    <button class="design-section__header" type="button" aria-expanded="false">
      <div class="design-section__header-title st-element-info-title-01008"><span>Інформація елемента</span><small>JSON · SiteFrameStore</small></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden>
      <div class="stei-headline"><div><span>Активний елемент</span><strong data-ei-active-name>Немає активного елемента</strong></div><span class="stei-live-dot" title="SiteFrameStore live selection"></span></div>
      <div class="stei-status" data-ei-status>Клікніть по елементу на полотні.</div>
      <div data-ei-body><div class="stei-empty">Оберіть елемент на полотні.</div></div>
    </div>`;
  host.appendChild(section);

  // 3-second help tooltip on title hover. Pure UI; no observer/timer loop.
  const title = section.querySelector('.st-element-info-title-01008');
  const tip = makeTooltip();
  let helpTimer = 0;
  const hide = () => { if (helpTimer) clearTimeout(helpTimer); helpTimer = 0; tip.hidden = true; };
  title?.addEventListener('mouseenter', () => {
    if (helpTimer) clearTimeout(helpTimer);
    helpTimer = window.setTimeout(() => { positionTooltip(tip, title); tip.hidden = false; }, 3000);
  });
  title?.addEventListener('mouseleave', hide);
  tip.addEventListener('mouseleave', () => { tip.hidden = true; });
  window.addEventListener('resize', () => { if (!tip.hidden && title) positionTooltip(tip, title); });

  let scheduled = 0;
  const sync = () => {
    if (scheduled) return;
    scheduled = requestAnimationFrame(() => { scheduled = 0; renderSection(section, getSelection); });
  };
  document.addEventListener('st:selection-changed', sync);
  window.addEventListener('st:selection-changed', sync);
  window.addEventListener('st:element-info-property-committed-01008', sync);
  document.addEventListener('st:site-frame-transaction-committed', sync);
  window.addEventListener('st:responsive-profile-changed-00991', sync);
  window.addEventListener('st:main-fill-style-applied', sync);
  sync();
  return section;
}
