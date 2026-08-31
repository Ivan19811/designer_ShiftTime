// js/design/widgets/border-widget/lines/lines-widget.js
// Підвіджет "Рамка": режим, пресети та сторони. Дає onChange + API setStateFromHost.

export function initBorderLinesWidget(host, options = {}) {
  if (!host) return;

  const { onChange, onSelectionChange } = options;

  const state = {
    mode: 'none',      // 'none' | 'on'
    preset: 'none',    // 'none' | 'thin' | 'medium' | 'thick' | 'mixed' | 'custom'
    sides: { top: true, right: true, bottom: true, left: true }
  };

  host.innerHTML = `
    <div class="design-field">
      <div class="design-field__label">Режим рамки</div>
      <div class="design-border-mode-row" data-border-line-modes>
        <label class="design-border-flag">
          <input
            type="radio"
            name="borderLineMode"
            value="none"
            data-border-line-mode="none"
            checked
          />
          <span>Немає рамки</span>
        </label>
        <label class="design-border-flag">
          <input
            type="radio"
            name="borderLineMode"
            value="on"
            data-border-line-mode="on"
          />
          <span>Є рамка</span>
        </label>
      </div>
      <p class="design-subnote">
        Коли рамка вимкнена — інші налаштування ігноруються.
      </p>
    </div>

   <div class="design-field" data-border-line-section="presets">
  <div class="design-field__label">Товщина</div>
  <div class="design-border-presets-row" data-border-line-presets>
    <button type="button" class="design-pill" data-border-line-preset="thin">
      Тонка
    </button>
    <button type="button" class="design-pill" data-border-line-preset="medium">
      Середня
    </button>
    <button type="button" class="design-pill" data-border-line-preset="thick">
      Товста
    </button>
    <!-- 🔹 індикатор змішаних значень -->
    <button
      type="button"
      class="design-pill design-pill--ghost"
      data-border-line-preset="mixed"
    >
      Мішані
    </button>
    <button type="button" class="design-pill" data-border-line-preset="custom">
      Власна
    </button>
  </div>
</div>

    <div class="design-field" data-border-line-section="sides">
      <div class="design-field__label">Сторони рамки</div>
      <div class="design-border-side-picker" data-border-side-picker role="group" aria-label="Вибір сторін рамки">
        <div class="design-border-side-picker__surface" aria-hidden="true">
          <span class="design-border-side-picker__hint">Натисніть на лінії</span>
        </div>
        <button type="button" class="design-border-side-edge design-border-side-edge--top" data-border-side="top" aria-label="Верхня сторона" aria-pressed="true"></button>
        <button type="button" class="design-border-side-edge design-border-side-edge--right" data-border-side="right" aria-label="Права сторона" aria-pressed="true"></button>
        <button type="button" class="design-border-side-edge design-border-side-edge--bottom" data-border-side="bottom" aria-label="Нижня сторона" aria-pressed="true"></button>
        <button type="button" class="design-border-side-edge design-border-side-edge--left" data-border-side="left" aria-label="Ліва сторона" aria-pressed="true"></button>
      </div>
      <div class="design-border-side-summary" data-border-side-summary>Усі сторони</div>
    </div>
  `;

  // ---- допоміжні ----

  function normalizeSides(value) {
    if (value && typeof value === 'object') {
      return {
        top: value.top === true,
        right: value.right === true,
        bottom: value.bottom === true,
        left: value.left === true
      };
    }
    const legacy = String(value || 'all');
    return {
      top: legacy === 'all' || legacy === 'top' || legacy === 'tb',
      right: legacy === 'all' || legacy === 'right' || legacy === 'lr',
      bottom: legacy === 'all' || legacy === 'bottom' || legacy === 'tb',
      left: legacy === 'all' || legacy === 'left' || legacy === 'lr'
    };
  }

  function sideSummary(sides) {
    const labels = [];
    if (sides.top) labels.push('верх');
    if (sides.right) labels.push('право');
    if (sides.bottom) labels.push('низ');
    if (sides.left) labels.push('ліво');
    if (labels.length === 4) return 'Усі сторони';
    if (!labels.length) return 'Жодної сторони';
    return `Обрано: ${labels.join(' + ')}`;
  }

  function logState() {
    // [00439] debug disabled: console logging on every UI sync caused main-thread stalls.
  }

  function emitChange() {
    if (typeof onChange === 'function') {
      const payload = { ...state };
      // [00439] debug disabled
      onChange(payload);
    } else {
      // [00439] debug disabled
    }
  }

  function emitSelectionChange() {
    if (typeof onSelectionChange === 'function') {
      onSelectionChange({
        sides: normalizeSides(state.sides),
        selectionOnly: true
      });
    }
  }

  function refreshUI() {
    const presetsSection = host.querySelector('[data-border-line-section="presets"]');
    const sidesSection = host.querySelector('[data-border-line-section="sides"]');
    const disabled = state.mode === 'none';

    if (presetsSection) {
      presetsSection.classList.toggle('is-disabled', disabled);
    }
    if (sidesSection) {
      sidesSection.classList.toggle('is-disabled', disabled);
    }

    // Режим рамки (радіо)
    const modeInputs = host.querySelectorAll('[data-border-line-mode]');
    modeInputs.forEach((input) => {
      const val = input.getAttribute('data-border-line-mode') || 'none';
      input.checked = state.mode === val;
    });

    // Підсвічуємо активний пресет
    const presetBtns = host.querySelectorAll('[data-border-line-preset]');
    presetBtns.forEach((btn) => {
      const val = btn.getAttribute('data-border-line-preset');
      btn.classList.toggle('is-active', !disabled && state.preset === val);
    });

    // Підсвічуємо активні сторони
    const sideBtns = host.querySelectorAll('[data-border-side]');
    sideBtns.forEach((btn) => {
      const side = btn.getAttribute('data-border-side');
      const active = !disabled && state.sides?.[side] === true;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const sideSummaryEl = host.querySelector('[data-border-side-summary]');
    if (sideSummaryEl) sideSummaryEl.textContent = sideSummary(normalizeSides(state.sides));
  }

  // ---- події ----

  // Режим рамки
   const modeInputs = host.querySelectorAll('[data-border-line-mode]');
  modeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      const mode = input.getAttribute('data-border-line-mode') || 'none';
      state.mode = mode;

      // ❗ Якщо включили "Є рамка", а пресет ще не вибраний — ставимо "Середня"
      if (mode === 'on' && state.preset === 'none') {
        state.preset = 'medium';
      }

      refreshUI();
      logState();
      emitChange();
    });
  });


  // Пресети
 const presetBtns = host.querySelectorAll('[data-border-line-preset]');
presetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.mode === 'none') return;

    const val = btn.getAttribute('data-border-line-preset') || 'none';

    // 🔹 Кнопка "Мішані" — тільки індикатор, клік ігноруємо
    if (val === 'mixed') {
      return;
    }

    state.preset = val;
    refreshUI();
    logState();
    emitChange();
  });
});


  // Сторони
  const sideBtns = host.querySelectorAll('[data-border-side]');
  sideBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.mode === 'none') return;
      const side = btn.getAttribute('data-border-side');
      if (!side) return;
      const nextSides = normalizeSides(state.sides);
      nextSides[side] = !nextSides[side];
      state.sides = nextSides;
      refreshUI();
      logState();
      // 00917: клік по ребру змінює лише область дії. Він не повинен
      // переписувати або обнуляти вже оформлені сторони елемента.
      emitSelectionChange();
    });
  });

  // ---- API для головного віджета (синхронізація зі стилями елемента) ----

  function setStateFromHost(next) {
    if (!next) return;

    if (typeof next.mode === 'string') {
      state.mode = next.mode;
    }
    if (typeof next.preset === 'string') {
      state.preset = next.preset;
    }
    if (typeof next.sides === 'string' || (next.sides && typeof next.sides === 'object')) {
      state.sides = normalizeSides(next.sides);
    }

    refreshUI();
    logState();
    // emitChange тут НЕ викликаємо, щоб не було циклу
  }

  // первинне оновлення
  refreshUI();
  logState();
  emitChange();

  return {
    setStateFromHost
  };
}
