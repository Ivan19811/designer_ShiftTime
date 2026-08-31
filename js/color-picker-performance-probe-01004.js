// 01004-COLOR-PICKER-PERFORMANCE-PROBE
// Diagnostic only. No template/store writes. Measures the native <input type="color"> window interval.
// Mode A = normal Builder. Mode B = diagnostic freeze: canvas rendering/animations + slider/carousel runtime + debug perf writes paused.

const VERSION = '01004-color-picker-performance-probe';
const STORE_KEY = 'st_color_picker_perf_probe_01004_v1';
const MAX_RUNS = 8;
const MAX_MS = 20000;
let runs = [];
let active = null;
let modal = null;
let statusTimer = 0;

function nowIso(){ try { return new Date().toISOString(); } catch { return String(Date.now()); } }
function now(){ return performance?.now?.() ?? Date.now(); }
function round(n, d = 2){ const p = 10 ** d; return Math.round((Number(n)||0)*p)/p; }
function safeJson(v){ try { return JSON.parse(JSON.stringify(v)); } catch { return null; } }
function readRuns(){
  try { const p = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); runs = Array.isArray(p) ? p.slice(-MAX_RUNS) : []; }
  catch { runs = []; }
}
function saveRuns(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(runs.slice(-MAX_RUNS))); } catch {} }
function pct(arr, p){
  const a = (arr||[]).filter(Number.isFinite).sort((x,y)=>x-y); if(!a.length) return 0;
  const i = Math.max(0, Math.min(a.length-1, Math.round((a.length-1)*p))); return a[i];
}
function summarize(arr){
  const a=(arr||[]).filter(Number.isFinite); if(!a.length) return {count:0,min:0,avg:0,p50:0,p95:0,max:0};
  const sum=a.reduce((x,y)=>x+y,0); return {count:a.length,min:round(Math.min(...a)),avg:round(sum/a.length),p50:round(pct(a,.5)),p95:round(pct(a,.95)),max:round(Math.max(...a))};
}
function describe(el){
  if (!(el instanceof Element)) return null;
  const r=el.getBoundingClientRect();
  return {tag:el.tagName,id:el.id||'',className:String(el.className||'').slice(0,220),dataFill:el.getAttribute('data-fill')||'',value:String(el.value||'').slice(0,80),rect:{x:round(r.x),y:round(r.y),w:round(r.width),h:round(r.height)}};
}
function canvasSnapshot(){
  const root=document.getElementById('site-root'); const r=root?.getBoundingClientRect?.();
  return {
    rootPresent:!!root,
    rootRect:r?{w:round(r.width),h:round(r.height),x:round(r.x),y:round(r.y)}:null,
    elements:root?.querySelectorAll?.('*').length||0,
    bgfx:root?.querySelectorAll?.('.st-bgfx').length||0,
    sliders:root?.querySelectorAll?.('[data-st-fx-bg-slider]').length||0,
    carousels:root?.querySelectorAll?.('[data-st-block-carousel],[data-st-fx-block-carousel]').length||0,
    selected:root?.querySelectorAll?.('.is-selected,.sf-selection-current,.hb-dom-selected').length||0,
    viewport:{w:innerWidth,h:innerHeight,dpr:devicePixelRatio||1}
  };
}
function animationSnapshot(){
  try {
    const list=document.getAnimations?.({subtree:true})||[];
    const byState={};
    for(const a of list){ const s=String(a.playState||'unknown'); byState[s]=(byState[s]||0)+1; }
    return {count:list.length,byState};
  } catch { return {count:0,byState:{},error:'getAnimations-failed'}; }
}
function runtimeSnapshot(){
  try { return window.ST_COLOR_PICKER_RUNTIME_GATE_01004?.snapshot?.() || {available:false}; }
  catch(e){ return {available:false,error:e?.message||String(e)}; }
}
function memorySnapshot(){
  try {
    const m=performance?.memory;
    return m?{usedJSHeapSize:m.usedJSHeapSize,totalJSHeapSize:m.totalJSHeapSize,jsHeapSizeLimit:m.jsHeapSizeLimit}:null;
  } catch { return null; }
}
function targetVisualSnapshot(input){
  try {
    const selected=document.querySelector('#site-root .sf-selection-current,#site-root .is-selected,#site-root .hb-dom-selected');
    if(!(selected instanceof HTMLElement)) return {selected:null};
    const cs=getComputedStyle(selected);
    return {
      selected:describe(selected),
      input:describe(input),
      fillAuthority:selected.style.getPropertyValue('--st-fill-authority-v').trim(),
      fill:selected.style.getPropertyValue('--st-bgfx-bg').trim().slice(0,300),
      fillOpacity:selected.style.getPropertyValue('--st-bgfx-bg-opacity').trim(),
      filterColor:selected.style.getPropertyValue('--st-bgfx-filter-color').trim(),
      filterOpacity:selected.style.getPropertyValue('--st-bgfx-filter-opacity').trim(),
      blockBlur:selected.style.getPropertyValue('--st-block-surface-blur').trim(),
      computed:{backgroundImage:cs.backgroundImage,filter:cs.filter,backdropFilter:cs.backdropFilter||cs.webkitBackdropFilter||''}
    };
  } catch(e){ return {error:e?.message||String(e)}; }
}

