// js/design/widgets/ai-templates/ai-templates-engine.js
// Demo planner для акордеона "Шаблони AI".
// Поки БЕЗ зовнішнього AI: лише правила + структурований recipe,
// який можна безпечно застосувати вже існуючими механізмами конструктора.

const DEFAULT_ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
const DEFAULT_PHONE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.11 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.59 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.15a2 2 0 0 1 2.11-.45c.84.27 1.72.47 2.62.59A2 2 0 0 1 22 16.92z"></path></svg>';
const DEFAULT_STAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.56 5.82 22 7 14.15l-5-4.88 6.91-1.01L12 2z"></path></svg>';

const COLOR_PATTERNS = [
  { re: /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/ig, map: (m) => [m[0]] },
  { re: /синьо[-\s]*жовт/ig, map: () => ['#2563eb', '#facc15'] },
  { re: /жовто[-\s]*син/ig, map: () => ['#facc15', '#2563eb'] },
  { re: /бірюз|turquoise|teal/ig, map: () => ['#14b8a6'] },
  { re: /блакит|голуб|azure|sky\s*blue/ig, map: () => ['#38bdf8'] },
  { re: /син(?!хр)|blue|navy/ig, map: () => ['#2563eb'] },
  { re: /жовт|yellow/ig, map: () => ['#facc15'] },
  { re: /золот|gold/ig, map: () => ['#eab308'] },
  { re: /черв|red|crimson|scarlet/ig, map: () => ['#ef4444'] },
  { re: /зелен|green|emerald|lime/ig, map: () => ['#22c55e'] },
  { re: /помаранч|орандж|оранж|orange|amber/ig, map: () => ['#f97316'] },
  { re: /фіол|purple|violet/ig, map: () => ['#8b5cf6'] },
  { re: /рожев|pink|magenta/ig, map: () => ['#ec4899'] },
  { re: /чорн|black|graphite/ig, map: () => ['#111827'] },
  { re: /біло|white/ig, map: () => ['#ffffff'] },
  { re: /сір|gray|grey|silver/ig, map: () => ['#6b7280'] },
  { re: /коричн|brown/ig, map: () => ['#8b5e3c'] },
  { re: /мят|mint/ig, map: () => ['#34d399'] },
  { re: /cyan/ig, map: () => ['#06b6d4'] },
];

function normalizeText(value){
  return String(value || '').trim();
}

function detectKind(prompt, requestedKind){
  const safe = String(requestedKind || '').trim();
  if (safe && safe !== 'auto') return safe;
  const p = normalizeText(prompt).toLowerCase();
  if (/шапк|header/.test(p)) return 'header';
  if (/логотип|лого|brand/.test(p)) return 'logo';
  if (/png|бейдж|стікер|badge/.test(p)) return 'png';
  return 'button';
}

function extractQuotedText(prompt){
  const raw = String(prompt || '');
  const m = raw.match(/["“”«](.+?)["“”»]/);
  return m ? String(m[1] || '').trim() : '';
}

function normalizeHexColor(value){
  const raw = String(value || '').trim();
  const m = raw.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return '';
  const hex = m[1].toLowerCase();
  return '#' + (hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex);
}

function uniqColors(list){
  const out = [];
  const seen = new Set();
  for (const item of (Array.isArray(list) ? list : [])) {
    const hex = normalizeHexColor(item);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    out.push(hex);
  }
  return out;
}

function clampAngle(value){
  const n = Number(value);
  if (!Number.isFinite(n)) return 135;
  const mod = ((n % 360) + 360) % 360;
  return Math.round(mod);
}

