import { averageConfidence } from './command-utils.js';
import { normalizeCommandText } from './command-normalizer.js';
import { tokenizeCommandText } from './command-tokenizer.js';
import { buildCommandPlan } from './command-plan-builder.js';
import { resolveCommandAction } from './command-action-resolver.js';
import { resolveCommandTarget } from './command-target-resolver.js';
import { resolveCommandProperty } from './command-property-resolver.js';
import { resolveCommandValue } from './command-value-resolver.js';
import { resolveCommandScope } from './command-scope-resolver.js';
import { resolveCommandState } from './command-state-resolver.js';
import { resolveCommandResponsive } from './command-responsive-resolver.js';
import { clarifyCommandResolution } from './command-clarifier.js';
import { detectUnknownLanguage } from './command-unknown-detector.js';


function canonicalizePropertyId(propertyId){
  if (!propertyId) return null;
  if (propertyId === 'background_color' || propertyId === 'hover_background') return 'background';
  if (propertyId === 'hover_text_color') return 'text_color';
  if (propertyId === 'border_radius') return 'radius';
  if (propertyId === 'background_opacity' || propertyId === 'mega_panel_opacity' || propertyId === 'hover_opacity') return 'opacity';
  return propertyId;
}

function canonicalizeScopeId(scopeId){
  if (scopeId === 'inner_text_only') return 'text_only';
  if (scopeId === 'inner_icon_only') return 'icon_only';
  return scopeId || 'selected_element';
}

function deriveSelectionSemantics(scopeResult){
  const scopeId = String(scopeResult?.primary?.id || 'selected_element');
  const selectorMode = String(scopeResult?.primary?.selectorMode || 'current_selection');
  if (scopeId === 'selected_element') {
    return {
      mode: selectorMode || 'current_selection',
      applyTo: 'all_selected_if_multiple',
      fallback: 'single_selected',
    };
  }
  return {
    mode: selectorMode || scopeId,
    applyTo: 'scope_resolved',
    fallback: null,
  };
}

function deriveOutputTarget(targetResult, propertyResult, stateResult, normalizedText, options = {}){
  const targetId = targetResult?.primary?.id || options.currentTargetId || 'selected_element';
  const propertyId = propertyResult?.primary?.id || '';
  const text = String(normalizedText || '');
  if (targetId === 'hover_state' && (stateResult?.primary?.id || '') === 'hover') return options.currentTargetId || 'selected_element';
  if (targetId === 'row' && /(?:^|\s)(текст|тексту|напис|heading|заголовок|заголовку|абзац|абзацу|абзаці)(?:$|\s)/u.test(text) && ['text_color', 'font_size', 'text_content', 'text_align', 'font_weight', 'line_height', 'letter_spacing', 'text_shadow', 'text_stroke', 'text_case'].includes(propertyId)) return 'text_block';
  if (targetId === 'block_host') return 'container';
  if (!targetResult?.explicitTarget && /(?:^|\s)(текст|тексту|напис|heading|заголовок|заголовку|абзац|абзацу|абзаці)(?:$|\s)/u.test(text) && ['text_color', 'font_size', 'text_content', 'text_align', 'font_weight', 'line_height', 'letter_spacing', 'text_shadow', 'text_stroke', 'text_case'].includes(propertyId)) return 'text_block';
  if (!targetResult?.explicitTarget && propertyId === 'icon_name') return 'icon_block';
  if (/(mega\s+(menu|panel|меню)|мегаменю)/u.test(text)) return 'mega_panel';
  return targetId;
}


