import { createStore } from './core/store.js';
import { reducer, initialState, ActionTypes } from './core/reducer.js';
import { createCanPreview } from './scene3d/can-preview.js';
import { initPreviewOrion } from './widgets/preview-orion/preview-orion.js';
import { renderTracks } from './timeline/render-tracks.js';
import { i18n } from './core/i18n.js';

// Phase 1 boot
const root = document.getElementById('st-animator');
const store = createStore({ initialState, reducer });

// Expose (для майбутньої інтеграції в конструктор)
window.ST_ANIMATOR_STORE = store;

// UI refs
const btnToggleSidebar = document.getElementById('btnToggleSidebar');
const btnToggleInspector = document.getElementById('btnToggleInspector');
const btnResetLayout = document.getElementById('btnResetLayout');
const sidebarEl = document.getElementById('sidebar');
const inspectorEl = document.getElementById('inspector');
const splitter = document.getElementById('splitter');
const centerSplit = document.getElementById('centerSplit');

const previewMount = document.getElementById('previewMount');
const btnEnv = document.getElementById('btnEnv');

const rotSlider = document.getElementById('rotSlider');
const camZSlider = document.getElementById('camZSlider');
const camXSlider = document.getElementById('camXSlider');
const camYSlider = document.getElementById('camYSlider');
const scaleSlider = document.getElementById('scaleSlider');

const selLabel = document.getElementById('selLabel');
const layersList = document.getElementById('layersList');

const btnPlay = document.getElementById('btnPlay');
const btnReverse = document.createElement('button');
btnReverse.id='btnReverse';
btnReverse.className='btn';
btnReverse.innerHTML='⟲';
btnReverse.title='Reverse Play';
btnPlay.parentElement.appendChild(btnReverse);

const btnToStart = document.createElement('button');
btnToStart.id='btnToStart';
btnToStart.className='btn';
btnToStart.innerHTML='⏮';
btnToStart.title='Go to Start';
btnPlay.parentElement.prepend(btnToStart);

const btnStop = document.getElementById('btnStop');
const timeLabel = document.getElementById('timeLabel');


function formatTimeChip(seconds){
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const mm = Math.floor(totalMs / 60000);
  const ss = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const mmStr = String(mm).padStart(2,'0');
  const ssStr = String(ss).padStart(2,'0');
  const msStr = String(ms).padStart(3,'0');
  return `${mmStr}:${ssStr}.${msStr}`;
}

function setBtnText(btn, text){
  if(!btn) return;
  const span = btn.querySelector('.btnText');
  if(span){ span.textContent = text; return; }
  btn.textContent = text;
}

const tracksMount = document.getElementById('tracks');
const timelineMain = document.getElementById('timelineMain');
const timelineTools = document.getElementById('timelineHeaderTools');
const timelineInterpSelect = document.getElementById('timelineInterpSelect');
const timelineKfEmpty = document.getElementById('timelineKfEmpty');
const timelineKfMeta = document.getElementById('timelineKfMeta');
const timelineKfLabel = document.getElementById('timelineKfLabel');

// Remove legacy playhead element (old scrubber)
try { document.getElementById('playhead')?.remove?.(); } catch {}

const timelineInterpField = document.getElementById('timelineInterpField');
const btnToggleTimeline = document.getElementById('btnToggleTimeline');
const timelineEl = document.getElementById('timeline');
const timelineResizerEl = document.getElementById('timelineResizer');
const zoomLabel = document.getElementById('zoomLabel');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');

// 2.5-A: keyframe editor (Inspector)
const keyframeEditor = document.getElementById('keyframeEditor');
const keyframeEmptyHint = document.getElementById('keyframeEmptyHint');
const kfSelectedLabel = document.getElementById('kfSelectedLabel');
const kfTimeInput = document.getElementById('kfTimeInput');
const kfValueInput = document.getElementById('kfValueInput');
const kfInterpSelect = document.getElementById('kfInterpSelect');

// settings / language
const settingsWrap = document.getElementById('settingsWrap');
const btnSettings = document.getElementById('btnSettings');
const settingsMenu = document.getElementById('settingsMenu');
const langSelect = document.getElementById('langSelect');

