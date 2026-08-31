// 01054 · Inspector font control + draggable/resizable main-window appearance panel.
import { createBuilderUiPreferences01054 } from './builder-ui-preferences-01054.js?v=01054';

const STAGE = '01054';
const preferences = createBuilderUiPreferences01054();
let inspectorPopover = null;
let appearanceWindow = null;
let colorRaf = 0;

const COLOR_FIELDS = Object.freeze([
  ['background','Фон головного вікна'],
  ['surface','Колір блоків / карток'],
  ['surfaceAlt','Колір полів / другого шару'],
  ['header','Колір шапки'],
  ['text','Основний текст'],
  ['muted','Другорядний текст'],
  ['border','Бордери блоків'],
  ['accent','Акцент / активні елементи']
]);

function esc01054(value){
  return String(value ?? '').replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function clamp01054(value,min,max){ return Math.min(max,Math.max(min,value)); }
function px01054(value){ return `${Math.round(Number(value)||0)}px`; }

function sampleColor01054(selector, property='backgroundColor', fallback='#ffffff'){
  try {
    const el=document.querySelector(selector);
    if(!el)return fallback;
    const raw=getComputedStyle(el)[property]||'';
    const m=raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/i);
    if(!m)return fallback;
    if(m[4]!==undefined && Number(m[4])<=0.01)return fallback;
    return '#'+[m[1],m[2],m[3]].map(v=>Number(v).toString(16).padStart(2,'0')).join('');
  }catch{return fallback;}
}

function effectiveColors01054(state){
  const a=state.appearance||{};
  return {
    background:a.background||sampleColor01054('.mp-studio-01051','backgroundColor','#f4f7f5'),
    surface:a.surface||sampleColor01054('.mp-card','backgroundColor','#ffffff'),
    surfaceAlt:a.surfaceAlt||sampleColor01054('.mp-toolbar','backgroundColor','#f8fbf9'),
    header:a.header||sampleColor01054('.mp-topbar','backgroundColor','#ffffff'),
    text:a.text||sampleColor01054('.mp-page-head h1','color','#15231b'),
    muted:a.muted||sampleColor01054('.mp-page-head p','color','#6d7f75'),
    border:a.border||sampleColor01054('.mp-card','borderTopColor','#e0e9e4'),
    accent:a.accent||'#138a50'
  };
}

function hasAppearanceOverrides01054(a){
  if(!a)return false;
  if(Number(a.fontScale)!==1)return true;
  if(['background','surface','surfaceAlt','header','text','muted','border','accent'].some(k=>!!a[k]))return true;
  return ['radius','borderWidth','shadow','workspacePadding'].some(k=>a[k]!==null&&a[k]!==undefined);
}

function applyInspector01054(state=preferences.get()){
  const sidebar=document.getElementById('builder-settings-sidebar');
  if(!sidebar)return;
  const scale=clamp01054(Number(state.inspectorFontScale)||1,.8,1.8);
  sidebar.style.setProperty('--st-inspector-font-scale',String(scale));
  const inspectorSizes={9:9,10:10.5,13:13,14:14,16:16,18:18,20:20};
  Object.entries(inspectorSizes).forEach(([key,base])=>sidebar.style.setProperty(`--st-inspector-font-${key}`,`${(base*scale).toFixed(2)}px`));
  sidebar.style.setProperty('--st-inspector-dot-size',`${(12*Math.min(scale,1.35)).toFixed(2)}px`);
  const value=document.querySelector('[data-st-inspector-font-value]');
  if(value)value.textContent=`${Math.round(scale*100)}%`;
  const range=document.querySelector('[data-st-inspector-font-range]');
  if(range&&String(range.value)!==String(Math.round(scale*100)))range.value=String(Math.round(scale*100));
}