function finalizeActionId(actionResult, propertyResult, valueResult, normalizedText = ""){
  const actionId = actionResult?.primary?.id || '';
  const intent = actionResult?.genericIntent || 'set';
  const propertyId = propertyResult?.primary?.id || '';
  const valueType = valueResult?.primaryType || 'none';
  const actionFitsProperty = () => {
    if (!actionId || !propertyId) return true;
    if (actionId === 'set_background') {
      return ['background_color', 'background_gradient', 'background_image', 'background_opacity', 'overlay_color', 'overlay_gradient'].includes(propertyId);
    }
    if (actionId === 'set_text') {
      return ['text_content', 'text_color', 'font_size', 'font_weight', 'font_style', 'text_align', 'line_height', 'letter_spacing', 'text_shadow', 'text_stroke'].includes(propertyId);
    }
    if (actionId === 'set_icon') {
      return ['icon_name', 'icon_color', 'icon_size', 'icon_background', 'icon_border', 'icon_radius', 'icon_shadow', 'icon_position'].includes(propertyId);
    }
    return true;
  };
  if (valueType === 'gradient_adjustment') {
    return valueResult?.value?.kind || intent || 'increase';
  }
  if (valueType === 'opacity_adjustment') return 'adjust_opacity';
  if (valueType === 'spacing' || valueType === 'spacing_delta') {
    if (propertyId === 'gap') return 'set_gap';
    if (propertyId === 'margin') return 'set_margin';
    return 'set_padding';
  }
  if (valueType === 'visibility') return 'set_visibility';
  if (actionId && actionId !== 'generic_set') {
    if (actionId === 'increase' || actionId === 'decrease') return actionId;
    if (actionId === 'set_width' && /(зменш|вужч|звуз|стисн)/u.test(normalizedText)) return 'decrease';
    if (actionId === 'set_width' && /(збільш|ширш|розшир|розтягн)/u.test(normalizedText)) return 'increase';
    if (actionId === 'set_height' && /(зменш|нижч|пониз|зниз)/u.test(normalizedText)) return 'decrease';
    if (actionId === 'set_height' && /(збільш|вищ|підвищ|розтягн)/u.test(normalizedText)) return 'increase';
    if (actionId === 'set_line_height' && /(зменш|менш)/u.test(normalizedText)) return 'decrease';
    if (actionId === 'set_line_height' && /(збільш|більш)/u.test(normalizedText)) return 'increase';
    if (actionId === 'set_letter_spacing' && /(зменш|менш)/u.test(normalizedText)) return 'decrease';
    if (actionId === 'set_letter_spacing' && /(збільш|більш)/u.test(normalizedText)) return 'increase';
    if (actionId === 'increase_text_size') return 'increase';
    if (actionId === 'decrease_text_size') return 'decrease';
    if (actionId === 'increase_icon_size') return 'increase';
    if (actionId === 'decrease_icon_size') return 'decrease';
    if (actionId === 'increase_radius') return 'increase';
    if (actionId === 'decrease_radius') return 'decrease';
    if (actionId === 'align') {
      if (propertyId === 'text_align') return 'set_text_align';
      if (propertyId === 'align_x') return 'set_align_x';
      if (propertyId === 'align_y') return 'set_align_y';
    }
    if (actionId === 'flip_horizontal' && propertyId === 'flip_y') return 'flip_vertical';
    if (actionId === 'flip_vertical' && propertyId === 'flip_x') return 'flip_horizontal';
    if (actionId === 'create' && propertyId === 'icon_name') return 'set_icon';
    if (actionId === 'set_text_align' && propertyId === 'align_x') return 'set_align_x';
    if (actionId === 'set_text_align' && propertyId === 'align_y') return 'set_align_y';
    if ((actionId === 'set_shadow' || actionId === 'remove_shadow' || actionId === 'set_text_shadow') && propertyId === 'text_shadow') return actionId === 'remove_shadow' ? 'remove_text_shadow' : 'set_text_shadow';
    if ((actionId === 'set_border' || actionId === 'create' || actionId === 'set_text_stroke') && propertyId === 'text_stroke') return 'set_text_stroke';
    if ((actionId === 'set_text' || actionId === 'generic_set' || actionId === 'set_text_color') && propertyId === 'text_case') return 'set_text_case';
    if (actionId === 'set_background' && propertyId === 'background_gradient') return 'set_gradient';
    if (actionId === 'set_rotation' && propertyId === 'background_gradient') return 'set_gradient';
    if (actionId === 'set_gradient_direction' && propertyId === 'background_gradient') return 'set_gradient';
    if (actionId === 'create' && (propertyId === 'shadow_blur' || propertyId === 'shadow_color' || propertyId === 'shadow_opacity')) return 'set_shadow';
    if (actionId === 'create' && propertyId === 'visibility') return 'set_visibility';
    if (actionId === 'create' && propertyId === 'blur') return 'set_blur';
    if (actionId === 'set_padding' || actionId === 'set_margin' || actionId === 'set_gap') return 'set_spacing';
    if (actionId === 'resize' && propertyId === 'width') return 'set_width';
    if (actionId === 'resize' && propertyId === 'height') return 'set_height';
    if (actionId === 'set_size_mode' && propertyId === 'width') return 'set_width';
    if (actionId === 'set_size_mode' && propertyId === 'height') return 'set_height';
    if (actionFitsProperty()) return actionId;
  }
  if (['padding','margin','gap'].includes(propertyId)) {
    if (propertyId === 'gap') return 'set_gap';
    if (propertyId === 'margin') return 'set_margin';
    return 'set_padding';
  }
  if (intent === 'increase') return 'increase';
  if (intent === 'decrease') return 'decrease';
  if (propertyId === 'background_gradient' || valueType === 'gradient') return 'set_gradient';
  if (propertyId === 'text_color') return 'set_text_color';
  if (propertyId === 'icon_name') return 'set_icon';
  if (propertyId === 'icon_color') return 'set_icon_color';
  if (propertyId === 'border_color') return 'set_border_color';
  if (propertyId === 'border_width') return 'set_border';
  if (propertyId === 'border_style') return 'set_border_style';
  if (propertyId === 'shadow_color' || propertyId === 'shadow_blur' || propertyId === 'shadow_opacity') return 'set_shadow';
  if (propertyId === 'blur') return 'set_blur';
  if (propertyId === 'border_radius') return 'set_radius';
  if (propertyId === 'background_color' || propertyId === 'hover_background') return 'set_background';
  if (propertyId === 'rotation') return 'set_rotation';
  if (propertyId === 'flip_x') return 'flip_horizontal';
  if (propertyId === 'flip_y') return 'flip_vertical';
  if (propertyId === 'offset_x' || propertyId === 'offset_y') return 'move';
  if (propertyId === 'width' && /(ширш|розшир|розтягн|збільш)/u.test(normalizedText)) return 'increase';
  if (propertyId === 'width' && /(вужч|звуз|стисн|зменш)/u.test(normalizedText)) return 'decrease';
  if (propertyId === 'height' && /(вищ|підвищ|збільш)/u.test(normalizedText)) return 'increase';
  if (propertyId === 'height' && /(нижч|пониз|зниз|зменш)/u.test(normalizedText)) return 'decrease';
  if (propertyId === 'width') return 'set_width';
  if (propertyId === 'height') return 'set_height';
  if (propertyId === 'padding') return 'set_padding';
  if (propertyId === 'margin') return 'set_margin';
  if (propertyId === 'gap') return 'set_gap';
  if (propertyId === 'text_align') return 'set_text_align';
  if (propertyId === 'align_x') return 'set_align_x';
  if (propertyId === 'align_y') return 'set_align_y';
  if (propertyId === 'font_weight') return 'set_font_weight';
  if (propertyId === 'text_shadow') return 'set_text_shadow';
  if (propertyId === 'text_stroke') return 'set_text_stroke';
  if (propertyId === 'text_case') return 'set_text_case';
  if (propertyId === 'visibility') return 'set_visibility';
  if (propertyId === 'mega_columns') return 'set_columns';
  if (propertyId === 'background_opacity' || propertyId === 'mega_panel_opacity') return 'set_opacity';
  if (propertyId === 'background_image') return 'set_background_image';
  if (propertyId === 'href') return 'set_link';
  return actionId || 'set_background';
}

function buildFinalValue(valueResult){
  if (!valueResult) return null;
  if (valueResult.primaryType === 'gradient') return valueResult.value;
  if (valueResult.primaryType === 'gradient_adjustment') return valueResult.value;
  if (valueResult.primaryType === 'color') return valueResult.value;
  if (valueResult.primaryType === 'number') return valueResult.value;
  if (valueResult.primaryType === 'icon_name') return valueResult.value;
  if (valueResult.primaryType === 'keyword_opacity') return valueResult.value;
  if (valueResult.primaryType === 'opacity_adjustment') return valueResult.value;
  if (valueResult.primaryType === 'relative_color') return valueResult.value;
  if (valueResult.primaryType === 'font_weight' || valueResult.primaryType === 'keyword_size' || valueResult.primaryType === 'effect' || valueResult.primaryType === 'shadow') return valueResult.value;
  if (valueResult.primaryType === 'rotation' || valueResult.primaryType === 'flip' || valueResult.primaryType === 'offset' || valueResult.primaryType === 'position_keyword' || valueResult.primaryType === 'size_keyword' || valueResult.primaryType === 'visibility') return valueResult.value;
  return valueResult.value || null;
}


