import { loadAiCommandData } from './manifest-loader.js';
import { dedupeBy, scoreEntityMatch } from './command-utils.js';

export async function resolveCommandResponsive(ctx){
  const synonyms = await loadAiCommandData('term-synonyms.json');
  const text = String(ctx?.normalizedText || '');
  const hits = [];
  for (const item of (Array.isArray(synonyms?.responsive) ? synonyms.responsive : [])) {
    const scored = scoreEntityMatch(text, [item.label, ...(item.aliases || [])], 0.02);
    if (!scored.matches.length) continue;
    hits.push({
      id: item.normalizedTo || item.id,
      label: item.label,
      confidence: scored.confidence,
      score: scored.score,
      matches: scored.matches,
    });
  }
  const unique = dedupeBy(hits.sort((a, b) => b.score - a.score), (item) => item.id);
  const primary = unique[0] || { id: 'all', label: 'Усі пристрої', confidence: 0.7, score: 70, matches: [] };
  return { primary, hits: unique, confidence: primary.confidence || 0.7 };
}
