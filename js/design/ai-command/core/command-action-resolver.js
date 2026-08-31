import { loadAiCommandData } from './manifest-loader.js';
import { dedupeBy, scoreEntityMatch } from './command-utils.js';

function deriveIntent(id){
  if (!id) return 'set';
  if (['create', 'delete', 'duplicate', 'move', 'reorder', 'select', 'rename', 'reset'].includes(id)) return id;
  if (id === 'apply_template' || id === 'apply' || id === 'retry_variant') return 'apply';
  if (id.startsWith('increase')) return 'increase';
  if (id.startsWith('decrease')) return 'decrease';
  if (id.startsWith('remove')) return 'remove';
  if (id.startsWith('set_')) return 'set';
  return 'set';
}

function getGenericVerbHints(text){
  const hints = [];
  const raw = String(text || '');
  if (/(^|\s)(зроби|зміни|постав|задай|застосуй|приміни|зафарбуй|залий)(?=$|\s|[,:;])/u.test(raw)) hints.push({ id: 'generic_set', confidence: 0.86, alias: 'generic_set' });
  if (/(^|\s)(розтягни|розшир)(?=$|\s|[,:;])/u.test(raw) && /(всю\s+ширин|всю\s+висот|на\s+увесь\s+екран|на\s+весь\s+екран|авто|auto)/u.test(raw)) hints.push({ id: 'generic_set', confidence: 0.86, alias: 'generic_set' });
  if (/(^|\s)(збільш|додай\s+більше|посиль|підніми|розтягни|розшир|зроби\s+ширш|зроби\s+вищ)(?=$|\s|[,:;])/u.test(raw)) hints.push({ id: 'increase', confidence: 0.82, alias: 'increase' });
  if (/(^|\s)(зменш|зроби\s+менше|послаб|опусти|стисни|звузь|зроби\s+вужч|зроби\s+нижч)(?=$|\s|[,:;])/u.test(raw)) hints.push({ id: 'decrease', confidence: 0.82, alias: 'decrease' });
  if (/(^|\s)(вирівняй|відцентруй|розмісти|притисни|прижми|центруй)(?=$|\s|[,:;])/u.test(raw)) hints.push({ id: 'align', confidence: 0.84, alias: 'align' });
  if (/(^|\s)(посунь|пересунь|підсунь|зсунь|сунь|підвинь|кинь)(?=$|\s|[,:;])/u.test(raw)) hints.push({ id: 'move', confidence: 0.86, alias: 'move' });
  if (/(^|\s)(поверни|розверни|оберни|крути|крутань|перекрути|прокрути|завали)(?=$|\s|[,:;])/u.test(raw)) hints.push({ id: 'set_rotation', confidence: 0.9, alias: 'set_rotation' });
  if (/(^|\s)(переверни|перекинь)(?=$|\s|[,:;])/u.test(raw) && /(догори\s+ногами|догори\s+дригом|вверх\s+ногами|180\s*(deg|°|градус))/u.test(raw)) hints.push({ id: 'set_rotation', confidence: 0.9, alias: 'set_rotation' });
  if (/(^|\s)(віддзеркаль|дзеркаль|відобрази|mirror|flip|фліпни)(?=$|\s|[,:;])/u.test(raw) || /дзеркально/u.test(raw)) {
    if (/(горизонтал|зліва\s+направо|справа\s+наліво)/u.test(raw)) hints.push({ id: 'flip_horizontal', confidence: 0.9, alias: 'flip_horizontal' });
    if (/(вертикал|зверху\s+вниз|знизу\s+вгору|знизу\s+вверх)/u.test(raw)) hints.push({ id: 'flip_vertical', confidence: 0.9, alias: 'flip_vertical' });
  }
  if (/(спробуй|попробуй|перегенеруй|перероби|згенеруй)(?:[\s\S]{0,24})?(ще\s+раз)/u.test(raw) || /(ще\s+раз)(?:[\s\S]{0,24})?(спробуй|попробуй|згенеруй|зроби|перегенеруй)/u.test(raw) || ((/(^|\s)(спробуй|попробуй)(?=$|\s|[,:;])/u.test(raw)) && /(красив|гарн|акурат|охайн|сучас|стильн|оригінальн|креативн|унікальн|преміальн|дорожч.*вигляд)/u.test(raw))) {
    hints.push({ id: 'retry_variant', confidence: 0.94, alias: 'retry_variant' });
  }
  return hints;
}

