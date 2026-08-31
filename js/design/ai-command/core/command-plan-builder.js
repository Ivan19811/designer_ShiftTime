import { loadAiCommandData } from './manifest-loader.js';
import { normalizeSpaces, uniqueStrings } from './command-utils.js';

function looksLikeNewAction(text, actionAliases){
  const safe = String(text || '').trim().toLowerCase();
  if (!safe) return false;
  return actionAliases.some((alias) => safe.startsWith(`${alias.toLowerCase()} `) || safe === alias.toLowerCase());
}

function escapeForRegex(value){
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}


const COMPOSITE_COLOR_RE = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b|(?:синій|синя|синю|синім|синьою|синьо|блакитн[\p{L}_-]*|blue|жовт[\p{L}_-]*|золот[\p{L}_-]*|yellow|червон[\p{L}_-]*|red|зелен[\p{L}_-]*|green|чорн[\p{L}_-]*|black|біл[\p{L}_-]*|білий|білу|білим|white|сір[\p{L}_-]*|gray|grey|фіолет[\p{L}_-]*|purple|помаранч[\p{L}_-]*|оранж[\p{L}_-]*|orange|рожев[\p{L}_-]*|pink|бірюз[\p{L}_-]*|cyan|коричнев[\p{L}_-]*|brown)/giu;

function findCompositeTarget(text){
  const raw = String(text || '');
  const rules = [
    { re: /(кнопк[\p{L}_-]*|button)/u, word: 'кнопку' },
    { re: /(секц[\p{L}_-]*|section)/u, word: 'секцію' },
    { re: /(контейнер[\p{L}_-]*|container)/u, word: 'контейнер' },
    { re: /(блок[\p{L}_-]*|block)/u, word: 'блок' },
    { re: /(ряд[\p{L}_-]*|row)/u, word: 'ряд' },
    { re: /(шапк[\p{L}_-]*|header)/u, word: 'шапку' },
    { re: /(футер[\p{L}_-]*|footer)/u, word: 'футер' },
  ];
  for (const rule of rules) {
    const m = raw.match(rule.re);
    if (m) return { word: rule.word, index: m.index || 0, end: (m.index || 0) + String(m[0] || '').length };
  }
  return null;
}

function collectCompositeColorHits(text){
  const out = [];
  const raw = String(text || '');
  let m;
  COMPOSITE_COLOR_RE.lastIndex = 0;
  while ((m = COMPOSITE_COLOR_RE.exec(raw))) {
    out.push({ text: m[0], index: m.index || 0, end: (m.index || 0) + String(m[0] || '').length });
  }
  return out;
}

function hasCompositePropertyKeyword(value){
  return /(текст|напис|label|рамк|бордер|border|контур|обводк|тінь|тінню|shadow|glow|радіус|скругл|radius)/u.test(String(value || ''));
}

function nearestCompositePropertyKind(raw, hit, from, to){
  const windowText = raw.slice(from, to);
  const rules = [
    { kind: 'text', re: /(текст|напис|label)/giu },
    { kind: 'border', re: /(рамк[\p{L}_-]*|бордер[\p{L}_-]*|border|контур|обводк[\p{L}_-]*)/giu },
    { kind: 'shadow', re: /(тінь|тінню|тіні|shadow|glow)/giu },
  ];
  let best = null;
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(windowText))) {
      const start = from + (m.index || 0);
      const end = start + String(m[0] || '').length;
      const direction = start >= hit.end ? 'after' : (end <= hit.index ? 'before' : 'inside');
      const distance = end <= hit.index ? (hit.index - end) : (start >= hit.end ? (start - hit.end) : 0);
      if (!best || distance < best.distance || (distance === best.distance && direction === 'after' && best.direction !== 'after')) {
        best = { kind: rule.kind, distance, direction };
      }
    }
  }
  return best && best.distance <= 34 ? best.kind : null;
}

function classifyCompositeColor(text, hit, prevColorEnd, nextColorIndex, target){
  const raw = String(text || '');
  const from = Math.max(0, prevColorEnd || 0);
  const to = Math.min(raw.length, nextColorIndex || raw.length);
  const localKind = nearestCompositePropertyKind(raw, hit, from, to);
  if (localKind) return localKind;

  if (target) {
    const between = hit.index <= target.index
      ? raw.slice(hit.end, target.index)
      : raw.slice(target.end, hit.index);
    if (Math.abs(hit.index - target.index) <= 42 && !hasCompositePropertyKeyword(between)) return 'background';
  }
  return null;
}