function applyAppearance01054(state=preferences.get()){
  const root=document.getElementById('builder-root');
  if(!root)return;
  const a=state.appearance||{};
  root.dataset.stUiCustom=hasAppearanceOverrides01054(a)?'1':'0';
  const mainScale=clamp01054(Number(a.fontScale)||1,.8,1.6);
  root.style.setProperty('--st-main-font-scale',String(mainScale));
  const mainSizes={9:9,10:10,11:11,14:14,23:23,25:25};
  Object.entries(mainSizes).forEach(([key,base])=>root.style.setProperty(`--st-main-font-${key}`,`${(base*mainScale).toFixed(2)}px`));
  const map={
    background:'--st-ui-bg',surface:'--st-ui-surface',surfaceAlt:'--st-ui-surface-alt',header:'--st-ui-header',
    text:'--st-ui-text',muted:'--st-ui-muted',border:'--st-ui-border',accent:'--st-ui-accent'
  };
  Object.entries(map).forEach(([key,cssVar])=>{
    if(a[key])root.style.setProperty(cssVar,a[key]); else root.style.removeProperty(cssVar);
  });
  const numeric={radius:'--st-ui-radius',borderWidth:'--st-ui-border-width',workspacePadding:'--st-ui-workspace-padding'};
  Object.entries(numeric).forEach(([key,cssVar])=>{
    if(a[key]!==null&&a[key]!==undefined)root.style.setProperty(cssVar,px01054(a[key])); else root.style.removeProperty(cssVar);
  });
  if(a.shadow!==null&&a.shadow!==undefined){
    const alpha=(clamp01054(Number(a.shadow),0,100)/100*.32).toFixed(3);
    const alphaSoft=(clamp01054(Number(a.shadow),0,100)/100*.13).toFixed(3);
    root.style.setProperty('--st-ui-shadow-alpha',alpha);
    root.style.setProperty('--st-ui-shadow-soft-alpha',alphaSoft);
  }else{
    root.style.removeProperty('--st-ui-shadow-alpha');
    root.style.removeProperty('--st-ui-shadow-soft-alpha');
  }
  syncAppearanceControls01054(state);
}

function positionInspectorPopover01054(){
  const btn=document.getElementById('st-inspector-font-settings-btn');
  if(!btn||!inspectorPopover||inspectorPopover.hidden)return;
  const r=btn.getBoundingClientRect();
  const w=inspectorPopover.offsetWidth||270;
  const left=clamp01054(r.right-w,8,Math.max(8,innerWidth-w-8));
  const top=clamp01054(r.bottom+7,8,Math.max(8,innerHeight-(inspectorPopover.offsetHeight||120)-8));
  inspectorPopover.style.left=`${left}px`;
  inspectorPopover.style.top=`${top}px`;
}

function buildInspectorPopover01054(){
  if(inspectorPopover)return inspectorPopover;
  const node=document.createElement('div');
  node.className='st-inspector-font-popover-01054';
  node.hidden=true;
  node.innerHTML=`
    <div class="st-mini-settings-head"><div><b>Розмір Інспектора</b><span>Збільшує шрифт у всіх вкладках Інспектора.</span></div><button type="button" data-st-inspector-close aria-label="Закрити">×</button></div>
    <div class="st-mini-settings-row"><input data-st-inspector-font-range type="range" min="80" max="180" step="5" value="100"><output data-st-inspector-font-value>100%</output></div>
    <div class="st-mini-settings-actions"><button type="button" data-st-inspector-font-reset>100%</button></div>`;
  document.body.appendChild(node);
  inspectorPopover=node;
  node.addEventListener('input',(e)=>{
    const range=e.target.closest('[data-st-inspector-font-range]');
    if(!range)return;
    const value=clamp01054(Number(range.value)||100,80,180)/100;
    const state=preferences.get();state.inspectorFontScale=value;applyInspector01054(state);
  });
  node.addEventListener('change',(e)=>{
    const range=e.target.closest('[data-st-inspector-font-range]');
    if(range)preferences.setInspectorFontScale((Number(range.value)||100)/100);
  });
  node.addEventListener('pointerup',(e)=>{
    const range=e.target.closest('[data-st-inspector-font-range]');
    if(range)preferences.setInspectorFontScale((Number(range.value)||100)/100);
  });
  node.addEventListener('click',(e)=>{
    if(e.target.closest('[data-st-inspector-close]')){node.hidden=true;return;}
    if(e.target.closest('[data-st-inspector-font-reset]')){
      preferences.setInspectorFontScale(1);applyInspector01054();
    }
  });
  return node;
}

