// timeline/render-tracks.js
// Window + Train Timeline UI (virtual time, no layout stretching)
// Integrates with existing store/reducer without changing core logic.

import { ActionTypes } from '../core/reducer.js';

export function renderTracks({ mountEl, store, t }) {
  if (!mountEl) return { render(){}, destroy(){} };

  const view = {
    startSec: 0,
    secondsVisible: 6,
    maxSec: 3600
  };

  let rafRender = 0;

  // DOM refs
  let rootEl, rulerViewport, rulerCanvas, lanesViewport, rangeEl, playheadEl, playheadGlobalEl;
  const laneElsByTrack = new Map(); // trackId -> lane viewport div

  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

  function getDurationSec(){
    const st = store.getState();
    const d = Number(st?.project?.duration || 0);
    // hard cap for this widget: 1 hour
    return clamp(isFinite(d) && d > 0 ? d : 3600, 0.001, 3600);
  }

  function ensureViewBounds(){
    const dur = getDurationSec();
    view.maxSec = dur;
    view.secondsVisible = clamp(view.secondsVisible, 6, dur);
    view.startSec = clamp(view.startSec, 0, Math.max(0, dur - view.secondsVisible));
    if (rangeEl){
      rangeEl.max = String(Math.max(0, dur - view.secondsVisible));
      rangeEl.value = String(view.startSec);
    }
  }

  function fmtTime(sec){
    sec = Math.max(0, Number(sec) || 0);
    const m = Math.floor(sec / 60);
    const s = sec - m*60;
    if (m > 0){
      const ss = String(Math.floor(s)).padStart(2,'0');
      const ms = String(Math.floor((s - Math.floor(s)) * 1000)).padStart(3,'0');
      return `${m}:${ss}.${ms}`;
    }
    return `${Math.round(sec*1000)/1000}s`;
  }

  function build(){
    mountEl.innerHTML = '';
    rootEl = document.createElement('div');
    rootEl.className = 'wtTimeline';

    // Global playhead line (goes through ruler + all lanes)
    playheadGlobalEl = document.createElement('div');
    playheadGlobalEl.className = 'wtPlayheadGlobal';
    rootEl.appendChild(playheadGlobalEl);

    // grid (ruler + lanes)
    const grid = document.createElement('div');
    grid.className = 'wtGrid';

    // Ruler row
    const spacer = document.createElement('div');
    spacer.className = 'wtSpacer';
    spacer.textContent = '';

    const rulerCell = document.createElement('div');
    rulerCell.className = 'wtRulerCell';

    rulerViewport = document.createElement('div');
    rulerViewport.className = 'wtRulerViewport';

    rulerCanvas = document.createElement('canvas');
    rulerCanvas.className = 'wtRulerCanvas';
    rulerCanvas.width = 10;
    rulerCanvas.height = 10;

    playheadEl = document.createElement('div');
    playheadEl.className = 'wtPlayhead';
    playheadEl.title = 'Playhead';

    rulerViewport.appendChild(rulerCanvas);
    rulerViewport.appendChild(playheadEl);
    rulerCell.appendChild(rulerViewport);

    grid.appendChild(spacer);
    grid.appendChild(rulerCell);

    // Tracks rows
    const st = store.getState();
    const order = st?.timeline?.order || [];
    for (const trackId of order){
      const tr = st?.timeline?.tracks?.[trackId];
      if (!tr) continue;

      const labelCell = document.createElement('div');
      labelCell.className = 'wtLabelCell track';
      labelCell.dataset.trackId = trackId;

      const labelTop = document.createElement('div');
      labelTop.className = 'wtLabelTop';

      const name = document.createElement('div');
      name.className = 'wtTrackName';
      const key = `track.${trackId}`;
      const tx = (typeof t === 'function') ? String(t(key)) : '';
      name.textContent = (tx && tx !== key) ? tx : (tr.label || trackId);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'wtAddKfBtn';
      addBtn.textContent = '+';
      addBtn.title = (typeof t === 'function') ? (t('timeline.addKeyframe') || '+ Keyframe') : '+ Keyframe';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'wtDelKfBtn';
      delBtn.textContent = '−';
      delBtn.title = (typeof t === 'function') ? (t('timeline.deleteKeyframe') || '- Keyframe') : '- Keyframe';

      addBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const stNow = store.getState();
        const dur = getDurationSec();
        const tn = clamp((stNow?.project?.time || 0) / dur, 0, 1);
        store.dispatch({ type: 'ADD_KEYFRAME', trackId, atT: tn });
      });

      delBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const stNow = store.getState();
        const tr = stNow?.timeline?.tracks?.[trackId];
        const kfs = Array.isArray(tr?.keyframes) ? tr.keyframes : [];
        if (!kfs.length) return;

        // If a keyframe on this track is selected — delete it.
        let idx = -1;
        const sel = stNow?.timeline?.selectedKeyframe;
        if (sel?.trackId === trackId && sel?.keyframeId) {
          idx = kfs.findIndex(k => k?.id === sel.keyframeId);
        }
        // Otherwise delete the last keyframe.
        if (idx < 0) idx = kfs.length - 1;
        if (idx < 0) return;
        store.dispatch({ type: 'DELETE_KEYFRAME', trackId, index: idx });
      });

      const btns = document.createElement('div');
      btns.className = 'wtKfBtns';
      btns.appendChild(delBtn);
      btns.appendChild(addBtn);

      labelTop.appendChild(name);
      labelTop.appendChild(btns);
      labelCell.appendChild(labelTop);

      labelCell.addEventListener('mousedown', ()=>{
        setActiveTrack(trackId);
      });

      const laneCell = document.createElement('div');
      laneCell.className = 'wtLaneCell';

      const laneViewport = document.createElement('div');
      laneViewport.className = 'wtLaneViewport';
      laneViewport.dataset.trackId = trackId;

      laneCell.appendChild(laneViewport);

      grid.appendChild(labelCell);
      grid.appendChild(laneCell);

      laneElsByTrack.set(trackId, laneViewport);
    }

    rootEl.appendChild(grid);

    // Bottom horizontal "scrub" / pan slider
    const h = document.createElement('div');
    h.className = 'wtHScroll';

    rangeEl = document.createElement('input');
    rangeEl.type = 'range';
    rangeEl.min = '0';
    rangeEl.step = '0.001';
    rangeEl.value = '0';

    const rangeLabel = document.createElement('div');
    rangeLabel.className = 'wtRangeLabel';
    rangeLabel.textContent = '';

    rangeEl.addEventListener('input', ()=>{
      view.startSec = Number(rangeEl.value) || 0;
      ensureViewBounds();
      requestRender();
    });

    h.appendChild(rangeEl);
    h.appendChild(rangeLabel);
    rootEl.appendChild(h);

    mountEl.appendChild(rootEl);

    // interactions
    initRulerInteractions(rangeLabel);
    initPlayheadDrag();
    initKeyframeInteractions();

    // External focus request (e.g., Home / Jump buttons)
    window.addEventListener('st_timeline_focus_time', (ev) => {
      const tt = ev?.detail?.time;
      const dur = getDurationSec();
      const tSec = clamp(Number(tt) || 0, 0, dur);
      // keep playhead slightly inside view
      view.startSec = clamp(tSec - view.secondsVisible * 0.15, 0, Math.max(0, dur - view.secondsVisible));
      ensureViewBounds();
      requestRender();
    });

    ensureViewBounds();
    requestRender();
  }

  function setActiveTrack(trackId){
    rootEl?.querySelectorAll?.('.track.isFocused')?.forEach(el => el.classList.remove('isFocused'));
    const el = rootEl?.querySelector?.(`.track[data-track-id="${CSS.escape(trackId)}"]`);
    if (el) el.classList.add('isFocused');
  }

  function getPps(){
    const w = rulerViewport?.getBoundingClientRect?.().width || 1;
    return w / Math.max(0.001, view.secondsVisible);
  }

  function timeToX(tSec){
    const pps = getPps();
    return (tSec - view.startSec) * pps;
  }

  function xToTime(clientX){
    const rect = rulerViewport.getBoundingClientRect();
    const x = clientX - rect.left;
    const tSec = view.startSec + x / getPps();
    return clamp(tSec, 0, view.maxSec);
  }

  function drawRuler(){
    if (!rulerCanvas || !rulerViewport) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = rulerViewport.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    rulerCanvas.width = Math.floor(w * dpr);
    rulerCanvas.height = Math.floor(h * dpr);
    rulerCanvas.style.width = w + 'px';
    rulerCanvas.style.height = h + 'px';
    const ctx = rulerCanvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);

    // baseline
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fillRect(0, h-1, w, 1);

    const start = view.startSec;
    const end = view.startSec + view.secondsVisible;
    const pps = getPps();

    // choose tick step based on zoom
    const pxPerMinorTarget = 40;
    const minorStep = chooseNiceStep(pxPerMinorTarget / pps); // seconds
    const majorStep = minorStep * 5;

    const firstMinor = Math.floor(start / minorStep) * minorStep;
    ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textBaseline = 'top';

    for (let t = firstMinor; t <= end + minorStep; t += minorStep){
      const x = (t - start) * pps;
      if (x < -50 || x > w + 50) continue;
      const isMajor = Math.abs((t / majorStep) - Math.round(t / majorStep)) < 1e-6;
      const tickH = isMajor ? 10 : 6;
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.18)';
      ctx.beginPath();
      ctx.moveTo(x + 0.5, h - 1);
      ctx.lineTo(x + 0.5, h - 1 - tickH);
      ctx.stroke();

      if (isMajor){
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.fillText(fmtTime(t), x + 3, 2);
      }
    }
  }

  function chooseNiceStep(targetSec){
    // targetSec is approximate seconds per minor tick
    const steps = [0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10,15,30,60,120,300,600,900,1800];
    for (const s of steps){
      if (s >= targetSec) return s;
    }
    return 3600;
  }

  function renderLanes(){
    const st = store.getState();
    const dur = getDurationSec();
    ensureViewBounds();

    // playhead position
    const cur = clamp(Number(st?.project?.time || 0), 0, dur);
    const x = timeToX(cur);
    if (playheadEl){
      playheadEl.style.transform = `translateX(${x}px)`;
    
    // global line position (relative to rootEl)
    if (playheadGlobalEl && rootEl && rulerViewport){
      const rootRect = rootEl.getBoundingClientRect();
      const rvRect = rulerViewport.getBoundingClientRect();
      const gx = (rvRect.left - rootRect.left) + x;
      const w = rvRect.width || 1;
      playheadGlobalEl.style.display = (x >= 0 && x <= w) ? 'block' : 'none';
      playheadGlobalEl.style.transform = `translateX(${gx}px)`;
    }

      playheadEl.style.cursor = 'ew-resize';
    }

    // lanes
    const margin = 80;
    for (const [trackId, laneViewport] of laneElsByTrack.entries()){
      const tr = st?.timeline?.tracks?.[trackId];
      if (!tr) continue;

      const laneW = laneViewport.getBoundingClientRect().width || 1;

      // Clear lane and render only visible markers + pair lines
      laneViewport.innerHTML = '';

      const kfs = Array.isArray(tr.keyframes) ? tr.keyframes.slice() : [];
      kfs.sort((a,b)=>(a?.t||0)-(b?.t||0));

      // Pairing: (0-1), (2-3), ...
      // If last without pair => red.
      for (let i=0; i<kfs.length; i++){
        const k = kfs[i];
        if (!k) continue;
        const tSec = clamp((Number(k.t)||0),0,1) * dur;
        const x = timeToX(tSec);
        if (x < -margin || x > laneW + margin) continue;

        const isPaired = (i % 2 === 0) ? (i+1 < kfs.length) : true;
        const marker = document.createElement('div');
        marker.className = 'wtMarker' + (isPaired ? ' isActive' : ' isInactive');
        marker.style.left = `${x}px`;
        marker.dataset.trackId = trackId;
        marker.dataset.keyframeId = String(k.id || '');
        marker.title = `t=${Math.round(tSec*1000)/1000}s`;

        // selected?
        const sel = st?.timeline?.selectedKeyframe;
        if (sel && sel.trackId === trackId && sel.keyframeId === k.id){
          marker.classList.add('isSelected');
        }

        laneViewport.appendChild(marker);
      }

      // Lines for pairs (green)
      for (let i=0; i<kfs.length; i+=2){
        const a = kfs[i];
        const b = kfs[i+1];
        if (!a || !b) break;
        const xa = timeToX(clamp((Number(a.t)||0),0,1)*dur);
        const xb = timeToX(clamp((Number(b.t)||0),0,1)*dur);
        const left = Math.min(xa, xb);
        const right = Math.max(xa, xb);
        if (right < -margin || left > laneW + margin) continue;
        const line = document.createElement('div');
        line.className = 'wtPairLine';
        line.style.left = `${left}px`;
        line.style.width = `${Math.max(0, right-left)}px`;
        laneViewport.appendChild(line);
      }
    }
  }

  function initRulerInteractions(rangeLabel){
    if (!rulerViewport) return;

    // Wheel zoom (only on ruler)
    rulerViewport.addEventListener('wheel', (e)=>{
      // Shift + wheel = pan
      if (e.shiftKey){
        e.preventDefault();
        const delta = e.deltaY;
        const speed = view.secondsVisible / 600; // pan speed depends on zoom
        view.startSec = clamp(view.startSec + delta * speed, 0, Math.max(0, view.maxSec - view.secondsVisible));
        ensureViewBounds();
        requestRender();
        return;
      }

      e.preventDefault();

      const rect = rulerViewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const anchorTime = view.startSec + x / getPps();

      const dir = Math.sign(e.deltaY);
      const zoomFactor = dir > 0 ? 1.18 : 1/1.18;

      const nextVisible = clamp(view.secondsVisible * zoomFactor, 6, view.maxSec);
      // keep anchor time under cursor
      const nextPps = (rect.width || 1) / nextVisible;
      const nextStart = anchorTime - x / nextPps;

      view.secondsVisible = nextVisible;
      view.startSec = clamp(nextStart, 0, Math.max(0, view.maxSec - view.secondsVisible));
      ensureViewBounds();
      requestRender();
    }, { passive:false });

    // Pan drag (LMB) on ruler
    let isPanning = false;
    let startX = 0;
    let startStart = 0;

    rulerViewport.addEventListener('mousedown', (e)=>{
      if (e.button !== 0) return;
      // if clicking playhead, let playhead drag handler handle it
      if (e.target && (e.target === playheadEl)) return;
      isPanning = true;
      startX = e.clientX;
      startStart = view.startSec;
      rulerViewport.classList.add('isDragging');
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    function onMove(e){
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dt = -dx / getPps();
      view.startSec = clamp(startStart + dt, 0, Math.max(0, view.maxSec - view.secondsVisible));
      ensureViewBounds();
      requestRender();
    }
    function onUp(){
      isPanning = false;
      rulerViewport.classList.remove('isDragging');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    // Click ruler sets time
    rulerViewport.addEventListener('click', (e)=>{
      if (e.defaultPrevented) return;
      // ignore click that ends a drag
      const tSec = xToTime(e.clientX);
      store.dispatch({ type: ActionTypes.SET_TIME, time: tSec });
      store.dispatch({ type: ActionTypes.SET_SELECTED_KEYFRAME, payload: null });
    });

    // update range label on render
    const updateLabel = ()=>{
      rangeLabel.textContent = `${fmtTime(view.startSec)} → ${fmtTime(view.startSec + view.secondsVisible)}`;
    };
    // store for later
    rootEl._updateRangeLabel = updateLabel;
  }

  function initPlayheadDrag(){
    if (!playheadEl) return;

    let dragging = false;

    playheadEl.addEventListener('mousedown', (e)=>{
      if (e.button !== 0) return;
      e.preventDefault();
      dragging = true;
      playheadEl.classList.add('isDragging');
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    function onMove(e){
      if (!dragging) return;
      const tSec = xToTime(e.clientX);
      store.dispatch({ type: ActionTypes.SET_TIME, time: tSec });
    }
    function onUp(){
      dragging = false;
      playheadEl.classList.remove('isDragging');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
  }

  function initKeyframeInteractions(){
    // Delegate within root for markers
    rootEl.addEventListener('mousedown', (e)=>{
      const mk = e.target?.closest?.('.wtMarker');
      if (!mk) return;

      if (e.button !== 0) return;
      e.preventDefault();

      const trackId = String(mk.dataset.trackId || '');
      const keyframeId = String(mk.dataset.keyframeId || '');
      if (!trackId || !keyframeId) return;

      // select
      store.dispatch({ type: ActionTypes.SET_SELECTED_KEYFRAME, payload: { trackId, keyframeId } });
      setActiveTrack(trackId);

      // drag
      const laneViewport = laneElsByTrack.get(trackId);
      if (!laneViewport) return;

      const rect = laneViewport.getBoundingClientRect();
      let startClientX = e.clientX;
      let startLeft = Number(mk.style.left.replace('px','')) || 0;
      let dragging = false;

      const onMove = (ev)=>{
        const dx = ev.clientX - startClientX;
        if (!dragging && Math.abs(dx) > 2) dragging = true;
        const x = clamp(startLeft + dx, -20, (rect.width || 1) + 20);
        mk.style.left = `${x}px`;
        mk.classList.add('isDragging');

        // Convert marker x back to time
        const tSec = view.startSec + x / getPps();
        const dur = getDurationSec();
        const t01 = clamp(tSec / dur, 0, 1);
        store.dispatch({ type: 'UPDATE_KEYFRAME_BY_ID', trackId, keyframeId, patch: { t: t01 } });
      };

      const onUp = ()=>{
        mk.classList.remove('isDragging');
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        // re-render to snap to correct position after sort
        requestRender();
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  function requestRender(){
    if (rafRender) return;
    rafRender = requestAnimationFrame(()=>{
      rafRender = 0;
      ensureViewBounds();
      drawRuler();
      renderLanes();
      if (rootEl && typeof rootEl._updateRangeLabel === 'function') rootEl._updateRangeLabel();
    });
  }

  function render(){
    // (re)build on first render or if track list changed
    if (!rootEl){
      build();
      return;
    }
    requestRender();
  }

  const unsub = store.subscribe(()=>requestRender());

  // initial
  build();

  function destroy(){
    try { unsub?.(); } catch {}
    try { cancelAnimationFrame(rafRender); } catch {}
    mountEl.innerHTML = '';
    laneElsByTrack.clear();
    rootEl = null;
  }

  return { render, destroy };
}