// play runtime state (Phase 1)
let playing = false;
let lastT = 0;

// init 3D preview
const preview = createCanPreview({
  mountEl: previewMount,
  labelUrl: './assets/label.png'
});


initPreviewOrion({
  mountEl: previewStage,
  footerLeftEl: previewFooterLeft,
  footerRightEl: previewFooterRight
});

// i18n init (auto-discover languages)
// IMPORTANT:
// - default language must be Ukrainian
// - localStorage is shared on the same origin (127.0.0.1:5500), so old builds may keep EN.
//   We reset to UK when build id changes.
const BUILD_ID = 'phase2-2_5B-camX';
const prevBuild = localStorage.getItem('st_animator_build');
let savedLang = localStorage.getItem('st_animator_lang') || undefined;
if (prevBuild !== BUILD_ID) {
  savedLang = 'uk';
  localStorage.setItem('st_animator_build', BUILD_ID);
  localStorage.setItem('st_animator_lang', savedLang);
}
await i18n.init(savedLang || 'uk');

// build language dropdown (auto)
function rebuildLangMenu(){
  const list = i18n.getLanguages();
  langSelect.innerHTML = '';
  for (const l of list){
    const o = document.createElement('option');
    o.value = l.code;
    o.textContent = l.name || l.code;
    langSelect.appendChild(o);
  }
  langSelect.value = i18n.getCurrent();
}
rebuildLangMenu();

function applyLanguageToUI(){
  // translate static labels
  i18n.applyToDom(document);
  // update document title + lang
  document.documentElement.setAttribute('lang', i18n.getCurrent());
  document.title = i18n.t('doc.title');
}
applyLanguageToUI();

// react on i18n changes
i18n.subscribe(() => {
  rebuildLangMenu();
  applyLanguageToUI();
  renderAll();
});

// --- Timeline right mini sidebar (Tools)
// Goal: keep timeline list super reliable (no nested dropdowns inside rows),
// and move quick actions into a dedicated UI zone (like in video editors).
(function initTimelineSide(){
  if (!timelineTools) return;

  function clearActiveTool(){
    timelineTools.querySelectorAll('.iconBtn.isActive').forEach(b => b.classList.remove('isActive'));
  }
  function focusTrack(id){
    document.querySelectorAll('.track.isFocused').forEach(el => el.classList.remove('isFocused'));
    if (!id) return;
    const el = document.querySelector(`.track[data-track-id="${CSS.escape(id)}"]`);
    if (!el) return;
    el.classList.add('isFocused');
    // Scroll + focus (without breaking scroll smoothness)
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    el.tabIndex = -1;
    try { el.focus({ preventScroll: true }); } catch {}
  }

  // Track jump buttons
  timelineTools.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-track-jump]');
    if (!btn) return;
    const id = String(btn.getAttribute('data-track-jump') || '');
    if (!id) return;
    clearActiveTool();
    btn.classList.add('isActive');
    focusTrack(id);
  });

  // Quick interpolation control (mirrors Inspector logic)
  if (timelineInterpSelect) {
    timelineInterpSelect.addEventListener('change', () => {
      const st = store.getState();
      const sel = getSelectedKeyframe(st);
      if (!sel) return;
      store.dispatch({ type: 'UPDATE_KEYFRAME_BY_ID', trackId: sel.trackId, keyframeId: sel.keyframeId, patch: { interp: String(timelineInterpSelect.value || 'linear') } });
    });
  }
})();

// --- 2.5-A: Keyframe editor bindings
function getSelectedKeyframe(st){
  const sel = st.timeline && st.timeline.selectedKeyframe;
  if (!sel) return null;
  const tr = st.timeline.tracks?.[sel.trackId];
  if (!tr) return null;
  const kfs = Array.isArray(tr.keyframes) ? tr.keyframes : [];
  const kf = kfs.find(k => k && k.id === sel.keyframeId) || null;
  return kf ? { trackId: sel.trackId, keyframeId: sel.keyframeId, kf } : null;
}