function toggleInspectorPopover01054(){
  const node=buildInspectorPopover01054();
  node.hidden=!node.hidden;
  if(!node.hidden){applyInspector01054();requestAnimationFrame(positionInspectorPopover01054);}
}

function appearanceHtml01054(){
  const state=preferences.get();
  const a=state.appearance||{};
  const colors=effectiveColors01054(state);
  const colorRows=COLOR_FIELDS.map(([key,label])=>`<label class="st-ui-color-row"><span>${esc01054(label)}</span><div><input type="color" value="${esc01054(colors[key])}" data-st-ui-color="${key}"><input type="text" value="${esc01054(colors[key])}" maxlength="7" spellcheck="false" data-st-ui-color-text="${key}"></div></label>`).join('');
  return `<div class="st-ui-settings-window-01054" role="dialog" aria-label="Налаштування головного вікна" hidden>
    <header class="st-ui-settings-titlebar" data-st-ui-drag-handle>
      <div><b>Налаштування головного вікна</b><span>Marketplace Studio / Builder UI · ${STAGE}</span></div>
      <div class="st-ui-settings-title-actions"><button type="button" data-st-ui-factory-reset title="Скинути на заводські">↺ Заводські</button><button type="button" data-st-ui-close aria-label="Закрити">×</button></div>
    </header>
    <div class="st-ui-settings-scroll">
      <section class="st-ui-settings-group"><div class="st-ui-settings-group-title"><b>Типографіка та геометрія</b><span>Основний масштаб і форма інтерфейсу.</span></div>
        <div class="st-ui-control-grid">
          <label class="st-ui-slider-control"><span>Розмір шрифту <output data-st-ui-value="fontScale">${Math.round((Number(a.fontScale)||1)*100)}%</output></span><input type="range" min="80" max="160" step="5" value="${Math.round((Number(a.fontScale)||1)*100)}" data-st-ui-range="fontScale"></label>
          <label class="st-ui-slider-control"><span>Радіус блоків <output data-st-ui-value="radius">${a.radius??16}px</output></span><input type="range" min="0" max="36" step="1" value="${a.radius??16}" data-st-ui-range="radius"></label>
          <label class="st-ui-slider-control"><span>Товщина бордера <output data-st-ui-value="borderWidth">${a.borderWidth??1}px</output></span><input type="range" min="0" max="4" step="1" value="${a.borderWidth??1}" data-st-ui-range="borderWidth"></label>
          <label class="st-ui-slider-control"><span>Інтенсивність тіні <output data-st-ui-value="shadow">${a.shadow??45}%</output></span><input type="range" min="0" max="100" step="5" value="${a.shadow??45}" data-st-ui-range="shadow"></label>
          <label class="st-ui-slider-control is-wide"><span>Внутрішній відступ робочого вікна <output data-st-ui-value="workspacePadding">${a.workspacePadding??18}px</output></span><input type="range" min="0" max="36" step="1" value="${a.workspacePadding??18}" data-st-ui-range="workspacePadding"></label>
        </div>
      </section>
      <section class="st-ui-settings-group"><div class="st-ui-settings-group-title"><b>Кольори</b><span>Фон, блоки, текст, бордери та акцент.</span></div><div class="st-ui-color-grid">${colorRows}</div></section>
      <section class="st-ui-settings-group st-ui-settings-note"><b>Збереження</b><p>Зміни зберігаються автоматично у налаштуваннях цього Builder і відновлюються після F5, закриття браузера та перезавантаження комп’ютера. Кнопка «Заводські» прибирає всі ці UI-перевизначення.</p></section>
    </div>
    <div class="st-ui-resize-hint" aria-hidden="true">↘</div>
  </div>`;
}

function buildAppearanceWindow01054(){
  if(appearanceWindow)return appearanceWindow;
  const host=document.createElement('div');
  host.innerHTML=appearanceHtml01054();
  appearanceWindow=host.firstElementChild;
  document.body.appendChild(appearanceWindow);
  bindAppearanceWindow01054(appearanceWindow);
  return appearanceWindow;
}

