// js/design/widgets/article/ai-provider.js
// DEMO AI provider (заглушка).
// Тут буде реальна інтеграція з OpenAI / будь-яким бекендом.
// IMPORTANT: поки що НІКУДИ не відправляємо дані — все генерується локально.

function escapeHtml_(s){
  return String(s || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

function mkDemo_(title, prompt, selection){
  const p = prompt ? `\nPrompt: ${prompt}` : '';
  const sel = selection ? `\nSelection: ${selection}` : '';
  return `<!-- AI-DEMO -->\n<strong>${escapeHtml_(title)}</strong>\n<em style="opacity:.75">${escapeHtml_(p + sel)}</em>\n\n`;
}

export async function runAI({ action, prompt, selection, html, articleId, title }){
  const a = String(action || '').trim();

  // NOTE: повертаємо html-рядок, який потім вставляється/замінюється в редакторі.
  if (a === 'title') {
    const base = (prompt || selection || title || 'Стаття').toString().slice(0, 64).trim();
    const out = base ? `Заголовок: ${base}` : 'Заголовок: Нова стаття';
    return { html: `<h2>${escapeHtml_(out)}</h2>` };
  }

  if (a === 'outline') {
    const base = (prompt || title || 'Стаття').toString().slice(0, 80).trim();
    return {
      html:
`<h2>${escapeHtml_(base || 'Структура статті')}</h2>
<ul>
  <li><strong>Розділ 1</strong> — коротко про тему</li>
  <li><strong>Розділ 2</strong> — деталі / характеристики</li>
  <li><strong>Розділ 3</strong> — поради / FAQ</li>
</ul>`
    };
  }

  if (a === 'rewrite') {
    const sel = (selection || '').trim();
    if (!sel) {
      return { html: mkDemo_('Немає виділеного тексту', prompt, selection) + '<div>Виділи текст у редакторі (вкладка "Редактор") і натисни "Переписати виділене".</div>' };
    }
    return { html: mkDemo_('Переписаний варіант', prompt, selection) + `<div>${escapeHtml_(sel)}</div>` };
  }

  // continue / default
  return {
    html: mkDemo_('Продовження статті', prompt, selection) +
      `<p>Це демонстраційне продовження для статті <strong>${escapeHtml_(title || articleId || '')}</strong>. Пізніше тут буде реальна генерація через AI.</p>`
  };
}
