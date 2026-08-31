// js/design/widgets/templates/templates-gallery-workspace-mode.js
// 00886: one dedicated overlay layer and one workspace owner for Templates Gallery.

const VERSION = '00886-template-gallery-dedicated-overlay-single-owner';

let state = null;
let generation = 0;

function pushLog(event, detail) {
  const name = `template-gallery-workspace:${event}-00886`;
  try { window.__ST_PERF_DIAG__?.push?.(name, detail, 'info'); } catch {}
  try { window.__ST_ALL_LOG__?.push?.(name, detail, 'info'); } catch {}
  try { console.info(`[${name}]`, detail); } catch {}
}

function builderCanvas() {
  return document.querySelector('.builder__canvas') || null;
}

function canvasScroll() {
  return document.querySelector('.builder__canvas > .canvas__scroll')
    || document.querySelector('.canvas__scroll')
    || null;
}

function canvasHeader() {
  return document.querySelector('.builder__canvas > .canvas__header') || null;
}

function canvasView() {
  const scroll = canvasScroll();
  if (!scroll) return document.getElementById('canvasView');
  return Array.from(scroll.children || []).find((el) => el?.id === 'canvasView')
    || scroll.querySelector(':scope > #canvasView')
    || document.getElementById('canvasView');
}

function getOrCreateLayer() {
  const canvas = builderCanvas();
  if (!canvas) return null;

  let layer = document.getElementById('templatesGalleryWorkspaceLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'templatesGalleryWorkspaceLayer';
    layer.className = 'sttpl-workspace-layer';
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    canvas.appendChild(layer);
  } else if (layer.parentElement !== canvas) {
    canvas.appendChild(layer);
  }

  layer.dataset.templateGalleryWorkspace = '00886';
  return layer;
}

export function getTemplateGalleryCanvasScroll() {
  return canvasScroll();
}

export function getTemplateGalleryWorkspaceLayer() {
  return getOrCreateLayer();
}

export function getOrCreateTemplateGalleryView() {
  const layer = getOrCreateLayer();
  if (!layer) return null;

  let view = document.getElementById('templatesGalleryManagerView');
  if (!view) {
    view = document.createElement('div');
    view.id = 'templatesGalleryManagerView';
    view.className = 'sttpl-mgr';
    layer.appendChild(view);
  } else if (view.parentElement !== layer) {
    layer.appendChild(view);
  }

  view.dataset.templateGalleryWorkspace = '00886';
  return view;
}

export function enterTemplatesGalleryWorkspace() {
  const canvas = builderCanvas();
  const scroll = canvasScroll();
  const header = canvasHeader();
  const viewCanvas = canvasView();
  const layer = getOrCreateLayer();
  const gallery = getOrCreateTemplateGalleryView();
  if (!canvas || !layer || !gallery) return null;

  // Idempotent by contract: a re-render may ask for the current view,
  // but it cannot create a second workspace entry or rewrite the saved state.
  if (state?.open === true) return gallery;

  generation += 1;
  state = {
    open: true,
    generation,
    headerVisibility: header?.style?.visibility ?? '',
    headerPointerEvents: header?.style?.pointerEvents ?? '',
    scrollVisibility: scroll?.style?.visibility ?? '',
    scrollPointerEvents: scroll?.style?.pointerEvents ?? '',
    scrollTop: Number(scroll?.scrollTop || 0)
  };

  document.body?.classList.add('st-tpl-gallery-open');
  canvas.dataset.templateGalleryWorkspace = '00886';

  if (header) {
    header.style.visibility = 'hidden';
    header.style.pointerEvents = 'none';
  }
  if (scroll) {
    scroll.style.visibility = 'hidden';
    scroll.style.pointerEvents = 'none';
  }

  layer.hidden = false;
  layer.setAttribute('aria-hidden', 'false');
  layer.style.display = 'flex';

  gallery.hidden = false;
  gallery.style.display = 'flex';

  pushLog('enter', {
    generation: state.generation,
    dedicatedOverlayLayer: true,
    singleOwner: true,
    layerParent: layer.parentElement?.className || layer.parentElement?.id || '',
    galleryParent: gallery.parentElement?.id || '',
    canvasViewInDocumentFlow: viewCanvas ? getComputedStyle(viewCanvas).position !== 'absolute' : false,
    canvasScrollVisibility: scroll ? getComputedStyle(scroll).visibility : '',
    canvasHeaderVisibility: header ? getComputedStyle(header).visibility : '',
    layerDisplay: getComputedStyle(layer).display,
    layerPosition: getComputedStyle(layer).position
  });

  return gallery;
}