function restoreWindowGeometry01054(win){
  const g=preferences.get().windowGeometry||{};
  const maxW=Math.max(420,innerWidth-16),maxH=Math.max(360,innerHeight-16);
  const width=clamp01054(Number(g.width)||Math.min(860,innerWidth-36),420,maxW);
  const height=clamp01054(Number(g.height)||Math.min(690,innerHeight-36),360,maxH);
  const left=clamp01054(Number.isFinite(Number(g.left))?Number(g.left):(innerWidth-width)/2,8,Math.max(8,innerWidth-width-8));
  const top=clamp01054(Number.isFinite(Number(g.top))?Number(g.top):Math.max(18,(innerHeight-height)/2),8,Math.max(8,innerHeight-height-8));
  Object.assign(win.style,{width:`${width}px`,height:`${height}px`,left:`${left}px`,top:`${top}px`});
}

function saveWindowGeometry01054(){
  if(!appearanceWindow||appearanceWindow.hidden)return;
  const r=appearanceWindow.getBoundingClientRect();
  preferences.setWindowGeometry({left:r.left,top:r.top,width:r.width,height:r.height});
}

function syncAppearanceControls01054(state=preferences.get()){
  if(!appearanceWindow)return;
  const a=state.appearance||{};
  const values={fontScale:Math.round((Number(a.fontScale)||1)*100),radius:a.radius??16,borderWidth:a.borderWidth??1,shadow:a.shadow??45,workspacePadding:a.workspacePadding??18};
  Object.entries(values).forEach(([key,value])=>{
    const range=appearanceWindow.querySelector(`[data-st-ui-range="${key}"]`);if(range&&String(range.value)!==String(value))range.value=String(value);
    const output=appearanceWindow.querySelector(`[data-st-ui-value="${key}"]`);if(output)output.textContent=key==='fontScale'||key==='shadow'?`${value}%`:`${value}px`;
  });
  const colors=effectiveColors01054(state);
  COLOR_FIELDS.forEach(([key])=>{
    const c=colors[key];
    const picker=appearanceWindow.querySelector(`[data-st-ui-color="${key}"]`);if(picker&&picker.value.toLowerCase()!==c.toLowerCase())picker.value=c;
    const text=appearanceWindow.querySelector(`[data-st-ui-color-text="${key}"]`);if(text&&document.activeElement!==text)text.value=c;
  });
}

function commitRange01054(key, raw, persist=true){
  const state=preferences.get();const a={...(state.appearance||{})};
  const n=Number(raw);
  if(key==='fontScale')a.fontScale=clamp01054(n,80,160)/100;
  else if(key==='radius')a.radius=clamp01054(n,0,36);
  else if(key==='borderWidth')a.borderWidth=clamp01054(n,0,4);
  else if(key==='shadow')a.shadow=clamp01054(n,0,100);
  else if(key==='workspacePadding')a.workspacePadding=clamp01054(n,0,36);
  state.appearance=a;applyAppearance01054(state);
  if(persist)preferences.setAppearance(a);
}

