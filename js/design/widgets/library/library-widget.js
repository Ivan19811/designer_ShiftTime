// js/design/widgets/library/library-widget.js
// Віджет "Бібліотека" у панелі "Дизайн" — максимально простий MVP:
// - акордеон як інші віджети
// - кнопка "Відкрити бібліотеку" → показує модалку зі списком статей

import { openLibraryModal } from './library-modal.js';

export function initLibraryWidget(host) {
  if (!host) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Бібліотека</span>
      </div>
      <div class="design-section__chev">▾</div>
    </button>
    <div class="design-section__body">
      <div class="design-widget">
        <div class="design-widget__row">
          <button class="design-btn design-btn--primary" type="button" data-act="open-library" style="width:100%">
            Відкрити бібліотеку статей
          </button>
        </div>
        <div class="design-widget__hint">
          Статті зберігаються в <code>/library/articles</code>. Редагування зберігається як чернетка (localStorage).
        </div>
      </div>
    </div>
  `;

  const headerBtn = sectionEl.querySelector('.design-section__header');
  const body = sectionEl.querySelector('.design-section__body');
  if (headerBtn && body) {
    headerBtn.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });
  }

  const openBtn = sectionEl.querySelector('[data-act="open-library"]');
  if (openBtn) {
    openBtn.addEventListener('click', () => openLibraryModal());
  }

  host.appendChild(sectionEl);
}