function ensureStyles(){
  if(document.getElementById('st-color-probe-css-01004')) return;
  const st=document.createElement('style'); st.id='st-color-probe-css-01004'; st.textContent=`
    .st-color-probe-btn-01004{height:36px;padding:0 12px;border:1px solid rgba(34,211,238,.45);border-radius:10px;background:#082f49;color:#cffafe;font-weight:800;cursor:pointer;margin-right:8px}
    .st-color-probe-btn-01004.is-active{background:#7c2d12;color:#fff7ed;border-color:#fb923c}
    .st-color-probe-modal-01004{position:fixed;z-index:2147483600;inset:72px 24px 24px auto;width:min(760px,calc(100vw - 48px));display:none;flex-direction:column;background:#07111f;color:#e0f2fe;border:1px solid rgba(34,211,238,.35);border-radius:18px;box-shadow:0 24px 90px rgba(0,0,0,.5);overflow:hidden}
    .st-color-probe-modal-01004.is-open{display:flex}.st-color-probe-head-01004{display:flex;justify-content:space-between;gap:12px;padding:14px 16px;background:#0c1f33;border-bottom:1px solid rgba(125,211,252,.2)}
    .st-color-probe-head-01004 b{font-size:15px}.st-color-probe-head-01004 span{display:block;font-size:12px;color:#bae6fd;margin-top:4px}.st-color-probe-close-01004{width:34px;height:34px;border:0;border-radius:9px;background:#172554;color:#fff;font-size:20px;cursor:pointer}
    .st-color-probe-body-01004{padding:14px;overflow:auto}.st-color-probe-grid-01004{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.st-color-probe-test-01004{padding:12px;border:1px solid rgba(125,211,252,.25);border-radius:12px;background:#0f2841;color:#e0f2fe;font-weight:800;cursor:pointer;text-align:left}.st-color-probe-test-01004 small{display:block;font-weight:500;color:#bae6fd;margin-top:4px}
    .st-color-probe-note-01004{font-size:12px;line-height:1.5;color:#bae6fd;margin:8px 0 12px}.st-color-probe-actions-01004{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.st-color-probe-actions-01004 button{padding:8px 11px;border:1px solid rgba(125,211,252,.25);border-radius:9px;background:#102a43;color:#e0f2fe;cursor:pointer}
    .st-color-probe-report-01004{width:100%;min-height:280px;resize:vertical;box-sizing:border-box;border:1px solid rgba(125,211,252,.25);border-radius:12px;background:#020617;color:#dbeafe;padding:10px;font:11px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}.st-color-probe-status-01004{font-size:12px;color:#fde68a;min-height:18px;margin:6px 0}
    html.st-color-probe-freeze-01004 #site-root{content-visibility:hidden!important}
    html.st-color-probe-freeze-01004 #site-root,html.st-color-probe-freeze-01004 #site-root *{animation-play-state:paused!important;transition:none!important}
    @media(max-width:720px){.st-color-probe-grid-01004{grid-template-columns:1fr}.st-color-probe-modal-01004{left:10px;right:10px;top:60px;bottom:10px;width:auto}}
  `; document.head.appendChild(st);
}

