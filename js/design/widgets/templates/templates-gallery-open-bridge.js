import {
  enterTemplatesGalleryWorkspace,
  getOrCreateTemplateGalleryView,
  getTemplatesGalleryWorkspaceGeneration,
  isTemplatesGalleryWorkspaceOpen
} from './templates-gallery-workspace-mode.js';

// js/design/widgets/templates/templates-gallery-open-bridge.js
// 00886: one lazy import, one real open, no retry/open loop.

let galleryApiPromise = null;
let openRequest = 0;

const TITLE_BY_TAB = {
  site: 'Сайт',
  page: 'Сторінка',
  header: 'Шапка',
  main: 'Main',
  footer: 'Футер',
  'section-styles': 'Стилі Секцій',
  sections: 'Секції',
  shop: 'Магазин',
  'photo-gallery': 'Фото-галерея',
  'ai-templates': 'АІ шаблони',
  menu: 'Меню',
  sidebar: 'Сайтбар'
};

function normalizeTab(tab) {
  const value = String(tab || 'site').trim();
  return value || 'site';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pushLog(event, detail, level = 'info') {
  const name = `template-gallery-open-bridge:${event}-00886`;
  try { window.__ST_PERF_DIAG__?.push?.(name, detail, level); } catch {}
  try { window.__ST_ALL_LOG__?.push?.(name, detail, level); } catch {}
  try { (level === 'warn' ? console.warn : console.info)(`[${name}]`, detail); } catch {}
}

function renderOpeningShell(tab, phase = 'loading', note = '') {
  enterTemplatesGalleryWorkspace();
  const view = getOrCreateTemplateGalleryView();
  if (!view) return null;

  const title = TITLE_BY_TAB[normalizeTab(tab)] || normalizeTab(tab);
  const isError = phase === 'error';
  view.className = 'sttpl-mgr is-loading sttpl-mgr--opening';
  view.dataset.openingPhase = phase;
  view.hidden = false;
  view.style.display = 'flex';
  view.innerHTML = `
    <div class="sttpl-openingShell" role="status" aria-live="polite">
      <div class="sttpl-openingShell__card ${isError ? 'is-error' : ''}">
        <div class="sttpl-openingShell__scan" aria-hidden="true"></div>
        <div class="sttpl-openingShell__grid" aria-hidden="true"></div>
        <div class="sttpl-openingShell__top">
          <div class="sttpl-openingShell__brand">
            <span class="sttpl-openingShell__brandDot"></span>
            <span>ShiftTime Template Core</span>
          </div>
          <div class="sttpl-openingShell__phase">${isError ? 'ERROR' : 'LOADING'}</div>
        </div>
        <div class="sttpl-openingShell__body">
          <div class="sttpl-openingShell__orbWrap" aria-hidden="true">
            <div class="sttpl-openingShell__orb">
              <div class="sttpl-openingShell__orbRing"></div>
              <div class="sttpl-openingShell__orbCore">
                <strong>${isError ? '!' : '∞'}</strong>
                <span>${isError ? 'STOP' : 'LOAD'}</span>
              </div>
              <i class="sttpl-openingShell__satellite sttpl-openingShell__satellite--a"></i>
              <i class="sttpl-openingShell__satellite sttpl-openingShell__satellite--b"></i>
              <i class="sttpl-openingShell__satellite sttpl-openingShell__satellite--c"></i>
            </div>
          </div>
          <div class="sttpl-openingShell__content">
            <div class="sttpl-openingShell__tabBadge">Вкладка: <b>${escapeHtml(title)}</b></div>
            <div class="sttpl-openingShell__title">${isError ? 'Галерея не відкрилась' : 'Відкриваю галерею шаблонів'}</div>
            <div class="sttpl-openingShell__text">
              ${isError
                ? 'Не вдалося відкрити вкладку. Закрий галерею та повтори дію.'
                : 'Завантажую модуль і виконую один остаточний render.'}
              ${note ? '<br><br>' + escapeHtml(note) : ''}
            </div>
            <div class="sttpl-openingShell__pipeline">
              <span class="is-done">Bridge</span>
              <span class="is-active">Lazy import</span>
              <span>Render</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return view;
}

function getGalleryApi() {
  if (!galleryApiPromise) galleryApiPromise = import('./gallery/templates-gallery-view.js?v=01050');
  return galleryApiPromise;
}

function galleryStructureReady() {
  const view = document.getElementById('templatesGalleryManagerView');
  if (!view || view.hidden || getComputedStyle(view).display === 'none') return false;
  return !!view.querySelector('.sttpl-mgr__bar')
    && !!view.querySelector('.sttpl-mgr__layout')
    && !!view.querySelector('.sttpl-mgr__rightPane');
}

export async function openTemplatesGalleryManager(tab = 'site', options = {}) {
  const targetTab = normalizeTab(tab);
  const request = ++openRequest;
  renderOpeningShell(targetTab, 'loading');
  const generation = getTemplatesGalleryWorkspaceGeneration();

  pushLog('request', {
    request,
    generation,
    tab: targetTab,
    mainReplaceTargetId: targetTab === 'main' ? String(options?.mainReplaceTargetId || '') : '',
    styleSelectionArea: targetTab === 'section-styles' ? String(options?.styleSelectionArea || '') : '',
    singleRealOpen: true,
    retryLoop: false
  });

  try {
    const mod = await getGalleryApi();
    if (request !== openRequest) return false;
    if (!isTemplatesGalleryWorkspaceOpen()) return false;
    if (getTemplatesGalleryWorkspaceGeneration() !== generation) return false;
    if (!mod || typeof mod.openTemplatesGalleryManager !== 'function') {
      throw new Error('openTemplatesGalleryManager export not found');
    }

    // The heavy view renders synchronously. One call is the sole authority.
    mod.openTemplatesGalleryManager(targetTab, options || {});

    const ready = galleryStructureReady();
    pushLog('opened', {
      request,
      generation,
      tab: targetTab,
      mainReplaceTargetId: targetTab === 'main' ? String(options?.mainReplaceTargetId || '') : '',
      styleSelectionArea: targetTab === 'section-styles' ? String(options?.styleSelectionArea || '') : '',
      ready,
      realOpenCalls: 1,
      retryLoop: false
    }, ready ? 'info' : 'warn');

    if (!ready && isTemplatesGalleryWorkspaceOpen()) {
      renderOpeningShell(targetTab, 'error', 'Структурний render не створив основну розмітку галереї.');
    }
    return ready;
  } catch (error) {
    if (request !== openRequest || !isTemplatesGalleryWorkspaceOpen()) return false;
    const message = error?.message ? String(error.message) : 'Помилка імпорту модуля.';
    pushLog('error', { request, generation, tab: targetTab, message }, 'warn');
    renderOpeningShell(targetTab, 'error', message);
    return false;
  }
}

export function cancelTemplatesGalleryOpen() {
  openRequest += 1;
  pushLog('cancel', { request: openRequest, retryLoop: false });
}

// 01015: the bridge owns the one and only gallery module instance.
// Opening and click routing MUST resolve through the same galleryApiPromise;
// otherwise ES module query-string cache keys create separate activeTab/selection state.
export async function handleTemplatesGalleryManagerClick(event) {
  const mod = await getGalleryApi();
  if (!mod || typeof mod.handleTemplatesGalleryManagerClick !== 'function') return false;
  mod.handleTemplatesGalleryManagerClick(event);
  return true;
}

export const openTemplatesGalleryWithBridge = openTemplatesGalleryManager;

export const TEMPLATE_GALLERY_OPEN_BRIDGE_CONTRACT_00886 = Object.freeze({
  singleOwner: true,
  singleGalleryModuleInstance01015: true,
  lazyImportCalls: 1,
  realOpenCalls: 1,
  retryLoops: 0,
  delayedReopen: false,
  emptyGalleryIsValid: true
});

try {
  window.ST_OPEN_TEMPLATES_GALLERY = openTemplatesGalleryManager;
  window.ST_CANCEL_TEMPLATES_GALLERY_OPEN_00886 = cancelTemplatesGalleryOpen;
  window.ST_TEMPLATE_GALLERY_OPEN_BRIDGE_00886 = TEMPLATE_GALLERY_OPEN_BRIDGE_CONTRACT_00886;
} catch {}
