// js/builder-preview.js
// Preview mode (full screen) for ShiftTime Builder
// - Click #builder-preview-btn -> enter preview
// - ESC -> exit preview
// - Uses CSS class on #builder-root: .builder--preview

export function initBuilderPreview() {
  const root = document.getElementById('builder-root');
  const btn  = document.getElementById('builder-preview-btn');

  if (!root || !btn) {
    console.warn('[builder-preview] root or #builder-preview-btn not found');
    return;
  }

  // guard: init once
  if (window.__stPreviewInited) return;
  window.__stPreviewInited = true;

  // збереження станів
  let prevScrollTop = 0;
  let wasFullscreen = false;

  function isPreview() {
    return root.classList.contains('builder--preview');
  }

  async function requestFs() {
    // Fullscreen API може бути заблокований браузером — робимо safely
    try {
      if (document.fullscreenElement) return true;
      // найкраще просити fullscreen у root, бо він містить canvas
      await root.requestFullscreen?.();
      return !!document.fullscreenElement;
    } catch {
      return false;
    }
  }

  async function exitFs() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
    } catch {}
  }

  async function enterPreview() {
    if (isPreview()) return;

    const canvasScroll = document.querySelector('.canvas__scroll');
    prevScrollTop = canvasScroll ? canvasScroll.scrollTop : 0;

    root.classList.add('builder--preview');

    // Спробуємо ще й fullscreen (якщо браузер дозволяє)
    wasFullscreen = await requestFs();

    // UX: кнопка стає "Вийти з перегляду"
    btn.textContent = 'Вийти з перегляду';
    btn.setAttribute('aria-pressed', 'true');
  }

  async function exitPreview() {
    if (!isPreview()) return;

    root.classList.remove('builder--preview');

    if (wasFullscreen) {
      await exitFs();
      wasFullscreen = false;
    }

    // повертаємо скрол як було
    const canvasScroll = document.querySelector('.canvas__scroll');
    if (canvasScroll) canvasScroll.scrollTop = prevScrollTop;

    btn.textContent = 'Попередній перегляд';
    btn.setAttribute('aria-pressed', 'false');
  }

  // Click
  btn.addEventListener('click', () => {
    if (isPreview()) exitPreview();
    else enterPreview();
  });

  // ESC
  document.addEventListener('keydown', (e) => {
   if (e.key === 'Escape') {
  // 1) якщо preview — вийти
  if (isPreview()) {
    e.preventDefault();
    exitPreview();
  }

  // 2) якщо шапка була схована — показати (як ти просив)
  if (window.ST_SHOW_BUILDER_HEADER) {
    window.ST_SHOW_BUILDER_HEADER();
  }
}




  });

  // Якщо користувач вийшов з fullscreen через браузер (F11/кнопка) — синхронізуємо режим
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isPreview()) {
      // якщо fullscreen вимкнувся, preview режим лишається (CSS), але можна залишити як є
      // або автоматом виходити з preview:
      // exitPreview();
    }
  });
}