function pushCompositeSegment(out, seen, text){
  const safe = normalizeSpaces(text);
  if (!safe || seen.has(safe)) return;
  seen.add(safe);
  out.push(safe);
}

function buildCompositeStylePlan(text){
  const raw = normalizeSpaces(String(text || '').toLowerCase());
  if (!raw) return null;
  if (/(градієнт|gradient)/u.test(raw)) return null;

  const target = findCompositeTarget(raw);
  if (!target) return null;

  const colorHits = collectCompositeColorHits(raw);
  const hasMultipleStyleWords = /(текст|напис|label)/u.test(raw) || /(рамк|бордер|border|контур|обводк)/u.test(raw) || /(тінь|тінню|shadow|glow)/u.test(raw) || /(радіус|скругл|radius)/u.test(raw);
  if (colorHits.length < 2 && !hasMultipleStyleWords) return null;

  const out = [];
  const seen = new Set();

  for (let i = 0; i < colorHits.length; i += 1) {
    const hit = colorHits[i];
    const prevColorEnd = i > 0 ? colorHits[i - 1].end : 0;
    const nextColorIndex = colorHits[i + 1]?.index ?? raw.length;
    const kind = classifyCompositeColor(raw, hit, prevColorEnd, nextColorIndex, target);
    if (kind === 'text') {
      const textTarget = /^(блок|контейнер|секцію|ряд|шапку|футер)$/u.test(target.word) ? 'текст' : target.word;
      pushCompositeSegment(out, seen, textTarget === 'текст' ? `зроби текст ${hit.text}` : `зроби ${target.word} ${hit.text} текст`);
    } else if (kind === 'border') {
      pushCompositeSegment(out, seen, `зроби ${target.word} ${hit.text} рамка`);
    } else if (kind === 'shadow') {
      pushCompositeSegment(out, seen, `зроби ${target.word} ${hit.text} тінь`);
    } else if (kind === 'background') {
      pushCompositeSegment(out, seen, `зроби ${target.word} ${hit.text}`);
    }
  }

  let borderWidth = null;
  const borderMatch = raw.match(/(?:рамк[\p{L}_-]*|бордер[\p{L}_-]*|border)/u);
  if (borderMatch) {
    const start = (borderMatch.index || 0) + String(borderMatch[0] || '').length;
    const rest = raw.slice(start);
    const nextProp = rest.search(/(?:тінь|тінню|shadow|glow|радіус|скругл|radius|текст|напис|label)/u);
    const borderSlice = rest.slice(0, nextProp >= 0 ? nextProp : Math.min(rest.length, 36));
    borderWidth = borderSlice.match(/(\d+(?:[.,]\d+)?)\s*(?:px|піксел[\p{L}_-]*)?/u);
  }
  if (borderWidth) pushCompositeSegment(out, seen, `зроби ${target.word} рамка ${String(borderWidth[1]).replace(',', '.')} px`);

  const radiusWidth = raw.match(/(?:радіус|скругл[\p{L}_-]*|radius)[\s\S]{0,24}?(\d+(?:[.,]\d+)?)\s*(?:px|піксел[\p{L}_-]*)?/u);
  if (radiusWidth) pushCompositeSegment(out, seen, `зроби ${target.word} радіус ${String(radiusWidth[1]).replace(',', '.')} px`);

  const hasSoftShadow = /(легк|легоньк|легеньк|м[’'\s]?як|soft)/u.test(raw) && /(тінь|тінню|shadow|glow)/u.test(raw);
  if (hasSoftShadow && !out.some((item) => /(тінь|shadow)/u.test(item))) {
    pushCompositeSegment(out, seen, `додай легка тінь ${target.word}`);
  }

  return out.length >= 2 ? out.map((textItem, index) => ({ index, text: textItem })) : null;
}

export async function buildCommandPlan(normalized, options = {}){
  const synonyms = await loadAiCommandData('term-synonyms.json');
  const hardcodedActionAliases = ['посунь','пересунь','підсунь','зсунь','сунь','підвинь','кинь','поверни','розверни','оберни','крути','крутань','перекрути','прокрути','завали','віддзеркаль','дзеркаль','відобрази','фліпни','притисни','прижми','вирівняй','відцентруй','зроби','збільш','зменш','розтягни','розшир','стисни','звузь','додай'];
  const actionAliases = uniqueStrings([
    ...(Array.isArray(synonyms?.actions) ? synonyms.actions : []).flatMap((item) => [item.label, ...(item.aliases || [])]),
    ...hardcodedActionAliases,
  ]);
  let text = normalizeSpaces(typeof normalized === 'string' ? normalized : normalized?.normalizedText || '');
  if (!text) return [];

  const compositePlan = buildCompositeStylePlan(text);
  if (compositePlan && compositePlan.length) return compositePlan;

  const aliasPattern = uniqueStrings(actionAliases)
    .sort((a, b) => b.length - a.length)
    .map((alias) => escapeForRegex(alias))
    .join('|');

  if (aliasPattern) {
    const bridgeRe = /(?:^|\s)(?:і|та|а|також|потім|далі|який|й)\s+(?=(?:зафарбуй|залий|зроби|додай|зменш|збільш|поверни|розверни|оберни|крути|крутань|перекрути|прокрути|завали|посунь|пересунь|підсунь|зсунь|сунь|підвинь|кинь|віддзеркаль|дзеркаль|відобрази|фліпни|притисни|прижми|вирівняй|відцентруй|розтягни|розшир|стисни|звузь)(?:$|\s))/giu;
    const measureRe = /(?<=(?:градусів|градуси|градуса|deg|°|px|rem|em|%|відсотків|відсотка|відсоток))\s+(?=(?:зафарбуй|залий|зроби|додай|зменш|збільш|поверни|розверни|оберни|крути|крутань|перекрути|прокрути|завали|посунь|пересунь|підсунь|зсунь|сунь|підвинь|кинь|віддзеркаль|дзеркаль|відобрази|фліпни|притисни|прижми|вирівняй|відцентруй|розтягни|розшир|стисни|звузь)(?:$|\s))/giu;
    text = text.replace(/[.]+/g, '; ').replace(bridgeRe, '; ').replace(measureRe, '; ');
  }

  const rawChunks = text.split(/\s*([,;.])\s*/u).reduce((acc, part) => {
    if (!part || part === ',' || part === ';' || part === '.') return acc;
    acc.push(part);
    return acc;
  }, []);

  const commands = [];
  for (const chunk of rawChunks) {
    const safe = normalizeSpaces(chunk);
    if (!safe) continue;
    if (!commands.length) {
      commands.push(safe);
      continue;
    }
    if (looksLikeNewAction(safe, actionAliases)) {
      commands.push(safe);
    } else {
      commands[commands.length - 1] = normalizeSpaces(`${commands[commands.length - 1]} ${safe}`);
    }
  }

  const propertyStarters = [
    /^(ширин[\p{L}_-]*|width)(?=$|\s)/u,
    /^(висот[\p{L}_-]*|height)(?=$|\s)/u,
    /^(padding|margin|gap)(?=$|\s)/u,
    /^(фон|background|текст|text|іконк[\p{L}_-]*|icon|рамк[\p{L}_-]*|border|тін[\p{L}_-]*|shadow|прозор[\p{L}_-]*|opacity)(?=$|\s)/u,
  ];

  const merged = [];
  for (const item of commands) {
    const parts = item.split(/\s+(?:а|та|і|й|також|плюс|ще|далі|потім)\s+/u);
    if (parts.length === 1) {
      merged.push(item);
      continue;
    }
    let current = normalizeSpaces(parts[0]);
    for (let i = 1; i < parts.length; i += 1) {
      const next = normalizeSpaces(parts[i]);
      const startsProperty = propertyStarters.some((re) => re.test(next));
      if (looksLikeNewAction(next, actionAliases) || startsProperty) {
        merged.push(current);
        current = next;
      } else {
        current = normalizeSpaces(`${current} і ${next}`);
      }
    }
    if (current) merged.push(current);
  }

  return merged.map((textItem, index) => ({ index, text: textItem }));
}