function fullReport(){
  readRuns();
  const lines=['SHIFT TIME BUILDER · COLOR PICKER PERFORMANCE PROBE 01004',`Generated: ${nowIso()}`,`User agent: ${navigator.userAgent}`,''];
  if(!runs.length){ lines.push('NO RUNS YET'); return lines.join('\n'); }
  runs.forEach((r,i)=>{ lines.push(`RUN ${i+1}/${runs.length}`); lines.push(JSON.stringify(r,null,2)); lines.push(''); });
  if(runs.length>=2){
    const A=[...runs].reverse().find(x=>x.mode==='A'); const B=[...runs].reverse().find(x=>x.mode==='B');
    if(A&&B){
      lines.push('A/B QUICK COMPARISON');
      lines.push(JSON.stringify({
        A:{kind:A.kind,durationMs:A.durationMs,inputCount:A.events.inputCount,frameP95:A.frames.p95,frameMax:A.frames.max,longTaskMs:A.longTasks.totalDurationMs,mutationCount:A.mutations.total,eventTaskMax:A.events.handlerTaskMs.max},
        B:{kind:B.kind,durationMs:B.durationMs,inputCount:B.events.inputCount,frameP95:B.frames.p95,frameMax:B.frames.max,longTaskMs:B.longTasks.totalDurationMs,mutationCount:B.mutations.total,eventTaskMax:B.events.handlerTaskMs.max},
        hint:'If B is much smoother/lower than A, canvas animation/render/runtime load is causal. If A and B are similar, inspect native input event handler/task cost and non-canvas main-thread work.'
      },null,2));
    }
  }
  return lines.join('\n');
}
async function copyText(text){
  try{ await navigator.clipboard.writeText(text); return true; }catch{}
  const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); let ok=false; try{ok=document.execCommand('copy')}catch{} ta.remove(); return ok;
}
function download(text){
  try{ const u=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})); const a=document.createElement('a'); a.href=u; a.download=`SHIFT_TIME_COLOR_PICKER_PROBE_01004_${nowIso().replace(/[:.]/g,'-')}.txt`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),1000); return true;}catch{return false}
}

