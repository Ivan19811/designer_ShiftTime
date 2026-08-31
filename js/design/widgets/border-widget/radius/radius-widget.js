// js/design/widgets/border-widget/radius/radius-widget.js
// 00911: підвіджет не застосовує кути на toggle; live-preview іде тільки під час зміни значення.
// Підвіджет "Радіуси": повзунок + 4 кути + прості пресети. Працює з масивом елементів через onChange.

export function initBorderRadiusWidget(host, options = {}) {
  if (!host) return;

  const { onChange, onInteractionStart, onInteractionEnd } = options;

  const state = {
    radius: 18, // px
    corners: {
      tl: true,
      tr: true,
      br: true,
      bl: true
    },
      // 'none' | 'soft' | 'card' | 'pill' | 'custom'
    preset: 'custom'
  };

  host.innerHTML = `
    <div class="design-field">
      <div class="design-field__label">Скруглення кутів</div>

      <div class="design-radius-main-row" data-radius-main>
        <input
          type="range"
          min="0"
          max="72"
          step="1"
          value="18"
          data-radius-slider
        />
        <div class="design-range-value">
          <input
            type="number"
            min="0"
            max="999"
            step="1"
            value="18"
            data-radius-input
          />
          <span>px</span>
        </div>
      </div>

      <p class="design-subnote">
        Повзунок змінює скруглення для вибраних кутів. За замовчуванням — усі 4.
      </p>
    </div>

    <div class="design-field">
  <div class="design-field__label">Кути</div>

  <div class="design-radius-corners-grid" data-radius-corners>
    <!-- Верхній ряд: верхні кути -->
    <div class="design-radius-row">
      <button
        type="button"
        class="design-pill is-active"
        data-radius-corner="tl"
        title="Верхній лівий"
      >
        ▢
      </button>
      <button
        type="button"
        class="design-pill is-active"
        data-radius-corner="tr"
        title="Верхній правий"
      >
        ▢
      </button>
    </div>

    <!-- Нижній ряд: нижні кути -->
    <div class="design-radius-row">
      <button
        type="button"
        class="design-pill is-active"
        data-radius-corner="bl"
        title="Нижній лівий"
      >
        ▢
      </button>
      <button
        type="button"
        class="design-pill is-active"
        data-radius-corner="br"
        title="Нижній правий"
      >
        ▢
      </button>
    </div>
  </div>

  <p class="design-subnote">
    Натисни, щоб ввімкнути / вимкнути кут. Якщо всі вимкнені — увімкнемо знову всі.
  </p>
</div>








    <div class="design-field">
      <div class="design-field__label">Пресети кутів</div>
      <div class="design-border-presets-row" data-radius-presets>
        <button type="button" class="design-pill" data-radius-preset="none">
          Без скруглення
        </button>
        <button type="button" class="design-pill" data-radius-preset="soft">
          М'які
        </button>
        <button type="button" class="design-pill" data-radius-preset="card">
          Карта / картка
        </button>
        <button type="button" class="design-pill" data-radius-preset="pill">
          Pill / капсула
        </button>
      </div>
    </div>
  `;

  const slider = host.querySelector('[data-radius-slider]');
  const input = host.querySelector('[data-radius-input]');
  const cornerBtns = Array.from(host.querySelectorAll('[data-radius-corner]'));
  const presetBtns = Array.from(host.querySelectorAll('[data-radius-preset]'));

  function emitChange(meta = {}) {
    if (typeof onChange === 'function') {
      const payload = {
        radius: state.radius,
        corners: { ...state.corners },
        preset: state.preset,
        live: meta.live === true,
        commit: meta.commit === true,
        reason: meta.reason || 'radius-change'
      };
      onChange(payload);
    }
  }

  function startInteraction(reason = 'radius-interaction') {
    if (typeof onInteractionStart === 'function') {
      onInteractionStart({ reason, radius: state.radius, corners: { ...state.corners }, preset: state.preset });
    }
  }

  function endInteraction(reason = 'radius-interaction-end') {
    if (typeof onInteractionEnd === 'function') {
      onInteractionEnd({ reason, radius: state.radius, corners: { ...state.corners }, preset: state.preset });
    }
  }

  function refreshUI() {
    if (slider) {
      slider.value = String(state.radius);
    }
    if (input) {
      input.value = String(state.radius);
    }

    cornerBtns.forEach((btn) => {
      const key = btn.getAttribute('data-radius-corner');
      if (!key) return;
      const active = !!state.corners[key];
      btn.classList.toggle('is-active', active);
    });

    presetBtns.forEach((btn) => {
      const val = btn.getAttribute('data-radius-preset') || 'custom';
      btn.classList.toggle('is-active', state.preset === val);
    });
  }

  function setRadius(nextRadius, meta = {}) {
    const n = Number(nextRadius);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(0, Math.min(999, Math.round(n)));
    state.radius = clamped;
    // при зміні manual скидаємо пресет
    if (state.preset !== 'custom') {
      state.preset = 'custom';
    }
    refreshUI();
    emitChange(meta);
  }

  // --- обробники ---

  if (slider) {
    slider.addEventListener('pointerdown', () => startInteraction('radius-slider-pointerdown'), true);
    slider.addEventListener('focus', () => startInteraction('radius-slider-focus'), true);
    slider.addEventListener('input', () => {
      setRadius(slider.value, { live: true, reason: 'radius-slider-input-00911' });
    });
    slider.addEventListener('change', () => {
      setRadius(slider.value, { live: false, commit: true, reason: 'radius-slider-change-00911' });
      endInteraction('radius-slider-change-00911');
    });
  }

  if (input) {
    input.addEventListener('pointerdown', () => startInteraction('radius-input-pointerdown'), true);
    input.addEventListener('focus', () => startInteraction('radius-input-focus'), true);
    input.addEventListener('change', () => {
      setRadius(input.value, { live: false, commit: true, reason: 'radius-input-change-00911' });
      endInteraction('radius-input-change-00911');
    });
  }

  cornerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-radius-corner');
      if (!key) return;
      const current = !!state.corners[key];
      state.corners[key] = !current;

      // якщо всі кути вимкнені — вмикаємо знову всі
      const anyOn =
        state.corners.tl ||
        state.corners.tr ||
        state.corners.br ||
        state.corners.bl;

      if (!anyOn) {
        state.corners.tl = true;
        state.corners.tr = true;
        state.corners.br = true;
        state.corners.bl = true;
      }

      refreshUI();
      // 00911: перемикання кутів тільки змінює маску майбутньої дії.
      // Новообраний кут не отримує поточний radius автоматично;
      // стиль застосовується тільки після руху повзунка / введення числа.
    });
  });

  // Пресети
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-radius-preset') || 'custom';

      let nextRadius = state.radius;

      if (val === 'none') {
        nextRadius = 0;
      } else if (val === 'soft') {
        nextRadius = 8;
      } else if (val === 'card') {
        nextRadius = 18;
      } else if (val === 'pill') {
        nextRadius = 999;
      }

      state.preset = val;
      state.corners.tl = true;
      state.corners.tr = true;
      state.corners.br = true;
      state.corners.bl = true;
      state.radius = nextRadius;

      refreshUI();
      emitChange({ live: false, commit: true, reason: 'radius-preset-click-00911' });
    });
  });

  // API для синхронізації зі сторони host (border-widget)
  function setStateFromHost(next) {
    if (!next || typeof next !== 'object') return;

    if (typeof next.radius === 'number' && Number.isFinite(next.radius)) {
      state.radius = Math.max(0, Math.min(999, Math.round(next.radius)));
    }

    if (next.corners && typeof next.corners === 'object') {
      state.corners = {
        tl: !!next.corners.tl,
        tr: !!next.corners.tr,
        br: !!next.corners.br,
        bl: !!next.corners.bl
      };
    }

    if (typeof next.preset === 'string') {
      state.preset = next.preset;
    } else {
      state.preset = 'custom';
    }

    refreshUI();
    // emitChange тут не викликаємо, щоб не ловити циклів
  }

  // первинне оновлення тільки UI, без застосування до сайту
  refreshUI();

  return {
    setStateFromHost
  };
}
