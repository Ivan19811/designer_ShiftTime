// js/design/design-mode-bar.js
// Глобальна панель режимів вибору.
// 00239: multi-toggle режим: Нічого / Секції / Рівні / Контейнери / Блоки.
// - "Нічого" очищає всі режими.
// - Інші кнопки вмикаються/вимикаються незалежно одна від одної.
// - Подія лишається сумісною: detail.mode для старого коду + detail.modes для нового.

export function initDesignModeBar() {
  const bar = document.querySelector('[data-design-mode-bar]');
  if (!bar) return;

  const buttons = Array.from(bar.querySelectorAll('[data-design-mode]'));
  if (!buttons.length) return;

  const modeOrder = ['sections', 'levels', 'containers', 'blocks', 'headings', 'texts', 'icons'];
  const labels = {
    none: 'Нічого',
    sections: 'Секції',
    levels: 'Рівні',
    containers: 'Контейнери',
    blocks: 'Блоки',
    headings: 'Заголовок',
    texts: 'Текст',
    icons: 'Іконка'
  };

  const selected = new Set();

  function canonicalModes() {
    return modeOrder.filter((mode) => selected.has(mode));
  }

  function updateButtons() {
    const activeModes = canonicalModes();
    const isNone = activeModes.length === 0;

    buttons.forEach((btn) => {
      const btnMode = btn.getAttribute('data-design-mode');
      const active = btnMode === 'none' ? isNone : selected.has(btnMode);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // 00244: expose selection-mode classes for canvas hover rules.
    // This lets us avoid unwanted nested block hover frames in header containers unless
    // the user intentionally enables the "Блоки" mode.
    try {
      const root = document.documentElement;
      ['sections', 'levels', 'containers', 'blocks', 'headings', 'texts', 'icons'].forEach((mode) => {
        root.classList.toggle('st-design-select-' + mode, selected.has(mode));
      });
      root.classList.toggle('st-design-select-none', isNone);
    } catch (_) {}
  }

  function dispatchModeChange() {
    const modes = canonicalModes();
    const mode = modes.length === 0 ? 'none' : (modes.length === 1 ? modes[0] : 'multi');
    const label = modes.length === 0 ? labels.none : modes.map((m) => labels[m] || m).join(' + ');

    updateButtons();

    try {
      const evt = new CustomEvent('st:designSelectionModeChange', {
        detail: { mode, modes, label }
      });
      window.dispatchEvent(evt);
    } catch (err) {
      console.warn('[design-mode-bar] Cannot dispatch event', err);
    }
  }

  bar.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-design-mode]');
    if (!btn || !bar.contains(btn)) return;
    const mode = btn.getAttribute('data-design-mode');
    if (!mode) return;

    if (mode === 'none') {
      selected.clear();
      dispatchModeChange();
      try { window.dispatchEvent(new CustomEvent('st:clearPageTreeSelection', { detail: { source: 'design-mode-none' } })); } catch (_) {}
      return;
    }

    if (selected.has(mode)) selected.delete(mode);
    else selected.add(mode);

    dispatchModeChange();
  });

  // режим за замовчуванням — "Нічого"
  selected.clear();
  dispatchModeChange();
}
