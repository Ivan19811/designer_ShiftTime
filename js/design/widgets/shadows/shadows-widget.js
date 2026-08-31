// js/design/widgets/shadows/shadows-widget.js
// 00914: стандартні пресети тіні та перемикач внутрішньої тіні працюють через той самий live/final контракт без дубль-комітів.
// Головний віджет "Тіні / Глибина" для панелі "Дизайн"
//
// Підтримує:
//  - зовнішню тінь (box-shadow)
//  - окрему внутрішню тінь (inset box-shadow)
//  - режим "Немає тіні", який тільки вимикає, але не стирає налаштування
//  - окремий колір для outer/inner
//  - спільні повзунки геометрії (керують тим шаром, який зараз редагується)

const SHADOWS_SUBSECTIONS_STATE_KEY = 'st_design_shadows_subsections_v1';
const SHADOWS_DEBUG = false; // [00439] вимкнено продові console.log

function shLog() {
  if (!SHADOWS_DEBUG) return;
  const args = Array.prototype.slice.call(arguments);
  args.unshift('[shadows]');
  console.log.apply(console, args);
}

// --- збереження/зчитування стану під-акордеонів --- //
function loadShadowsSubsectionsState() {
  try {
    const raw = window.localStorage.getItem(SHADOWS_SUBSECTIONS_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('[shadows] Failed to load subsections state', err);
    return {};
  }
}

function saveShadowsSubsectionsState(state) {
  try {
    window.localStorage.setItem(
      SHADOWS_SUBSECTIONS_STATE_KEY,
      JSON.stringify(state || {})
    );
  } catch (err) {
    console.warn('[shadows] Failed to save subsections state', err);
  }
}

// --- допоміжне: HEX -> rgba(...) --- //
function hexToRgba(hex, opacity01) {
  if (!hex) return `rgba(0,0,0,${opacity01})`;
  let c = hex.replace('#', '').trim();

  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  if (c.length !== 6) {
    return `rgba(0,0,0,${opacity01})`;
  }
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${opacity01})`;
}

/**
 * Головний ініціалізатор віджета "Тіні / Глибина".
 *
 * @param {HTMLElement} host       - контейнер у панелі Дизайну
 * @param {Function} getSelection  - функція конструктора, яка повертає поточне виділення
 *                                  { type: 'block'|'section'|'none', elements: HTMLElement[] }
 */
export function initShadowsWidget(host, getSelection) {
  if (!host) return;

  // --- ГЛОБАЛЬНИЙ СТАН ВІДЖЕТА --- //
  // Ми тримаємо окремо налаштування outer/inner та "останній" стан для відновлення.
  let shadowsState = {
    outer: {
      enabled: true,
      preset: 'soft',      // 'soft' | 'accent' | 'outline' | 'glow' | 'custom'
      color: '#000000',
      opacity: 40,         // 0–100
      offsetX: 0,
      offsetY: 12,
      blur: 24,
      spread: 0
    },
    inner: {
      enabled: false,
      color: '#000000',
      opacity: 40,
      offsetX: 0,
      offsetY: 6,
      blur: 16,
      spread: 0
    },
    // тимчасове вимкнення зовнішньої тіні (для чекбокса "Немає тіні")
    outerDisabled: false,
    // який шар зараз редагуємо повзунками: 'outer' | 'inner'
    editTarget: 'outer',
    // збережений стан зовнішньої тіні (щоб відновити після "Немає тіні")
    lastOuterSnapshot: null
  };

  let activeShadowEditSessionTargets00914_ = [];
  let activeShadowEditSessionStartedAt00914_ = 0;
  let pendingShadowLiveReason00914_ = '';
  let shadowLiveRaf00914_ = 0;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Тіні</span>
        
      </div>
      <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
<span class="design-section__header-subtitle">
          Об'єм, світіння, внутрішня тінь
        </span>

      <!-- КОМУ ЗАСТОСОВУЄМО -->
      <div class="design-field">
        <div class="design-field__label">Кому застосувати тіні</div>
        <div class="design-subnote" data-shadows-summary>
          Тіні застосовуються до поточного виділення на полотні
          (Canvas або Дерево). Виділи блоки, секції, текст, зображення
          чи лінії — і налаштовуй глибину.
        </div>
      </div>

      <div class="design-border-subsections">

        <!-- 1. РЕЖИМ ТІНІ / ПРЕСЕТИ -->
        <div class="design-border-subsection" data-shadows-subsection-id="mode">
          <button class="design-border-subheader" type="button">
            <span class="design-border-subheader-title">Режим тіні</span>
            <span class="design-border-subheader-chevron">▶</span>
          </button>
          <div class="design-border-subbody">
            <div class="design-field">
              <div class="design-field__label">Зовнішня тінь (box-shadow)</div>
              <div class="design-pill-group" data-shadow-presets>
                <button type="button" class="design-pill is-active" data-sh-preset="soft">
                  М'яка
                </button>
                <button type="button" class="design-pill" data-sh-preset="accent">
                  Акцентна
                </button>
                <button type="button" class="design-pill" data-sh-preset="outline">
                  Обводка
                </button>
                <button type="button" class="design-pill" data-sh-preset="glow">
                  Світіння
                </button>
                <button type="button" class="design-pill" data-sh-preset="custom">
                  Кастом
                </button>
              </div>

              <label class="design-border-flag" style="margin-top:8px;">
                <input type="checkbox" data-shadow-outer-none />
                <span>Немає зовнішньої тіні</span>
              </label>

              <p class="design-subnote">
                Якщо увімкнено "Немає тіні" — ми ховаємо зовнішню тінь, але
                зберігаємо всі налаштування. При вимкненні чекбокса тінь
                повертається у тому самому вигляді.
              </p>
            </div>

            <div class="design-field">
              <div class="design-field__label">Внутрішня тінь (inset)</div>
              <div class="design-pill-group">
                <button type="button" class="design-pill" data-shadow-inner-toggle>
                  Внутрішня тінь
                </button>
                <label class="design-border-flag" style="margin-left:8px;">
                  <input type="checkbox" data-shadow-inner-none />
                  <span>Немає внутрішньої тіні</span>
                </label>
              </div>
              <p class="design-subnote">
                Внутрішня тінь малюється через inset box-shadow. Коли
                активуєш кнопку "Внутрішня тінь", усі повзунки нижче
                редагують саме внутрішню тінь.
              </p>
            </div>
          </div>
        </div>

        <!-- 2. ГЕОМЕТРІЯ -->
        <div class="design-border-subsection" data-shadows-subsection-id="geometry">
          <button class="design-border-subheader" type="button">
            <span class="design-border-subheader-title">
              Геометрія тіні (<span data-shadow-edit-target-label>зовнішня</span>)
            </span>
            <span class="design-border-subheader-chevron">▶</span>
          </button>
          <div class="design-border-subbody">
            <div class="design-field">
              <div class="design-field__label">Зсув по X (горизонталь)</div>
              <input type="range" min="-64" max="64" value="0" data-shadow-geom="offsetX" />
            </div>

            <div class="design-field">
              <div class="design-field__label">Зсув по Y (вертикаль)</div>
              <input type="range" min="-64" max="64" value="12" data-shadow-geom="offsetY" />
            </div>

            <div class="design-field">
              <div class="design-field__label">Розмиття (blur)</div>
              <input type="range" min="0" max="128" value="24" data-shadow-geom="blur" />
            </div>

            <div class="design-field">
              <div class="design-field__label">Розмах (spread)</div>
              <input type="range" min="-64" max="64" value="0" data-shadow-geom="spread" />
            </div>
          </div>
        </div>

        <!-- 3. КОЛІР ТІНІ -->
        <div class="design-border-subsection" data-shadows-subsection-id="color">
          <button class="design-border-subheader" type="button">
            <span class="design-border-subheader-title">Колір тіні</span>
            <span class="design-border-subheader-chevron">▶</span>
          </button>
          <div class="design-border-subbody">
            <div class="design-field">
              <div class="design-field__label">Зовнішня тінь</div>
              <div class="builder__field builder__field--inline">
                <label>
                  <span class="builder__field-label">Колір</span>
                  <input type="color" value="#000000" data-shadow-color="outer" />
                </label>
                <label>
                  <span class="builder__field-label">Прозорість</span>
                  <input type="range" min="0" max="100" value="40" data-shadow-opacity="outer" />
                </label>
              </div>
            </div>

            <div class="design-field">
              <div class="design-field__label">Внутрішня тінь</div>
              <div class="builder__field builder__field--inline">
                <label>
                  <span class="builder__field-label">Колір</span>
                  <input type="color" value="#000000" data-shadow-color="inner" />
                </label>
                <label>
                  <span class="builder__field-label">Прозорість</span>
                  <input type="range" min="0" max="100" value="40" data-shadow-opacity="inner" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. ЕФЕКТИ (заглушка на майбутнє) -->
        <div class="design-border-subsection" data-shadows-subsection-id="effects">
          <button class="design-border-subheader" type="button">
            <span class="design-border-subheader-title">Ефекти / Світіння / Обводка</span>
            <span class="design-border-subheader-chevron">▶</span>
          </button>
          <div class="design-border-subbody">
            <p class="design-subnote">
              Тут з'являться додаткові ефекти (подвійні тіні, багатошаровий глоу,
              неон тощо). Поки що це заглушка.
            </p>
          </div>
        </div>

      </div>

      <div class="design-field">
        <div class="design-border-apply-row">
          <button type="button" class="design-button" data-shadows="apply">
            Застосувати тіні
          </button>
          <span class="design-border-apply-note">
            Тіні застосовуються автоматично при зміні будь-якого параметра,
            але цю кнопку можна використовувати як «оновити ще раз».
          </span>
        </div>
      </div>
    </div>
  `;

  // --- верхній акардеон --- //
  const headerBtn = sectionEl.querySelector('.design-section__header');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });
  }

  const summaryEl = sectionEl.querySelector('[data-shadows-summary]');
  const editTargetLabelEl = sectionEl.querySelector('[data-shadow-edit-target-label]');

  // --- допоміжні функції роботи з таргетами --- //
  function getShadowTargets() {
    if (typeof getSelection === 'function') {
      const sel = getSelection();
      if (sel && Array.isArray(sel.elements)) {
        const els = sel.elements.filter(Boolean);
        // Menu cascade rule:
        // - If any menu items selected -> only them
        // - Else if menu block selected -> menu block (global)
        const menuItems = els.filter(el => el instanceof HTMLElement && el.matches('[data-st-menu-item="1"]'));
        if (menuItems.length) return menuItems;
        const menuBlocks = els.filter(el => el instanceof HTMLElement && el.matches('[data-st-menu="1"]'));
        if (menuBlocks.length) return [menuBlocks[0]];
        return els;
      }
    }
    return [];
  }


  function cloneShadowState00914_() {
    try { return JSON.parse(JSON.stringify(shadowsState)); }
    catch { return { outer: { ...shadowsState.outer }, inner: { ...shadowsState.inner }, outerDisabled: !!shadowsState.outerDisabled, editTarget: shadowsState.editTarget }; }
  }

  function connectedTargets00914_(targets = []) {
    const seen = new Set();
    const out = [];
    for (const el of targets || []) {
      if (!(el instanceof HTMLElement) || !el.isConnected) continue;
      const key = el.dataset?.sfId || el.dataset?.stNodeId || el.dataset?.nodeId || `${el.tagName}:${out.length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(el);
    }
    return out;
  }

  function beginShadowEditSession00914_(reason = 'shadow-edit') {
    const targets = connectedTargets00914_(getShadowTargets());
    if (targets.length) {
      activeShadowEditSessionTargets00914_ = targets;
      activeShadowEditSessionStartedAt00914_ = Date.now();
    }
    return targets;
  }

  function readShadowTargets00914_(useSessionTargets = false) {
    if (useSessionTargets) {
      const held = connectedTargets00914_(activeShadowEditSessionTargets00914_);
      if (held.length && Date.now() - activeShadowEditSessionStartedAt00914_ < 600000) return held;
      return beginShadowEditSession00914_('shadow-session-start');
    }
    return connectedTargets00914_(getShadowTargets());
  }

  function endShadowEditSession00914_() {
    activeShadowEditSessionTargets00914_ = [];
    activeShadowEditSessionStartedAt00914_ = 0;
  }

  function dispatchShadowApplied00914_(targets, boxShadowValue, opts = {}) {
    const cleanTargets = connectedTargets00914_(targets);
    if (!cleanTargets.length) return;
    const live = opts?.live === true;
    const detail = {
      targets: cleanTargets,
      target: cleanTargets[0] || null,
      shadowState: cloneShadowState00914_(),
      boxShadowValue: boxShadowValue || 'none',
      reason: opts?.reason || (live ? 'shadow-live-00914' : 'shadow-apply-00914'),
      live,
      mainLiveRafQuiet00914: cleanTargets.some(el => el instanceof HTMLElement && !!el.closest?.('#st-site-main-slot')),
      selectionVisualVariableSync00914: true,
      rootSaveSuppressed: live,
      storeWriteSuppressed: live,
    };
    const eventName = live ? 'st:shadows-widget:live-applied' : 'st:shadows-widget:applied';
    try { window.dispatchEvent(new CustomEvent(eventName, { detail })); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent(eventName, { detail })); } catch (_) {}
  }

  function syncSelectionAuthoredShadow00914_(el, boxShadowValue) {
    if (!(el instanceof HTMLElement)) return;
    const value = String(boxShadowValue || 'none').trim() || 'none';
    const targets = [];
    const seen = new Set();
    const add = (node) => {
      if (!(node instanceof HTMLElement) || !node.isConnected || seen.has(node)) return;
      seen.add(node);
      targets.push(node);
    };
    add(el);
    const owner = el.closest?.('[data-sf-id],[data-st-node-id],[data-node-id],.sf-selection-current,.is-selected,.hb-dom-selected');
    add(owner);
    if (el.parentElement) add(el.parentElement.closest?.('[data-sf-id],[data-st-node-id],[data-node-id],.sf-selection-current,.is-selected,.hb-dom-selected'));
    for (const target of targets) {
      target.style.setProperty('--sf-selection-authored-shadow', value);
      target.dataset.stShadowVisualSync = '00914';
    }
  }

  function scheduleShadowLiveApply00914_(reason = 'shadow-live-00914') {
    pendingShadowLiveReason00914_ = reason;
    if (shadowLiveRaf00914_) return;
    shadowLiveRaf00914_ = requestAnimationFrame(() => {
      shadowLiveRaf00914_ = 0;
      const r = pendingShadowLiveReason00914_ || 'shadow-live-00914';
      pendingShadowLiveReason00914_ = '';
      applyShadowsToTargets({ live: true, useSessionTargets: true, reason: r });
    });
  }

  function commitShadowFinal00914_(reason = 'shadow-final-00914') {
    if (shadowLiveRaf00914_) {
      try { cancelAnimationFrame(shadowLiveRaf00914_); } catch (_) {}
      shadowLiveRaf00914_ = 0;
      pendingShadowLiveReason00914_ = '';
    }
    applyShadowsToTargets({ live: false, useSessionTargets: true, endSession: true, reason });
  }

  function updateTargetsSummary() {
    if (!summaryEl) return;
    const targets = getShadowTargets();
    const count = targets.length;

    if (!count) {
      summaryEl.textContent =
        'Наразі нічого не вибрано. Виділи на полотні блок, секцію, текст, зображення чи лінію — тіні будуть застосовані до поточного виділення.';
      return;
    }

    if (count === 1) {
      summaryEl.textContent =
        'Виділено 1 елемент. Налаштування тіней будуть застосовані до нього.';
      return;
    }

    summaryEl.textContent =
      'Виділено ' +
      count +
      ' елементи(ів). Тіні будуть застосовані до всіх вибраних елементів.';
  }

  // --- ПРЕСЕТИ ЗОВНІШНЬОЇ ТІНІ --- //
  const presetBtns = Array.from(sectionEl.querySelectorAll('[data-sh-preset]'));

function applyPresetToOuter(presetId) {
  const o = shadowsState.outer;

  if (presetId === 'soft') {
    o.offsetX = 0;
    o.offsetY = 12;
    o.blur = 24;
    o.spread = 0;
    o.opacity = 35;
  } else if (presetId === 'accent') {
    o.offsetX = 0;
    o.offsetY = 14;
    o.blur = 32;
    o.spread = 4;
    o.opacity = 60;
  } else if (presetId === 'outline') {
    o.offsetX = 0;
    o.offsetY = 0;
    o.blur = 0;
    o.spread = 1;
    o.opacity = 70;
  } else if (presetId === 'glow') {
    o.offsetX = 0;
    o.offsetY = 0;
    o.blur = 32;
    o.spread = 8;
    o.opacity = 80;
  }

  o.preset = presetId;
  o.enabled = true;

  // 00914: вибір стандартної тіні має одразу повернути зовнішню тінь,
  // навіть якщо перед цим був увімкнений прапорець "Немає зовнішньої тіні".
  shadowsState.outerDisabled = false;
  shadowsState.lastOuterSnapshot = null;

  // 🔹 При виборі пресета ми однозначно редагуємо ЗОВНІШНЮ тінь
  shadowsState.editTarget = 'outer';

  syncOuterNoneCheckbox();
  syncInnerControls();          // оновлюємо стан кнопки "Внутрішня тінь" + ярличок
  syncGeometryControlsFromState();
  syncColorControlsFromState();
  syncPresetButtons();

  // Preset is a single explicit action, but it still updates visual state before Store commit.
  commitShadowFinal00914_('shadow-preset-click-00914');
}

  function syncPresetButtons() {
  const isOuterActive = shadowsState.editTarget === 'outer';

  presetBtns.forEach((btn) => {
    const id = btn.getAttribute('data-sh-preset');
    const shouldBeActive = isOuterActive && id === shadowsState.outer.preset;
    btn.classList.toggle('is-active', shouldBeActive);
  });
}

  // 00914: у 00913 кнопки пресетів були намальовані, але не були підключені
  // до applyPresetToOuter(). Це не нова логіка: просто підключення існуючих
  // кнопок М'яка / Акцентна / Обводка / Світіння / Кастом до старого пресет-стану.
  presetBtns.forEach((btn) => {
    if (!(btn instanceof HTMLElement) || btn.dataset.shadowPresetBound00914 === '1') return;
    btn.dataset.shadowPresetBound00914 = '1';
    btn.addEventListener('click', (event) => {
      event.preventDefault?.();
      event.stopPropagation?.();
      const id = String(btn.getAttribute('data-sh-preset') || '').trim();
      if (!id) return;
      applyPresetToOuter(id);
    });
  });

  // --- ЧЕКБОКС "Немає зовнішньої тіні" --- //
  const outerNoneCheckbox = sectionEl.querySelector('[data-shadow-outer-none]');

  function syncOuterNoneCheckbox() {
    if (!outerNoneCheckbox) return;
    outerNoneCheckbox.checked = !!shadowsState.outerDisabled;
  }

  if (outerNoneCheckbox) {
    outerNoneCheckbox.addEventListener('change', () => {
      const disabled = outerNoneCheckbox.checked;
      if (disabled) {
        // Зберегти поточний стан outer, якщо ще не зберегли
        if (!shadowsState.lastOuterSnapshot) {
          shadowsState.lastOuterSnapshot = JSON.parse(
            JSON.stringify(shadowsState.outer)
          );
        }
        shadowsState.outerDisabled = true;
      } else {
        shadowsState.outerDisabled = false;
        // Відновити, якщо було що відновлювати
        if (shadowsState.lastOuterSnapshot) {
          shadowsState.outer = JSON.parse(
            JSON.stringify(shadowsState.lastOuterSnapshot)
          );
        }
      }
      syncGeometryControlsFromState();
      syncColorControlsFromState();
      syncPresetButtons();
      commitShadowFinal00914_('shadow-outer-none-change-00914');
    });
  }

  // --- ВНУТРІШНЯ ТІНЬ: кнопка + чекбокс --- //
  const innerToggleBtn = sectionEl.querySelector('[data-shadow-inner-toggle]');
  const innerNoneCheckbox = sectionEl.querySelector('[data-shadow-inner-none]');

  function syncInnerControls() {
    if (innerToggleBtn) {
      innerToggleBtn.classList.toggle(
        'is-active',
        shadowsState.inner.enabled && shadowsState.editTarget === 'inner'
      );
      innerToggleBtn.setAttribute(
        'aria-pressed',
        shadowsState.inner.enabled && shadowsState.editTarget === 'inner' ? 'true' : 'false'
      );
    }
    if (innerNoneCheckbox) {
      innerNoneCheckbox.checked = !shadowsState.inner.enabled;
    }
    if (editTargetLabelEl) {
      editTargetLabelEl.textContent =
        shadowsState.editTarget === 'inner' ? 'внутрішня' : 'зовнішня';
    }
  }

  function setInnerShadowEnabled00914_(enabled, reason) {
    const nextEnabled = !!enabled;
    shadowsState.inner.enabled = nextEnabled;
    shadowsState.editTarget = nextEnabled ? 'inner' : 'outer';

    syncInnerControls();
    syncGeometryControlsFromState();
    syncColorControlsFromState();
    syncPresetButtons();

    // Це дискретна дія: не live-повзунок, тому один final commit.
    commitShadowFinal00914_(reason || (nextEnabled ? 'shadow-inner-enable-00914' : 'shadow-inner-disable-00914'));
  }

  if (innerToggleBtn) {
    innerToggleBtn.addEventListener('click', (event) => {
      event.preventDefault?.();
      event.stopPropagation?.();
      // 00914: кнопка "Внутрішня тінь" саме вмикає inner і робить її активним шаром.
      // Вона більше не працює як тумблер outer/inner без зміни enabled.
      setInnerShadowEnabled00914_(true, 'shadow-inner-enable-click-00914');
    });
  }

  if (innerNoneCheckbox) {
    innerNoneCheckbox.addEventListener('change', () => {
      const noInner = !!innerNoneCheckbox.checked;
      setInnerShadowEnabled00914_(!noInner, noInner ? 'shadow-inner-none-change-00914' : 'shadow-inner-enable-from-none-change-00914');
    });
  }

  // --- ГЕОМЕТРІЯ (спільні повзунки) --- //
  const geomInputs = Array.from(
    sectionEl.querySelectorAll('[data-shadow-geom]')
  );

  function syncGeometryControlsFromState() {
    const target =
      shadowsState.editTarget === 'inner' ? shadowsState.inner : shadowsState.outer;

    geomInputs.forEach((inp) => {
      const key = inp.getAttribute('data-shadow-geom');
      if (!key) return;
      if (typeof target[key] === 'number') {
        inp.value = String(target[key]);
      }
    });

    if (editTargetLabelEl) {
      editTargetLabelEl.textContent =
        shadowsState.editTarget === 'inner' ? 'внутрішня' : 'зовнішня';
    }
  }

  geomInputs.forEach((inp) => {
    inp.addEventListener('input', () => {
      const key = inp.getAttribute('data-shadow-geom');
      if (!key) return;

      const num = Number(inp.value) || 0;
      const target =
        shadowsState.editTarget === 'inner' ? shadowsState.inner : shadowsState.outer;

      target[key] = num;
      target.preset = 'custom'; // як тільки рухаємо повзунок — preset = custom

      if (shadowsState.editTarget === 'outer') {
        syncPresetButtons();
      }

      scheduleShadowLiveApply00914_('shadow-geometry-input-00914');
    });
    inp.addEventListener('change', () => {
      commitShadowFinal00914_('shadow-geometry-change-00914');
    });
  });

  // --- КОЛЬОРИ та ПРОЗОРІСТЬ --- //
  const colorInputs = Array.from(
    sectionEl.querySelectorAll('[data-shadow-color]')
  );
  const opacityInputs = Array.from(
    sectionEl.querySelectorAll('[data-shadow-opacity]')
  );

  Array.from(sectionEl.querySelectorAll('[data-shadow-geom],[data-shadow-color],[data-shadow-opacity],[data-shadow-outer-none],[data-shadow-inner-none],[data-shadow-inner-toggle],[data-sh-preset],button[data-shadows="apply"]')).forEach((ctrl) => {
    ctrl.addEventListener('pointerdown', () => { beginShadowEditSession00914_('shadow-control-pointerdown-00914'); }, true);
    ctrl.addEventListener('focus', () => { beginShadowEditSession00914_('shadow-control-focus-00914'); }, true);
  });

  function syncColorControlsFromState() {
    colorInputs.forEach((inp) => {
      const where = inp.getAttribute('data-shadow-color'); // 'outer' | 'inner'
      if (where === 'outer') {
        inp.value = shadowsState.outer.color;
      } else if (where === 'inner') {
        inp.value = shadowsState.inner.color;
      }
    });

    opacityInputs.forEach((inp) => {
      const where = inp.getAttribute('data-shadow-opacity');
      if (where === 'outer') {
        inp.value = String(shadowsState.outer.opacity);
      } else if (where === 'inner') {
        inp.value = String(shadowsState.inner.opacity);
      }
    });
  }

  colorInputs.forEach((inp) => {
    inp.addEventListener('input', () => {
      const where = inp.getAttribute('data-shadow-color');
      const val = inp.value || '#000000';
      if (where === 'outer') {
        shadowsState.outer.color = val;
      } else if (where === 'inner') {
        shadowsState.inner.color = val;
      }
      scheduleShadowLiveApply00914_('shadow-color-input-00914');
    });
    inp.addEventListener('change', () => {
      commitShadowFinal00914_('shadow-color-change-00914');
    });
  });

  opacityInputs.forEach((inp) => {
    inp.addEventListener('input', () => {
      const where = inp.getAttribute('data-shadow-opacity');
      const num = Number(inp.value) || 0;
      const clamp = Math.max(0, Math.min(100, num));
      if (where === 'outer') {
        shadowsState.outer.opacity = clamp;
      } else if (where === 'inner') {
        shadowsState.inner.opacity = clamp;
      }
      scheduleShadowLiveApply00914_('shadow-opacity-input-00914');
    });
    inp.addEventListener('change', () => {
      commitShadowFinal00914_('shadow-opacity-change-00914');
    });
  });

  // --- АКОРДЕОНИ ПІД-РОЗДІЛІВ --- //
  const subsections = Array.from(
    sectionEl.querySelectorAll('.design-border-subsection')
  );
  let subState = loadShadowsSubsectionsState();
  const hasStored = subState && Object.keys(subState).length > 0;

  subsections.forEach((sub, index) => {
    const existingId = sub.getAttribute('data-shadows-subsection-id');
    const id = existingId || 'sh-' + (index + 1);
    sub.setAttribute('data-shadows-subsection-id', id);

    let isOpen;
    if (hasStored && Object.prototype.hasOwnProperty.call(subState, id)) {
      isOpen = !!subState[id];
    } else {
      isOpen = id === 'mode';
    }

    const header = sub.querySelector('.design-border-subheader');
    const body = sub.querySelector('.design-border-subbody');
    const chevron = sub.querySelector('.design-border-subheader-chevron');

    function applyOpenState(open) {
      sub.classList.toggle('is-open', open);
      if (body) body.hidden = !open;
      if (chevron) chevron.textContent = open ? '▼' : '▶';
    }

    applyOpenState(isOpen);

    if (header && !header.dataset.shadowsSubBound) {
      header.dataset.shadowsSubBound = '1';
      header.addEventListener('click', () => {
        const currentlyOpen = sub.classList.contains('is-open');
        const nextState = !currentlyOpen;
        applyOpenState(nextState);

        subState = subState || {};
        subState[id] = nextState;
        saveShadowsSubsectionsState(subState);
      });
    }
  });

  // --- ЗАСТОСУВАННЯ ТІНЕЙ ДО ТАРГЕТІВ --- //
  function applyShadowsToTargets(opts = {}) {
    const live = opts?.live === true;
    const targets = readShadowTargets00914_(opts?.useSessionTargets === true);
    if (!targets.length) {
      shLog('applyShadowsToTargets: немає таргетів');
      if (opts?.endSession === true) endShadowEditSession00914_();
      return;
    }

    const o = shadowsState.outer;
    const i = shadowsState.inner;

    const hasOuter = o.enabled && !shadowsState.outerDisabled;
    const hasInner = i.enabled;

    const outerOpacity01 = Math.max(0, Math.min(100, o.opacity)) / 100;
    const innerOpacity01 = Math.max(0, Math.min(100, i.opacity)) / 100;

    const parts = [];

    if (hasOuter) {
      const outerColor = hexToRgba(o.color, outerOpacity01);
      parts.push(
        `${o.offsetX}px ${o.offsetY}px ${o.blur}px ${o.spread}px ${outerColor}`
      );
    }

    if (hasInner) {
      const innerColor = hexToRgba(i.color, innerOpacity01);
      parts.push(
        `inset ${i.offsetX}px ${i.offsetY}px ${i.blur}px ${i.spread}px ${innerColor}`
      );
    }

    const boxShadowValue = parts.join(', ') || 'none';

    targets.forEach((el, idx) => {
      if (!(el instanceof HTMLElement)) return;
      // [00382][MENU SHADOW TARGET]
      // Якщо вибраний сам блок меню — тінь застосовується до контейнера меню,
      // а не до кнопок. Кнопки/пункти меню залишаються під керуванням віджета "Меню".
      if (el.matches('[data-st-menu="1"]')) {
        el.style.boxShadow = boxShadowValue;
        el.style.setProperty('--st-menu-root-shadow', boxShadowValue);
        syncSelectionAuthoredShadow00914_(el, boxShadowValue);
        shLog('applyShadowsToTargets (menu block) →', idx, el, 'box-shadow =', boxShadowValue);
        return;
      }

      // Якщо користувач явно вибрав пункт меню — лишаємо можливість тінити саме пункт.
      if (el.matches('[data-st-menu-item="1"]')) {
        el.style.setProperty('--st-menu-item-shadow', boxShadowValue);
        syncSelectionAuthoredShadow00914_(el, boxShadowValue);
        shLog('applyShadowsToTargets (menu item) →', idx, el, 'var =', boxShadowValue);
        return;
      }

      // PNG inner target: outer shadow should follow the real PNG alpha, not the whole block rectangle.
      if (el.matches('.st-block--png > .st-png__media, .st-png__media')) {
        const img = el.querySelector(':scope > .st-png__img');
        if (img instanceof HTMLElement) {
          const drop = hasOuter
            ? `drop-shadow(${o.offsetX}px ${o.offsetY}px ${o.blur}px ${hexToRgba(o.color, outerOpacity01)})`
            : 'none';
          img.style.filter = drop;
          img.style.webkitFilter = drop;
        }
        // Keep inner-shadow / background shadows on the media itself only when really enabled.
        el.style.boxShadow = hasInner
          ? `inset ${i.offsetX}px ${i.offsetY}px ${i.blur}px ${i.spread}px ${hexToRgba(i.color, innerOpacity01)}`
          : 'none';
        syncSelectionAuthoredShadow00914_(el, boxShadowValue);
        if (img instanceof HTMLElement) syncSelectionAuthoredShadow00914_(img, boxShadowValue);
        shLog('applyShadowsToTargets (png-media) →', idx, el, 'filter =', (img && img.style.filter) || 'none', 'box-shadow =', el.style.boxShadow || 'none');
        return;
      }

      el.style.boxShadow = boxShadowValue;
      syncSelectionAuthoredShadow00914_(el, boxShadowValue);
      shLog('applyShadowsToTargets →', idx, el, 'box-shadow =', boxShadowValue);
    });

    dispatchShadowApplied00914_(targets, boxShadowValue, {
      live,
      reason: opts?.reason || (live ? 'shadow-live-00914' : 'shadow-apply-00914'),
    });

    if (opts?.endSession === true) endShadowEditSession00914_();
  }

  // --- Кнопка "Застосувати" --- //
  const applyBtn = sectionEl.querySelector('button[data-shadows="apply"]');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      shLog('Клік по "Застосувати тіні"');
      commitShadowFinal00914_('shadow-apply-button-00914');
    });
  }

  // Вставити секцію в панель
  host.appendChild(sectionEl);

  // Початковий sync UI
  syncPresetButtons();
  syncOuterNoneCheckbox();
  syncInnerControls();
  syncGeometryControlsFromState();
  syncColorControlsFromState();
  updateTargetsSummary();

  // --- Спостерігаємо за зміною класів виділення --- //
  const siteRoot = document.getElementById('site-root');
  if (siteRoot) {
    const mo = new MutationObserver((mutations) => {
      let need = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const t = m.target;
          if (
            t instanceof HTMLElement &&
            (t.classList.contains('is-active') ||
              t.classList.contains('is-selected'))
          ) {
            need = true;
            break;
          }
        }
      }
      if (need) {
        setTimeout(() => {
          updateTargetsSummary();
        }, 0);
      }
    });

    mo.observe(siteRoot, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class'],
      childList: true
    });
  }
}