export async function resolveCommandAction(ctx){
  const [actionManifest, synonyms] = await Promise.all([
    loadAiCommandData('action-manifest.json'),
    loadAiCommandData('term-synonyms.json'),
  ]);

  const text = String(ctx?.normalizedText || '');
  const hits = [];

  for (const item of (Array.isArray(actionManifest) ? actionManifest : [])) {
    const aliases = [item.id, item.label, ...(Array.isArray(item.aliases) ? item.aliases : [])];
    const scored = scoreEntityMatch(text, aliases, 0.02);
    if (!scored.matches.length) continue;
    let confidence = scored.confidence;
    let score = scored.score;
    if (item.id === 'adjust_gradient_color_share' && !/(градієнт|gradient|колір|yellow|blue|green|red|orange|purple|pink|black|white|gray|grey|жовт|син|зелен|черв|помаранч|фіол|рожев|чорн|біло|сір)/u.test(text)) {
      confidence = Math.max(0.14, confidence - 0.58);
      score -= 78;
    }
    if (item.id === 'adjust_gradient_color_share' && /(текст|іконк|icon|padding|margin|gap|розмір|мобільн|desktop|hover)/u.test(text)) {
      confidence = Math.max(0.12, confidence - 0.34);
      score -= 44;
    }
    if (item.id === 'set_gradient_direction' && !/(градієнт|gradient)/u.test(text)) {
      confidence = Math.max(0.45, confidence - 0.16);
      score -= 18;
    }
    if (item.id === 'set_icon' && /(іконк|значок|icon|конверт|envelope|mail)/u.test(text)) {
      confidence = Math.min(0.99, confidence + 0.12);
      score += 18;
    }
    if (item.id === 'create' && /(іконк|значок|icon)/u.test(text) && /(конверт|envelope|mail|додай\s+іконк|постав\s+іконк|заміни\s+іконк)/u.test(text)) {
      confidence = Math.max(0.32, confidence - 0.28);
      score -= 32;
    }
    if (item.id === 'set_opacity' && /(напівпрозор|semi[-\s]?transparent)/u.test(text)) {
      confidence = Math.min(0.99, confidence + 0.1);
      score += 14;
    }
    if (item.id === 'set_background' && /(текст|іконк|icon|label)/u.test(text)) {
      confidence = Math.max(0.45, confidence - 0.14);
      score -= 14;
    }
    hits.push({
      id: item.id,
      label: item.label,
      source: 'action-manifest',
      intent: deriveIntent(item.id),
      confidence,
      score,
      matches: scored.matches,
    });
  }

  for (const item of (Array.isArray(synonyms?.actions) ? synonyms.actions : [])) {
    const scored = scoreEntityMatch(text, [item.label, ...(Array.isArray(item.aliases) ? item.aliases : [])], 0.01);
    if (!scored.matches.length) continue;
    hits.push({
      id: item.normalizedTo || item.id,
      label: item.label,
      source: 'term-synonyms',
      intent: deriveIntent(item.normalizedTo || item.id),
      confidence: scored.confidence,
      score: scored.score,
      matches: scored.matches,
    });
  }

  for (const hint of getGenericVerbHints(text)) {
    hits.push({
      id: hint.id,
      label: hint.alias,
      source: 'heuristic',
      intent: hint.id === 'align' ? 'align' : hint.id,
      confidence: hint.confidence,
      score: hint.confidence * 100,
      matches: [{ alias: hint.alias, index: 0, length: hint.alias.length, confidence: hint.confidence }],
    });
  }

  const unique = dedupeBy(hits.sort((a, b) => b.score - a.score), (item) => `${item.id}:${item.source}`);
  const primary = unique[0] || null;
  return {
    primary,
    hits: unique,
    confidence: primary?.confidence || 0,
    genericIntent: primary?.intent || 'set',
  };
}
