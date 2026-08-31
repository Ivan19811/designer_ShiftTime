// js/design/widgets/page-tree/page-tree-widget.js
// Віджет "Дерево сторінки" для панелі "Дизайн" (правий сайтбар).

import { initPageTreePanel } from '../../../panel-page-tree.js';

/**
 * Ініціалізує секцію "Дерево сторінки" в панелі "Дизайн".
 *
 * @param {HTMLElement} host         Контейнер всередині #design-panel-root
 * @param {Function}    getSelection Функція з panel-design.js (поки не використовуємо,
 *                                   але залишаємо для майбутніх допрацювань).
 */
export function initPageTreeWidget(host, getSelection) {
  if (!host) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section is-open design-section--page-tree';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button" data-page-tree-help-anchor>
      <div class="design-section__header-title">
        <span>Дерево</span>
      </div>
      <span class="design-section__chevron">▶</span>
      <div class="design-page-tree__help-popover" role="tooltip">
        <div class="design-page-tree__help-kicker">Структура сайту</div>
        <div class="design-page-tree__help-title">Як користуватись деревом</div>
        <div class="design-page-tree__help-text">
          <b>Один клік</b> по елементу дерева виділяє його в дереві та підсвічує відповідний елемент на сайті.
          Контейнер підсвічується зеленим, блок — синім, іконка — голубим, текстове поле — жовтою штриховою рамкою.
          <br><br>
          <b>Подвійний клік</b> по елементу відкриває або згортає його дочірні елементи.
          Кнопка-стрілка праворуч також відкриває/згортає вузол.
          <br><br>
          <b>Ctrl + клік</b> поки залишено для сумісності з мультивибором у старому дереві.
          Дерево завжди показане — окремої кнопки “Показати / сховати” більше немає.
        </div>
      </div>
    </button>

    <div class="design-section__body">
      <div class="design-field" id="page-tree-wrap">
        <div id="page-tree-root"></div>
      </div>
    </div>

    <div class="design-section__resizer" data-tree-resizer title="Потягни, щоб змінити висоту"></div>
  `;

  // Акордеон: хедер відкриває/закриває секцію
  const headerBtn = sectionEl.querySelector('.design-section__header');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });
  }

  // Додаємо секцію до панелі "Дизайн"
  host.appendChild(sectionEl);

  // Ресайз висоти віджета "Дерево" (тягнемо мишкою вниз)
  initPageTreeResizer_(sectionEl);

  // Після того як DOM-елементи з id="toggle-page-tree", "page-tree-wrap", "page-tree-root"
  // реально є в документі — ініціалізуємо основну логіку дерева.
  initPageTreePanel();
}

// --- internal: resizable height for page-tree widget ---
function initPageTreeResizer_(sectionEl) {
  const body = sectionEl?.querySelector('.design-section__body');
  const handle = sectionEl?.querySelector('[data-tree-resizer]');
  if (!body || !handle) return;

  const LS_KEY = 'st_design_page_tree_height_v1';
  const MIN_H = 160;
  const MAX_PAD = 120; // запас під інші секції панелі

  // apply saved height
  try {
    const saved = parseInt(localStorage.getItem(LS_KEY) || '', 10);
    if (Number.isFinite(saved) && saved >= MIN_H) {
      body.style.height = saved + 'px';
    }
  } catch (_) {}

  let dragging = false;
  let startY = 0;
  let startH = 0;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const onMove = (ev) => {
    if (!dragging) return;

    const hostRect = sectionEl.parentElement?.getBoundingClientRect?.();
    const maxH = hostRect ? Math.max(MIN_H, Math.floor(hostRect.height - MAX_PAD)) : 800;

    const dy = ev.clientY - startY;
    const next = clamp(Math.round(startH + dy), MIN_H, maxH);

    body.style.height = next + 'px';
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('is-resizing-tree');
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);

    try {
      const h = Math.round(body.getBoundingClientRect().height || 0);
      if (h > 0) localStorage.setItem(LS_KEY, String(h));
    } catch (_) {}
  };

  handle.addEventListener('pointerdown', (ev) => {
    // якщо секція згорнута — не ресайзимо
    if (!sectionEl.classList.contains('is-open')) return;

    dragging = true;
    startY = ev.clientY;
    startH = body.getBoundingClientRect().height || 0;

    document.body.classList.add('is-resizing-tree');
    handle.setPointerCapture?.(ev.pointerId);

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);

    ev.preventDefault?.();
  });
}