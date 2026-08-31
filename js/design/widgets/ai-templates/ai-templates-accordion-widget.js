// js/design/widgets/ai-templates/ai-templates-accordion-widget.js
// Окремий акордеон "Шаблони AI" у кінці інспектора.
// V1.2: demo planner + контекст + дія + уточнення recipe.

import { buildAiTemplateRecipe } from './ai-templates-engine.js';
import { applyAiTemplateRecipe } from './ai-templates-apply.js';
import { parseAiCommand } from '../../ai-command/core/command-parser.js';
import { executeParsedAiCommand } from '../../ai-command/runtime/ai-command-runtime-executor.js';
import { executeSelectionCommand, isSelectionCommandPrompt, parseSelectionCommand, previewSelectionCommand } from '../../ai-command/selection/selection-command-layer.js';
import { createBuilderRuntimeContext, getSelectionSnapshot } from '../../ai-command/runtime/ai-command-runtime-context.js';
import { galFindBestAiAssets, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';
import {
  appendAiRuntimeDebugReport,
  consumePendingVoiceCommandDebugDetails,
  isAiRuntimeDebugEnabled,
  setAiRuntimeDebugEnabled,
} from '../../ai-command/runtime/ai-command-debug-store.js';

const SEC_ID = 'st-ai-templates-accordion';
const LS_KIND = 'st_ai_templates_kind_v1';
const LS_PROMPT = 'st_ai_templates_prompt_v1';
const LS_CONTEXT = 'st_ai_templates_context_v11';
const LS_ACTION = 'st_ai_templates_action_v11';
const LS_TARGET_SCOPE = 'st_ai_templates_target_scope_v69';
const LS_FIX = 'st_ai_templates_fix_v11';

function aiAssetNorm_(value){
  return String(value || '').toLowerCase().replace(/[ґ]/g, 'г').replace(/\s+/g, ' ').trim();
}
function aiAssetHasAny_(text, list){
  const src = aiAssetNorm_(text);
  return (list || []).some(token => src.includes(aiAssetNorm_(token)));
}
function aiAssetPickColor_(text){
  const colors = aiAssetPickColors_(text);
  return colors[0] || '';
}
function aiAssetPickColors_(text){
  const src = aiAssetNorm_(text);
  const combos = [
    ['green-white', ['зеленобілий','зелено білий','зелено-білий','біло зелений','біло-зелений','білозелений','green white','green-white','white green','white-green']],
    ['green-yellow', ['зеленожовтий','зелено жовтий','зелено-жовтий','жовто зелений','жовто-зелений','жовтозелений','yellow green','yellow-green','green yellow','green-yellow','lime green']],
    ['blue-white', ['синьобілий','синьо білий','синьо-білий','біло синій','біло-синій','білосиній','блакитно білий','блакитно-білий','blue white','blue-white','white blue','white-blue']],
    ['blue-black', ['синьочорний','синьо чорний','синьо-чорний','чорно синій','чорно-синій','чорносиній','blue black','blue-black','black blue','black-blue']],
    ['red-orange', ['червоно помаранчевий','червоно-помаранчевий','помаранчево червоний','помаранчево-червоний','red orange','red-orange','orange red','orange-red']],
    ['black-white', ['чорно білий','чорно-білий','біло чорний','біло-чорний','black white','black-white','white black','white-black']],
    ['black-gold', ['чорно золотий','чорно-золотий','золото чорний','золото-чорний','black gold','black-gold','gold black','gold-black']]
  ];
  const singles = [
    ['green', ['green','зелений','зелена','зеленим','зеленого','зелені','зелень','трава','трав','lime']],
    ['blue', ['blue','синій','синя','синім','синього','сині','голубий','голуба','блакитний','блакитна','cyan']],
    ['yellow', ['yellow','жовтий','жовта','жовтим','жовтого','жовті','gold','golden','золот','лайм']],
    ['red', ['red','червоний','червона','червоним','червоного','червоні']],
    ['orange', ['orange','помаранчевий','помаранчева','помаранчевим','оранжевий']],
    ['purple', ['purple','фіолетовий','фіолетова','фіолетовим','ліловий','lilac']],
    ['black', ['black','чорний','чорна','чорним','темний','темна']],
    ['white', ['white','білий','біла','білим','білого','білі','біло','світлий','світла']],
    ['gray', ['gray','grey','сірий','сіра','сірим','срібний','нейтральний']],
    ['brown', ['brown','коричневий','коричнева','дерев']],
    ['beige', ['beige','бежевий','бежевим','кремовий']]
  ];

  const out = [];
  const push = (value) => {
    if (value && !out.includes(value)) out.push(value);
  };

  for (const [combo, words] of combos) {
    if (words.some(token => src.includes(aiAssetNorm_(token)))) {
      push(combo);
      combo.split('-').forEach(push);
    }
  }

  for (const [color, words] of singles) {
    if (words.some(token => src.includes(aiAssetNorm_(token)))) push(color);
  }

  return out;
}
function aiAssetExtractTerms_(text, dict){
  const out = [];
  for (const [key, words] of Object.entries(dict || {})) {
    if (aiAssetHasAny_(text, words)) out.push(key);
  }
  return Array.from(new Set(out));
}
function aiAssetPromptBrief_(prompt){
  const raw = String(prompt || '');
  const text = aiAssetNorm_(raw);
  if (!text) return null;

  const explicitAssetIntent = aiAssetHasAny_(text, [
    'фон','фону','фоном','background','бекграунд','зображення','картинку','картинка','фото',
    'підбери','підбрати','вибери','вибрати','постав','застосуй','застосувати','додай фон','обери'
  ]);
  if (!explicitAssetIntent) return null;

  const role = aiAssetHasAny_(text, ['лого','логотип']) ? 'logo'
    : aiAssetHasAny_(text, ['іконк','icon']) ? 'icon'
    : aiAssetHasAny_(text, ['картинк','зображення','фото']) && !aiAssetHasAny_(text, ['фон','фону','background','бекграунд']) ? 'image'
    : 'background';

  const themeDict = {
    education: ['education','освіт','навчан','університет','курс','академ'],
    science: ['science','наук','лаборатор','дослідж'],
    school: ['school','школ','клас','вчител','учн'],
    business: ['business','бізнес','компан','офіс','корпорат'],
    technology: ['technology','технолог','техно','digital','it ','айті','software','сервіс'],
    future: ['future','майбутн','футур'],
    space: ['space','космос','галактик','зор','планет','астро'],
    nature: ['nature','природ','трава','ліс','еко','зелень','квіт','дерев'],
    medical: ['medical','мед','клінік','лікар','health'],
    finance: ['finance','фінанс','банк','інвест','крипт','грош'],
    sport: ['sport','спорт','футбол','баскет','fitness','трен'],
    legal: ['legal','юрид','law','адвокат'],
    construction: ['construction','будів','ремонт','архітект'],
    restaurant: ['restaurant','рестор','кафе','їжа','food','menu'],
    travel: ['travel','подорож','тур','готель','hotel'],
    beauty: ['beauty','краса','салон','spa','космет'],
    fashion: ['fashion','мода','одяг','boutique'],
    portfolio: ['portfolio','портфоліо','кейс'],
    ecommerce: ['ecommerce','shop','store','магазин','товар'],
    kids: ['kids','діт','дитяч','малюк'],
    ai: [' ai','штучн','нейромереж','gpt'],
    startup: ['startup','стартап'],
    industrial: ['industrial','виробниц','завод','промисл'],
    agriculture: ['agriculture','агро','сільськ','ферм']
  };
  const styleDict = {
    modern: ['modern','сучасн'], classic: ['classic','класичн'], elegant: ['elegant','елегант'],
    luxury: ['luxury','преміум','розкіш'], minimal: ['minimal','мінімал'], corporate: ['corporate','корпорат'],
    clean: ['clean','чист'], futuristic: ['futuristic','футурист'], creative: ['creative','креатив'],
    artistic: ['artistic','арт','худож'], playful: ['playful','ігров','весел'], technical: ['technical','техніч'],
    soft: ['soft','мякий','ніжн','спокійн'], bold: ['bold','смілив','яскрав'], formal: ['formal','офіційн'], informal: ['informal','неформ']
  };
  const moodDict = {
    calm: ['calm','спокійн'], energetic: ['energetic','енергійн','динаміч'], inspiring: ['inspiring','надих'],
    serious: ['serious','серйозн'], friendly: ['friendly','дружн','привітн'], warm: ['warm','тепл'], cold: ['cold','холодн'],
    premium: ['premium','преміум'], trustworthy: ['trustworthy','надійн','довір'], smart: ['smart','розумн','інтелект'],
    safe: ['safe','безпеч'], optimistic: ['optimistic','оптиміст'], professional: ['professional','професійн'], emotional: ['emotional','емоційн']
  };
  const themes = aiAssetExtractTerms_(text, themeDict);
  const styles = aiAssetExtractTerms_(text, styleDict);
  const moods = aiAssetExtractTerms_(text, moodDict);
  const colors = aiAssetPickColors_(text);
  const usage = aiAssetHasAny_(text, ['шапк','header','меню']) ? 'header'
    : aiAssetHasAny_(text, ['секці','section']) ? 'section-background'
    : aiAssetHasAny_(text, ['фон сайту','фон сайта','фон сторінки','page background']) ? 'page-background'
    : aiAssetHasAny_(text, ['банер','banner']) ? 'banner'
    : aiAssetHasAny_(text, ['футер','footer']) ? 'footer'
    : aiAssetHasAny_(text, ['hero','головний екран','перший екран']) ? 'hero'
    : role === 'logo' ? 'logo-area'
    : role === 'icon' ? 'icon'
    : 'hero';
  const textMode = aiAssetHasAny_(text, ['світлий текст','білий текст','white text']) ? 'light'
    : aiAssetHasAny_(text, ['темний текст','чорний текст','dark text']) ? 'dark'
    : '';
  const cat = role === 'logo' ? 'logos' : role === 'icon' ? 'icons' : 'images';
  return {
    prompt: raw,
    role,
    cat,
    criteria: {
      role,
      theme: themes,
      style: styles,
      mood: moods,
      color: colors,
      usage: [usage],
      textMode,
      preferClean: true
    },
    human: {
      theme: themes.join(', ') || '—',
      style: styles.join(', ') || '—',
      mood: moods.join(', ') || '—',
      color: colors.join(', ') || '—',
      usage,
      textMode: textMode || 'auto'
    }
  };
}
function normalizeAiAssetUrl_(url){
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(blob:|data:|https?:|file:)/i.test(raw)) return raw;
  try { return new URL(raw.replace(/^\.\//, ''), window.location.href).href; } catch(e) { return raw; }
}
function aiAssetIsApplicableAsFill_(item){
  const role = String(item?.assetRole || item?.type || item?.role || '').toLowerCase();
  return role === 'background' || role === 'image';
}
function aiAssetFillDetail_(item, draft){
  const url = normalizeAiAssetUrl_(galMakeObjectUrl(item) || item?.url || item?.path || '');
  return {
    source: 'ai-chat-auto-selected-asset',
    itemId: item?.id || '',
    name: item?.name || item?.title || '',
    title: item?.title || item?.name || '',
    path: item?.path || item?.url || '',
    url,
    mime: item?.mime || '',
    assetRole: item?.assetRole || item?.type || draft?.brief?.role || 'background',
    aiMatch: item?._aiMatch || null,
    fit: 'cover',
    position: 'center center',
    opacity: 1,
    gray: 0,
  };
}
function aiAssetDraftHtml_(draft){
  const esc = (value) => String(value ?? '').replace(/[<>&"']/g, (ch) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#039;'}[ch]));
  if (!draft) return '<div class="st-ai-empty">AI-ассет не підготовлено.</div>';
  const item = draft.item || null;
  const score = Number(item?._aiMatch?.score || 0);
  const reasons = Array.isArray(item?._aiMatch?.topReasons) ? item._aiMatch.topReasons : [];
  const h = draft.brief?.human || {};
  const thumb = item ? normalizeAiAssetUrl_(galMakeObjectUrl(item) || item.url || item.path || '') : '';
  return `
    <div class="st-ai-plan st-ai-asset-plan">
      <div class="st-ai-plan__title">AI-підбір ассета готовий</div>
      <div class="st-ai-plan__target"><b>Тип:</b> ${esc(draft.brief?.role || 'asset')} · <b>Застосування:</b> ${esc(h.usage || 'hero')}</div>
      <div class="st-ai-plan__target"><b>Тема:</b> ${esc(h.theme || '—')} · <b>Стиль:</b> ${esc(h.style || '—')} · <b>Настрій:</b> ${esc(h.mood || '—')} · <b>Колір:</b> ${esc(h.color || '—')}</div>
      ${item ? `<div class="st-ai-plan__summary"><b>Обрано:</b> ${esc(item.title || item.name || item.id)} · AI ${score}/100</div>` : `<div class="st-ai-plan__warn">Підходящих системних ассетів не знайдено.</div>`}
      ${thumb ? `<div class="st-ai-asset-preview-thumb"><img src="${esc(thumb)}" alt=""></div>` : ''}
      ${reasons.length ? `<div class="st-ai-plan__note">${reasons.map(r => `<span class="st-ai-pill">${esc(r)}</span>`).join('')}</div>` : ''}
      <div class="st-ai-empty">Натисни «Застосувати», щоб поставити вибраний фон/картинку на активний блок або секцію. Галерею відкривати не потрібно.</div>
    </div>
  `;
}

function loadKind(){
  try {
    const raw = String(localStorage.getItem(LS_KIND) || 'button');
    if (['button','logo','png','header'].includes(raw)) return raw;
  } catch(e) {}
  return 'button';
}
function saveKind(v){
  const safe = ['button','logo','png','header'].includes(String(v || '')) ? String(v) : 'button';
  try { localStorage.setItem(LS_KIND, safe); } catch(e) {}
}
function loadPrompt(){
  try { return String(localStorage.getItem(LS_PROMPT) || ''); } catch(e) {}
  return '';
}
function savePrompt(v){
  try { localStorage.setItem(LS_PROMPT, String(v || '')); } catch(e) {}
}

function takePendingVoiceDetailsForPrompt(promptText){
  try {
    return consumePendingVoiceCommandDebugDetails(String(promptText || '')) || null;
  } catch (error) {
    console.warn('[ai-templates] pending voice details merge failed', error);
    return null;
  }
}

function buildDebugReportNotes(baseNotes = {}, pendingVoiceDetails = null){
  return {
    ...(baseNotes || {}),
    ...(pendingVoiceDetails ? {
      voiceMerged: true,
      voiceSource: pendingVoiceDetails.source || 'voice_command_widget',
      reportMode: 'single_combined_voice_and_ai_apply_report',
    } : {}),
  };
}
function loadContext(){
  try {
    const raw = String(localStorage.getItem(LS_CONTEXT) || 'selection');
    if (['selection','header'].includes(raw)) return raw;
  } catch(e) {}
  return 'selection';
}
function saveContext(v){
  const safe = ['selection','header'].includes(String(v || '')) ? String(v) : 'selection';
  try { localStorage.setItem(LS_CONTEXT, safe); } catch(e) {}
}
function loadAction(){
  try {
    const raw = String(localStorage.getItem(LS_ACTION) || 'create');
    if (['create','update','variant'].includes(raw)) return raw;
  } catch(e) {}
  return 'create';
}
function saveAction(v){
  const safe = ['create','update','variant'].includes(String(v || '')) ? String(v) : 'create';
  try { localStorage.setItem(LS_ACTION, safe); } catch(e) {}
}

// HOTFIX 00082:
// JavaScript \b treats Ukrainian Cyrillic letters as non-word characters.
// Guards such as /зроби\b/ therefore did not match commands like "зроби блок синім",
// which let simple style edits fall through to the old AI Templates recipe/create flow.
const ST_AI_WORD_LEFT_BOUNDARY = '(?:^|[^\\p{L}\\p{N}_-])';
const ST_AI_WORD_RIGHT_BOUNDARY = '(?=$|[^\\p{L}\\p{N}_-])';
function hasAiStandaloneWord(text, source){
  return new RegExp(`${ST_AI_WORD_LEFT_BOUNDARY}(?:${source})${ST_AI_WORD_RIGHT_BOUNDARY}`, 'iu').test(String(text || ''));
}
function aiStandaloneWordRegex(source, flags = 'iu'){
  return new RegExp(`${ST_AI_WORD_LEFT_BOUNDARY}(?:${source})${ST_AI_WORD_RIGHT_BOUNDARY}`, flags);
}

function normalizeTargetScopeLevels(value){
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  const levels = raw
    .map((item) => Number.parseInt(String(item).trim(), 10))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 3);
  const unique = Array.from(new Set(levels)).sort((a, b) => a - b);
  return unique.length ? unique : [0];
}
function loadTargetScope(){
  try { return normalizeTargetScopeLevels(localStorage.getItem(LS_TARGET_SCOPE) || '0'); } catch(e) {}
  return [0];
}
function saveTargetScope(levels){
  try { localStorage.setItem(LS_TARGET_SCOPE, normalizeTargetScopeLevels(levels).join(',')); } catch(e) {}
}
function targetScopeLabel(levels){
  const safe = normalizeTargetScopeLevels(levels);
  const labels = [];
  if (safe.includes(0)) labels.push('поточний');
  if (safe.includes(1)) labels.push('1-ше споріднення');
  if (safe.includes(2)) labels.push('2-ге споріднення');
  if (safe.includes(3)) labels.push('3-тє споріднення');
  return labels.join(' + ') || 'поточний';
}
function buildTargetScope(levels){
  const safe = normalizeTargetScopeLevels(levels);
  return {
    mode: 'selected_tree_levels',
    levels: safe,
    maxDepth: 3,
    includeCurrent: safe.includes(0),
    label: targetScopeLabel(safe),
  };
}
function attachRuntimeTargetScope(runtimeResult, scope){
  if (!runtimeResult || typeof runtimeResult !== 'object') return runtimeResult;
  const targetScope = buildTargetScope(scope && scope.levels ? scope.levels : scope);
  runtimeResult.targetScope = targetScope;
  runtimeResult.__targetScopeLabel = targetScope.label;
  const commands = Array.isArray(runtimeResult.commands) ? runtimeResult.commands : [];
  for (const command of commands) {
    if (!command || typeof command !== 'object') continue;
    command.targetScope = targetScope;
    const contract = command.applyContract;
    if (!contract || typeof contract !== 'object') continue;
    contract.targetScope = targetScope;
    const operations = Array.isArray(contract.operations) ? contract.operations : [];
    for (const operation of operations) {
      if (!operation || typeof operation !== 'object') continue;
      operation.targetScope = targetScope;
      operation.payload = {
        ...(operation.payload || {}),
        targetScope,
      };
    }
  }
  return runtimeResult;
}
function loadFix(){
  try { return String(localStorage.getItem(LS_FIX) || ''); } catch(e) {}
  return '';
}
function saveFix(v){
  try { localStorage.setItem(LS_FIX, String(v || '')); } catch(e) {}
}

function kindLabel(kind){
  if (kind === 'logo') return 'Лого';
  if (kind === 'png') return 'PNG';
  if (kind === 'header') return 'Header';
  return 'Кнопка';
}
function contextLabel(ctx){
  if (ctx === 'header') return 'Активний контейнер';
  return 'Вибране';
}
function actionLabel(action){
  if (action === 'update') return 'Змінити вибране';
  if (action === 'variant') return 'Створити варіант';
  return 'Створити новий';
}
function blockTypeLabel(type){
  if (type === 'button') return 'Кнопка';
  if (type === 'logo') return 'Лого';
  if (type === 'png') return 'PNG';
  if (type === 'menu') return 'Меню';
  if (type === 'heading') return 'Заголовок';
  if (type === 'phone') return 'Телефон';
  return 'Елемент';
}
function elementTypeFromDom(el){
  if (!el || !el.classList) return '';
  if (el.classList.contains('st-block--button')) return 'button';
  if (el.classList.contains('st-block--logo')) return 'logo';
  if (el.classList.contains('st-block--png')) return 'png';
  if (el.classList.contains('st-block--phone')) return 'phone';
  if (el.classList.contains('st-block--menu') || el.dataset?.blockRole === 'menu') return 'menu';
  if (el.classList.contains('st-block--heading')) return 'heading';
  return el.dataset?.blockRole || el.dataset?.blockKind || '';
}
function describeSelection(getSelection){
  try {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    const el = sel && Array.isArray(sel.elements) ? sel.elements[0] : null;
    if (!sel || !el) return 'Нічого не вибрано';
    if (sel.type === 'header') return 'Вибрана шапка';
    if (sel.type === 'footer') return 'Вибраний футер';
    if (sel.type === 'header-inner') {
      const block = el.classList?.contains('st-block') ? el : (el.closest ? el.closest('.st-block') : null);
      if (block) return `Header → ${blockTypeLabel(elementTypeFromDom(block))}`;
      return 'Header → внутрішній елемент';
    }
    if (sel.type === 'footer-inner') {
      const block = el.classList?.contains('st-block') ? el : (el.closest ? el.closest('.st-block') : null);
      if (block) return `Footer → ${blockTypeLabel(elementTypeFromDom(block))}`;
      return 'Footer → внутрішній елемент';
    }
    if (sel.type === 'block') return `Сторінка → ${blockTypeLabel(elementTypeFromDom(el))}`;
    if (sel.type === 'section') return 'Сторінка → секція';
    if (sel.type === 'row') return 'Сторінка → row';
    return 'Вибрано елемент';
  } catch(e) {}
  return 'Нічого не вибрано';
}

function selectedBlockFromSelection(getSelection){
  try {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    const el = sel && Array.isArray(sel.elements) ? sel.elements[0] : null;
    if (!el) return null;
    if (el.classList && el.classList.contains('st-block')) return el;
    return el.closest ? el.closest('.st-block') : null;
  } catch(e) {}
  return null;
}


function selectionSnapshotToAiTarget(selectionSnapshot){
  const directType = String(selectionSnapshot && selectionSnapshot.type || '').trim();
  const selected = Array.isArray(selectionSnapshot?.selectedElements) && selectionSnapshot.selectedElements.length
    ? selectionSnapshot.selectedElements[0]
    : null;
  const selectedType = String(selected?.type || selected?.raw?.type || selected?.label || '').trim();
  const type = selectedType || directType;
  if (type === 'button' || type === 'button_block' || /кноп/i.test(type)) return 'button_block';
  if (type === 'menu' || type === 'menu_block') return 'menu_block';
  if (type === 'heading' || type === 'text_block' || type === 'text') return 'text_block';
  if (type === 'row') return 'row';
  if (type === 'container') return 'container';
  if (type === 'section') return 'section';
  if (directType === 'button') return 'button_block';
  if (directType === 'menu') return 'menu_block';
  if (directType === 'heading') return 'text_block';
  return type || '';
}

function parseEvaluationForRuntime(result){
  const issues = [];
  if (!result || typeof result !== 'object') {
    issues.push('empty_result');
    return { pass: false, issues };
  }
  if (Array.isArray(result.errors) && result.errors.length) issues.push('errors_present');
  const commands = Array.isArray(result.commands) ? result.commands : [];
  if (!commands.length) issues.push('no_commands');
  for (const cmd of commands) {
    if (!cmd || typeof cmd !== 'object') {
      issues.push('invalid_command');
      continue;
    }
    if (!cmd.action || cmd.action === 'generic_set') issues.push('unclear_action');
    if (cmd.needsClarify) issues.push('needs_clarify');
  }
  return { pass: issues.length === 0, issues: Array.from(new Set(issues)) };
}

function hasRuntimeContracts(result){
  const commands = Array.isArray(result && result.commands) ? result.commands : [];
  return commands.some((cmd) => cmd && cmd.applyContract && Array.isArray(cmd.applyContract.operations) && cmd.applyContract.operations.length);
}

function summarizeRuntimeFirstCommand(result){
  const first = Array.isArray(result && result.commands) ? result.commands[0] : null;
  if (!first || typeof first !== 'object') return null;
  return {
    action: first.action || '—',
    target: first.target || '—',
    property: first.property || '—',
    value: first.value && typeof first.value === 'object'
      ? (first.value.label || first.value.raw || first.value.colorId || (typeof first.value.value === 'number' ? `${first.value.value}${first.value.unit || ''}` : '—'))
      : (first.value == null ? '—' : String(first.value)),
    confidence: Number(first.confidence || 0),
  };
}

function isCreateIntentPrompt(prompt){
  const p = String(prompt || '').toLowerCase();
  return /(створи|створити|додай|добав|згенеруй|зроби нову|зроби новий|нову кнопку|новий логотип|новий header|новий хедер|варіант|duplicate|copy)/.test(p);
}

function normalizeOpacityPromptText(prompt){
  return String(prompt || '')
    .toLowerCase()
    .replace(/\bпрзор/gu, 'прозор')
    .replace(/\bпрозр(?=іст|ост|ості|ість|ости|ость)/gu, 'прозор')
    .replace(/\bпрозорст/gu, 'прозоріст')
    .replace(/\bпрозрст/gu, 'прозоріст')
    .replace(/\bпрозорісь\b/gu, 'прозорість')
    .replace(/\bпрозорос[тт]і\b/gu, 'прозорості');
}

function isLikelyStyleEditPrompt(prompt){
  const p = normalizeOpacityPromptText(prompt);
  return /(колір|цвет|text color|background|фон|текст|тінь|shadow|бордер|border|рамк|радіус|radius|padding|margin|відступ|прозор|opacity|blur|розмір|size|hover|іконк|icon|gradient|граді|червон|зелен|син|жовт|бі(л|л)|чорн|сір|рожев|фіолет|оранж|помаранч|вишнев|коричнев|блакит|бірюз|золот|сріб|салат|малин|бордов)/.test(p);
}


function isButtonEffectEditPrompt(prompt){
  const p = normalizeOpacityPromptText(prompt).replace(/\s+/g, ' ').trim();
  if (!hasButtonMention(p)) return false;
  return /(тінь|shadow|підсвітк|glow|неон|фон|background|текст|напис|колір|рамк|бордер|border|радіус|radius|прозор|opacity|blur|граді|gradient)/u.test(p);
}

function hasShadowPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  // HOTFIX 00048:
  // "рамка / бордер / контур / outline" is a border command, not a shadow command.
  // Border/frame commands must have higher priority than shadow/glow guards.
  if (hasBorderPrompt(p)) return false;
  return /(тінь|тінню|тіні|shadow|box\s*-?shadow|підсвітк|glow|неон)/u.test(p);
}

function hasBorderPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return /(?:\bborder\b|бордер|бордером|бордеру|рамк|рамку|рамкою|рамки|рамка|обводк|обводку|контур|outline)/u.test(p);
}


function hasOpacityPrompt(prompt){
  const p = normalizeOpacityPromptText(prompt).replace(/\s+/g, ' ').trim();
  return /(?:прозор|прозоріст|прозорості|opacity|transparent|transparency|прозрач|прозрачност|просвіч|просвеч|напівпрозор|полупрозрач|непрозор|opaque)/u.test(p);
}

function isBorderOpacityPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return hasOpacityPrompt(p) && hasBorderPrompt(p);
}

function hasExplicitNonSizePropertyPrompt(prompt){
  const p = normalizeOpacityPromptText(prompt).replace(/\s+/g, ' ').trim();
  return /(?:прозор|opacity|transparent|transparency|прозрач|яскрав|brightness|контраст|contrast|насич|saturation|колір|color|фон|background|заливк|граді|gradient|blur|розмит|тінь|shadow|рамк|бордер|border|контур|outline|радіус|radius|скругл|padding|margin|gap|відступ|іконк|icon|шрифт|font|текст|text|видим|visibility)/u.test(p);
}

function getForcedOpacityDelta(prompt){
  const p = normalizeOpacityPromptText(prompt).replace(/\s+/g, ' ').trim();
  const explicit = p.match(/(\d{1,3}(?:[.,]\d+)?)\s*(?:%|відсот(?:ок|ки|ків|ка)?|percent)/u);
  if (explicit) return Math.max(0.01, Math.min(1, Number.parseFloat(String(explicit[1]).replace(',', '.')) / 100));
  if (/(чуть|трішки|трошки|трохи|ледь|легк|slight|slightly|little|a little)/u.test(p)) return 0.05;
  return 0.10;
}

function getForcedOpacityIntent(prompt){
  const p = normalizeOpacityPromptText(prompt).replace(/\s+/g, ' ').trim();
  if (/(непрозор|не\s+прозор|opaque)/u.test(p)) return { mode: 'set', percent: 100, opacity: 1, raw: '100%', reason: 'make_opaque' };
  if (/(повністю|абсолютно|цілком|на\s+100\s*%|fully|completely)(?:[\s\S]{0,18})?(прозор|transparent)|повністю\s+прозор/u.test(p)) return { mode: 'set', percent: 0, opacity: 0, raw: '0%', reason: 'make_fully_transparent' };
  if (/(напівпрозор|наполовину\s+прозор|полупрозрач|semi[-\s]?transparent|half[-\s]?transparent)/u.test(p)) return { mode: 'set', percent: 50, opacity: 0.5, raw: '50%', reason: 'make_semi_transparent' };
  const delta = getForcedOpacityDelta(p);
  const lessTransparent = /(?:зменш|зменши|зменшити|понизь|опусти|прибери|забери|послаб|уменьш|убав|сбав|decrease|reduce|lower)(?:[\s\S]{0,32})?(прозор|прозрач|opacity|transparent|transparency)/u.test(p)
    || /(?:менш|менше|меншою|меншим|меньше|менее|less)(?:[\s\S]{0,16})?(прозор|прозрач|transparent)/u.test(p)
    || /(?:більш|більше|более|more)(?:[\s\S]{0,16})?(непрозор|opaque)/u.test(p)
    || /(?:не\s+такий|не\s+така|не\s+таке|не\s+такою|не\s+таким)(?:[\s\S]{0,16})?(прозор|прозрач)/u.test(p);
  const moreTransparent = /(?:додай|добав|добавь|збільш|збільши|збільшити|підніми|посиль|усиль|increase|raise|add)(?:[\s\S]{0,32})?(прозор|прозрач|opacity|transparent|transparency)/u.test(p)
    || /(?:більш|більше|более|more)(?:[\s\S]{0,16})?(прозор|прозрач|transparent)/u.test(p)
    || /(?:прозоріш|прозрачнее|прозрачніш|more\s+transparent)/u.test(p)
    || /(?:зроби|роби|сделай|make)(?:[\s\S]{0,24})?(прозорим|прозорою|прозоре|прозорий|прозрачным|прозрачной|transparent)/u.test(p);
  if (lessTransparent && !moreTransparent) return { mode: 'adjust', direction: 'increase', delta, raw: 'less transparent ' + Math.round(delta * 100) + '%', reason: 'decrease_transparency' };
  return { mode: 'adjust', direction: 'decrease', delta, raw: 'more transparent ' + Math.round(delta * 100) + '%', reason: 'increase_transparency' };
}

function makeForcedOpacityValue(prompt){
  const intent = getForcedOpacityIntent(prompt);
  if (intent.mode === 'set') return { type: 'opacity_keyword', keyword: intent.reason, raw: intent.raw, percent: intent.percent, confidence: 0.96, forcedBy: 'ai_templates_opacity_guard_00064_active_selection_force', reason: intent.reason };
  return { type: 'number', mode: intent.direction, value: intent.delta, unit: null, raw: intent.raw, confidence: 0.96, forcedBy: 'ai_templates_opacity_guard_00064_active_selection_force', reason: intent.reason };
}

function buildForcedOpacityRuntimeResult(prompt, baseResult = null, target = 'button_block'){
  const intent = getForcedOpacityIntent(prompt);
  const isBorder = isBorderOpacityPrompt(prompt);
  const property = isBorder ? 'border_opacity' : 'opacity';
  const value = makeForcedOpacityValue(prompt);
  const useDirectOpacity = intent.mode === 'set' && !isBorder;
  const operation = useDirectOpacity
    ? { runtime: 'applyOpacityValue', target, layer: 'surface', applyTo: 'all_selected_if_multiple', selectionMode: 'current_selection', payload: { value, state: 'default', responsive: 'all', forcedBy: 'ai_templates_opacity_guard_00064_active_selection_force' }, fallbacks: ['preserve_existing_opacity'] }
    : { runtime: 'adjustNumericStyle', target, layer: isBorder ? 'border' : 'surface', applyTo: 'all_selected_if_multiple', selectionMode: 'current_selection', payload: { property, value, state: 'default', responsive: 'all', forcedBy: 'ai_templates_opacity_guard_00064_active_selection_force' }, fallbacks: ['keep_current_opacity_if_unknown'] };
  const atomicAction = useDirectOpacity
    ? { action: 'set_opacity_value', property, value, target, state: 'default', responsive: 'all' }
    : { action: 'adjust_numeric_style', property, value, target, state: 'default', responsive: 'all' };
  const action = useDirectOpacity ? 'set_opacity' : 'adjust_opacity';
  const command = {
    action, target, property, value, scope: 'selected_element', state: 'default', responsive: 'all',
    selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' }, confidence: 0.96, needsClarify: false,
    clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null },
    executorPrep: { kind: 'direct_atomic_executor_prep', target, action, state: 'default', responsive: 'all', atomicActions: [atomicAction] },
    applyContract: { kind: 'atomic_apply_contract', version: 1, target, selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', operations: [operation] },
  };
  return { ok: true, sourceText: String(prompt || ''), normalizedText: normalizeOpacityPromptText(prompt).replace(/\s+/g, ' ').trim(), commands: [command], warnings: [], errors: [], assistantMessage: null, diagnostics: [{ forced: true, ruleId: 'ai_templates_opacity_guard_00064_active_selection_force', reason: 'opacity/transparency prompt must use runtime opacity operation on the active selected element; size guard and recipe/create are blocked', previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null, previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null, command }] };
}

function forceOpacityRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!hasOpacityPrompt(prompt)) return runtimeResult;
  if (!selectedTarget) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const runtimes = Array.isArray(first?.applyContract?.operations) ? first.applyContract.operations.map((op) => op?.runtime).filter(Boolean) : [];
  if (first && (runtimes.includes('applyOpacityValue') || (runtimes.includes('adjustNumericStyle') && (first.property === 'opacity' || first.property === 'border_opacity')))) return runtimeResult;
  pushAiUiTrace({ event: 'runtime_force_guard', phase: 'opacity_guard_00064_post_parse_force', reason: 'opacity_prompt_replaced_size_recipe_or_empty_parser_result_for_active_selected_element', selectedTarget, forcedTarget: selectedTarget, previousAction: first?.action || null, previousProperty: first?.property || null, previousRuntime: runtimes[0] || null });
  return buildForcedOpacityRuntimeResult(prompt, runtimeResult, selectedTarget);
}

