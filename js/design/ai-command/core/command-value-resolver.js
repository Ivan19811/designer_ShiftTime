import { loadAiCommandData } from './manifest-loader.js';
import { clamp, dedupeBy, findAliasMatches, normalizeAngle, normalizeSpaces, parseAngle, toHex6, uniqueStrings } from './command-utils.js';

function buildColorEntries(colorManifest, synonyms){
  const extra = Array.isArray(synonyms?.values?.colors) ? synonyms.values.colors : [];
  const aliasMap = new Map();
  for (const item of (Array.isArray(colorManifest) ? colorManifest : [])) {
    aliasMap.set(item.id, {
      id: item.id,
      hex: toHex6(item.hex),
      aliases: uniqueStrings([item.label, ...(item.aliases || [])]),
      label: item.label,
    });
  }
  for (const item of extra) {
    const existing = aliasMap.get(item.normalizedTo || item.id);
    if (!existing) continue;
    existing.aliases = uniqueStrings([...existing.aliases, ...(item.aliases || []), item.label]);
  }
  return Array.from(aliasMap.values());
}

function extractColors(text, colorEntries){
  const hits = [];
  for (const entry of colorEntries) {
    const aliasHits = findAliasMatches(text, entry.aliases, 0.78);
    for (const match of aliasHits) {
      hits.push({
        id: entry.id,
        label: entry.label,
        hex: entry.hex,
        alias: match.alias,
        index: match.index,
        confidence: match.confidence,
      });
    }
  }
  const hexRe = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/giu;
  let m;
  while ((m = hexRe.exec(text))) {
    const hex = toHex6(m[0]);
    if (!hex) continue;
    hits.push({ id: hex, label: hex, hex, alias: hex, index: Number(m.index) || 0, confidence: 0.97 });
  }
  return dedupeBy(hits.sort((a, b) => a.index - b.index || b.confidence - a.confidence), (item) => `${item.hex}:${item.index}`);
}

function buildPositionMatchers(synonyms){
  const items = Array.isArray(synonyms?.values?.positions) ? synonyms.values.positions : [];
  return items.map((item) => ({
    id: item.normalizedTo || item.id,
    aliases: uniqueStrings([item.label, ...(item.aliases || [])]),
  }));
}

function buildDirectionMatchers(synonyms, gradientRules){
  const rules = Array.isArray(gradientRules) ? gradientRules : [];
  const extra = Array.isArray(synonyms?.values?.directions) ? synonyms.values.directions : [];
  const byId = new Map();
  for (const rule of rules) {
    byId.set(rule.id, {
      id: rule.id,
      normalizedValue: rule.normalizedValue,
      aliases: uniqueStrings([rule.label, ...(rule.aliases || [])]),
    });
  }
  for (const item of extra) {
    const existing = Array.from(byId.values()).find((rule) => rule.id.includes(item.normalizedTo || item.id) || rule.id === (item.normalizedTo || item.id));
    if (existing) existing.aliases = uniqueStrings([...existing.aliases, item.label, ...(item.aliases || [])]);
  }
  return Array.from(byId.values());
}

function resolveDirection(text, directionMatchers){
  const hits = [];
  for (const item of directionMatchers) {
    const aliasHits = findAliasMatches(text, item.aliases, 0.84);
    for (const hit of aliasHits) {
      hits.push({
        id: item.id,
        alias: hit.alias,
        confidence: hit.confidence,
        normalizedValue: item.normalizedValue,
        index: hit.index,
      });
    }
  }
  hits.sort((a, b) => b.confidence - a.confidence || a.index - b.index);
  const primary = hits[0] || null;
  return {
    primary,
    hits,
    angle: primary ? parseAngle(primary.normalizedValue, 180) : null,
  };
}

function extractAngle(text){
  const m = String(text || '').match(/(-?\d{1,3}(?:\.\d+)?)\s*(?:deg|°|градус(?:ів|а|ов)?|градуси)/iu);
  return m ? normalizeAngle(Number(m[1])) : null;
}

function resolvePositions(text, positionMatchers){
  const hits = [];
  for (const item of positionMatchers) {
    const aliasHits = findAliasMatches(text, item.aliases, 0.82);
    for (const hit of aliasHits) hits.push({ id: item.id, alias: hit.alias, confidence: hit.confidence, index: hit.index });
  }
  return hits.sort((a, b) => a.index - b.index);
}

function positionToPercent(id){
  if (id === 'top' || id === 'left') return 0;
  if (id === 'center') return 50;
  if (id === 'bottom' || id === 'right') return 100;
  return null;
}

