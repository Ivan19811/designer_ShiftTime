import { loadAiCommandData } from './manifest-loader.js';
import { dedupeBy, scoreEntityMatch } from './command-utils.js';

function buildHeuristicProperty(ctx){
  const text = String(ctx?.normalizedText || '');
  const intent = String(ctx?.action?.genericIntent || 'set');
  const targetId = String(ctx?.target?.primary?.id || '');
  const value = ctx?.value?.primaryType || '';

  const mentions = {
    text: /(текст|тексту|текстом|напис|label|heading|заголовок|заголовку|абзац|абзацу|абзаці)/u.test(text),
    icon: /(іконк|значок|icon)/u.test(text),
    border: /(рамк|бордер|border|контур|обводк)/u.test(text),
    shadow: /(тінь|shadow|glow|розмитт)/u.test(text),
    visibility: /(видим|visibility|сховай|приховай|покажи|show|hide)/u.test(text),
    hover: /(hover|на\s+ховер|при\s+наведенн)/u.test(text),
    gradient: /(градієнт|gradient)/u.test(text),
    background: /(фон|background|заливк|overlay)/u.test(text),
    radius: /(скругл|округл|радіус|radius|rounded)/u.test(text),
    width: /(ширин|width|ширше|вужче|розтягни|розшир|звузь|стисни)/u.test(text),
    height: /(висот|height|вищ|нижч)/u.test(text),
    padding: /(padding|відступ|відступи|відступів|внутрішн(ій|і)\s+відступ|внутрішн|всередині|всеред|усеред|inside)/u.test(text),
    margin: /(margin|зовнішн(ій|і)\s+відступ|зовнішн|зовні|навколо|outside)/u.test(text),
    gap: /(gap|gutter|spacing|space\s+between|проміжок|проміжки|проміжків|відстань\s+між|відступи\s+між|між\s+(кнопк|блок|елемент|контейнер|ряд|секц|картк|пункт))/u.test(text),
    lineHeight: /(line\s*height|міжрядков|між\s*рядк)/u.test(text),
    letterSpacing: /(letter\s*spacing|інтервал\s+літер|відстань\s+між\s+букв|відстань\s+між\s+літер|між\s+буквами|між\s+літерами)/u.test(text),
    textCase: /(капс|caps\b|uppercase|lowercase|великими\s+літерами|маленькими\s+літерами)/u.test(text),
    align: /(вирівн|відцентруй|притисни|прижми|align|justify|центр|центру|посередині|по\s+центру|по\s+ширині|в\s+центр|у\s+центр|правого\s+краю|лівого\s+краю|зліва|справа)/u.test(text),
    opacity: /(прозор|прзор|прозр|opacity|напівпрозор)/u.test(text),
    blur: /(blur|розмитт)/u.test(text),
    image: /(картинк|зображенн|image|png|фото)/u.test(text),
    link: /(посилан|href|link|url)/u.test(text),
    columns: /(колонк|columns)/u.test(text),
    rotation: /(поворот|поверн|розверн|оберн|крут|крутань|перекрут|прокрут|завал|rotate|градус|°|догори\s+ногами|догори\s+дригом|вверх\s+ногами)/u.test(text),
    flipHorizontal: /(віддзеркал|дзеркал|дзеркально|mirror|flip|фліпни|відобраз)/u.test(text) && /(горизонтал|зліва\s+направо|справа\s+наліво)/u.test(text),
    flipVertical: /(віддзеркал|дзеркал|дзеркально|mirror|flip|фліпни|відобраз)/u.test(text) && /(вертикал|зверху\s+вниз|знизу\s+вгору|знизу\s+вверх)/u.test(text),
    moveX: /(правіше|лівіше|вправо|вліво|праворуч|ліворуч|вправий|влівий|вправ)/u.test(text),
    moveY: /(вище|нижче|вгору|вниз|догори|донизу|вверх)/u.test(text),
  };

  if (ctx?.previousPropertyId === 'background_gradient' && /(градус|°|deg|поверн|розверн|оберн|крут|горизонтал|вертикал)/u.test(text) && !/(тінь|shadow|розмитт|opacity|прозор|прзор|прозр|висот|ширин)/u.test(text)) return { id: 'background_gradient', confidence: 0.92, source: 'heuristic' };
  if ((ctx?.action?.primary?.id || '') === 'set_shadow') {
    if (mentions.text) return { id: 'text_shadow', confidence: 0.93, source: 'heuristic' };
    if (/(сильніш|інтенсивніш|густіш|щільніш|stronger|strong)/u.test(text)) return { id: 'shadow_opacity', confidence: 0.91, source: 'heuristic' };
    if (/(м[’'\s]?якш|мякіш|softer|soft|розмитіш)/u.test(text)) return { id: 'shadow_blur', confidence: 0.92, source: 'heuristic' };
    if (value === 'color') return { id: 'shadow_color', confidence: 0.9, source: 'heuristic' };
    return { id: 'shadow_blur', confidence: 0.9, source: 'heuristic' };
  }
  if ((ctx?.action?.primary?.id || '') === 'set_visibility') return { id: 'visibility', confidence: 0.92, source: 'heuristic' };
  if ((ctx?.action?.primary?.id || '') === 'set_opacity') {
    if (targetId === 'mega_panel') return { id: 'mega_panel_opacity', confidence: 0.88, source: 'heuristic' };
    return { id: 'background_opacity', confidence: 0.88, source: 'heuristic' };
  }
  if ((ctx?.action?.primary?.id || '') === 'set_text_shadow') return { id: 'text_shadow', confidence: 0.92, source: 'heuristic' };
  if ((ctx?.action?.primary?.id || '') === 'set_text_stroke') return { id: 'text_stroke', confidence: 0.92, source: 'heuristic' };
  if (mentions.hover && mentions.text) return { id: 'text_color', confidence: 0.9, source: 'heuristic' };
  if (mentions.hover && mentions.border) return { id: 'border_color', confidence: 0.88, source: 'heuristic' };
  if (mentions.hover && mentions.shadow) return { id: 'shadow_blur', confidence: 0.86, source: 'heuristic' };
  if (mentions.hover) return { id: 'background_color', confidence: 0.84, source: 'heuristic' };
  if (mentions.gradient || value === 'gradient' || value === 'gradient_adjustment') return { id: 'background_gradient', confidence: 0.9, source: 'heuristic' };
  if (mentions.background && mentions.image) return { id: 'background_image', confidence: 0.88, source: 'heuristic' };
  if (mentions.background && mentions.opacity) return { id: 'background_opacity', confidence: 0.86, source: 'heuristic' };
  if (mentions.background) return { id: 'background_color', confidence: 0.86, source: 'heuristic' };
  if (mentions.text && value === 'color') return { id: 'text_color', confidence: 0.92, source: 'heuristic' };
  if (mentions.text && /(жирн|bold|тонк|light|italic|курсив)/u.test(text)) return { id: 'font_weight', confidence: 0.88, source: 'heuristic' };
  if (mentions.text && mentions.lineHeight) return { id: 'line_height', confidence: 0.9, source: 'heuristic' };
  if (mentions.text && mentions.letterSpacing) return { id: 'letter_spacing', confidence: 0.9, source: 'heuristic' };
  if (mentions.text && mentions.shadow) return { id: 'text_shadow', confidence: 0.9, source: 'heuristic' };
  if (mentions.text && /(обводк|контур|stroke)/u.test(text)) return { id: 'text_stroke', confidence: 0.9, source: 'heuristic' };
  if (mentions.text && mentions.textCase) return { id: 'text_case', confidence: 0.9, source: 'heuristic' };
  if (mentions.text && intent === 'increase') return { id: 'font_size', confidence: 0.89, source: 'heuristic' };
  if (mentions.text && intent === 'decrease') return { id: 'font_size', confidence: 0.89, source: 'heuristic' };
  if (mentions.text && mentions.align) return { id: 'text_align', confidence: 0.87, source: 'heuristic' };
  if (mentions.text) return { id: 'text_content', confidence: 0.74, source: 'heuristic' };
  if (mentions.icon && mentions.visibility) return { id: 'visibility', confidence: 0.93, source: 'heuristic' };
  if (mentions.icon && value === 'color') return { id: 'icon_color', confidence: 0.92, source: 'heuristic' };
  if (mentions.icon && intent === 'increase') return { id: 'icon_size', confidence: 0.9, source: 'heuristic' };
  if (mentions.icon && intent === 'decrease') return { id: 'icon_size', confidence: 0.9, source: 'heuristic' };
  if (mentions.icon && /(постав|заміни|додай|іконк)/u.test(text) && !mentions.visibility) return { id: 'icon_name', confidence: 0.85, source: 'heuristic' };
  if (mentions.border && mentions.opacity) return { id: 'border_opacity', confidence: 0.91, source: 'heuristic' };
  if (mentions.border && value === 'opacity_adjustment') return { id: 'border_opacity', confidence: 0.91, source: 'heuristic' };
  if (mentions.border && /(пунктирн|крапков|суцільн|dashed|dotted|solid)/u.test(text)) return { id: 'border_style', confidence: 0.92, source: 'heuristic' };
  if (mentions.border && value === 'color') return { id: 'border_color', confidence: 0.9, source: 'heuristic' };
  if (mentions.border && value === 'number') return { id: 'border_width', confidence: 0.88, source: 'heuristic' };
  if (mentions.border) return { id: 'border_width', confidence: 0.77, source: 'heuristic' };
  if (mentions.shadow && mentions.opacity) return { id: 'shadow_opacity', confidence: 0.86, source: 'heuristic' };
  if (mentions.shadow && /(сильніш|інтенсивніш|густіш|щільніш|stronger|strong)/u.test(text)) return { id: 'shadow_opacity', confidence: 0.9, source: 'heuristic' };
  if (mentions.shadow && mentions.blur) return { id: 'shadow_blur', confidence: 0.88, source: 'heuristic' };
  if (mentions.shadow && /(м[’'\s]?якш|мякіш|softer|soft|розмитіш)/u.test(text)) return { id: 'shadow_blur', confidence: 0.9, source: 'heuristic' };
  if (mentions.shadow && value === 'color') return { id: 'shadow_color', confidence: 0.88, source: 'heuristic' };
  if (mentions.shadow) return { id: 'shadow_blur', confidence: 0.8, source: 'heuristic' };
  if (mentions.radius) {
    if (targetId === 'icon_block' || targetId === 'icon_inline' || mentions.icon) return { id: 'icon_radius', confidence: 0.87, source: 'heuristic' };
    if (targetId === 'mega_panel') return { id: 'mega_panel_radius', confidence: 0.87, source: 'heuristic' };
    return { id: 'border_radius', confidence: 0.9, source: 'heuristic' };
  }
  if (mentions.rotation) return { id: 'rotation', confidence: 0.93, source: 'heuristic' };
  if (mentions.flipHorizontal) return { id: 'flip_x', confidence: 0.92, source: 'heuristic' };
  if (mentions.flipVertical) return { id: 'flip_y', confidence: 0.92, source: 'heuristic' };
  if (((ctx?.action?.primary?.id || '') === 'move' || /(посунь|пересунь|підсунь|зсунь|сунь|підвинь|кинь)/u.test(text)) && mentions.moveX) return { id: 'offset_x', confidence: 0.9, source: 'heuristic' };
  if (((ctx?.action?.primary?.id || '') === 'move' || /(посунь|пересунь|підсунь|зсунь|сунь|підвинь|кинь)/u.test(text)) && mentions.moveY) return { id: 'offset_y', confidence: 0.9, source: 'heuristic' };
  if (mentions.width) return { id: 'width', confidence: 0.88, source: 'heuristic' };
  if (mentions.height) return { id: 'height', confidence: 0.88, source: 'heuristic' };
  if (mentions.gap) return { id: 'gap', confidence: 0.86, source: 'heuristic' };
  if (mentions.margin) return { id: 'margin', confidence: 0.85, source: 'heuristic' };
  if (mentions.padding) return { id: 'padding', confidence: 0.84, source: 'heuristic' };
  if (mentions.align) {
    if (/\b(текст|label|напис|heading|заголовок)\b/u.test(text)) return { id: 'text_align', confidence: 0.84, source: 'heuristic' };
    if (/(зверху|знизу|вгор|вниз|верхнього|нижнього)/u.test(text)) return { id: 'align_y', confidence: 0.82, source: 'heuristic' };
    return { id: 'align_x', confidence: 0.84, source: 'heuristic' };
  }
  if (mentions.visibility) return { id: 'visibility', confidence: 0.84, source: 'heuristic' };
  if (mentions.opacity) {
    if (targetId === 'mega_panel') return { id: 'mega_panel_opacity', confidence: 0.84, source: 'heuristic' };
    return { id: 'background_opacity', confidence: 0.82, source: 'heuristic' };
  }
  if (mentions.blur) {
    if (targetId === 'mega_panel') return { id: 'mega_panel_blur', confidence: 0.84, source: 'heuristic' };
    return { id: 'blur', confidence: 0.8, source: 'heuristic' };
  }
  if (mentions.link) return { id: 'href', confidence: 0.85, source: 'heuristic' };
  if (mentions.columns) return { id: 'mega_columns', confidence: 0.82, source: 'heuristic' };

  if (value === 'color') {
    if (targetId === 'text_block' || targetId === 'heading_block' || targetId === 'article_block' || targetId === 'text_inline') return { id: 'text_color', confidence: 0.82, source: 'heuristic' };
    if (targetId === 'icon_block' || targetId === 'icon_inline') return { id: 'icon_color', confidence: 0.82, source: 'heuristic' };
    return { id: 'background_color', confidence: 0.76, source: 'heuristic' };
  }
  return null;
}

export async function resolveCommandProperty(ctx){
  const [properties, synonyms] = await Promise.all([
    loadAiCommandData('property-manifest.json'),
    loadAiCommandData('term-synonyms.json'),
  ]);
  const text = String(ctx?.normalizedText || '');
  const hits = [];

  for (const item of (Array.isArray(properties) ? properties : [])) {
    const aliases = [item.id, item.label, ...(Array.isArray(item.aliases) ? item.aliases : [])];
    const scored = scoreEntityMatch(text, aliases, 0.01);
    if (!scored.matches.length) continue;
    hits.push({
      id: item.id,
      label: item.label,
      confidence: scored.confidence,
      score: scored.score,
      valueType: item.valueType,
      source: 'property-manifest',
      matches: scored.matches,
    });
  }

  for (const item of (Array.isArray(synonyms?.properties) ? synonyms.properties : [])) {
    const scored = scoreEntityMatch(text, [item.label, ...(Array.isArray(item.aliases) ? item.aliases : [])]);
    if (!scored.matches.length) continue;
    hits.push({
      id: item.normalizedTo || item.id,
      label: item.label,
      confidence: scored.confidence,
      score: scored.score,
      valueType: null,
      source: 'term-synonyms',
      matches: scored.matches,
    });
  }

  const heuristic = buildHeuristicProperty(ctx);
  if (heuristic) {
    hits.push({
      id: heuristic.id,
      label: heuristic.id,
      confidence: heuristic.confidence,
      score: heuristic.confidence * 100 + 30,
      valueType: null,
      source: heuristic.source,
      matches: [],
    });
  }

  const unique = dedupeBy(hits.sort((a, b) => b.score - a.score), (item) => item.id);
  const primary = unique[0] || null;
  return {
    primary,
    hits: unique,
    confidence: primary?.confidence || 0,
  };
}