function clamp01(v){ return Math.max(0, Math.min(1, Number(v))); }

kfTimeInput.addEventListener('change', () => {
  const st = store.getState();
  const sel = getSelectedKeyframe(st);
  if (!sel) return;
  const timeSec = Number(kfTimeInput.value);
  const t01 = clamp01(timeSec / (st.project.duration || 1));
  store.dispatch({ type: 'UPDATE_KEYFRAME_BY_ID', trackId: sel.trackId, keyframeId: sel.keyframeId, patch: { t: t01 } });
  store.dispatch({ type: 'SET_TIME', time: t01 * st.project.duration });
});

kfValueInput.addEventListener('change', () => {
  const st = store.getState();
  const sel = getSelectedKeyframe(st);
  if (!sel) return;
  store.dispatch({ type: 'UPDATE_KEYFRAME_BY_ID', trackId: sel.trackId, keyframeId: sel.keyframeId, patch: { v: Number(kfValueInput.value) } });
});

// 2.5-B: per-keyframe interpolation (controls segment starting at this keyframe)
kfInterpSelect.addEventListener('change', () => {
  const st = store.getState();
  const sel = getSelectedKeyframe(st);
  if (!sel) return;
  store.dispatch({ type: 'UPDATE_KEYFRAME_BY_ID', trackId: sel.trackId, keyframeId: sel.keyframeId, patch: { interp: String(kfInterpSelect.value || 'linear') } });
});

// ---- Timeline resizer (drag the bar above timeline)

// ---- Timeline layout helpers
const DEFAULT_TIMELINE_H = 240; // px
function setTimelineHeight(px){
  const h = Math.max(120, Math.min(px, Math.floor(window.innerHeight * 0.85)));
  root.style.setProperty('--timeline-h', `${h}px`);
  store.dispatch({ type: ActionTypes.SET_UI, patch: { timelineHeight: h } });
}
function setTimelineHidden(hidden){
  root.classList.toggle('timelineHidden', !!hidden);
  store.dispatch({ type: ActionTypes.SET_UI, patch: { timelineHidden: !!hidden } });
}


(function initTimelineResizer(){
  // initial height
  const st = store.getState();
  const initialH = Number(st.ui.timelineHeight || DEFAULT_TIMELINE_H);
  root.style.setProperty('--timeline-h', `${initialH}px`);
  if (st.ui.timelineHidden) root.classList.add('timelineHidden');

  let dragging = false;
  let startY = 0;
  let startH = 0;

  function onMove(e){
    if (!dragging) return;
    const dy = e.clientY - startY;
    const next = startH - dy; // move up => increase height
    setTimelineHidden(false);
    setTimelineHeight(next);
  }
  function onUp(){
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('noSelect');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }

  timelineResizerEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const st2 = store.getState();
    if (st2.ui.timelineHidden) {
      setTimelineHidden(false);
      setTimelineHeight(DEFAULT_TIMELINE_H);
    }
    dragging = true;
    startY = e.clientY;
    // compute current height from CSS variable or state
    const cur = parseInt(getComputedStyle(root).getPropertyValue('--timeline-h')) || Number(st2.ui.timelineHeight || DEFAULT_TIMELINE_H);
    startH = cur;
    document.body.classList.add('noSelect');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  // double click -> reset
  timelineResizerEl.addEventListener('dblclick', () => {
    setTimelineHidden(false);
    setTimelineHeight(DEFAULT_TIMELINE_H);
  });
})();