function buildGradientStops(text, colorHits, positionHits){
  if (colorHits.length < 2) return [];
  const stops = [];
  for (const color of colorHits) {
    const nearest = positionHits
      .map((pos) => ({ ...pos, distance: Math.abs((pos.index || 0) - (color.index || 0)) }))
      .sort((a, b) => a.distance - b.distance)[0] || null;
    const percent = nearest && nearest.distance <= 24 ? positionToPercent(nearest.id) : null;
    stops.push(percent == null ? `${color.hex}` : `${color.hex} ${percent}%`);
  }
  return uniqueStrings(stops);
}

function detectGradientShareAdjustment(text, colorHits){
  const normalized = String(text || '');
  const colors = uniqueStrings(colorHits.map((item) => item.id));
  if (!colors.length) return null;
  const direction = /(^|\s)(зменш|послаб|менше)(?=$|\s|[,:;])/u.test(normalized) ? -1 : /(^|\s)(додай|збільш|більше|посиль)(?=$|\s|[,:;])/u.test(normalized) ? 1 : 0;
  if (!direction) return null;
  const percentMatch = normalized.match(/(\d{1,3})\s*%/u);
  const percent = clamp(percentMatch ? Number(percentMatch[1]) : 10, 1, 100);
  return {
    kind: direction > 0 ? 'increase' : 'decrease',
    deltaPercent: direction > 0 ? percent : -percent,
    colorIds: colors,
    confidence: percentMatch ? 0.94 : 0.87,
  };
}

function extractNumbers(text){
  const out = [];
  const re = /(\d+(?:[.,]\d+)?)\s*(px|пікселів|пікселі|пікселя|піксель|піксел|rem|em|%|deg|°|відсотків|відсотка|відсоток|percent)?/giu;
  let m;
  while ((m = re.exec(text))) {
    const rawUnit = m[2] || null;
    const unit = /^(відсотків|відсотка|відсоток|percent)$/iu.test(String(rawUnit || '')) ? '%' : (/^(пікселів|пікселі|пікселя|піксель|піксел)$/iu.test(String(rawUnit || '')) ? 'px' : rawUnit);
    out.push({
      raw: m[0],
      value: Number(String(m[1]).replace(',', '.')),
      unit: unit || null,
      index: Number(m.index) || 0,
    });
  }
  return out;
}


function resolveIconName(text){
  const raw = String(text || '');
  const rules = [
    { re: /(конверт(ик|ика|ику|иком|иком)?|конверт|лист(а|ом|и)?|envelope|mail)/u, iconId: 'mail', label: 'mail/envelope', confidence: 0.93 },
    { re: /(телефон|слухавк|phone)/u, iconId: 'phone', label: 'phone', confidence: 0.91 },
    { re: /(книга|book)/u, iconId: 'book-open', label: 'book-open', confidence: 0.9 },
    { re: /(глобус|світ|world|globe)/u, iconId: 'globe', label: 'globe', confidence: 0.9 },
  ];
  for (const rule of rules) {
    if (!rule.re.test(raw)) continue;
    return {
      type: 'icon_name',
      iconId: rule.iconId,
      label: rule.label,
      raw: rule.label,
      confidence: rule.confidence,
    };
  }
  return null;
}

function resolveOpacityKeyword(text){
  const raw = String(text || '');
  if (/(непрозор|не\s+прозор|opaque)/u.test(raw)) {
    return {
      type: 'opacity_keyword',
      keyword: 'opaque',
      raw: 'opaque',
      percent: 100,
      confidence: 0.93,
    };
  }
  if (/(повністю|абсолютно|цілком|на\s+100\s*%|fully|completely)(?:[\s\S]{0,18})?(прозор|transparent)/u.test(raw)) {
    return {
      type: 'opacity_keyword',
      keyword: 'fully-transparent',
      raw: 'fully-transparent',
      percent: 0,
      confidence: 0.93,
    };
  }
  if (/(напівпрозор|наполовину\s+прозор|полупрозрач|semi[-\s]?transparent|half[-\s]?transparent)/u.test(raw)) {
    return {
      type: 'opacity_keyword',
      keyword: 'semi-transparent',
      raw: 'semi-transparent',
      percent: 50,
      confidence: 0.91,
    };
  }
  return null;
}

function opacityDeltaFromNumberHit(hit){
  if (!hit || typeof hit.value !== 'number' || !Number.isFinite(hit.value)) return 0.1;
  if (hit.unit === '%' || hit.value > 1) return clamp(hit.value / 100, 0.01, 1);
  return clamp(hit.value, 0.01, 1);
}