function getForcedBorderWidth(prompt){
  const p = String(prompt || '').toLowerCase();
  if (/(товст|жирн|сильн|виразн|потужн|thick|bold|strong)/u.test(p)) return '2px';
  if (/(тонк|легк|слаб|thin|light)/u.test(p)) return '1px';
  const px = p.match(/(\d+(?:[.,]\d+)?)\s*(px|пікс|піксел)/u);
  if (px) return `${String(px[1]).replace(',', '.')}px`;
  return '1px';
}

function getForcedBorderStyle(prompt){
  const p = String(prompt || '').toLowerCase();
  if (/(пунктир|штрих|dashed)/u.test(p)) return 'dashed';
  if (/(крапк|dotted)/u.test(p)) return 'dotted';
  if (/(подвійн|double)/u.test(p)) return 'double';
  return 'solid';
}


function hasForcedBorderColorPrompt(prompt){
  const p = String(prompt || '').toLowerCase();
  return /(син|блакит|червон|бордов|вишнев|зелен|салат|жовт|золот|білий|біло|білу|білим|white|чорн|black|фіолет|purple|помаранч|оранж|orange|рожев|малин|pink|коричнев|brown|бірюз|cyan|сір|gray|grey)/u.test(p);
}

function hasForcedBorderWidthPrompt(prompt){
  const p = String(prompt || '').toLowerCase();
  return /(товщин|ширин|товст|тонк|жирн|збільш|збільши|збільшити|зменш|зменши|зменшити|відніми|відняти|менш|більш|px|пікс|піксел|border\s*width|рамк.*шир|бордер.*шир)/u.test(p);
}

function getForcedBorderWidthIntent(prompt){
  const p = String(prompt || '').toLowerCase();
  const explicit = p.match(/(\d+(?:[.,]\d+)?)\s*(px|пікс|піксел)/u);
  if (explicit) {
    const value = Math.max(0, Number.parseFloat(String(explicit[1]).replace(',', '.')) || 0);
    return { mode: 'set', value, unit: 'px', raw: `${value}px`, reason: 'explicit_px' };
  }
  const hasDecrease = /(зменш|зменши|зменшити|відніми|відняти|менш|тонш|decrease|less|minus|-)/u.test(p);
  const hasIncrease = /(збільш|збільши|збільшити|додай|добав|більш|товщ|товст|жирн|increase|more|plus|\+)/u.test(p);
  const strong = /(сильн|дуже|значно|потужн|жирн|товст|strong|big|large)/u.test(p);
  const thinSet = /(зроби|постав|встанови|set).*(тонк|thin)/u.test(p) || /тонк(ий|у|а)?\s+(бордер|рамк)/u.test(p);
  const thickSet = /(зроби|постав|встанови|set).*(товст|жирн|thick|bold)/u.test(p) || /(товст|жирн)\w*\s+(бордер|рамк)/u.test(p);
  if (hasDecrease) return { mode: 'delta', delta: strong ? -2 : -1, unit: 'px', raw: `${strong ? -2 : -1}px`, reason: 'decrease_width' };
  if (hasIncrease && /(збільш|збільши|збільшити|додай|добав|більш|increase|more|plus|\+)/u.test(p)) {
    return { mode: 'delta', delta: strong ? 2 : 1, unit: 'px', raw: `+${strong ? 2 : 1}px`, reason: 'increase_width' };
  }
  if (thinSet) return { mode: 'set', value: 1, unit: 'px', raw: '1px', reason: 'thin_width' };
  if (thickSet) return { mode: 'set', value: 3, unit: 'px', raw: '3px', reason: 'thick_width' };
  if (strong) return { mode: 'set', value: 2, unit: 'px', raw: '2px', reason: 'strong_default_width' };
  return { mode: 'set', value: 1, unit: 'px', raw: '1px', reason: 'default_width' };
}

function makeForcedBorderWidthValue(prompt){
  const intent = getForcedBorderWidthIntent(prompt);
  if (intent.mode === 'delta') {
    return {
      type: 'length_delta',
      mode: 'relative_border_width',
      delta: intent.delta,
      unit: intent.unit || 'px',
      raw: intent.raw,
      confidence: 0.96,
      forcedBy: 'ai_templates_border_guard_00048_width_increment_force',
      reason: intent.reason,
    };
  }
  return {
    type: 'length',
    value: intent.value,
    unit: intent.unit || 'px',
    raw: intent.raw,
    confidence: 0.96,
    forcedBy: 'ai_templates_border_guard_00048_width_increment_force',
    reason: intent.reason,
  };
}

function buildForcedBorderRuntimeResult(prompt, baseResult = null, target = 'button_block'){
  const hasColor = hasForcedBorderColorPrompt(prompt);
  const hasWidth = hasForcedBorderWidthPrompt(prompt);
  const widthValue = makeForcedBorderWidthValue(prompt);
  const styleValue = { type: 'border_style', style: getForcedBorderStyle(prompt), raw: getForcedBorderStyle(prompt) };
  const color = hasColor ? pickForcedShadowColor(prompt) : null;
  const colorValue = color ? { type: 'color', ...color, raw: color.hex, confidence: 0.96, forcedBy: 'ai_templates_border_guard_00048_border_frame_force' } : null;
  const operations = [];
  const atomicActions = [];
  const mainAction = hasWidth && !hasColor ? 'set_border_width' : 'set_border_color';
  const mainProperty = hasWidth && !hasColor ? 'border_width' : 'border_color';
  const mainValue = hasWidth && !hasColor ? widthValue : (colorValue || widthValue);

  if (colorValue) {
    operations.push({ runtime: 'applyBorderColorValue', target, layer: 'border', applyTo: 'all_selected_if_multiple', selectionMode: 'current_selection', payload: { value: colorValue, state: 'default', responsive: 'all', forcedBy: 'ai_templates_border_guard_00048_border_frame_force' }, fallbacks: ['preserve_existing_border'] });
    atomicActions.push({ action: 'set_border_color_value', property: 'border_color', value: colorValue, target, state: 'default', responsive: 'all' });
  }

  operations.push({ runtime: 'applyBorderWidthValue', target, layer: 'border', applyTo: 'all_selected_if_multiple', selectionMode: 'current_selection', payload: { value: widthValue, state: 'default', responsive: 'all', forcedBy: 'ai_templates_border_guard_00048_width_increment_force' }, fallbacks: ['preserve_existing_border'] });
  atomicActions.push({ action: 'set_border_width_value', property: 'border_width', value: widthValue, target, state: 'default', responsive: 'all' });

  operations.push({ runtime: 'applyBorderStyleValue', target, layer: 'border', applyTo: 'all_selected_if_multiple', selectionMode: 'current_selection', payload: { value: styleValue, state: 'default', responsive: 'all', forcedBy: 'ai_templates_border_guard_00048_border_frame_force' }, fallbacks: ['preserve_existing_border'] });
  atomicActions.push({ action: 'set_border_style_value', property: 'border_style', value: styleValue, target, state: 'default', responsive: 'all' });

  const command = {
    action: mainAction,
    target,
    property: mainProperty,
    value: mainValue,
    scope: 'selected_element',
    state: 'default',
    responsive: 'all',
    selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' },
    confidence: 0.96,
    needsClarify: false,
    clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null },
    executorPrep: {
      kind: 'direct_atomic_executor_prep',
      target,
      action: mainAction,
      state: 'default',
      responsive: 'all',
      atomicActions,
    },
    applyContract: {
      kind: 'atomic_apply_contract',
      version: 1,
      target,
      selectionMode: 'current_selection',
      applyTo: 'all_selected_if_multiple',
      operations,
    }
  };
  return {
    ok: true,
    sourceText: String(prompt || ''),
    normalizedText: String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim(),
    commands: [command],
    warnings: [],
    errors: [],
    assistantMessage: null,
    diagnostics: [{
      forced: true,
      ruleId: hasWidth ? 'ai_templates_border_guard_00048_width_increment_force' : 'ai_templates_border_guard_00048_border_frame_force',
      reason: hasWidth
        ? 'border width prompt must use runtime width operation and repeated increase/decrease commands must change current width'
        : 'border prompt must use runtime border operations on the active selected element; recipe/create is blocked',
      previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null,
      previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null,
      command,
    }]
  };
}
function forceBorderRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!hasBorderPrompt(prompt)) return runtimeResult;
  const target = selectedTarget || (hasButtonMention(prompt) ? 'button_block' : '');
  if (!target) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const runtimes = Array.isArray(first?.applyContract?.operations) ? first.applyContract.operations.map((op) => op?.runtime).filter(Boolean) : [];
  if (first && runtimes.includes('applyBorderColorValue')) return runtimeResult;
  pushAiUiTrace({
    event: 'runtime_force_guard',
    phase: 'border_guard_00048_post_parse_force',
    reason: 'border_prompt_replaced_recipe_shadow_or_empty_parser_result_for_active_selected_element',
    selectedTarget,
    forcedTarget: target,
    previousAction: first?.action || null,
    previousProperty: first?.property || null,
    previousRuntime: runtimes[0] || null,
  });
  return buildForcedBorderRuntimeResult(prompt, runtimeResult, target);
}


function hasRadiusPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  // Radius is always an edit command for the active selected element.
  // If no target word is present ("збільш радіус"), it must still use current_selection.
  return /(?:\bradius\b|border\s*-?radius|радіус|радіуса|радіусом|скругл|заокругл|округл|кругліш)/u.test(p);
}

function getForcedRadiusIntent(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const hasDecrease = /(зменш|зменши|зменшити|відніми|відняти|менш|тонш|мінус|minus|decrease|less|-)/u.test(p);
  const hasIncrease = /(збільш|збільши|збільшити|додай|добав|добави|плюс|більш|кругліш|заокругл|округл|increase|more|plus|\+)/u.test(p);
  const strong = /(сильн|дуже|значно|набагато|великий|велику|великим|максималь|кругл|круглу|round|large|big|strong)/u.test(p);
  const smallSet = /(мал(ий|еньк)|невелик|легк|трошки|слаб|small|light)/u.test(p);
  const explicit = p.match(/(?:на\s*)?(\d+(?:[.,]\d+)?)\s*(px|пікс|піксел)/u);
  if (explicit) {
    const n = Math.max(0, Number.parseFloat(String(explicit[1]).replace(',', '.')) || 0);
    if (hasDecrease) return { mode: 'delta', delta: -n, unit: 'px', raw: '-' + n + 'px', reason: 'explicit_decrease_radius_px' };
    if (hasIncrease) return { mode: 'delta', delta: n, unit: 'px', raw: '+' + n + 'px', reason: 'explicit_increase_radius_px' };
    return { mode: 'set', value: n, unit: 'px', raw: n + 'px', reason: 'explicit_set_radius_px' };
  }
  if (hasDecrease) return { mode: 'delta', delta: strong ? -4 : -2, unit: 'px', raw: (strong ? -4 : -2) + 'px', reason: 'decrease_radius' };
  if (hasIncrease) return { mode: 'delta', delta: strong ? 4 : 2, unit: 'px', raw: '+' + (strong ? 4 : 2) + 'px', reason: 'increase_radius' };
  if (smallSet) return { mode: 'set', value: 6, unit: 'px', raw: '6px', reason: 'small_radius' };
  if (strong) return { mode: 'set', value: 18, unit: 'px', raw: '18px', reason: 'large_radius' };
  return { mode: 'set', value: 12, unit: 'px', raw: '12px', reason: 'default_radius' };
}