function commitColor01054(key,value,persist=true){
  const v=String(value||'').trim().toLowerCase();
  if(!/^#[0-9a-f]{6}$/i.test(v))return false;
  const state=preferences.get();const a={...(state.appearance||{}),[key]:v};state.appearance=a;applyAppearance01054(state);
  if(persist)preferences.setAppearance({[key]:v});
  return true;
}

function bindAppearanceWindow01054(win){
  win.addEventListener('input',(e)=>{
    const range=e.target.closest('[data-st-ui-range]');
    if(range){commitRange01054(range.dataset.stUiRange,range.value,false);return;}
    const picker=e.target.closest('[data-st-ui-color]');
    if(picker){
      const key=picker.dataset.stUiColor;cancelAnimationFrame(colorRaf);colorRaf=requestAnimationFrame(()=>commitColor01054(key,picker.value,false));
      const text=win.querySelector(`[data-st-ui-color-text="${key}"]`);if(text)text.value=picker.value;
      return;
    }
    const text=e.target.closest('[data-st-ui-color-text]');
    if(text&&/^#[0-9a-f]{6}$/i.test(text.value.trim())){
      const key=text.dataset.stUiColorText;commitColor01054(key,text.value,false);
      const picker2=win.querySelector(`[data-st-ui-color="${key}"]`);if(picker2)picker2.value=text.value;
    }
  });
  win.addEventListener('change',(e)=>{
    const range=e.target.closest('[data-st-ui-range]');if(range){commitRange01054(range.dataset.stUiRange,range.value,true);return;}
    const picker=e.target.closest('[data-st-ui-color]');if(picker){commitColor01054(picker.dataset.stUiColor,picker.value,true);return;}
    const text=e.target.closest('[data-st-ui-color-text]');if(text){if(!commitColor01054(text.dataset.stUiColorText,text.value,true))syncAppearanceControls01054();}
  });
  win.addEventListener('pointerup',(e)=>{
    const range=e.target.closest('[data-st-ui-range]');if(range)commitRange01054(range.dataset.stUiRange,range.value,true);
  });
  win.addEventListener('click',(e)=>{
    if(e.target.closest('[data-st-ui-close]')){saveWindowGeometry01054();win.hidden=true;return;}
    if(e.target.closest('[data-st-ui-factory-reset]')){
      if(!globalThis.confirm||globalThis.confirm('Скинути налаштування Інспектора і головного вікна на заводські?')){
        preferences.resetAll();applyInspector01054();applyAppearance01054();restoreWindowGeometry01054(win);syncAppearanceControls01054();
      }
    }
  });

  const handle=win.querySelector('[data-st-ui-drag-handle]');
  handle?.addEventListener('pointerdown',(e)=>{
    if(e.button!==0||e.target.closest('button,input,select,textarea'))return;
    const rect=win.getBoundingClientRect();
    const startX=e.clientX,startY=e.clientY,startLeft=rect.left,startTop=rect.top;
    try{handle.setPointerCapture(e.pointerId);}catch{}
    const move=(ev)=>{
      const left=clamp01054(startLeft+(ev.clientX-startX),0,Math.max(0,innerWidth-win.offsetWidth));
      const top=clamp01054(startTop+(ev.clientY-startY),0,Math.max(0,innerHeight-54));
      win.style.left=`${left}px`;win.style.top=`${top}px`;
    };
    const up=(ev)=>{
      handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up);
      try{handle.releasePointerCapture(ev.pointerId);}catch{}saveWindowGeometry01054();
    };
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',up);
    e.preventDefault();
  });
}

function openAppearanceWindow01054(){
  const win=buildAppearanceWindow01054();
  restoreWindowGeometry01054(win);syncAppearanceControls01054();win.hidden=false;
}

function installButtonBindings01054(){
  document.addEventListener('click',(e)=>{
    const inspector=e.target.closest('#st-inspector-font-settings-btn');
    if(inspector){e.preventDefault();e.stopPropagation();toggleInspectorPopover01054();return;}
    const main=e.target.closest('[data-st-main-ui-settings]');
    if(main){e.preventDefault();e.stopPropagation();openAppearanceWindow01054();return;}
    if(inspectorPopover&&!inspectorPopover.hidden&&!e.target.closest('.st-inspector-font-popover-01054')) inspectorPopover.hidden=true;
  });
  window.addEventListener('resize',()=>{
    positionInspectorPopover01054();
    if(appearanceWindow&&!appearanceWindow.hidden){
      const r=appearanceWindow.getBoundingClientRect();
      if(r.right>innerWidth||r.bottom>innerHeight){restoreWindowGeometry01054(appearanceWindow);}
    }
  });
  document.addEventListener('pointerup',()=>{ if(appearanceWindow&&!appearanceWindow.hidden) saveWindowGeometry01054(); },true);
  document.addEventListener('keydown',(e)=>{
    if(e.key!=='Escape')return;
    if(inspectorPopover&&!inspectorPopover.hidden){inspectorPopover.hidden=true;return;}
    if(appearanceWindow&&!appearanceWindow.hidden){saveWindowGeometry01054();appearanceWindow.hidden=true;}
  });
}

export function initBuilderUiAppearance01054(){
  applyInspector01054();
  applyAppearance01054();
  installButtonBindings01054();
  try{window.ST_BUILDER_UI_APPEARANCE_01054=Object.freeze({stage:STAGE,preferences,open:openAppearanceWindow01054,apply:()=>{applyInspector01054();applyAppearance01054();}});}catch{}
}