function ensureModal(){
  ensureStyles(); if(modal) return modal;
  modal=document.createElement('div'); modal.className='st-color-probe-modal-01004'; modal.id='st-color-probe-modal-01004';
  modal.innerHTML=`<div class="st-color-probe-head-01004"><div><b>COLOR PICKER PERFORMANCE PROBE · 01004</b><span>Вимірює саме час, коли відкрита нативна палітра Chrome/Windows.</span></div><button class="st-color-probe-close-01004" type="button">×</button></div><div class="st-color-probe-body-01004"><div class="st-color-probe-grid-01004"><button class="st-color-probe-test-01004" data-kind="fill" data-mode="A">ФОН · ТЕСТ A<small>Звичайний Builder — нічого не заморожуємо.</small></button><button class="st-color-probe-test-01004" data-kind="filter" data-mode="A">ФІЛЬТР · ТЕСТ A<small>Звичайний Builder — нічого не заморожуємо.</small></button><button class="st-color-probe-test-01004" data-kind="fill" data-mode="B">ФОН · ТЕСТ B<small>Canvas render + анімації + slider/carousel + perf-log заморожені.</small></button><button class="st-color-probe-test-01004" data-kind="filter" data-mode="B">ФІЛЬТР · ТЕСТ B<small>Canvas render + анімації + slider/carousel + perf-log заморожені.</small></button></div><div class="st-color-probe-note-01004">Для кожного тесту: натисни кнопку → відкриється палітра → води кружечком 8–10 секунд → закрий палітру. Зроби хоча б A і B для одного й того самого кольору. Після цього скопіюй або збережи звіт.</div><div class="st-color-probe-status-01004" data-status></div><div class="st-color-probe-actions-01004"><button type="button" data-copy>Скопіювати COLOR LOG</button><button type="button" data-file>Зберегти TXT</button><button type="button" data-clear>Очистити тести</button><button type="button" data-stop>Зупинити активний тест</button></div><textarea class="st-color-probe-report-01004" data-report spellcheck="false"></textarea></div>`;
  document.body.appendChild(modal);
  const refresh=()=>{ const ta=modal.querySelector('[data-report]'); if(ta) ta.value=fullReport(); };
  modal.querySelector('.st-color-probe-close-01004').onclick=()=>modal.classList.remove('is-open');
  modal.querySelectorAll('[data-kind][data-mode]').forEach(btn=>btn.addEventListener('click',()=>startFromButton(btn.dataset.kind,btn.dataset.mode)));
  modal.querySelector('[data-copy]').onclick=async()=>{ const ok=await copyText(fullReport()); setStatus(ok?'COLOR LOG скопійовано.':'Не вдалося скопіювати — збережи TXT.'); refresh(); };
  modal.querySelector('[data-file]').onclick=()=>{ setStatus(download(fullReport())?'TXT збережено.':'Не вдалося створити TXT.'); };
  modal.querySelector('[data-clear]').onclick=()=>{ runs=[]; saveRuns(); refresh(); setStatus('Тести очищено.'); };
  modal.querySelector('[data-stop]').onclick=()=>{ if(active) finishSession('manual-stop'); else setStatus('Активного тесту немає.'); };
  refresh(); return modal;
}
function setStatus(text){ const m=ensureModal(); const s=m.querySelector('[data-status]'); if(s) s.textContent=String(text||''); }
function openModal(){ ensureModal().classList.add('is-open'); const ta=modal.querySelector('[data-report]'); if(ta) ta.value=fullReport(); setStatus(active?`Активний тест ${active.mode}/${active.kind}…`:'Готово до тесту.'); }
function ensureButton(){
  ensureStyles(); if(document.getElementById('st-color-probe-btn-01004')) return;
  const host=document.querySelector('.builder__header-right')||document.querySelector('.builder__header')||document.body;
  const b=document.createElement('button'); b.id='st-color-probe-btn-01004'; b.type='button'; b.className='st-color-probe-btn-01004'; b.textContent='COLOR LOG'; b.title='Діагностика гальмування нативної палітри кольору'; b.onclick=openModal; host.insertBefore(b,host.firstElementChild||null);
}

function findInput(kind){
  return document.querySelector(kind==='filter'?'[data-fill="filterColor"]':'[data-fill="color"]');
}
function freezeForB(){
  const snap={animations:[],runtime:null,perf:null};
  document.documentElement.classList.add('st-color-probe-freeze-01004');
  try{
    const list=document.getAnimations?.({subtree:true})||[];
    for(const a of list){ if(a.playState==='running'){ try{a.pause(); snap.animations.push(a);}catch{} } }
  }catch{}
  try{ snap.runtime=window.ST_COLOR_PICKER_RUNTIME_GATE_01004?.pauseAll?.('color-picker-probe-B')||null; }catch{}
  try{
    const api=window.ST_AI_DEBUG_LOG;
    if(api&&typeof api.perf==='function'){
      const fn=api.perf;
      try {
        api.perf=()=>{};
        if (api.perf !== fn) snap.perf={api,fn};
      } catch {}
    }
  }catch{}
  window.__ST_COLOR_PICKER_PROBE_SUPPRESS_ALL_LOG_01004=true;
  return snap;
}
function restoreB(snap){
  document.documentElement.classList.remove('st-color-probe-freeze-01004');
  try{ window.ST_COLOR_PICKER_RUNTIME_GATE_01004?.restore?.(snap?.runtime); }catch{}
  try{ (snap?.animations||[]).forEach(a=>{ try{ if(a.playState==='paused') a.play(); }catch{} }); }catch{}
  try{ if(snap?.perf?.api&&snap?.perf?.fn) snap.perf.api.perf=snap.perf.fn; }catch{}
  window.__ST_COLOR_PICKER_PROBE_SUPPRESS_ALL_LOG_01004=false;
}

