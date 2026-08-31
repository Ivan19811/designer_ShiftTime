import { loadAiCommandData } from './manifest-loader.js';
import { normalizeSpaces, escapeRegExp, splitTokens } from './command-utils.js';

function replaceInsensitive(text, from, to){
  const safeFrom = escapeRegExp(from).replace(/\s+/g, '\\s+');
  const re = new RegExp(`(^|[^\\p{L}\\p{N}_-])${safeFrom}(?=$|[^\\p{L}\\p{N}_-])`, 'giu');
  return text.replace(re, (full, lead) => `${lead}${to}`);
}

export async function normalizeCommandText(input, options = {}){
  const [phraseMap, typoMap, noiseWords, wordForms] = await Promise.all([
    loadAiCommandData('phrase-normalization.json'),
    loadAiCommandData('common-typos.json'),
    loadAiCommandData('noise-words.json'),
    loadAiCommandData('term-wordforms.json'),
  ]);

  const originalText = String(input || '');
  let text = normalizeSpaces(originalText.toLowerCase())
    .replace(/[“”«»]/g, '"')
    .replace(/[’']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s*([,;:])\s*/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();

  const phraseCorrections = [];
  const rules = Array.isArray(phraseMap?.rules) ? [...phraseMap.rules].sort((a, b) => String(b.from || '').length - String(a.from || '').length) : [];
  for (const rule of rules) {
    const from = String(rule?.from || '').trim().toLowerCase();
    const to = String(rule?.to || '').trim().toLowerCase();
    if (!from || !to || from === to || !text.includes(from)) continue;
    const next = replaceInsensitive(text, from, to);
    if (next !== text) {
      phraseCorrections.push({ from, to, type: rule?.type || 'exact_phrase' });
      text = normalizeSpaces(next);
    }
  }

  const removedNoise = [];
  for (const entry of (Array.isArray(noiseWords?.ignore) ? noiseWords.ignore : [])) {
    const phrase = String(entry || '').trim().toLowerCase();
    if (!phrase) continue;
    const next = replaceInsensitive(text, phrase, ' ');
    if (next !== text) {
      removedNoise.push(phrase);
      text = normalizeSpaces(next);
    }
  }

  const typoEntries = Array.isArray(typoMap?.entries) ? typoMap.entries : [];
  const typoByWrong = new Map(typoEntries.map((item) => [String(item?.wrong || '').toLowerCase(), item]));
  const typoCorrections = [];
  let tokens = splitTokens(text);
  tokens = tokens.map((token) => {
    const exact = typoByWrong.get(String(token).toLowerCase());
    if (!exact) return token;
    const corrected = String(exact.correct || token).toLowerCase();
    typoCorrections.push({ wrong: token, correct: corrected, confidence: Number(exact.confidence || 0.8) });
    return corrected;
  });
  text = normalizeSpaces(tokens.join(' '));

  const wordFormHits = [];
  const formToBase = new Map();
  for (const group of (Array.isArray(wordForms?.groups) ? wordForms.groups : [])) {
    const base = String(group?.base || '').trim().toLowerCase();
    if (!base || /\s/u.test(base)) continue;
    for (const form of (Array.isArray(group?.forms) ? group.forms : [])) {
      const safe = String(form || '').trim().toLowerCase();
      if (safe) formToBase.set(safe, base);
    }
  }

  tokens = splitTokens(text).map((token) => {
    const base = formToBase.get(String(token).toLowerCase());
    if (!base || base === token) return token;
    wordFormHits.push({ from: token, to: base });
    return base;
  });
  text = normalizeSpaces(tokens.join(' '));

  if (options.keepPunctuation !== true) {
    text = text.replace(/\s*([,;:])\s*/g, ' $1 ').replace(/\s+/g, ' ').trim();
  }

  return {
    ok: true,
    originalText,
    normalizedText: text,
    tokens: splitTokens(text),
    phraseCorrections,
    typoCorrections,
    removedNoise,
    wordFormHits,
  };
}