function makeForcedRadiusValue(prompt){
  const intent = getForcedRadiusIntent(prompt);
  if (intent.mode === 'delta') {
    return {
      type: 'length_delta',
      mode: 'relative_radius',
      delta: intent.delta,
      unit: intent.unit || 'px',
      raw: intent.raw,
      confidence: 0.96,
      forcedBy: 'ai_templates_radius_guard_00049_active_selection_force',
      reason: intent.reason,
    };
  }
  return {
    type: 'length',
    value: intent.value,
    unit: intent.unit || 'px',
    raw: intent.raw,
    confidence: 0.96,
    forcedBy: 'ai_templates_radius_guard_00049_active_selection_force',
    reason: intent.reason,
  };
}

function buildForcedRadiusRuntimeResult(prompt, baseResult = null, target = 'button_block'){
  const radiusValue = makeForcedRadiusValue(prompt);
  const command = {
    action: 'set_radius',
    target,
    property: 'border_radius',
    value: radiusValue,
    scope: 'selected_element',
    state: 'default',
    responsive: 'all',
    selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' },
    confidence: 0.96,
    needsClarify: false,
    clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null },
    executorPrep: {
      kind: 'direct_atomic_executor_prep',
      target,
      action: 'set_radius',
      state: 'default',
      responsive: 'all',
      atomicActions: [{ action: 'set_radius_value', property: 'border_radius', value: radiusValue, target, state: 'default', responsive: 'all' }],
    },
    applyContract: {
      kind: 'atomic_apply_contract',
      version: 1,
      target,
      selectionMode: 'current_selection',
      applyTo: 'all_selected_if_multiple',
      operations: [{
        runtime: 'applyRadiusValue',
        target,
        layer: 'shape',
        applyTo: 'all_selected_if_multiple',
        selectionMode: 'current_selection',
        payload: { value: radiusValue, state: 'default', responsive: 'all', forcedBy: 'ai_templates_radius_guard_00049_active_selection_force' },
        fallbacks: ['keep_existing_radius'],
      }],
    },
  };
  return {
    ok: true,
    sourceText: String(prompt || ''),
    normalizedText: String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim(),
    commands: [command],
    warnings: [],
    errors: [],
    assistantMessage: null,
    diagnostics: [{
      forced: true,
      ruleId: 'ai_templates_radius_guard_00049_active_selection_force',
      reason: 'radius prompt must use runtime radius operation on the active selected element; recipe/create is blocked',
      previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null,
      previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null,
      command,
    }],
  };
}

function forceRadiusRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!hasRadiusPrompt(prompt)) return runtimeResult;
  if (!selectedTarget) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const runtimes = Array.isArray(first?.applyContract?.operations) ? first.applyContract.operations.map((op) => op?.runtime).filter(Boolean) : [];
  if (first && runtimes.includes('applyRadiusValue')) return runtimeResult;
  pushAiUiTrace({
    event: 'runtime_force_guard',
    phase: 'radius_guard_00049_post_parse_force',
    reason: 'radius_prompt_replaced_recipe_or_empty_parser_result_for_active_selected_element',
    selectedTarget,
    forcedTarget: selectedTarget,
    previousAction: first?.action || null,
    previousProperty: first?.property || null,
    previousRuntime: runtimes[0] || null,
  });
  return buildForcedRadiusRuntimeResult(prompt, runtimeResult, selectedTarget);
}


function hasSizePrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!p) return false;
  if (hasBorderPrompt(p) || hasRadiusPrompt(p) || hasShadowPrompt(p) || hasOpacityPrompt(p)) return false;
  if (hasExplicitNonSizePropertyPrompt(p) && !/(?:\bwidth\b|\bheight\b|ширин|ширш|вужч|звуз|звуж|розшир|висот|вищ|нижч|нищ|розмір|size|resize)/u.test(p)) return false;
  const hasDimensionWord = /(?:\bwidth\b|\bheight\b|ширин|ширш|вужч|звуз|звуж|розшир|висот|вищ|нижч|нищ|пониз|підвищ|зріст|розмір|size|resize|larger|smaller)/u.test(p);
  const hasElementWord = /(?:кнопк|блок|контейнер|секц|секці|ряд|row|елемент|текст|заголов|лого|меню|картин|зображ)/u.test(p);
  const hasResizeVerb = /(?:збільш|збільши|збільшити|зменш|зменши|зменшити|розтягн|розшир|звуз|звуж|звузь|звужуй|стисн|підвищ|пониз|більш(?:ою|им|ий|а|е)?|менш(?:ою|им|ий|а|е)?|трохи\s+збільш|трошки\s+збільш|трішки\s+збільш|сильно\s+збільш|дуже\s+сильно\s+збільш|increase|decrease|larger|smaller|bigger|resize)/u.test(p);
  const hasExplicitAmount = /(?:на|до)?\s*\d+(?:[.,]\d+)?\s*(?:px|пікс|піксел|%|відсот)/u.test(p);
  const hasGenericResizeOnly = /(?:^|\s)(трохи|трошки|трішки|сильно|дуже|збільш|зменш|більш(?:ою|им|ий|а|е)?|менш(?:ою|им|ий|а|е)?|більше|менше|звузь|звуж|звуз)(?:\s|$)/u.test(p);
  const colorOnly = hasForcedBorderColorPrompt(p) && !hasDimensionWord && !hasElementWord && !hasExplicitAmount;
  if (colorOnly) return false;
  return !!(hasDimensionWord || (hasResizeVerb && (hasElementWord || hasExplicitAmount || hasGenericResizeOnly)));
}

function getForcedSizeAxes(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const width = /(?:\bwidth\b|ширин|ширш|вужч|звуз|звуж|розшир)/u.test(p);
  const height = /(?:\bheight\b|висот|вищ|нижч|нищ|пониз|підвищ)/u.test(p);
  if (width && !height) return ['width'];
  if (height && !width) return ['height'];
  return ['width', 'height'];
}

function getForcedSizeIntent(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const hasDecrease = /(?:зменш|зменши|зменшити|відніми|відняти|менш|вужч|звуз|звуж|стисн|нижч|нищ|пониз|мінус|minus|decrease|smaller|less|-)/u.test(p);
  const hasIncrease = /(?:збільш|збільши|збільшити|додай|добав|плюс|більш|ширш|розшир|розтягн|вищ|підвищ|increase|larger|bigger|more|plus|\+)/u.test(p);
  const veryStrong = /(?:дуже\s+сильно|максимально|набагато|very\s+strong|very\s+big)/u.test(p);
  const slight = /(?:трохи|трошки|трішки|ледь|чуть|чуть\s*чуть|slightly|little)/u.test(p);
  const strong = veryStrong || /(?:сильно|значно|потужно|великим|великою|більшою|більшим|strong|big|large)/u.test(p);
  const explicit = p.match(/(?:(до|на|=|станови|встанови|задай|постав)\s*)?(\d+(?:[.,]\d+)?)\s*(px|пікс(?:ель|елі|елів)?|піксел(?:ь|і|ів)?|%|відсот(?:ок|ки|ків|ка)?)/u);
  if (explicit) {
    const marker = String(explicit[1] || '').toLowerCase();
    const n = Math.max(0, Number.parseFloat(String(explicit[2]).replace(',', '.')) || 0);
    const unitRaw = String(explicit[3] || 'px').toLowerCase();
    const unit = /%|відсот/u.test(unitRaw) ? '%' : 'px';
    const absoluteSet = /^(до|=|станови|встанови|задай|постав)$/u.test(marker) || /(?:^|\s)(?:зроби|вистав|встанови|задай|постав)(?:\s+\S+){0,4}\s+до\s+\d/u.test(p);
    if (absoluteSet) return { mode: 'set', value: n, unit, raw: n + unit, reason: 'explicit_set_size_to_value' };
    if (hasDecrease) return { mode: unit === '%' ? 'percent_delta' : 'delta', delta: -n, unit, raw: '-' + n + unit, reason: 'explicit_decrease_size' };
    if (hasIncrease || /(?:ширш|вищ|більшою|більшим|більше)/u.test(p)) return { mode: unit === '%' ? 'percent_delta' : 'delta', delta: n, unit, raw: '+' + n + unit, reason: 'explicit_increase_size' };
    return { mode: 'set', value: n, unit, raw: n + unit, reason: 'explicit_set_size' };
  }
  if (hasDecrease) {
    const delta = veryStrong ? -10 : (strong ? -5 : (slight ? -1 : -5));
    return { mode: 'delta', delta, unit: 'px', raw: String(delta) + 'px', reason: veryStrong ? 'very_strong_decrease_size' : (strong ? 'strong_decrease_size' : (slight ? 'slight_decrease_size' : 'decrease_size')) };
  }
  if (hasIncrease || /(?:більшою|більшим|більше)/u.test(p)) {
    const delta = veryStrong ? 10 : (strong ? 5 : (slight ? 1 : 5));
    return { mode: 'delta', delta, unit: 'px', raw: '+' + delta + 'px', reason: veryStrong ? 'very_strong_increase_size' : (strong ? 'strong_increase_size' : (slight ? 'slight_increase_size' : 'increase_size')) };
  }
  return { mode: 'delta', delta: 5, unit: 'px', raw: '+5px', reason: 'default_size_increase' };
}

function makeForcedSizeValue(prompt){
  const intent = getForcedSizeIntent(prompt);
  if (intent.mode === 'delta' || intent.mode === 'percent_delta') {
    return { type: 'length_delta', mode: intent.mode === 'percent_delta' ? 'relative_dimension_percent' : 'relative_dimension', delta: intent.delta, unit: intent.unit || 'px', raw: intent.raw, confidence: 0.96, forcedBy: 'ai_templates_size_guard_00051_active_selection_force', reason: intent.reason };
  }
  return { type: 'length', value: intent.value, unit: intent.unit || 'px', raw: intent.raw, confidence: 0.96, forcedBy: 'ai_templates_size_guard_00051_active_selection_force', reason: intent.reason };
}

function buildForcedSizeRuntimeResult(prompt, baseResult = null, target = 'button_block'){
  const axes = getForcedSizeAxes(prompt);
  const sizeValue = makeForcedSizeValue(prompt);
  const operations = axes.map((axis) => ({ runtime: 'applyDimensionValue', target, layer: 'layout', applyTo: 'all_selected_if_multiple', selectionMode: 'current_selection', payload: { property: axis, value: sizeValue, state: 'default', responsive: 'all', forcedBy: 'ai_templates_size_guard_00051_active_selection_force' }, fallbacks: ['preserve_existing_dimension'] }));
  const atomicActions = axes.map((axis) => ({ action: 'set_dimension_value', property: axis, value: sizeValue, target, state: 'default', responsive: 'all' }));
  const property = axes.length === 2 ? 'size' : axes[0];
  const action = axes.length === 2 ? 'set_size' : (axes[0] === 'height' ? 'set_height' : 'set_width');
  const command = {
    action, target, property, value: sizeValue, scope: 'selected_element', state: 'default', responsive: 'all',
    selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' }, confidence: 0.96, needsClarify: false,
    clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null },
    executorPrep: { kind: 'direct_atomic_executor_prep', target, action, state: 'default', responsive: 'all', atomicActions },
    applyContract: { kind: 'atomic_apply_contract', version: 1, target, selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', operations },
  };
  return { ok: true, sourceText: String(prompt || ''), normalizedText: String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim(), commands: [command], warnings: [], errors: [], assistantMessage: null, diagnostics: [{ forced: true, ruleId: 'ai_templates_size_guard_00051_active_selection_force', reason: 'size/width/height prompt must use runtime dimension operations on the active selected element; recipe/create is blocked', axes, previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null, previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null, command }] };
}

function forceSizeRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!hasSizePrompt(prompt)) return runtimeResult;
  if (!selectedTarget) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const runtimes = Array.isArray(first?.applyContract?.operations) ? first.applyContract.operations.map((op) => op?.runtime).filter(Boolean) : [];
  if (first && runtimes.includes('applyDimensionValue')) return runtimeResult;
  pushAiUiTrace({ event: 'runtime_force_guard', phase: 'size_guard_00051_post_parse_force', reason: 'size_prompt_replaced_recipe_or_empty_parser_result_for_active_selected_element', selectedTarget, forcedTarget: selectedTarget, previousAction: first?.action || null, previousProperty: first?.property || null, previousRuntime: runtimes[0] || null });
  return buildForcedSizeRuntimeResult(prompt, runtimeResult, selectedTarget);
}


function normalizeSpacingPromptText(prompt){
  return String(prompt || '').toLowerCase().replace(/[ґ]/g, 'г').replace(/\s+/g, ' ').trim();
}

function hasSpacingPrompt(prompt){
  const p = normalizeSpacingPromptText(prompt);
  if (!p) return false;
  if (/(між\s*(?:букв|літер|символ)|letter\s*spacing|міжрядков|line\s*height|рядк)/u.test(p)) return false;
  const spacingWord = /(?:відступ|відступи|відступів|відстань|проміжок|проміжки|проміжків|інтервал|інтервали|padding|margin|gap|gutter|spacing|space\s+between)/u.test(p);
  const betweenWord = /(?:між\s+(?:кнопк|блок|елемент|секц|ряд|контейнер|картк|пункт|item|button|block|element|container)|кнопк(?:ами|ах|ів).{0,20}між|space\s+between)/u.test(p);
  const actionWord = /(?:зроби|додай|добав|збільш|збільши|збільшити|зменш|зменши|зменшити|прибери|забери|видали|очисти|встанови|задай|постав|поміняй|зміни|increase|decrease|add|remove|set|make)/u.test(p);
  return !!((spacingWord || betweenWord) && actionWord);
}

function getForcedSpacingProperty(prompt){
  const p = normalizeSpacingPromptText(prompt);
  if (/(?:між\s+(?:кнопк|блок|елемент|секц|ряд|контейнер|картк|пункт|item|button|block|element|container)|відстань\s+між|проміжок\s+між|проміжки\s+між|gap|gutter|space\s+between)/u.test(p)) return 'gap';
  if (/(?:зовнішн|зовні|навколо|margin|outside)/u.test(p)) return 'margin';
  if (/(?:внутрішн|всеред|усеред|у\s+середині|в\s+середині|padding|inside)/u.test(p)) return 'padding';
  return 'padding';
}

function getForcedSpacingSide(prompt){
  const p = normalizeSpacingPromptText(prompt);
  if (/(?:зверху|верхн|top)/u.test(p)) return 'top';
  if (/(?:знизу|нижн|bottom)/u.test(p)) return 'bottom';
  if (/(?:зліва|ліворуч|лівий|лівого|left)/u.test(p)) return 'left';
  if (/(?:справа|праворуч|правий|правого|right)/u.test(p)) return 'right';
  return null;
}

function getForcedSpacingIntent(prompt){
  const p = normalizeSpacingPromptText(prompt);
  const remove = /(?:прибери|забери|видали|очисти|скинь|без|нуль|0\s*(?:px|пікс|%|відсот)?|remove|clear|delete|no\s+spacing|no\s+gap|no\s+padding|no\s+margin)/u.test(p);
  const decrease = /(?:зменш|зменши|зменшити|менш|менше|стисни|ущільни|зблизь|відніми|мінус|decrease|less|smaller|minus|-)/u.test(p);
  const increase = /(?:додай|добав|збільш|збільши|збільшити|більш|більше|рознеси|розсунь|плюс|increase|add|more|bigger|plus|\+)/u.test(p);
  const slight = /(?:трохи|трошки|трішки|чуть|ледь|slightly|little)/u.test(p);
  const strong = /(?:сильно|значно|набагато|велики|великі|дуже|strong|large|big)/u.test(p);
  const explicit = p.match(/(?:(до|на|=|станови|встанови|задай|постав)\s*)?(\d+(?:[.,]\d+)?)\s*(px|пікс(?:ель|елі|елів)?|піксел(?:ь|і|ів)?|%|відсот(?:ок|ки|ків|ка)?|процент(?:и|ів|а)?)/u);
  if (remove) return { mode: 'set', value: 0, unit: 'px', raw: '0px', reason: 'remove_spacing' };
  if (explicit) {
    const marker = String(explicit[1] || '').toLowerCase();
    const n = Math.max(0, Number.parseFloat(String(explicit[2]).replace(',', '.')) || 0);
    const unitRaw = String(explicit[3] || 'px').toLowerCase();
    const unit = /%|відсот|процент/u.test(unitRaw) ? '%' : 'px';
    const absoluteSet = /^(до|=|станови|встанови|задай|постав)$/u.test(marker) || /(?:^|\s)(?:зроби|вистав|встанови|задай|постав)(?:\s+\S+){0,5}\s+до\s+\d/u.test(p);
    if (absoluteSet) return { mode: 'set', value: n, unit, raw: n + unit, reason: 'explicit_set_spacing' };
    if (decrease) return { mode: unit === '%' ? 'percent_delta' : 'delta', delta: -n, unit, raw: '-' + n + unit, reason: 'explicit_decrease_spacing' };
    if (increase || /(?:більш|більше|додай|рознеси|розсунь)/u.test(p)) return { mode: unit === '%' ? 'percent_delta' : 'delta', delta: n, unit, raw: '+' + n + unit, reason: 'explicit_increase_spacing' };
    return { mode: 'set', value: n, unit, raw: n + unit, reason: 'explicit_set_spacing_default' };
  }
  const delta = strong ? 16 : (slight ? 4 : 8);
  if (decrease) return { mode: 'delta', delta: -delta, unit: 'px', raw: '-' + delta + 'px', reason: strong ? 'strong_decrease_spacing' : (slight ? 'slight_decrease_spacing' : 'decrease_spacing') };
  if (increase || /(?:більші|більший|більшим|більше|додай)/u.test(p)) return { mode: 'delta', delta, unit: 'px', raw: '+' + delta + 'px', reason: strong ? 'strong_increase_spacing' : (slight ? 'slight_increase_spacing' : 'increase_spacing') };
  return { mode: 'delta', delta: 8, unit: 'px', raw: '+8px', reason: 'default_spacing_increase' };
}

function makeForcedSpacingValue(prompt){
  const side = getForcedSpacingSide(prompt);
  const intent = getForcedSpacingIntent(prompt);
  if (intent.mode === 'delta' || intent.mode === 'percent_delta') {
    return { type: 'spacing_delta', side, mode: intent.mode === 'percent_delta' ? 'relative_spacing_percent' : 'relative_spacing', delta: intent.delta, unit: intent.unit || 'px', raw: intent.raw, confidence: 0.96, forcedBy: 'ai_templates_spacing_guard_00078_pre_recipe_force', reason: intent.reason };
  }
  return { type: 'spacing', side, value: intent.value, unit: intent.unit || 'px', raw: intent.raw, confidence: 0.96, forcedBy: 'ai_templates_spacing_guard_00078_pre_recipe_force', reason: intent.reason };
}

function buildForcedSpacingRuntimeResult(prompt, baseResult = null, target = 'selected_element'){
  const property = getForcedSpacingProperty(prompt);
  const value = makeForcedSpacingValue(prompt);
  const operation = { runtime: 'applySpacingValue', target, layer: 'layout', applyTo: 'all_selected_if_multiple', selectionMode: 'current_selection', payload: { property, value, state: 'default', responsive: 'all', forcedBy: 'ai_templates_spacing_guard_00078_pre_recipe_force' }, fallbacks: ['preserve_existing_spacing'] };
  const command = { action: property === 'gap' ? 'set_gap' : (property === 'margin' ? 'set_margin' : 'set_padding'), target, property, value, scope: 'selected_element', state: 'default', responsive: 'all', selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' }, confidence: 0.96, needsClarify: false, clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null }, executorPrep: { kind: 'direct_atomic_executor_prep', target, action: 'set_spacing', state: 'default', responsive: 'all', atomicActions: [{ action: 'set_spacing_value', property, value, target, state: 'default', responsive: 'all' }] }, applyContract: { kind: 'atomic_apply_contract', version: 1, target, selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', operations: [operation] } };
  return { ok: true, sourceText: String(prompt || ''), normalizedText: normalizeSpacingPromptText(prompt), commands: [command], warnings: [], errors: [], assistantMessage: null, diagnostics: [{ forced: true, ruleId: 'ai_templates_spacing_guard_00078_pre_recipe_force', reason: 'spacing/gap/padding/margin prompt must use runtime spacing operation on the active selected element; recipe/create is blocked', previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null, previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null, command }] };
}

function forceSpacingRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!hasSpacingPrompt(prompt)) return runtimeResult;
  if (!selectedTarget) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const runtimes = Array.isArray(first?.applyContract?.operations) ? first.applyContract.operations.map((op) => op?.runtime).filter(Boolean) : [];
  if (first && runtimes.includes('applySpacingValue')) return runtimeResult;
  pushAiUiTrace({ event: 'runtime_force_guard', phase: 'spacing_guard_00078_post_parse_force', reason: 'spacing_prompt_replaced_recipe_or_empty_parser_result_for_active_selected_element', selectedTarget, forcedTarget: selectedTarget, previousAction: first?.action || null, previousProperty: first?.property || null, previousRuntime: runtimes[0] || null });
  return buildForcedSpacingRuntimeResult(prompt, runtimeResult, selectedTarget);
}

function isButtonShadowPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return hasButtonMention(p) && hasShadowPrompt(p);
}



function isShadowRemovalPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!p) return false;
  const shadowWord = '(?:тінь|тінню|тіні|тіньову|тіньовий|shadow|box\\s*-?shadow|підсвітк|glow|неон)';
  const removeWord = '(?:прибери|прибрать|забери|убери|видали|удали|очисти|очисть|скинь|зніми|сними|вимкни|відключи|скасуй|без|remove|delete|clear|disable|turn\\s*off|no|without)';
  const removeBeforeShadow = new RegExp('(?:^|\\s)' + removeWord + '[\\s\\S]{0,36}' + shadowWord + '(?:$|\\s|[,.!?;:])', 'u');
  const shadowBeforeRemove = new RegExp('(?:^|\\s)' + shadowWord + '[\\s\\S]{0,36}' + removeWord + '(?:$|\\s|[,.!?;:])', 'u');
  const transparentShadow = new RegExp('(?:' + shadowWord + '[\\s\\S]{0,60}(?:100\\s*%|повністю|полностью|максимально|zero|0\\s*%)[\\s\\S]{0,40}(?:прозор|прозрач|transparent|opacity)|(?:100\\s*%|повністю|полностью|максимально|zero|0\\s*%)[\\s\\S]{0,40}(?:прозор|прозрач|transparent|opacity)[\\s\\S]{0,60}' + shadowWord + ')', 'u');
  return removeBeforeShadow.test(p) || shadowBeforeRemove.test(p) || transparentShadow.test(p);
}

function buildForcedRemoveShadowValue(){
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
    forcedBy: 'ai_templates_shadow_guard_00072_remove_shadow',
  };
}