// Timeline scrubbing (playhead) + click/drag to change time
function initTimelineScrub(){
  const bodyEl = document.getElementById('timelineBody');
  const tracksEl = document.getElementById('tracks');
  const playheadEl = document.getElementById('playhead');
  if (!bodyEl || !tracksEl || !playheadEl) return;

  const clamp01 = (x)=>Math.max(0, Math.min(1, x));
  const clamp = (x,a,b)=>Math.max(a, Math.min(b, x));

  function setTimeFromClientX(clientX){
    const rect = tracksEl.getBoundingClientRect();
    const x = clientX - rect.left + bodyEl.scrollLeft; // include scroll
    const w = Math.max(1, tracksEl.scrollWidth);
    const tn = clamp01(x / w);
    const st = store.getState();
    const dur = st.project.duration || 1;
    store.dispatch({ type: ActionTypes.SET_TIME, time: tn * dur });
  }

  function updatePlayhead(){
    const st = store.getState();
    const dur = st.project.duration || 1;
    const tn = clamp01((st.project.time || 0) / dur);
    const w = Math.max(1, tracksEl.scrollWidth);
    const x = tn * w;
    playheadEl.style.transform = `translateX(${x}px)`;
  }

  // click anywhere on timeline to jump
  bodyEl.addEventListener('mousedown', (e) => {
    // ignore if clicking on inputs/buttons inside tracks
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.button !== 0) return;
    setTimeFromClientX(e.clientX);

    // drag scrub
    const onMove = (ev)=>setTimeFromClientX(ev.clientX);
    const onUp = ()=>{
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  // mouse wheel over timeline -> scrub time
  bodyEl.addEventListener('wheel', (e)=>{
    // Shift = horizontal scroll (keep default)
    if (e.shiftKey) return;
    e.preventDefault();
    const st = store.getState();
    const dur = st.project.duration || 1;
    const speed = dur / 1200; // tune
    const next = clamp((st.project.time || 0) + e.deltaY * speed, 0, dur);
    store.dispatch({ type: ActionTypes.SET_TIME, time: next });
  }, { passive:false });

  // keep playhead synced
  store.subscribe(updatePlayhead);
  updatePlayhead();
}

// timeline tracks UI (uses t)
const tracksUI = renderTracks({ mountEl: tracksMount, store, t: i18n.t });

// initTimelineScrub(); // disabled (new Window+Train timeline handles scrubbing)
// re-render timeline texts on language switch
i18n.subscribe(() => { try{ tracksUI.render(); }catch{} });


// --------- evaluator (Phase 1: keyframes) ---------
function evalTrack(track, t){
  const kfs = (track && track.keyframes) ? track.keyframes.slice().sort((a,b)=>a.t-b.t) : [];
  if (!kfs.length) return 0;
  if (t <= kfs[0].t) return Number(kfs[0].v)||0;
  if (t >= kfs[kfs.length-1].t) return Number(kfs[kfs.length-1].v)||0;

  for (let i=0;i<kfs.length-1;i++){
    const a = kfs[i], b = kfs[i+1];
    if (t >= a.t && t <= b.t){
      const span = (b.t - a.t) || 1;
      const segT = (t - a.t) / span;
      // 2.5-B: interpolation is stored per keyframe (outgoing segment)
      const mode = (a && a.interp) ? a.interp : (track.easing || 'linear');
      if (mode === 'hold' || mode === 'step') return Number(a.v)||0;
      const eased = applyEasing(mode, segT);
      return lerp(Number(a.v)||0, Number(b.v)||0, eased);
    }
  }
  return Number(kfs[kfs.length-1].v)||0;
}

function applyEasing(name, x){
  const t = clamp(x,0,1);
  if (!name || name === 'linear') return t;
  if (name === 'easeOutQuad') return 1 - (1-t)*(1-t);
  if (name === 'easeInQuad') return t*t;
  if (name === 'easeInOutQuad') return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
  if (name === 'easeInOutCubic') return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  if (name === 'easeInCubic') return t*t*t;
  if (name === 'easeOutCubic') return 1 - Math.pow(1-t,3);
  // default: easeInOutCubic
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}

function lerp(a,b,t){ return a + (b-a)*t; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, Number(v))); }

function applyTimelineAtCurrentTime(){
  const st = store.getState();
  const dur = st.project.duration || 1;
  const t = clamp((st.project.time / dur) || 0, 0, 1);

  const tr = st.timeline.tracks;
  const rotationY = evalTrack(tr.rotationY, t);
  const cameraZ   = evalTrack(tr.cameraZ,   t);
  const cameraY   = evalTrack(tr.cameraY,   t);
  const cameraX   = evalTrack(tr.cameraX,   t);
  const scale     = evalTrack(tr.scale,     t);

  store.dispatch({
    type: ActionTypes.SET_CAN_PARAMS,
    patch: { rotationY, cameraZ, cameraY, cameraX, scale }
  });
}

