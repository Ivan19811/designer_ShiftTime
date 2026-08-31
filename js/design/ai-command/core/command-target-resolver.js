import { loadAiCommandData } from './manifest-loader.js';
import { dedupeBy, scoreEntityMatch } from './command-utils.js';

const GROUP_PRIORITY = {
  global: 130,
  structure: 115,
  content: 105,
  header_footer_content: 100,
  navigation: 95,
  layer: 50,
  state: 40,
  responsive: 35,
};

function targetBonus(target){
  const id = String(target?.id || '');
  if (id === 'block_host') return 28;
  if (id === 'button_block') return 20;
  if (id === 'menu_block' || id === 'menu_item') return 18;
  if (id === 'section' || id === 'container' || id === 'row') return 15;
  if (id.endsWith('_layer')) return -12;
  return 0;
}

export async function resolveCommandTarget(ctx, options = {}){
  const [targets, synonyms] = await Promise.all([
    loadAiCommandData('target-manifest.json'),
    loadAiCommandData('term-synonyms.json'),
  ]);
  const text = String(ctx?.normalizedText || '');
  const hits = [];

  for (const item of (Array.isArray(targets) ? targets : [])) {
    const aliases = [item.id, item.label, ...(Array.isArray(item.aliases) ? item.aliases : [])];
    const scored = scoreEntityMatch(text, aliases, 0.01);
    if (!scored.matches.length) continue;
    const groupWeight = GROUP_PRIORITY[item.group] || 0;
    hits.push({
      id: item.id,
      label: item.label,
      group: item.group,
      confidence: scored.confidence,
      score: scored.score + groupWeight + targetBonus(item),
      matches: scored.matches,
      explicit: true,
    });
  }



  if (/(усі|всі)?\s*кнопк(и|ок)?/u.test(text)) {
    hits.push({ id:'button_block', label:'Кнопка', group:'content', confidence:0.93, score:238, matches:[], explicit:true });
  }

  if (/(усі|всі)?\s*заголовк(и|ів)?|headings?/u.test(text)) {
    hits.push({ id:'heading_block', label:'Заголовок', group:'content', confidence:0.93, score:239, matches:[], explicit:true });
  }

  if (/(mega\s+(menu|panel|меню)|мегаменю)/u.test(text)) {
    hits.push({
      id: 'mega_panel',
      label: 'Mega panel',
      group: 'menu',
      confidence: 0.95,
      score: 220,
      matches: [],
      explicit: true,
    });
  }

  if (/(^|\s)(абзац|параграф)(?:а|у|ом|і)?(?=$|\s|[,:;])/u.test(text)) {
    hits.push({
      id: 'article_block',
      label: 'Абзац',
      group: 'content',
      confidence: 0.93,
      score: 238,
      matches: [],
      explicit: true,
    });
  }

  if (/(^|\s)блок(?:а|у|ом|и|ів)?(?=$|\s|[,:;])/u.test(text) && !/(контейнер|секц|кнопк|текст|іконк|меню|header|footer)/u.test(text)) {
    hits.push({
      id: 'block_host',
      label: 'Універсальний блок',
      group: 'content',
      confidence: 0.92,
      score: 232,
      matches: [],
      explicit: true,
    });
  }

  for (const item of (Array.isArray(synonyms?.targets) ? synonyms.targets : [])) {
    const scored = scoreEntityMatch(text, [item.label, ...(Array.isArray(item.aliases) ? item.aliases : [])]);
    if (!scored.matches.length) continue;
    const manifestItem = (Array.isArray(targets) ? targets : []).find((target) => target.id === (item.normalizedTo || item.id));
    hits.push({
      id: item.normalizedTo || item.id,
      label: item.label,
      group: manifestItem?.group || '',
      confidence: scored.confidence,
      score: scored.score + (GROUP_PRIORITY[manifestItem?.group] || 0) + targetBonus(manifestItem),
      matches: scored.matches,
      explicit: true,
    });
  }

  const unique = dedupeBy(hits.sort((a, b) => b.score - a.score), (item) => item.id);
  let explicitTarget = unique[0] || null;
  const layerWordsOnly = /(тільки|лише|окремо|саму?|лишь)\s+(тінь|shadow|фон|background)|\b(?:shadow|background)\s+layer\b/u;
  if (explicitTarget && explicitTarget.id.endsWith('_layer') && !layerWordsOnly.test(text)) {
    const actionId = String(ctx?.action?.primary?.id || '');
    if (options.currentTargetId || actionId === 'set_shadow' || actionId === 'set_gradient' || actionId === 'set_background' || actionId === 'set_opacity' || actionId === 'create') {
      explicitTarget = null;
    }
  }
  const fallbackTarget = options.currentTargetId ? {
    id: options.currentTargetId,
    label: options.currentTargetId,
    group: 'context',
    confidence: 0.55,
    score: 55,
    matches: [],
    explicit: false,
  } : {
    id: 'selected_element',
    label: 'Вибраний елемент',
    group: 'context',
    confidence: 0.5,
    score: 50,
    matches: [],
    explicit: false,
  };

  return {
    primary: explicitTarget || fallbackTarget,
    explicitTarget,
    mentionedTargets: unique,
    confidence: (explicitTarget || fallbackTarget).confidence,
  };
}
