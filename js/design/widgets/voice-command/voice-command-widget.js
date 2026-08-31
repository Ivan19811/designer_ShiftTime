import { appendVoiceCommandDebugReport, isAiRuntimeDebugEnabled, setPendingVoiceCommandDebugDetails } from '../../ai-command/runtime/ai-command-debug-store.js';

// js/design/widgets/voice-command/voice-command-widget.js
// Автономний MVP-віджет "Голосові команди".
// Етап 1: голос -> текст -> нормалізація -> вставка в існуючий AI Templates prompt.
// ВАЖЛИВО: цей віджет НЕ виконує runtime напряму і НЕ дублює AI parser.

const SEC_ID = 'st-voice-command-widget';
const LS_LAST_TEXT = 'st_voice_command_last_text_v1';
const LS_AUTO_GENERATE = 'st_voice_command_auto_generate_v1';
const LS_WAKE_MODE = 'st_voice_command_wake_mode_v1';

function safeLocalStorageGet(key, fallback = '') {
  try { return window.localStorage.getItem(key) ?? fallback; } catch (e) { return fallback; }
}

function safeLocalStorageSet(key, value) {
  try { window.localStorage.setItem(key, String(value ?? '')); } catch (e) {}
}

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isSpeechSupported() {
  return !!getSpeechRecognitionCtor();
}



const ST_VOICE_WORD_LEFT = String.raw`(^|[^\p{L}\p{N}_-])`;
const ST_VOICE_WORD_RIGHT = String.raw`(?=$|[^\p{L}\p{N}_-])`;
function voiceWordRegex(source, flags = 'giu') {
  return new RegExp(`${ST_VOICE_WORD_LEFT}(?:${source})${ST_VOICE_WORD_RIGHT}`, flags);
}
function replaceVoiceWord(text, source, replacement) {
  return String(text || '').replace(voiceWordRegex(source), (match, leading = '') => `${leading}${replacement}`);
}
function hasVoiceWord(text, source) {
  return voiceWordRegex(source, 'iu').test(String(text || ''));
}

function hasWakeWord(text) {
  return hasVoiceWord(text, String.raw`слухай|слухати|слухаю|слухаєш`);
}

function extractAfterWakeWord(text) {
  const raw = normalizeSpaces(String(text || '').toLowerCase());
  if (!raw) return '';
  const re = voiceWordRegex(String.raw`слухай|слухати|слухаю|слухаєш`, 'iu');
  const match = re.exec(raw);
  if (!match) return '';
  const after = raw.slice(match.index + match[0].length);
  return normalizeSpaces(after.replace(/^[,.:;!\-–—\s]+/u, ''));
}

