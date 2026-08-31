(function () {
  'use strict';

  const win = window;
  const doc = document;
  const root = doc.getElementById('st-boot-loader');
  if (!root || win.ST_BOOT_LOADER) return;

  const start = (win.performance && performance.now) ? performance.now() : Date.now();
  // [00372][BOOT CINEMATIC REVEAL] Keep the loader until the 6th second,
  // then unfold/dissolve it into the already mounted constructor instead of
  // switching with a hard visual jump.
  const MIN_VISIBLE_MS = 6000;
  const LONG_LOAD_WARN_MS = 5000;
  const SAFE_MAX_MS = 15000;
  const EXIT_REVEAL_MS = 1320;
  let current = 0;
  let target = 4;
  let completed = false;
  let hidden = false;
  let revealStarted = false;
  let stageIndex = 0;
  let lastStageKey = 'boot';
  let finalElapsedMs = null;

  const stages = [
    { key: 'boot', pct: 4, label: 'Boot interface', desc: 'Показуємо голографічний екран запуску.' },
    { key: 'dom', pct: 12, label: 'DOM shell', desc: 'HTML-структура готова. Запускаємо конструктор.' },
    { key: 'styles', pct: 24, label: 'Style engine', desc: 'Перевіряємо стилі інтерфейсу, canvas і віджетів.' },
    { key: 'shell', pct: 34, label: 'Builder shell', desc: 'Монтуємо оболонку конструктора та базові панелі.' },
    { key: 'core', pct: 46, label: 'Core systems', desc: 'Ініціалізуємо роль, тему, фон і панелі конструктора.' },
    { key: 'widgets', pct: 58, label: 'Design widgets', desc: 'Готуємо інспектор, віджети дизайну та lazy-модулі.' },
    { key: 'canvas', pct: 68, label: 'Canvas runtime', desc: 'Підключено canvas, шапку, футер і runtime-мости.' },
    { key: 'templates', pct: 74, label: 'Template systems', desc: 'Бібліотеки шаблонів підготовлені у lazy-режимі.' },
    { key: 'assets', pct: 78, label: 'Assets check', desc: 'Перевіряємо завантаження стилів, скриптів і системних ресурсів.' },
    { key: 'workspace', pct: 88, label: 'Workspace restore', desc: 'Відновлюємо активну сторінку та стан робочої області.' },
    { key: 'state', pct: 94, label: 'State sync', desc: 'Синхронізуємо localStorage, сторінки й поточний сайт.' },
    { key: 'ready', pct: 100, label: 'Ready to build', desc: 'Система готова. Відкриваємо конструктор.' }
  ];

  const metrics = {
    cssTotal: 0,
    cssLoaded: 0,
    scriptsTotal: 0,
    scriptsLoaded: 0,
    imagesTotal: 0,
    imagesLoaded: 0,
    marks: []
  };

  const $ = (sel) => root.querySelector(sel);
  const percentEl = $('#st-boot-percent');
  const ringEl = $('#st-boot-ring');
  const labelEl = $('#st-boot-stage-label');
  const stageMiniEl = $('#st-boot-stage-mini');
  const descEl = $('#st-boot-stage-desc');
  const timerEl = $('#st-boot-timer');
  const initTimeEl = $('#st-boot-init-time');
  const totalTimeEl = $('#st-boot-total-time');
  const clockEl = $('#st-boot-clock');
  const dateEl = $('#st-boot-date');
  const minRemainEl = $('#st-boot-minremain');
  const longStatusEl = $('#st-boot-long-status');
  const warningPanelEl = $('#st-boot-warning-panel');
  const calendarTitleEl = $('#st-boot-calendar-title');
  const calendarGridEl = $('#st-boot-calendar-grid');
  const logEl = $('#st-boot-log');
  const fills = Array.from(root.querySelectorAll('[data-boot-fill]'));
  const modules = Array.from(root.querySelectorAll('[data-boot-module]'));
  const metricsEls = {
    signal: root.querySelector('[data-boot-metric="signal"]'),
    pulse: root.querySelector('[data-boot-metric="pulse"]'),
    memory: root.querySelector('[data-boot-metric="memory"]')
  };
  const chips = Array.from(root.querySelectorAll('[data-boot-chip]'));
  const donuts = Array.from(root.querySelectorAll('[data-boot-donut]'));
  const radarNodes = Array.from(root.querySelectorAll('[data-radar-module]'));
  const blueprintParts = Array.from(root.querySelectorAll('[data-blueprint-part]'));
  const missionLogEl = $('#st-boot-mission-log');
  const blueprintStatusEl = $('#st-boot-blueprint-status');


  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function nowMs() { return (win.performance && performance.now) ? performance.now() : Date.now(); }
  function stageByKey(key) { return stages.find((s) => s.key === key) || null; }
  function stagePos(key) { return stages.findIndex((s) => s.key === key); }
  function formatSeconds(ms) { return `${(ms / 1000).toFixed(1)}s`; }
  function updateViewportFit() {
    try {
      const vv = win.visualViewport || null;
      const w = Math.max(320, Math.round(vv?.width || win.innerWidth || doc.documentElement.clientWidth || 1366));
      const h = Math.max(320, Math.round(vv?.height || win.innerHeight || doc.documentElement.clientHeight || 768));
      const diagonal = Math.sqrt((w * w) + (h * h));

      // [00350] Fluid fullscreen layout. CSS uses the actual viewport instead of
      // scaling a fixed canvas, so the HUD fills the monitor and the logo is contained.
      const designW = w;
      const designH = h;
      const margin = (w >= 1700) ? 2 : ((w < 900 || h < 720) ? 4 : 4);
      const fitScale = 1;
      const html = doc.documentElement;

      html.style.setProperty('--st-boot-fit-scale', '1');
      html.style.setProperty('--st-boot-scale', '1');
      html.style.setProperty('--st-boot-design-w', `${designW}px`);
      html.style.setProperty('--st-boot-design-h', `${designH}px`);
      html.style.setProperty('--st-boot-vw', String(w));
      html.style.setProperty('--st-boot-vh', String(h));
      html.style.setProperty('--st-boot-diagonal', String(Math.round(diagonal)));
      html.style.setProperty('--st-boot-fit-gap', `${margin}px`);

      html.classList.toggle('st-boot-fit-small', h < 860 || w < 1500);
      html.classList.toggle('st-boot-fit-tiny', h < 720 || w < 1200);
      // Keep old diagnostic classes for compatibility, but do not use narrow stacking for the HUD.
      html.classList.toggle('st-boot-compact', fitScale < 0.82 || h < 860);
      html.classList.toggle('st-boot-short', h < 860);
      html.classList.toggle('st-boot-very-short', h < 720);
      html.classList.toggle('st-boot-narrow', w < 760);
      html.classList.toggle('st-boot-ultrawide', w / Math.max(1, h) > 2.25);
      html.classList.toggle('st-boot-wide-low', h < 860 || w / Math.max(1, h) > 1.95);

      root.dataset.bootViewport = `${w}x${h}`;
      root.dataset.bootDiagonal = String(Math.round(diagonal));
      root.dataset.bootScale = fitScale.toFixed(5);

      // [00350] No measured scale shrink here: the shell is inset to the viewport.
      // If a specific monitor needs another composition later, we will switch layouts by class.
    } catch (_) {}
  }


  function resourceSummary() {
    const css = metrics.cssTotal ? `CSS ${metrics.cssLoaded}/${metrics.cssTotal}` : 'CSS —';
    const js = metrics.scriptsTotal ? `JS ${metrics.scriptsLoaded}/${metrics.scriptsTotal}` : 'JS —';
    const img = metrics.imagesTotal ? `IMG ${metrics.imagesLoaded}/${metrics.imagesTotal}` : 'IMG —';
    return `${css} · ${js} · ${img}`;
  }

  function renderCalendar(date) {
    if (!calendarGridEl || !calendarTitleEl) return;
    const months = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
    const year = date.getFullYear();
    const month = date.getMonth();
    calendarTitleEl.textContent = `${months[month]} ${year}`;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const firstDay = (first.getDay() + 6) % 7; // monday first
    const daysInMonth = last.getDate();
    let html = '';
    for (let i = 0; i < firstDay; i += 1) html += '<span class="is-muted"></span>';
    for (let day = 1; day <= daysInMonth; day += 1) {
      const isToday = day === date.getDate();
      html += `<span class="${isToday ? 'is-today' : ''}">${day}</span>`;
    }
    calendarGridEl.innerHTML = html;
  }

  function updateDateTime(elapsed) {
    const now = new Date();
    if (clockEl) {
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('uk-UA', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (timerEl) timerEl.textContent = formatSeconds(elapsed);
    if (initTimeEl) initTimeEl.textContent = `Ініціалізація: ${formatSeconds(elapsed)}`;
    if (!completed && totalTimeEl) totalTimeEl.textContent = 'В процесі…';
    if (minRemainEl) {
      const remain = Math.max(0, MIN_VISIBLE_MS - elapsed);
      minRemainEl.textContent = remain > 0 ? `Мінімальний показ: ще ${formatSeconds(remain)}` : 'Мінімальний показ завершено';
    }
    if (warningPanelEl && longStatusEl) {
      const slow = elapsed > LONG_LOAD_WARN_MS && !completed;
      warningPanelEl.classList.toggle('is-slow', slow);
      longStatusEl.textContent = slow ? 'Триває розширене завантаження' : 'Нормальний запуск';
    }
    renderCalendar(now);
  }

  function updateTelemetry(elapsed) {
    if (metricsEls.signal) metricsEls.signal.textContent = (0.62 + (current / 100) * 0.35).toFixed(2);
    if (metricsEls.pulse) metricsEls.pulse.textContent = String(Math.round(72 + (Math.sin(elapsed / 320) * 8))).padStart(2, '0');
    if (metricsEls.memory) {
      const mem = 128 + Math.round((current / 100) * 512);
      metricsEls.memory.textContent = `${mem} MB`;
    }
  }

  function pushMissionLog(code, text) {
    if (!missionLogEl) return;
    const t = ((nowMs() - start) / 1000).toFixed(2);
    const row = doc.createElement('div');
    row.innerHTML = `<span>${t}s</span><b>${String(text || code || 'Системна подія')}</b>`;
    missionLogEl.insertBefore(row, missionLogEl.firstChild);
    while (missionLogEl.children.length > 7) {
      try { missionLogEl.lastElementChild.remove(); } catch (_) { break; }
    }
  }

  function moduleOrderForKey(key) {
    const map = {
      boot: 0,
      dom: 0,
      styles: 1,
      shell: 1,
      core: 2,
      widgets: 3,
      canvas: 4,
      templates: 5,
      assets: 5,
      workspace: 6,
      state: 6,
      ready: 7
    };
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : 0;
  }

  function activateCinematic(key, stage, desc) {
    const order = moduleOrderForKey(key);
    const radarOrder = {
      core: 2,
      canvas: 4,
      widgets: 3,
      templates: 5,
      workspace: 6,
      ready: 7
    };
    radarNodes.forEach((node) => {
      const mk = node.getAttribute('data-radar-module') || '';
      const mo = Object.prototype.hasOwnProperty.call(radarOrder, mk) ? radarOrder[mk] : 0;
      node.classList.toggle('is-done', order > mo);
      node.classList.toggle('is-active', order === mo || (mk === 'ready' && key === 'ready'));
    });

    const bpActive = new Set();
    if (order >= 1) bpActive.add('header');
    if (order >= 2) bpActive.add('sidebar');
    if (order >= 3) bpActive.add('inspector');
    if (order >= 4) bpActive.add('canvas');
    if (order >= 6) bpActive.add('footer');
    blueprintParts.forEach((part) => {
      const pk = part.getAttribute('data-blueprint-part') || '';
      const isOn = bpActive.has(pk);
      part.classList.toggle('is-active', isOn && key !== 'ready');
      part.classList.toggle('is-done', key === 'ready' || isOn);
    });

    if (blueprintStatusEl) {
      const ua = {
        boot: 'Пробудження системи',
        dom: 'Побудова структури',
        styles: 'Підключення стилів',
        shell: 'Монтаж оболонки',
        core: 'Ініціалізація ядра',
        widgets: 'Підключення віджетів',
        canvas: 'Побудова полотна',
        templates: 'Підготовка шаблонів',
        assets: 'Перевірка ресурсів',
        workspace: 'Відновлення робочої області',
        state: 'Синхронізація стану',
        ready: 'Конструктор готовий'
      };
      blueprintStatusEl.textContent = ua[key] || String(stage?.label || key || 'Система');
    }

    const missionText = {
      boot: 'Активовано стартову панель ShiftTime.',
      dom: 'Структура сторінки готова до ініціалізації.',
      styles: 'Перевіряємо CSS-шари та системні стилі.',
      shell: 'Монтуємо основну оболонку конструктора.',
      core: 'Піднімаємо ядро, тему та базові системи.',
      widgets: 'Готуємо панель дизайну і віджети керування.',
      canvas: 'Підключаємо полотно, шапку, футер і runtime-мости.',
      templates: 'Шаблони переведені у швидкий lazy-режим.',
      assets: 'Перевіряємо ресурси, скрипти, стилі та зображення.',
      workspace: 'Відновлюємо сайт, сторінку і робочу область.',
      state: 'Синхронізуємо локальний стан конструктора.',
      ready: 'Система готова до роботи.'
    };
    pushMissionLog(key, desc || missionText[key] || stage?.desc || key);
  }

  function setModuleState(key) {
    const activeIndex = stagePos(key);
    modules.forEach((m) => {
      const moduleKey = m.getAttribute('data-boot-module') || '';
      const moduleIndex = stagePos(moduleKey);
      const done = moduleIndex >= 0 && activeIndex > moduleIndex;
      const active = moduleKey === key;
      m.classList.toggle('is-done', done);
      m.classList.toggle('is-active', active);
      const b = m.querySelector('b');
      if (b) b.textContent = done ? 'OK' : (active ? 'LOAD' : 'WAIT');
    });
    chips.forEach((chip) => {
      const chipKey = chip.getAttribute('data-boot-chip') || '';
      const chipIndex = stagePos(chipKey);
      const active = chipKey === key || (chipIndex >= 0 && activeIndex >= chipIndex && chipKey !== 'ready' && activeIndex < stagePos('ready'));
      chip.classList.toggle('is-active', active);
    });
  }

  function render(value) {
    const pct = clamp(Math.round(value), 0, 100);
    if (percentEl) percentEl.textContent = String(pct).padStart(2, '0');
    if (ringEl) ringEl.style.setProperty('--p', String(pct));
    if (stageMiniEl) stageMiniEl.textContent = (lastStageKey || 'boot').toUpperCase();
    const cssRatio = clamp(Math.round((metrics.cssLoaded / Math.max(1, metrics.cssTotal)) * 100), 0, Math.max(10, pct));
    const jsRatio = clamp(Math.round((metrics.scriptsLoaded / Math.max(1, metrics.scriptsTotal)) * 100), 0, Math.max(10, pct));
    const workspaceRatio = clamp(pct - 6, 0, 100);
    fills.forEach((fill, idx) => {
      let ratio = pct;
      if (idx === 1) ratio = cssRatio;
      else if (idx === 2) ratio = jsRatio;
      else if (idx === 3) ratio = workspaceRatio;
      fill.style.setProperty('--v', `${ratio}%`);
      const n = fill.closest('.st-boot-bar')?.querySelector('[data-boot-val]');
      if (n) n.textContent = `${ratio}%`;
    });
    donuts.forEach((donut) => {
      const kind = donut.getAttribute('data-boot-donut') || '';
      let value = pct;
      if (kind === 'core') value = clamp(Math.round(pct * .96 + 4), 0, 100);
      if (kind === 'ui') value = clamp(Math.round((cssRatio + jsRatio) / 2), 0, 100);
      if (kind === 'assets') value = clamp(Math.round((cssRatio + jsRatio + (metrics.imagesTotal ? Math.round((metrics.imagesLoaded / Math.max(1, metrics.imagesTotal)) * 100) : pct)) / 3), 0, 100);
      donut.style.setProperty('--p', String(value));
      const strong = donut.querySelector('strong');
      if (strong) strong.textContent = `${value}%`;
    });
  }

  function writeLog(stage, desc) {
    if (!logEl) return;
    const t = ((nowMs() - start) / 1000).toFixed(2);
    logEl.textContent = `[${t}s] ${String(stage.label || stage.key || '').toUpperCase()} · ${desc || stage.desc || ''} · ${resourceSummary()}`;
  }

  function setStage(key, pct, desc) {
    const realKey = String(key || 'boot');
    const known = stageByKey(realKey);
    const fallback = known || { key: realKey, pct: Number(pct) || target, label: realKey, desc: desc || '' };
    const nextIndex = known ? stagePos(realKey) : stageIndex;
    stageIndex = Math.max(stageIndex, nextIndex);
    lastStageKey = fallback.key;
    const nextPct = Number(pct ?? fallback.pct ?? target);
    target = clamp(Number.isFinite(nextPct) ? nextPct : target, target, 100);
    if (labelEl) labelEl.textContent = fallback.label || fallback.key;
    if (descEl) descEl.textContent = desc || fallback.desc || '';
    setModuleState(fallback.key);
    activateCinematic(fallback.key, fallback, desc);
    metrics.marks.push({ key: fallback.key, pct: target, at: Math.round(nowMs() - start) });
    if (metrics.marks.length > 24) metrics.marks.shift();
    writeLog(fallback, desc);
  }

  function updateResources() {
    try {
      const links = Array.from(doc.querySelectorAll('link[rel~="stylesheet"]'));
      metrics.cssTotal = links.length;
      metrics.cssLoaded = links.filter((link) => !!link.sheet || link.dataset.bootLoaded === '1').length;
      links.forEach((link) => {
        if (link.dataset.bootWatch === '1') return;
        link.dataset.bootWatch = '1';
        link.addEventListener('load', () => { link.dataset.bootLoaded = '1'; updateResources(); }, { once: true });
        link.addEventListener('error', () => { link.dataset.bootLoaded = '1'; updateResources(); }, { once: true });
      });
    } catch (_) {}
    try {
      const scripts = Array.from(doc.querySelectorAll('script[src]'));
      metrics.scriptsTotal = scripts.length;
      const perf = (win.performance && performance.getEntriesByType) ? performance.getEntriesByType('resource') : [];
      metrics.scriptsLoaded = scripts.filter((script) => {
        if (script.dataset.bootLoaded === '1') return true;
        const src = script.getAttribute('src') || '';
        return !!src && perf.some((e) => String(e.name || '').includes(src.replace(/^\.\//, '')));
      }).length;
      scripts.forEach((script) => {
        if (script.dataset.bootWatch === '1') return;
        script.dataset.bootWatch = '1';
        script.addEventListener('load', () => { script.dataset.bootLoaded = '1'; updateResources(); }, { once: true });
        script.addEventListener('error', () => { script.dataset.bootLoaded = '1'; updateResources(); }, { once: true });
      });
    } catch (_) {}
    try {
      const imgs = Array.from(doc.images || []);
      metrics.imagesTotal = imgs.length;
      metrics.imagesLoaded = imgs.filter((img) => img.complete).length;
      imgs.forEach((img) => {
        if (img.dataset.bootWatch === '1') return;
        img.dataset.bootWatch = '1';
        img.addEventListener('load', updateResources, { once: true });
        img.addEventListener('error', updateResources, { once: true });
      });
    } catch (_) {}
  }

  function tick() {
    if (hidden) return;
    const elapsed = nowMs() - start;
    updateResources();
    updateDateTime(elapsed);
    updateTelemetry(elapsed);
    current += (target - current) * 0.085;
    if (completed && target >= 100 && current > 98.7) current = 100;
    render(current);
    requestAnimationFrame(tick);
  }

  function revealBuilderRoot() {
    try {
      const html = doc.documentElement;
      html.classList.remove('st-boot-lock');
      html.classList.add('st-boot-revealing');
      const builderRoot = doc.getElementById('builder-root');
      if (builderRoot) {
        builderRoot.style.visibility = 'visible';
        builderRoot.style.opacity = '1';
        builderRoot.setAttribute('data-boot-reveal', '1');
      }
    } catch (_) {}
  }

  function finalizeHide() {
    if (hidden) return;
    hidden = true;
    root.classList.add('is-hidden');
    try {
      const html = doc.documentElement;
      html.classList.remove('st-boot-lock');
      html.classList.remove('st-boot-revealing');
      const builderRoot = doc.getElementById('builder-root');
      if (builderRoot) {
        builderRoot.style.visibility = '';
        builderRoot.style.opacity = '';
        builderRoot.removeAttribute('data-boot-reveal');
      }
    } catch (_) {}
    setTimeout(() => { try { root.remove(); } catch (_) {} }, 260);
  }

  function startRevealTransition() {
    if (hidden) return;
    if (revealStarted) return;
    revealStarted = true;
    target = 100;
    render(100);
    revealBuilderRoot();
    root.classList.add('is-revealing');
    try {
      if (labelEl) labelEl.textContent = 'Opening builder';
      if (descEl) descEl.textContent = 'Розгортаємо стартовий інтерфейс у робочу область без різкого стрибка.';
      writeLog({ label: 'OPENING BUILDER', key: 'ready', desc: 'Плавний перехід до конструктора.' }, 'Cinematic reveal active');
    } catch (_) {}
    setTimeout(finalizeHide, EXIT_REVEAL_MS);
  }

  function hide() {
    // Public/manual hide still uses the cinematic route while the loader is visible.
    startRevealTransition();
  }

  function complete(reason) {
    if (completed) return;
    completed = true;
    finalElapsedMs = nowMs() - start;
    if (totalTimeEl) totalTimeEl.textContent = formatSeconds(finalElapsedMs);
    updateResources();
    setStage('ready', 100, reason || 'Конструктор завантажено. Переходимо в робочу область.');
    target = 100;
    pushMissionLog('ready', 'Конструктор готовий. Завершуємо стартову послідовність.');
    root.classList.add('is-complete');
    const delay = Math.max(220, MIN_VISIBLE_MS - finalElapsedMs);
    setTimeout(startRevealTransition, delay);
  }

  function handleBootProgress(ev) {
    const d = ev && ev.detail ? ev.detail : {};
    if (d.resourceUpdate) updateResources();
    if (d.key) setStage(d.key, d.pct, d.desc);
    if (d.complete) complete(d.reason || d.desc);
  }

  win.ST_BOOT_LOADER = {
    setStage,
    mark: setStage,
    setProgress(pct, label, desc) {
      target = clamp(Number(pct) || 0, target, 100);
      if (label && labelEl) labelEl.textContent = String(label);
      if (desc && descEl) descEl.textContent = String(desc);
      writeLog({ label: label || lastStageKey, key: lastStageKey, desc }, desc);
    },
    resourceUpdate: updateResources,
    getMetrics() { return { ...metrics, marks: metrics.marks.slice() }; },
    complete,
    hide,
    isActive() { return !hidden; }
  };

  try { doc.documentElement.classList.add('st-boot-lock'); } catch (_) {}
  updateViewportFit();
  updateResources();
  updateDateTime(0);
  setStage('boot', 4, 'Boot loader активний. Очікуємо реальні етапи запуску.');
  requestAnimationFrame(tick);

  doc.addEventListener('DOMContentLoaded', () => {
    updateResources();
    setStage('dom', 12, 'DOM готовий. Чекаємо ініціалізацію модулів конструктора.');
  }, { once: true });

  win.addEventListener('load', () => {
    updateResources();
    setStage('assets', Math.max(target, 78), 'Браузерні ресурси завантажені. Чекаємо готовність конструктора.');
  }, { once: true });

  win.addEventListener('st:boot-progress', handleBootProgress);
  doc.addEventListener('st:boot-progress', handleBootProgress);
  win.addEventListener('st:builder-ready', () => complete('Конструктор повідомив про готовність.'), { once: true });
  doc.addEventListener('st:builder-ready', () => complete('Конструктор повідомив про готовність.'), { once: true });

  let __viewportFitRaf = 0;
  const scheduleViewportFit = () => {
    if (__viewportFitRaf) return;
    __viewportFitRaf = requestAnimationFrame(() => {
      __viewportFitRaf = 0;
      updateViewportFit();
    });
  };
  win.addEventListener('resize', scheduleViewportFit, { passive: true });
  try { win.visualViewport?.addEventListener?.('resize', scheduleViewportFit, { passive: true }); } catch (_) {}
  try { win.visualViewport?.addEventListener?.('scroll', scheduleViewportFit, { passive: true }); } catch (_) {}

  setTimeout(() => complete('Безпечне завершення заставки після очікування старту.'), SAFE_MAX_MS);
})();