function hasShadowIntentText(text = ''){
  const raw = String(text || '').toLowerCase();
  return /(?:^|\s)(тінь|тінню|тіні|тіньову|тіньовий|shadow|box\s*-?shadow|підсвітк|glow|неон)(?:$|\s|[,.!?;:])/u.test(raw);
}

function isShadowRemovalText(text = ''){
  const raw = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!raw) return false;
  const shadowWord = '(?:тінь|тінню|тіні|тіньову|тіньовий|shadow|box\\s*-?shadow|підсвітк|glow|неон)';
  const removeWord = '(?:прибери|прибрать|забери|убери|видали|удали|очисти|очисть|скинь|зніми|сними|вимкни|відключи|скасуй|без|remove|delete|clear|disable|turn\\s*off|no|without)';
  const removeBeforeShadow = new RegExp('(?:^|\\s)' + removeWord + '[\\s\\S]{0,36}' + shadowWord + '(?:$|\\s|[,.!?;:])', 'u');
  const shadowBeforeRemove = new RegExp('(?:^|\\s)' + shadowWord + '[\\s\\S]{0,36}' + removeWord + '(?:$|\\s|[,.!?;:])', 'u');
  const transparentShadow = new RegExp('(?:' + shadowWord + '[\\s\\S]{0,60}(?:100\\s*%|повністю|полностью|максимально|zero|0\\s*%)[\\s\\S]{0,40}(?:прозор|прозрач|transparent|opacity)|(?:100\\s*%|повністю|полностью|максимально|zero|0\\s*%)[\\s\\S]{0,40}(?:прозор|прозрач|transparent|opacity)[\\s\\S]{0,60}' + shadowWord + ')', 'u');
  return removeBeforeShadow.test(raw) || shadowBeforeRemove.test(raw) || transparentShadow.test(raw);
}

function buildRemoveShadowIntentValue(normalizedText = ''){
  return {
    type: 'shadow',
    mode: 'remove_shadow',
    remove: true,
    style: 'none',
    softness: 'none',
    glow: 'none',
    adjustment: 'remove',
    incrementPercent: 0,
    incrementMode: 'remove_shadow',
    color: null,
    raw: 'none',
    confidence: 0.98,
    reason: 'remove_shadow_intent',
  };
}

function pickColorForShadow(valueResult = {}, normalizedText = ''){
  const value = valueResult && typeof valueResult.value === 'object' ? valueResult.value : null;
  if (value && value.type === 'color' && (value.hex || value.colorId || value.label)) return { colorId: value.colorId || value.id || 'custom', hex: value.hex || value.raw || '#2563eb', label: value.label || value.colorId || 'Колір' };
  const colors = Array.isArray(valueResult?.colors) ? valueResult.colors : [];
  const first = colors.find((c) => c && (c.hex || c.id || c.label));
  if (first) return { colorId: first.id || first.colorId || 'custom', hex: first.hex || '#2563eb', label: first.label || first.id || 'Колір' };
  const text = String(normalizedText || '').toLowerCase();
  const known = [
    ['blue','Синій','#2563eb',/(син|блакит)/u], ['red','Червоний','#ef4444',/(червон|бордов|вишнев)/u],
    ['green','Зелений','#22c55e',/(зелен|салат)/u], ['yellow','Жовтий','#facc15',/(жовт|золот)/u],
    ['white','Білий','#ffffff',/(білий|біло|білу|білим|white)/u], ['black','Чорний','#020617',/(чорн|black)/u],
    ['purple','Фіолетовий','#8b5cf6',/(фіолет|purple)/u], ['orange','Помаранчевий','#f97316',/(помаранч|оранж|orange)/u],
    ['pink','Рожевий','#ec4899',/(рожев|малин|pink)/u], ['brown','Коричневий','#92400e',/(коричнев|brown)/u],
    ['cyan','Бірюзовий','#06b6d4',/(бірюз|cyan)/u], ['gray','Сірий','#64748b',/(сір|gray|grey)/u],
  ];
  const hit = known.find((item) => item[3].test(text));
  if (hit) return { colorId: hit[0], label: hit[1], hex: hit[2] };
  return { colorId: 'blue', label: 'Синій', hex: '#2563eb' };
}
function getShadowIncrementPercentFromText(normalizedText = ''){
  const text = String(normalizedText || '').toLowerCase();
  const hasDecrease = /(зменш|зменши|зменшити|менш|слабш|послаб|decrease|less|weaker)/u.test(text);
  const hasAdd = /(додай|добав|добави|add)/u.test(text);
  const hasIncrease = /(збільш|збільши|збільшити|більше|посиль|підсиль|increase|more|stronger)/u.test(text);
  const hasStrong = /(сильн|потужн|виразн|яскрав|strong|intense|hard)/u.test(text);
  if (hasDecrease) return -5;
  if ((hasAdd || hasIncrease) && hasStrong) return 10;
  // 00084: Shadow commands are additive by default.
  // Re-applying the same command must not reset box-shadow to the same base value.
  return 5;
}