function normalizeSpaces(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function normalizeVoiceCommand(text) {
  let out = String(text || '').toLowerCase();

  // Типові помилки голосового вводу / диктування.
  // Не використовуємо JS \b, бо він некоректний для української кирилиці.
  const replacements = [
    ['зрови', 'зроби'],
    ['зробе', 'зроби'],
    ['зробіть', 'зроби'],
    ['зробити', 'зроби'],
    ['зрабий', 'зроби'],
    ['зраби', 'зроби'],
    ['зміни', 'зроби'],
    ['виділив', 'виділи'],
    ['виділила', 'виділи'],
    ['виділі', 'виділи'],
    ['виділіть', 'виділи'],
    ['вибрав', 'вибери'],
    ['вибрала', 'вибери'],
    ['маіні', 'мейні'],
    ['маін', 'мейн'],
    ['майні', 'мейні'],
    ['майн', 'мейн'],
    ['вкрючи', 'включи'],
    ['вкрючися', 'включи'],
    ['включення', 'включи'],
    ['увімкнення', 'увімкни'],
    ['відлагоддення', 'відлагодження'],
    ['відлагодденя', 'відлагодження'],
    ['відлагоддіння', 'відлагодження'],
    ['залівка', 'заливка'],
    ['активної', 'активний'],
    ['активного', 'активний'],
    ['активному', 'активний'],
    ['оранджев[а-яіїєґ]*', 'помаранчеву'],
    ['оранжев[а-яіїєґ]*', 'помаранчеву'],
    ['жовтую', 'жовту'],
    ['синюю', 'синю'],
    ['зеленую', 'зелену'],
    ['червоную', 'червону'],
    ['бекграунд', 'фон'],
    ['background', 'фон'],
    ['шедоу', 'тінь'],
    ['shadow', 'тінь'],
    ['бордер', 'бордер'],
  ];

  for (const [source, replacement] of replacements) {
    out = replaceVoiceWord(out, source, replacement);
  }

  out = normalizeSpaces(out);

  // ВАЖЛИВО 00107: більше НЕ додаємо автоматично слово "зроби".
  // Голосовий віджет має передавати саме те, що сказав користувач, лише з безпечними
  // виправленнями помилок розпізнавання. Інакше selection-команди типу "виділи блок"
  // перетворювались на "зроби виділи блок" і могли йти в неправильний сценарій.

  return normalizeSpaces(out);
}

function openAiTemplatesSection(aiPrompt) {
  const section = aiPrompt && aiPrompt.closest ? aiPrompt.closest('.design-section') : null;
  if (!section) return;
  section.classList.add('is-open');
  const body = section.querySelector('.design-section__body');
  if (body) body.hidden = false;
}

function findAiControls() {
  const prompt = document.querySelector('[data-st-ai-prompt]');
  const generate = document.querySelector('[data-st-ai-generate]');
  const apply = document.querySelector('[data-st-ai-apply]');
  const debugToggle = document.querySelector('[data-st-ai-debug-toggle]');
  const debugJournal = document.querySelector('a[href$="ai-command-debug.html"], a[href*="ai-command-debug.html"]');
  return { prompt, generate, apply, debugToggle, debugJournal };
}

function setAiPromptText(text, options = {}) {
  const controls = findAiControls();
  if (!controls.prompt) {
    return { ok: false, reason: 'ai_prompt_not_found' };
  }

  const shouldOpen = options.open !== false;
  const shouldFocus = options.focus !== false;

  if (shouldOpen) openAiTemplatesSection(controls.prompt);
  controls.prompt.value = String(text || '');
  controls.prompt.dispatchEvent(new Event('input', { bubbles: true }));
  controls.prompt.dispatchEvent(new Event('change', { bubbles: true }));

  if (shouldFocus) {
    try { controls.prompt.focus({ preventScroll: true }); } catch (e) { try { controls.prompt.focus(); } catch (_) {} }
  }

  return { ok: true, controls };
}

function mirrorToAiPrompt(text) {
  const commandText = normalizeSpaces(text);
  if (!commandText) return { ok: false, reason: 'empty_text' };
  return setAiPromptText(commandText, { focus: false, open: true });
}

function sendToAiGenerate(text) {
  const setResult = setAiPromptText(text, { focus: false, open: true });
  if (!setResult.ok) return setResult;
  const generate = setResult.controls && setResult.controls.generate;
  if (!generate) return { ok: false, reason: 'ai_generate_button_not_found' };
  flashAiButton(generate);
  generate.click();
  return { ok: true };
}

function flashAiButton(button) {
  if (!button || !button.classList) return;
  button.classList.remove('st-voice-ai-click-flash');
  // force reflow so repeated voice clicks restart the visual signal
  try { void button.offsetWidth; } catch (e) {}
  button.classList.add('st-voice-ai-click-flash');
  window.setTimeout(() => {
    try { button.classList.remove('st-voice-ai-click-flash'); } catch (e) {}
  }, 950);
}

function isDebugToggleEnabled(button) {
  if (!button) return false;
  const text = String(button.textContent || '').toLowerCase();
  return button.classList.contains('is-active')
    || button.getAttribute('aria-pressed') === 'true'
    || /(?:вкл|увімк|ввімк|on)/iu.test(text);
}

function clickDebugToggle(mode = 'toggle') {
  const controls = findAiControls();
  const button = controls.debugToggle;
  if (!button) return { ok: false, reason: 'ai_debug_toggle_not_found' };

  const enabled = isDebugToggleEnabled(button);
  const normalizedMode = String(mode || 'toggle');
  if (normalizedMode === 'enable' && enabled) {
    flashAiButton(button);
    return { ok: true, already: true, state: 'enabled' };
  }
  if (normalizedMode === 'disable' && !enabled) {
    flashAiButton(button);
    return { ok: true, already: true, state: 'disabled' };
  }

  flashAiButton(button);
  button.click();
  return { ok: true, state: normalizedMode };
}

function clickDebugJournal() {
  const controls = findAiControls();
  const link = controls.debugJournal;
  if (!link) return { ok: false, reason: 'ai_debug_journal_not_found' };
  flashAiButton(link);
  window.setTimeout(() => {
    try { link.click(); } catch (e) {
      const href = link.getAttribute('href');
      if (href) window.location.href = href;
    }
  }, 180);
  return { ok: true };
}

function clickAiButton(kind) {
  const controls = findAiControls();
  const button = kind === 'apply' ? controls.apply : controls.generate;
  if (!button) return { ok: false, reason: kind === 'apply' ? 'ai_apply_button_not_found' : 'ai_generate_button_not_found' };
  if (button.disabled || button.getAttribute('aria-disabled') === 'true') {
    return { ok: false, reason: kind === 'apply' ? 'ai_apply_button_disabled' : 'ai_generate_button_disabled' };
  }
  flashAiButton(button);
  button.click();
  return { ok: true };
}

function waitForAiButtonEnabled(kind, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 3200;
  const intervalMs = Number.isFinite(options.intervalMs) ? options.intervalMs : 90;
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const tick = () => {
      const controls = findAiControls();
      const button = kind === 'apply' ? controls.apply : controls.generate;
      if (!button) {
        resolve({ ok: false, reason: kind === 'apply' ? 'ai_apply_button_not_found' : 'ai_generate_button_not_found' });
        return;
      }
      if (!button.disabled && button.getAttribute('aria-disabled') !== 'true') {
        resolve({ ok: true, button });
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve({ ok: false, reason: kind === 'apply' ? 'ai_apply_button_disabled' : 'ai_generate_button_disabled' });
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}


function safeAppendVoiceDebugReport(payload = {}) {
  const rawText = normalizeSpaces(payload.rawText || payload.raw || '');
  const normalizedText = normalizeSpaces(payload.normalizedText || payload.normalized || '');
  const uiCommand = payload.uiCommand || null;
  const result = payload.result || null;
  const mirrorResult = payload.mirrorResult || null;
  const reportInput = normalizedText || rawText || (uiCommand ? uiCommand.label : '');

  if (!reportInput && !uiCommand) return null;

  try {
    return appendVoiceCommandDebugReport({
      inputText: reportInput,
      source: 'voice_command_widget',
      reportKind: 'voice_command',
      debugMode: isAiRuntimeDebugEnabled(),
      status: result && result.ok === false ? 'FAIL' : 'PASS',
      assistantMessage: payload.statusText || '',
      voiceDetails: buildVoiceDetails(payload),
      notes: {
        voiceReport: true,
        message: 'Voice command report is stored in the shared AI Runtime debug journal.',
      },
    });
  } catch (error) {
    console.warn('[STVoiceCommandWidget] Failed to append voice debug report', error);
    return null;
  }
}

function snapshotButton(button, label) {
  if (!button) return { found: false, label };
  return {
    found: true,
    label,
    text: normalizeSpaces(button.textContent || ''),
    disabled: !!button.disabled || button.getAttribute('aria-disabled') === 'true',
    active: button.classList ? button.classList.contains('is-active') : false,
    ariaPressed: button.getAttribute ? button.getAttribute('aria-pressed') : null,
    selector: button.matches?.('[data-st-ai-generate]') ? '[data-st-ai-generate]'
      : button.matches?.('[data-st-ai-apply]') ? '[data-st-ai-apply]'
      : button.matches?.('[data-st-ai-debug-toggle]') ? '[data-st-ai-debug-toggle]'
      : button.matches?.('a[href$="ai-command-debug.html"], a[href*="ai-command-debug.html"]') ? 'a[href*="ai-command-debug.html"]'
      : null,
  };
}

function snapshotAiControls() {
  const controls = findAiControls();
  const promptValue = controls.prompt ? String(controls.prompt.value || '') : '';
  return {
    promptFound: !!controls.prompt,
    promptValue,
    promptLength: promptValue.length,
    debugModeEnabled: isAiRuntimeDebugEnabled(),
    generate: snapshotButton(controls.generate, 'Згенерувати'),
    apply: snapshotButton(controls.apply, 'Застосувати'),
    debugToggle: snapshotButton(controls.debugToggle, 'Відлагодження'),
    debugJournal: snapshotButton(controls.debugJournal, 'Журнал відлагодження'),
  };
}

function buildVoiceDetails(payload = {}) {
  const rawText = normalizeSpaces(payload.rawText || payload.raw || '');
  const normalizedText = normalizeSpaces(payload.normalizedText || payload.normalized || '');
  return {
    generatedAt: new Date().toISOString(),
    flow: payload.flow || 'voice_recognition',
    source: payload.source || 'manual',
    rawText,
    normalizedText,
    isFinal: !!payload.isFinal,
    wakeTriggered: !!payload.wakeTriggered,
    autoGenerate: !!payload.autoGenerate,
    uiCommand: payload.uiCommand || null,
    mirrorResult: payload.mirrorResult || null,
    result: payload.result || null,
    button: payload.button || null,
    statusText: payload.statusText || '',
    aiControls: snapshotAiControls(),
  };
}

function setPendingVoiceDebugForNextAiApply(payload = {}) {
  const details = buildVoiceDetails(payload);
  const reportInput = details.normalizedText || details.rawText || '';
  if (!reportInput) return null;
  try {
    return setPendingVoiceCommandDebugDetails({
      inputText: reportInput,
      voiceDetails: details,
    });
  } catch (error) {
    console.warn('[STVoiceCommandWidget] Failed to set pending voice debug details', error);
    return null;
  }
}

function normalizeControlPhrase(text) {
  return normalizeSpaces(String(text || '')
    .toLowerCase()
    .replace(/[«»„“”"'`]+/gu, '')
    .replace(/[.,:;!?()\[\]{}]+/gu, ' ')
    .replace(/\s+/gu, ' '));
}

function detectVoiceUiCommand(text) {
  const normalized = normalizeControlPhrase(text);
  if (!normalized) return null;

  const boundary = String.raw`(?:^|[^\p{L}\p{N}_-])`;
  const endBoundary = String.raw`(?=$|[^\p{L}\p{N}_-])`;
  const hasPattern = (source) => new RegExp(`${boundary}(?:${source})${endBoundary}`, 'iu').test(normalized);

  const hasDebugJournal = hasPattern(String.raw`журнал(?:\s+(?:відлагоджен\S*|відлагодд\S*|налагоджен\S*|дебаг\S*|debug))?|(?:відкрий|покажи|запусти|відкрити|показати)\s+(?:журнал|лог|логи)(?:\s+(?:відлагоджен\S*|відлагодд\S*|налагоджен\S*|дебаг\S*|debug))?|debug\s+(?:journal|log|logs)|лог(?:и)?\s+(?:відлагоджен\S*|відлагодд\S*|налагоджен\S*|дебаг\S*|debug)`);
  if (hasDebugJournal) return { type: 'debug_journal', label: 'Журнал відлагодження' };

  const hasDebugWord = hasPattern(String.raw`відлагоджен\S*|відлагодд\S*|налагоджен\S*|дебаг\S*|debug`);
  const hasDebugEnable = hasDebugWord && hasPattern(String.raw`включи|увімкни|ввімкни|увімкнути|ввімкнути|запусти|запустити|активуй|активувати|включити|on|enable`);
  const hasDebugDisable = hasDebugWord && hasPattern(String.raw`вимкни|виключи|вимкнути|виключити|зупини|зупинити|деактивуй|деактивувати|off|disable`);
  const hasDebugToggle = hasDebugWord && hasPattern(String.raw`перемкни|переключи|перемкнути|переключити|toggle`);

  if (hasDebugDisable) return { type: 'debug_disable', label: 'Вимкнути відлагодження' };
  if (hasDebugEnable) return { type: 'debug_enable', label: 'Увімкнути відлагодження' };
  if (hasDebugToggle || hasDebugWord) return { type: 'debug_toggle', label: 'Перемкнути відлагодження' };

  const hasGenerate = hasPattern(String.raw`згенеруй|згенерувати|генеруй|генерувати|згенерируй|сгенеруй|сгенерувати`);
  const hasApply = hasPattern(String.raw`застосуй|застосувати|застосовуй|застосування|засосуй|засосувати|приміни|применити|apply`);

  if (hasGenerate && hasApply) return { type: 'generate_apply', label: 'Згенерувати і застосувати' };
  if (hasGenerate) return { type: 'generate', label: 'Згенерувати' };
  if (hasApply) return { type: 'apply', label: 'Застосувати' };
  return null;
}

async function runVoiceUiCommand(uiCommand, setStatus) {
  if (!uiCommand || !uiCommand.type) return { ok: false, reason: 'empty_text' };

  if (uiCommand.type === 'debug_enable') {
    const result = clickDebugToggle('enable');
    if (setStatus) setStatus(result.ok ? (result.already ? 'Голосова команда: відлагодження вже увімкнено.' : 'Голосова команда: увімкнено відлагодження.') : statusText(result.reason));
    return result;
  }

  if (uiCommand.type === 'debug_disable') {
    const result = clickDebugToggle('disable');
    if (setStatus) setStatus(result.ok ? (result.already ? 'Голосова команда: відлагодження вже вимкнено.' : 'Голосова команда: вимкнено відлагодження.') : statusText(result.reason));
    return result;
  }

  if (uiCommand.type === 'debug_toggle') {
    const result = clickDebugToggle('toggle');
    if (setStatus) setStatus(result.ok ? 'Голосова команда: натиснуто кнопку відлагодження.' : statusText(result.reason));
    return result;
  }

  if (uiCommand.type === 'debug_journal') {
    const result = clickDebugJournal();
    if (setStatus) setStatus(result.ok ? 'Голосова команда: відкриваю журнал відлагодження.' : statusText(result.reason));
    return result;
  }

  if (uiCommand.type === 'generate') {
    const result = clickAiButton('generate');
    if (setStatus) setStatus(result.ok ? 'Голосова команда: натиснуто “Згенерувати”.' : statusText(result.reason));
    return result;
  }

  if (uiCommand.type === 'apply') {
    const result = clickAiButton('apply');
    if (setStatus) setStatus(result.ok ? 'Голосова команда: натиснуто “Застосувати”.' : statusText(result.reason));
    return result;
  }

  if (uiCommand.type === 'generate_apply') {
    const generateResult = clickAiButton('generate');
    if (!generateResult.ok) {
      if (setStatus) setStatus(statusText(generateResult.reason));
      return generateResult;
    }

    if (setStatus) setStatus('Голосова команда: натиснуто “Згенерувати”, очікую активну кнопку “Застосувати”…');
    // Даємо AI-віджету короткий час оновити draft/стан кнопки після кліку “Згенерувати”,
    // щоб “Застосувати” не натиснулось по старому попередньому draft.
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const waitResult = await waitForAiButtonEnabled('apply');
    if (!waitResult.ok) {
      if (setStatus) setStatus(statusText(waitResult.reason));
      return waitResult;
    }

    flashAiButton(waitResult.button);
    waitResult.button.click();
    if (setStatus) setStatus('Голосова команда: натиснуто “Згенерувати” і “Застосувати”.');
    return { ok: true };
  }

  return { ok: false, reason: 'empty_text' };
}

function statusText(reason) {
  if (reason === 'ai_prompt_not_found') return 'AI-поле не знайдено. Відкрий панель Дизайн і віджет AI-шаблони.';
  if (reason === 'ai_generate_button_not_found') return 'Кнопку “Згенерувати” не знайдено.';
  if (reason === 'ai_apply_button_not_found') return 'Кнопку “Застосувати” не знайдено.';
  if (reason === 'ai_debug_toggle_not_found') return 'Кнопку “Відлагодження” не знайдено. Відкрий віджет AI-шаблони.';
  if (reason === 'ai_debug_journal_not_found') return 'Кнопку/посилання “Журнал відлагодження” не знайдено. Відкрий віджет AI-шаблони.';
  if (reason === 'ai_generate_button_disabled') return 'Кнопка “Згенерувати” зараз неактивна.';
  if (reason === 'ai_apply_button_disabled') return 'Кнопка “Застосувати” ще неактивна. Спочатку потрібно згенерувати команду.';
  if (reason === 'speech_not_supported') return 'Браузер не підтримує розпізнавання голосу. Спробуй Chrome / Edge через HTTPS.';
  if (reason === 'empty_text') return 'Немає тексту команди.';
  return String(reason || 'Готово.');
}

function countVoiceWords(text) {
  const words = normalizeSpaces(text).match(/[\p{L}\p{N}_-]+/gu);
  return words ? words.length : 0;
}

function stripTrailingVoicePunctuation(text) {
  return normalizeSpaces(String(text || '').replace(/[\s,.;:!?…]+$/u, ''));
}

function addVoiceSentenceDot(text) {
  const base = stripTrailingVoicePunctuation(text);
  return base ? `${base}.` : '';
}

function buildVoiceTextWithBreaks(baseText, commaBreaks = []) {
  const clean = normalizeSpaces(baseText);
  if (!clean) return '';

  const words = clean.split(/\s+/u).filter(Boolean);
  if (!words.length) return '';

  const breakSet = new Set((commaBreaks || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value < words.length));

  const out = [];
  for (let i = 0; i < words.length; i += 1) {
    out.push(words[i]);
    if (breakSet.has(i + 1)) out.push(',');
  }

  return normalizeSpaces(out.join(' ').replace(/\s+,/gu, ','));
}

function createRecognition(onResult, onStatus, options = {}) {
  const Recognition = getSpeechRecognitionCtor();
  if (!Recognition) return null;

  const commaPauseMs = Number.isFinite(options.commaPauseMs) ? options.commaPauseMs : 1300;
  const stopPauseMs = Number.isFinite(options.stopPauseMs) ? options.stopPauseMs : 3000;

  const recognition = new Recognition();
  recognition.lang = 'uk-UA';
  // Для пауз між частинами команди потрібен один довший ручний сеанс слухання.
  // Wake-режим лишається вимкненим; continuous використовується тільки після кліку “Слухати”.
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  let latestBaseText = '';
  let latestPunctuatedText = '';
  let commaBreaks = [];
  let commaTimer = null;
  let stopTimer = null;
  let finalDelivered = false;

  const clearPauseTimers = () => {
    if (commaTimer) window.clearTimeout(commaTimer);
    if (stopTimer) window.clearTimeout(stopTimer);
    commaTimer = null;
    stopTimer = null;
  };

  const deliverCurrent = (isFinal = false) => {
    const base = normalizeSpaces(latestBaseText);
    if (!base) return;
    const withCommas = buildVoiceTextWithBreaks(base, commaBreaks);
    const raw = isFinal ? addVoiceSentenceDot(withCommas) : withCommas;
    if (!raw) return;
    latestPunctuatedText = raw;
    const normalized = normalizeVoiceCommand(raw);
    onResult({ raw, normalized, isFinal: !!isFinal });
  };

  const schedulePauseTimers = () => {
    clearPauseTimers();
    if (!normalizeSpaces(latestBaseText)) return;

    commaTimer = window.setTimeout(() => {
      const wordCount = countVoiceWords(latestBaseText);
      if (wordCount > 0 && !commaBreaks.includes(wordCount)) {
        commaBreaks.push(wordCount);
        commaBreaks = commaBreaks.slice(-12);
        deliverCurrent(false);
        onStatus('Пауза 1.3 сек — додав кому. Продовжуй або зроби паузу 3 сек для завершення.');
      }
    }, commaPauseMs);

    stopTimer = window.setTimeout(() => {
      if (finalDelivered) return;
      finalDelivered = true;
      clearPauseTimers();
      deliverCurrent(true);
      try { recognition.stop(); } catch (e) {}
    }, stopPauseMs);
  };

  const buildBaseTextFromResults = (ev) => {
    const parts = [];
    for (let i = 0; i < ev.results.length; i += 1) {
      const item = ev.results[i];
      const transcript = item && item[0] && item[0].transcript ? item[0].transcript : '';
      if (transcript) parts.push(transcript);
    }
    return normalizeSpaces(parts.join(' '));
  };

  recognition.onstart = () => onStatus('Слухаю українську команду…');
  recognition.onspeechstart = () => onStatus('Говори команду. Пауза 1.3 сек = кома, пауза 3 сек = завершення.');
  recognition.onspeechend = () => onStatus('Пауза в голосі… якщо 3 сек тиші — завершу слухання.');
  recognition.onerror = (ev) => {
    const code = ev && ev.error ? String(ev.error) : 'unknown';
    clearPauseTimers();
    if (code === 'not-allowed' || code === 'service-not-allowed') onStatus('Доступ до мікрофона заборонений. Дозволь мікрофон у браузері.');
    else if (code === 'no-speech') onStatus('Не почув фразу. Натисни мікрофон і скажи команду ще раз.');
    else if (code === 'aborted') onStatus('Браузер перервав поточне слухання. Спробуй кнопку “Слухати”; фонове wake-очікування вимкнене.');
    else onStatus(`Помилка розпізнавання: ${code}`);
  };
  recognition.onend = () => {
    clearPauseTimers();
    onStatus(finalDelivered ? 'Голосове прослуховування завершено крапкою.' : 'Голосове прослуховування зупинено.');
  };
  recognition._stVoiceClearPauseTimers = clearPauseTimers;
  recognition._stVoiceWasFinalDelivered = () => finalDelivered;
  recognition._stVoiceGetLatestPunctuatedText = () => latestPunctuatedText;

  recognition.onresult = (ev) => {
    const base = buildBaseTextFromResults(ev);
    if (!base) return;

    const previousWordCount = countVoiceWords(latestBaseText);
    const nextWordCount = countVoiceWords(base);
    latestBaseText = base;

    // Якщо браузер уточнив/переписав проміжний текст і кількість слів стала меншою,
    // прибираємо коми, які були поставлені після слів, яких уже немає.
    if (nextWordCount < previousWordCount) {
      commaBreaks = commaBreaks.filter((breakAt) => breakAt <= nextWordCount);
    }

    finalDelivered = false;
    deliverCurrent(false);
    schedulePauseTimers();
  };

  return recognition;
}

export function initVoiceCommandWidget(host) {
  if (!host || host.querySelector(`#${SEC_ID}`)) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;

  const lastText = safeLocalStorageGet(LS_LAST_TEXT, '');
  const autoGenerate = safeLocalStorageGet(LS_AUTO_GENERATE, '0') === '1';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Голосові команди</span>
      </div>
      <span class="st-voice-header-tooltip" role="tooltip">
        <b>Голосові команди</b>
        <span>Стабільний режим: натисни “Слухати”, скажи команду, перевір текст у полі AI, потім натисни “Згенерувати” і “Застосувати”. Wake-режим тимчасово вимкнений, щоб не ламати основне слухання.</span>
      </span>
      <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
      <div class="st-voice-box">
        <div class="st-voice-status" data-st-voice-status>Готово. Натисни “Слухати” і скажи команду.</div>

        <div class="st-voice-actions">
          <button type="button" class="st-voice-btn st-voice-btn--primary" data-st-voice-start>🎙 Слухати</button>
          <button type="button" class="st-voice-btn" data-st-voice-stop disabled>■ Стоп</button>
        </div>

        <div class="st-voice-actions st-voice-actions--wrap">
          <button type="button" class="st-voice-btn st-voice-btn--wake" data-st-voice-wake-start disabled title="Wake-режим тимчасово вимкнений до окремого стабільного фікса">👂 “Слухай” тимчасово вимкнено</button>
        </div>

        <label class="st-voice-label">Розпізнана команда</label>
        <textarea class="st-voice-textarea" rows="3" data-st-voice-text placeholder="Наприклад: зроби активний блок червоним">${lastText.replace(/[&<>\"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))}</textarea>

        <label class="st-voice-check">
          <input type="checkbox" data-st-voice-auto-generate ${autoGenerate ? 'checked' : ''} />
          <span>Автоматично натискати “Згенерувати” після розпізнавання</span>
        </label>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #${SEC_ID} .design-section__header{position:relative;overflow:visible;}
    #${SEC_ID} .st-voice-header-tooltip{position:absolute;left:8px;right:8px;top:calc(100% + 8px);z-index:9999;display:grid;gap:6px;padding:14px 16px;border-radius:14px;border:1px solid rgba(15,23,42,.18);background:#ffffff!important;color:#020617!important;box-shadow:0 18px 44px rgba(15,23,42,.24);font-size:15px;line-height:1.45;font-weight:700;text-align:left;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .16s ease,transform .16s ease;}
    #${SEC_ID} .st-voice-header-tooltip b{color:#020617!important;font-size:16px;font-weight:900;}
    #${SEC_ID} .st-voice-header-tooltip span{color:#0f172a!important;font-size:15px;font-weight:700;}
    #${SEC_ID} .design-section__header:hover .st-voice-header-tooltip{opacity:1;transform:translateY(0);transition-delay:3s;}
    #${SEC_ID} .st-voice-box{display:flex;flex-direction:column;gap:10px;padding:2px 0 4px;}
    #${SEC_ID} .st-voice-status{font-size:12px;line-height:1.35;color:#cbd5e1;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.24);border-radius:12px;padding:9px 10px;}
    #${SEC_ID} .st-voice-actions{display:flex;gap:8px;align-items:center;}
    #${SEC_ID} .st-voice-actions--wrap{flex-wrap:wrap;}
    #${SEC_ID} .st-voice-btn{border:1px solid rgba(148,163,184,.28);background:rgba(15,23,42,.72);color:#e5e7eb;border-radius:11px;padding:8px 10px;font-size:12px;font-weight:700;cursor:pointer;transition:transform .12s ease,background .12s ease,border-color .12s ease;}
    #${SEC_ID} .st-voice-btn:hover{background:rgba(30,41,59,.92);border-color:rgba(148,163,184,.48);}
    #${SEC_ID} .st-voice-btn:active{transform:translateY(1px);}
    #${SEC_ID} .st-voice-btn:disabled{opacity:.45;cursor:not-allowed;}
    #${SEC_ID} .st-voice-btn--primary{background:rgba(37,99,235,.22);border-color:rgba(96,165,250,.55);color:#dbeafe;}
    #${SEC_ID} .st-voice-btn--wake{background:rgba(168,85,247,.18);border-color:rgba(192,132,252,.42);color:#f3e8ff;}
    #${SEC_ID} .st-voice-btn.is-active{box-shadow:0 0 0 2px rgba(34,197,94,.20) inset;border-color:rgba(74,222,128,.70);}
    #${SEC_ID} .st-voice-label{font-size:12px;color:#94a3b8;font-weight:700;}
    #${SEC_ID} .st-voice-textarea{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid rgba(148,163,184,.25);background:#ffffff;color:#020617;padding:9px 10px;font-size:13px;line-height:1.4;resize:vertical;min-height:76px;}
    #${SEC_ID} .st-voice-textarea::placeholder{color:#64748b;}
    #${SEC_ID} .st-voice-check{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.35;color:#cbd5e1;}
    #${SEC_ID} .st-voice-check input{margin-top:2px;}
    [data-st-ai-generate].st-voice-ai-click-flash,[data-st-ai-apply].st-voice-ai-click-flash,[data-st-ai-debug-toggle].st-voice-ai-click-flash,.st-ai-link.st-voice-ai-click-flash{background:rgba(34,197,94,.28)!important;border-color:rgba(74,222,128,.95)!important;box-shadow:0 0 0 2px rgba(34,197,94,.75),0 0 18px rgba(239,68,68,.20)!important;transition:background .12s ease,border-color .12s ease,box-shadow .12s ease!important;}
  `;

  host.appendChild(sectionEl);
  host.appendChild(style);

  const statusEl = sectionEl.querySelector('[data-st-voice-status]');
  const textEl = sectionEl.querySelector('[data-st-voice-text]');
  const startBtn = sectionEl.querySelector('[data-st-voice-start]');
  const stopBtn = sectionEl.querySelector('[data-st-voice-stop]');
  const autoGenerateEl = sectionEl.querySelector('[data-st-voice-auto-generate]');

  let recognition = null;
  let listening = false;
  let starting = false;
  let hasFinalResult = false;

  const setStatus = (text) => { if (statusEl) statusEl.textContent = String(text || ''); };
  const setListening = (value) => {
    listening = !!value;
    starting = false;
    if (startBtn) {
      startBtn.disabled = listening;
      startBtn.classList.toggle('is-active', listening);
    }
    if (stopBtn) stopBtn.disabled = !listening;
  };
  const setStarting = (value) => {
    starting = !!value;
    if (startBtn) {
      startBtn.disabled = starting || listening;
      startBtn.classList.toggle('is-active', starting || listening);
    }
    if (stopBtn) stopBtn.disabled = !(starting || listening);
  };
  const getCommandText = () => normalizeSpaces(textEl ? textEl.value : '');
  const rememberText = () => safeLocalStorageSet(LS_LAST_TEXT, getCommandText());

  const stopCurrentRecognition = () => {
    try {
      if (recognition) recognition.stop();
    } catch (e) {}
  };

  const finishListening = (message) => {
    setListening(false);
    recognition = null;
    if (message) setStatus(message);
  };

  const handleFinalOrInterim = async ({ raw, normalized, isFinal }) => {
    const rawText = normalizeSpaces(raw);
    const normalizedText = normalizeSpaces(normalized);
    if (!normalizedText && !rawText) return;

    const uiCommand = isFinal ? detectVoiceUiCommand(normalizedText || rawText) : null;

    if (uiCommand) {
      hasFinalResult = true;
      setStatus(`Розпізнано керування: ${uiCommand.label}. Виконую…`);
      const result = await runVoiceUiCommand(uiCommand, setStatus);
      safeAppendVoiceDebugReport({
        flow: 'voice_ui_command_manual_listen',
        source: 'manual_click_listen',
        rawText,
        normalizedText,
        isFinal,
        uiCommand,
        result,
        statusText: result?.ok ? `Голосова команда виконана: ${uiCommand.label}` : statusText(result?.reason),
      });
      return;
    }

    if (textEl) textEl.value = normalizedText;
    safeLocalStorageSet(LS_LAST_TEXT, normalizedText);

    let mirrorResult = { ok: true, skipped: !isFinal };
    if (isFinal) {
      hasFinalResult = true;
      mirrorResult = mirrorToAiPrompt(normalizedText);
    }

    setStatus(isFinal
      ? (mirrorResult.ok ? `Розпізнано і вставлено в AI: ${normalizedText}` : `Розпізнано: ${normalizedText}. ${statusText(mirrorResult.reason)}`)
      : `Чую: ${rawText}`);

    let autoGenerateResult = null;
    if (isFinal && autoGenerateEl && autoGenerateEl.checked) {
      autoGenerateResult = sendToAiGenerate(normalizedText);
      setStatus(autoGenerateResult.ok ? `Передано в AI: ${normalizedText}. Перевір план і натисни “Застосувати”.` : statusText(autoGenerateResult.reason));
    }

    if (isFinal) {
      // Звичайна голосова команда більше НЕ створює окремий запис у журналі.
      // Вона зберігається як pending-деталі і буде вкладена в єдиний AI Runtime-звіт після кнопки “Застосувати”.
      setPendingVoiceDebugForNextAiApply({
        flow: autoGenerateResult ? 'voice_to_ai_prompt_and_generate_manual_listen' : 'voice_to_ai_prompt_manual_listen',
        source: 'manual_click_listen',
        rawText,
        normalizedText,
        isFinal,
        mirrorResult,
        autoGenerate: !!(autoGenerateEl && autoGenerateEl.checked),
        result: autoGenerateResult || mirrorResult,
        statusText: autoGenerateResult
          ? (autoGenerateResult.ok ? 'Голосову команду вставлено в AI і натиснуто “Згенерувати”. Очікую “Застосувати” для єдиного звіту.' : statusText(autoGenerateResult.reason))
          : (mirrorResult.ok ? 'Голосову команду вставлено в AI-поле. Єдиний звіт буде створено після “Застосувати”.' : statusText(mirrorResult.reason)),
      });
    }
  };

  const startManualListening = () => {
    if (!isSpeechSupported()) {
      setStatus(statusText('speech_not_supported'));
      return;
    }
    if (starting || listening) {
      setStatus('Мікрофон уже запускається або слухає. Скажи команду або натисни “Стоп”.');
      return;
    }

    stopCurrentRecognition();
    hasFinalResult = false;
    recognition = createRecognition(handleFinalOrInterim, setStatus);

    if (!recognition) {
      setStatus(statusText('speech_not_supported'));
      return;
    }

    recognition.onstart = () => {
      setListening(true);
      setStatus('Слухаю українську команду…');
    };
    recognition.onspeechstart = () => setStatus('Говори команду. Наприклад: “зроби активний блок червоним”.');
    recognition.onspeechend = () => setStatus('Обробляю голос…');
    recognition.onerror = (ev) => {
      try { recognition._stVoiceClearPauseTimers?.(); } catch (e) {}
      const code = ev && ev.error ? String(ev.error) : 'unknown';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setStatus('Доступ до мікрофона заборонений. Дозволь мікрофон у браузері.');
      } else if (code === 'no-speech') {
        setStatus('Не почув фразу. Натисни “Слухати” і скажи команду ще раз.');
      } else if (code === 'aborted') {
        setStatus('Слухання перервано браузером. Натисни “Слухати” ще раз.');
      } else {
        setStatus(`Помилка розпізнавання: ${code}`);
      }
      safeAppendVoiceDebugReport({
        flow: 'manual_listen_error',
        source: 'manual_click_listen',
        rawText: '',
        normalizedText: '',
        isFinal: false,
        result: { ok: false, reason: code },
        statusText: `SpeechRecognition error: ${code}`,
      });
    };
    recognition.onend = () => {
      try { recognition._stVoiceClearPauseTimers?.(); } catch (e) {}
      const wasFinalDelivered = !!(recognition && recognition._stVoiceWasFinalDelivered && recognition._stVoiceWasFinalDelivered());
      const message = hasFinalResult || wasFinalDelivered
        ? 'Голосове прослуховування зупинено. Команда готова.'
        : 'Голосове прослуховування зупинено.';
      finishListening(message);
    };

    try {
      setStarting(true);
      recognition.start();
    } catch (e) {
      setStarting(false);
      recognition = null;
      setStatus(`Не вдалося запустити мікрофон: ${String(e && e.message ? e.message : e)}`);
    }
  };

  if (!isSpeechSupported()) {
    setStatus(statusText('speech_not_supported'));
    if (startBtn) startBtn.disabled = true;
  }

  if (textEl) textEl.addEventListener('input', rememberText);

  if (autoGenerateEl) {
    autoGenerateEl.addEventListener('change', () => {
      safeLocalStorageSet(LS_AUTO_GENERATE, autoGenerateEl.checked ? '1' : '0');
    });
  }

  if (startBtn) startBtn.addEventListener('click', startManualListening);

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      stopCurrentRecognition();
      finishListening(getCommandText() ? 'Голосове прослуховування зупинено. Команда готова.' : 'Голосове прослуховування зупинено.');
    });
  }

  // Wake-режим навмисно вимкнений у цьому етапі.
  // Причина: у середовищі користувача окремий wake-цикл стабільно давав aborted і ламав базову кнопку “Слухати”.
  // Наступним етапом wake треба робити заново окремо, після перевірки стабільної ручної кнопки.
  safeLocalStorageSet(LS_WAKE_MODE, '0');

  // Маленький публічний міст для майбутніх етапів / debug.
  window.STVoiceCommandWidget = window.STVoiceCommandWidget || {};
  window.STVoiceCommandWidget.normalize = normalizeVoiceCommand;
  window.STVoiceCommandWidget.insertToAi = (text) => setAiPromptText(normalizeVoiceCommand(text));
  window.STVoiceCommandWidget.generateInAi = (text) => sendToAiGenerate(normalizeVoiceCommand(text));
  window.STVoiceCommandWidget.clickGenerate = () => clickAiButton('generate');
  window.STVoiceCommandWidget.clickApply = () => clickAiButton('apply');
  window.STVoiceCommandWidget.enableDebug = () => clickDebugToggle('enable');
  window.STVoiceCommandWidget.disableDebug = () => clickDebugToggle('disable');
  window.STVoiceCommandWidget.toggleDebug = () => clickDebugToggle('toggle');
  window.STVoiceCommandWidget.openDebugJournal = () => clickDebugJournal();
  window.STVoiceCommandWidget.runUiCommand = (text) => runVoiceUiCommand(detectVoiceUiCommand(normalizeVoiceCommand(text)), setStatus);
  window.STVoiceCommandWidget.detectUiCommand = (text) => detectVoiceUiCommand(normalizeVoiceCommand(text));
  window.STVoiceCommandWidget.startListening = () => startManualListening();
  window.STVoiceCommandWidget.startWake = () => ({ ok: false, reason: 'wake_temporarily_disabled' });
  window.STVoiceCommandWidget.stopWake = () => ({ ok: true, reason: 'wake_temporarily_disabled' });
}
export { normalizeVoiceCommand };