function pickForcedShadowColor(prompt){
  const p = String(prompt || '').toLowerCase();
  const colors = [
    ['blue','Синій','#2563eb',/(син|блакит)/u],
    ['red','Червоний','#ef4444',/(червон|бордов|вишнев)/u],
    ['green','Зелений','#22c55e',/(зелен|салат)/u],
    ['yellow','Жовтий','#facc15',/(жовт|золот)/u],
    ['white','Білий','#ffffff',/(білий|біло|білу|білим|white)/u],
    ['black','Чорний','#020617',/(чорн|black)/u],
    ['purple','Фіолетовий','#8b5cf6',/(фіолет|purple)/u],
    ['orange','Помаранчевий','#f97316',/(помаранч|орандж|оранж|orange)/u],
    ['pink','Рожевий','#ec4899',/(рожев|малин|pink)/u],
    ['brown','Коричневий','#92400e',/(коричнев|brown)/u],
    ['cyan','Бірюзовий','#06b6d4',/(бірюз|cyan)/u],
    ['gray','Сірий','#64748b',/(сір|gray|grey)/u],
  ];
  const hit = colors.find((item) => item[3].test(p));
  return hit ? { colorId: hit[0], label: hit[1], hex: hit[2] } : { colorId: 'blue', label: 'Синій', hex: '#2563eb' };
}

function getForcedShadowIncrementPercent(prompt){
  const p = String(prompt || '').toLowerCase();
  const hasDecrease = /(зменш|зменши|зменшити|менш|слабш|послаб|decrease|less|weaker)/u.test(p);
  const hasAdd = /(додай|добав|добави|add)/u.test(p);
  const hasIncrease = /(збільш|збільши|збільшити|більше|посиль|підсиль|increase|more|stronger)/u.test(p);
  const hasStrong = /(сильн|потужн|виразн|яскрав|strong|intense|hard)/u.test(p);
  if (hasDecrease) return -5;
  if ((hasAdd || hasIncrease) && hasStrong) return 10;
  // 00084: Any positive shadow command must add to the current shadow.
  // User expectation: repeated "зроби тінь", "зроби синю тінь" or a composite
  // "кнопку зеленою, текст червоним, синю тінь" keeps non-shadow styles stable
  // but increases the existing shadow on every Apply iteration.
  // The runtime already knows how to initialize from the base shadow when no shadow exists.
  return 5;
}

function buildForcedButtonShadowRuntimeResult(prompt, baseResult = null, target = 'button_block'){
  const p = String(prompt || '').toLowerCase();
  const removeShadow = isShadowRemovalPrompt(prompt);
  const incrementPercent = removeShadow ? 0 : getForcedShadowIncrementPercent(prompt);
  const strong = /(сильн|потужн|виразн|яскрав|більш|збільш|посиль|підсиль|strong|intense|hard)/u.test(p);
  const soft = /(м[’'`]?як|легк|ніжн|слаб|soft|weaker)/u.test(p);
  const glow = /(підсвітк|glow|неон|neon)/u.test(p);
  const color = pickForcedShadowColor(prompt);
  const value = removeShadow ? buildForcedRemoveShadowValue() : {
    type: 'shadow',
    style: glow ? (soft ? 'soft_neon_shadow' : 'neon_shadow') : (soft ? 'soft_shadow' : 'shadow'),
    softness: soft ? 'soft' : (strong ? 'strong' : 'normal'),
    glow: glow ? 'glow' : 'shadow',
    adjustment: incrementPercent < 0 || soft ? 'softer' : (incrementPercent > 0 || strong ? 'stronger' : null),
    incrementPercent,
    incrementMode: incrementPercent ? 'relative_shadow_strength' : 'set_shadow',
    color,
    raw: 'shadow',
    confidence: 0.96,
    forcedBy: 'ai_templates_shadow_guard_00042_selection_fallback'
  };
  const command = {
    action: 'set_shadow',
    target,
    property: 'shadow_blur',
    value,
    scope: 'selected_element',
    state: 'default',
    responsive: 'all',
    selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' },
    confidence: 0.96,
    needsClarify: false,
    clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null },
    executorPrep: {
      kind: 'direct_atomic_executor_prep',
      target,
      action: 'set_shadow',
      state: 'default',
      responsive: 'all',
      atomicActions: [{ action: 'set_shadow_value', property: 'shadow_blur', value, target, state: 'default', responsive: 'all' }]
    },
    applyContract: {
      kind: 'atomic_apply_contract',
      version: 1,
      target,
      selectionMode: 'current_selection',
      applyTo: 'all_selected_if_multiple',
      operations: [{
        runtime: 'applyShadowValue',
        target,
        layer: 'shadow',
        applyTo: 'all_selected_if_multiple',
        selectionMode: 'current_selection',
        payload: { value, state: 'default', responsive: 'all', forcedBy: 'ai_templates_shadow_guard_00042_selection_fallback' },
        fallbacks: ['disable_shadow_if_not_supported']
      }]
    }
  };
  return {
    ok: true,
    sourceText: String(prompt || ''),
    normalizedText: String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim(),
    commands: [command],
    warnings: [],
    errors: [],
    assistantMessage: null,
    diagnostics: [{
      forced: true,
      ruleId: 'ai_templates_shadow_guard_00042_selection_fallback',
      reason: 'shadow prompt must use applyShadowValue on the active selected element and repeated add/increase commands must increment shadow strength',
      previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null,
      previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null,
      command
    }]
  };
}

function forceButtonShadowRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!hasShadowPrompt(prompt)) return runtimeResult;
  const target = selectedTarget || (hasButtonMention(prompt) ? 'button_block' : '');
  if (!target) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const firstRuntime = first?.applyContract?.operations?.[0]?.runtime || null;
  if (first && first.action === 'set_shadow' && firstRuntime === 'applyShadowValue') return runtimeResult;
  pushAiUiTrace({
    event: 'runtime_force_guard',
    phase: 'shadow_guard_00042_selection_fallback',
    reason: 'shadow_prompt_replaced_recipe_or_empty_parser_result_for_active_selected_element',
    selectedTarget,
    forcedTarget: target,
    previousAction: first?.action || null,
    previousProperty: first?.property || null,
    previousRuntime: firstRuntime
  });
  return buildForcedButtonShadowRuntimeResult(prompt, runtimeResult, target);
}

function hasButtonMention(prompt){
  // 00036: JS \w does NOT match Ukrainian Cyrillic letters.
  // The old /\bкнопк\w*\b/ missed forms like "кнопці", "кнопки", "кнопкою".
  // When it missed "кнопці", shadow/edit guards did not run and AI Templates fell back to recipe/create.
  const p = String(prompt || '').toLowerCase();
  return /button/i.test(p) || /кноп[а-яіїєґa-z0-9_-]*/iu.test(p);
}

function hasColorMention(prompt){
  const p = String(prompt || '').toLowerCase();
  return /(червон|зелен|син|жовт|бі(л|л)|чорн|сір|рожев|фіолет|оранж|помаранч|вишнев|коричнев|блакит|бірюз|золот|сріб|салат|малин|бордов|#(?:[0-9a-f]{3}|[0-9a-f]{6})\b|rgb\s*\()/i.test(p);
}

function isButtonColorPrompt(prompt){
  return hasButtonMention(prompt) && hasColorMention(prompt);
}


function hasTextMention(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return /(?:^|\s)(текст|тексту|текстом|текстовий|напис|надпис|label|caption|heading|заголовок|заголовку|абзац|параграф)(?:$|\s|[.,;:!?])/iu.test(p);
}

function hasTextColorPrompt(prompt){
  const p = normalizeOpacityPromptText(prompt).replace(/\s+/g, ' ').trim();
  if (!hasTextMention(p) || !hasColorMention(p)) return false;
  if (/(фон\s+тексту|background\s+of\s+text|заливк\s+тексту)/iu.test(p)) return false;
  return true;
}

function makeForcedTextColorValue(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const hex = p.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/iu);
  if (hex) return { type: 'color', colorId: 'custom', label: hex[0], hex: hex[0], raw: hex[0], confidence: 0.97, forcedBy: 'ai_templates_text_color_guard_00067_selected_descendants_force' };
  const rgb = p.match(/rgba?\s*\([^)]*\)/iu);
  if (rgb) return { type: 'color', colorId: 'custom', label: rgb[0], hex: null, raw: rgb[0], confidence: 0.95, forcedBy: 'ai_templates_text_color_guard_00067_selected_descendants_force' };
  const known = [
    ['red','Червоний','#ef4444',/(червон|red|алий|бордов|вишнев)/iu],
    ['green','Зелений','#22c55e',/(зелен|green|салат)/iu],
    ['blue','Синій','#2563eb',/(син|blue|блакит)/iu],
    ['yellow','Жовтий','#facc15',/(жовт|yellow|золот)/iu],
    ['white','Білий','#ffffff',/(білий|біло|білу|білим|white)/iu],
    ['black','Чорний','#020617',/(чорн|black)/iu],
    ['gray','Сірий','#64748b',/(сір|gray|grey)/iu],
    ['pink','Рожевий','#ec4899',/(рожев|pink|малин)/iu],
    ['purple','Фіолетовий','#8b5cf6',/(фіолет|purple)/iu],
    ['orange','Помаранчевий','#f97316',/(помаранч|оранж|orange)/iu],
    ['brown','Коричневий','#92400e',/(коричнев|brown)/iu],
    ['cyan','Бірюзовий','#06b6d4',/(бірюз|cyan)/iu],
    ['silver','Срібний','#cbd5e1',/(срібн|silver)/iu],
  ];
  const hit = known.find((item) => item[3].test(p)) || known[0];
  return { type: 'color', colorId: hit[0], label: hit[1], hex: hit[2], raw: hit[2], confidence: 0.96, forcedBy: 'ai_templates_text_color_guard_00067_selected_descendants_force' };
}

function buildForcedTextColorRuntimeResult(prompt, baseResult = null, target = 'selected_element'){
  const value = makeForcedTextColorValue(prompt);
  const property = 'text_color';
  const action = 'set_text_color';
  const operation = {
    runtime: 'applyTextColorValue',
    target,
    layer: 'text',
    applyTo: 'all_selected_if_multiple',
    selectionMode: 'current_selection',
    payload: {
      value,
      state: 'default',
      responsive: 'all',
      propagation: { mode: 'selected_and_text_descendants', includeButtons: true, includeTextBlocks: true },
      forcedBy: 'ai_templates_text_color_guard_00067_selected_descendants_force'
    },
    fallbacks: ['preserve_existing_text_color']
  };
  const atomicAction = { action: 'set_text_color_value', property, value, target, state: 'default', responsive: 'all' };
  const command = {
    action, target, property, value, scope: 'selected_element', state: 'default', responsive: 'all',
    selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' }, confidence: 0.96, needsClarify: false,
    clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null },
    executorPrep: { kind: 'direct_atomic_executor_prep', target, action, state: 'default', responsive: 'all', atomicActions: [atomicAction] },
    applyContract: { kind: 'atomic_apply_contract', version: 1, target, selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', operations: [operation] },
  };
  return { ok: true, sourceText: String(prompt || ''), normalizedText: String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim(), commands: [command], warnings: [], errors: [], assistantMessage: null, diagnostics: [{ forced: true, ruleId: 'ai_templates_text_color_guard_00067_selected_descendants_force', reason: 'text color prompt must use runtime text-color operation on selected element and all text descendants; recipe/create is blocked', previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null, previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null, command }] };
}

function forceTextColorRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  if (!hasTextColorPrompt(prompt)) return runtimeResult;
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!selectedTarget) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const runtimes = Array.isArray(first?.applyContract?.operations) ? first.applyContract.operations.map((op) => op?.runtime).filter(Boolean) : [];
  if (first && first.property === 'text_color' && runtimes.includes('applyTextColorValue')) return runtimeResult;
  pushAiUiTrace({ event: 'runtime_force_guard', phase: 'text_color_guard_00067_post_parse_force', reason: 'text_color_prompt_replaced_recipe_or_empty_parser_result_for_active_selected_element', selectedTarget, forcedTarget: selectedTarget, previousAction: first?.action || null, previousProperty: first?.property || null, previousRuntime: runtimes[0] || null });
  return buildForcedTextColorRuntimeResult(prompt, runtimeResult, selectedTarget);
}


// HOTFIX 00076:
// Bare color commands like "зроби зеленим" are edit commands for the selected element.
// They must paint the current block/button/section background and must never fall through
// to AI Templates recipe/create flow unless the prompt explicitly asks to create a button.
function isExplicitButtonCreateForBackgroundPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!hasButtonMention(p)) return false;
  if (aiStandaloneWordRegex('створи|створити|згенеруй|додай|добав|додати|створюємо').test(p) && /(?:створи|створити|згенеруй|додай|добав|додати|створюємо)[^.?!\n]{0,90}кноп[а-яіїєґa-z0-9_-]*/iu.test(p)) return true;
  if (/кноп[а-яіїєґa-z0-9_-]*[^.?!\n]{0,90}(створи|створити|згенеруй|додай|добав|додати)/iu.test(p)) return true;
  return isButtonAccusativeCreatePrompt(p);
}

function hasBackgroundColorPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!hasColorMention(p)) return false;
  if (hasTextColorPrompt(p)) return false;
  if (hasShadowPrompt(p) || hasBorderPrompt(p) || hasOpacityPrompt(p) || hasRadiusPrompt(p) || hasSizePrompt(p)) return false;
  if (/(градієнт|gradient|іконк|значок|icon|hover|ховер|посилан|link|url)/iu.test(p)) return false;
  if (isExplicitButtonCreateForBackgroundPrompt(p)) return false;
  // "зроби зеленим", "пофарбуй у зелений", "зміни колір на зелений", "залий синім".
  return hasAiStandaloneWord(p, 'зроби|пофарбуй|перефарбуй|зафарбуй|залий|зміни|постав|дай|зробити|make|paint|set')
    || /(кольор|колір|фон|заливк|background)/iu.test(p);
}

function makeForcedBackgroundColorValue(prompt){
  const value = makeForcedTextColorValue(prompt);
  return {
    ...value,
    forcedBy: 'ai_templates_background_color_guard_00076_selected_force',
    confidence: Math.max(Number(value.confidence || 0), 0.96)
  };
}

function buildForcedBackgroundColorRuntimeResult(prompt, baseResult = null, target = 'selected_element'){
  const value = makeForcedBackgroundColorValue(prompt);
  const property = 'background_color';
  const action = 'set_background';
  const operation = {
    runtime: 'applyBackgroundValue',
    target,
    layer: 'surface',
    applyTo: 'all_selected_if_multiple',
    selectionMode: 'current_selection',
    payload: {
      value,
      state: 'default',
      responsive: 'all',
      forcedBy: 'ai_templates_background_color_guard_00076_selected_force'
    },
    fallbacks: ['preserve_existing_background']
  };
  const atomicAction = { action: 'set_background_value', property, value, target, state: 'default', responsive: 'all' };
  const command = {
    action, target, property, value, scope: 'selected_element', state: 'default', responsive: 'all',
    selectionSemantics: { mode: 'current_selection', applyTo: 'all_selected_if_multiple', fallback: 'single_selected' }, confidence: 0.96, needsClarify: false,
    clarify: { needsClarify: false, ruleId: null, question: null, options: [], severity: null },
    executorPrep: { kind: 'direct_atomic_executor_prep', target, action, state: 'default', responsive: 'all', atomicActions: [atomicAction] },
    applyContract: { kind: 'atomic_apply_contract', version: 1, target, selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', operations: [operation] },
  };
  return { ok: true, sourceText: String(prompt || ''), normalizedText: String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim(), commands: [command], warnings: [], errors: [], assistantMessage: null, diagnostics: [{ forced: true, ruleId: 'ai_templates_background_color_guard_00076_selected_force', reason: 'bare color prompt must use runtime background color operation on selected element; recipe/create is blocked', previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null, previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null, command }] };
}

function forceBackgroundColorRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot){
  if (!hasBackgroundColorPrompt(prompt)) return runtimeResult;
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (!selectedTarget) return runtimeResult;
  const first = Array.isArray(runtimeResult?.commands) ? runtimeResult.commands[0] : null;
  const runtimes = Array.isArray(first?.applyContract?.operations) ? first.applyContract.operations.map((op) => op?.runtime).filter(Boolean) : [];
  if (first && (first.property === 'background_color' || first.property === 'background') && runtimes.includes('applyBackgroundValue')) return runtimeResult;
  pushAiUiTrace({ event: 'runtime_force_guard', phase: 'background_color_guard_00076_post_parse_force', reason: 'background_color_prompt_replaced_recipe_or_empty_parser_result_for_active_selected_element', selectedTarget, forcedTarget: selectedTarget, previousAction: first?.action || null, previousProperty: first?.property || null, previousRuntime: runtimes[0] || null });
  return buildForcedBackgroundColorRuntimeResult(prompt, runtimeResult, selectedTarget);
}


