// js/design/widgets/page-tree/page-tree-widget-01021.js
// Віджет "Дерево сторінки" для панелі "Дизайн" (правий сайтбар).

import { initPageTreePanel } from '../../../panel-page-tree-01021.js?v=01021';

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
          <b>Один клік у Дереві</b> переносить одиночний фокус на цей елемент і підсвічує його на сайті.
          <b>Один клік на сайті</b> переносить одиночний фокус у відповідний пункт Дерева лише тоді, коли акордеон Дерево відкритий і активний. Якщо Дерево закрите або ти працюєш в іншому акордеоні — воно не втручається.
          <br><br>
          Кольори ті самі, що у верхньому селекторі інспектора: секція — синя, рівень — жовтий, контейнер — зелений, блок — голубий, заголовок — помаранчевий, текст — жовта штрихова рамка, іконка — темно-синя штрихова.
          <br><br>
          Якщо зверху ввімкнути, наприклад, <b>Контейнери</b>, усі контейнери підсвітяться одночасно і на сайті, і в активному Дереві. Це групове підсвічування <b>не переносить одиночний фокус</b>.
          <br><br>
          <b>Подвійний клік</b> по елементу відкриває або згортає його дочірні елементи. Кнопка-стрілка праворуч робить те саме.
          <br><br>
          Якщо Дерево нижче за свій вміст, наведи на нього мишку і <b>крути колесо</b> — прокручується тільки список Дерева. Коли всі елементи поміщаються, скрол автоматично зникає.
          <br><br>
          <b>Ctrl + клік</b> залишено для сумісності з мультивибором.
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
      const opened = sectionEl.classList.contains('is-open');
      sectionEl.dataset.treeFocusActive01021 = opened ? '1' : '0';
      sectionEl.classList.toggle('is-tree-focus-active-01021', opened);
      try { window.dispatchEvent(new CustomEvent('st:pageTreeFocusActive01021', { detail: { active: opened } })); } catch (_) {}
    });
  }

  // Додаємо секцію до панелі "Дизайн"
  host.appendChild(sectionEl);

  // Ресайз висоти віджета "Дерево" (тягнемо мишкою вниз)
  initPageTreeResizer_(sectionEl);

  // Після того як DOM-елементи з id="toggle-page-tree", "page-tree-wrap", "page-tree-root"
  // реально є в документі — ініціалізуємо основну логіку дерева.
  initPageTreePanel();
  initPageTreeWheelScroll01021_(sectionEl);
}

// --- internal: resizable height for page-tree widget ---
function initPageTreeResizer_(sectionEl) {
  const body = sectionEl?.querySelector('.design-section__body');
  const handle = sectionEl?.querySelector('[data-tree-resizer]');
  if (!body || !handle) return;

  const LS_KEY = 'st_design_page_tree_height_v1';
  const MIN_H = 160;
  const MAX_PAD = 28; // 01020: allow the tree body to reach the visible bottom of the inspector

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

    const inspector = sectionEl.closest?.('.builder__settings-panel, .builder__settings, #design-panel-root') || sectionEl.parentElement;
    const inspectorRect = inspector?.getBoundingClientRect?.();
    const bodyRect = body.getBoundingClientRect();
    const viewportBottom = inspectorRect ? Math.min(window.innerHeight - 16, inspectorRect.bottom - 12) : (window.innerHeight - 20);
    const maxH = Math.max(MIN_H, Math.floor(viewportBottom - bodyRect.top - MAX_PAD));

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

// 01020 — wheel belongs to the tree while the pointer is over the tree list.
// If the list fits completely, overflow:auto naturally removes the scrollbar and
// this handler does not consume the wheel event.
function initPageTreeWheelScroll01021_(sectionEl) {
  const wrap = sectionEl?.querySelector?.('#page-tree-wrap');
  if (!wrap || wrap.dataset.stTreeWheel01021 === '1') return;
  wrap.dataset.stTreeWheel01021 = '1';

  wrap.addEventListener('wheel', (ev) => {
    if (!sectionEl.classList.contains('is-open')) return;
    sectionEl.dataset.treeFocusActive01021 = '1';
    sectionEl.classList.add('is-tree-focus-active-01021');
    try { window.dispatchEvent(new CustomEvent('st:pageTreeFocusActive01021', { detail: { active: true } })); } catch (_) {}
    const maxScroll = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
    if (maxScroll <= 1) return;

    const dy = Number(ev.deltaY || 0);
    if (!Number.isFinite(dy) || dy === 0) return;

    const before = wrap.scrollTop;
    const next = Math.max(0, Math.min(maxScroll, before + dy));
    wrap.scrollTop = next;

    // Keep the inspector itself stationary while the user is browsing the tree.
    ev.preventDefault();
    ev.stopPropagation();
  }, { passive: false });
}
