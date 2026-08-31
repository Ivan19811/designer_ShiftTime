// Preview Orion (integrated) — no deps
// Bilinear quad mapping (stable). Next step: upgrade to homography.

function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function lerpP(p0,p1,t){ return { x: lerp(p0.x,p1.x,t), y: lerp(p0.y,p1.y,t) }; }
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }

// --- Homography (rect -> quad) for CSS matrix3d ---
function solveLinearSystem8(A, b){
  // Gaussian elimination for 8x8
  const n = 8;
  // Augment
  const M = A.map((row,i)=> row.slice().concat([b[i]]));
  for (let col=0; col<n; col++){
    // pivot
    let pivot = col;
    for (let r=col+1; r<n; r++){
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    const pv = M[pivot][col];
    if (Math.abs(pv) < 1e-12) return null;
    if (pivot !== col){
      const tmp = M[col]; M[col] = M[pivot]; M[pivot] = tmp;
    }
    // normalize
    const inv = 1 / M[col][col];
    for (let c=col; c<=n; c++) M[col][c] *= inv;
    // eliminate
    for (let r=0; r<n; r++){
      if (r === col) continue;
      const f = M[r][col];
      if (Math.abs(f) < 1e-12) continue;
      for (let c=col; c<=n; c++){
        M[r][c] -= f * M[col][c];
      }
    }
  }
  return M.map(row => row[n]);
}

function homographyRectToQuad(w, h, quad){
  // rect points: (0,0)->q0, (w,0)->q1, (w,h)->q2, (0,h)->q3
  const src = [
    {x:0,y:0},
    {x:w,y:0},
    {x:w,y:h},
    {x:0,y:h},
  ];
  const A = [];
  const B = [];
  for (let i=0;i<4;i++){
    const x = src[i].x, y = src[i].y;
    const X = quad[i].x, Y = quad[i].y;
    A.push([ x, y, 1, 0, 0, 0, -x*X, -y*X ]);
    B.push(X);
    A.push([ 0, 0, 0, x, y, 1, -x*Y, -y*Y ]);
    B.push(Y);
  }
  const hvec = solveLinearSystem8(A, B);
  if (!hvec) return null;
  // h33 = 1
  return [
    [hvec[0], hvec[1], hvec[2]],
    [hvec[3], hvec[4], hvec[5]],
    [hvec[6], hvec[7], 1],
  ];
}

function homographyToCssMatrix3d(H){
  // Embed 3x3 homography into 4x4 matrix for CSS (column-major)
  // 3x3: [a b c; d e f; g h i(=1)]
  const a=H[0][0], b=H[0][1], c=H[0][2];
  const d=H[1][0], e=H[1][1], f=H[1][2];
  const g=H[2][0], h=H[2][1];
  // Column-major matrix3d:
  // [ a d 0 g
  //   b e 0 h
  //   0 0 1 0
  //   c f 0 1 ]
  return `matrix3d(${a},${d},0,${g}, ${b},${e},0,${h}, 0,0,1,0, ${c},${f},0,1)`;
}


function solveUVForPoint(pts, target, u0=0.5, v0=0.5){
  // Coordinate descent to invert bilinear quad mapping.
  // Returns {u,v} within [0..1]
  let bestU = clamp01(u0), bestV = clamp01(v0);
  const evalAt = (u,v) => {
    const p = projectQuadBilinear(pts, u, v);
    const dx = p.x - target.x, dy = p.y - target.y;
    return dx*dx + dy*dy;
  };
  let bestE = evalAt(bestU, bestV);
  let step = 0.25;
  for (let iter=0; iter<18; iter++){
    let improved = false;
    const cand = [
      {u: bestU + step, v: bestV},
      {u: bestU - step, v: bestV},
      {u: bestU, v: bestV + step},
      {u: bestU, v: bestV - step},
      {u: bestU + step, v: bestV + step},
      {u: bestU + step, v: bestV - step},
      {u: bestU - step, v: bestV + step},
      {u: bestU - step, v: bestV - step},
    ];
    for (const c of cand){
      const u = clamp01(c.u), v = clamp01(c.v);
      const e = evalAt(u,v);
      if (e < bestE){
        bestE = e; bestU = u; bestV = v;
        improved = true;
      }
    }
    if (!improved) step *= 0.5;
    if (step < 1e-4) break;
  }
  return {u: bestU, v: bestV};
}


// Quad points order: P00, P10, P11, P01
function projectQuadBilinear(pts, u, v){
  const P00 = pts[0], P10 = pts[1], P11 = pts[2], P01 = pts[3];
  const a = lerpP(P00, P10, u);
  const b = lerpP(P01, P11, u);
  return lerpP(a, b, v);
}

export function initPreviewOrion({ mountEl, footerLeftEl, footerRightEl }){
  if (!mountEl) throw new Error('PreviewOrion: mountEl required');

  // Build DOM (fixed ids)
  const existing = mountEl.querySelector('#previewRoot');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'previewRoot';
  root.className = 'preview-orion';

  const viewport = document.createElement('div');
  viewport.id = 'previewViewport';
  viewport.className = 'preview-orion__viewport';

  const bg = document.createElement('div');
  bg.id = 'previewBackground';
  bg.className = 'preview-orion__bg';

  const overlay = document.createElement('div');
  overlay.id = 'overlayLayer';
  overlay.className = 'preview-orion__overlay';

  const gridSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  gridSvg.id = 'gridSvg';
  gridSvg.classList.add('preview-orion__gridSvg');

  const objectsLayer = document.createElement('div');
  objectsLayer.id = 'objectsLayer';
  objectsLayer.className = 'preview-orion__objects';

  overlay.appendChild(gridSvg);
  overlay.appendChild(objectsLayer);

  viewport.appendChild(bg);
  viewport.appendChild(overlay);
  root.appendChild(viewport);
  mountEl.appendChild(root);

  // If we are embedded without an external footer (e.g., full Animator mode
  // inside the Builder), render a small floating control strip so the user
  // can still create grid/text.
  let floatingControls = null;
  if (!footerRightEl){
    floatingControls = document.createElement('div');
    floatingControls.className = 'preview-orion__floatingControls';
    root.appendChild(floatingControls);
  }

  const state = {
    root, viewport, overlay, gridSvg, objectsLayer,
    gridVisible: true,
    grid: null, // { points[4], handles[4], divisions }
    objects: new Map(),
    markerUV: { u: 0.25, v: 0.55 },
    selectedObjectId: null,
    // drag: mode = 'corner' | 'edge'
    drag: { active:false, mode:null, idx:-1, pid:null, start:null, startPoints:null },
    textDrag: { active:false, id:null, pid:null },
    textResize: { active:false, id:null, dir:null, pid:null, startScaleX:1, startScaleY:1, startW:0, startH:0, startClientX:0, startClientY:0 }

  };

  // Selection helpers (for showing resize handles)
  function selectObject(objectId){
    state.selectedObjectId = objectId || null;
    for (const obj of state.objects.values()){
      if (obj?.el && obj.el.classList) obj.el.classList.remove('is-selected');
    }
    const obj = objectId ? state.objects.get(objectId) : null;
    if (obj?.el && obj.el.classList) obj.el.classList.add('is-selected');

    // bridge event (Builder sync)
    try {
      window.dispatchEvent(new CustomEvent('st:animator-object-selected', { detail: { objectId } }));
    } catch (e) {}
  }

  // Click on empty space to clear selection
  state.overlay.addEventListener('pointerdown', (e)=>{
    const t = e.target;
    if (t && (t.closest?.('.preview-orion__textWrap') || t.closest?.('.preview-orion__textResizeHandle'))) return;
    selectObject(null);
  });

  function clampPointToViewport(p, w, h){
    return {
      x: Math.max(0, Math.min(w, p.x)),
      y: Math.max(0, Math.min(h, p.y))
    };
  }

  function setGridVisible(on){
    state.gridVisible = !!on;
    if (!state.gridVisible) state.root.classList.add('preview-orion__gridHidden');
    else state.root.classList.remove('preview-orion__gridHidden');
  }

  function svgClear(){
    while (state.gridSvg.firstChild) state.gridSvg.removeChild(state.gridSvg.firstChild);
  }
  function svgEl(name){
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  function updateHandles(){
    if (!state.grid) return;
    for (let i=0;i<4;i++){
      const p = state.grid.points[i];
      const h = state.grid.handles[i];
      h.style.left = `${p.x}px`;
      h.style.top = `${p.y}px`;
    }
    updateEdgeHandles();
  }

  function ensureEdgeHandles(){
    if (!state.grid) return;
    if (state.grid.edgeHandles?.length === 4) return;
    state.grid.edgeHandles = [];
    for (let i=0;i<4;i++){
      const e = document.createElement('div');
      e.className = 'preview-orion__edgeHandle';
      e.dataset.edgeIndex = String(i);
      e.addEventListener('pointerdown', onEdgeDown);
      state.overlay.appendChild(e);
      state.grid.edgeHandles.push(e);
    }
  }

  function updateEdgeHandles(){
    if (!state.grid) return;
    ensureEdgeHandles();
    const pts = state.grid.points;
    for (let i=0;i<4;i++){
      const j = (i+1)%4;
      const mid = { x:(pts[i].x+pts[j].x)/2, y:(pts[i].y+pts[j].y)/2 };
      const e = state.grid.edgeHandles[i];
      e.style.left = `${mid.x}px`;
      e.style.top = `${mid.y}px`;
      // rotate handle to match edge direction (purely UX)
      const angle = Math.atan2(pts[j].y-pts[i].y, pts[j].x-pts[i].x) * 180/Math.PI;
      e.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
    }
  }

  function updateMarker(){ /* removed */ }

  function setMarkerUV(){ /* removed */ }

  function drawGrid(){
    if (!state.grid) return;
    svgClear();

    const p = state.grid.points;
    const strokeOuter = 'rgba(255,255,255,0.75)';
    const strokeInner = 'rgba(255,255,255,0.18)';

    const poly = svgEl('path');
    poly.setAttribute('d', `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y} L ${p[2].x} ${p[2].y} L ${p[3].x} ${p[3].y} Z`);
    poly.setAttribute('fill', 'rgba(0,0,0,0.06)');
    poly.setAttribute('stroke', strokeOuter);
    poly.setAttribute('stroke-width', '2');
    state.gridSvg.appendChild(poly);

    // Make visible shapes non-interactive; we'll add dedicated grabbers
    poly.style.pointerEvents = 'none';

    // Edge grabbers (invisible thick strokes) so you can drag grid by its sides
    const edges = [
      [0,1,0],
      [1,2,1],
      [2,3,2],
      [3,0,3],
    ];
    for (const [aIdx,bIdx,eIdx] of edges){
      const aP = p[aIdx], bP = p[bIdx];
      const grab = svgEl('line');
      grab.setAttribute('x1', aP.x); grab.setAttribute('y1', aP.y);
      grab.setAttribute('x2', bP.x); grab.setAttribute('y2', bP.y);
      grab.setAttribute('stroke', 'rgba(0,0,0,0)');   // invisible
      grab.setAttribute('stroke-width', '18');         // easy to catch
      grab.style.pointerEvents = 'stroke';
      grab.dataset.edgeIndex = String(eIdx);
      grab.addEventListener('pointerdown', onEdgeDown);
      state.gridSvg.appendChild(grab);
    }

    const div = state.grid.divisions ?? 10;
    for (let i=1;i<div;i++){
      const t = i/div;

      const a = projectQuadBilinear(p, 0, t);
      const b = projectQuadBilinear(p, 1, t);
      const l1 = svgEl('line');
      l1.setAttribute('x1', a.x); l1.setAttribute('y1', a.y);
      l1.setAttribute('x2', b.x); l1.setAttribute('y2', b.y);
      l1.setAttribute('stroke', strokeInner);
      l1.setAttribute('stroke-width', '1');
      l1.style.pointerEvents = 'none';
      state.gridSvg.appendChild(l1);

      const c = projectQuadBilinear(p, t, 0);
      const d = projectQuadBilinear(p, t, 1);
      const l2 = svgEl('line');
      l2.setAttribute('x1', c.x); l2.setAttribute('y1', c.y);
      l2.setAttribute('x2', d.x); l2.setAttribute('y2', d.y);
      l2.setAttribute('stroke', strokeInner);
      l2.setAttribute('stroke-width', '1');
      l2.style.pointerEvents = 'none';
      state.gridSvg.appendChild(l2);
    }

    updateHandles();
    updateAllObjects();
}

  function ensureHandles(){
    if (!state.grid) return;
    if (state.grid.handles?.length === 4) return;
    state.grid.handles = [];
    for (let i=0;i<4;i++){
      const h = document.createElement('div');
      h.className = 'preview-orion__handle';
      h.dataset.handleIndex = String(i);
      h.addEventListener('pointerdown', onHandleDown);
      state.overlay.appendChild(h);
      state.grid.handles.push(h);
    }
  }

  function ensureEdgeHandles(){
    if (!state.grid) return;
    if (state.grid.edgeHandles?.length === 4) return;
    state.grid.edgeHandles = [];
    for (let i=0;i<4;i++){
      const h = document.createElement('div');
      h.className = 'preview-orion__edgeHandle';
      h.dataset.edgeIndex = String(i);
      h.addEventListener('pointerdown', onEdgeDown);
      state.overlay.appendChild(h);
      state.grid.edgeHandles.push(h);
    }
  }

  function toLocalPoint(clientX, clientY){
    const r = state.viewport.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
  }

  function onHandleDown(e){
    if (!state.grid) return;
    const idx = Number(e.currentTarget.dataset.handleIndex);
    state.drag.active = true;
    state.drag.mode = 'corner';
    state.drag.idx = idx;
    state.drag.pid = e.pointerId;
    e.currentTarget.classList.add('preview-orion__handle--active');
    e.currentTarget.setPointerCapture(e.pointerId);
    window.addEventListener('pointermove', onHandleMove, { passive:false });
    window.addEventListener('pointerup', onHandleUp, { passive:false });
    e.preventDefault();
  }
  function onHandleMove(e){
    if (!state.drag.active || state.drag.mode !== 'corner' || !state.grid) return;
    const lp = toLocalPoint(e.clientX, e.clientY);
    state.grid.points[state.drag.idx] = clampPointToViewport({ x: lp.x, y: lp.y }, lp.w, lp.h);
    drawGrid();
    e.preventDefault();
  }
  function onHandleUp(e){
    if (!state.grid) return;
    const h = state.grid.handles[state.drag.idx];
    if (h) h.classList.remove('preview-orion__handle--active');
    state.drag.active = false;
    state.drag.mode = null;
    state.drag.idx = -1;
    state.drag.pid = null;
    state.drag.start = null;
    state.drag.startPoints = null;
    window.removeEventListener('pointermove', onHandleMove);
    window.removeEventListener('pointerup', onHandleUp);
    e.preventDefault();
  }


  // --- Text dragging (screen → uv) ---
  function onTextDown(e){
    if (!state.grid) return;
    if (state.textResize && state.textResize.active) return;
    const el = e.currentTarget;
    const objectId = el.dataset.objectId;
    const obj = state.objects.get(objectId);
    if (!obj) return;

    selectObject(objectId);

    // If pointer is on border/corner zone -> resize; otherwise -> drag
    const dir = getResizeDirFromBorder(obj.contentEl || obj.el, e.clientX, e.clientY);
    if (dir){
      state.textResize.active = true;
      state.textResize.id = objectId;
      state.textResize.dir = dir;
      state.textResize.pid = e.pointerId;

      const r = (obj.contentEl || obj.el).getBoundingClientRect();
      state.textResize.startW = r.width;
      state.textResize.startH = r.height;
      state.textResize.startClientX = e.clientX;
      state.textResize.startClientY = e.clientY;
      state.textResize.startScaleX = obj.userScaleX ?? 1;
      state.textResize.startScaleY = obj.userScaleY ?? 1;
      if (obj.layOnGrid){
        ensureUVSizeForObject(obj);
        state.textResize.startSizeU = obj.sizeU;
        state.textResize.startSizeV = obj.sizeV;
      }

      el.setPointerCapture(e.pointerId);
      window.addEventListener('pointermove', onTextResizeMove, { passive:false });
      window.addEventListener('pointerup', onTextResizeUp, { passive:false });

      e.stopPropagation();
      e.preventDefault();
      return;
    }

    state.textDrag.active = true;
    state.textDrag.id = objectId;
    state.textDrag.pid = e.pointerId;

    el.style.cursor = 'grabbing';
    el.setPointerCapture(e.pointerId);

    window.addEventListener('pointermove', onTextMove, { passive:false });
    window.addEventListener('pointerup', onTextUp, { passive:false });

    e.stopPropagation();
    e.preventDefault();
  }

  function onTextMove(e){
    if (!state.textDrag.active || !state.grid) return;
    const obj = state.objects.get(state.textDrag.id);
    if (!obj) return;

    const lp = toLocalPoint(e.clientX, e.clientY);
    const target = { x: Math.max(0, Math.min(lp.w, lp.x)), y: Math.max(0, Math.min(lp.h, lp.y)) };

    // Start search near current uv for stability
    const uv = solveUVForPoint(state.grid.points, target, obj.u, obj.v);
    obj.u = uv.u;
    obj.v = uv.v;

    updateObject(obj);
e.stopPropagation();
    e.preventDefault();
  }

  function onTextUp(e){
    const obj = state.objects.get(state.textDrag.id);
    if (obj && obj.contentEl) obj.contentEl.style.cursor = 'move';

    state.textDrag.active = false;
    state.textDrag.id = null;
    state.textDrag.pid = null;

    window.removeEventListener('pointermove', onTextMove);
    window.removeEventListener('pointerup', onTextUp);

    e.stopPropagation();
    e.preventDefault();
  }

  function onTextHover(e){
    if (!state.grid) return;
    if (state.textDrag.active || state.textResize.active) return;
    const objectId = e.currentTarget.dataset.objectId;
    const obj = state.objects.get(objectId);
    if (!obj || !obj.contentEl) return;

    const dir = getResizeDirFromBorder(obj.contentEl, e.clientX, e.clientY);
    obj.contentEl.style.cursor = cursorForDir(dir);
  }

  function onTextLeave(e){
    const objectId = e.currentTarget.dataset.objectId;
    const obj = state.objects.get(objectId);
    if (obj && obj.contentEl) obj.contentEl.style.cursor = 'move';
  }

  // --- Text resize (border/corners; no visible handles) ---
  function getResizeDirFromBorder(textEl, clientX, clientY){
    if (!textEl) return null;
    const r = textEl.getBoundingClientRect();
    const m = 12; // hit-zone thickness
    const x = clientX;
    const y = clientY;

    const nearL = (x >= r.left - m) && (x <= r.left + m);
    const nearR = (x >= r.right - m) && (x <= r.right + m);
    const nearT = (y >= r.top - m) && (y <= r.top + m);
    const nearB = (y >= r.bottom - m) && (y <= r.bottom + m);

    // inside rect check (avoid triggering resize far away)
    const inside = (x >= r.left - m) && (x <= r.right + m) && (y >= r.top - m) && (y <= r.bottom + m);
    if (!inside) return null;

    // Corners first
    if (nearT && nearL) return 'nw';
    if (nearT && nearR) return 'ne';
    if (nearB && nearR) return 'se';
    if (nearB && nearL) return 'sw';
    // Edges
    if (nearT) return 'n';
    if (nearB) return 's';
    if (nearR) return 'e';
    if (nearL) return 'w';
    return null;
  }

    function cursorForDir(dir){
    switch (dir){
      case 'n':
      case 's': return 'ns-resize';
      case 'e':
      case 'w': return 'ew-resize';
      case 'ne':
      case 'sw': return 'nesw-resize';
      case 'nw':
      case 'se': return 'nwse-resize';
      default: return 'move';
    }
  }

  function onTextResizeMove(e){
    if (!state.textResize.active || !state.grid) return;
    const obj = state.objects.get(state.textResize.id);
    if (!obj || !obj.contentEl) return;

    const dir = state.textResize.dir || 'se';
    const dx = e.clientX - (state.textResize.startClientX || e.clientX);
    const dy = e.clientY - (state.textResize.startClientY || e.clientY);

    // Special: if laid on grid, resize in UV-space (stable, no bounding-rect explosions)
    if (obj.layOnGrid){
      ensureUVSizeForObject(obj);

      const pxPerU = obj._pxPerU || 1;
      const pxPerV = obj._pxPerV || 1;

      const startU = state.textResize.startSizeU ?? obj.sizeU ?? 0.1;
      const startV = state.textResize.startSizeV ?? obj.sizeV ?? 0.06;

      let newU = startU;
      let newV = startV;

      if (dir.includes('e')) newU = startU + (dx / pxPerU);
      if (dir.includes('w')) newU = startU - (dx / pxPerU);
      if (dir.includes('s')) newV = startV + (dy / pxPerV);
      if (dir.includes('n')) newV = startV - (dy / pxPerV);

      obj.sizeU = Math.min(0.9, Math.max(0.02, newU));
      obj.sizeV = Math.min(0.9, Math.max(0.02, newV));

      // keep userScale 1 in laid mode resize (avoid double scaling)
      obj.userScaleX = 1;
      obj.userScaleY = 1;

      updateObject(obj);

      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // Default (not laid): classic screen-based resize changes userScale
    const startW = Math.max(20, state.textResize.startW || obj.contentEl.getBoundingClientRect().width || 20);
    const startH = Math.max(20, state.textResize.startH || obj.contentEl.getBoundingClientRect().height || 20);

    let newW = startW;
    let newH = startH;

    if (dir.includes('e')) newW = startW + dx;
    if (dir.includes('w')) newW = startW - dx;
    if (dir.includes('s')) newH = startH + dy;
    if (dir.includes('n')) newH = startH - dy;

    newW = Math.max(24, newW);
    newH = Math.max(18, newH);

    const ratioX = newW / startW;
    const ratioY = newH / startH;

    const baseX = state.textResize.startScaleX || 1;
    const baseY = state.textResize.startScaleY || 1;

    obj.userScaleX = Math.max(0.2, Math.min(8, baseX * ratioX));
    obj.userScaleY = Math.max(0.2, Math.min(8, baseY * ratioY));

    updateObject(obj);

    e.stopPropagation();
    e.preventDefault();
  }


    function onTextResizeUp(e){
    state.textResize.active = false;
    state.textResize.id = null;
    state.textResize.dir = null;
    state.textResize.pid = null;

    window.removeEventListener('pointermove', onTextResizeMove);
    window.removeEventListener('pointerup', onTextResizeUp);

    e.stopPropagation();
    e.preventDefault();
  }

  function onEdgeDown(e){
    if (!state.grid) return;
    const idx = Number(e.currentTarget.dataset.edgeIndex);
    state.drag.active = true;
    state.drag.mode = 'edge';
    state.drag.idx = idx;
    state.drag.pid = e.pointerId;
    state.drag.start = toLocalPoint(e.clientX, e.clientY);
    // snapshot points
    state.drag.startPoints = state.grid.points.map(p => ({ x: p.x, y: p.y }));

    e.currentTarget.classList.add('preview-orion__handle--active');
    e.currentTarget.setPointerCapture(e.pointerId);
    window.addEventListener('pointermove', onEdgeMove, { passive:false });
    window.addEventListener('pointerup', onEdgeUp, { passive:false });
    e.preventDefault();
  }

  function onEdgeMove(e){
    if (!state.drag.active || state.drag.mode !== 'edge' || !state.grid) return;
    const now = toLocalPoint(e.clientX, e.clientY);
    const st = state.drag.start;
    if (!st || !state.drag.startPoints) return;

    const dx = now.x - st.x;
    const dy = now.y - st.y;

    const i = state.drag.idx;
    const j = (i + 1) % 4;

    const pI = { x: state.drag.startPoints[i].x + dx, y: state.drag.startPoints[i].y + dy };
    const pJ = { x: state.drag.startPoints[j].x + dx, y: state.drag.startPoints[j].y + dy };

    state.grid.points[i] = clampPointToViewport(pI, now.w, now.h);
    state.grid.points[j] = clampPointToViewport(pJ, now.w, now.h);

    drawGrid();
    e.preventDefault();
  }

  function onEdgeUp(e){
    if (!state.grid) return;
    const h = state.grid.edgeHandles?.[state.drag.idx];
    if (h) h.classList.remove('preview-orion__handle--active');
    state.drag.active = false;
    state.drag.mode = null;
    state.drag.idx = -1;
    state.drag.pid = null;
    state.drag.start = null;
    state.drag.startPoints = null;
    window.removeEventListener('pointermove', onEdgeMove);
    window.removeEventListener('pointerup', onEdgeUp);
    e.preventDefault();
  }

  function estimatePerspectiveScale(u,v){
    if (!state.grid) return 1;
    const eps = 0.01;
    const P  = projectQuadBilinear(state.grid.points, u, v);
    const Px = projectQuadBilinear(state.grid.points, clamp01(u+eps), v);
    const Py = projectQuadBilinear(state.grid.points, u, clamp01(v+eps));
    const s = (dist(P,Px) + dist(P,Py))*0.5;

    const refU = 0.5, refV = 0.12;
    const R  = projectQuadBilinear(state.grid.points, refU, refV);
    const Rx = projectQuadBilinear(state.grid.points, clamp01(refU+eps), refV);
    const Ry = projectQuadBilinear(state.grid.points, refU, clamp01(refV+eps));
    const refS = (dist(R,Rx)+dist(R,Ry))*0.5;

    if (refS < 1e-6) return 1;
    return s/refS;
  }

function ensureUVSizeForObject(obj){
  if (!state.grid) return;
  if (!obj.baseW || !obj.baseH){
    const content = obj.contentEl ?? obj.el;
    obj.baseW = Math.max(24, content.offsetWidth || 24);
    obj.baseH = Math.max(18, content.offsetHeight || 18);
  }
  // local density
  const eps = 0.01;
  const P  = projectQuadBilinear(state.grid.points, obj.u, obj.v);
  const Px = projectQuadBilinear(state.grid.points, clamp01(obj.u+eps), obj.v);
  const Py = projectQuadBilinear(state.grid.points, obj.u, clamp01(obj.v+eps));
  const pxPerU = Math.max(1e-6, dist(P,Px) / eps);
  const pxPerV = Math.max(1e-6, dist(P,Py) / eps);

  if (!obj.sizeU || !obj.sizeV){
    obj.sizeU = Math.min(0.9, Math.max(0.02, obj.baseW / pxPerU));
    obj.sizeV = Math.min(0.9, Math.max(0.02, obj.baseH / pxPerV));
  }
  obj._pxPerU = pxPerU;
  obj._pxPerV = pxPerV;
}

  function createTextObject({ id, text, u=0.25, v=0.55, scaleMode='autoPerspective' }){
    if (!id) throw new Error('PreviewOrion.createTextObject: missing id');

    let obj = state.objects.get(id);
    if (!obj){
      const wrap = document.createElement('div');
      wrap.className = 'preview-orion__textWrap';
      wrap.dataset.objectId = id;
      wrap.style.cursor = 'default';
      // drag is handled by the content element (border/text)
const content = document.createElement('div');
      content.className = 'preview-orion__textObj';
      content.textContent = text ?? id;
      // let wrapper handle interactions; content stays transparent to pointer events
      content.style.pointerEvents = 'auto';
      content.dataset.objectId = id;
      content.addEventListener('pointerdown', onTextDown);
      content.addEventListener('pointermove', onTextHover);
      content.addEventListener('pointerleave', onTextLeave);

      wrap.appendChild(content);
      state.objectsLayer.appendChild(wrap);

      obj = { id, el: wrap, contentEl: content, u: clamp01(u), v: clamp01(v), scaleMode, userScaleX: 1, userScaleY: 1 };
      state.objects.set(id, obj);
    } else {
      if (obj.contentEl) obj.contentEl.textContent = text ?? obj.contentEl.textContent; else obj.el.textContent = text ?? obj.el.textContent;
      obj.u = clamp01(u);
      obj.v = clamp01(v);
      obj.scaleMode = scaleMode ?? obj.scaleMode;
    }
    updateObject(obj);
    return id;
  }

  
function updateObject(obj){
    if (!state.grid) return;

    // If "laid" on grid: warp the element to match grid perspective (like print on box)
    if (obj.layOnGrid){
      ensureUVSizeForObject(obj);
      const w = obj.baseW;
      const h = obj.baseH;
      const ux = (obj.userScaleX ?? 1);
      const uy = (obj.userScaleY ?? 1);
      const du = Math.min(0.9, Math.max(0.02, (obj.sizeU ?? 0.1) * ux));
      const dv = Math.min(0.9, Math.max(0.02, (obj.sizeV ?? 0.06) * uy));

      const u0 = clamp01(obj.u - du*0.5), v0 = clamp01(obj.v - dv*0.5);
      const u1 = clamp01(obj.u + du*0.5), v1 = clamp01(obj.v + dv*0.5);

      const quad = [
        projectQuadBilinear(state.grid.points, u0, v0),
        projectQuadBilinear(state.grid.points, u1, v0),
        projectQuadBilinear(state.grid.points, u1, v1),
        projectQuadBilinear(state.grid.points, u0, v1),
      ];

      const H = homographyRectToQuad(w, h, quad);
      if (!H) return;

      obj.el.style.left = `0px`;
      obj.el.style.top = `0px`;
      obj.el.style.width = `${w}px`;
      obj.el.style.height = `${h}px`;
      obj.el.style.transformOrigin = `0 0`;
      obj.el.style.transform = homographyToCssMatrix3d(H);

      // Ensure inner content sits at (0,0) inside wrapper
      if (obj.contentEl){
        obj.contentEl.style.left = '0px';
        obj.contentEl.style.top = '0px';
        obj.contentEl.style.position = 'absolute';
        obj.contentEl.style.transform = 'none';
        obj.contentEl.style.width = '100%';
        obj.contentEl.style.height = '100%';
        obj.contentEl.style.display = 'flex';
        obj.contentEl.style.alignItems = 'center';
        obj.contentEl.style.justifyContent = 'center';
      }
      return;
    }

    // Default: centered at projected (u,v) with auto perspective scale
    const p = projectQuadBilinear(state.grid.points, obj.u, obj.v);
    let sc = 1;
    if (obj.scaleMode === 'autoPerspective'){
      sc = estimatePerspectiveScale(obj.u, obj.v);
      sc = Math.max(0.2, Math.min(2.5, sc));
    }
    obj.el.style.left = `${p.x}px`;
    obj.el.style.top = `${p.y}px`;
    const ux = (obj.userScaleX ?? 1);
    const uy = (obj.userScaleY ?? 1);
    obj.el.style.transformOrigin = 'center center';
    obj.el.style.width = 'auto';
    obj.el.style.height = 'auto';
    obj.el.style.transform = `translate(-50%,-50%) scale(${sc}) scaleX(${ux}) scaleY(${uy})`;
  }


  function updateAllObjects(){
    for (const obj of state.objects.values()) updateObject(obj);
  }

  function createGrid(){
    // Cleanup previous grid DOM artifacts (handles/edges) to avoid duplicates
    const oldCornerHandles = state.overlay.querySelectorAll('.preview-orion__handle');
    oldCornerHandles.forEach(el => el.remove());
    const oldEdgeHandles = state.overlay.querySelectorAll('.preview-orion__edgeHandle');
    oldEdgeHandles.forEach(el => el.remove());
    svgClear();

    const r = state.viewport.getBoundingClientRect();
    const w = r.width, h = r.height;

    const P00 = { x: w*0.20, y: h*0.28 };
    const P10 = { x: w*0.78, y: h*0.30 };
    const P11 = { x: w*0.68, y: h*0.78 };
    const P01 = { x: w*0.30, y: h*0.80 };

    state.grid = { points:[P00,P10,P11,P01], handles:[], edgeHandles:[], divisions:10 };
    ensureHandles();
    ensureEdgeHandles();
    setGridVisible(true);
    drawGrid();
    return 'grid1';
  }

  let animRaf = 0;
  function demoAnimateText(objectId, durationMs=5000){
    cancelAnimationFrame(animRaf);
    const obj = state.objects.get(objectId);
    if (!obj) return;
    const t0 = performance.now();
    const u0 = 0.10, u1 = 0.90;
    const vFixed = obj.v;

    const step = (now)=>{
      const k = Math.min(1, Math.max(0, (now - t0)/durationMs));
      const u = u0 + (u1-u0)*k;
      obj.u = u; obj.v = vFixed;
updateObject(obj);
      if (k < 1) animRaf = requestAnimationFrame(step);
    };
    animRaf = requestAnimationFrame(step);
  }

  // ResizeObserver: redraw grid if exists
  const ro = new ResizeObserver(()=>{
    if (state.grid) drawGrid();
  });
  ro.observe(state.viewport);

  // Footer buttons (minimal & safe)
  function mkBtn(txt){
    const b = document.createElement('button');
    b.className = 'btn';
    b.type = 'button';
    b.textContent = txt;
    return b;
  }

  const btnGrid = mkBtn('Grid');
  const btnToggle = mkBtn('Hide');
  const btnText = mkBtn('Text');
  const btnLay = mkBtn('Lay on Grid');
  const btnDemo = mkBtn('Demo');

  btnGrid.addEventListener('click', ()=> createGrid());
  btnToggle.addEventListener('click', ()=>{
    setGridVisible(!state.gridVisible);
    btnToggle.textContent = state.gridVisible ? 'Hide' : 'Show';
  });
  btnText.addEventListener('click', ()=>{
    if (!state.grid) createGrid();
    createTextObject({ id:'demoText', text:'Text on Grid', u:0.25, v:0.55 });
});
  btnDemo.addEventListener('click', ()=> demoAnimateText('demoText', 5000));
  btnLay.addEventListener('click', ()=>{
    const obj = state.objects.get('demoText');
    if (!obj) return;
    obj.layOnGrid = true;
    // capture baseline size in UV so resize/scale is stable in laid mode
    ensureUVSizeForObject(obj);
    updateObject(obj);
  });


  const controlsTarget = footerRightEl || floatingControls;
  if (controlsTarget){
    controlsTarget.appendChild(btnGrid);
    controlsTarget.appendChild(btnToggle);
    controlsTarget.appendChild(btnText);
    controlsTarget.appendChild(btnLay);
    controlsTarget.appendChild(btnDemo);
  }

  const api = {
    createGrid,
    toggleGrid: ()=> btnToggle.click(),
    createTextObject,
    selectObject,
    setObjectText(id, text){
      const obj = state.objects.get(id);
      if (!obj) return;
      const val = (text == null) ? '' : String(text);
      if (obj.contentEl) obj.contentEl.textContent = val;
      else if (obj.el) obj.el.textContent = val;
      updateObject(obj);
    },
    setObjectUV(id,u,v){
      const obj = state.objects.get(id);
      if (!obj) return;
      obj.u = clamp01(u); obj.v = clamp01(v);
      updateObject(obj);
    },
    demoAnimateText,
    layObjectOnGrid(id){
      const obj = state.objects.get(id);
      if (!obj) return;
      obj.layOnGrid = true;
      updateObject(obj);
    }
  };

  // expose
  window.PreviewOrion = api;
  return api;
}