function buildShadowIntentValue(valueResult = {}, normalizedText = ''){
  const text = String(normalizedText || '').toLowerCase();
  if (isShadowRemovalText(text)) return buildRemoveShadowIntentValue(text);
  const incrementPercent = getShadowIncrementPercentFromText(text);
  const strong = /(сильн|потужн|виразн|яскрав|більш|збільш|посиль|підсиль|strong|intense|hard)/u.test(text);
  const soft = /(м[’'`]?як|легк|легоньк|легеньк|ніжн|слаб|soft|weaker)/u.test(text);
  const glow = /(підсвітк|glow|неон|neon)/u.test(text);
  const color = pickColorForShadow(valueResult, normalizedText);
  return {
    type:'shadow',
    style: glow ? (soft ? 'soft_neon_shadow' : 'neon_shadow') : (soft ? 'soft_shadow' : 'shadow'),
    softness: soft ? 'soft' : (strong ? 'strong' : 'normal'),
    glow: glow ? 'glow' : 'shadow',
    adjustment: incrementPercent < 0 || soft ? 'softer' : (incrementPercent > 0 || strong ? 'stronger' : null),
    incrementPercent,
    incrementMode: incrementPercent ? 'relative_shadow_strength' : 'set_shadow',
    color,
    raw:'shadow',
    confidence: Math.max(Number(valueResult?.confidence || 0), 0.9)
  };
}

function deriveRetryVariantValue(text){
  const raw = String(text || '');
  const requestedIntents = [];
  if (/(красив|гарн)/u.test(raw)) requestedIntents.push('beautiful');
  if (/(акурат|охайн|чистіш|clean)/u.test(raw)) requestedIntents.push('neat');
  if (/(сучас|modern)/u.test(raw)) requestedIntents.push('modern');
  if (/(мінімаліст|minimal)/u.test(raw)) requestedIntents.push('minimal');
  if (/(стильн)/u.test(raw)) requestedIntents.push('stylish');
  if (/(елегант|вишукан)/u.test(raw)) requestedIntents.push('elegant');
  if (/(оригінальн|креативн|унікальн|нестандарт)/u.test(raw)) requestedIntents.push('original');
  if (/(преміальн|luxury|дорог(о|ий|им)|елітн)/u.test(raw)) requestedIntents.push('premium');
  if (/(м[’'\s]?як|soft)/u.test(raw)) requestedIntents.push('soft');
  if (/(контрастніш|контрастн|виразніш)/u.test(raw)) requestedIntents.push('contrast');

  let styleMode = requestedIntents[0] || 'next_variant';
  if (requestedIntents.includes('beautiful') && requestedIntents.includes('neat')) styleMode = 'beautiful_neat';
  else if (requestedIntents.includes('premium')) styleMode = 'premium';
  else if (requestedIntents.includes('modern')) styleMode = 'modern';
  else if (requestedIntents.includes('minimal')) styleMode = 'minimal';
  else if (requestedIntents.includes('elegant')) styleMode = 'elegant';
  else if (requestedIntents.includes('stylish')) styleMode = 'stylish';
  else if (requestedIntents.includes('original')) styleMode = 'original';
  else if (requestedIntents.includes('soft')) styleMode = 'soft';
  else if (requestedIntents.includes('contrast')) styleMode = 'contrast';

  const presetPoolByMode = {
    next_variant: ['minimal', 'clean_modern', 'premium', 'accent_focused'],
    beautiful: ['clean_modern', 'accent_focused', 'premium'],
    beautiful_neat: ['clean_modern', 'minimal', 'premium'],
    neat: ['minimal', 'clean_modern'],
    modern: ['clean_modern', 'minimal', 'accent_focused'],
    minimal: ['minimal', 'clean_modern'],
    stylish: ['accent_focused', 'clean_modern', 'premium'],
    elegant: ['premium', 'clean_modern'],
    original: ['accent_focused', 'clean_modern'],
    premium: ['premium', 'clean_modern'],
    soft: ['clean_modern', 'minimal'],
    contrast: ['accent_focused', 'clean_modern'],
  };

  return {
    type: 'retry_variant',
    styleMode,
    requestedIntents,
    preserveTheme: true,
    preserveStructure: true,
    retryStrategy: 'pick_next_distinct_preset',
    avoidRepeatingPreviousVariant: true,
    varyAxes: ['accent_intensity', 'spacing_density', 'radius', 'shadow_strength', 'border_visibility', 'hover_style', 'surface_opacity'],
    presetPool: presetPoolByMode[styleMode] || presetPoolByMode.next_variant,
    variantModes: ['minimal', 'clean_modern', 'premium', 'accent_focused'],
  };
}



function buildExecutorPrepFromDesignPolicy(policy, target = 'selected_element'){
  if (!policy) return null;
  const intents = Array.isArray(policy.intentTags) ? policy.intentTags : [];
  const preset = policy.recommendedPreset || (intents.includes('premium') ? 'premium' : intents.includes('minimal') ? 'minimal' : 'clean_modern');
  const applyPlan = [];
  const pushAxis = (axis, strategy, params = {}) => applyPlan.push({ axis, strategy, ...params });

  pushAxis('colors', 'harmonize_palette', {
    preserveSiteTheme: !!policy.preserveSiteTheme,
    useExistingThemeTokens: !!policy.useExistingThemeTokens,
    maxNewAccentColors: policy.maxNewAccentColors ?? 1,
  });

  if (intents.includes('contrast')) {
    pushAxis('contrast', 'increase_text_background_contrast', {
      minBody: policy?.contrast?.bodyTextMin || '4.5:1',
      minLarge: policy?.contrast?.largeTextMin || '3:1',
    });
  } else {
    pushAxis('contrast', 'normalize_accessible_contrast', {
      minBody: policy?.contrast?.bodyTextMin || '4.5:1',
      minLarge: policy?.contrast?.largeTextMin || '3:1',
    });
  }

  pushAxis('spacing', 'normalize_spacing_scale', {
    base: policy?.spacing?.system || '8px base',
    density: intents.includes('minimal') ? 'airy' : (intents.includes('neat') || intents.includes('clean')) ? 'balanced' : 'comfortable',
  });
  pushAxis('alignment', 'align_to_grid', { strict: !!(intents.includes('neat') || intents.includes('clean')) });

  if (intents.includes('soft')) pushAxis('shadow', 'soften_shadow', { strength: 'light', blur: 'medium' });
  else if (intents.includes('premium') || intents.includes('elegant')) pushAxis('shadow', 'refine_shadow', { strength: 'delicate', depth: 'premium' });
  else pushAxis('shadow', 'subtle_elevation', { strength: 'light' });

  if (intents.includes('contrast')) pushAxis('border', 'increase_surface_separation', { visibility: 'clear' });
  else if (intents.includes('minimal')) pushAxis('border', 'simplify_border', { visibility: 'low' });
  else pushAxis('border', 'clean_border', { visibility: 'soft' });

  if (intents.includes('modern') || intents.includes('stylish')) pushAxis('radius', 'modernize_radius', { profile: 'clean' });
  else if (intents.includes('elegant') || intents.includes('premium')) pushAxis('radius', 'refine_radius', { profile: 'balanced' });
  else pushAxis('radius', 'keep_consistent_radius', { profile: 'system' });

  pushAxis('hover', (intents.includes('stylish') || intents.includes('contrast')) ? 'enhance_hover_feedback' : 'keep_hover_subtle', { preset });

  return {
    kind: 'design_executor_prep',
    target,
    targetContext: policy.targetContext || 'element',
    preset,
    requestedIntents: intents,
    preserveSiteTheme: !!policy.preserveSiteTheme,
    preserveStructure: !!policy.preserveStructure,
    styleAxes: Array.isArray(policy.styleAxes) ? policy.styleAxes : ['colors','contrast','spacing','alignment','shadow','border','radius','hover'],
    applyPlan,
  };
}


function buildAtomicActionsFromApplyPlan(applyPlan = [], target = 'selected_element') {
  const actions = [];
  for (const step of (Array.isArray(applyPlan) ? applyPlan : [])) {
    const strategy = String(step?.strategy || '');
    const axis = String(step?.axis || '');
    if (!strategy && !axis) continue;
    if (strategy === 'harmonize_palette') {
      actions.push({ action: 'set_palette_policy', target, property: 'palette_policy', value: { mode: 'harmonize_with_site_theme', maxNewAccentColors: step?.maxNewAccentColors ?? 1, preserveSiteTheme: !!step?.preserveSiteTheme } });
      continue;
    }
    if (strategy === 'normalize_accessible_contrast' || strategy === 'increase_text_background_contrast') {
      actions.push({ action: 'set_contrast_policy', target, property: 'contrast_policy', value: { mode: strategy === 'increase_text_background_contrast' ? 'increase' : 'normalize', minBody: step?.minBody || '4.5:1', minLarge: step?.minLarge || '3:1' } });
      continue;
    }
    if (strategy === 'normalize_spacing_scale') {
      actions.push({ action: 'set_spacing_scale', target, property: 'spacing_scale', value: { system: step?.base || '8px base', density: step?.density || 'balanced' } });
      continue;
    }
    if (strategy === 'align_to_grid') {
      actions.push({ action: 'set_alignment_policy', target, property: 'alignment_policy', value: { mode: 'grid', strict: !!step?.strict } });
      continue;
    }
    if (['soften_shadow','refine_shadow','subtle_elevation'].includes(strategy)) {
      actions.push({ action: 'set_shadow_preset', target, property: 'shadow_preset', value: { preset: strategy, strength: step?.strength || null, depth: step?.depth || null, blur: step?.blur || null } });
      continue;
    }
    if (['clean_border','increase_surface_separation','simplify_border'].includes(strategy)) {
      actions.push({ action: 'set_border_preset', target, property: 'border_preset', value: { preset: strategy, visibility: step?.visibility || 'soft' } });
      continue;
    }
    if (['modernize_radius','refine_radius','keep_consistent_radius'].includes(strategy)) {
      actions.push({ action: 'set_radius_preset', target, property: 'radius_preset', value: { preset: strategy, profile: step?.profile || 'system' } });
      continue;
    }
    if (['enhance_hover_feedback','keep_hover_subtle'].includes(strategy)) {
      actions.push({ action: 'set_hover_preset', target, property: 'hover_preset', value: { preset: strategy, mode: step?.preset || null } });
      continue;
    }
    actions.push({ action: 'apply_style_strategy', target, property: axis || 'style_axis', value: { strategy, axis } });
  }
  return actions;
}

function attachExecutorAtomicActions(executorPrep = null, target = 'selected_element') {
  if (!executorPrep || typeof executorPrep !== 'object') return executorPrep;
  if (executorPrep.kind === 'design_executor_prep') {
    return {
      ...executorPrep,
      atomicActions: buildAtomicActionsFromApplyPlan(executorPrep.applyPlan, target),
    };
  }
  if (executorPrep.kind === 'retry_variant_executor_prep') {
    return {
      ...executorPrep,
      atomicActions: [
        { action: 'select_next_preset', target, property: 'preset', value: { preset: executorPrep.nextPreset || 'clean_modern', strategy: executorPrep.retryStrategy || 'pick_next_distinct_preset' } },
        ...((Array.isArray(executorPrep.mutateAxes) ? executorPrep.mutateAxes : []).map((item) => ({ action: 'vary_style_axis', target, property: item?.axis || 'style_axis', value: { axis: item?.axis || 'style_axis', mode: item?.mode || 'vary' } })))
      ],
    };
  }
  return executorPrep;
}


function buildApplyContractFromAtomicActions(atomicActions = [], target = 'selected_element', selectionSemantics = null){
  const operations = [];
  const applyTo = selectionSemantics?.applyTo || 'scope_resolved';
  const selectionMode = selectionSemantics?.mode || 'current_selection';
  for (const item of (Array.isArray(atomicActions) ? atomicActions : [])) {
    const action = String(item?.action || '');
    const value = item?.value || {};
    if (!action) continue;
    if (action === 'set_palette_policy') {
      operations.push({
        runtime: 'applyPalettePolicy',
        target,
        layer: 'surface',
        applyTo,
        selectionMode,
        payload: {
          mode: value?.mode || 'harmonize_with_site_theme',
          preserveSiteTheme: !!value?.preserveSiteTheme,
          maxNewAccentColors: value?.maxNewAccentColors ?? 1,
          tokenSource: 'site_theme',
        },
        fallbacks: ['keep_existing_theme_tokens'],
      });
      continue;
    }
    if (action === 'set_contrast_policy') {
      operations.push({
        runtime: 'applyContrastPolicy',
        target,
        layer: 'text_and_surface',
        applyTo,
        selectionMode,
        payload: {
          mode: value?.mode || 'normalize',
          minBody: value?.minBody || '4.5:1',
          minLarge: value?.minLarge || '3:1',
        },
        fallbacks: ['preserve_existing_palette'],
      });
      continue;
    }
    if (action === 'set_spacing_scale') {
      operations.push({
        runtime: 'applySpacingScale',
        target,
        layer: 'layout',
        applyTo,
        selectionMode,
        payload: {
          system: value?.system || '8px base',
          density: value?.density || 'balanced',
        },
        fallbacks: ['keep_current_layout_if_locked'],
      });
      continue;
    }
    if (action === 'set_alignment_policy') {
      operations.push({
        runtime: 'applyAlignmentPolicy',
        target,
        layer: 'layout',
        applyTo,
        selectionMode,
        payload: {
          mode: value?.mode || 'grid',
          strict: !!value?.strict,
        },
        fallbacks: ['keep_current_alignment_if_custom'],
      });
      continue;
    }
    if (action === 'set_shadow_preset') {
      operations.push({
        runtime: 'applyShadowPreset',
        target,
        layer: 'shadow',
        applyTo,
        selectionMode,
        payload: {
          preset: value?.preset || 'subtle_elevation',
          strength: value?.strength || null,
          depth: value?.depth || null,
          blur: value?.blur || null,
        },
        fallbacks: ['disable_shadow_if_not_supported'],
      });
      continue;
    }
    if (action === 'set_border_preset') {
      operations.push({
        runtime: 'applyBorderPreset',
        target,
        layer: 'border',
        applyTo,
        selectionMode,
        payload: {
          preset: value?.preset || 'clean_border',
          visibility: value?.visibility || 'soft',
        },
        fallbacks: ['use_soft_border'],
      });
      continue;
    }
    if (action === 'set_radius_preset') {
      operations.push({
        runtime: 'applyRadiusPreset',
        target,
        layer: 'shape',
        applyTo,
        selectionMode,
        payload: {
          preset: value?.preset || 'keep_consistent_radius',
          profile: value?.profile || 'system',
        },
        fallbacks: ['keep_existing_radius'],
      });
      continue;
    }
    if (action === 'set_hover_preset') {
      operations.push({
        runtime: 'applyHoverPreset',
        target,
        layer: 'interaction',
        applyTo,
        selectionMode,
        payload: {
          preset: value?.preset || 'keep_hover_subtle',
          mode: value?.mode || null,
        },
        fallbacks: ['keep_existing_hover'],
      });
      continue;
    }
    if (action === 'select_next_preset') {
      operations.push({
        runtime: 'selectNextPreset',
        target,
        layer: 'variant',
        applyTo,
        selectionMode,
        payload: {
          preset: value?.preset || 'clean_modern',
          strategy: value?.strategy || 'pick_next_distinct_preset',
        },
        fallbacks: ['reuse_current_preset_if_unique_not_found'],
      });
      continue;
    }
    if (action === 'vary_style_axis') {
      operations.push({
        runtime: 'varyStyleAxis',
        target,
        layer: 'variant',
        applyTo,
        selectionMode,
        payload: {
          axis: value?.axis || 'style_axis',
          mode: value?.mode || 'vary',
        },
        fallbacks: ['skip_axis_if_not_supported'],
      });
      continue;
    }
    if (action === 'set_background_value') {
      operations.push({ runtime: 'applyBackgroundValue', target, layer: 'surface', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_background'] });
      continue;
    }
    if (action === 'set_gradient_value') {
      operations.push({ runtime: 'applyGradientValue', target, layer: 'surface', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_background'] });
      continue;
    }
    if (action === 'set_text_color_value') {
      operations.push({ runtime: 'applyTextColorValue', target, layer: 'text', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_text_color'] });
      continue;
    }
    if (action === 'set_icon_color_value') {
      operations.push({ runtime: 'applyIconColorValue', target, layer: 'icon', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_icon_color'] });
      continue;
    }
    if (action === 'set_border_color_value') {
      operations.push({ runtime: 'applyBorderColorValue', target, layer: 'border', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_border'] });
      continue;
    }
    if (action === 'set_border_width_value') {
      operations.push({ runtime: 'applyBorderWidthValue', target, layer: 'border', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_border'] });
      continue;
    }
    if (action === 'set_border_style_value') {
      operations.push({ runtime: 'applyBorderStyleValue', target, layer: 'border', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_border'] });
      continue;
    }
    if (action === 'set_radius_value') {
      operations.push({ runtime: 'applyRadiusValue', target, layer: 'shape', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_existing_radius'] });
      continue;
    }
    if (action === 'set_shadow_value') {
      operations.push({ runtime: 'applyShadowValue', target, layer: 'shadow', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['disable_shadow_if_not_supported'] });
      continue;
    }
    if (action === 'set_text_shadow_value') {
      operations.push({ runtime: 'applyTextShadowValue', target, layer: 'text', applyTo, selectionMode, payload: { value, mode: item?.mode || 'set', state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_text_shadow'] });
      continue;
    }
    if (action === 'set_text_stroke_value') {
      operations.push({ runtime: 'applyTextStrokeValue', target, layer: 'text', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_text_stroke'] });
      continue;
    }
    if (action === 'set_opacity_value') {
      operations.push({ runtime: 'applyOpacityValue', target, layer: 'surface', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_opacity'] });
      continue;
    }
    if (action === 'set_blur_value') {
      operations.push({ runtime: 'applyBlurValue', target, layer: 'surface', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['preserve_existing_blur'] });
      continue;
    }
    if (action === 'set_spacing_value') {
      operations.push({ runtime: 'applySpacingValue', target, layer: 'layout', applyTo, selectionMode, payload: { property: item?.property || 'spacing', value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_current_layout_if_locked'] });
      continue;
    }
    if (action === 'set_dimension_value') {
      operations.push({ runtime: 'applyDimensionValue', target, layer: 'layout', applyTo, selectionMode, payload: { property: item?.property || 'dimension', value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_current_dimension_if_locked'] });
      continue;
    }
    if (action === 'adjust_numeric_style') {
      operations.push({ runtime: 'adjustNumericStyle', target, layer: 'layout', applyTo, selectionMode, payload: { property: item?.property || 'style_value', value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_current_value_if_unknown'] });
      continue;
    }
    if (action === 'set_text_align_value') {
      operations.push({ runtime: 'applyTextAlignValue', target, layer: 'text', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_existing_alignment'] });
      continue;
    }
    if (action === 'set_alignment_value_direct') {
      operations.push({ runtime: 'applyAlignmentValue', target, layer: 'layout', applyTo, selectionMode, payload: { property: item?.property || 'align_x', value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_existing_alignment'] });
      continue;
    }
    if (action === 'set_font_weight_value') {
      operations.push({ runtime: 'applyFontWeightValue', target, layer: 'text', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_existing_font_weight'] });
      continue;
    }
    if (action === 'set_text_case_value') {
      operations.push({ runtime: 'applyTextCaseValue', target, layer: 'text', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_existing_text_case'] });
      continue;
    }
    if (action === 'set_visibility_value') {
      operations.push({ runtime: 'applyVisibilityValue', target, layer: 'visibility', applyTo, selectionMode, payload: { value, state: item?.state || 'default', responsive: item?.responsive || 'all' }, fallbacks: ['keep_existing_visibility'] });
      continue;
    }
    operations.push({
      runtime: 'applyStyleStrategy',
      target,
      layer: 'generic',
      applyTo,
      selectionMode,
      payload: {
        action,
        property: item?.property || null,
        value,
      },
      fallbacks: [],
    });
  }
  return {
    kind: 'atomic_apply_contract',
    version: 1,
    target,
    selectionMode,
    applyTo,
    operations,
  };
}

function deriveApplyContract(executorPrep = null, target = 'selected_element', selectionSemantics = null){
  if (!executorPrep || typeof executorPrep !== 'object') return null;
  const atomicActions = Array.isArray(executorPrep?.atomicActions) ? executorPrep.atomicActions : [];
  if (!atomicActions.length) return null;
  return buildApplyContractFromAtomicActions(atomicActions, target, selectionSemantics);
}

function buildExecutorPrepFromRetryValue(value, target = 'selected_element') {
  if (!value || value.type !== 'retry_variant') return null;
  const presetPool = Array.isArray(value.presetPool) ? value.presetPool : ['clean_modern'];
  return {
    kind: 'retry_variant_executor_prep',
    target,
    styleMode: value.styleMode || 'next_variant',
    requestedIntents: Array.isArray(value.requestedIntents) ? value.requestedIntents : [],
    retryStrategy: value.retryStrategy || 'pick_next_distinct_preset',
    nextPreset: presetPool[0] || 'clean_modern',
    presetPool,
    preserveTheme: !!value.preserveTheme,
    preserveStructure: !!value.preserveStructure,
    mutateAxes: (Array.isArray(value.varyAxes) ? value.varyAxes : []).map((axis) => ({ axis, mode: 'vary' })),
  };
}


function buildDirectAtomicActions(finalAction, target = 'selected_element', property = null, value = null, state = 'default', responsive = 'all') {
  const base = { target, state, responsive };
  if (!finalAction) return [];
  if (finalAction === 'set_background') return [{ action: 'set_background_value', property: property || 'background', value, ...base }];
  if (finalAction === 'set_gradient') return [{ action: 'set_gradient_value', property: property || 'background_gradient', value, ...base }];
  if (finalAction === 'set_text_color') return [{ action: 'set_text_color_value', property: property || 'text_color', value, ...base }];
  if (finalAction === 'set_icon_color') return [{ action: 'set_icon_color_value', property: property || 'icon_color', value, ...base }];
  if (finalAction === 'set_border_color') return [{ action: 'set_border_color_value', property: property || 'border_color', value, ...base }];
  if (finalAction === 'set_border_style') return [{ action: 'set_border_style_value', property: property || 'border_style', value, ...base }];
  if (finalAction === 'set_border') return [{ action: 'set_border_width_value', property: property || 'border_width', value: value || { type: 'number', value: 1, unit: 'px', raw: '1px' }, ...base }];
  if (finalAction === 'set_radius') return [{ action: 'set_radius_value', property: property || 'radius', value, ...base }];
  if (finalAction === 'set_shadow') return [{ action: 'set_shadow_value', property: property || 'shadow_blur', value, ...base }];
  if (finalAction === 'set_text_shadow' || finalAction === 'remove_text_shadow') return [{ action: 'set_text_shadow_value', property: property || 'text_shadow', value, mode: finalAction === 'remove_text_shadow' ? 'remove' : 'set', ...base }];
  if (finalAction === 'set_text_stroke') return [{ action: 'set_text_stroke_value', property: property || 'text_stroke', value, ...base }];
  if (finalAction === 'set_opacity') return [{ action: 'set_opacity_value', property: property || 'opacity', value, ...base }];
  if (finalAction === 'adjust_opacity') {
    const delta = typeof value?.value === 'number' && Number.isFinite(value.value) ? value.value : 0.1;
    const mode = value?.mode === 'less_transparent' ? 'increase' : 'decrease';
    return [{ action: 'adjust_numeric_style', property: property || 'opacity', value: { type: 'number', mode, value: delta, unit: null, raw: value?.raw || (mode + ' opacity ' + Math.round(delta * 100) + '%') }, ...base }];
  }
  if (finalAction === 'set_blur') return [{ action: 'set_blur_value', property: property || 'blur', value, ...base }];
  if (['set_spacing','set_padding','set_margin','set_gap'].includes(finalAction)) return [{ action: 'set_spacing_value', property: property || (finalAction === 'set_gap' ? 'gap' : (finalAction === 'set_margin' ? 'margin' : (finalAction === 'set_padding' ? 'padding' : 'spacing'))), value, ...base }];
  if (['set_width','set_height'].includes(finalAction)) return [{ action: 'set_dimension_value', property: property || (finalAction === 'set_width' ? 'width' : 'height'), value, ...base }];
  if (finalAction in {'increase':1,'decrease':1}) return [{ action: 'adjust_numeric_style', property: property || 'style_value', value: { mode: finalAction, ...(value || {}) }, ...base }];
  if (finalAction === 'set_text_align') return [{ action: 'set_text_align_value', property: property || 'text_align', value, ...base }];
  if (finalAction === 'set_align_x' || finalAction === 'set_align_y') return [{ action: 'set_alignment_value_direct', property: property || (finalAction === 'set_align_x' ? 'align_x' : 'align_y'), value, ...base }];
  if (finalAction === 'set_font_weight') return [{ action: 'set_font_weight_value', property: property || 'font_weight', value, ...base }];
  if (finalAction === 'set_text_case') return [{ action: 'set_text_case_value', property: property || 'text_case', value, ...base }];
  if (finalAction === 'set_visibility') return [{ action: 'set_visibility_value', property: property || 'visibility', value, ...base }];
  return [];
}

function buildExecutorPrepFromDirectCommand(finalAction, finalTarget, finalProperty, finalValue, state = 'default', responsive = 'all') {
  const atomicActions = buildDirectAtomicActions(finalAction, finalTarget, finalProperty, finalValue, state, responsive);
  if (!atomicActions.length) return null;
  return {
    kind: 'direct_atomic_executor_prep',
    target: finalTarget,
    action: finalAction,
    state,
    responsive,
    atomicActions,
  };
}

function deriveExecutorPrep(finalAction, finalTarget, finalValue, clarify, finalProperty = null, state = 'default', responsive = 'all') {
  if (clarify?.designPolicy) return attachExecutorAtomicActions(buildExecutorPrepFromDesignPolicy(clarify.designPolicy, finalTarget), finalTarget);
  if (finalAction === 'retry_variant') return attachExecutorAtomicActions(buildExecutorPrepFromRetryValue(finalValue, finalTarget), finalTarget);
  return buildExecutorPrepFromDirectCommand(finalAction, finalTarget, finalProperty, finalValue, state, responsive);
}

async function parseSingleCommand(commandText, options = {}){
  const normalized = await normalizeCommandText(commandText);
  const tokens = tokenizeCommandText(normalized);
  const unknownLanguage = await detectUnknownLanguage(tokens);
  const baseCtx = { ...normalized, ...tokens, unknownLanguage, previousPropertyId: options.previousPropertyId || null, previousCommand: options.previousCommand || null, currentTargetId: options.currentTargetId || null };
  const resolvedAction = await resolveCommandAction(baseCtx);
  const action = resolvedAction?.primary ? resolvedAction : (options.inheritedAction ? { ...resolvedAction, primary: options.inheritedAction.primary, confidence: Math.max(resolvedAction.confidence || 0, 0.55), genericIntent: options.inheritedAction.genericIntent || resolvedAction.genericIntent } : resolvedAction);
  const scope = await resolveCommandScope(baseCtx);
  const target = await resolveCommandTarget({ ...baseCtx, action }, options);
  const value = await resolveCommandValue({ ...baseCtx, action, target });
  const property = await resolveCommandProperty({ ...baseCtx, action, target, value, scope });
  const state = await resolveCommandState(baseCtx);
  const responsive = await resolveCommandResponsive(baseCtx);
  let finalAction = finalizeActionId(action, property, value, normalized.normalizedText);
  const clarify = await clarifyCommandResolution({ ...baseCtx, action, target, property, value, scope, state, responsive });

  let confidence = averageConfidence([
    action.confidence,
    target.confidence,
    property.confidence,
    value.confidence,
    scope.confidence,
    state.confidence,
    responsive.confidence,
  ], 0.6);

  const finalTarget = deriveOutputTarget(target, property, state, normalized.normalizedText, options);
  let finalProperty = canonicalizePropertyId(property.primary?.id || null);
  let finalValue = finalAction === 'retry_variant'
    ? deriveRetryVariantValue(normalized.normalizedText)
    : ((finalAction === 'set_radius' && !buildFinalValue(value)) ? { type: 'relative_radius', raw: 'increase radius' } : buildFinalValue(value));

  // HOTFIX 00034: shadow intent wins over generic "додай/збільш" and gradient-adjustment heuristics.
  if (hasShadowIntentText(normalized.normalizedText)) {
    finalAction = isShadowRemovalText(normalized.normalizedText) ? 'set_shadow' : 'set_shadow';
    finalProperty = 'shadow_blur';
    finalValue = buildShadowIntentValue(value, normalized.normalizedText);
    confidence = Math.max(confidence, 0.9);
    if (clarify && clarify.needsClarify && clarify.ruleId === 'gradient_context_missing') {
      clarify.needsClarify = false;
      clarify.ruleId = null;
      clarify.question = null;
      clarify.options = [];
      clarify.severity = null;
    }
  }

  if (clarify?.designPolicy) {
    finalAction = 'set_design_policy';
    finalProperty = 'design_policy';
    finalValue = { type: 'design_policy', ...clarify.designPolicy };
    confidence = Math.max(confidence, 0.76);
  }
  const executorPrep = deriveExecutorPrep(finalAction, finalTarget, finalValue, clarify, finalProperty, state.primary?.id || 'default', responsive.primary?.id || 'all');
  const selectionSemantics = deriveSelectionSemantics(scope);
  const applyContract = deriveApplyContract(executorPrep, finalTarget, selectionSemantics);

  return {
    sourceText: commandText,
    normalizedText: normalized.normalizedText,
    action,
    target,
    property,
    value,
    scope,
    state,
    responsive,
    tokenization: tokens,
    confidence,
    command: {
      action: finalAction,
      target: finalTarget,
      property: finalProperty,
      value: finalValue,
      scope: canonicalizeScopeId(scope.primary?.id || 'selected_element'),
      state: state.primary?.id || 'default',
      responsive: responsive.primary?.id || 'all',
      selectionSemantics,
      confidence,
      needsClarify: !!clarify.needsClarify,
      clarify,
      executorPrep,
      applyContract,
    },
    normalizeMeta: {
      phraseCorrections: normalized.phraseCorrections,
      typoCorrections: normalized.typoCorrections,
      removedNoise: normalized.removedNoise,
      wordFormHits: normalized.wordFormHits,
      unknownTokens: unknownLanguage.tokens,
      unknownPhrases: unknownLanguage.phrases,
    },
  };
}

export async function parseAiCommand(sourceText, options = {}){
  const normalized = await normalizeCommandText(sourceText);
  const plan = await buildCommandPlan(normalized, options);
  const segments = plan.length ? plan : [{ index: 0, text: normalized.normalizedText }];
  const parsed = [];
  let inheritedAction = null;
  let currentTargetId = options.currentTargetId || null;
  let previousPropertyId = null;
  let previousCommand = null;
  for (const segment of segments) {
    const parsedSegment = await parseSingleCommand(segment.text, { ...options, currentTargetId, inheritedAction, previousPropertyId, previousCommand });
    parsed.push(parsedSegment);
    if (parsedSegment?.action?.primary) inheritedAction = parsedSegment.action;
    if (parsedSegment?.target?.explicitTarget?.id) currentTargetId = parsedSegment.target.explicitTarget.id;
    previousPropertyId = parsedSegment?.property?.primary?.id || previousPropertyId;
    previousCommand = parsedSegment?.command || previousCommand;
  }

  const commands = parsed.map((item) => item.command);
  const warnings = [];
  const errors = [];
  for (const item of parsed) {
    if (item.command.needsClarify && item.command.clarify?.question) warnings.push(item.command.clarify.question);
  }

  const assistantMessage = warnings[0] || null;
  return {
    ok: !warnings.some(Boolean),
    sourceText: String(sourceText || ''),
    normalizedText: normalized.normalizedText,
    commands,
    warnings,
    errors,
    assistantMessage,
    diagnostics: parsed,
  };
}