function resolveOpacityAdjustment(text, numberHits){
  const raw = String(text || '');
  const mentionsOpacity = /(прозор|прозрач|opacity|transparent|transparency|просвіч|просвеч)/u.test(raw);
  if (!mentionsOpacity) return null;

  const firstNumber = Array.isArray(numberHits) && numberHits.length ? numberHits[0] : null;
  const hasNumber = !!firstNumber;
  const slightOpacityStep = /(чуть|трішки|трошки|трохи|ледь|легк|легоньк|легеньк|slight|slightly|little|a little)/u.test(raw);
  const delta = hasNumber ? opacityDeltaFromNumberHit(firstNumber) : (slightOpacityStep ? 0.05 : 0.1);

  const lessTransparent = /(зменш|зменши|понизь|опусти|прибери|забери|послаб|уменьш|убав|сбав|decrease|reduce|lower)(?:[\s\S]{0,32})?(прозор|прозрач|opacity|transparent|transparency)/u.test(raw)
    || /(менш|менше|меншою|меншим|меньше|менее|less)(?:[\s\S]{0,16})?(прозор|прозрач|transparent)/u.test(raw)
    || /(більш|більше|более|more)(?:[\s\S]{0,16})?(непрозор|opaque)/u.test(raw)
    || /(не\s+такий|не\s+така|не\s+таке|не\s+такою|не\s+таким)(?:[\s\S]{0,16})?(прозор|прозрач)/u.test(raw)
    || /(less\s+transparent|decrease\s+transparency|reduce\s+transparency|more\s+opaque)/u.test(raw);

  const moreTransparent = /(додай|добав|добавь|збільш|збільши|збільшити|підніми|посиль|усиль|increase|raise|add)(?:[\s\S]{0,32})?(прозор|прозрач|opacity|transparent|transparency)/u.test(raw)
    || /(більш|більше|более|more)(?:[\s\S]{0,16})?(прозор|прозрач|transparent)/u.test(raw)
    || /(прозоріш|прозрачнее|прозрачніш|more\s+transparent)/u.test(raw)
    || (!hasNumber && /(зроби|роби|сделай|make)(?:[\s\S]{0,24})?(прозорим|прозорою|прозоре|прозорий|прозрачным|прозрачной|transparent)/u.test(raw));

  if (!moreTransparent && !lessTransparent) return null;
  const mode = lessTransparent ? 'less_transparent' : 'more_transparent';
  const signed = mode === 'more_transparent' ? -delta : delta;
  return {
    type: 'opacity_adjustment',
    mode,
    value: delta,
    unit: null,
    deltaOpacity: signed,
    raw: `${mode} ${Math.round(delta * 100)}%`,
    confidence: hasNumber ? 0.94 : 0.88,
  };
}
function resolveRelativeColorValue(text){
  const raw = String(text || '');
  if (/(темніш|darker)/u.test(raw)) {
    return {
      type: 'relative_color',
      keyword: 'darker current bg',
      raw: 'darker current bg',
      confidence: 0.9,
    };
  }
  if (/(світліш|lighter)/u.test(raw)) {
    return {
      type: 'relative_color',
      keyword: 'lighter current bg',
      raw: 'lighter current bg',
      confidence: 0.9,
    };
  }
  return null;
}


function resolveSpacingSide(text){
  const raw = String(text || '');
  if (/(зверху|верхн(?:ій|ього)|top)/u.test(raw)) return 'top';
  if (/(знизу|нижн(?:ій|ього)|bottom)/u.test(raw)) return 'bottom';
  if (/(зліва|ліворуч|лів(?:ий|ого)|left)/u.test(raw)) return 'left';
  if (/(справа|праворуч|прав(?:ий|ого)|right)/u.test(raw)) return 'right';
  return null;
}

