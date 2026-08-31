export function normalizeSpaces(value){
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function escapeRegExp(value){
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function dedupeBy(list, getKey){
  const out = [];
  const seen = new Set();
  for (const item of (Array.isArray(list) ? list : [])) {
    const key = String(getKey(item));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function averageConfidence(values, fallback = 0){
  const nums = (Array.isArray(values) ? values : []).map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return fallback;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(3));
}

export function clamp(value, min, max){
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function makeWordBoundaryRegex(term, flags = 'iu'){
  const safe = escapeRegExp(term).replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^\\p{L}\\p{N}_-])(${safe})(?=$|[^\\p{L}\\p{N}_-])`, flags);
}

export function findAliasMatches(text, aliases, baseScore = 0.72){
  const safeText = String(text || '');
  const out = [];
  const uniq = Array.from(new Set((Array.isArray(aliases) ? aliases : []).map((v) => String(v || '').trim()).filter(Boolean)));
  for (const alias of uniq) {
    const regex = makeWordBoundaryRegex(alias, 'giu');
    let hit = false;
    let m;
    while ((m = regex.exec(safeText))) {
      hit = true;
      const phraseBoost = alias.includes(' ') ? 0.08 : 0;
      const lengthBoost = Math.min(0.12, alias.length / 100);
      out.push({
        alias,
        index: Number(m.index) || 0,
        length: alias.length,
        confidence: Number(Math.min(0.99, baseScore + phraseBoost + lengthBoost).toFixed(3)),
      });
      if (!regex.global) break;
    }
    if (!hit && safeText === alias) {
      out.push({ alias, index: 0, length: alias.length, confidence: 0.98 });
    }
  }
  return out.sort((a, b) => (a.index - b.index) || (b.length - a.length));
}

export function scoreEntityMatch(text, aliases, explicitBoost = 0){
  const matches = findAliasMatches(text, aliases, 0.74);
  if (!matches.length) {
    return { matches: [], confidence: 0, score: 0 };
  }
  const confidence = Math.min(0.99, Math.max(...matches.map((m) => m.confidence)) + explicitBoost);
  const score = confidence * 100 + Math.max(...matches.map((m) => m.length));
  return { matches, confidence: Number(confidence.toFixed(3)), score: Number(score.toFixed(3)) };
}

export function toHex6(value){
  const raw = String(value || '').trim();
  const m = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return '';
  const hex = m[1].toLowerCase();
  if (hex.length === 6) return `#${hex}`;
  return '#' + hex.split('').map((ch) => ch + ch).join('');
}

export function parseAngle(value, fallback = 180){
  if (typeof value === 'number' && Number.isFinite(value)) return normalizeAngle(value);
  const m = String(value || '').match(/(-?\d{1,3}(?:\.\d+)?)\s*(?:deg|°|градус(?:ів|а|ов)?|градуси)?/i);
  return m ? normalizeAngle(Number(m[1])) : normalizeAngle(fallback);
}

export function normalizeAngle(value){
  const n = Number(value);
  if (!Number.isFinite(n)) return 180;
  const mod = ((n % 360) + 360) % 360;
  return Math.round(mod);
}

export function splitTokens(text){
  return String(text || '').match(/#[0-9a-f]{3,6}\b|\d+(?:[.,]\d+)?%|\d+(?:[.,]\d+)?(?:px|rem|em|deg|°)|[\p{L}\p{N}_-]+/giu) || [];
}

export function uniqueStrings(list){
  return Array.from(new Set((Array.isArray(list) ? list : []).map((v) => String(v || '').trim()).filter(Boolean)));
}