// HOTFIX 00080:
// Composite commands like "зроби кнопку синьою а текст жовтим" must become
// several runtime operations, not a single text-color/background command.
// This block intentionally lives in the AI Templates guard layer because it
// must run before the old single-property guards and before recipe/create.
function ai80ColorWordPattern(){
  return '(?:#(?:[0-9a-f]{3}|[0-9a-f]{6})\\b|rgba?\\s*\\([^)]*\\)|червон\\S*|зелен\\S*|син\\S*|жовт\\S*|бі(?:л|л)\\S*|чорн\\S*|сір\\S*|рожев\\S*|фіолет\\S*|помаранч\\S*|оранж\\S*|вишнев\\S*|коричнев\\S*|блакит\\S*|бірюз\\S*|золот\\S*|срібн\\S*|салат\\S*|малин\\S*|бордов\\S*|red|green|blue|yellow|white|black|gray|grey|pink|purple|orange|brown|cyan|silver|gold)';
}
function ai80NormalizePrompt(prompt){
  return String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// 00105: Logical separators for text and voice commands.
// Commas from the voice widget are only a helper; typed commands without
// commas must behave the same. Treat conjunctions before a known style
// property as soft separators inside the composite runtime splitter.
// Example:
//   "зроби блок синім і рамку зеленою та тінь жовтою"
// becomes logically:
//   "зроби блок синім, рамку зеленою, тінь жовтою"
// This stays inside parsing only; it does not rewrite the user's prompt field.
function ai80NormalizeCompositeLogicalSeparators(prompt){
  const propertyLead = '(?:фон|background|заливк\S*|рамк\S*|бордер\S*|border|контур\S*|обводк\S*|тінь|тінню|тіні|shadow|box\s*-?shadow|підсвітк\S*|glow|неон|текст\S*|напис\S*|надпис\S*|label|caption|заголов\S*|радіус\S*|radius|скругл\S*|прозор\S*|opacity|відступ\S*|padding|margin|gap)';
  let text = String(prompt || '').replace(/\s+/g, ' ').trim();
  text = text.replace(new RegExp('\s+(?:і|й|та|а|також|плюс|ще|далі|потім)\s+(?=' + propertyLead + '(?:\s|$))', 'giu'), ', ');
  return text
    .replace(/\s*([,;])\s*/g, '$1 ')
    .replace(/\s*([.?!])\s*$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
function ai80FindKeywordIndex(raw, keywordRe){
  const re = keywordRe instanceof RegExp ? keywordRe : new RegExp(String(keywordRe || ''), 'iu');
  const m = re.exec(String(raw || '').toLowerCase());
  return m ? { index: m.index, length: String(m[0] || '').length } : null;
}
function ai80ClauseAroundKeyword(prompt, keywordRe){
  const raw = String(prompt || '');
  const lower = raw.toLowerCase();
  const hit = ai80FindKeywordIndex(raw, keywordRe);
  if (!hit) return '';
  const idx = hit.index;
  const before = lower.slice(0, idx);
  const startDelims = ['\n', '.', ';', '!', '?', ',', ' а ', ' але ', ' проте ', ' та ', ' і '];
  let start = 0;
  for (const d of startDelims) {
    const pos = before.lastIndexOf(d);
    if (pos >= 0) start = Math.max(start, pos + d.length);
  }
  const after = lower.slice(idx + hit.length);
  const endDelims = ['\n', '.', ';', '!', '?', ',', ' а ', ' але ', ' проте ', ' та ', ' і '];
  let end = raw.length;
  for (const d of endDelims) {
    const pos = after.indexOf(d);
    if (pos >= 0) end = Math.min(end, idx + hit.length + pos);
  }
  return raw.slice(start, end).trim();
}
function ai80RemoveClause(prompt, clause){
  const raw = String(prompt || '');
  const c = String(clause || '').trim();
  return c ? raw.replace(c, ' ') : raw;
}
function ai80ExtractTextColorClause(prompt){
  const raw = String(prompt || '');
  const color = ai80ColorWordPattern();
  const textWord = '(?:текст\\S*|напис\\S*|надпис\\S*|label|caption|заголов\\S*)';
  // Keep this clause as narrow as possible.
  // Example: "кнопку зроби жовтою з червоним текстом" must keep
  // "кнопку зроби жовтою" available for the background splitter and extract
  // only "з червоним текстом" / "червоним текстом" as text color.
  const nonTextStyleAfterColor = '(?!\\s+(?:\\bborder\\b|бордер\\S*|рамк\\S*|обводк\\S*|контур\\S*|outline|тінь\\S*|shadow|box\\s*-?shadow|підсвітк\\S*|glow|неон))';
  const narrowPatterns = [
    // 00084: Prefer "текст червоним" over the accidental "зеленою текст"
    // from prompts like "зроби кнопку зеленою текст червоним", but do not steal
    // the color from following border/shadow clauses like "жовтим текстом червоним бордером".
    new RegExp(textWord + '\\s+(?:зроби|зробити|зміни|постав|дай|make|set)?\\s*(?:у|в|на)?\\s*(' + color + ')(?=\\s|$|[,.!?;:])' + nonTextStyleAfterColor, 'iu'),
    new RegExp('(?:із|з|с|with)\\s+(' + color + ')\\s+' + textWord, 'iu'),
    new RegExp('(' + color + ')\\s+' + textWord, 'iu'),
  ];
  for (const re of narrowPatterns) {
    const m = re.exec(raw);
    if (m && m[0] && hasColorMention(m[0])) return String(m[0]).trim();
  }
  const textClause = ai80ClauseAroundKeyword(prompt, /(?:текст|тексту|текстом|напис|надпис|label|caption|заголовок)/iu);
  if (textClause && hasColorMention(textClause)) return textClause;
  return '';
}
function ai80ExtractBorderClause(prompt){
  const raw = String(prompt || '');
  const color = ai80ColorWordPattern();
  const borderWord = '(?:\\bborder\\b|бордер\\S*|рамк\\S*|обводк\\S*|контур\\S*|outline)';
  const lengthWord = '(?:\\d+(?:[.,]\\d+)?\\s*(?:px|пікс\\S*)|тонк\\S*|товст\\S*|жирн\\S*)';
  // Keep border narrow too. Otherwise a phrase like
  // "кнопку синьою із жовтим текстом червоним бордером" made the
  // background splitter see "червоним" and painted the button red.
  const narrowPatterns = [
    // 00103: Prefer the color AFTER the explicit border keyword.
    // Example: "зроби блок синім рамку зеленою" means:
    // background = синій, border = зелений.
    // The older order matched "синім рамку" first, so it stole the
    // background color and swapped background/border colors.
    // Important: the first pattern requires a color after the border word;
    // otherwise "червоним бордером" would be reduced to bare "бордером"
    // and would lose its explicit color.
    new RegExp(borderWord + '\\s+(' + color + ')(?:\\s+' + lengthWord + ')?', 'iu'),
    new RegExp(lengthWord + '\\s+' + borderWord + '(?:\\s+(' + color + '))?', 'iu'),
    new RegExp('(' + color + ')\\s+' + borderWord + '(?:\\s+' + lengthWord + ')?', 'iu'),
    new RegExp(borderWord + '(?:\\s+' + lengthWord + ')?', 'iu'),
  ];
  for (const re of narrowPatterns) {
    const m = re.exec(raw);
    if (m && m[0]) return String(m[0]).trim();
  }
  const borderClause = ai80ClauseAroundKeyword(prompt, /(?:\bborder\b|бордер|бордером|рамк|рамку|рамкою|обводк|контур|outline)/iu);
  return borderClause || '';
}
function ai80ExtractShadowClause(prompt){
  const raw = String(prompt || '');
  const color = ai80ColorWordPattern();
  const shadowWord = '(?:тінь|тінню|тіні|тіньову|тіньовий|shadow|box\\s*-?shadow|підсвітк\\S*|glow|неон)';
  const intensityWord = '(?:легк\\S*|слаб\\S*|м[’\'`]?як\\S*|ніжн\\S*|сильн\\S*|потужн\\S*|виразн\\S*|яскрав\\S*|soft|strong|hard|intense)';
  // Keep shadow narrow. "додай легоньку тінь до блока із текстом ..."
  // must not let the text color become the shadow color.
  const narrowPatterns = [
    // 00084: keep both forms: "синю тінь" and "тінь синю/червону".
    new RegExp('(?:додай|добав|добави|зроби|постав|дай|зменш|зменши|зменшити|послаб|add|make|set|decrease|less|weaker)?\\s*(?:' + intensityWord + '\\s+)?(?:(' + color + ')\\s+)?' + shadowWord + '(?:\\s+(' + color + '))?', 'iu'),
    new RegExp(shadowWord + '(?:\\s+(?:' + intensityWord + '))?(?:\\s+(' + color + '))?', 'iu'),
  ];
  for (const re of narrowPatterns) {
    const m = re.exec(raw);
    if (m && m[0]) return String(m[0]).trim();
  }
  const shadowClause = ai80ClauseAroundKeyword(prompt, /(?:тінь|тінню|тіні|shadow|box\s*-?shadow|підсвітк|glow|неон)/iu);
  return shadowClause || '';
}
function ai80HasButtonSurfaceColorClause(prompt){
  const p = ai80NormalizePrompt(prompt);
  if (!hasButtonMention(p) || !hasColorMention(p)) return false;
  const textClause = ai80ExtractTextColorClause(prompt);
  const surfaceText = ai80RemoveClause(prompt, textClause);
  return hasColorMention(surfaceText);
}
function ai80ShouldUseCompositeRuntime(prompt){
  const logicalPrompt = ai80NormalizeCompositeLogicalSeparators(prompt);
  const parts = [];
  const textClause = ai80ExtractTextColorClause(logicalPrompt);
  const borderClause = ai80ExtractBorderClause(logicalPrompt);
  const shadowClause = ai80ExtractShadowClause(logicalPrompt);
  let surfacePrompt = String(logicalPrompt || '');
  surfacePrompt = ai80RemoveClause(surfacePrompt, textClause);
  surfacePrompt = ai80RemoveClause(surfacePrompt, borderClause);
  surfacePrompt = ai80RemoveClause(surfacePrompt, shadowClause);

  // 00102: для фраз типу "зроби блок червоним а тінь жовту"
  // background треба шукати у залишку після вилучення shadow/text/border,
  // інакше старий shadow_guard забирав перший колір "червоним" як колір тіні.
  // 00105: also use logical separators for typed commands without commas:
  // "... і рамку ... та тінь ..." behaves like comma-separated clauses.
  if (ai80HasButtonSurfaceColorClause(logicalPrompt) || hasBackgroundColorPrompt(surfacePrompt)) parts.push('background');
  if (hasTextColorPrompt(logicalPrompt) || textClause) parts.push('text');
  if (shadowClause || hasShadowPrompt(logicalPrompt)) parts.push('shadow');
  if (borderClause || hasBorderPrompt(logicalPrompt)) parts.push('border');
  // Radius/opacity/spacing are left to their own guards unless they are mixed with another property.
  if (hasRadiusPrompt(logicalPrompt)) parts.push('radius');
  if (hasOpacityPrompt(logicalPrompt)) parts.push('opacity');
  if (hasSpacingPrompt(logicalPrompt)) parts.push('spacing');
  return Array.from(new Set(parts)).length >= 2;
}
function ai80MergeRuntimeResults(prompt, results){
  const commands = [];
  const diagnostics = [];
  for (const result of (Array.isArray(results) ? results : [])) {
    if (!result || typeof result !== 'object') continue;
    if (Array.isArray(result.commands)) commands.push(...result.commands.filter(Boolean));
    if (Array.isArray(result.diagnostics)) diagnostics.push(...result.diagnostics.filter(Boolean));
  }
  commands.forEach((cmd, index) => {
    if (cmd && typeof cmd === 'object') cmd.index = index;
  });
  return {
    ok: commands.length > 0,
    sourceText: String(prompt || ''),
    normalizedText: ai80NormalizePrompt(prompt),
    commands,
    warnings: [],
    errors: [],
    assistantMessage: null,
    diagnostics: diagnostics.length ? diagnostics : [{ forced: true, ruleId: 'ai_templates_composite_guard_00080_multi_property_force', reason: 'multi-property prompt split into atomic runtime operations', commandCount: commands.length }],
  };
}
function buildForcedCompositeRuntimeResult(prompt, baseResult = null, target = 'selected_element'){
  const logicalPrompt = ai80NormalizeCompositeLogicalSeparators(prompt);
  const pieces = [];
  const textClause = ai80ExtractTextColorClause(logicalPrompt);
  const borderClause = ai80ExtractBorderClause(logicalPrompt);
  const shadowClause = ai80ExtractShadowClause(logicalPrompt);
  let surfacePrompt = String(logicalPrompt || '');
  surfacePrompt = ai80RemoveClause(surfacePrompt, textClause);
  surfacePrompt = ai80RemoveClause(surfacePrompt, borderClause);
  surfacePrompt = ai80RemoveClause(surfacePrompt, shadowClause);
  if ((ai80HasButtonSurfaceColorClause(logicalPrompt) || hasBackgroundColorPrompt(surfacePrompt)) && hasColorMention(surfacePrompt)) {
    pieces.push(buildForcedBackgroundColorRuntimeResult(surfacePrompt, baseResult, target));
  }
  if (textClause || hasTextColorPrompt(logicalPrompt)) {
    pieces.push(buildForcedTextColorRuntimeResult(textClause || logicalPrompt, baseResult, target));
  }
  if (shadowClause || hasShadowPrompt(logicalPrompt)) {
    pieces.push(buildForcedButtonShadowRuntimeResult(shadowClause || logicalPrompt, baseResult, target));
  }
  if (borderClause || hasBorderPrompt(logicalPrompt)) {
    pieces.push(buildForcedBorderRuntimeResult(borderClause || logicalPrompt, baseResult, target));
  }
  if (hasRadiusPrompt(logicalPrompt)) pieces.push(buildForcedRadiusRuntimeResult(logicalPrompt, baseResult, target));
  if (hasOpacityPrompt(logicalPrompt)) pieces.push(buildForcedOpacityRuntimeResult(logicalPrompt, baseResult, target));
  if (hasSpacingPrompt(logicalPrompt)) pieces.push(buildForcedSpacingRuntimeResult(logicalPrompt, baseResult, target));
  const merged = ai80MergeRuntimeResults(prompt, pieces);
  merged.normalizedText = ai80NormalizePrompt(logicalPrompt);
  if (logicalPrompt !== String(prompt || '').replace(/\s+/g, ' ').trim()) {
    merged.diagnostics.unshift({
      forced: true,
      ruleId: 'ai_templates_composite_separator_guard_00105_logical_commas',
      reason: 'logical conjunctions before style properties were treated as comma separators for parsing only',
      originalText: String(prompt || ''),
      logicalText: logicalPrompt,
    });
  }
  merged.diagnostics.unshift({
    forced: true,
    ruleId: 'ai_templates_composite_guard_00080_multi_property_force',
    reason: 'composite prompt was split into background/text/shadow/border/radius/opacity/spacing runtime commands before recipe fallback',
    previousAction: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].action : null,
    previousProperty: Array.isArray(baseResult?.commands) && baseResult.commands[0] ? baseResult.commands[0].property : null,
    commandCount: merged.commands.length,
  });
  return merged;
}
function ai80IsButtonStyleButNoActiveButtonCreate(prompt, selectionSnapshot){
  if (!ai86IsButtonSurfaceStylePrompt(prompt)) return false;
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  return !!selectedTarget && selectedTarget !== 'button_block';
}
function ai80ButtonStyleNeedsSelection(prompt, selectionSnapshot){
  if (!ai86IsButtonSurfaceStylePrompt(prompt)) return false;
  return !selectionSnapshotToAiTarget(selectionSnapshot || {});
}

// HOTFIX 00086:
// "зроби синю кнопку із жовтим текстом" is a button-surface style prompt.
// If the active selection is already a button, runtime edits that button.
// If the active selection is a row/container/block, create a new styled button there.
// The old detector only matched instrumental forms like "синьою кнопкою/кнопку синьою"
// and missed accusative/adjective forms like "синю кнопку", so composite runtime painted the row.
function ai86ButtonColorAdjectivePattern(){
  return String.raw`(?:червон\S*|зелен\S*|син\S*|жовт\S*|бі(?:л|л)\S*|чорн\S*|сір\S*|рожев\S*|фіолет\S*|помаранч\S*|орандж\S*|оранж\S*|вишнев\S*|коричнев\S*|блакит\S*|бірюз\S*|золот\S*|срібн\S*|салат\S*|малин\S*|бордов\S*|red|green|blue|yellow|white|black|gray|grey|pink|purple|orange|brown|cyan|silver|gold|#[0-9a-f]{3,6})`;
}
function ai86HasButtonSurfaceColorPhrase(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!hasButtonMention(p) || !hasColorMention(p)) return false;
  const color = ai86ButtonColorAdjectivePattern();
  const button = 'кноп[а-яіїєґa-z0-9_-]*|button';
  const beforeButton = new RegExp(`${ST_AI_WORD_LEFT_BOUNDARY}${color}${ST_AI_WORD_RIGHT_BOUNDARY}[^.?!\n]{0,80}(?:${button})`, 'iu');
  const afterButton = new RegExp(`(?:${button})[^.?!\n]{0,80}${ST_AI_WORD_LEFT_BOUNDARY}${color}${ST_AI_WORD_RIGHT_BOUNDARY}`, 'iu');
  return beforeButton.test(p) || afterButton.test(p);
}
function ai86IsButtonSurfaceStylePrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!hasButtonMention(p)) return false;
  if (ai86HasButtonSurfaceColorPhrase(p)) return true;
  if (isButtonInstrumentalColorEditPrompt(p) || isButtonAccusativeCreatePrompt(p)) return true;
  return false;
}

function isButtonInstrumentalColorEditPrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!hasButtonMention(p) || !hasColorMention(p)) return false;
  // Українська підказка: "кнопку червоною/синьою/зеленою" зазвичай означає змінити стан поточної кнопки.
  const color = '(?:червоною|зеленою|синьою|жовтою|білою|чорною|сірою|рожевою|фіолетовою|помаранчевою|оранджевою|оранжевою|вишневою|коричневою|блакитною|бірюзовою|золотою|срібною|салатовою|малиновою|бордовою)';
  return new RegExp(`кноп[а-яіїєґa-z0-9_-]*[^.?!\\n]{0,80}${color}${ST_AI_WORD_RIGHT_BOUNDARY}`, 'iu').test(p)
    || new RegExp(`${color}${ST_AI_WORD_RIGHT_BOUNDARY}[^.?!\\n]{0,80}кноп[а-яіїєґa-z0-9_-]*`, 'iu').test(p);
}
function isButtonAccusativeCreatePrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!hasAiStandaloneWord(p, 'зроби') || !hasButtonMention(p) || !hasColorMention(p)) return false;
  // Приклад від користувача: "Зроби кнопку червону" = створи нову кнопку в активному блоці.
  const color = '(?:червону|зелену|синю|жовту|білу|чорну|сіру|рожеву|фіолетову|помаранчеву|оранджеву|оранжеву|вишневу|коричневу|блакитну|бірюзову|золоту|срібну|салатову|малинову|бордову)';
  return new RegExp(`кноп[а-яіїєґa-z0-9_-]*[^.?!\\n]{0,80}${color}${ST_AI_WORD_RIGHT_BOUNDARY}`, 'iu').test(p);
}
function isExplicitButtonCreatePrompt(prompt){
  const p = String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  // 00085: "додай жовту кнопку з чорним надписом ..." is creation.
  // It must not be captured by composite runtime and applied to the selected row + all children.
  // Effect-only forms like "додай тінь кнопці" still stay runtime edits.
  const directCreateVerb = '(?:створи|створити|згенеруй|додати|додай|добав|добави|add|create|make)';
  const filler = String.raw`(?:[\p{L}\p{N}#,.()\-]+\s+){0,8}`;
  const directButtonObject = new RegExp(String.raw`(?:^|\s)` + directCreateVerb + String.raw`\s+` + filler + String.raw`(?:кнопку|кнопка|кнопки|button)(?:$|\s|[,.!?;:])`, 'iu');
  if (directButtonObject.test(p)) return true;
  if (/(нову\s+кнопку|новий\s+button)/iu.test(p)) return true;
  // "додай/зроби тінь/фон/текст/рамку кнопці" is an effect edit, not new button creation.
  if (isButtonEffectEditPrompt(p)) return false;
  // "зроби кнопку червону" = create; "зроби кнопку червоною" = edit active button.
  if (isButtonAccusativeCreatePrompt(p)) return true;
  return false;
}

function shouldClarifyButtonColorPrompt(prompt, runtimeResult, selectionSnapshot, currentAction){
  if (!isButtonInstrumentalColorEditPrompt(prompt)) return false;
  if (isExplicitButtonCreatePrompt(prompt)) return false;
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
  if (selectedTarget === 'button_block') return false;
  const first = Array.isArray(runtimeResult && runtimeResult.commands) ? runtimeResult.commands[0] : null;
  if (first && first.target && String(first.target) !== 'button_block') return false;
  return true;
}

function shouldUseRuntimeFlow(prompt, runtimeResult, selectionSnapshot, currentAction){
  if (!runtimeResult || !hasRuntimeContracts(runtimeResult)) return false;
  if (!selectionSnapshot || !selectionSnapshot.type) return false;
  const selectedTarget = selectionSnapshotToAiTarget(selectionSnapshot);
  if (!selectedTarget) return false;
  const first = Array.isArray(runtimeResult.commands) ? runtimeResult.commands[0] : null;
  if (!first || !first.target) return false;
  if (String(first.target) !== String(selectedTarget)) return false;
  if (currentAction === 'update') return true;
  // Active button + style/effect words must always edit the active button.
  // This protects phrases like "додай сильну синю тінь кнопці" from recipe/create flow.
  if (selectedTarget === 'button_block' && isButtonEffectEditPrompt(prompt)) return true;
  if (isExplicitButtonCreatePrompt(prompt) || isCreateIntentPrompt(prompt)) return false;
  if (selectedTarget === 'button_block' && isButtonColorPrompt(prompt)) return true;
  return isLikelyStyleEditPrompt(prompt);
}

function clarifyButtonColorHtml(prompt, selectionSnapshot){
  const selected = selectionSnapshot && selectionSnapshot.type ? String(selectionSnapshot.type) : 'контейнер / блок';
  const escapedPrompt = String(prompt || '').replace(/[<>&]/g, (ch) => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[ch]));
  return `
    <div class="st-ai-plan st-ai-plan--clarify">
      <div class="st-ai-plan__title">Потрібне уточнення</div>
      <div class="st-ai-plan__warn">Команда схожа на зміну кольору кнопки, але зараз активна не кнопка, а <b>${selected}</b>.</div>
      <div class="st-ai-plan__summary">Фраза <b>${escapedPrompt}</b> може означати два різні сценарії.</div>
      <div class="st-ai-clarify-actions">
        <button type="button" class="st-ai-btn st-ai-btn--primary" data-st-ai-clarify="edit">Змінити поточну кнопку</button>
        <button type="button" class="st-ai-btn" data-st-ai-clarify="add">Додати нову кнопку</button>
      </div>
      <div class="st-ai-plan__note">Для редагування вибери саму кнопку і напиши: <b>Зроби кнопку червоною</b>. Для створення в активному блоці напиши: <b>Зроби кнопку червону</b> або натисни «Додати нову кнопку».</div>
    </div>`;
}

function runtimePreviewHtml(result, selectionSnapshot){
  const first = summarizeRuntimeFirstCommand(result);
  const selected = selectionSnapshot && selectionSnapshot.type ? String(selectionSnapshot.type) : 'невідомо';
  const commandCount = Array.isArray(result && result.commands) ? result.commands.length : 0;
  const canApply = hasRuntimeContracts(result);
  const scopeLabel = result && result.__targetScopeLabel ? String(result.__targetScopeLabel) : (result?.targetScope?.label ? String(result.targetScope.label) : 'поточний');
  return `
    <div class="st-ai-plan">
      <div class="st-ai-plan__title">AI Runtime command</div>
      <div class="st-ai-pills">
        <span class="st-ai-pill">Режим: <b>runtime</b></span>
        <span class="st-ai-pill">Вибране: <b>${selected}</b></span>
        <span class="st-ai-pill">Команд: <b>${commandCount}</b></span>
        <span class="st-ai-pill">Рівні: <b>${scopeLabel}</b></span>
      </div>
      <div class="st-ai-plan__summary">Команда розпізнана як runtime-зміна. Новий блок не створюється — «Застосувати» запустить команду до вибраних рівнів дерева.</div>
      ${first ? `<ul class="st-ai-steps"><li><span class="st-ai-step__idx">1</span><div class="st-ai-step__text"><div class="st-ai-step__title">${first.action}</div><div class="st-ai-step__desc">target: <b>${first.target}</b>, property: <b>${first.property}</b>, value: <b>${first.value}</b>, confidence: <b>${first.confidence.toFixed(2)}</b></div></div></li></ul>` : ''}
      <div class="st-ai-plan__note">${canApply ? 'Після «Застосувати» runtime змінить тільки вибрані рівні: ${scopeLabel}.' : 'Команда поки не має apply-contract, тому «Застосувати» буде вимкнено.'}</div>
    </div>`;
}

function buildSelectionSnapshot(getSelection){
  const block = selectedBlockFromSelection(getSelection);
  if (!block || !block.classList) return null;
  if (block.classList.contains('st-block--button')) {
    const iconSvgEl = block.querySelector(':scope > .st-button__iconbtn .st-button__iconsvg');
    return {
      type: 'button',
      detail: {
        mode: String(block.dataset?.buttonMode || 'text-icon'),
        iconPosition: String(block.dataset?.buttonIconPos || 'left'),
        icon: block.dataset?.buttonIconSvg || iconSvgEl ? {
          svg: String(block.dataset?.buttonIconSvg || (iconSvgEl ? iconSvgEl.innerHTML : '') || ''),
          defaultColor: String(block.dataset?.buttonIconColor || '#ffffff')
        } : null,
        extras: {
          preset: String(block.dataset?.buttonExtraPreset || 'primary'),
          shape: String(block.dataset?.buttonShape || 'rounded'),
          fillMode: String(block.dataset?.buttonFillMode || 'solid'),
          color1: String(block.dataset?.buttonColor1 || '#2563eb'),
          color2: String(block.dataset?.buttonColor2 || '#60a5fa'),
          angle: Number(block.dataset?.buttonGradientAngle || 135) || 135,
          gradientStops: (() => {
            try {
              const raw = String(block.dataset?.buttonGradientStops || '').trim();
              const parsed = raw ? JSON.parse(raw) : [];
              return Array.isArray(parsed) ? parsed : [];
            } catch(e) {
              return [];
            }
          })(),
        },
        hover: {
          target: 'block',
          metrics: {
            block: {
              opacity: Number(block.dataset?.buttonHoverBlockOpacity || 100) || 100,
              scale: Number(block.dataset?.buttonHoverBlockScale || 100) || 100,
              offsetY: Number(block.dataset?.buttonHoverBlockOffsetY || 0) || 0,
            },
            label: {
              opacity: Number(block.dataset?.buttonHoverLabelOpacity || 100) || 100,
              scale: Number(block.dataset?.buttonHoverLabelScale || 100) || 100,
              offsetY: Number(block.dataset?.buttonHoverLabelOffsetY || 0) || 0,
            },
            icon: {
              opacity: Number(block.dataset?.buttonHoverIconOpacity || 100) || 100,
              scale: Number(block.dataset?.buttonHoverIconScale || 100) || 100,
              offsetY: Number(block.dataset?.buttonHoverIconOffsetY || 0) || 0,
            },
          }
        }
      }
    };
  }
  return { type: elementTypeFromDom(block) || 'unknown' };
}

function recipeToHtml(recipe){
  if (!recipe) return '';
  const meta = recipe.__meta || {};
  const chips = [
    `<span class="st-ai-pill">Тип: <b>${kindLabel(meta.kind || recipe.kind || 'button')}</b></span>`,
    `<span class="st-ai-pill">Куди: <b>${contextLabel(meta.context || 'selection')}</b></span>`,
    `<span class="st-ai-pill">Дія: <b>${actionLabel(meta.action || 'create')}</b></span>`,
    meta.targetScopeLabel ? `<span class="st-ai-pill">Рівні: <b>${meta.targetScopeLabel}</b></span>` : ''
  ].join('');

  const rows = (recipe.items || []).map((item, idx) => {
    const title = blockTypeLabel(item.type);
    let desc = '';
    if (item.type === 'button') {
      const d = item.detail || {};
      desc = `текст: <b>${String(d.text || 'Кнопка')}</b>, режим: <b>${String(d.mode || 'text')}</b>`;
    } else if (item.type === 'logo') {
      const d = item.detail || {};
      desc = `режим: <b>${String(d.mode || 'text-only')}</b>${d.__brandText ? `, бренд: <b>${String(d.__brandText)}</b>` : ''}`;
    } else if (item.type === 'png') {
      const d = item.detail || {};
      desc = `режим: <b>PNG placeholder</b>${d.extras && d.extras.preset && d.extras.preset !== 'none' ? `, preset: <b>${String(d.extras.preset)}</b>` : ''}`;
    } else if (item.type === 'menu') {
      desc = `варіант: <b>${String(item.detail && item.detail.variant || 'big')}</b>`;
    }
    return `<li><span class="st-ai-step__idx">${idx + 1}</span><div class="st-ai-step__text"><div class="st-ai-step__title">${title}</div><div class="st-ai-step__desc">${desc}</div></div></li>`;
  }).join('');

  const warn = meta.warning ? `<div class="st-ai-plan__warn">${meta.warning}</div>` : '';
  const target = meta.targetSummary ? `<div class="st-ai-plan__target">Контекст: <b>${meta.targetSummary}</b></div>` : '';
  return `
    <div class="st-ai-plan">
      <div class="st-ai-plan__title">${recipe.title || 'Шаблон'}</div>
      <div class="st-ai-pills">${chips}</div>
      ${target}
      <div class="st-ai-plan__summary">${recipe.summary || ''}</div>
      ${warn}
      <ul class="st-ai-steps">${rows}</ul>
      <div class="st-ai-plan__note">${recipe.applyNote || ''}</div>
    </div>`;
}