function resolveSpacingValue(text, numberHits){
  const raw = String(text || '');
  if (!/(відступ|відстань|проміж|інтервал|padding|margin|gap|gutter|spacing|space\s+between|між\s+(кнопк|блок|елемент|контейнер|ряд|секц|картк|пункт))/u.test(raw)) return null;
  if (/(між\s*(?:букв|літер|символ)|letter\s*spacing|міжрядков|line\s*height|рядк)/u.test(raw)) return null;
  const side = resolveSpacingSide(raw);
  const first = Array.isArray(numberHits) && numberHits.length ? numberHits[0] : null;
  const decrease = /(зменш|менш|менше|стисни|ущільни|зблизь|відніми|мінус|decrease|less|smaller|minus|-)/u.test(raw);
  const increase = /(додай|добав|збільш|більш|більше|рознеси|розсунь|плюс|increase|add|more|bigger|plus|\+)/u.test(raw);
  const remove = /(прибери|забери|видали|очисти|скинь|без|remove|clear|delete|no\s+spacing|no\s+gap|no\s+padding|no\s+margin)/u.test(raw);
  if (remove) return { type: 'spacing', side, value: 0, unit: 'px', raw: side ? `${side} 0px` : '0px', confidence: 0.92 };
  if (first) {
    const unit = first.unit || 'px';
    if (increase || decrease) {
      const sign = decrease ? -1 : 1;
      return {
        type: 'spacing_delta',
        side,
        mode: unit === '%' ? 'relative_spacing_percent' : 'relative_spacing',
        delta: Math.abs(first.value) * sign,
        unit,
        raw: `${sign < 0 ? '-' : '+'}${Math.abs(first.value)}${unit}`,
        confidence: side ? 0.92 : 0.9,
      };
    }
    return {
      type: 'spacing',
      side,
      value: first.value,
      unit,
      raw: side ? `${side} ${first.value}${unit}` : `${first.value}${unit}`,
      confidence: side ? 0.9 : 0.88,
    };
  }
  const slight = /(трохи|трошки|трішки|чуть|ледь|slightly|little)/u.test(raw);
  const strong = /(сильно|значно|набагато|велики|великі|дуже|strong|large|big)/u.test(raw);
  const delta = strong ? 16 : (slight ? 4 : 8);
  if (increase || decrease) {
    return {
      type: 'spacing_delta',
      side,
      mode: 'relative_spacing',
      delta: decrease ? -delta : delta,
      unit: 'px',
      raw: `${decrease ? '-' : '+'}${delta}px`,
      confidence: 0.88,
    };
  }
  if (!side) return null;
  return { type: 'spacing', side, raw: side || 'spacing', confidence: 0.84 };
}

function resolveBorderStyleValue(text){
  const raw = String(text || '');
  if (!/(рамк|border|контур|обводк)/u.test(raw)) return null;
  if (/(пунктирн|dashed)/u.test(raw)) return { type: 'border_style', style: 'dashed', raw: 'dashed', confidence: 0.92 };
  if (/(крапков|dotted)/u.test(raw)) return { type: 'border_style', style: 'dotted', raw: 'dotted', confidence: 0.92 };
  if (/(суцільн|solid)/u.test(raw)) return { type: 'border_style', style: 'solid', raw: 'solid', confidence: 0.92 };
  return null;
}

function resolveVisibilityValue(text){
  const raw = String(text || '');
  if (/(сховай|приховай|hide|hidden)/u.test(raw)) return { type: 'visibility', visible: false, raw: 'hidden', confidence: 0.93 };
  if (/(покажи|show|visible)/u.test(raw)) return { type: 'visibility', visible: true, raw: 'visible', confidence: 0.93 };
  return null;
}

function resolveBlurValue(text, numberHits){
  const raw = String(text || '');
  if (!/(blur|розмитт)/u.test(raw)) return null;
  if (/(тінь|shadow)/u.test(raw)) return null;
  const first = Array.isArray(numberHits) && numberHits.length ? numberHits[0] : null;
  const mode = /(backdrop\s*blur|blur\s*backdrop|фонове\s+розмиття|розмиття\s+фону|розмий\s+фон)/u.test(raw) ? 'backdrop' : 'element';
  return {
    type: 'blur',
    mode,
    value: first ? first.value : null,
    unit: first ? (first.unit || 'px') : null,
    raw: first ? `${mode} ${first.value}${first.unit || 'px'}` : mode,
    confidence: first ? 0.92 : 0.86,
  };
}

function resolveColumnCountValue(text, numberHits){
  const raw = String(text || '');
  if (!/(колонк|columns?)/u.test(raw)) return null;
  const first = Array.isArray(numberHits) && numberHits.length ? numberHits[0] : null;
  if (!first) return null;
  return { type: 'number', value: first.value, unit: null, raw: `${first.value}`, confidence: 0.9 };
}


