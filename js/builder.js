// js/builder.js

import { exitTemplatesGalleryWorkspace } from './design/widgets/templates/templates-gallery-workspace-mode.js';

export function initBuilderLayout() {
  const root = document.getElementById('builder-root');
  if (!root) return;

  const mainHeaderToggleBtn = root.querySelector('[data-action="toggle-main-header"]');
  const sidebarCollapseBtn  = root.querySelector('[data-action="toggle-sidebar-collapse"]');
  const sideToggleBtn       = root.querySelector('[data-action="toggle-side"]');
  const settingsSidebar     = document.getElementById('builder-settings-sidebar');
  const settingsResizer     = document.getElementById('builder-settings-resizer');
  const settingsCloseBtn    = root.querySelector('[data-action="close-settings"]');
  const inspectorExpandBtn  = root.querySelector('[data-action="toggle-inspector-expand"]');

  const sidebarPanelButtons = root.querySelectorAll('[data-open-panel]');
  const settingsTabs        = root.querySelectorAll('.builder__settings-tab');
  const settingsPanels      = root.querySelectorAll('.builder__settings-panel');

  // [00112] Памʼять останньої відкритої головної панелі правого меню.
  // Важливо: це НЕ акордеони всередині "Дизайн", а саме головні пункти
  // лівого сайдбара: Дизайн / Фон сайту / Блоки / Сайт / Сторінки тощо.
  const LAST_SETTINGS_PANEL_KEY = 'st_builder_last_settings_panel_v1';
  const LAST_WORKSPACE_VIEW_KEY = 'st_builder_last_workspace_view_v1';

  function isKnownSettingsPanel(panelId) {
    const id = String(panelId || '').trim();
    if (!id) return false;
    return Array.from(settingsPanels).some((panel) => panel.getAttribute('data-panel-id') === id);
  }

  function getWorkspaceViewForPanel(panelId) {
    const id = String(panelId || '').trim();
    if (id === 'site') return 'site';
    if (id === 'pages') return 'pages';
    if (id === 'marketplace') return 'marketplace';
    return 'canvas';
  }

  function saveLastSettingsPanel(panelId, mainView) {
    const id = String(panelId || '').trim();
    if (!isKnownSettingsPanel(id)) return;
    try { localStorage.setItem(LAST_SETTINGS_PANEL_KEY, id); } catch (_) {}
    try { localStorage.setItem(LAST_WORKSPACE_VIEW_KEY, mainView || getWorkspaceViewForPanel(id)); } catch (_) {}
  }

  function loadLastSettingsPanel() {
    try {
      const saved = String(localStorage.getItem(LAST_SETTINGS_PANEL_KEY) || '').trim();
      return isKnownSettingsPanel(saved) ? saved : 'background';
    } catch (_) {
      return 'background';
    }
  }

  function findSidebarButtonForPanel(panelId) {
    const id = String(panelId || '').trim();
    if (!id) return null;
    if (id === 'design') return document.getElementById('navDesign');
    if (id === 'ai-design') return document.getElementById('navAiDesign');
    if (id === 'site') return document.getElementById('navSite');
    if (id === 'pages') return document.getElementById('navPages');
    if (id === 'marketplace') return document.getElementById('navMarketplace');
    return Array.from(root.querySelectorAll('.builder__sidebar-item[data-open-panel]')).find((btn) => btn.getAttribute('data-open-panel') === id) || null;
  }

  
  // [START-FRESH-PAGE-TEMPLATE-2026] Workspace view switching
  // У нас є декілька "екранів" у workspace: canvas, site manager, page manager.
  const mainViews = {
    canvas: document.getElementById('canvasView'),
    site: document.getElementById('siteManagerView'),
    pages: document.getElementById('pageManagerView'),
    marketplace: document.getElementById('marketplaceStudioView'),
  };

  const canvasScroll = root.querySelector('.canvas__scroll--full') || root.querySelector('.canvas__scroll');

  // === Active state for workspace sidebar buttons ===
  // Після FIX34 кліки ловляться делегуванням у capture-фазі, тому стандартні
  // click-handler-и нижче можуть не відпрацьовувати. Щоб підсвітка кнопок
  // не "зависала" на Фон сайту — оновлюємо is-active тут.
  function setWorkspaceSidebarActive_(btn) {
    try {
      const all = root.querySelectorAll(
        '#builder-main-sidebar .builder__sidebar-item'
      );
      all.forEach((el) => el.classList.remove('is-active'));
      if (btn && btn.classList) btn.classList.add('is-active');
    } catch (e) {}
  }

  function showWorkspaceView(key) {
    // ВАЖЛИВО: Конструктор шаблону сайту живе як окремий overlay (#siteTemplateBuilderView)
    // і не входить у mainViews. Якщо він відкритий, то при переході на інші екрани
    // (Сайт/Сторінки/Дизайн/Canvas) його потрібно жорстко сховати, інакше він перекриває workspace.
    try {
      const siteTplView = document.getElementById('siteTemplateBuilderView');
      if (siteTplView) {
        siteTplView.hidden = true;
        siteTplView.style.display = 'none';
      }
    } catch (e) {}

    // 00885: gallery mode has one explicit workspace exit authority.
    try {
      exitTemplatesGalleryWorkspace({ hideView: true, restoreScroll: false });
      const settingsModal = document.getElementById('sttplSettingsModal');
      if (settingsModal) settingsModal.style.display = 'none';
    } catch (e) {}


    // 01065 · WORKSPACE OWNERSHIP CONTRACT
    // Every central workspace is mutually exclusive. In particular, the responsive
    // viewport must never be able to bring #canvasView back into document flow while
    // Marketplace/Site/Pages owns the workspace. `hidden` is the semantic authority;
    // display is kept only for compatibility with older hardHide() code.
    Object.entries(mainViews).forEach(([k, el]) => {
      if (!el) return;
      const isActive = (key === k);
      el.hidden = !isActive;
      el.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      try { el.inert = !isActive; } catch (_) {}
      el.style.display = isActive ? '' : 'none';
    });
    // Якщо перемикаємось з canvas на інший екран — скрол повертаємо вгору,
    // бо site/pages view знаходяться вище у DOM і можуть бути поза поточним scrollTop.
    if (key !== 'canvas') {
      try { if (canvasScroll) canvasScroll.scrollTop = 0; } catch (e) {}
    }

    // ✅ SHIFT-SITES-2025: у режимах "site" та "pages" canvas-шапка (кнопки додавання)
    // НЕ повинна бути видимою. Вона потрібна лише у звичайному canvas/дизайн-режимі.
    try {
      const canvasHeader = document.querySelector('.canvas__header');
      if (canvasHeader) {
        canvasHeader.style.display = (key === 'canvas') ? '' : 'none';
      }
    } catch (e) {}

    // ✅ SHIFT-SITES-2025: позначаємо активний workspace-екран класами, щоб CSS міг
    // жорстко гасити canvas-шапку/канвас навіть якщо інший код випадково поверне display.
    try {
      root.classList.remove('builder--mainview-canvas', 'builder--mainview-site', 'builder--mainview-pages', 'builder--mainview-marketplace');
      if (key === 'canvas') root.classList.add('builder--mainview-canvas');
      if (key === 'site') root.classList.add('builder--mainview-site');
      if (key === 'pages') root.classList.add('builder--mainview-pages');
      if (key === 'marketplace') root.classList.add('builder--mainview-marketplace');
      root.dataset.stWorkspaceOwner = key;
      try { window.dispatchEvent(new CustomEvent('st:workspace-view-changed', { detail: { key, owner: key, exclusive: true, version: '01065' } })); } catch (_) {}
    } catch (e) {}
  }

  // Дозволяє іншим модулям (або дебагу) примусово перемкнути main-вид.
  // Це також рятує у випадках, коли інша логіка перехоплює кліки/події.
  try { window.ST_SHOW_workspace_VIEW = showWorkspaceView; } catch (e) {}

  // default — canvas
  showWorkspaceView('canvas');

const previewBtn = document.getElementById('btn-preview');
  const viewSelect = document.getElementById('builder-view-select');

  /* 1) Шапка вкл/викл */
  mainHeaderToggleBtn?.addEventListener('click', () => {
    const isHidden = root.classList.toggle('builder--header-hidden');
    mainHeaderToggleBtn.textContent = isHidden ? 'Показати шапку' : 'Приховати шапку';
  });

  /* 2) Collapse sidebar */
  sidebarCollapseBtn?.addEventListener('click', () => {
    const collapsed = root.classList.toggle('builder--sidebar-collapsed');
    if (collapsed) root.classList.remove('builder--sidebar-expanded');
    else root.classList.add('builder--sidebar-expanded');

    // Якщо користувач повернув сайдбар назад — виходимо з режиму розширеного інспектора
    // (за вимогою: повторний клік на верхню кнопку сайдбара повертає стандартний режим).
    if (!collapsed) {
      try {
        root.classList.remove('builder--inspector-expanded');
        if (inspectorExpandBtn) {
          inspectorExpandBtn.title = 'Розширити';
          inspectorExpandBtn.setAttribute('aria-label', 'Розширити');
        }
        delete root.dataset.__prevSidebarCollapsedForInspector;
      } catch (_) {}
    }
  });

  /* 2.1) Inspector expand (duplicate toggle) */
  inspectorExpandBtn?.addEventListener('click', (e) => {
    e.preventDefault?.();

    const isExpanded = root.classList.contains('builder--inspector-expanded');

    if (!isExpanded) {
      // Enter expanded mode
      try {
        root.dataset.__prevSidebarCollapsedForInspector = root.classList.contains('builder--sidebar-collapsed') ? '1' : '0';
      } catch (_) {}

      // Collapse main sidebar using existing logic
      if (!root.classList.contains('builder--sidebar-collapsed')) {
        try { sidebarCollapseBtn?.click(); } catch (_) {}
      }

      root.classList.add('builder--inspector-expanded');
      inspectorExpandBtn.title = 'Звичайний режим';
      inspectorExpandBtn.setAttribute('aria-label', 'Звичайний режим');
    } else {
      // Exit expanded mode
      root.classList.remove('builder--inspector-expanded');

      // Restore sidebar collapsed state if we collapsed it
      const prev = root.dataset.__prevSidebarCollapsedForInspector;
      if (prev === '0' && root.classList.contains('builder--sidebar-collapsed')) {
        try { sidebarCollapseBtn?.click(); } catch (_) {}
      }
      delete root.dataset.__prevSidebarCollapsedForInspector;

      inspectorExpandBtn.title = 'Розширити';
      inspectorExpandBtn.setAttribute('aria-label', 'Розширити');
    }
  });

  /* 3) Left/right */
  sideToggleBtn?.addEventListener('click', () => {
    const isLeft = root.classList.contains('builder--side-left');
    root.classList.toggle('builder--side-left', !isLeft);
    root.classList.toggle('builder--side-right', isLeft);
  });

  /* 4) Close settings */
  settingsCloseBtn?.addEventListener('click', () => {
    settingsSidebar.style.display = 'none';
    settingsResizer.style.display = 'none';
  });

  /* 5) Open panels from main sidebar or header */

  // Дубль-прив'язка для головних кнопок (на випадок, якщо data-open-panel перехоплюється іншою логікою)
  const navSiteBtn = document.getElementById('navSite');
  const navPagesBtn = document.getElementById('navPages');
  const navMarketplaceBtn = document.getElementById('navMarketplace');
  const navDesignBtn = document.getElementById('navDesign');
  const navAiDesignBtn = document.getElementById('navAiDesign');
  const navAiTestBtn = document.getElementById('navAiTest');
  const navAiRuntimeBtn = document.getElementById('navAiRuntime');
  const navAiAuditBtn = document.getElementById('navAiAudit');
  const navAiDebugBtn = document.getElementById('navAiDebug');
  function openAiTestPage() {
    try { setWorkspaceSidebarActive_(navAiTestBtn); } catch (_) {}
    try { window.location.href = './ai-command-test.html'; } catch (_) {}
  }
  function openAiAuditPage() {
    try { setWorkspaceSidebarActive_(navAiAuditBtn); } catch (_) {}
    try { window.location.href = './ai-command-audit.html'; } catch (_) {}
  }
  function openAiDebugPage() {
    try { setWorkspaceSidebarActive_(navAiDebugBtn); } catch (_) {}
    try { window.location.href = './ai-command-debug.html'; } catch (_) {}
  }
  function openAiRuntimeOverlay() {
    try { setWorkspaceSidebarActive_(navAiRuntimeBtn); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('st:open-ai-runtime')); } catch (_) {}
  }

  function ensureAiDesignPanelReady_() {
    try { window.dispatchEvent(new CustomEvent('st:ensure-ai-design-panel-ready')); } catch (_) {}
  }

  // ВАЖЛИВО: слухаємо у capture-фазі, щоб не залежати від інших обробників.
  const safeBind = (el, viewKey) => {
    if (!el) return;
    el.addEventListener('click', (e) => {
      // не даємо іншим обробникам "з'їсти" клік
      e.preventDefault?.();
      e.stopPropagation?.();

      // ✅ Дубль-логіка повинна повторювати очікувану поведінку кнопок,
      // інакше після деяких переходів/перерендерів може відкриватися лише інспектор,
      // без центральних налаштувань (або навпаки).
      const id = el.id || '';
      if (id === 'navSite') {
        // "Сайт" = показуємо Налаштування сайту (як раніше) + відкриваємо правий віджет "Сайт".
        try {
          const settingsSidebar = document.getElementById('builder-settings-sidebar');
          const settingsResizer = document.getElementById('builder-settings-resizer');
          if (settingsSidebar) settingsSidebar.style.display = 'flex';
          if (settingsResizer) settingsResizer.style.display = 'flex';
        } catch (_) {}

        showWorkspaceView('site');
        try { activatePanel('site'); } catch (_) {}
        try { window.SiteManager?.openPanel?.(); } catch (_) {}
        // ✅ Після openPanel може прилетіти st-page-selected і перевести workspace назад у canvas/дизайн.
        // Тому ще раз примусово залишаємося на екрані "site".
        setTimeout(() => {
          try { showWorkspaceView('site'); } catch (_) {}
          try { activatePanel('site'); } catch (_) {}
        }, 0);
        return;
      }

      if (id === 'navPages') {
        // "Сторінки" = показуємо головний екран Pages (віджет "Сторінки сайту" у workspace), без canvas-шапки.
        try {
          const settingsSidebar = document.getElementById('builder-settings-sidebar');
          const settingsResizer = document.getElementById('builder-settings-resizer');
          if (settingsSidebar) settingsSidebar.style.display = 'flex';
          if (settingsResizer) settingsResizer.style.display = 'flex';
        } catch (_) {}

        showWorkspaceView('pages');
        try { activatePanel('pages'); } catch (_) {}
        return;
      }

      if (id === 'navMarketplace') {
        try {
          const settingsSidebar = document.getElementById('builder-settings-sidebar');
          const settingsResizer = document.getElementById('builder-settings-resizer');
          if (settingsSidebar) settingsSidebar.style.display = 'flex';
          if (settingsResizer) settingsResizer.style.display = 'flex';
        } catch (_) {}
        showWorkspaceView('marketplace');
        try { activatePanel('marketplace'); } catch (_) {}
        return;
      }

      if (id === 'navDesign') {
        showWorkspaceView('canvas');
        try { activatePanel('design'); } catch (_) {}
        return;
      }

      if (id === 'navAiDesign') {
        try {
          const settingsSidebar = document.getElementById('builder-settings-sidebar');
          const settingsResizer = document.getElementById('builder-settings-resizer');
          if (settingsSidebar) settingsSidebar.style.display = 'flex';
          if (settingsResizer) settingsResizer.style.display = 'flex';
        } catch (_) {}
        showWorkspaceView('canvas');
        try { activatePanel('ai-design'); } catch (_) {}
        ensureAiDesignPanelReady_();
        return;
      }

      if (id === 'navAiTest') {
        openAiTestPage();
        return;
      }

      if (id === 'navAiRuntime') {
        openAiRuntimeOverlay();
        return;
      }

      if (id === 'navAiAudit') {
        openAiAuditPage();
        return;
      }

      if (id === 'navAiDebug') {
        openAiDebugPage();
        return;
      }

      showWorkspaceView(viewKey);
    }, true);
  };


  // Robust workspace sidebar navigation (delegated, capture)
  if (!window.__ST_WORKSPACE_SIDEBAR_DELEGATED__) {
    window.__ST_WORKSPACE_SIDEBAR_DELEGATED__ = true;


  // Причина: після кількох переходів деякі кнопки могли "втрачати" прямі listener-и (DOM оновлюється).
  // Делегування гарантує, що Сайт/Сторінки/Дизайн/Фон сайту завжди працюють.
  document.addEventListener('click', (ev) => {
    const btn = ev.target && ev.target.closest
      ? ev.target.closest('#navSite, #navPages, #navMarketplace, #navDesign, #navAiDesign, #navAiTest, #navAiRuntime, #navAiAudit, #navAiDebug, .builder__sidebar-item[data-open-panel]')
      : null;
    if (!btn) return;

    // Перехоплюємо на capture, щоб не було конфліктів з іншими click-handler-ами.
    ev.preventDefault();
    ev.stopPropagation();
    // stopImmediatePropagation не всюди доступний у старих браузерах, але тут ок.
    try { ev.stopImmediatePropagation && ev.stopImmediatePropagation(); } catch (_) {}

    const id = btn.id || '';
    const panel = btn.getAttribute('data-open-panel') || '';

    // Завжди піднімаємо scroll у верх (щоб не було "ніби не працює", коли ви прокручені вниз).
    try { window.scrollTo(0, 0); } catch (_) {}
    try { document.documentElement.scrollTop = 0; } catch (_) {}
    try { document.body.scrollTop = 0; } catch (_) {}

    // TOP NAV
    if (id === 'navSite') {
      setWorkspaceSidebarActive_(btn);

      // [DEBUG][SHIFT-SITES-2025]
      // Позначаємо, що відкриття "Сайт" ініційоване саме кнопкою Сайт,
      // щоб st-page-selected від SiteManager.openPanel() не перекидав workspace назад у canvas/дизайн.
      try {
        window.__ST_SITE_BTN_OPEN__ = { at: Date.now() };
        console.log('[navSite] click -> set __ST_SITE_BTN_OPEN__', window.__ST_SITE_BTN_OPEN__);
        // Автоочистка маркера (щоб не впливав на звичайні переходи сторінок)
        setTimeout(() => {
          try {
            if (window.__ST_SITE_BTN_OPEN__ && window.__ST_SITE_BTN_OPEN__.at === window.__ST_SITE_BTN_OPEN__?.at) {
              delete window.__ST_SITE_BTN_OPEN__;
            }
          } catch (_) {}
        }, 1500);
      } catch (_) {}

      // ✅ "Сайт" відкриваємо у правому інспекторі (додатковий сайтбар),
      // а workspace-екран лишаємо на canvas.
      try {
        settingsSidebar.style.display = 'flex';
        settingsResizer.style.display = 'flex';
      } catch (_) {}

      showWorkspaceView('site');
      try { activatePanel('site'); } catch (_) {}

      // ✅ відкриваємо Налаштування сайту з порожніми даними (режим створення нового)
      try { window.SiteManager?.openPanel?.(); } catch (_) {}
        // ✅ Після openPanel може прилетіти st-page-selected і перевести workspace назад у canvas/дизайн.
        // Тому ще раз примусово залишаємося на екрані "site".
        setTimeout(() => {
          try { showWorkspaceView('site'); } catch (_) {}
          try { activatePanel('site'); } catch (_) {}
        }, 0);
      return;
    }
    if (id === 'navPages') {
      setWorkspaceSidebarActive_(btn);

      // ✅ "Сторінки" відкриваємо у правому інспекторі.
      try {
        settingsSidebar.style.display = 'flex';
        settingsResizer.style.display = 'flex';
      } catch (_) {}

      // "Сторінки" мають відкриватися у workspace (pages view) і показувати сторінки поточного сайту.
      showWorkspaceView('pages');
      try { activatePanel('pages'); } catch (_) {}
      // Примусово освіжаємо PagesManager після переходів по інших віджетах/overlay.
      try { window.PageManager?.openPanel?.(); } catch (_) {}
      return;
    }

    if (id === 'navMarketplace') {
      setWorkspaceSidebarActive_(btn);
      try {
        settingsSidebar.style.display = 'flex';
        settingsResizer.style.display = 'flex';
      } catch (_) {}
      showWorkspaceView('marketplace');
      try { activatePanel('marketplace'); } catch (_) {}
      return;
    }
    if (id === 'navDesign') {
      setWorkspaceSidebarActive_(btn);
      // дизайн панелі працюють на canvas
      showWorkspaceView('canvas');
      // якщо це саме кнопка "Дизайн" — підсвітимо панель design
      try { activatePanel('design'); } catch (_) {}
      return;
    }
    if (id === 'navAiDesign') {
      setWorkspaceSidebarActive_(btn);
      try {
        settingsSidebar.style.display = 'flex';
        settingsResizer.style.display = 'flex';
      } catch (_) {}
      showWorkspaceView('canvas');
      try { activatePanel('ai-design'); } catch (_) {}
      ensureAiDesignPanelReady_();
      return;
    }
    if (id === 'navAiTest') {
      openAiTestPage();
      return;
    }
    if (id === 'navAiRuntime') {
      openAiRuntimeOverlay();
      return;
    }
    if (id === 'navAiAudit') {
      openAiAuditPage();
      return;
    }
    if (id === 'navAiDebug') {
      openAiDebugPage();
      return;
    }

    // SETTINGS PANELS (Напр: фон сайту / Сторінка 01028)
    if (panel) {
      setWorkspaceSidebarActive_(btn);
      try {
        settingsSidebar.style.display = 'flex';
        settingsResizer.style.display = 'flex';
      } catch (_) {}
      // Для всіх панелей крім site/pages використовуємо canvas як main view
      if (panel === 'marketplace') {
        showWorkspaceView('marketplace');
        try { activatePanel('marketplace'); } catch (_) {}
        return;
      }
      if (panel === 'pages') {
        // ✅ pages панель працює у інспекторі, canvas лишається основним екраном
        try {
          settingsSidebar.style.display = 'flex';
          settingsResizer.style.display = 'flex';
        } catch (_) {}

        // "Сторінки" відкриваємо у workspace (pages view)
        showWorkspaceView('pages');
        try { activatePanel('pages'); } catch (_) {}
        try { window.PageManager?.openPanel?.(); } catch (_) {}
        return;
      }
      showWorkspaceView('canvas');
      try { activatePanel(panel); } catch (_) {}
      return;
    }
  }, true);

  } // __ST_WORKSPACE_SIDEBAR_DELEGATED__


  safeBind(navSiteBtn, 'site');
  safeBind(navPagesBtn, 'pages');
  safeBind(navMarketplaceBtn, 'marketplace');
  safeBind(navDesignBtn, 'canvas');
  safeBind(navAiDesignBtn, 'canvas');
  safeBind(navAiTestBtn, 'canvas');
  safeBind(navAiRuntimeBtn, 'canvas');
  safeBind(navAiAuditBtn, 'canvas');
  safeBind(navAiDebugBtn, 'canvas');

  sidebarPanelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.getAttribute('data-open-panel');
      settingsSidebar.style.display = 'flex';
      settingsResizer.style.display = 'flex';

      activatePanel(panel);
      if (panel === 'ai-design') ensureAiDesignPanelReady_();

      // workspace: показуємо відповідний екран
      if (panel === 'site') showWorkspaceView('site');
      else if (panel === 'pages') showWorkspaceView('pages');
      else if (panel === 'marketplace') showWorkspaceView('marketplace');
      else showWorkspaceView('canvas');

      // Після перемикання workspace — освіжити вміст (щоб не чекати перезавантаження)
      try { if (panel === 'site' && window.SiteManager && typeof window.SiteManager.openPanel === 'function') window.SiteManager.openPanel(); } catch (e) {}
      try { if (panel === 'pages' && window.PageManager && typeof window.PageManager.openPanel === 'function') window.PageManager.openPanel(); } catch (e) {}


      sidebarPanelButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      settingsTabs.forEach((t) =>
        t.classList.toggle('is-active', t.getAttribute('data-panel') === panel)
      );
    });
  });

  /* 6) Tabs in settings */
  settingsTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const panel = tab.getAttribute('data-panel');
      activatePanel(panel);

      settingsTabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
    });
  });

  function activatePanel(panelId) {
    const normalizedPanelId = isKnownSettingsPanel(panelId) ? String(panelId).trim() : 'background';
    settingsPanels.forEach((panel) => {
      const id = panel.getAttribute('data-panel-id');
      panel.classList.toggle('is-active', id === normalizedPanelId);
    });
    saveLastSettingsPanel(normalizedPanelId, getWorkspaceViewForPanel(normalizedPanelId));
  }

  function restoreLastSettingsPanel() {
    const panelId = loadLastSettingsPanel();
    const mainView = getWorkspaceViewForPanel(panelId);

    try { showWorkspaceView(mainView); } catch (_) {}
    try { activatePanel(panelId); } catch (_) {}

    const btn = findSidebarButtonForPanel(panelId);
    try { setWorkspaceSidebarActive_(btn); } catch (_) {}

    // Якщо після перезавантаження ми були на "Сайт" або "Сторінки",
    // відновлюємо відповідні менеджери. Для "Дизайн" нічого примусово не відкриваємо.
    if (panelId === 'site') {
      try { window.SiteManager?.openPanel?.(); } catch (_) {}
    }
    if (panelId === 'pages') {
      try { window.PageManager?.openPanel?.(); } catch (_) {}
    }
    if (panelId === 'ai-design') {
      ensureAiDesignPanelReady_();
    }
  }

  // Було: activatePanel('background') — через це після reload завжди відкривався "Фон сайту".
  // Тепер відновлюємо останню головну панель із localStorage.
  restoreLastSettingsPanel();

  /* 7) Settings resizer */
  if (settingsSidebar && settingsResizer) {
    let isDragging = false;
    let startX = 0;
    let startWidth = settingsSidebar.getBoundingClientRect().width;

    const minW = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--builder-settings-min-w'), 10) || 260;
    function getMaxW() {
      // In expanded inspector mode we allow up to 50% of the viewport.
      if (root.classList.contains('builder--inspector-expanded')) {
        return Math.floor(window.innerWidth * 0.5);
      }
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--builder-settings-max-w');
      const px = parseInt(raw, 10);
      return Number.isFinite(px) ? px : 520;
    }

    settingsResizer.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startWidth = settingsSidebar.getBoundingClientRect().width;
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const isLeft = root.classList.contains('builder--side-left');
      const dx = e.clientX - startX;
      let newWidth = isLeft ? (startWidth + dx) : (startWidth - dx);

      if (newWidth < minW) newWidth = minW;
      const maxW = getMaxW();
      if (newWidth > maxW) newWidth = maxW;

      settingsSidebar.style.width = `${newWidth}px`;
      document.documentElement.style.setProperty('--builder-settings-w', `${newWidth}px`);
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.userSelect = '';
    });
  }

  /* 8) Preview toggle */
  previewBtn?.addEventListener('click', () => {
    const on = root.classList.toggle('builder--preview');
    previewBtn.textContent = on ? 'Вигляд конструктора' : 'Попередній перегляд';
  });

  /* 9) View select */
  if (viewSelect) {
    const savedView = localStorage.getItem('builder_view') || 'modern';
    viewSelect.value = savedView;
    root.classList.toggle('builder--view-table', savedView === 'table');

    viewSelect.addEventListener('change', () => {
      const v = viewSelect.value;
      root.classList.toggle('builder--view-table', v === 'table');
      localStorage.setItem('builder_view', v);
    });
  }
}