// --------- bindings: store -> UI & preview ---------
function renderAll(){
  const st = store.getState();

  // play button label should follow runtime state (even after language switch)
  setBtnText(btnPlay, playing ? i18n.t('header.pause') : i18n.t('header.play'));

  // layout classes
  root.classList.toggle('is-sidebar-collapsed', !!st.ui.sidebarCollapsed);
  root.classList.toggle('is-inspector-collapsed', !!st.ui.inspectorCollapsed);

  // inspector width
  const w = clamp(st.ui.inspectorWidth || 380, 240, 720);
  if (!st.ui.inspectorCollapsed) {
    centerSplit.style.gridTemplateColumns = `${w}px 8px 1fr`;
  }

  // time label
  timeLabel.textContent = formatTimeChip(st.project.time);

  // env label
  btnEnv.textContent = `${i18n.t('preview.env')}: ${st.scene.envEnabled ? i18n.t('preview.on') : i18n.t('preview.off')}`;

  // selection
  const sel = st.scene.selectedObjectId;
  selLabel.textContent = sel ? sel : i18n.t('inspector.none');

  // --- 2.5-A: keyframe inspector
  const selKf = getSelectedKeyframe(st);
  if (selKf) {
    keyframeEditor.classList.add('isVisible');
    keyframeEmptyHint.classList.add('isHidden');
    const trackLabelKey = `track.${selKf.trackId}`;
    const trackLabel = i18n.t(trackLabelKey);
    kfSelectedLabel.textContent = `${trackLabel}`;
    kfTimeInput.value = String(Math.round((selKf.kf.t * st.project.duration) * 1000) / 1000);
    kfValueInput.value = String(Math.round((Number(selKf.kf.v) || 0) * 1000) / 1000);
    if (kfInterpSelect) {
      const fallback = (st.timeline.tracks[selKf.trackId] && st.timeline.tracks[selKf.trackId].easing) ? st.timeline.tracks[selKf.trackId].easing : 'easeInOutCubic';
      kfInterpSelect.value = selKf.kf.interp || fallback;
    }
  } else {
    keyframeEditor.classList.remove('isVisible');
    keyframeEmptyHint.classList.remove('isHidden');
    kfSelectedLabel.textContent = '—';
  }

  // --- Timeline right sidebar: quick keyframe controls
  if (timelineKfEmpty && timelineKfMeta && timelineInterpField) {
    if (selKf) {
      timelineKfEmpty.style.display = 'none';
      timelineKfMeta.style.display = '';
      timelineInterpField.style.display = '';
      const trackLabelKey = `track.${selKf.trackId}`;
      const trackLabel = i18n.t(trackLabelKey);
      if (timelineKfLabel) timelineKfLabel.textContent = `${trackLabel}`;
      if (timelineInterpSelect) {
        const fallback = (st.timeline.tracks[selKf.trackId] && st.timeline.tracks[selKf.trackId].easing) ? st.timeline.tracks[selKf.trackId].easing : 'easeInOutCubic';
        timelineInterpSelect.value = selKf.kf.interp || fallback;
      }
    } else {
      timelineKfEmpty.style.display = '';
      timelineKfMeta.style.display = 'none';
      timelineInterpField.style.display = 'none';
      if (timelineKfLabel) timelineKfLabel.textContent = '—';
    }
  }

  // layers (Phase 2.1 base: visible/locked toggles)
  layersList.innerHTML = '';

  const mkBtn = (text, title) => {
    const b = document.createElement('button');
    b.className = 'mini';
    b.textContent = text;
    if (title) b.title = title;
    return b;
  };

  for (const id of st.scene.order) {
    const obj = st.scene.objects[id];
    if (!obj) continue;

    const row = document.createElement('div');
    row.className = 'layerRow' + (id === sel ? ' active' : '');

    const nameBtn = document.createElement('button');
    nameBtn.className = 'layerName';
    nameBtn.textContent = obj.name || id;
    nameBtn.addEventListener('click', () => store.dispatch({ type: ActionTypes.SET_SELECTED, id }));

    const visBtn = mkBtn(obj.visible ? '👁' : '🚫', i18n.t('layers.visible'));
    visBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.dispatch({ type: ActionTypes.TOGGLE_OBJECT_VISIBLE, id });
    });

    const lockBtn = mkBtn(obj.locked ? '🔒' : '🔓', i18n.t('layers.locked'));
    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.dispatch({ type: ActionTypes.TOGGLE_OBJECT_LOCKED, id });
    });

    const right = document.createElement('div');
    right.className = 'layerBtns';
    right.appendChild(visBtn);
    right.appendChild(lockBtn);

    row.appendChild(nameBtn);
    row.appendChild(right);
    layersList.appendChild(row);
  }

  // sliders reflect state
  rotSlider.value = String(st.scene.canParams.rotationY);
  camZSlider.value = String(st.scene.canParams.cameraZ);
  camXSlider.value = String(st.scene.canParams.cameraX ?? 0);
  camYSlider.value = String(st.scene.canParams.cameraY);
  scaleSlider.value = String(st.scene.canParams.scale);

  // disable controls if selected is locked
  const selObj = sel ? st.scene.objects[sel] : null;
  const locked = !!selObj?.locked;
  rotSlider.disabled = locked;
  camZSlider.disabled = locked;
  camXSlider.disabled = locked;
  camYSlider.disabled = locked;
  scaleSlider.disabled = locked;

  // preview reflect state
  preview.setEnvEnabled(st.scene.envEnabled);

  // show/hide the can (for now we have a single-can preview)
  const can = Object.values(st.scene.objects).find(o => o.type === 'can') || null;
  preview.setVisible(can ? !!can.visible : false);

  preview.setRotationY(st.scene.canParams.rotationY);
  preview.setCamera({ x: st.scene.canParams.cameraX ?? 0, y: st.scene.canParams.cameraY, z: st.scene.canParams.cameraZ, lookY: 1.15 });
  preview.setScale(st.scene.canParams.scale);

  // zoom
  zoomLabel.textContent = `${i18n.t('timeline.zoom')}: ${st.ui.zoom.toFixed(2)}x`;
}

