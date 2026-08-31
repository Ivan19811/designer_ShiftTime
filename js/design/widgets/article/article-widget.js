// js/design/widgets/article/article-widget.js
// Віджет "Стаття" у панелі "Дизайн":
// - акордеон у стилі інших віджетів
// - кнопка "Редагувати в Редакторі" (на всю ширину)
// - відкриває редактор для вибраного блоку(ів) статті

import { openArticleEditorModal } from './article-editor-modal.js';

function getSelectedArticleBlocks_(getSelection) {
  const sel = (typeof getSelection === 'function') ? getSelection() : null;
  const els = sel && Array.isArray(sel.elements) ? sel.elements : [];

  const set = new Set();
  for (const el of els) {
    if (!el || typeof el.closest !== 'function') continue;
    const block = el.closest('.st-block--article');
    if (block) set.add(block);
  }

  return Array.from(set);
}

function buildArticleIndexMap_() {
  const map = new Map();
  const list = Array.from(document.querySelectorAll('.st-block--article'));
  let n = 0;
  for (const el of list) {
    const id = el?.dataset?.uid;
    if (!id) continue;
    n += 1;
    map.set(id, n);
  }
  return map;
}

export function initArticleWidget(host, getSelection) {
  if (!host) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Стаття</span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body">
      <div class="design-placeholder" style="gap:10px;">
        <button class="sttpl-btn sttpl-btn--gallery" type="button" data-act="open-editor">
          Редагувати в Редакторі
        </button>
        <div class="design-placeholder__note" style="margin:0;">
          Відкриває редактор для вибраної статті (або запропонує вибір, якщо вибрано кілька).
        </div>
      </div>
    </div>
  `;

  const headerBtn = sectionEl.querySelector('.design-section__header');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });
  }

  const openBtn = sectionEl.querySelector('[data-act="open-editor"]');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const blocks = getSelectedArticleBlocks_(getSelection);

      // 1) Нічого не вибрано
      if (!blocks.length) {
        openArticleEditorModal({ mode: 'empty' });
        return;
      }

      // 2) Кілька вибраних статей
      if (blocks.length > 1) {
        const idxMap = buildArticleIndexMap_();
        const items = blocks
          .map((el) => {
            const id = el?.dataset?.uid || '';
            const n = idxMap.get(id) || 1;
            return { id, title: `Стаття ${n}` };
          })
          .filter(it => !!it.id);
        openArticleEditorModal({ mode: 'pick', items });
        return;
      }

      // 3) Одна стаття
      const only = blocks[0];
      const id = only?.dataset?.uid || '';
      if (!id) {
        openArticleEditorModal({ mode: 'empty' });
        return;
      }

      const idxMap = buildArticleIndexMap_();
      const n = idxMap.get(id) || 1;
      openArticleEditorModal({ mode: 'edit', id, title: `Стаття ${n}` });
    });
  }

  host.appendChild(sectionEl);
}