function buildSection(){
  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;
  sectionEl.innerHTML = `
    <button class="design-section__header" type="button" aria-expanded="false">
      <div class="design-section__header-title"><span>Шаблони AI</span></div>
      <span class="st-ai-header-tooltip" role="tooltip">
        <b>Шаблони AI</b>
        <span>Введи або продиктуй команду, наприклад: “зроби активний блок червоним”, “зроби синю кнопку із жовтим текстом”, “додай тінь”. Далі натисни “Згенерувати”, перевір план і натисни “Застосувати”.</span>
      </span>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body">
      <div class="st-ai-card">
        <div class="st-ai-subtitle">До яких елементів застосувати</div>
        <div class="st-ai-scope-grid" data-st-ai-scope-group>
          <label class="st-ai-scope-option"><input type="checkbox" value="0" data-st-ai-scope-level> <span>Поточний елемент</span></label>
          <label class="st-ai-scope-option"><input type="checkbox" value="1" data-st-ai-scope-level> <span>Дочірні · 1-ше споріднення</span></label>
          <label class="st-ai-scope-option"><input type="checkbox" value="2" data-st-ai-scope-level> <span>Дочірні · 2-ге споріднення</span></label>
          <label class="st-ai-scope-option"><input type="checkbox" value="3" data-st-ai-scope-level> <span>Дочірні · 3-тє споріднення</span></label>
        </div>
        <div class="st-ai-actions st-ai-actions--select-warning">
          <button type="button" class="st-ai-btn st-ai-btn--select-warning" data-st-ai-select-warning disabled>Виберіть елемент !!!</button>
        </div>

        <label class="st-ai-field">
          <span class="st-ai-field__label">Опис клієнта / задача</span>
          <textarea class="st-ai-textarea" rows="5" placeholder="Наприклад: Зроби синю CTA-кнопку «Замовити» з іконкою телефону. Або: Зроби лого з брендом «Orion Studio»." data-st-ai-prompt></textarea>
        </label>

        <div class="st-ai-actions st-ai-actions--main">
          <button type="button" class="st-ai-btn st-ai-btn--ghost" data-st-ai-generate>Згенерувати</button>
          <button type="button" class="st-ai-btn st-ai-btn--primary" data-st-ai-apply disabled>Застосувати</button>
        </div>
        <div class="st-ai-actions st-ai-actions--debug-row">
          <button type="button" class="st-ai-btn st-ai-btn--debug" data-st-ai-debug-toggle>Відлагодження: ВИКЛ</button>
        </div>
        <div class="st-ai-actions st-ai-actions--secondary st-ai-actions--links-main">
          <a class="st-ai-link" href="./ai-command-audit.html">Аудит AI</a>
          <a class="st-ai-link" href="./ai-command-test.html">AI Тест</a>
        </div>
        <div class="st-ai-actions st-ai-actions--secondary st-ai-actions--journal">
          <a class="st-ai-link" href="./ai-command-debug.html">Журнал відлагодження</a>
        </div>

        <div class="st-ai-preview" data-st-ai-preview></div>
        <div class="st-ai-status" data-st-ai-status></div>
      </div>
    </div>

    <style>

      #${SEC_ID} .design-section__header{ position:relative; overflow:visible; }
      #${SEC_ID} .st-ai-header-tooltip{ position:absolute; left:8px; right:8px; top:calc(100% + 8px); z-index:9999; display:grid; gap:6px; padding:14px 16px; border-radius:14px; border:1px solid rgba(15,23,42,.18); background:#ffffff !important; color:#020617 !important; box-shadow:0 18px 44px rgba(15,23,42,.24); font-size:15px; line-height:1.45; font-weight:700; text-align:left; opacity:0; transform:translateY(-4px); pointer-events:none; transition:opacity .16s ease, transform .16s ease; }
      #${SEC_ID} .st-ai-header-tooltip b{ color:#020617 !important; font-size:16px; font-weight:900; }
      #${SEC_ID} .st-ai-header-tooltip span{ color:#0f172a !important; font-size:15px; font-weight:700; }
      #${SEC_ID} .design-section__header:hover .st-ai-header-tooltip{ opacity:1; transform:translateY(0); transition-delay:3s; }
      #${SEC_ID} .st-ai-card{ border:1px solid rgba(148,163,184,0.20); border-radius:12px; padding:12px; background:rgba(15,23,42,0.04); }
      #${SEC_ID} .st-ai-badge{ display:inline-flex; padding:4px 8px; border-radius:999px; border:1px solid rgba(148,163,184,0.24); background:rgba(255,255,255,0.68); font-size:11px; font-weight:700; margin-bottom:10px; }
      #${SEC_ID} .st-ai-subtitle{ margin:10px 0 6px; font-size:11px; font-weight:800; letter-spacing:.02em; text-transform:uppercase; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; text-shadow:0 1px 2px rgba(0,0,0,.35); }
      #${SEC_ID} .st-ai-row{ display:flex; gap:8px; flex-wrap:wrap; }
      #${SEC_ID} .st-ai-row--chips{ margin-bottom:8px; }
      #${SEC_ID} .st-ai-chip{ border:1px solid rgba(148,163,184,0.28); background:rgba(255,255,255,0.92) !important; color:#0f172a !important; border-radius:999px; padding:7px 12px; font-size:12px; font-weight:700; cursor:pointer; }
      #${SEC_ID} .st-ai-chip *{ color:inherit !important; }
      #${SEC_ID} .st-ai-chip.is-active{ background:#0f172a !important; color:#fff !important; border-color:#0f172a !important; }
      #${SEC_ID} .st-ai-chip.is-disabled{ opacity:.5; cursor:not-allowed; }
      #${SEC_ID} .st-ai-scope-grid{ display:grid; grid-template-columns:1fr; gap:6px; margin:0 0 8px; }
      #${SEC_ID} .st-ai-scope-option{ display:flex; align-items:center; gap:8px; min-height:34px; padding:7px 10px; border:1px solid rgba(148,163,184,0.28); border-radius:10px; background:rgba(255,255,255,0.92); color:#0f172a; font-size:12px; font-weight:700; cursor:pointer; user-select:none; }
      #${SEC_ID} .st-ai-scope-option input{ width:16px; height:16px; accent-color:#0f172a; flex:0 0 auto; }
      #${SEC_ID} .st-ai-scope-option:has(input:checked){ background:#e0f2fe; border-color:#0284c7; color:#0f172a; }
      #${SEC_ID} .st-ai-scope-help{ margin:-2px 0 8px; font-size:11px; line-height:1.35; color:rgba(15,23,42,.66); }
      #${SEC_ID} .st-ai-field{ display:block; margin-top:8px; }
      #${SEC_ID} .st-ai-field--fix{ margin-top:12px; }
      #${SEC_ID} .st-ai-field__label{ display:block; margin:0 0 6px; font-size:12px; font-weight:700; color:rgba(15,23,42,0.82); }
      #${SEC_ID} .st-ai-textarea,
      #${SEC_ID} .st-ai-input{ width:100%; border-radius:12px; border:1px solid rgba(148,163,184,0.42) !important; background:#ffffff !important; color:#0f172a !important; caret-color:#0f172a !important; -webkit-text-fill-color:#0f172a !important; color-scheme:light; padding:10px 12px; font:inherit; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02); }
      #${SEC_ID} .st-ai-textarea *,
      #${SEC_ID} .st-ai-input *{ color:#0f172a !important; }
      #${SEC_ID} .st-ai-textarea::placeholder,
      #${SEC_ID} .st-ai-input::placeholder{ color:#475569 !important; opacity:1 !important; -webkit-text-fill-color:#475569 !important; }
      #${SEC_ID} .st-ai-textarea{ min-height:108px; resize:vertical; }
      #${SEC_ID} .st-ai-actions{ display:flex; gap:8px; margin-top:12px; min-width:0; }
      #${SEC_ID} .st-ai-actions--main{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
      #${SEC_ID} .st-ai-actions--debug-row{ margin-top:8px; }
      #${SEC_ID} .st-ai-actions--select-warning{ margin-top:10px; }
      #${SEC_ID} .st-ai-btn.st-ai-btn--select-warning{ width:100%; background:#64748b !important; color:#e2e8f0 !important; border-color:#64748b !important; cursor:default; }
      #${SEC_ID} .st-ai-btn.st-ai-btn--select-warning.is-active{ background:#dc2626 !important; color:#fff !important; border-color:#dc2626 !important; opacity:1 !important; box-shadow:0 0 0 3px rgba(220,38,38,.18),0 0 18px rgba(220,38,38,.28) !important; }
      #${SEC_ID} .st-ai-actions--secondary{ margin-top:8px; }
      #${SEC_ID} .st-ai-actions--links-main{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
      #${SEC_ID} .st-ai-actions--journal{ display:block; }
      #${SEC_ID} .st-ai-btn{ min-width:0; width:100%; flex:1 1 auto; border-radius:10px; padding:9px 10px; font-size:11px; font-weight:800; cursor:pointer; border:1px solid rgba(148,163,184,0.28) !important; background:rgba(255,255,255,0.94) !important; color:#0f172a !important; transition:box-shadow .16s ease, transform .16s ease, filter .16s ease; }
      #${SEC_ID} .st-ai-btn *{ color:inherit !important; }
      #${SEC_ID} .st-ai-btn--primary{ background:#0f172a !important; color:#fff !important; border-color:#0f172a !important; }
      #${SEC_ID} .st-ai-btn--debug{ width:100%; background:#0f172a !important; color:#cbd5e1 !important; border-color:#0f172a !important; }
      #${SEC_ID} .st-ai-btn--debug.is-active{ background:#dc2626 !important; color:#fff !important; border-color:#dc2626 !important; }
      #${SEC_ID} .st-ai-btn[disabled]{ opacity:.5; cursor:not-allowed; }
      #${SEC_ID} .st-ai-btn:active,#${SEC_ID} .st-ai-btn.is-click-flash,#${SEC_ID} .st-ai-btn.is-busy{ transform:translateY(1px); box-shadow:0 0 0 3px rgba(59,130,246,.26),0 0 18px rgba(59,130,246,.42) !important; filter:brightness(1.08); }
      #${SEC_ID} .st-ai-link{ display:inline-flex; align-items:center; justify-content:center; width:100%; flex:1 1 auto; min-width:0; border-radius:10px; padding:9px 10px; font-size:11px; font-weight:800; text-decoration:none; border:1px solid rgba(148,163,184,0.28) !important; background:rgba(255,255,255,0.94) !important; color:#0f172a !important; white-space:nowrap; }
      #${SEC_ID} .st-ai-preview{ margin-top:12px; border:1px dashed rgba(148,163,184,0.32); border-radius:12px; padding:10px; background:rgba(255,255,255,0.45); min-height:64px; color:#0f172a !important; }
      #${SEC_ID} .st-ai-preview:empty{ display:none; }
      #${SEC_ID} .st-ai-preview *{ color:#0f172a !important; }
      #${SEC_ID} .st-ai-empty{ color:rgba(15,23,42,0.72) !important; font-size:12px; }
      #${SEC_ID} .st-ai-plan__title{ font-size:13px; font-weight:800; margin-bottom:6px; color:#0f172a !important; }
      #${SEC_ID} .st-ai-pills{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
      #${SEC_ID} .st-ai-pill{ display:inline-flex; gap:4px; align-items:center; border:1px solid rgba(148,163,184,0.26); background:rgba(255,255,255,0.92) !important; color:#0f172a !important; border-radius:999px; padding:4px 8px; font-size:11px; }
      #${SEC_ID} .st-ai-pill b,
      #${SEC_ID} .st-ai-plan__target b,
      #${SEC_ID} .st-ai-step__desc b{ color:#0f172a !important; font-weight:800; }
      #${SEC_ID} .st-ai-plan__target{ font-size:12px; margin-bottom:6px; color:rgba(15,23,42,0.86) !important; }
      #${SEC_ID} .st-ai-plan__summary{ font-size:12px; color:rgba(15,23,42,0.80) !important; margin-bottom:10px; }
      #${SEC_ID} .st-ai-plan__warn{ margin-bottom:10px; padding:8px 10px; border-radius:10px; background:rgba(245,158,11,0.10); color:#92400e !important; font-size:12px; font-weight:700; }
      #${SEC_ID} .st-ai-plan__note{ margin-top:10px; font-size:11px; color:rgba(15,23,42,0.75) !important; }
      #${SEC_ID} .st-ai-steps{ list-style:none; margin:0; padding:0; display:grid; gap:8px; }
      #${SEC_ID} .st-ai-steps li{ display:flex; gap:8px; align-items:flex-start; }
      #${SEC_ID} .st-ai-step__idx{ width:22px; height:22px; border-radius:999px; background:#0f172a !important; color:#fff !important; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex:0 0 22px; }
      #${SEC_ID} .st-ai-step__title{ font-size:12px; font-weight:800; color:#0f172a !important; }
      #${SEC_ID} .st-ai-step__desc{ font-size:12px; color:rgba(15,23,42,0.78) !important; }
      #${SEC_ID} .st-ai-clarify-actions{ display:grid; grid-template-columns:minmax(0,1fr); gap:8px; margin-top:10px; }
      #${SEC_ID} .st-ai-plan--clarify .st-ai-plan__warn b{ color:#92400e !important; }
      #${SEC_ID} .st-ai-status{ margin-top:10px; font-size:12px; color:rgba(15,23,42,0.74); }
      #${SEC_ID} .st-ai-status:empty{ display:none; }
    </style>
  `.trim();
  return sectionEl;
}

