import { normalizeSpaces, splitTokens } from './command-utils.js';

export function tokenizeCommandText(input){
  const normalizedText = typeof input === 'string'
    ? normalizeSpaces(input)
    : normalizeSpaces(input?.normalizedText || '');

  const rawTokens = splitTokens(normalizedText);
  const tokens = rawTokens.map((value, index) => ({
    index,
    value,
    lower: String(value || '').toLowerCase(),
    type: value.startsWith('#') ? 'hex' : (/^\d/.test(value) ? 'numberish' : 'word'),
  }));

  const phrases = [];
  for (let size = 2; size <= 4; size += 1) {
    for (let i = 0; i <= tokens.length - size; i += 1) {
      const slice = tokens.slice(i, i + size);
      phrases.push({
        start: i,
        end: i + size - 1,
        size,
        text: slice.map((item) => item.lower).join(' '),
      });
    }
  }

  const quoted = [];
  const rawText = typeof input === 'string' ? String(input || '') : String(input?.originalText || normalizedText);
  const quoteRe = /["“”«](.+?)["“”»]/g;
  let m;
  while ((m = quoteRe.exec(rawText))) {
    quoted.push({ text: String(m[1] || '').trim(), index: Number(m.index) || 0 });
  }

  return {
    normalizedText,
    tokens,
    phrases,
    quoted,
  };
}