function lightenHex(hex, ratio = 0.18){
  const safe = normalizeHexColor(hex) || '#2563eb';
  const p = Math.min(1, Math.max(0, Number(ratio) || 0));
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  const mix = (channel) => Math.round(channel + (255 - channel) * p).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function extractGradientAngle(prompt){
  const raw = String(prompt || '');
  const p = raw.toLowerCase();

  const directionalRules = [
    { re: /(горизонтальн|horizontal|зліва\s*(?:-|–|—)?\s*направо|зліва\s*вправо|left\s*to\s*right)/i, angle: 90 },
    { re: /(горизонтальн[^\n]{0,20}справа\s*(?:-|–|—)?\s*наліво|справа\s*наліво|right\s*to\s*left)/i, angle: 270 },
    { re: /(вертикальн|vertical|зверху\s*(?:-|–|—)?\s*вниз|зверху\s*донизу|top\s*to\s*bottom)/i, angle: 180 },
    { re: /(вертикальн[^\n]{0,20}знизу\s*(?:-|–|—)?\s*вгору|знизу\s*вгору|bottom\s*to\s*top)/i, angle: 0 },
    { re: /(діагонал|diagonal|по\s*діагонал)/i, angle: 135 },
    { re: /(зліва\s*вгорі[^\n]{0,20}вправо\s*вниз|top\s*left\s*to\s*bottom\s*right|лів[ао].{0,10}верх.{0,10}прав.{0,10}низ)/i, angle: 135 },
    { re: /(справа\s*вгорі[^\n]{0,20}вліво\s*вниз|top\s*right\s*to\s*bottom\s*left|прав.{0,10}верх.{0,10}лів.{0,10}низ)/i, angle: 225 },
    { re: /(зліва\s*внизу[^\n]{0,20}вправо\s*вгору|bottom\s*left\s*to\s*top\s*right|лів[ао].{0,10}низ.{0,10}прав.{0,10}верх)/i, angle: 45 },
    { re: /(справа\s*внизу[^\n]{0,20}вліво\s*вгору|bottom\s*right\s*to\s*top\s*left|прав.{0,10}низ.{0,10}лів.{0,10}верх)/i, angle: 315 },
  ];

  const patterns = [
    /(?:кут|angle)[^\d-]{0,18}(-?\d{1,3})/i,
    /(?:нахил|наклон)[^\d-]{0,18}(-?\d{1,3})/i,
    /(-?\d{1,3})\s*(?:°|градус(?:ів|а|ов)?|градуси|degrees?|deg)/i,
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (!m) continue;
    return { angle: clampAngle(m[1]), explicit: true };
  }

  for (const rule of directionalRules) {
    if (rule.re.test(p)) return { angle: clampAngle(rule.angle), explicit: true };
  }

  return { angle: 135, explicit: false };
}

function collectColorHits(prompt){
  const raw = String(prompt || '');
  const hits = [];
  for (const spec of COLOR_PATTERNS) {
    const re = new RegExp(spec.re.source, spec.re.flags);
    let m;
    while ((m = re.exec(raw))) {
      const colors = uniqColors(typeof spec.map === 'function' ? spec.map(m) : []);
      if (!colors.length) continue;
      hits.push({
        index: Number(m.index) || 0,
        length: String(m[0] || '').length,
        match: String(m[0] || ''),
        colors,
      });
      if (!re.global) break;
    }
  }
  hits.sort((a, b) => a.index - b.index);
  return hits;
}

function extractColorsFromPrompt(prompt){
  const hits = collectColorHits(prompt);
  const ordered = [];
  for (const hit of hits) {
    for (const color of hit.colors) ordered.push(color);
  }
  return uniqColors(ordered);
}

function aiTemplateColorWordPattern_(){
  // 00085: String.raw is required here. In a normal JS string, "\S" and "\b"
  // are consumed before RegExp() sees them, which can break recipe creation for
  // commands like "додай жовту кнопку ... зроби тінь оранджеву".
  return String.raw`(?:#(?:[0-9a-f]{3}|[0-9a-f]{6})\b|червон\S*|red|зелен\S*|green|син\S*|блакит\S*|blue|жовт\S*|yellow|золот\S*|gold|бі(?:л|л)\S*|white|чорн\S*|black|сір\S*|gray|grey|рожев\S*|pink|фіолет\S*|purple|помаранч\S*|орандж\S*|оранж\S*|orange|вишнев\S*|бордов\S*|коричнев\S*|brown|бірюз\S*|cyan|срібн\S*|silver|салат\S*|малин\S*)`;
}

function colorHexFromText_(value, fallback = ''){
  const colors = extractColorsFromPrompt(value);
  return normalizeHexColor(colors[0] || '') || fallback;
}

function stripButtonNonSurfaceStyleClauses(prompt){
  let out = String(prompt || '');
  const color = aiTemplateColorWordPattern_();
  const textWord = String.raw`(?:текст\S*|напис\S*|надпис\S*|label|caption)`;
  const shadowWord = String.raw`(?:тінь|тінню|тіні|shadow|box\s*-?shadow|підсвітк\S*|glow|неон)`;
  const borderWord = String.raw`(?:border|бордер\S*|рамк\S*|обводк\S*|контур\S*|outline)`;
  const patterns = [
    new RegExp('(?:з|із|с|with)?\\s*' + color + '\\s+' + textWord, 'igu'),
    new RegExp(textWord + '\\s+' + color, 'igu'),
    new RegExp('(?:додай|добав|зроби|постав|дай|add|make|set)?\\s*(?:легк\\S*|сильн\\S*|м[’\\x27`]?як\\S*|soft|strong)?\\s*' + color + '?\\s*' + shadowWord + '(?:\\s+' + color + ')?', 'igu'),
    new RegExp(shadowWord + '(?:\\s+' + color + ')?', 'igu'),
    new RegExp(color + '\\s+' + borderWord + '(?:\\s+\\d+\\s*(?:px|пікс\\S*)?)?', 'igu'),
    new RegExp(borderWord + '(?:\\s+' + color + ')?(?:\\s+\\d+\\s*(?:px|пікс\\S*)?)?', 'igu'),
  ];
  for (const re of patterns) out = out.replace(re, ' ');
  return out.replace(/\s+/g, ' ').trim();
}

function extractButtonTextColorHex(prompt){
  const raw = String(prompt || '');
  const color = aiTemplateColorWordPattern_();
  const textWord = String.raw`(?:текст\S*|напис\S*|надпис\S*|label|caption)`;
  const patterns = [
    new RegExp('(?:з|із|с|with)\\s+(' + color + ')\\s+' + textWord, 'iu'),
    new RegExp('(' + color + ')\\s+' + textWord, 'iu'),
    new RegExp(textWord + '\\s+(' + color + ')', 'iu'),
  ];
  for (const re of patterns) {
    const m = re.exec(raw);
    if (m && m[1]) return colorHexFromText_(m[1]);
  }
  return '';
}

function extractButtonShadowCss(prompt){
  const raw = String(prompt || '');
  if (!/(тінь|тінню|тіні|shadow|підсвітк|glow|неон)/iu.test(raw)) return '';
  const color = aiTemplateColorWordPattern_();
  const shadowWord = String.raw`(?:тінь|тінню|тіні|shadow|box\s*-?shadow|підсвітк\S*|glow|неон)`;
  const patterns = [
    new RegExp('(' + color + ')\\s+' + shadowWord, 'iu'),
    new RegExp(shadowWord + '\\s+(' + color + ')', 'iu'),
  ];
  let hex = '';
  for (const re of patterns) {
    const m = re.exec(raw);
    if (m && m[1]) { hex = colorHexFromText_(m[1]); break; }
  }
  hex = hex || '#2563eb';
  return `0 12px 30px ${hexToRgbaCssLocal_(hex, 0.34)}`;
}

function hexToRgbaCssLocal_(hex, alpha = 1){
  const safe = normalizeHexColor(hex) || '#2563eb';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  const a = Math.min(1, Math.max(0, Number(alpha)));
  return `rgba(${r},${g},${b},${a})`;
}

function extractHexFromGradientStop(stop){
  const raw = String(stop || '').trim();
  const m = raw.match(/^(#(?:[0-9a-f]{6}|[0-9a-f]{3}))/i);
  return m ? normalizeHexColor(m[1]) : '';
}

function normalizeGradientStops(list){
  const out = [];
  const seen = new Set();
  for (const item of (Array.isArray(list) ? list : [])) {
    const raw = String(item || '').trim();
    if (!raw) continue;
    const m = raw.match(/^(#(?:[0-9a-f]{6}|[0-9a-f]{3}))(?:\s+((?:100|\d{1,2})(?:\.\d+)?)%)?$/i);
    if (!m) continue;
    const hex = normalizeHexColor(m[1]);
    if (!hex) continue;
    const pct = m[2] == null ? '' : ` ${Math.max(0, Math.min(100, Number(m[2]) || 0))}%`;
    const key = `${hex}${pct}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function detectGradientPosition(windowText){
  const w = String(windowText || '').toLowerCase();
  if (!w) return null;
  if (/(по\s*середин|посередин|в\s*центрі|у\s*центрі|по\s*центру|центр|middle|center)/i.test(w)) return { pos: 50, axis: '' };
  if (/(з\s*верху|зверху|вгорі|угорі|на\s*верх|верху|top)/i.test(w)) return { pos: 0, axis: 'vertical' };
  if (/(з\s*низу|знизу|внизу|унизу|на\s*низ|bottom)/i.test(w)) return { pos: 100, axis: 'vertical' };
  if (/(зліва|ліворуч|left)/i.test(w)) return { pos: 0, axis: 'horizontal' };
  if (/(справа|праворуч|right)/i.test(w)) return { pos: 100, axis: 'horizontal' };
  if (/(на\s*початк|спочатку|from\s*start|start)/i.test(w)) return { pos: 0, axis: '' };
  if (/(в\s*кінц|на\s*кінц|end|finish)/i.test(w)) return { pos: 100, axis: '' };
  return null;
}

function extractPositionedGradientStops(prompt){
  const raw = String(prompt || '');
  const hits = collectColorHits(prompt);
  if (hits.length < 2) return { stops: [], angle: null, explicit: false };

  const positioned = [];
  const axisVotes = { vertical: 0, horizontal: 0 };

  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i];
    const color = normalizeHexColor((hit.colors || [])[0]);
    if (!color) continue;
    const prevEnd = i > 0 ? (Number(hits[i - 1].index) || 0) + (Number(hits[i - 1].length) || 0) : 0;
    const nextStart = i + 1 < hits.length ? (Number(hits[i + 1].index) || raw.length) : raw.length;
    const beforeText = raw.slice(Math.max(0, prevEnd), Math.max(0, hit.index));
    const afterText = raw.slice(Math.max(0, hit.index + (Number(hit.length) || 0)), Math.min(raw.length, nextStart));
    const posInfo = detectGradientPosition(afterText) || detectGradientPosition(beforeText);
    if (!posInfo) continue;
    if (posInfo.axis === 'vertical') axisVotes.vertical += 1;
    if (posInfo.axis === 'horizontal') axisVotes.horizontal += 1;
    positioned.push({ index: hit.index, color, pos: posInfo.pos, axis: posInfo.axis || '' });
  }

  if (positioned.length < 2) return { stops: [], angle: null, explicit: false };

  positioned.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    return a.index - b.index;
  });

  const stops = normalizeGradientStops(positioned.map((item) => `${item.color} ${item.pos}%`));
  if (stops.length < 2) return { stops: [], angle: null, explicit: false };

  let angle = null;
  if (axisVotes.vertical > axisVotes.horizontal && axisVotes.vertical > 0) angle = 180;
  else if (axisVotes.horizontal > axisVotes.vertical && axisVotes.horizontal > 0) angle = 90;

  return { stops, angle, explicit: true };
}

function inferPresetFromColors(colors){
  const first = String((Array.isArray(colors) && colors[0]) || '').toLowerCase();
  if (!first) return 'primary';
  if (first === '#111827' || first === '#0f172a' || first === '#000000') return 'secondary';
  if (first === '#ef4444' || first === '#ec4899' || first === '#8b5cf6') return 'cta';
  return 'primary';
}

function colorProfileFromPrompt(prompt){
  const p = normalizeText(prompt).toLowerCase();
  const colors = extractColorsFromPrompt(prompt);
  const angleInfo = extractGradientAngle(prompt);
  const positioned = extractPositionedGradientStops(prompt);
  const effectiveAngle = angleInfo.explicit ? angleInfo.angle : (Number.isFinite(Number(positioned.angle)) ? Number(positioned.angle) : angleInfo.angle);
  const wantsGradient = /граді|gradient|blend|перелив|нахил|наклон|кут|angle/.test(p) || colors.length >= 2 || (positioned.stops || []).length >= 2;

  if (/outline|контур/.test(p)) {
    const c1 = colors[0] || '#2563eb';
    return {
      explicit: colors.length > 0 || angleInfo.explicit || positioned.explicit,
      preset: 'outline',
      color1: c1,
      color2: colors[1] || lightenHex(c1, 0.24),
      fillMode: 'solid',
      angle: effectiveAngle,
      gradientStops: [],
    };
  }
  if (/темн|dark|ghost|прозор/.test(p) && !wantsGradient) {
    const c1 = colors[0] || '#0f172a';
    return {
      explicit: colors.length > 0 || angleInfo.explicit || positioned.explicit,
      preset: 'ghost',
      color1: c1,
      color2: colors[1] || lightenHex(c1, 0.18),
      fillMode: 'solid',
      angle: effectiveAngle,
      gradientStops: [],
    };
  }
  if (colors.length) {
    const c1 = colors[0];
    const positionedStops = normalizeGradientStops(positioned.stops || []);
    const gradientStops = wantsGradient
      ? (positionedStops.length >= 2 ? positionedStops : (colors.length >= 2 ? colors : [c1, lightenHex(c1, 0.24)]))
      : [];
    const c2 = extractHexFromGradientStop(gradientStops[1]) || colors[1] || lightenHex(c1, 0.24);
    return {
      explicit: true,
      preset: inferPresetFromColors(colors),
      color1: c1,
      color2: c2,
      fillMode: wantsGradient ? 'gradient' : 'solid',
      angle: effectiveAngle,
      gradientStops,
    };
  }
  if (/зел|green|emerald|lime/.test(p)) {
    return { explicit:false, preset:'secondary', color1:'#16a34a', color2:'#4ade80', fillMode:'gradient', angle: effectiveAngle, gradientStops:['#16a34a','#4ade80'] };
  }
  if (/фіол|purple|violet/.test(p)) {
    return { explicit:false, preset:'cta', color1:'#7c3aed', color2:'#a78bfa', fillMode:'gradient', angle: effectiveAngle, gradientStops:['#7c3aed','#a78bfa'] };
  }
  if (/черв|red|rose/.test(p)) {
    return { explicit:false, preset:'cta', color1:'#dc2626', color2:'#fb7185', fillMode:'gradient', angle: effectiveAngle, gradientStops:['#dc2626','#fb7185'] };
  }
  return {
    explicit: angleInfo.explicit || positioned.explicit,
    preset:'primary',
    color1:'#2563eb',
    color2:'#60a5fa',
    fillMode:wantsGradient ? 'gradient' : 'solid',
    angle: effectiveAngle,
    gradientStops: wantsGradient ? ['#2563eb','#60a5fa'] : [],
  };
}

function shapeProfileFromPrompt(prompt){
  const p = normalizeText(prompt).toLowerCase();
  if (/pill|капсул|round|кругл/.test(p)) return { shape:'pill', explicit:true };
  if (/square|квадрат/.test(p)) return { shape:'square', explicit:true };
  if (/rounded|округл|заокругл|мякі\s*кути/.test(p)) return { shape:'rounded', explicit:true };
  return { shape:'rounded', explicit:false };
}

function buttonLabelFromPrompt(prompt){
  const quoted = extractQuotedText(prompt);
  if (quoted) return quoted.slice(0, 80);
  const p = normalizeText(prompt).toLowerCase();
  if (/куп|замов/.test(p)) return 'Замовити';
  if (/дзвін|подзвон|call/.test(p)) return 'Подзвонити';
  if (/контакт|зв[’'`]?яз|contact/.test(p)) return 'Звʼязатися';
  if (/логін|увійт|signin|login/.test(p)) return 'Увійти';
  return 'Кнопка';
}

function buttonLinkFromPrompt(prompt){
  const raw = normalizeText(prompt);
  const tel = raw.match(/\+?[0-9][0-9\s\-()]{5,}/);
  if (tel) return { mode:'tel', href: tel[0].replace(/\s+/g, '') };
  const email = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email) return { mode:'email', href: email[0] };
  const url = raw.match(/https?:\/\/[^\s]+|\/[A-Za-z0-9_\-/.#?=&]+/);
  if (url) return { mode:'custom', href: url[0] };
  if (/головн|home/.test(raw.toLowerCase())) return { mode:'home', href:'' };
  return { mode:'none', href:'' };
}

function wantsCopyVisualStyle(prompt){
  const p = normalizeText(prompt).toLowerCase();
  return /(так(і|и)?\s+сам(і|и)\s+стил|same\s+style|як\s+у\s+попередн|такий\s+самий\s+стил)/.test(p);
}

function cloneButtonVisualFromSelection(selectionSnapshot){
  if (!selectionSnapshot || selectionSnapshot.type !== 'button' || !selectionSnapshot.detail) return null;
  const d = selectionSnapshot.detail;
  return {
    mode: ['text','text-icon','icon'].includes(String(d.mode || '')) ? String(d.mode) : null,
    iconPosition: ['left','right','none'].includes(String(d.iconPosition || '')) ? String(d.iconPosition) : null,
    icon: d.icon && d.icon.svg ? { svg: String(d.icon.svg), defaultColor: String(d.icon.defaultColor || '#ffffff') } : null,
    extras: d.extras ? {
      preset: String(d.extras.preset || 'primary'),
      shape: String(d.extras.shape || 'rounded'),
      fillMode: String(d.extras.fillMode || 'solid'),
      color1: String(d.extras.color1 || '#2563eb'),
      color2: String(d.extras.color2 || '#60a5fa'),
      angle: Number(d.extras.angle || 135) || 135,
      gradientStops: normalizeGradientStops(d.extras.gradientStops || []),
    } : null,
    hover: d.hover ? d.hover : null,
  };
}

function mergeButtonExtras(copyVisual, colors, shapeInfo){
  const base = copyVisual && copyVisual.extras ? { ...copyVisual.extras } : {
    preset: colors.preset,
    shape: shapeInfo.shape,
    fillMode: colors.fillMode,
    color1: colors.color1,
    color2: colors.color2,
    angle: colors.angle,
    gradientStops: normalizeGradientStops(colors.gradientStops || []),
  };
  const merged = { ...base };
  if (!copyVisual || colors.explicit || (colors.fillMode === 'gradient' && (colors.gradientStops || []).length >= 2)) {
    merged.preset = colors.preset || merged.preset || 'primary';
    merged.fillMode = colors.fillMode || merged.fillMode || 'solid';
    merged.color1 = colors.color1 || merged.color1 || '#2563eb';
    merged.color2 = colors.color2 || merged.color2 || '#60a5fa';
    merged.angle = Number.isFinite(Number(colors.angle)) ? Number(colors.angle) : (Number(merged.angle) || 135);
    merged.gradientStops = normalizeGradientStops(colors.gradientStops || []);
  }
  if (shapeInfo && shapeInfo.explicit) merged.shape = shapeInfo.shape;
  if (!Array.isArray(merged.gradientStops)) merged.gradientStops = [];
  return merged;
}

function defaultButtonRecipe(prompt, selectionSnapshot = null){
  const surfacePrompt = stripButtonNonSurfaceStyleClauses(prompt) || prompt;
  const colors = colorProfileFromPrompt(surfacePrompt);
  const explicitTextColor = extractButtonTextColorHex(prompt);
  const explicitShadowCss = extractButtonShadowCss(prompt);
  const link = buttonLinkFromPrompt(prompt);
  const p = normalizeText(prompt).toLowerCase();
  const copyVisual = wantsCopyVisualStyle(prompt) ? cloneButtonVisualFromSelection(selectionSnapshot) : null;
  const shapeInfo = shapeProfileFromPrompt(prompt);
  const needIcon = copyVisual && copyVisual.mode
    ? (copyVisual.mode === 'text-icon' || copyVisual.mode === 'icon')
    : /ікон|icon|стріл|arrow|phone|дзвін|call|mail|email|лист|конверт|кошик|cart|search|play|download|menu/.test(p);
  const phoneIcon = /phone|дзвін|call/.test(p);
  const extras = mergeButtonExtras(copyVisual, colors, shapeInfo);
  return {
    kind: 'button',
    scope: 'header',
    title: 'AI-шаблон: Кнопка',
    summary: (copyVisual ? 'Створити кнопку у поточному контейнері шапки, зберігши візуальний стиль вибраної кнопки.' : 'Створити кнопку у поточному контейнері шапки через уже наявний button-блок.'),
    canApply: true,
    applyNote: (copyVisual ? 'Працює в Header Builder і в звичайному режимі Дизайну шапки. Якщо вибрано кнопку і в описі є «такі самі стилі», шаблон копіює її візуальний стиль, а текст/посилання бере з опису.' : 'Працює в Header Builder і в звичайному режимі Дизайну шапки. Перед застосуванням вибери контейнер або елемент у шапці.'),
    items: [
      {
        type: 'button',
        detail: {
          text: buttonLabelFromPrompt(prompt),
          mode: copyVisual && copyVisual.mode ? copyVisual.mode : (needIcon ? 'text-icon' : 'text'),
          iconPosition: copyVisual && copyVisual.iconPosition ? copyVisual.iconPosition : 'left',
          icon: copyVisual && copyVisual.icon ? copyVisual.icon : (needIcon ? { svg: phoneIcon ? DEFAULT_PHONE_SVG : DEFAULT_ARROW_SVG, defaultColor: '#ffffff' } : null),
          __iconPrompt: needIcon ? String(prompt || '') : '',
          link: {
            mode: link.mode,
            href: link.href,
            newTab: link.mode === 'custom' && /^https?:\/\//.test(link.href),
            clickArea: 'all',
          },
          adaptive: {
            mode: 'inherit',
            mobileLabel: '',
            width: 140,
            labelSize: 14,
            iconSize: 18,
            gap: 8,
          },
          hover: copyVisual && copyVisual.hover ? copyVisual.hover : {
            target: 'block',
            metrics: {
              block: { opacity: 100, scale: 103, offsetY: -1 },
              label: { opacity: 100, scale: 100, offsetY: 0 },
              icon: { opacity: 100, scale: 100, offsetY: 0 },
            }
          },
          extras,
          __aiTextColor: explicitTextColor,
          __aiShadowCss: explicitShadowCss,
        }
      }
    ]
  };
}

function defaultLogoRecipe(prompt){
  const quoted = extractQuotedText(prompt);
  const p = normalizeText(prompt).toLowerCase();
  const brand = quoted || (/магаз|shop/.test(p) ? 'Brand Shop' : 'Brand');
  const needSubtitle = /підзаг|subtitle|studio|shop|store/.test(p);
  const needIcon = /ікон|icon|зірк|star|mail|email|лист|конверт/.test(p);
  return {
    kind: 'logo',
    scope: 'header',
    title: 'AI-шаблон: Лого',
    summary: 'Створити logo-блок у поточному контейнері шапки без дублювання інспектора.',
    canApply: true,
    applyNote: 'Створює текстове або icon-logo у Header Builder і в звичайному режимі Дизайну шапки. Картинку логотипа можна підставити пізніше через наявний віджет Лого.',
    items: [
      {
        type: 'logo',
        detail: {
          mode: needSubtitle ? 'logo-text-subtitle' : (needIcon ? 'logo-text' : 'text-only'),
          source: needIcon ? 'icon' : 'image',
          position: needIcon ? 'left' : 'none',
          image: null,
          icon: needIcon ? { svg: DEFAULT_STAR_SVG, defaultColor: '#ffffff' } : null,
          __iconPrompt: needIcon ? String(prompt || '') : '',
          layout: {
            markWidth: 96,
            markHeight: 44,
            gap: 12,
            fit: 'contain',
            align: 'center',
            titleSize: 24,
            subtitleSize: 12,
            titleOffsetX: 0,
            titleOffsetY: 0,
            subtitleOffsetX: 0,
            subtitleOffsetY: 0,
          },
          link: { mode:'home', href:'', newTab:false, clickArea:'all' },
          adaptive: { mode:'inherit', markWidth:72, titleSize:18, subtitleSize:11, gap:10 },
          hover: {
            target:'block',
            metrics:{
              block:{ opacity:100, scale:100, offsetY:0 },
              mark:{ opacity:100, scale:100, offsetY:0 },
              title:{ opacity:100, scale:100, offsetY:0 },
              subtitle:{ opacity:100, scale:100, offsetY:0 },
            }
          },
          __brandText: brand,
          __subtitleText: needSubtitle ? 'Studio' : ''
        }
      }
    ]
  };
}

function defaultPngRecipe(prompt){
  const p = normalizeText(prompt).toLowerCase();
  const isGlow = /glow|неон|badge|бейдж/.test(p);
  return {
    kind: 'png',
    scope: 'header',
    title: 'AI-шаблон: PNG',
    summary: 'Створити PNG-блок-плейсхолдер у поточному контейнері шапки. Сам PNG можна швидко підставити пізніше через галерею.',
    canApply: true,
    applyNote: 'Створює PNG-блок без реальної картинки у Header Builder і в звичайному режимі Дизайну шапки. Після вставки вибери PNG у наявному віджеті.',
    items: [
      {
        type: 'png',
        detail: {
          image: null,
          link: { mode:'none', href:'', newTab:false, clickArea:'media' },
          adaptive: { mode:'inherit', width:96, height:64, mobileImage:null },
          hover: {
            target:'media',
            metrics:{
              block:{ opacity:100, scale:100, offsetY:0 },
              media:{ opacity:100, scale: isGlow ? 104 : 100, offsetY: isGlow ? -1 : 0 },
            }
          },
          extras: {
            preset: isGlow ? 'soft' : 'none',
            glowTarget: 'media',
            glowColor: '#60a5fa',
            glowOpacity: isGlow ? 36 : 0,
            glowBlur: isGlow ? 18 : 0,
            glowSpread: isGlow ? 8 : 0,
          }
        }
      }
    ]
  };
}

function defaultHeaderRecipe(prompt){
  const btn = defaultButtonRecipe(prompt);
  const logo = defaultLogoRecipe(prompt);
  const buttonDetail = btn.items[0].detail;
  const logoDetail = logo.items[0].detail;
  return {
    kind: 'header',
    scope: 'header',
    title: 'AI-шаблон: Header composition',
    summary: 'Збирає базову композицію шапки у поточному контейнері: лого → меню → CTA-кнопка.',
    canApply: true,
    applyNote: 'Вставляє всі 3 елементи у поточний контейнер шапки. Розкидати їх по різних контейнерах — окремим етапом.',
    items: [
      { type:'logo', detail: logoDetail },
      { type:'menu', detail: { variant:'big' } },
      { type:'button', detail: buttonDetail },
    ]
  };
}

export function buildAiTemplateRecipe({ prompt = '', kind = 'auto', selectionSnapshot = null } = {}){
  const resolved = detectKind(prompt, kind);
  const recipe = (resolved === 'logo')
    ? defaultLogoRecipe(prompt)
    : (resolved === 'png')
      ? defaultPngRecipe(prompt)
      : (resolved === 'header')
        ? defaultHeaderRecipe(prompt)
        : defaultButtonRecipe(prompt, selectionSnapshot);
  recipe.__meta = {
    ...(recipe.__meta || {}),
    prompt: String(prompt || ''),
    resolvedKind: resolved,
  };
  return recipe;
}