function beginSession(input,kind,mode){
  if(active) finishSession('superseded');
  const t0=now();
  const stats={
    version:VERSION,kind,mode,startedAt:nowIso(),startPerf:t0,inputStartValue:String(input.value||''),
    events:{inputCount:0,changeCount:0,focusCount:0,blurCount:0,windowBlurCount:0,windowFocusCount:0,inputGaps:[],handlerTaskDurations:[],lastInputAt:0},
    frameGaps:[],timerDrifts:[],longTaskEntries:[],mutations:{total:0,attributes:0,childList:0,characterData:0,style:0,class:0,otherAttrs:0},
    before:{canvas:canvasSnapshot(),animations:animationSnapshot(),runtime:runtimeSnapshot(),memory:memorySnapshot(),visual:targetVisualSnapshot(input)},
    freeze:null,windowBlurSeen:false
  };
  if(mode==='B') stats.freeze=freezeForB();
  const cleanup=[];
  const on=(obj,name,fn,opt)=>{ obj.addEventListener(name,fn,opt); cleanup.push(()=>obj.removeEventListener(name,fn,opt)); };
  const onInput=()=>{
    const t=now(); stats.events.inputCount+=1;
    if(stats.events.lastInputAt) stats.events.inputGaps.push(t-stats.events.lastInputAt);
    stats.events.lastInputAt=t; const start=t;
    queueMicrotask(()=>{ stats.events.handlerTaskDurations.push(now()-start); });
  };
  const onChange=()=>{ stats.events.changeCount+=1; setTimeout(()=>finishSession('input-change'),0); };
  const onFocus=()=>{ stats.events.focusCount+=1; };
  const onBlur=()=>{ stats.events.blurCount+=1; };
  const onWinBlur=()=>{ stats.events.windowBlurCount+=1; stats.windowBlurSeen=true; };
  const onWinFocus=()=>{ stats.events.windowFocusCount+=1; if(stats.windowBlurSeen && now()-t0>700) setTimeout(()=>{ if(active?.stats===stats) finishSession('window-focus-return'); },250); };
  on(input,'input',onInput,true); on(input,'change',onChange,true); on(input,'focus',onFocus,true); on(input,'blur',onBlur,true); on(window,'blur',onWinBlur,true); on(window,'focus',onWinFocus,true);

  let lastFrame=0, raf=0;
  const tick=(ts)=>{ if(!active||active.stats!==stats) return; if(lastFrame) stats.frameGaps.push(ts-lastFrame); lastFrame=ts; raf=requestAnimationFrame(tick); };
  raf=requestAnimationFrame(tick); cleanup.push(()=>{ try{cancelAnimationFrame(raf)}catch{} });

  let expected=now()+100; const interval=setInterval(()=>{ const t=now(); stats.timerDrifts.push(Math.max(0,t-expected)); expected=t+100; },100); cleanup.push(()=>clearInterval(interval));

  let po=null;
  try{ po=new PerformanceObserver(list=>{ for(const e of list.getEntries()) stats.longTaskEntries.push({startTime:round(e.startTime),duration:round(e.duration)}); }); po.observe({entryTypes:['longtask']}); cleanup.push(()=>po.disconnect()); }catch{}
  let mo=null;
  try{
    const root=document.getElementById('site-root')||document.documentElement;
    mo=new MutationObserver(records=>{ for(const r of records){ stats.mutations.total+=1; if(r.type==='attributes'){stats.mutations.attributes+=1; if(r.attributeName==='style')stats.mutations.style+=1; else if(r.attributeName==='class')stats.mutations.class+=1; else stats.mutations.otherAttrs+=1;} else if(r.type==='childList')stats.mutations.childList+=1; else if(r.type==='characterData')stats.mutations.characterData+=1; } });
    mo.observe(root,{subtree:true,attributes:true,childList:true,characterData:true}); cleanup.push(()=>mo.disconnect());
  }catch{}
  const timeout=setTimeout(()=>finishSession('timeout-20s'),MAX_MS); cleanup.push(()=>clearTimeout(timeout));

  active={input,kind,mode,stats,cleanup,freeze:stats.freeze};
  document.getElementById('st-color-probe-btn-01004')?.classList.add('is-active');
  return active;
}