function isShadowRemovalValueText(text = ''){
  const raw = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!raw) return false;
  const shadowWord = '(?:тінь|тінню|тіні|тіньову|тіньовий|shadow|box\\s*-?shadow|підсвітк|glow|неон)';
  const removeWord = '(?:прибери|прибрать|забери|убери|видали|удали|очисти|очисть|скинь|зніми|сними|вимкни|відключи|скасуй|без|remove|delete|clear|disable|turn\\s*off|no|without)';
  const removeBeforeShadow = new RegExp('(?:^|\\s)' + removeWord + '[\\s\\S]{0,36}' + shadowWord + '(?:$|\\s|[,.!?;:])', 'u');
  const shadowBeforeRemove = new RegExp('(?:^|\\s)' + shadowWord + '[\\s\\S]{0,36}' + removeWord + '(?:$|\\s|[,.!?;:])', 'u');
  const transparentShadow = new RegExp('(?:' + shadowWord + '[\\s\\S]{0,60}(?:100\\s*%|повністю|полностью|максимально|zero|0\\s*%)[\\s\\S]{0,40}(?:прозор|прозрач|transparent|opacity)|(?:100\\s*%|повністю|полностью|максимально|zero|0\\s*%)[\\s\\S]{0,40}(?:прозор|прозрач|transparent|opacity)[\\s\\S]{0,60}' + shadowWord + ')', 'u');
  return removeBeforeShadow.test(raw) || shadowBeforeRemove.test(raw) || transparentShadow.test(raw);
}

function buildRemoveShadowValue(){
  return {
    type: 'shadow',
    mode: 'remove_shadow',
    remove: true,
    style: 'none',
    softness: 'none',
    glow: 'none',
    adjustment: 'remove',
    incrementPercent: 0,
    incrementMode: 'remove_shadow',
    color: null,
    raw: 'none',
    confidence: 0.98,
    reason: 'remove_shadow_intent',
  };
}