export function initAiTemplatesAccordionWidget(host, getSelection){
  if (!host) return;
  if (host.querySelector(`#${CSS.escape(SEC_ID)}`)) return;

  const sectionEl = buildSection();
  const animatorSec = host.querySelector('#st-animator-accordion');
  if (animatorSec && animatorSec.parentNode === host) animatorSec.insertAdjacentElement('afterend', sectionEl);
  else host.appendChild(sectionEl);

  const promptEl = sectionEl.querySelector('[data-st-ai-prompt]');
  const fixEl = sectionEl.querySelector('[data-st-ai-fix]');
  const previewEl = sectionEl.querySelector('[data-st-ai-preview]');
  const statusEl = sectionEl.querySelector('[data-st-ai-status]');
  const generateBtn = sectionEl.querySelector('[data-st-ai-generate]');
  const applyBtn = sectionEl.querySelector('[data-st-ai-apply]');
  const refineBtn = sectionEl.querySelector('[data-st-ai-refine]');
  const debugToggleBtn = sectionEl.querySelector('[data-st-ai-debug-toggle]');
  const selectWarningBtn = sectionEl.querySelector('[data-st-ai-select-warning]');
  let currentKind = 'button';
  let currentContext = 'selection';
  let currentAction = loadAction();
  let currentTargetScopeLevels = loadTargetScope();
  let currentRecipe = null;
  let currentRuntimeDraft = null;
  let currentSelectionDraft = null;
  let currentAssetDraft = null;
  let currentClarifyDraft = null;
  let currentUiTrace = [];
  let selectElementWarningActive = false;
  let selectElementWarningLabel = 'Виберіть елемент !!!';
  let selectElementWarningReason = null;

  if (promptEl) promptEl.value = loadPrompt();
  if (fixEl) fixEl.value = loadFix();

  function syncKindUi(){
    sectionEl.querySelectorAll('[data-st-ai-kind]').forEach((el) => {
      el.classList.toggle('is-active', String(el.getAttribute('data-st-ai-kind')) === currentKind);
    });
  }
  function syncContextUi(){
    sectionEl.querySelectorAll('[data-st-ai-context]').forEach((el) => {
      el.classList.toggle('is-active', String(el.getAttribute('data-st-ai-context')) === currentContext);
    });
  }
  function syncActionUi(){
    sectionEl.querySelectorAll('[data-st-ai-action]').forEach((el) => {
      el.classList.toggle('is-active', String(el.getAttribute('data-st-ai-action')) === currentAction);
    });
  }
  function syncTargetScopeUi(){
    const safe = normalizeTargetScopeLevels(currentTargetScopeLevels);
    sectionEl.querySelectorAll('[data-st-ai-scope-level]').forEach((el) => {
      const level = Number.parseInt(String(el.value || el.getAttribute('value') || '0'), 10);
      el.checked = safe.includes(level);
    });
  }
  function readTargetScopeFromUi(){
    const levels = [];
    sectionEl.querySelectorAll('[data-st-ai-scope-level]').forEach((el) => {
      if (!el.checked) return;
      const level = Number.parseInt(String(el.value || el.getAttribute('value') || '0'), 10);
      if (Number.isInteger(level)) levels.push(level);
    });
    return normalizeTargetScopeLevels(levels);
  }
  function currentTargetScope(){
    return buildTargetScope(currentTargetScopeLevels);
  }
  function setStatus(text){
    if (statusEl) statusEl.textContent = String(text || '');
  }
  function decorateRecipe(recipe){
    if (!recipe) return recipe;
    recipe.__meta = {
      ...(recipe.__meta || {}),
      kind: currentKind,
      context: currentContext,
      action: currentAction,
      targetSummary: describeSelection(getSelection),
      targetScopeLabel: targetScopeLabel(currentTargetScopeLevels),
      warning: currentAction === 'update' && currentContext !== 'selection'
        ? 'Оновлення працює тільки для вибраного сумісного блока у шапці.'
        : ''
    };
    return recipe;
  }
  function refreshDebugToggleUi(){
    if (!debugToggleBtn) return;
    const enabled = isAiRuntimeDebugEnabled();
    debugToggleBtn.classList.toggle('is-active', enabled);
    debugToggleBtn.textContent = enabled ? 'Відлагодження: ВКЛ' : 'Відлагодження: ВИКЛ';
  }

  function hasActiveAiSelection(){
    try {
      const snap = getSelectionSnapshot();
      if (snap && Number(snap.selectedCount || 0) > 0 && selectionSnapshotToAiTarget(snap)) return true;
    } catch(e) {}
    try {
      const templateSnap = buildSelectionSnapshot(getSelection);
      if (templateSnap && templateSnap.type) return true;
    } catch(e) {}
    return false;
  }

  function isSelectionWarningReason(reason){
    const r = String(reason || selectElementWarningReason || '');
    return !r || r === 'missing_selection' || r.includes('without_active_selection') || r.includes('no_selection');
  }

  function deactivateSelectElementWarning(reason = 'cleared'){
    if (!selectElementWarningActive && selectElementWarningLabel === 'Виберіть елемент !!!') return;
    selectElementWarningActive = false;
    selectElementWarningLabel = 'Виберіть елемент !!!';
    selectElementWarningReason = null;
    syncSelectElementWarningUi();
    pushAiUiTrace({ event: 'select_element_warning', phase: 'deactivated', ok: true, reason });
  }

  function syncSelectElementWarningUi(){
    if (!selectWarningBtn) return;
    if (selectElementWarningActive && hasActiveAiSelection() && isSelectionWarningReason()) {
      selectElementWarningActive = false;
      selectElementWarningLabel = 'Виберіть елемент !!!';
      selectElementWarningReason = null;
    }
    selectWarningBtn.textContent = selectElementWarningLabel || 'Виберіть елемент !!!';
    selectWarningBtn.classList.toggle('is-active', !!selectElementWarningActive);
    selectWarningBtn.setAttribute('aria-disabled', 'true');
    selectWarningBtn.disabled = true;
  }

  function activateSelectElementWarning(reason = 'missing_selection'){
    selectElementWarningActive = true;
    selectElementWarningLabel = 'Виберіть елемент !!!';
    selectElementWarningReason = reason;
    syncSelectElementWarningUi();
    pushAiUiTrace({ event: 'select_element_warning', phase: 'activated', ok: false, reason, label: selectElementWarningLabel });
  }

  function activateRuntimeLimitWarning(label, reason = 'dimension_limited'){
    selectElementWarningActive = true;
    selectElementWarningLabel = label || 'Обмежено розмірами';
    selectElementWarningReason = reason;
    syncSelectElementWarningUi();
    pushAiUiTrace({ event: 'dimension_limit_warning', phase: 'activated', ok: false, reason, label: selectElementWarningLabel });
  }

  function aiUiSnapshot(){
    return {
      status: statusEl ? statusEl.textContent || null : null,
      generateDisabled: !!(generateBtn && generateBtn.disabled),
      applyDisabled: !!(applyBtn && applyBtn.disabled),
      debugEnabled: isAiRuntimeDebugEnabled(),
      currentKind,
      currentContext,
      currentAction,
      currentTargetScopeLevels: normalizeTargetScopeLevels(currentTargetScopeLevels),
      hasRuntimeDraft: !!currentRuntimeDraft,
      hasAssetDraft: !!currentAssetDraft,
      hasClarifyDraft: !!currentClarifyDraft,
      hasRecipe: !!currentRecipe,
    };
  }

  function pushAiUiTrace(event){
    const item = {
      at: new Date().toISOString(),
      ...(event && typeof event === "object" ? event : { event: String(event || "unknown") }),
      ui: aiUiSnapshot(),
    };
    currentUiTrace.push(item);
    if (currentUiTrace.length > 80) currentUiTrace = currentUiTrace.slice(-80);
    return item;
  }

  function flashAiActionButton(button){
    if (!button) return;
    button.classList.add("is-click-flash");
    window.setTimeout(() => button.classList.remove("is-click-flash"), 420);
  }

  function collectDimensionLimitations(executionResult, mutationLog = []){
    const limits = [];
    const add = (constraint, source = 'unknown') => {
      if (!constraint || !constraint.code) return;
      limits.push({ ...constraint, source });
    };
    try {
      const results = Array.isArray(executionResult?.results) ? executionResult.results : [];
      for (const commandResult of results) {
        const ops = Array.isArray(commandResult?.execution?.operations) ? commandResult.execution.operations : [];
        for (const op of ops) add(op?.result?.payload?.dimensionIncrement?.constraint, 'execution_operation');
      }
    } catch(e) {}
    try {
      const log = Array.isArray(mutationLog) ? mutationLog : [];
      for (const item of log) add(item?.payload?.dimensionIncrement?.constraint, 'mutation_log');
    } catch(e) {}
    return limits;
  }

  function handleDimensionLimitWarnings(executionResult, mutationLog = []){
    const limits = collectDimensionLimitations(executionResult, mutationLog);
    if (!limits.length) {
      const hasDimensionMutation = Array.isArray(mutationLog) && mutationLog.some((item) => item && item.runtime === 'applyDimensionValue');
      if (hasDimensionMutation) deactivateSelectElementWarning('dimension_runtime_success_without_limits');
      return false;
    }
    const parentLimit = limits.find((item) => item.code === 'parent_block');
    const childLimit = limits.find((item) => item.code === 'child_block');
    if (parentLimit) { activateRuntimeLimitWarning('Обмежено батьківським блоком', 'dimension_limited_by_parent_block'); return true; }
    if (childLimit) { activateRuntimeLimitWarning('Обмежено дочірнім блоком', 'dimension_limited_by_child_block'); return true; }
    activateRuntimeLimitWarning('Обмежено розмірами блока', 'dimension_limited');
    return true;
  }

  function escapeAiHtml(value){
    return String(value ?? '').replace(/[<>&"']/g, (ch) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#039;'}[ch]));
  }

  function selectionPreviewHtml(draft){
    const parsed = draft && draft.parsedCommand ? draft.parsedCommand : null;
    const preview = draft && draft.preview ? draft.preview : null;
    if (!parsed || parsed.ok === false) {
      const message = parsed && parsed.message ? parsed.message : 'Команду виділення не розпізнано.';
      return `<div class="st-ai-empty">${escapeAiHtml(message)}</div>`;
    }
    const region = parsed.region && parsed.region.label ? parsed.region.label : parsed.effectiveRegionKey || 'поточний контекст';
    const selection = parsed.selection && parsed.selection.label ? parsed.selection.label : 'перший за замовчуванням';
    const parent = parsed.parentScope ? `<div class="st-ai-plan__target"><b>Всередині:</b> ${escapeAiHtml(`${parsed.parentScope.index}-й ${parsed.parentScope.label}`)}</div>` : '';
    const selectedIndexes = Array.isArray(preview?.selectedIndexes) && preview.selectedIndexes.length ? preview.selectedIndexes.join(', ') : '—';
    const previewStatus = preview
      ? `<div class="st-ai-plan__target"><b>Кандидатів:</b> ${escapeAiHtml(String(preview.candidatesCount || 0))}</div>
         <div class="st-ai-plan__target"><b>Буде вибрано №:</b> ${escapeAiHtml(selectedIndexes)}</div>`
      : '';
    const previewHint = preview && preview.ok === false
      ? `<div class="st-ai-empty">${escapeAiHtml(preview.message || 'Кандидатів не знайдено.')}</div>`
      : `<div class="st-ai-empty">Нічого ще не виділено. Натисни «Застосувати», щоб реально вибрати елемент.</div>`;
    return `
      <div class="st-ai-plan">
        <div class="st-ai-plan__title">Команда виділення готова</div>
        <div class="st-ai-plan__target"><b>Елемент:</b> ${escapeAiHtml(parsed.targetLabel || parsed.targetType || 'елемент')}</div>
        <div class="st-ai-plan__target"><b>Номер/режим:</b> ${escapeAiHtml(selection)}</div>
        <div class="st-ai-plan__target"><b>Область:</b> ${escapeAiHtml(region)} (${escapeAiHtml(parsed.effectiveRegionKey || 'auto')})</div>
        ${parent}
        ${previewStatus}
        ${previewHint}
      </div>
    `;
  }

  function renderRecipe(){
    if (currentRuntimeDraft && currentRuntimeDraft.result) attachRuntimeTargetScope(currentRuntimeDraft.result, currentTargetScope());
    if (previewEl) {
      if (currentClarifyDraft) previewEl.innerHTML = clarifyButtonColorHtml(currentClarifyDraft.prompt, currentClarifyDraft.selectionSnapshot);
      else if (currentSelectionDraft) previewEl.innerHTML = selectionPreviewHtml(currentSelectionDraft);
      else if (currentAssetDraft) previewEl.innerHTML = aiAssetDraftHtml_(currentAssetDraft);
      else if (currentRuntimeDraft && currentRuntimeDraft.result) previewEl.innerHTML = runtimePreviewHtml(currentRuntimeDraft.result, currentRuntimeDraft.selectionSnapshot);
      else previewEl.innerHTML = recipeToHtml(currentRecipe);
    }
    const canApply = !!(
      !currentClarifyDraft && (
        (currentSelectionDraft && currentSelectionDraft.parsedCommand && currentSelectionDraft.parsedCommand.ok !== false)
        || (currentAssetDraft && currentAssetDraft.item && aiAssetIsApplicableAsFill_(currentAssetDraft.item))
        || (currentRuntimeDraft && hasRuntimeContracts(currentRuntimeDraft.result))
        || (currentRecipe && currentRecipe.canApply)
      )
    );
    if (applyBtn) applyBtn.disabled = !canApply;
    if (refineBtn) refineBtn.disabled = !!currentClarifyDraft || !!currentSelectionDraft || !!currentAssetDraft || !!currentRuntimeDraft || !(currentRecipe && currentRecipe.canApply);
  }

  syncKindUi();
  syncContextUi();
  syncActionUi();
  syncTargetScopeUi();
  refreshDebugToggleUi();
  syncSelectElementWarningUi();
  renderRecipe();

  function handleAiSelectionChangedForWarning(){
    if (selectElementWarningActive && hasActiveAiSelection()) {
      deactivateSelectElementWarning('selection_changed');
      return;
    }
    syncSelectElementWarningUi();
  }

  const selectElementWarningTimer = window.setInterval(syncSelectElementWarningUi, 500);
  document.addEventListener('st:selection-changed', handleAiSelectionChangedForWarning);
  document.addEventListener('st:ai-runtime-inspector-sync', handleAiSelectionChangedForWarning);

  sectionEl.addEventListener('click', async (ev) => {
    const kindBtn = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-kind]') : null;
    if (kindBtn) {
      ev.preventDefault();
      currentKind = String(kindBtn.getAttribute('data-st-ai-kind') || 'button');
      saveKind(currentKind);
      currentClarifyDraft = null;
      syncKindUi();
      return;
    }
    const ctxBtn = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-context]') : null;
    if (ctxBtn) {
      ev.preventDefault();
      currentContext = String(ctxBtn.getAttribute('data-st-ai-context') || 'selection');
      saveContext(currentContext);
      currentClarifyDraft = null;
      syncContextUi();
      if (currentRecipe) {
        decorateRecipe(currentRecipe);
        renderRecipe();
      }
      return;
    }
    const actBtn = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-action]') : null;
    if (actBtn) {
      ev.preventDefault();
      currentAction = String(actBtn.getAttribute('data-st-ai-action') || 'create');
      saveAction(currentAction);
      currentClarifyDraft = null;
      syncActionUi();
      if (currentRecipe) {
        decorateRecipe(currentRecipe);
        renderRecipe();
      }
      return;
    }
    const scopeToggle = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-scope-level]') : null;
    if (scopeToggle) {
      currentTargetScopeLevels = readTargetScopeFromUi();
      saveTargetScope(currentTargetScopeLevels);
      syncTargetScopeUi();
      if (currentRuntimeDraft && currentRuntimeDraft.result) {
        attachRuntimeTargetScope(currentRuntimeDraft.result, currentTargetScope());
        renderRecipe();
        setStatus('Рівні застосування оновлено: ' + targetScopeLabel(currentTargetScopeLevels) + '.');
      }
      if (currentRecipe) {
        decorateRecipe(currentRecipe);
        renderRecipe();
      }
      return;
    }
    const clarifyBtn = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-clarify]') : null;
    if (clarifyBtn) {
      ev.preventDefault();
      const choice = String(clarifyBtn.getAttribute('data-st-ai-clarify') || '');
      pushAiUiTrace({ event: 'clarify_choice_click', choice });
      if (choice === 'add') {
        currentAction = 'create';
        saveAction(currentAction);
        syncActionUi();
        const prompt = promptEl ? String(promptEl.value || '') : '';
        const selectionSnapshot = buildSelectionSnapshot(getSelection);
        currentClarifyDraft = null;
        currentRuntimeDraft = null;
        currentRecipe = decorateRecipe(buildAiTemplateRecipe({ prompt, kind: currentKind, context: currentContext, action: currentAction, selectionSnapshot }));
        renderRecipe();
        setStatus('Обрано: додати нову кнопку в активний блок. Перевір план і натисни «Застосувати».');
        return;
      }
      currentAction = 'update';
      saveAction(currentAction);
      syncActionUi();
      currentClarifyDraft = null;
      currentRecipe = null;
      currentRuntimeDraft = null;
      renderRecipe();
      setStatus('Обрано: змінити кнопку. Вибери саму кнопку на полотні і натисни «Згенерувати» ще раз.');
      return;
    }

    const genBtn = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-generate]') : null;
    if (genBtn) {
      ev.preventDefault();
      currentUiTrace = [];
      pushAiUiTrace({ event: "generate_click", button: "Згенерувати", phase: "start", promptLength: (promptEl ? String(promptEl.value || "").length : 0) });
      flashAiActionButton(genBtn);
      genBtn.classList.add("is-busy");
      const prompt = promptEl ? String(promptEl.value || '') : '';
      savePrompt(prompt);
      try {
        window.dispatchEvent(new CustomEvent('st:gallery-ai-brief', {
          detail: {
            source: 'ai-chat-generate',
            prompt,
            autoBest: true
          }
        }));
      } catch (e) {}
      // HOTFIX 00042:
      // buildSelectionSnapshot() only understands .st-block children and returns null for rows/sections.
      // Runtime/debug selection uses window.ST_SELECTION and can see row/container/section/button_block.
      // Use runtime snapshot as fallback before any shadow guard, otherwise shadow prompts fall through to recipe/create.
      const templateSelectionSnapshot = buildSelectionSnapshot(getSelection);
      const runtimeSelectionSnapshot = getSelectionSnapshot();
      const selectionSnapshot = templateSelectionSnapshot || runtimeSelectionSnapshot;
      currentRuntimeDraft = null;
      currentSelectionDraft = null;
      currentAssetDraft = null;
      currentRecipe = null;
      currentClarifyDraft = null;

      // AI ASSET BRIDGE 00125:
      // Generate only selects the best project/system asset. Real background apply happens only after Apply.
      const assetBrief = aiAssetPromptBrief_(prompt);
      if (assetBrief) {
        try {
          const candidatesRaw = await galFindBestAiAssets(assetBrief.criteria, { cat: assetBrief.cat, limit: 12, systemOnly: true });
          const candidates = (candidatesRaw || []).filter(item => {
            const role = String(item?.assetRole || item?.type || item?.role || '').toLowerCase();
            return role === assetBrief.role || (assetBrief.role === 'background' && role === 'image');
          });
          const item = candidates[0] || null;
          currentAssetDraft = {
            prompt,
            brief: assetBrief,
            item,
            candidatesCount: candidates.length,
            generatedAt: new Date().toISOString(),
          };
          currentRuntimeDraft = null;
          currentSelectionDraft = null;
          currentRecipe = null;
          currentClarifyDraft = null;
          renderRecipe();
          pushAiUiTrace({
            event: 'generate_click',
            button: 'Згенерувати',
            phase: 'asset_auto_select_draft',
            ok: !!item,
            flow: 'asset',
            guard: 'gallery_ai_asset_bridge_00125_prepare_only',
            role: assetBrief.role,
            cat: assetBrief.cat,
            candidatesCount: candidates.length,
            selectedId: item?.id || null,
            selectedTitle: item?.title || item?.name || null,
            score: Number(item?._aiMatch?.score || 0),
            applyEnabled: !(applyBtn && applyBtn.disabled),
          });
          setStatus(item
            ? `AI підібрав ${assetBrief.role === 'background' ? 'фон' : 'asset'}: ${item.title || item.name || item.id}. Натисни «Застосувати», щоб поставити на активний елемент.`
            : 'AI не знайшов підходящий системний asset. Додай файли в manifest.json або зміни опис.');
        } catch (err) {
          console.warn('[ai-templates] asset auto select failed', err);
          currentAssetDraft = { prompt, brief: assetBrief, item: null, error: String(err?.message || err) };
          renderRecipe();
          setStatus('Не вдалося підібрати asset із системної бібліотеки. Перевір manifest.json або консоль.');
          pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'asset_auto_select_error', ok: false, error: String(err?.message || err) });
        }
        genBtn.classList.remove('is-busy');
        return;
      }

      // SELECTION COMMAND LAYER 00107:
      // Generate тільки готує план виділення. Реальна зміна selection виконується тільки після Apply.
      if (isSelectionCommandPrompt(prompt)) {
        const parsedCommand = parseSelectionCommand(prompt);
        const selectionPreview = parsedCommand && parsedCommand.ok !== false ? previewSelectionCommand(parsedCommand) : null;
        currentSelectionDraft = {
          prompt,
          parsedCommand,
          preview: selectionPreview,
          parseEvaluation: {
            pass: !!(parsedCommand && parsedCommand.ok !== false),
            issues: parsedCommand && parsedCommand.ok === false ? [parsedCommand.message || parsedCommand.reason || 'selection_parse_failed'] : [],
          },
          selectionSnapshot,
        };
        currentRuntimeDraft = null;
        currentRecipe = null;
        currentClarifyDraft = null;
        renderRecipe();
        pushAiUiTrace({
          event: 'generate_click',
          button: 'Згенерувати',
          phase: 'selection_command_draft',
          ok: !!(parsedCommand && parsedCommand.ok !== false),
          flow: 'selection',
          guard: 'selection_command_layer_00110_prepare_only',
          targetType: parsedCommand?.targetType || null,
          region: parsedCommand?.region?.key || null,
          effectiveRegion: parsedCommand?.effectiveRegionKey || null,
          candidatesCount: Number(selectionPreview?.candidatesCount || 0),
          selectedIndexes: Array.isArray(selectionPreview?.selectedIndexes) ? selectionPreview.selectedIndexes : [],
          applyEnabled: !(applyBtn && applyBtn.disabled),
        });
        if (parsedCommand && parsedCommand.ok === false) {
          setStatus((parsedCommand.message || 'Команду виділення не розпізнано.') + ' Виправ текст і натисни «Згенерувати» ще раз.');
        } else {
          const label = parsedCommand?.targetLabel || 'елемент';
          const region = parsedCommand?.region?.label || parsedCommand?.effectiveRegionKey || 'поточний контекст';
          setStatus(`Команду виділення підготовлено: ${label} · область: ${region}. Натисни «Застосувати», щоб реально виділити.`);
        }
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00080:
      // Complex multi-property commands must run as several runtime operations.
      // Example: "зроби кнопку синьою а текст жовтим" = button background blue + text yellow.
      // If the command targets a button but the active element is not a button, create the button in the active block.
      if (ai80ButtonStyleNeedsSelection(prompt, selectionSnapshot)) {
        activateSelectElementWarning('button_style_prompt_without_active_selection');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'button_style_no_selection', ok: false, guard: 'composite_guard_00080_button_style_fallback', reason: 'button style prompt needs an active button or an active block/container for creation' });
        renderRecipe();
        setStatus('Вибери кнопку, щоб змінити її, або активний блок/контейнер, щоб створити в ньому нову кнопку.');
        genBtn.classList.remove('is-busy');
        return;
      }
      if (ai80IsButtonStyleButNoActiveButtonCreate(prompt, selectionSnapshot)) {
        currentKind = 'button';
        saveKind(currentKind);
        syncKindUi();
        currentAction = 'create';
        saveAction(currentAction);
        syncActionUi();
        currentRuntimeDraft = null;
        currentClarifyDraft = null;
        currentRecipe = decorateRecipe(buildAiTemplateRecipe({ prompt, kind: 'button', context: currentContext, action: 'create', selectionSnapshot }));
        renderRecipe();
        setStatus('Активна не кнопка, тому буде створено нову кнопку в активному блоці/контейнері. Перевір план і натисни «Застосувати».');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'recipe', guard: 'composite_guard_00080_create_button_when_no_active_button', recipeKind: 'button', applyEnabled: !(applyBtn && applyBtn.disabled) });
        genBtn.classList.remove('is-busy');
        return;
      }
      if (isExplicitButtonCreatePrompt(prompt)) {
        currentKind = 'button';
        saveKind(currentKind);
        syncKindUi();
        currentAction = 'create';
        saveAction(currentAction);
        syncActionUi();
        currentRuntimeDraft = null;
        currentClarifyDraft = null;
        currentRecipe = decorateRecipe(buildAiTemplateRecipe({ prompt, kind: 'button', context: currentContext, action: 'create', selectionSnapshot }));
        renderRecipe();
        setStatus('Команда розпізнана як створення нової кнопки. Перевір план і натисни «Застосувати».');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'recipe', guard: 'explicit_button_create_guard_00085_before_composite_runtime', recipeKind: 'button', applyEnabled: !(applyBtn && applyBtn.disabled) });
        genBtn.classList.remove('is-busy');
        return;
      }
      if (ai80ShouldUseCompositeRuntime(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
        if (forcedTarget) {
          const runtimeResult = buildForcedCompositeRuntimeResult(prompt, { commands: [] }, forcedTarget);
          if (runtimeResult && Array.isArray(runtimeResult.commands) && runtimeResult.commands.length) {
            currentRuntimeDraft = {
              prompt,
              result: runtimeResult,
              parseEvaluation: parseEvaluationForRuntime(runtimeResult),
              selectionSnapshot,
            };
            renderRecipe();
            setStatus('Складна команда розділена на кілька runtime-дій. Новий блок не створюється — натисни «Застосувати».');
            pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'runtime', guard: 'composite_guard_00080_multi_property_force', forcedTarget, commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0, applyEnabled: !(applyBtn && applyBtn.disabled) });
            genBtn.classList.remove('is-busy');
            return;
          }
        }
        activateSelectElementWarning('composite_prompt_without_active_selection');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'composite_guard_no_selection', ok: false, guard: 'composite_guard_00080_multi_property_force', reason: 'composite style prompt needs active selected element; recipe creation is blocked unless it is a button-create fallback' });
        renderRecipe();
        setStatus('Складна команда потребує активного елемента. Вибери блок/кнопку/ряд і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00048:
      // Border/frame commands must be handled before shadow commands and before recipe/create.
      // This prevents "додай червону рамку" from being treated as a shadow/template command
      // and keeps repeated border-width commands as runtime width deltas.
      if (hasBorderPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {}) || (hasButtonMention(prompt) ? 'button_block' : '');
        if (forcedTarget) {
          const runtimeResult = buildForcedBorderRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з рамкою/бордером примусово розпізнана як runtime-зміна вибраного елемента. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({
            event: 'generate_click',
            button: 'Згенерувати',
            phase: 'end',
            ok: true,
            flow: 'runtime',
            guard: 'border_guard_00048_priority_before_shadow',
            forcedTarget,
            commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0,
            applyEnabled: !(applyBtn && applyBtn.disabled),
          });
          genBtn.classList.remove('is-busy');
          return;
        }
        pushAiUiTrace({
          event: 'generate_click',
          button: 'Згенерувати',
          phase: 'border_guard_no_selection',
          ok: false,
          guard: 'border_guard_00048_priority_before_shadow',
          reason: 'border/frame prompt needs active selected element; recipe creation is blocked for border prompts',
        });
        activateSelectElementWarning('border_prompt_without_active_selection');
        renderRecipe();
        setStatus('Команда з рамкою/бордером не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00049:
      // Radius commands are edit commands for the active selected element.
      // If the user writes only "збільш радіус" / "зменш радіус", use current_selection.
      // Never fall through to recipe/create for radius prompts.
      if (hasRadiusPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
        if (forcedTarget) {
          const runtimeResult = buildForcedRadiusRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з радіусом примусово розпізнана як runtime-зміна активного вибраного елемента. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({
            event: 'generate_click',
            button: 'Згенерувати',
            phase: 'end',
            ok: true,
            flow: 'runtime',
            guard: 'radius_guard_00049_pre_recipe_force',
            forcedTarget,
            commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0,
            applyEnabled: !(applyBtn && applyBtn.disabled),
          });
          genBtn.classList.remove('is-busy');
          return;
        }
        activateSelectElementWarning('radius_prompt_without_active_selection');
        pushAiUiTrace({
          event: 'generate_click',
          button: 'Згенерувати',
          phase: 'radius_guard_no_selection',
          ok: false,
          guard: 'radius_guard_00049_pre_recipe_force',
          reason: 'radius prompt needs active selected element; recipe creation is blocked for radius prompts',
        });
        renderRecipe();
        setStatus('Команда з радіусом не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00064:
      // Opacity/transparency commands are edit commands for the active selected element.
      // Explicit property words after “збільш/зменш” must win over the generic size guard.
      if (hasOpacityPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
        if (forcedTarget) {
          const runtimeResult = buildForcedOpacityRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з прозорістю розпізнана як runtime-зміна активного вибраного елемента. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'runtime', guard: 'opacity_guard_00064_pre_recipe_force', forcedTarget, property: isBorderOpacityPrompt(prompt) ? 'border_opacity' : 'opacity', commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0, applyEnabled: !(applyBtn && applyBtn.disabled) });
          genBtn.classList.remove('is-busy');
          return;
        }
        activateSelectElementWarning('opacity_prompt_without_active_selection');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'opacity_guard_no_selection', ok: false, guard: 'opacity_guard_00064_pre_recipe_force', reason: 'opacity prompt needs active selected element; recipe creation is blocked for opacity prompts' });
        renderRecipe();
        setStatus('Команда з прозорістю не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00067:
      // Text color commands are edit commands for the selected element and all text descendants.
      // Example: "Зроби текст червоним" on a button changes the button label;
      // on a section/container it changes descendant buttons/text blocks, not recipe/create.
      if (hasTextColorPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
        if (forcedTarget) {
          const runtimeResult = buildForcedTextColorRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з кольором тексту розпізнана як runtime-зміна вибраного елемента і його текстових дочірніх елементів. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'runtime', guard: 'text_color_guard_00067_pre_recipe_force', forcedTarget, property: 'text_color', commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0, applyEnabled: !(applyBtn && applyBtn.disabled) });
          genBtn.classList.remove('is-busy');
          return;
        }
        activateSelectElementWarning('text_color_prompt_without_active_selection');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'text_color_guard_no_selection', ok: false, guard: 'text_color_guard_00067_pre_recipe_force', reason: 'text color prompt needs active selected element; recipe creation is blocked for text color prompts' });
        renderRecipe();
        setStatus('Команда з кольором тексту не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00076:
      // Bare color commands are background/fill edit commands for the selected element.
      // Example: "зроби зеленим" must paint the current button/block and must not create a new button.
      if (hasBackgroundColorPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
        if (forcedTarget) {
          const runtimeResult = buildForcedBackgroundColorRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з кольором фону розпізнана як runtime-зміна вибраного елемента. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'runtime', guard: 'background_color_guard_00076_pre_recipe_force', forcedTarget, property: 'background_color', commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0, applyEnabled: !(applyBtn && applyBtn.disabled) });
          genBtn.classList.remove('is-busy');
          return;
        }
        activateSelectElementWarning('background_color_prompt_without_active_selection');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'background_color_guard_no_selection', ok: false, guard: 'background_color_guard_00076_pre_recipe_force', reason: 'background color prompt needs active selected element; recipe creation is blocked for bare color prompts' });
        renderRecipe();
        setStatus('Команда з кольором не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00078:
      // Spacing commands are edit commands for the active selected element/tree scope.
      // Examples: "зроби більші відступи між кнопками", "збільш відступ на 15px", "зменш gap на 10%".
      // Never fall through to recipe/create for spacing prompts.
      if (hasSpacingPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
        if (forcedTarget) {
          const runtimeResult = buildForcedSpacingRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з відступами розпізнана як runtime-зміна вибраного елемента / рівнів дерева. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'runtime', guard: 'spacing_guard_00078_pre_recipe_force', forcedTarget, property: getForcedSpacingProperty(prompt), commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0, applyEnabled: !(applyBtn && applyBtn.disabled) });
          genBtn.classList.remove('is-busy');
          return;
        }
        activateSelectElementWarning('spacing_prompt_without_active_selection');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'spacing_guard_no_selection', ok: false, guard: 'spacing_guard_00078_pre_recipe_force', reason: 'spacing prompt needs active selected element; recipe creation is blocked for spacing prompts' });
        renderRecipe();
        setStatus('Команда з відступами не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00051:
      // Size/width/height commands are edit commands for the active selected element.
      // Examples: "зроби кнопку більшою", "трохи збільш", "зроби ширшою на 15%", "зменш по висоті на 10 пікселів".
      // Never fall through to recipe/create for size prompts.
      if (hasSizePrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {});
        if (forcedTarget) {
          const runtimeResult = buildForcedSizeRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з розміром примусово розпізнана як runtime-зміна активного вибраного елемента. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'end', ok: true, flow: 'runtime', guard: 'size_guard_00051_pre_recipe_force', forcedTarget, axes: getForcedSizeAxes(prompt), commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0, applyEnabled: !(applyBtn && applyBtn.disabled) });
          genBtn.classList.remove('is-busy');
          return;
        }
        activateSelectElementWarning('size_prompt_without_active_selection');
        pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'size_guard_no_selection', ok: false, guard: 'size_guard_00051_pre_recipe_force', reason: 'size prompt needs active selected element; recipe creation is blocked for size prompts' });
        renderRecipe();
        setStatus('Команда з розміром не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      // HOTFIX 00041/00042:
      // Shadow commands are edit commands, not template recipes.
      // Do this BEFORE parseAiCommand/buildAiTemplateRecipe, because parser failures or empty results
      // previously fell through to recipe/create and produced a new colored button.
      if (hasShadowPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {}) || (hasButtonMention(prompt) ? 'button_block' : '');
        if (forcedTarget) {
          const runtimeResult = buildForcedButtonShadowRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з тінню примусово розпізнана як runtime-зміна вибраного елемента. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({
            event: 'generate_click',
            button: 'Згенерувати',
            phase: 'end',
            ok: true,
            flow: 'runtime',
            guard: 'shadow_guard_00042_selection_fallback',
            forcedTarget,
            commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0,
            applyEnabled: !(applyBtn && applyBtn.disabled),
          });
          genBtn.classList.remove('is-busy');
          return;
        }
        pushAiUiTrace({
          event: 'generate_click',
          button: 'Згенерувати',
          phase: 'shadow_guard_no_selection',
          ok: false,
          guard: 'shadow_guard_00042_selection_fallback',
          reason: 'shadow prompt needs active selected element; recipe creation is blocked for shadow prompts',
        });
        activateSelectElementWarning('shadow_prompt_without_active_selection');
        renderRecipe();
        setStatus('Команда з тінню не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      if (hasBorderPrompt(prompt)) {
        const forcedTarget = selectionSnapshotToAiTarget(selectionSnapshot || {}) || (hasButtonMention(prompt) ? 'button_block' : '');
        if (forcedTarget) {
          const runtimeResult = buildForcedBorderRuntimeResult(prompt, { commands: [] }, forcedTarget);
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда з бордером примусово розпізнана як runtime-зміна вибраного елемента. Новий блок не створюється — натисни «Застосувати».');
          pushAiUiTrace({
            event: 'generate_click',
            button: 'Згенерувати',
            phase: 'end',
            ok: true,
            flow: 'runtime',
            guard: 'border_guard_00046_pre_recipe_force',
            forcedTarget,
            commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0,
            applyEnabled: !(applyBtn && applyBtn.disabled),
          });
          genBtn.classList.remove('is-busy');
          return;
        }
        pushAiUiTrace({
          event: 'generate_click',
          button: 'Згенерувати',
          phase: 'border_guard_no_selection',
          ok: false,
          guard: 'border_guard_00046_pre_recipe_force',
          reason: 'border prompt needs active selected element; recipe creation is blocked for border prompts',
        });
        renderRecipe();
        setStatus('Команда з бордером не буде створювати новий блок. Вибери елемент на полотні і натисни «Згенерувати» ще раз.');
        genBtn.classList.remove('is-busy');
        return;
      }

      try {
        let runtimeResult = await parseAiCommand(prompt);
        runtimeResult = forceOpacityRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot);
        runtimeResult = forceTextColorRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot);
        runtimeResult = forceBackgroundColorRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot);
        runtimeResult = forceSpacingRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot);
        runtimeResult = forceButtonShadowRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot);
        runtimeResult = forceBorderRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot);
        runtimeResult = forceRadiusRuntimeIfNeeded(prompt, runtimeResult, selectionSnapshot);
        if (shouldClarifyButtonColorPrompt(prompt, runtimeResult, selectionSnapshot, currentAction)) {
          currentClarifyDraft = { prompt, runtimeResult, selectionSnapshot };
          renderRecipe();
          setStatus('Потрібне уточнення: змінити поточну кнопку чи додати нову кнопку?');
          pushAiUiTrace({ event: 'generate_click', button: 'Згенерувати', phase: 'clarify', ok: false, reason: 'button_color_prompt_without_button_selection', selectedType: selectionSnapshot && selectionSnapshot.type ? selectionSnapshot.type : null });
          genBtn.classList.remove('is-busy');
          return;
        }
        if (shouldUseRuntimeFlow(prompt, runtimeResult, selectionSnapshot, currentAction)) {
          currentRuntimeDraft = {
            prompt,
            result: runtimeResult,
            parseEvaluation: parseEvaluationForRuntime(runtimeResult),
            selectionSnapshot,
          };
          renderRecipe();
          setStatus('Команда розпізнана як runtime-зміна вибраного елемента. Тут не буде створюватися новий блок — натисни «Застосувати».');
          pushAiUiTrace({ event: "generate_click", button: "Згенерувати", phase: "end", ok: true, flow: "runtime", commandCount: Array.isArray(runtimeResult?.commands) ? runtimeResult.commands.length : 0, applyEnabled: !(applyBtn && applyBtn.disabled) });
          genBtn.classList.remove("is-busy");
          return;
        }
      } catch (err) {
        console.warn('[ai-templates] runtime parse probe failed', err);
        pushAiUiTrace({ event: "generate_click", button: "Згенерувати", phase: "runtime_probe_error", ok: false, error: String(err?.message || err) });
      }
      currentRecipe = decorateRecipe(buildAiTemplateRecipe({ prompt, kind: currentKind, context: currentContext, action: currentAction, selectionSnapshot }));
      renderRecipe();
      setStatus(`Сформовано demo recipe: ${kindLabel(currentKind)} · ${actionLabel(currentAction).toLowerCase()}. Перевір план і натисни «Застосувати».`);
      pushAiUiTrace({ event: "generate_click", button: "Згенерувати", phase: "end", ok: true, flow: "recipe", recipeKind: currentRecipe?.kind || currentKind, applyEnabled: !(applyBtn && applyBtn.disabled) });
      genBtn.classList.remove("is-busy");
      return;
    }
    const debugToggle = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-debug-toggle]') : null;
    if (debugToggle) {
      ev.preventDefault();
      const next = !isAiRuntimeDebugEnabled();
      setAiRuntimeDebugEnabled(next);
      refreshDebugToggleUi();
      setStatus(next
        ? 'Режим відлагодження увімкнено. Після runtime-застосування звіт збережеться у журналі.'
        : 'Режим відлагодження вимкнено.');
      return;
    }
    const refine = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-refine]') : null;
    if (refine) {
      ev.preventDefault();
      if (!currentRecipe) {
        pushAiUiTrace({ event: "apply_click", button: "Застосувати", phase: "no_recipe", ok: false, reason: "missing_recipe" });
        setStatus('Спочатку згенеруй recipe.');
        apply.classList.remove("is-busy");
        return;
      }
      const basePrompt = promptEl ? String(promptEl.value || '') : '';
      const fix = fixEl ? String(fixEl.value || '').trim() : '';
      if (!fix) {
        setStatus('Напиши коротке уточнення, що саме виправити.');
        return;
      }
      saveFix(fix);
      const mergedPrompt = `${basePrompt}\nУточнення: ${fix}`;
      currentRecipe = decorateRecipe(buildAiTemplateRecipe({ prompt: mergedPrompt, kind: currentKind, context: currentContext, action: currentAction, previousRecipe: currentRecipe, selectionSnapshot: buildSelectionSnapshot(getSelection) }));
      renderRecipe();
      setStatus('Recipe оновлено з урахуванням уточнення. Перевір план і застосуй.');
      return;
    }
    const apply = ev.target && ev.target.closest ? ev.target.closest('[data-st-ai-apply]') : null;
    if (apply) {
      ev.preventDefault();
      pushAiUiTrace({ event: "apply_click", button: "Застосувати", phase: "start", enabled: !apply.disabled });
      flashAiActionButton(apply);
      apply.classList.add("is-busy");
      if (currentAssetDraft && currentAssetDraft.item) {
        const item = currentAssetDraft.item;
        if (!aiAssetIsApplicableAsFill_(item)) {
          setStatus('Цей тип asset поки не застосовується як фон. Лого та іконки підключимо окремо.');
          apply.classList.remove('is-busy');
          return;
        }
        const detail = aiAssetFillDetail_(item, currentAssetDraft);
        pushAiUiTrace({
          event: 'apply_click',
          button: 'Застосувати',
          phase: 'asset_auto_apply_start',
          ok: true,
          itemId: item.id || null,
          title: item.title || item.name || null,
          score: Number(item?._aiMatch?.score || 0),
          url: detail.url || null,
        });
        try {
          let result = null;
          if (window.ST_FILL_WIDGET && typeof window.ST_FILL_WIDGET.applyGalleryAssetToActive === 'function') {
            result = window.ST_FILL_WIDGET.applyGalleryAssetToActive(detail);
          } else {
            window.dispatchEvent(new CustomEvent('st:gallery-asset:apply-active-fill', { detail }));
            result = { ok: true, viaEvent: true, message: 'Передано у віджет Заливка через подію.' };
          }
          pushAiUiTrace({ event: 'apply_click', button: 'Застосувати', phase: 'asset_auto_apply_result', ok: !!(result && result.ok), result });
          if (result && result.ok) {
            setStatus(`AI-фон застосовано: ${item.title || item.name || item.id}.`);
            currentAssetDraft = null;
            renderRecipe();
          } else {
            setStatus(result?.message || 'Фон не застосувався. Перевір активний елемент або журнал.');
          }
        } catch (err) {
          console.warn('[ai-templates] asset auto apply failed', err);
          pushAiUiTrace({ event: 'apply_click', button: 'Застосувати', phase: 'asset_auto_apply_error', ok: false, error: String(err?.message || err) });
          setStatus('Не вдалося автоматично застосувати фон. Перевір активний елемент і консоль.');
        }
        apply.classList.remove('is-busy');
        return;
      }

      if (currentSelectionDraft && currentSelectionDraft.parsedCommand) {
        setStatus('Виконую команду виділення…');
        const selectionBefore = getSelectionSnapshot();
        const parsedCommand = currentSelectionDraft.parsedCommand;
        let selectionResult = null;
        try {
          selectionResult = executeSelectionCommand(parsedCommand);
          const selectionAfter = getSelectionSnapshot();
          pushAiUiTrace({
            event: 'apply_click',
            button: 'Застосувати',
            phase: 'selection_command_result',
            ok: selectionResult && selectionResult.ok !== false,
            flow: 'selection',
            guard: 'selection_command_layer_00110_apply_only',
            selectedCount: Number(selectionResult?.selectedCount || 0),
            targetType: parsedCommand?.targetType || null,
            region: parsedCommand?.region?.key || null,
          });

          if (isAiRuntimeDebugEnabled()) {
            try {
              const pendingVoiceDetails = takePendingVoiceDetailsForPrompt(currentSelectionDraft.prompt);
              appendAiRuntimeDebugReport({
                source: pendingVoiceDetails ? 'ai_templates_widget+selection_command_layer+voice_command_widget' : 'ai_templates_widget+selection_command_layer',
                inputText: currentSelectionDraft.prompt,
                debugMode: true,
                dryRun: false,
                parsedResult: {
                  ok: parsedCommand && parsedCommand.ok !== false,
                  sourceText: currentSelectionDraft.prompt,
                  normalizedText: parsedCommand?.normalizedText || String(currentSelectionDraft.prompt || '').toLowerCase().replace(/\s+/g, ' ').trim(),
                  commands: [{
                    action: 'select_elements',
                    target: parsedCommand?.targetType || null,
                    property: 'selection',
                    value: {
                      region: parsedCommand?.region || null,
                      targetType: parsedCommand?.targetType || null,
                      targetLabel: parsedCommand?.targetLabel || null,
                      selection: parsedCommand?.selection || null,
                      parentScope: parsedCommand?.parentScope || null,
                    },
                    scope: parsedCommand?.effectiveRegionKey || null,
                    state: 'selection_only',
                    responsive: 'all',
                    confidence: parsedCommand?.ok ? 0.98 : 0,
                    needsClarify: false,
                  }],
                  warnings: [],
                  errors: selectionResult && selectionResult.ok === false ? [selectionResult.message || 'selection_command_failed'] : [],
                  assistantMessage: selectionResult?.message || null,
                  diagnostics: [{
                    forced: true,
                    ruleId: 'selection_command_layer_00110',
                    reason: 'selection command is prepared on Generate and executed only after Apply; it must not run style runtime or recipe creation',
                    parsedCommand,
                    preview: currentSelectionDraft.preview || null,
                    execution: selectionResult,
                  }],
                },
                parseEvaluation: currentSelectionDraft.parseEvaluation || { pass: selectionResult && selectionResult.ok !== false, issues: selectionResult && selectionResult.ok === false ? [selectionResult.message || 'selection_failed'] : [] },
                executionResult: {
                  ok: selectionResult && selectionResult.ok !== false,
                  kind: 'selection_command_execution_result',
                  totalCommands: 1,
                  executedCommands: selectionResult && selectionResult.ok !== false ? 1 : 0,
                  skippedCommands: selectionResult && selectionResult.ok !== false ? 0 : 1,
                  results: [{
                    commandIndex: 0,
                    action: 'select_elements',
                    execution: {
                      ok: selectionResult && selectionResult.ok !== false,
                      kind: 'selection_command_result',
                      summary: {
                        total: 1,
                        ok: selectionResult && selectionResult.ok !== false ? 1 : 0,
                        failed: selectionResult && selectionResult.ok === false ? 1 : 0,
                        applied: Number(selectionResult?.selectedCount || 0),
                        skipped: selectionResult && selectionResult.ok === false ? 1 : 0,
                        selectedCount: Number(selectionResult?.selectedCount || 0),
                        candidatesCount: Number(selectionResult?.candidatesCount || 0),
                        dryRun: false,
                      },
                      operations: [],
                      result: selectionResult,
                    },
                  }],
                },
                selectionBefore,
                selectionAfter,
                mutationLog: [],
                uiTrace: currentUiTrace.slice(),
                voiceDetails: pendingVoiceDetails,
                reportKind: pendingVoiceDetails ? 'selection_command_with_voice' : 'selection_command',
                notes: buildDebugReportNotes({
                  widget: 'ai_templates_accordion',
                  mode: 'selection_command_layer_apply',
                }, pendingVoiceDetails),
              });
            } catch (err) {
              console.warn('[ai-templates] selection debug report append failed', err);
            }
          }

          setStatus((selectionResult?.message || 'Команду виділення виконано.') + (isAiRuntimeDebugEnabled() ? ' Звіт додано у журнал відлагодження.' : ''));
          currentSelectionDraft = null;
          renderRecipe();
          apply.classList.remove('is-busy');
        } catch (err) {
          console.warn('[ai-templates] selection apply failed', err);
          pushAiUiTrace({ event: 'apply_click', button: 'Застосувати', phase: 'selection_command_error', ok: false, error: String(err?.message || err) });
          setStatus('Не вдалося виконати команду виділення. Перевір журнал або текст команди.');
          apply.classList.remove('is-busy');
        }
        return;
      }
      if (currentRuntimeDraft && currentRuntimeDraft.result) {
        setStatus('Виконую runtime-команду для вибраного елемента…');
        const selectionBefore = getSelectionSnapshot();
        const mutationLog = [];
        const runtimeToExecute = attachRuntimeTargetScope(currentRuntimeDraft.result, currentTargetScope());
        Promise.resolve(executeParsedAiCommand(runtimeToExecute, {
          context: createBuilderRuntimeContext({ selectionSnapshot: selectionBefore, mutationLog }),
          dryRun: false,
        }))
          .then((executionResult) => {
            const selectionAfter = getSelectionSnapshot();
            pushAiUiTrace({ event: "apply_click", button: "Застосувати", phase: "runtime_result", ok: !!(executionResult && executionResult.ok), executedCommands: Number(executionResult?.executedCommands || 0), totalCommands: Number(executionResult?.totalCommands || 0), mutationCount: mutationLog.length });
            const hadDimensionLimit = handleDimensionLimitWarnings(executionResult, mutationLog);
            if (isAiRuntimeDebugEnabled()) {
              try {
                const pendingVoiceDetails = takePendingVoiceDetailsForPrompt(currentRuntimeDraft.prompt);
                appendAiRuntimeDebugReport({
                  source: pendingVoiceDetails ? 'ai_templates_widget+voice_command_widget' : 'ai_templates_widget',
                  inputText: currentRuntimeDraft.prompt,
                  debugMode: true,
                  dryRun: false,
                  parsedResult: runtimeToExecute,
                  parseEvaluation: currentRuntimeDraft.parseEvaluation,
                  executionResult,
                  selectionBefore,
                  selectionAfter,
                  mutationLog,
                  uiTrace: currentUiTrace.slice(),
                  voiceDetails: pendingVoiceDetails,
                  reportKind: pendingVoiceDetails ? 'ai_runtime_with_voice' : 'ai_runtime',
                  notes: buildDebugReportNotes({
                    widget: 'ai_templates_accordion',
                    mode: 'runtime_proxy',
                  }, pendingVoiceDetails),
                });
              } catch (err) {
                console.warn('[ai-templates] debug report append failed', err);
              }
            }
            if (executionResult && executionResult.ok) {
              const executed = Number(executionResult.executedCommands || 0);
              if (hadDimensionLimit) {
                const extraReportText = isAiRuntimeDebugEnabled() ? ' Звіт додано у журнал відлагодження.' : '';
                setStatus((selectElementWarningLabel || 'Обмежено розмірами блока') + '. Частину зміни застосовано до допустимої межі.' + extraReportText);
              } else {
                setStatus('Runtime-команду виконано. Змінено команд: ' + executed + '. ' + (isAiRuntimeDebugEnabled() ? 'Звіт додано у журнал відлагодження.' : ''));
              }
            } else {
              setStatus('Runtime-команда відпрацювала з помилкою. Перевір журнал відлагодження або runtime result.');
            }
            apply.classList.remove("is-busy");
          })
          .catch((err) => {
            console.warn('[ai-templates] runtime apply failed', err);
            pushAiUiTrace({ event: "apply_click", button: "Застосувати", phase: "runtime_error", ok: false, error: String(err?.message || err), mutationCount: mutationLog.length });
            setStatus('Не вдалося виконати runtime-команду. Перевір вибраний елемент і спробуй ще раз.');
            apply.classList.remove("is-busy");
          });
        return;
      }
      if (!currentRecipe) {
        pushAiUiTrace({ event: "apply_click", button: "Застосувати", phase: "no_recipe", ok: false, reason: "missing_recipe" });
        setStatus('Спочатку згенеруй recipe.');
        apply.classList.remove("is-busy");
        return;
      }
      const recipeSelectionBefore = getSelectionSnapshot();
      setStatus('Застосовую recipe…');
      Promise.resolve(applyAiTemplateRecipe(currentRecipe, {
        context: currentContext,
        action: currentAction,
        getSelection,
      }))
        .then((result) => {
          const recipeSelectionAfter = getSelectionSnapshot();
          pushAiUiTrace({ event: "apply_click", button: "Застосувати", phase: "recipe_result", ok: true, message: result && result.message ? result.message : "Готово." });
          if (isAiRuntimeDebugEnabled()) {
            try {
              const recipePromptText = promptEl ? String(promptEl.value || "") : "";
              const pendingVoiceDetails = takePendingVoiceDetailsForPrompt(recipePromptText);
              appendAiRuntimeDebugReport({
                source: pendingVoiceDetails ? "ai_templates_widget+voice_command_widget" : "ai_templates_widget",
                inputText: recipePromptText,
                debugMode: true,
                dryRun: false,
                parsedResult: null,
                parseEvaluation: { pass: true, issues: [] },
                executionResult: { ok: true, kind: "ai_template_recipe_apply_result", result },
                selectionBefore: recipeSelectionBefore,
                selectionAfter: recipeSelectionAfter,
                mutationLog: [],
                uiTrace: currentUiTrace.slice(),
                voiceDetails: pendingVoiceDetails,
                reportKind: pendingVoiceDetails ? "ai_runtime_with_voice" : "ai_runtime",
                notes: buildDebugReportNotes({ widget: "ai_templates_accordion", mode: "recipe_apply" }, pendingVoiceDetails),
              });
            } catch (err) {
              console.warn("[ai-templates] recipe debug report append failed", err);
            }
          }
          setStatus(result && result.message ? result.message : "Готово.");
          apply.classList.remove("is-busy");
        })
        .catch((err) => {
          console.warn('[ai-templates] apply failed', err);
          pushAiUiTrace({ event: "apply_click", button: "Застосувати", phase: "recipe_error", ok: false, error: String(err?.message || err) });
          if (isAiRuntimeDebugEnabled()) {
            try {
              const recipePromptText = promptEl ? String(promptEl.value || "") : "";
              const pendingVoiceDetails = takePendingVoiceDetailsForPrompt(recipePromptText);
              appendAiRuntimeDebugReport({
                source: pendingVoiceDetails ? "ai_templates_widget+voice_command_widget" : "ai_templates_widget",
                inputText: recipePromptText,
                debugMode: true,
                dryRun: false,
                parsedResult: null,
                parseEvaluation: { pass: false, issues: ["recipe_apply_error"] },
                executionResult: { ok: false, kind: "ai_template_recipe_apply_error", error: String(err?.message || err) },
                selectionBefore: recipeSelectionBefore,
                selectionAfter: getSelectionSnapshot(),
                mutationLog: [],
                uiTrace: currentUiTrace.slice(),
                voiceDetails: pendingVoiceDetails,
                reportKind: pendingVoiceDetails ? "ai_runtime_with_voice" : "ai_runtime",
                notes: buildDebugReportNotes({ widget: "ai_templates_accordion", mode: "recipe_apply" }, pendingVoiceDetails),
              });
            } catch (reportErr) {
              console.warn("[ai-templates] recipe debug report append failed", reportErr);
            }
          }
          setStatus('Не вдалося застосувати recipe. Перевір вибір у шапці та спробуй ще раз.');
          apply.classList.remove("is-busy");
        });
    }
  });

  promptEl?.addEventListener('input', () => savePrompt(promptEl.value || ''));
  fixEl?.addEventListener('input', () => saveFix(fixEl.value || ''));
}
