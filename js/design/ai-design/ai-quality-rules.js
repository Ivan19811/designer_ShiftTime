// js/design/ai-design/ai-quality-rules.js
// [AI-SITE-GENERATOR-2026][Етап 2.4]
// Локальні Quality Rules для AI-секцій перед застосуванням у Content.
// Модуль не змінює DOM полотна. Він тільки аналізує підготовлений HTML.

const TYPE_LABELS = {
  hero: 'Hero',
  services: 'Послуги',
  features: 'Переваги',
  gallery: 'Галерея',
  cta: 'CTA',
  faq: 'FAQ',
  contacts: 'Контакти'
};

function cleanText_(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function addIssue_(issues, severity, title, message, points = 0) {
  issues.push({ severity, title, message, points: Number(points) || 0 });
}

function parseColor_(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'transparent' || raw.includes('gradient') || raw.includes('var(')) return null;

  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1
    };
  }

  const rgba = raw.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => part.trim());
    if (parts.length >= 3) {
      const r = Number(parts[0]);
      const g = Number(parts[1]);
      const b = Number(parts[2]);
      const a = parts.length >= 4 ? Number(parts[3]) : 1;
      if ([r, g, b].every(Number.isFinite)) return { r, g, b, a: Number.isFinite(a) ? a : 1 };
    }
  }

  return null;
}