store.subscribe((st, action) => {
  // при зміні часу — оновлюємо параметри з таймлайну
  if (action && action.type === ActionTypes.SET_TIME) {
    applyTimelineAtCurrentTime();
  }
  renderAll();
});
renderAll();

// --------- UI events ---------
// Settings menu toggle
function closeSettings(){
  if (!settingsMenu) return;
  settingsMenu.hidden = true;
}
function toggleSettings(){
  if (!settingsMenu) return;
  settingsMenu.hidden = !settingsMenu.hidden;
}

btnSettings?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSettings();
});
document.addEventListener('pointerdown', (e) => {
  if (!settingsMenu || settingsMenu.hidden) return;
  if (settingsWrap?.contains(e.target)) return;
  closeSettings();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSettings();
});

langSelect?.addEventListener('change', async () => {
  const code = langSelect.value;
  await i18n.load(code);
  localStorage.setItem('st_animator_lang', i18n.getCurrent());
});

btnToggleSidebar.addEventListener('click', () => {
  const st = store.getState();
  store.dispatch({ type: ActionTypes.SET_UI, patch: { sidebarCollapsed: !st.ui.sidebarCollapsed } });
});
btnToggleInspector.addEventListener('click', () => {
  const st = store.getState();
  store.dispatch({ type: ActionTypes.SET_UI, patch: { inspectorCollapsed: !st.ui.inspectorCollapsed } });
});

btnToggleTimeline.addEventListener('click', () => {
  const st = store.getState();
  const hidden = !st.ui.timelineHidden;
  if (hidden){
    setTimelineHidden(true);
  } else {
    setTimelineHidden(false);
    // always restore to default height when showing
    setTimelineHeight(DEFAULT_TIMELINE_H);
  }
});

