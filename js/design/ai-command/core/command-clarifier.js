import { loadAiCommandData } from './manifest-loader.js';

const DESIGN_INTENT_PATTERNS = {
  beautiful: /(красив|гарн|приємн.*вигляд|естетичн)/u,
  neat: /(акурат|охайн|упорядк|охайніш)/u,
  modern: /(сучас|modern)/u,
  stylish: /(стильн|fashion|sleek)/u,
  original: /(оригінальн|креативн|унікальн|нестандарт)/u,
  premium: /(преміальн|luxury|елітн|дорог(о|ий|им)|дорожч.*вигляд)/u,
  minimal: /(мінімаліст|minimal|мінімал)/u,
  elegant: /(елегант|вишукан|витончен)/u,
  clean: /(чисто|чистіш|cleaner|clean modern)/u,
  soft: /(м[’'\s]?як|soft|мягк)/u,
  contrast: /(контрастніш|контрастн|виразніш)/u,
};

function detectDesignIntents(text){
  const raw = String(text || '');
  const intents = [];
  for (const [id, re] of Object.entries(DESIGN_INTENT_PATTERNS)) {
    if (re.test(raw)) intents.push(id);
  }
  return intents;
}

function buildBaseDesignPolicy(targetId = 'selected_element'){
  return {
    policyType: 'design_refinement',
    targetContext: /menu|menu_block|mega_panel/u.test(String(targetId || '')) ? 'menu' : 'element',
    preserveSiteTheme: true,
    preserveStructure: true,
    useExistingThemeTokens: true,
    maxNewAccentColors: 1,
    contrast: {
      bodyTextMin: '4.5:1',
      largeTextMin: '3:1',
      keepTextReadable: true,
    },
    spacing: {
      system: '8px base',
      keepConsistentRhythm: true,
    },
    styleAxes: ['colors', 'contrast', 'spacing', 'alignment', 'shadow', 'border', 'radius', 'hover'],
  };
}

function buildDesignPolicyObject(intents = [], targetId = 'selected_element'){
  const normalized = Array.from(new Set(intents));
  const policy = buildBaseDesignPolicy(targetId);
  policy.intentTags = normalized;
  policy.criteria = [];
  policy.variantModes = ['minimal', 'clean_modern', 'premium', 'accent_focused'];
  if (normalized.includes('beautiful')) {
    policy.criteria.push('нормальне поєднання кольорів і тексту', 'гармонійна палітра', 'контрастний текст', 'легка сучасна тінь', 'акуратні бордери');
    policy.recommendedPreset = 'clean_modern';
  }
  if (normalized.includes('neat') || normalized.includes('clean')) {
    policy.criteria.push('акуратне вирівнювання', 'правильні відступи', 'менше візуального шуму', 'однакова висота пунктів');
    policy.recommendedPreset = policy.recommendedPreset || 'minimal';
  }
  if (normalized.includes('modern')) {
    policy.criteria.push('сучасний radius', 'чисті поверхні', 'стриманий accent', 'узгодження з темою сайту');
    policy.recommendedPreset = 'clean_modern';
  }
  if (normalized.includes('stylish')) {
    policy.criteria.push('виразні hover-стани', 'акуратна типографіка', 'делікатна глибина');
    policy.recommendedPreset = policy.recommendedPreset || 'accent_focused';
  }
  if (normalized.includes('original')) {
    policy.criteria.push('нестандартний але читабельний характер', 'не ламати тему сайту', 'обережно варіювати форму і акцент');
    policy.recommendedPreset = policy.recommendedPreset || 'accent_focused';
  }
  if (normalized.includes('premium') || normalized.includes('elegant')) {
    policy.criteria.push('спокійна палітра', 'делікатна тінь', 'чистий бордер', 'дорогий але не кричущий вигляд');
    policy.recommendedPreset = 'premium';
  }
  if (normalized.includes('minimal')) {
    policy.criteria.push('менше кольорів', 'менше декоративності', 'більше повітря', 'простий бордер');
    policy.recommendedPreset = 'minimal';
  }
  if (normalized.includes('soft')) {
    policy.criteria.push('м’яка тінь', 'м’які бордери', 'спокійніші переходи', 'м’якіший контраст акцентів');
  }
  if (normalized.includes('contrast')) {
    policy.criteria.push('сильніший контраст тексту і фону', 'виразніші активні стани', 'чіткіший поділ поверхонь');
  }
  policy.criteria = Array.from(new Set(policy.criteria));
  policy.retryPolicy = {
    preserveTheme: true,
    preserveStructure: true,
    varyAxes: ['accent_intensity', 'spacing_density', 'radius', 'shadow_strength', 'border_visibility', 'hover_style', 'surface_opacity'],
    avoidRepeatingPreviousVariant: true,
  };
  return policy;
}

function buildDesignClarify(intents = [], targetId = 'selected_element'){
  const normalized = Array.from(new Set(intents));
  const targetLabel = /menu|menu_block|mega_panel/u.test(String(targetId || '')) ? 'меню' : 'елемент';
  const designPolicy = buildDesignPolicyObject(normalized, targetId);
  if (normalized.includes('beautiful') && normalized.includes('neat')) {
    return {
      needsClarify: true,
      ruleId: 'clarify_design_beautify_neaten',
      question: `Що саме покращити в ${targetLabel}: поєднання кольорів і контраст, акуратне вирівнювання та відступи, легку тінь, красиві бордери чи узгодження з основним стилем сайту?`,
      options: ['кольори і контраст', 'вирівнювання і відступи', 'легка тінь', 'бордери', 'узгодити з темою сайту'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('beautiful')) {
    return {
      needsClarify: true,
      ruleId: 'clarify_design_beautify',
      question: `Що саме зробити красивішим у ${targetLabel}: кольори і контраст, відступи, легку тінь, бордери чи загальну узгодженість із темою сайту?`,
      options: ['кольори і контраст', 'відступи', 'легка тінь', 'бордери', 'узгодити з темою сайту'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('neat') || normalized.includes('clean')) {
    return {
      needsClarify: true,
      ruleId: normalized.includes('clean') ? 'clarify_design_clean' : 'clarify_design_neat',
      question: `Що саме зробити акуратнішим у ${targetLabel}: вирівнювання, відступи, однакову висоту пунктів, чистіший бордер чи спокійнішу тінь?`,
      options: ['вирівнювання', 'відступи', 'однакова висота пунктів', 'чистіший бордер', 'спокійніша тінь'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('modern') || normalized.includes('minimal')) {
    return {
      needsClarify: true,
      ruleId: normalized.includes('minimal') ? 'clarify_design_minimal' : 'clarify_design_modern',
      question: `Який сучасний стиль потрібен для ${targetLabel}: мінімалістичний, clean modern, premium чи accent focused?`,
      options: ['minimal', 'clean modern', 'premium', 'accent focused'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('stylish') || normalized.includes('elegant')) {
    return {
      needsClarify: true,
      ruleId: normalized.includes('elegant') ? 'clarify_design_elegant' : 'clarify_design_stylish',
      question: `Що саме підкреслити, щоб ${targetLabel} виглядав стильніше: кольори, типографіку, тінь, бордери чи hover-стани?`,
      options: ['кольори', 'типографіка', 'тінь', 'бордери', 'hover-стани'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('original')) {
    return {
      needsClarify: true,
      ruleId: 'clarify_design_original',
      question: `У чому зробити ${targetLabel} оригінальнішим: у формі, кольоровому акценті, композиції, hover-ефектах чи бордерах?`,
      options: ['форма', 'кольоровий акцент', 'композиція', 'hover-ефекти', 'бордери'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('premium')) {
    return {
      needsClarify: true,
      ruleId: 'clarify_design_premium',
      question: `Що саме зробити преміальнішим у ${targetLabel}: поверхню, тінь, бордер, відступи чи accent?`,
      options: ['поверхню', 'тінь', 'бордер', 'відступи', 'accent'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('soft')) {
    return {
      needsClarify: true,
      ruleId: 'clarify_design_soft',
      question: `Що саме зробити м’якшим у ${targetLabel}: тінь, бордери, radius, палітру чи hover-переходи?`,
      options: ['тінь', 'бордери', 'radius', 'палітру', 'hover-переходи'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  if (normalized.includes('contrast')) {
    return {
      needsClarify: true,
      ruleId: 'clarify_design_contrast',
      question: `Що саме зробити контрастнішим у ${targetLabel}: текст і фон, кнопки, активні стани чи межі поверхонь?`,
      options: ['текст і фон', 'кнопки', 'активні стани', 'межі поверхонь'],
      criteria: designPolicy.criteria,
      designPolicy,
      severity: 'medium',
    };
  }
  return null;
}

function looksLikeDesignRefinement(text){
  const raw = String(text || '');
  return /(дизайн|вигляд|оформлен|стиль|theme|тема|меню|кнопк|header|footer|sidebar|card|block|блок|секц)/u.test(raw)
    && detectDesignIntents(raw).length > 0;
}

function hasSiteThemeHarmonyConstraint(text){
  const raw = String(text || '');
  return /(узгодж\w*\s+з\s+тем(ою|и)\s+сайту|узгодж\w*\s+із\s+тем(ою|и)\s+сайту|з\s+тем(ою|и)\s+сайту|в\s+стилі\s+сайту|під\s+тем(у|ою)\s+сайту|match(?:ing)?\s+site\s+theme)/u.test(raw);
}

function isSetLike(actionId, intent){
  return ['set', 'apply', 'generic_set'].includes(intent) || String(actionId || '').startsWith('set_') || actionId === 'apply';
}

export async function clarifyCommandResolution(ctx){
  const [clarifyRules, capabilities] = await Promise.all([
    loadAiCommandData('clarify-rules.json'),
    loadAiCommandData('object-capabilities.json'),
  ]);
  const actionId = ctx?.action?.primary?.id || '';
  const intent = ctx?.action?.genericIntent || 'set';
  const propertyId = ctx?.property?.primary?.id || '';
  const targetId = ctx?.target?.primary?.id || '';
  const valueType = ctx?.value?.primaryType || 'none';
  const capability = (Array.isArray(capabilities) ? capabilities : []).find((item) => item.targetId === targetId) || null;
  const text = String(ctx?.normalizedText || '');
  const hasExplicitTarget = !!ctx?.target?.explicitTarget;

  const unknownPhrases = Array.isArray(ctx?.unknownLanguage?.phrases) ? ctx.unknownLanguage.phrases : [];
  const unknownTokens = Array.isArray(ctx?.unknownLanguage?.tokens) ? ctx.unknownLanguage.tokens : [];
  const shouldClarifyUnknown = unknownPhrases.length > 0 || (unknownTokens.length >= 2 && (!propertyId || !hasExplicitTarget || valueType === 'none'));
  if (shouldClarifyUnknown) {
    const samples = (unknownPhrases.length ? unknownPhrases : unknownTokens.slice(0, 2)).slice(0, 2);
    const formatted = samples.map((item) => `"${item}"`).join(' і ');
    return {
      needsClarify: true,
      ruleId: 'unknown_terms',
      question: `На жаль, я не розумію, що означає ${formatted}. Переформулюй, будь ласка, зрозуміліше своє запитання або пропозицію.`,
      options: ['переформулювати команду', 'уточнити значення', 'вказати точніше'],
      severity: 'high',
    };
  }

  if (actionId === 'retry_variant') {
    return { needsClarify: false, ruleId: null, question: null, options: [], severity: null };
  }

  const designIntents = detectDesignIntents(text);
  if (looksLikeDesignRefinement(text)) {
    const designClarify = buildDesignClarify(designIntents, targetId);
    if (designClarify) return designClarify;
  }

  if (valueType === 'visibility' && propertyId === 'visibility') {
    return { needsClarify: false, ruleId: null, question: null, options: [], severity: null };
  }

  if (!ctx?.action?.primary) {
    return {
      needsClarify: true,
      ruleId: 'missing_action',
      question: 'Що саме потрібно зробити: змінити, збільшити, зменшити, вирівняти чи створити?',
      options: ['змінити', 'збільшити', 'зменшити', 'вирівняти', 'створити'],
      severity: 'high',
    };
  }


  if ((ctx?.value?.primaryType === 'gradient_adjustment') && !/(градієнт|gradient)/u.test(text)) {
    return {
      needsClarify: true,
      ruleId: 'gradient_context_missing',
      question: 'Де саме змінити частку цього кольору: у фоні, градієнті чи іншому елементі?',
      options: ['фон', 'градієнт', 'текст', 'активний елемент'],
      severity: 'medium',
    };
  }

  if ((ctx?.value?.primaryType === 'relative_color')) {
    return {
      needsClarify: true,
      ruleId: 'relative_color_adjustment',
      question: 'Наскільки темнішим або світлішим потрібно зробити колір?',
      options: ['трішки', 'на 10%', 'на 20%', 'авто'],
      severity: 'medium',
    };
  }

  if (isSetLike(actionId, intent) && valueType === 'gradient' && !hasExplicitTarget && !ctx?.currentTargetId && !/(його|її|цей|цю|цей\s+елемент|активн(?:ий|ого)\s+елемент|фон|background|текст|text|кнопк|button|menu|mega|header|footer|секц|container)/u.test(text)) {
    return {
      needsClarify: true,
      ruleId: 'missing_gradient_target',
      question: 'Куди застосувати градієнт?',
      options: ['фон', 'текст', 'активний елемент'],
      severity: 'high',
    };
  }

  if (isSetLike(actionId, intent) && valueType === 'color' && !hasExplicitTarget && !propertyId && !/(фон|background|текст|іконк|icon|label|напис|border|рамк|тінь|shadow)/u.test(text)) {
    const rule = (Array.isArray(clarifyRules) ? clarifyRules : []).find((item) => item.id === 'clarify_color_target');
    return {
      needsClarify: true,
      ruleId: rule?.id || 'clarify_color_target',
      question: rule?.question || 'Що саме зробити кольоровим: фон, текст чи іконку?',
      options: rule?.options || ['фон', 'текст', 'іконку', 'усе'],
      severity: rule?.severity || 'high',
    };
  }


  if (isSetLike(actionId, intent) && valueType === 'color' && !hasExplicitTarget && propertyId === 'background_color' && !/(фон|background|текст|іконк|icon|label|напис|border|рамк|тінь|shadow|gradient|градієнт)/u.test(text)) {
    const rule = (Array.isArray(clarifyRules) ? clarifyRules : []).find((item) => item.id === 'clarify_color_target');
    return {
      needsClarify: true,
      ruleId: rule?.id || 'clarify_color_target',
      question: rule?.question || 'Що саме зробити кольоровим: фон, текст чи іконку?',
      options: rule?.options || ['фон', 'текст', 'іконку', 'усе'],
      severity: rule?.severity || 'high',
    };
  }

  if (isSetLike(actionId, intent) && !propertyId && valueType === 'color') {
    const rule = (Array.isArray(clarifyRules) ? clarifyRules : []).find((item) => item.id === 'clarify_color_target');
    return {
      needsClarify: true,
      ruleId: rule?.id || 'clarify_color_target',
      question: rule?.question || 'Що саме зробити кольоровим: фон, текст чи іконку?',
      options: rule?.options || ['фон', 'текст', 'іконку', 'усе'],
      severity: rule?.severity || 'high',
    };
  }

  const defaultDeltaProps = ['font_size', 'icon_size', 'border_radius', 'padding', 'margin', 'gap', 'offset_x', 'offset_y', 'width', 'height', 'line_height', 'letter_spacing'];
  if ((((intent === 'increase' || intent === 'decrease') && defaultDeltaProps.includes(propertyId)) || (((propertyId === 'line_height' || propertyId === 'letter_spacing') && /(збільш|зменш|більш|менш)/u.test(text))) || ((propertyId === 'width' || propertyId === 'height') && /(збільш|зменш|ширш|вужч|вищ|нижч|розшир|звуз|стисн|розтягн)/u.test(text)) || ((propertyId === 'font_weight') && /(жирніш|тонш)/u.test(text)) || (actionId === 'set_radius' && propertyId === 'border_radius') || ['rotation','flip_x','flip_y','offset_x','offset_y','align_x','align_y'].includes(propertyId))) {
    return {
      needsClarify: false,
      ruleId: null,
      question: null,
      options: [],
      severity: null,
    };
  }

  if ((intent === 'increase' || intent === 'decrease' || isSetLike(actionId, intent)) && valueType === 'none' && !/(hover|default|desktop|mobile)/u.test(String(ctx?.normalizedText || ''))) {
    return {
      needsClarify: true,
      ruleId: 'missing_value',
      question: 'Яке саме значення потрібно поставити або змінити?',
      options: ['колір', 'градієнт', 'розмір', 'прозорість', 'тінь'],
      severity: 'medium',
    };
  }

  if (propertyId === 'text_case') {
    return { needsClarify: false, ruleId: null, question: null, options: [], severity: null };
  }

  if (capability && propertyId && !['rotation','flip_x','flip_y','offset_x','offset_y'].includes(propertyId) && Array.isArray(capability.allowedProperties) && !capability.allowedProperties.includes(propertyId)) {
    return {
      needsClarify: true,
      ruleId: 'unsupported_property',
      question: `Для елемента "${targetId}" властивість "${propertyId}" не виглядає дозволеною. Змінити інший параметр?`,
      options: capability.allowedProperties.slice(0, 6),
      severity: 'medium',
    };
  }

  return {
    needsClarify: false,
    ruleId: null,
    question: null,
    options: [],
    severity: null,
  };
}