function linearize_(channel) {
  const c = Math.max(0, Math.min(255, Number(channel) || 0)) / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance_(color) {
  return 0.2126 * linearize_(color.r) + 0.7152 * linearize_(color.g) + 0.0722 * linearize_(color.b);
}

function contrastRatio_(a, b) {
  const la = luminance_(a);
  const lb = luminance_(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function getDirectBlocks_(row) {
  return Array.from(row?.children || []).filter((child) => child instanceof HTMLElement && child.classList.contains('st-block'));
}

function analyzeGridRows_(rows, issues) {
  let scorePenalty = 0;
  rows.forEach((row, index) => {
    const blocks = getDirectBlocks_(row);
    const frs = String(row.dataset.frs || '').split(',').filter(Boolean);
    if (!blocks.length) {
      addIssue_(issues, 'warning', `Рівень ${index + 1}`, 'У рівні немає прямого st-block. Для редагування краще мати блоки прямими дітьми st-row.', 6);
      scorePenalty += 6;
      return;
    }
    if (row.dataset.layoutMode !== 'fr') {
      addIssue_(issues, 'warning', `Рівень ${index + 1}`, 'Не вказано data-layout-mode="fr". Resize-система може працювати менш стабільно.', 4);
      scorePenalty += 4;
    }
    if (frs.length && frs.length !== blocks.length) {
      addIssue_(issues, 'warning', `Рівень ${index + 1}`, `Кількість data-frs (${frs.length}) не збігається з кількістю блоків (${blocks.length}).`, 5);
      scorePenalty += 5;
    }
  });
  return scorePenalty;
}

function analyzeTypeSpecific_(section, type, imageMode, issues) {
  let penalty = 0;
  const headings = section.querySelectorAll('h1,h2,h3');
  const buttons = section.querySelectorAll('a,button,.st-ai-generated-btn');
  const imageBlocks = section.querySelectorAll('.st-block--image,[data-ai-generated-visual="1"],[data-ai-image-path]');
  const hasBackgroundImage = !!section.dataset.aiImagePath || String(section.style.backgroundImage || '').includes('url(');

  if ((type === 'hero' || type === 'cta') && !buttons.length) {
    addIssue_(issues, 'warning', `${TYPE_LABELS[type] || type}: CTA`, 'Для Hero/CTA бажано мати кнопку або посилання дії.', 8);
    penalty += 8;
  }

  if (type === 'hero' && !section.querySelector('h1')) {
    addIssue_(issues, 'warning', 'Hero: H1', 'Hero-секція бажано має містити h1, щоб перший екран був сильним і зрозумілим.', 7);
    penalty += 7;
  }

  if (type !== 'hero' && !headings.length) {
    addIssue_(issues, 'warning', 'Заголовок', 'Секція не має заголовка h1/h2/h3. Краще додати чіткий заголовок.', 6);
    penalty += 6;
  }

  if (type === 'gallery' && imageBlocks.length < 3 && imageMode !== 'none') {
    addIssue_(issues, 'warning', 'Галерея: фото', 'Для галереї бажано мінімум 3 візуальні блоки або фото.', 8);
    penalty += 8;
  }

  if (imageMode === 'sectionBackground' && !hasBackgroundImage) {
    addIssue_(issues, 'error', 'Фон секції', 'Вибрано режим “Фон секції”, але у section не знайдено background-image або data-ai-image-path.', 14);
    penalty += 14;
  }

  if ((imageMode === 'visualBlock' || (imageMode === 'auto' && ['hero', 'gallery', 'services'].includes(type))) && !imageBlocks.length) {
    addIssue_(issues, 'warning', 'Зображення', 'Очікувався візуальний блок, але зображення не знайдено. Секція працюватиме, але виглядатиме простіше.', 7);
    penalty += 7;
  }

  return penalty;
}

function analyzeDesignMeta_(section, issues) {
  let penalty = 0;
  const requiredAttrs = [
    ['data-ai-generated-section', 'ознака AI-секції'],
    ['data-ai-section-type', 'тип секції'],
    ['data-ai-design-preset', 'дизайн-пресет'],
    ['data-ai-layout-recipe', 'рецепт композиції'],
    ['data-ai-section-variant', 'варіант секції']
  ];
  requiredAttrs.forEach(([attr, label]) => {
    if (!section.hasAttribute(attr)) {
      addIssue_(issues, 'warning', 'AI metadata', `Немає ${attr} (${label}). Це не зламає HTML, але завадить повторній генерації / збереженню AI-шаблону.`, 3);
      penalty += 3;
    }
  });
  return penalty;
}

function analyzeContrast_(theme, section, issues) {
  let penalty = 0;
  const bgRaw = theme?.panel || theme?.bg || theme?.sectionBg || '';
  const headingRaw = theme?.heading || '';
  const textRaw = theme?.text || '';
  const accentRaw = theme?.accent || '';
  const bg = parseColor_(bgRaw);
  const heading = parseColor_(headingRaw);
  const text = parseColor_(textRaw);
  const accent = parseColor_(accentRaw);
  const hasImageBg = !!section?.dataset?.aiImagePath || String(section?.style?.backgroundImage || '').includes('url(');

  if (bg && heading) {
    const ratio = contrastRatio_(bg, heading);
    if (ratio < 4.5) {
      addIssue_(issues, 'warning', 'Контраст заголовка', `Контраст заголовка приблизно ${ratio.toFixed(1)}:1. Бажано 4.5:1 або вище.`, 8);
      penalty += 8;
    }
  }

  if (bg && text) {
    const ratio = contrastRatio_(bg, text);
    if (ratio < 4.5) {
      addIssue_(issues, 'warning', 'Контраст тексту', `Контраст основного тексту приблизно ${ratio.toFixed(1)}:1. Може бути слабко видно на малих екранах.`, 8);
      penalty += 8;
    }
  }

  if (bg && accent) {
    const ratio = contrastRatio_(bg, accent);
    if (ratio < 3) {
      addIssue_(issues, 'warning', 'Контраст акценту', `Акцент має приблизний контраст ${ratio.toFixed(1)}:1. Кнопки/бейджі можуть зливатися з фоном.`, 5);
      penalty += 5;
    }
  }

  if (hasImageBg) {
    const bgImage = String(section?.style?.backgroundImage || '');
    if (!bgImage.includes('linear-gradient') && !bgImage.includes('rgba(')) {
      addIssue_(issues, 'warning', 'Overlay для фото', 'У секції з фоновим фото не видно затемнення/overlay. Текст може погано читатись.', 7);
      penalty += 7;
    }
  }

  return penalty;
}

export function analyzeAiSectionQuality({ html = '', meta = {}, theme = null, imageMode = 'auto', type = 'hero' } = {}) {
  const issues = [];
  let score = 100;
  const cleanHtml = String(html || '').trim();

  if (!cleanHtml) {
    return {
      ok: false,
      score: 0,
      level: 'critical',
      summary: 'Секція ще не підготовлена.',
      issues: [{ severity: 'error', title: 'HTML', message: 'Немає HTML для перевірки.', points: 100 }],
      stats: {}
    };
  }

  if (typeof document === 'undefined') {
    return {
      ok: true,
      score: 70,
      level: 'unknown',
      summary: 'DOM недоступний для детальної перевірки у цьому середовищі.',
      issues: [{ severity: 'info', title: 'Середовище', message: 'Перевірка буде повною у браузері конструктора.', points: 0 }],
      stats: {}
    };
  }

  const tmp = document.createElement('div');
  tmp.innerHTML = cleanHtml;

  if (tmp.querySelector('script,iframe,object,embed')) {
    addIssue_(issues, 'error', 'Безпека HTML', 'У секції знайдено script/iframe/object/embed. Такий HTML не можна застосовувати.', 100);
    score = 0;
  }

  const topSections = Array.from(tmp.children).filter((child) => child instanceof HTMLElement && child.classList.contains('st-section'));
  const section = tmp.querySelector(':scope > .st-section') || tmp.querySelector('.st-section');
  if (!section) {
    return {
      ok: false,
      score: 0,
      level: 'critical',
      summary: 'Не знайдено .st-section.',
      issues: [{ severity: 'error', title: 'Структура', message: 'AI-секція повинна починатися з section.st-section.', points: 100 }],
      stats: {}
    };
  }

  if (topSections.length !== 1) {
    addIssue_(issues, 'warning', 'Корінь секції', 'Бажано, щоб підготовлений HTML мав рівно одну верхню .st-section.', 6);
    score -= 6;
  }

  if (section.dataset.stNode !== 'section') {
    addIssue_(issues, 'error', 'data-st-node', 'section має мати data-st-node="section".', 15);
    score -= 15;
  }
  if (section.dataset.stArea !== 'main') {
    addIssue_(issues, 'error', 'data-st-area', 'section має мати data-st-area="disabled".', 15);
    score -= 15;
  }

  const rows = Array.from(section.querySelectorAll('.st-row')).filter((row) => row instanceof HTMLElement);
  const blocks = Array.from(section.querySelectorAll('.st-block')).filter((block) => block instanceof HTMLElement);
  const editables = Array.from(section.querySelectorAll('.st-text-edit')).filter((ed) => ed instanceof HTMLElement);
  const headings = section.querySelectorAll('h1,h2,h3');
  const textLength = cleanText_(section.textContent).length;

  if (!rows.length) {
    addIssue_(issues, 'error', 'Рівні', 'Не знайдено жодного .st-row[data-st-node="level"].', 25);
    score -= 25;
  }
  if (!blocks.length) {
    addIssue_(issues, 'error', 'Блоки', 'Не знайдено жодного .st-block[data-st-node="block"].', 25);
    score -= 25;
  }
  if (!editables.length) {
    addIssue_(issues, 'error', 'Редагування тексту', 'Не знайдено .st-text-edit. Текст не буде нормально редагуватись у конструкторі.', 18);
    score -= 18;
  }

  rows.forEach((row, index) => {
    if (row.dataset.stNode !== 'level') {
      addIssue_(issues, 'warning', `Рівень ${index + 1}`, 'st-row має мати data-st-node="level".', 4);
      score -= 4;
    }
    if (row.dataset.stArea !== 'main') {
      addIssue_(issues, 'warning', `Рівень ${index + 1}`, 'st-row має мати data-st-area="disabled".', 4);
      score -= 4;
    }
  });

  blocks.forEach((block, index) => {
    if (block.dataset.stNode !== 'block') {
      addIssue_(issues, 'warning', `Блок ${index + 1}`, 'st-block має мати data-st-node="block".', 4);
      score -= 4;
    }
    if (block.dataset.stArea !== 'main') {
      addIssue_(issues, 'warning', `Блок ${index + 1}`, 'st-block має мати data-st-area="disabled".', 4);
      score -= 4;
    }
    if (block.getAttribute('draggable') !== 'true') {
      addIssue_(issues, 'warning', `Блок ${index + 1}`, 'Не вказано draggable="true". Перетягування може не працювати як очікується.', 3);
      score -= 3;
    }
  });

  editables.forEach((ed, index) => {
    if (ed.getAttribute('contenteditable') !== 'true') {
      addIssue_(issues, 'warning', `Текст ${index + 1}`, 'st-text-edit має мати contenteditable="true".', 3);
      score -= 3;
    }
  });

  if (textLength < 80) {
    addIssue_(issues, 'warning', 'Текст', 'У секції мало тексту. Вона може виглядати порожньою або слабкою.', 6);
    score -= 6;
  }

  score -= analyzeGridRows_(rows, issues);
  score -= analyzeTypeSpecific_(section, meta?.type || type, meta?.imageMode || imageMode, issues);
  score -= analyzeDesignMeta_(section, issues);
  score -= analyzeContrast_(theme, section, issues);

  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;
  if (!errorCount) {
    addIssue_(issues, 'ok', 'Структура', 'Секція має базову редаговану структуру st-section / st-row / st-block.', 0);
    if (headings.length) addIssue_(issues, 'ok', 'Заголовки', `Знайдено заголовків: ${headings.length}.`, 0);
    if (editables.length) addIssue_(issues, 'ok', 'Редагування', `Редагованих текстових областей: ${editables.length}.`, 0);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const level = errorCount ? 'error' : (finalScore >= 86 ? 'excellent' : (finalScore >= 72 ? 'good' : (finalScore >= 55 ? 'warning' : 'weak')));
  const ok = !errorCount && finalScore >= 55;
  const summary = errorCount
    ? `Є критичні помилки: ${errorCount}. Застосування заблоковано до виправлення.`
    : warningCount
      ? `Можна застосовувати, але є попередження: ${warningCount}. Якість ${finalScore}/100.`
      : `Готово до застосування. Якість ${finalScore}/100.`;

  return {
    ok,
    score: finalScore,
    level,
    summary,
    issues,
    stats: {
      rows: rows.length,
      blocks: blocks.length,
      editables: editables.length,
      headings: headings.length,
      textLength,
      type: meta?.type || type,
      imageMode: meta?.imageMode || imageMode
    }
  };
}

export function formatAiQualityForPlan(report) {
  if (!report || typeof report !== 'object') return 'Quality Rules: звіт ще не створено.';
  const stats = report.stats || {};
  const important = (report.issues || [])
    .filter((issue) => issue.severity === 'error' || issue.severity === 'warning')
    .slice(0, 6)
    .map((issue) => `• ${issue.severity === 'error' ? 'ПОМИЛКА' : 'Увага'}: ${issue.title} — ${issue.message}`);
  return [
    `Quality Rules: ${report.score ?? 0}/100 · ${report.summary || ''}`,
    `Статистика: rows=${stats.rows || 0}, blocks=${stats.blocks || 0}, editables=${stats.editables || 0}, headings=${stats.headings || 0}, text=${stats.textLength || 0}`,
    ...important
  ].filter(Boolean).join('\n');
}