btnResetLayout.addEventListener('click', () => {
  store.dispatch({ type: ActionTypes.SET_UI, patch: { sidebarCollapsed: false, inspectorCollapsed: false, inspectorWidth: 380 } });
});

btnEnv.addEventListener('click', () => {
  const st = store.getState();
  store.dispatch({ type: ActionTypes.SET_ENV_ENABLED, enabled: !st.scene.envEnabled });
});


function bindSlider(el, key){
  el.addEventListener('input', () => {
    store.dispatch({ type: ActionTypes.SET_CAN_PARAMS, patch: { [key]: Number(el.value) } });
  });
}
bindSlider(rotSlider, 'rotationY');
bindSlider(camZSlider, 'cameraZ');
bindSlider(camXSlider, 'cameraX');
bindSlider(camYSlider, 'cameraY');
bindSlider(scaleSlider, 'scale');

// --------- resizer (inspector width) ---------
let resizing = false;
let startX = 0;
let startW = 380;

splitter.addEventListener('pointerdown', (e) => {
  const st = store.getState();
  if (st.ui.inspectorCollapsed) return;
  resizing = true;
  startX = e.clientX;
  startW = st.ui.inspectorWidth || 380;
  splitter.setPointerCapture(e.pointerId);
});

splitter.addEventListener('pointermove', (e) => {
  if (!resizing) return;
  const dx = e.clientX - startX;
  const next = clamp(startW + dx, 240, 720);
  store.dispatch({ type: ActionTypes.SET_UI, patch: { inspectorWidth: next } });
});

splitter.addEventListener('pointerup', () => { resizing = false; });

// --------- play runtime ---------
function loop(now){
  if (!playing) return;
  requestAnimationFrame(loop);
  const st = store.getState();
  if (!lastT) lastT = now;
  const dt = (now - lastT) / 1000;
  lastT = now;
  const next = st.project.time + dt;
  store.dispatch({ type: ActionTypes.SET_TIME, time: next });
  if (next >= st.project.duration) {
    playing = false;
    setBtnText(btnPlay, i18n.t('header.play'));
  }
}

btnPlay.addEventListener('click', () => {
  const st = store.getState();
  if (!playing) {
    if (st.project.time >= st.project.duration) {
      store.dispatch({ type: ActionTypes.SET_TIME, time: 0 });
    }
    playing = true;
    lastT = 0;
    setBtnText(btnPlay, i18n.t('header.pause'));
    requestAnimationFrame(loop);
  } else {
    playing = false;
    setBtnText(btnPlay, i18n.t('header.play'));
  }
});

btnStop.addEventListener('click', () => {
  playing = false;
  setBtnText(btnPlay, i18n.t('header.play'));
  store.dispatch({ type: ActionTypes.SET_TIME, time: 0 });
});

btnZoomIn.addEventListener('click', () => {
  const st = store.getState();
  store.dispatch({ type: ActionTypes.SET_ZOOM, zoom: st.ui.zoom + 0.1 });
});
btnZoomOut.addEventListener('click', () => {
  const st = store.getState();
  store.dispatch({ type: ActionTypes.SET_ZOOM, zoom: st.ui.zoom - 0.1 });
});

// Phase 1 demo: колесо над preview -> час
previewMount.addEventListener('wheel', (e) => {
  e.preventDefault();
  const st = store.getState();
  const step = (e.deltaY > 0 ? 1 : -1) * 0.06;
  store.dispatch({ type: ActionTypes.SET_TIME, time: st.project.time + step });
}, { passive: false });

// init: add one can by default
store.dispatch({ type: ActionTypes.ADD_OBJECT, object: { id: 'can_main', type: 'can', name: `${i18n.t('objects.can')} (main)` } });
applyTimelineAtCurrentTime();

// Go to start
btnToStart.addEventListener('click', ()=>{
  store.dispatch({ type:'SET_TIME', time:0 });
});

// Reverse play
let reversePlaying = false;
btnReverse.addEventListener('click', ()=>{
  reversePlaying = !reversePlaying;
  playing = false;
});
