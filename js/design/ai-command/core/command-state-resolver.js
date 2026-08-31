import { loadAiCommandData } from './manifest-loader.js';
import { dedupeBy, scoreEntityMatch } from './command-utils.js';

function isExplicitInteractiveStateContext(text){
  const raw = String(text || '');
  return /(на\s+active|для\s+active|у\s+active\s+стані|в\s+active\s+стані|active\s+state|у\s+активному\s+стані|в\s+активному\s+стані|активного\s+стану|на\s+ховер|при\s+наведенні|hover|default\s+state|звичайному\s+стані|відкритому\s+стані|open\s+state)/u.test(raw);
}

function looksLikeSelectedContext(text){
  const raw = String(text || '');
  return /(^|\s)(активний|активного|активне|активному|активна)(?=\s+(елемент|блок|меню|контейнер|секці|кнопк|іконк|текст|заголовок|пункт\s+меню)|$)/u.test(raw);
}

export async function resolveCommandState(ctx){
  const synonyms = await loadAiCommandData('term-synonyms.json');
  const text = String(ctx?.normalizedText || '');
  const hits = [];
  const explicitStateContext = isExplicitInteractiveStateContext(text);
  const selectedContext = looksLikeSelectedContext(text);
  for (const item of (Array.isArray(synonyms?.states) ? synonyms.states : [])) {
    const normalizedId = item.normalizedTo || item.id;
    if (!explicitStateContext) {
      if (normalizedId === 'active') continue;
      if (normalizedId === 'current' && /активн/u.test(text)) continue;
    }
    if (selectedContext && !explicitStateContext && (normalizedId === 'active' || normalizedId === 'current')) continue;
    const scored = scoreEntityMatch(text, [item.label, ...(item.aliases || [])], 0.02);
    if (!scored.matches.length) continue;
    hits.push({
      id: normalizedId,
      label: item.label,
      confidence: scored.confidence,
      score: scored.score,
      matches: scored.matches,
    });
  }
  const unique = dedupeBy(hits.sort((a, b) => b.score - a.score), (item) => item.id);
  const primary = unique[0] || { id: 'default', label: 'Звичайний стан', confidence: 0.7, score: 70, matches: [] };
  return { primary, hits: unique, confidence: primary.confidence || 0.7 };
}