export function exitTemplatesGalleryWorkspace(options = {}) {
  const canvas = builderCanvas();
  const scroll = canvasScroll();
  const header = canvasHeader();
  const layer = document.getElementById('templatesGalleryWorkspaceLayer');
  const gallery = document.getElementById('templatesGalleryManagerView');
  const hideView = options.hideView !== false;
  const restoreScroll = options.restoreScroll !== false;
  const closingState = state;

  // Invalidate any pending lazy import/open continuation before restoring Canvas.
  generation += 1;
  state = null;

  document.body?.classList.remove('st-tpl-gallery-open');
  if (canvas) delete canvas.dataset.templateGalleryWorkspace;

  if (closingState) {
    if (header) {
      header.style.visibility = closingState.headerVisibility;
      header.style.pointerEvents = closingState.headerPointerEvents;
    }
    if (scroll) {
      scroll.style.visibility = closingState.scrollVisibility;
      scroll.style.pointerEvents = closingState.scrollPointerEvents;
    }
  } else {
    if (header) {
      header.style.visibility = '';
      header.style.pointerEvents = '';
    }
    if (scroll) {
      scroll.style.visibility = '';
      scroll.style.pointerEvents = '';
    }
  }

  if (gallery && hideView) {
    gallery.hidden = true;
    gallery.style.display = 'none';
  }

  if (layer) {
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    layer.style.display = 'none';
  }

  if (scroll && restoreScroll && closingState) {
    scroll.scrollTop = Number.isFinite(closingState.scrollTop) ? closingState.scrollTop : 0;
  }

  pushLog('exit', {
    closedGeneration: closingState?.generation || 0,
    currentGeneration: generation,
    dedicatedOverlayLayer: true,
    bodyClass: document.body?.classList.contains('st-tpl-gallery-open') === true,
    layerDisplay: layer ? getComputedStyle(layer).display : '',
    galleryDisplay: gallery ? getComputedStyle(gallery).display : '',
    canvasScrollVisibility: scroll ? getComputedStyle(scroll).visibility : '',
    canvasHeaderVisibility: header ? getComputedStyle(header).visibility : ''
  });
}

export function isTemplatesGalleryWorkspaceOpen() {
  return state?.open === true
    && document.body?.classList.contains('st-tpl-gallery-open') === true;
}

export function getTemplatesGalleryWorkspaceGeneration() {
  return state?.open === true ? state.generation : generation;
}

export const TEMPLATE_GALLERY_WORKSPACE_CONTRACT_00886 = Object.freeze({
  version: VERSION,
  exclusiveWorkspace: true,
  dedicatedOverlayLayer: true,
  normalFlowMixing: false,
  canvasViewRemainsOutsideGalleryLayer: true,
  singleOwner: true,
  idempotentEnter: true,
  singleMount: true,
  observers: 0,
  timers: 0,
  retryLoops: 0
});

try {
  window.ST_TEMPLATE_GALLERY_WORKSPACE_00886 = Object.freeze({
    ...TEMPLATE_GALLERY_WORKSPACE_CONTRACT_00886,
    enter: enterTemplatesGalleryWorkspace,
    exit: exitTemplatesGalleryWorkspace,
    isOpen: isTemplatesGalleryWorkspaceOpen,
    getGeneration: getTemplatesGalleryWorkspaceGeneration,
    getLayer: getTemplateGalleryWorkspaceLayer
  });
} catch {}
