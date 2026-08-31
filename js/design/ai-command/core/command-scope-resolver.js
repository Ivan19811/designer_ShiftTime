import { loadAiCommandData } from './manifest-loader.js';
import { dedupeBy, scoreEntityMatch } from './command-utils.js';

export async function resolveCommandScope(ctx){
  const [scopeRules, synonyms] = await Promise.all([
    loadAiCommandData('scope-rules.json'),
    loadAiCommandData('term-synonyms.json'),
  ]);
  const text = String(ctx?.normalizedText || '');
  const hits = [];
  if (/(^|\s)(активний|активного|активне|активному|активна)(?=\s+(елемент|блок|меню|контейнер|секці|кнопк|іконк|текст|заголовок|пункт\s+меню)|$)/u.test(text) || /(^|\s)активний(?=$|\s)/u.test(text)) {
    hits.push({
      id: 'selected_element',
      label: 'Поточне виділення',
      selectorMode: 'current_selection',
      confidence: 0.96,
      score: 340,
      matches: [],
    });
  }


  for (const item of (Array.isArray(scopeRules) ? scopeRules : [])) {
    const scored = scoreEntityMatch(text, [item.label, ...(item.aliases || [])]);
    if (!scored.matches.length) continue;
    hits.push({
      id: item.id,
      label: item.label,
      selectorMode: item.selectorMode,
      confidence: scored.confidence,
      score: scored.score + Number(item.priority || 0),
      matches: scored.matches,
    });
  }


  if (/(^|\s)(друга|другий|другу|другої|другій)(?:\s+і\s+|\s*,\s*)(третя|третій|третю|третьої|третій)\s+(кнопк|блок|елемент|контейнер)/u.test(text)) {
    hits.push({ id:'second_third', label:'Другий і третій елементи', selectorMode:'ordinal:2,3', confidence:0.94, score:320, matches:[] });
  }

  if (/(^|\s)(друга|другий|другу|другої|другій)(?=\s+(кнопк|блок|елемент|контейнер)|$)/u.test(text) || /у\s+другій\s+кнопці/u.test(text)) {
    hits.push({ id:'second_one', label:'Другий елемент', selectorMode:'ordinal:2', confidence:0.9, score:160, matches:[] });
  }
  if (/(^|\s)(третя|третій|третю|третьої|третій)(?=\s+(кнопк|блок|елемент|контейнер)|$)/u.test(text) || /у\s+третій\s+кнопці/u.test(text)) {
    hits.push({ id:'third_one', label:'Третій елемент', selectorMode:'ordinal:3', confidence:0.9, score:160, matches:[] });
  }
  if (/(усі|всі)\s+кнопки/u.test(text)) {
    hits.push({ id:'all_buttons', label:'Усі кнопки', selectorMode:'descendants:button_block', confidence:0.92, score:226, matches:[] });
  }
  if (/(усі|всі)\s+заголовки/u.test(text)) {
    hits.push({ id:'all_headings', label:'Усі заголовки', selectorMode:'descendants:heading_block', confidence:0.92, score:226, matches:[] });
  }
  for (const item of (Array.isArray(synonyms?.scopes) ? synonyms.scopes : [])) {
    const scored = scoreEntityMatch(text, [item.label, ...(item.aliases || [])]);
    if (!scored.matches.length) continue;
    hits.push({
      id: item.normalizedTo || item.id,
      label: item.label,
      selectorMode: null,
      confidence: scored.confidence,
      score: scored.score,
      matches: scored.matches,
    });
  }

  const unique = dedupeBy(hits.sort((a, b) => b.score - a.score), (item) => item.id);
  const primary = unique[0] || { id: 'selected_element', label: 'Активний елемент', selectorMode: 'current_selection', confidence: 0.72, score: 72, matches: [] };
  return {
    primary,
    hits: unique,
    confidence: primary.confidence || 0.72,
  };
}