function resolveShadowValue(text, colorHits){
  const raw = String(text || '');
  if (!/(тінь|shadow|glow|світін|неонов)/u.test(raw)) return null;
  if (isShadowRemovalValueText(raw)) return buildRemoveShadowValue();
  const primaryColor = Array.isArray(colorHits) && colorHits.length ? colorHits[0] : null;
  const softTone = /(м[’'\s]?як|мякіш|мягк|soft)/u.test(raw);
  const softerAdjust = /(м[’'\s]?якш|мякіш|softer)/u.test(raw);
  const stronger = /(сильніш|інтенсивніш|густіш|щільніш|stronger|strong)/u.test(raw);
  const weaker = /(слабш|легш|менш\s+виразн|lighter\s+shadow|weaker)/u.test(raw);
  const softness = softTone ? 'soft' : 'normal';
  const glow = /(неонов|glow|світін)/u.test(raw) ? 'neon' : 'shadow';
  let adjustment = null;
  if (softerAdjust) adjustment = 'softer';
  else if (stronger) adjustment = 'stronger';
  else if (weaker) adjustment = 'weaker';
  return {
    type: 'shadow',
    style: glow === 'neon' && softness === 'soft' ? 'soft_neon_shadow' : glow === 'neon' ? 'neon_shadow' : softness === 'soft' ? 'soft_shadow' : 'shadow',
    softness,
    glow,
    adjustment,
    color: primaryColor ? { colorId: primaryColor.id, hex: primaryColor.hex, label: primaryColor.label } : null,
    raw: adjustment ? `${adjustment} shadow` : (glow === 'neon' && softness === 'soft' ? 'soft neon shadow' : glow === 'neon' ? 'neon shadow' : softness === 'soft' ? 'soft shadow' : 'shadow'),
    confidence: 0.9,
  };
}


function resolveRotationValue(text){
  const raw = String(text || '');
  if (/(догори\s+ногами|догори\s+дригом|вверх\s+ногами|upside\s+down)/u.test(raw)) {
    return {
      type: 'rotation',
      mode: 'absolute',
      degrees: 180,
      raw: '180deg',
      confidence: 0.95,
    };
  }
  const angle = extractAngle(raw);
  if (angle == null) return null;
  if (!/(поверн|розверн|оберн|крут|крутань|перекрут|прокрут|завал|rotate|градус|°)/u.test(raw)) return null;
  const signed = /(вліво|ліворуч|наліво|ccw|counter\s*clockwise)/u.test(raw) ? -Math.abs(angle) : Math.abs(angle);
  return {
    type: 'rotation',
    mode: 'absolute',
    degrees: signed,
    raw: `${signed}deg`,
    confidence: 0.93,
  };
}

function resolveFlipValue(text){
  const raw = String(text || '');
  if (!/(віддзеркал|дзеркал|дзеркально|mirror|flip|фліпни|відобраз)/u.test(raw)) return null;
  if (/(горизонтал|зліва\s+направо|справа\s+наліво)/u.test(raw)) {
    return {
      type: 'flip',
      axis: 'x',
      raw: 'horizontal',
      confidence: 0.93,
    };
  }
  if (/(вертикал|зверху\s+вниз|знизу\s+вгору|знизу\s+вверх)/u.test(raw)) {
    return {
      type: 'flip',
      axis: 'y',
      raw: 'vertical',
      confidence: 0.93,
    };
  }
  return null;
}

function resolveOffsetValue(text){
  const raw = String(text || '');
  if (!/(посунь|пересунь|підсунь|зсунь|сунь|підвинь|кинь|move)/u.test(raw)) return null;
  let axis = null;
  let direction = null;
  if (/(правіше|вправо|праворуч|правий\s+бік)/u.test(raw)) {
    axis = 'x';
    direction = 'right';
  } else if (/(лівіше|вліво|ліворуч|лівий\s+бік|наліво)/u.test(raw)) {
    axis = 'x';
    direction = 'left';
  } else if (/(вище|вгору|догори|вверх)/u.test(raw)) {
    axis = 'y';
    direction = 'up';
  } else if (/(нижче|вниз|донизу)/u.test(raw)) {
    axis = 'y';
    direction = 'down';
  }
  if (!axis || !direction) return null;
  const numeric = raw.match(/(\d+(?:[.,]\d+)?)\s*(px|rem|em|%)/iu);
  if (numeric) {
    const value = Number(String(numeric[1]).replace(',', '.'));
    const unit = numeric[2] || 'px';
    return {
      type: 'offset',
      axis,
      direction,
      value,
      unit,
      raw: `${direction} ${value}${unit}`,
      confidence: 0.92,
    };
  }
  return {
    type: 'offset',
    axis,
    direction,
    amount: /(чуть|трохи|трішки)/u.test(raw) ? 'small' : 'auto',
    raw: /(чуть|трохи|трішки)/u.test(raw) ? `${direction} small` : direction,
    confidence: 0.88,
  };
}


function resolveSizeKeywordValue(text){
  const raw = String(text || '');
  if (/(на\s+всю\s+ширин|на\s+повну\s+ширин|на\s+увесь\s+екран|на\s+весь\s+екран|full\s*width)/u.test(raw)) {
    return { type: 'size_keyword', keyword: 'full_width', raw: 'full width', confidence: 0.93 };
  }
  if (/(на\s+всю\s+висот|на\s+повну\s+висот|full\s*height)/u.test(raw)) {
    return { type: 'size_keyword', keyword: 'full_height', raw: 'full height', confidence: 0.93 };
  }
  if (/(^|\s)(авто|auto)(?=$|\s|[,:;])/u.test(raw)) {
    return { type: 'size_keyword', keyword: 'auto', raw: 'auto', confidence: 0.89 };
  }
  return null;
}


function resolveTextCaseValue(text){
  const raw = String(text || '');
  if (/(великими\s+літерами|uppercase|капсом|капс|усі\s+великі)/u.test(raw)) {
    return { type: 'text_case', keyword: 'uppercase', raw: 'uppercase', confidence: 0.92 };
  }
  if (/(маленькими\s+літерами|lowercase|нижнім\s+регістром)/u.test(raw)) {
    return { type: 'text_case', keyword: 'lowercase', raw: 'lowercase', confidence: 0.92 };
  }
  return null;
}

function resolveFontWeightValue(text){
  const raw = String(text || '');
  if (/(жирнішим|жирніший|жирним|жирний|bold)/u.test(raw)) {
    return { type: 'font_weight', keyword: 'bold', raw: 'bold', confidence: 0.9 };
  }
  if (/(тоншим|тонший|тонким|тонкий|light)/u.test(raw)) {
    return { type: 'font_weight', keyword: 'light', raw: 'light', confidence: 0.9 };
  }
  return null;
}

function resolveAlignKeywordValue(text, positionHits){
  const raw = String(text || '');
  if (/(по\s+ширині|ширин[аії])/u.test(raw) && /(стисни|звузь|розшир|збільш|зменш|width|ширше|вужче)/u.test(raw) && !/(текст|абзац|заголовок|text)/u.test(raw)) return null;
  if (!/(вирівн|відцентруй|притисни|прижми|розмісти|align|justify|по\s+центру|по\s+ширині|посередині|в\s+центр|у\s+центр|правого\s+краю|лівого\s+краю)/u.test(raw)) return null;
  const ids = (Array.isArray(positionHits) ? positionHits : []).map((item) => item.id);
  let keyword = ids.find((item) => ['left', 'right', 'center', 'top', 'bottom'].includes(item)) || null;
  if (!keyword && /(по\s+ширині|justify)/u.test(raw)) keyword = 'justify';
  if (!keyword && /(?:відцентруй|центруй|по\s+центру|посередині|в\s+центр|у\s+центр)/u.test(raw)) keyword = 'center';
  if (!keyword && /^вирівняй\s+(?:блок|контейнер|секція|елемент)$/u.test(raw)) keyword = 'center';
  if (!keyword && /(правого\s+краю|правому\s+краю|справа)/u.test(raw)) keyword = 'right';
  if (!keyword && /(лівого\s+краю|лівому\s+краю|зліва)/u.test(raw)) keyword = 'left';
  if (!keyword && /(верхнього\s+краю|зверху)/u.test(raw)) keyword = 'top';
  if (!keyword && /(нижнього\s+краю|знизу)/u.test(raw)) keyword = 'bottom';
  if (!keyword) return null;
  return {
    type: 'position_keyword',
    keyword,
    axis: ['top', 'bottom'].includes(keyword) ? 'y' : 'x',
    raw: keyword,
    confidence: 0.9,
  };
}

function resolveKeywordValues(text, synonyms){
  const groups = [];
  const valueGroups = ['sizes', 'weights', 'effects'];
  for (const groupName of valueGroups) {
    for (const item of (Array.isArray(synonyms?.values?.[groupName]) ? synonyms.values[groupName] : [])) {
      const hits = findAliasMatches(text, [item.label, ...(item.aliases || [])], 0.78);
      for (const hit of hits) {
        groups.push({
          id: item.normalizedTo || item.id,
          group: groupName,
          alias: hit.alias,
          confidence: hit.confidence,
          index: hit.index,
        });
      }
    }
  }
  groups.sort((a, b) => b.confidence - a.confidence || a.index - b.index);
  return groups;
}

export async function resolveCommandValue(ctx){
  const [colorManifest, gradientRules, synonyms, valueManifest] = await Promise.all([
    loadAiCommandData('color-manifest.json'),
    loadAiCommandData('gradient-rules.json'),
    loadAiCommandData('term-synonyms.json'),
    loadAiCommandData('value-manifest.json'),
  ]);

  const text = normalizeSpaces(String(ctx?.normalizedText || ''));
  const colorEntries = buildColorEntries(colorManifest, synonyms);
  const colorHits = extractColors(text, colorEntries);
  const directionMatchers = buildDirectionMatchers(synonyms, gradientRules);
  const direction = resolveDirection(text, directionMatchers);
  const explicitAngle = extractAngle(text);
  const positionMatchers = buildPositionMatchers(synonyms);
  const positionHits = resolvePositions(text, positionMatchers);
  const gradientStops = buildGradientStops(text, colorHits, positionHits);
  const shareAdjustment = detectGradientShareAdjustment(text, colorHits);
  const iconName = resolveIconName(text);
  const numberHits = extractNumbers(text);
  const opacityKeyword = resolveOpacityKeyword(text);
  const opacityAdjustment = resolveOpacityAdjustment(text, numberHits);
  const relativeColor = resolveRelativeColorValue(text);
  const shadowValue = resolveShadowValue(text, colorHits);
  const spacingValue = resolveSpacingValue(text, numberHits);
  const borderStyleValue = resolveBorderStyleValue(text);
  const visibilityValue = resolveVisibilityValue(text);
  const blurValue = resolveBlurValue(text, numberHits);
  const columnCountValue = resolveColumnCountValue(text, numberHits);
  const rotationValue = resolveRotationValue(text);
  const flipValue = resolveFlipValue(text);
  const offsetValue = resolveOffsetValue(text);
  const alignKeywordValue = resolveAlignKeywordValue(text, positionHits);
  const textCaseValue = resolveTextCaseValue(text);
  const fontWeightValue = resolveFontWeightValue(text);
  const sizeKeywordValue = resolveSizeKeywordValue(text);
  const keywordHits = resolveKeywordValues(text, synonyms);
  const mentionsGradient = /(градієнт|gradient)/u.test(text);

  let primaryType = 'none';
  let value = null;
  let confidence = 0;

  if (shareAdjustment) {
    primaryType = 'gradient_adjustment';
    value = { ...shareAdjustment, raw: `${shareAdjustment.colorIds.join(', ')} ${shareAdjustment.deltaPercent}%` };
    confidence = shareAdjustment.confidence;
  } else if (iconName) {
    primaryType = 'icon_name';
    value = iconName;
    confidence = iconName.confidence;
  } else if (opacityKeyword) {
    primaryType = 'keyword_opacity';
    value = opacityKeyword;
    confidence = opacityKeyword.confidence;
  } else if (opacityAdjustment) {
    primaryType = 'opacity_adjustment';
    value = opacityAdjustment;
    confidence = opacityAdjustment.confidence;
  } else if (relativeColor) {
    primaryType = 'relative_color';
    value = relativeColor;
    confidence = relativeColor.confidence;
  } else if (rotationValue) {
    primaryType = 'rotation';
    value = rotationValue;
    confidence = rotationValue.confidence;
  } else if (flipValue) {
    primaryType = 'flip';
    value = flipValue;
    confidence = flipValue.confidence;
  } else if (offsetValue) {
    primaryType = 'offset';
    value = offsetValue;
    confidence = offsetValue.confidence;
  } else if (shadowValue) {
    primaryType = 'shadow';
    value = shadowValue;
    confidence = shadowValue.confidence;
  } else if (spacingValue) {
    primaryType = 'spacing';
    value = spacingValue;
    confidence = spacingValue.confidence;
  } else if (borderStyleValue) {
    primaryType = 'border_style';
    value = borderStyleValue;
    confidence = borderStyleValue.confidence;
  } else if (visibilityValue) {
    primaryType = 'visibility';
    value = visibilityValue;
    confidence = visibilityValue.confidence;
  } else if (blurValue) {
    primaryType = 'blur';
    value = blurValue;
    confidence = blurValue.confidence;
  } else if (columnCountValue) {
    primaryType = 'number';
    value = columnCountValue;
    confidence = columnCountValue.confidence;
  } else if ((ctx?.previousPropertyId === 'background_gradient') && (explicitAngle != null || direction.primary) && !mentionsGradient && colorHits.length === 0) {
    primaryType = 'gradient';
    value = {
      type: 'gradient',
      colors: [],
      stops: [],
      angle: explicitAngle ?? direction.angle ?? 180,
      direction: direction.primary?.id || null,
      explicitAngle: explicitAngle != null,
      raw: explicitAngle != null ? `${explicitAngle}deg` : (direction.primary?.id || 'gradient angle'),
    };
    confidence = 0.9;
  } else if (mentionsGradient || colorHits.length >= 2 || gradientStops.length >= 2) {
    primaryType = 'gradient';
    const angle = explicitAngle ?? direction.angle ?? 180;
    value = {
      type: 'gradient',
      colors: uniqueStrings(colorHits.map((item) => item.hex)),
      stops: gradientStops.length ? gradientStops : uniqueStrings(colorHits.map((item) => item.hex)),
      angle,
      direction: direction.primary?.id || null,
      explicitAngle: explicitAngle != null,
    };
    confidence = explicitAngle != null || direction.primary ? 0.94 : 0.86;
  } else if (alignKeywordValue) {
    primaryType = 'position_keyword';
    value = alignKeywordValue;
    confidence = alignKeywordValue.confidence;
  } else if (textCaseValue) {
    primaryType = 'text_case';
    value = textCaseValue;
    confidence = textCaseValue.confidence;
  } else if (fontWeightValue) {
    primaryType = 'font_weight';
    value = fontWeightValue;
    confidence = fontWeightValue.confidence;
  } else if (sizeKeywordValue) {
    primaryType = 'size_keyword';
    value = sizeKeywordValue;
    confidence = sizeKeywordValue.confidence;
  } else if (colorHits.length >= 1) {
    primaryType = 'color';
    value = {
      type: 'color',
      colorId: colorHits[0].id,
      hex: colorHits[0].hex,
      label: colorHits[0].label,
      raw: colorHits[0].id,
    };
    confidence = colorHits[0].confidence;
  } else if (numberHits.length >= 1 && (/(прозор|opacity|відсот)/u.test(text) || (ctx?.action?.primary?.id || '') === 'set_opacity')) {
    primaryType = 'number';
    const unit = numberHits[0].unit || '%';
    value = {
      type: 'number',
      value: numberHits[0].value,
      unit,
      raw: `${numberHits[0].value}${unit || ''}`,
    };
    confidence = 0.9;
  } else if (keywordHits.length >= 1) {
    primaryType = keywordHits[0].group === 'sizes' ? 'keyword_size' : keywordHits[0].group === 'weights' ? 'font_weight' : 'effect';
    value = {
      type: keywordHits[0].group,
      keyword: keywordHits[0].id,
    };
    confidence = keywordHits[0].confidence;
  } else if (numberHits.length >= 1) {
    primaryType = 'number';
    const unit = numberHits[0].unit || (Array.isArray(valueManifest) ? valueManifest.find((item) => item.id === 'length_value')?.defaultUnit : null) || null;
    value = {
      type: 'number',
      value: numberHits[0].value,
      unit,
      raw: `${numberHits[0].value}${unit || ''}`,
    };
    confidence = 0.88;
  }

  return {
    primaryType,
    value,
    confidence,
    colors: colorHits,
    direction,
    explicitAngle,
    positions: positionHits,
    numbers: numberHits,
    keywords: keywordHits,
    shareAdjustment,
    sizeKeywordValue,
  };
}