function finishSession(reason){
  const s=active; if(!s) return null; active=null;
  for(const fn of s.cleanup||[]){ try{fn()}catch{} }
  if(s.mode==='B') restoreB(s.freeze);
  document.getElementById('st-color-probe-btn-01004')?.classList.remove('is-active');
  const st=s.stats; const end=now();
  const longDur=st.longTaskEntries.reduce((a,e)=>a+(Number(e.duration)||0),0);
  const run={
    version:VERSION,kind:s.kind,mode:s.mode,startedAt:st.startedAt,endedAt:nowIso(),reason,durationMs:round(end-st.startPerf),startValue:st.inputStartValue,endValue:String(s.input?.value||''),
    events:{inputCount:st.events.inputCount,changeCount:st.events.changeCount,focusCount:st.events.focusCount,blurCount:st.events.blurCount,windowBlurCount:st.events.windowBlurCount,windowFocusCount:st.events.windowFocusCount,inputGapMs:summarize(st.events.inputGaps),handlerTaskMs:summarize(st.events.handlerTaskDurations)},
    frames:{...summarize(st.frameGaps),over20ms:st.frameGaps.filter(x=>x>20).length,over33ms:st.frameGaps.filter(x=>x>33).length,over50ms:st.frameGaps.filter(x=>x>50).length,over100ms:st.frameGaps.filter(x=>x>100).length},
    eventLoopTimerDriftMs:summarize(st.timerDrifts),
    longTasks:{count:st.longTaskEntries.length,totalDurationMs:round(longDur),maxDurationMs:round(Math.max(0,...st.longTaskEntries.map(x=>x.duration))),entries:st.longTaskEntries.slice(0,40)},
    mutations:st.mutations,
    before:st.before,
    after:{canvas:canvasSnapshot(),animations:animationSnapshot(),runtime:runtimeSnapshot(),memory:memorySnapshot(),visual:targetVisualSnapshot(s.input)},
    BFreezeApplied:s.mode==='B'?{canvasContentVisibilityHidden:true,animationsPaused:st.freeze?.animations?.length||0,runtimePause:st.freeze?.runtime?{sliderCount:st.freeze.runtime.sliderCount||0,carouselCount:st.freeze.runtime.carouselCount||0}:null,allLogUiSuppressed:true,perfLoggerSuppressed:!!st.freeze?.perf}:null
  };
  runs.push(run); runs=runs.slice(-MAX_RUNS); saveRuns();
  try{ window.__ST_ALL_LOG__?.push?.('color-picker-probe:result-01004',{mode:run.mode,kind:run.kind,durationMs:run.durationMs,inputCount:run.events.inputCount,frameP95:run.frames.p95,frameMax:run.frames.max,longTaskMs:run.longTasks.totalDurationMs,mutations:run.mutations.total,eventHandlerMax:run.events.handlerTaskMs.max,reason:run.reason}); }catch{}
  openModal(); const ta=modal?.querySelector('[data-report]'); if(ta) ta.value=fullReport(); setStatus(`Готово: ${run.mode}/${run.kind}. Input events: ${run.events.inputCount}, frame max: ${run.frames.max} ms, long tasks: ${run.longTasks.count}.`);
  return run;
}

function startFromButton(kind,mode){
  const input=findInput(kind);
  if(!(input instanceof HTMLInputElement)){
    setStatus('Не знайдено поле кольору у віджеті «Заливка». Відкрий Дизайн → Заливка, вибери блок і повтори тест.');
    try{ window.dispatchEvent(new Event('st:ensure-design-panel-ready')); }catch{}
    return;
  }
  modal?.classList.remove('is-open');
  beginSession(input,kind,mode);
  try{ input.click(); }
  catch(e){ finishSession('picker-open-error'); openModal(); setStatus(`Не вдалося відкрити палітру: ${e?.message||e}`); }
}

function boot(){
  readRuns(); ensureButton();
  window.ST_COLOR_PICKER_PROBE_01004=Object.freeze({open:openModal,report:fullReport,runs:()=>safeJson(runs),start:(kind='fill',mode='A')=>startFromButton(kind,mode),stop:()=>finishSession('api-stop'),clear:()=>{runs=[];saveRuns();}});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
