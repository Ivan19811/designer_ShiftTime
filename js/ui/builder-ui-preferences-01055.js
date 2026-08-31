// 01055 · Builder UI preferences adapter v2.
// UI code talks only to this adapter. Browser persistence remains isolated here.
// MarketplaceStore / MarketplaceRepository are intentionally not involved.

const STORAGE_KEY_01055 = 'st_builder_ui_preferences_v1';

const DEFAULTS_01055 = Object.freeze({
  version: 2,
  inspectorFontScale: 1,
  appearance: {
    fontScale: 1,
    background: '',
    surface: '',
    surfaceAlt: '',
    header: '',
    text: '',
    muted: '',
    border: '',
    accent: '',
    radius: null,
    borderWidth: null,
    shadow: null,
    workspacePadding: null,

    // Auxiliary cards / status rows / chips / badges.
    additionalFontScale: 1,
    additionalSurface: '',
    additionalSurfaceAlt: '',
    additionalText: '',
    additionalMuted: '',
    additionalBorder: '',
    additionalAccent: '',
    additionalRadius: null,
    additionalBorderWidth: null,

    // Right contextual column.
    sideFontScale: 1,
    sidePanel: '',
    sideSurface: '',
    sideText: '',
    sideMuted: '',
    sideBorder: '',
    sideNotice: '',
    sideNoticeText: '',
    sideWarn: '',
    sideWarnText: '',
    sideRadius: null,
    sideBorderWidth: null
  },
  windowGeometry: {
    left: null,
    top: null,
    width: null,
    height: null
  }
});

function cloneDefaults01055(){ return JSON.parse(JSON.stringify(DEFAULTS_01055)); }
function finiteOrNull01055(value){ const n=Number(value); return Number.isFinite(n)?n:null; }
function clamp01055(value,min,max){ return Math.min(max,Math.max(min,value)); }
function normalizeColor01055(value){
  const v=String(value||'').trim();
  return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():'';
}

function normalize01055(raw){
  const out=cloneDefaults01055();
  if(!raw||typeof raw!=='object')return out;

  const inspectorScale=Number(raw.inspectorFontScale);
  if(Number.isFinite(inspectorScale))out.inspectorFontScale=clamp01055(inspectorScale,.8,1.8);

  const a=raw.appearance&&typeof raw.appearance==='object'?raw.appearance:{};
  const scaleRanges={fontScale:[.8,1.6],additionalFontScale:[.8,2.2],sideFontScale:[.8,2.2]};
  Object.entries(scaleRanges).forEach(([key,[min,max]])=>{
    const n=Number(a[key]);
    if(Number.isFinite(n))out.appearance[key]=clamp01055(n,min,max);
  });

  [
    'background','surface','surfaceAlt','header','text','muted','border','accent',
    'additionalSurface','additionalSurfaceAlt','additionalText','additionalMuted','additionalBorder','additionalAccent',
    'sidePanel','sideSurface','sideText','sideMuted','sideBorder','sideNotice','sideNoticeText','sideWarn','sideWarnText'
  ].forEach((key)=>{out.appearance[key]=normalizeColor01055(a[key]);});

  const numericRanges={
    radius:[0,36],borderWidth:[0,4],shadow:[0,100],workspacePadding:[0,36],
    additionalRadius:[0,36],additionalBorderWidth:[0,4],sideRadius:[0,36],sideBorderWidth:[0,4]
  };
  Object.entries(numericRanges).forEach(([key,[min,max]])=>{
    const n=finiteOrNull01055(a[key]);
    out.appearance[key]=n===null?null:clamp01055(n,min,max);
  });

  const g=raw.windowGeometry&&typeof raw.windowGeometry==='object'?raw.windowGeometry:{};
  ['left','top','width','height'].forEach((key)=>{out.windowGeometry[key]=finiteOrNull01055(g[key]);});
  return out;
}

function read01055(){
  try{
    const raw=globalThis.localStorage?.getItem(STORAGE_KEY_01055);
    return raw?normalize01055(JSON.parse(raw)):cloneDefaults01055();
  }catch{return cloneDefaults01055();}
}
function write01055(next){
  const normalized=normalize01055(next);
  try{globalThis.localStorage?.setItem(STORAGE_KEY_01055,JSON.stringify(normalized));}catch{}
  return normalized;
}

export function createBuilderUiPreferences01055(){
  let state=read01055();
  // Reading old 01054 state automatically migrates missing v2 fields to defaults.
  if(state.version!==2){state.version=2;state=write01055(state);}
  return Object.freeze({
    get(){return JSON.parse(JSON.stringify(state));},
    setInspectorFontScale(value){
      state.inspectorFontScale=clamp01055(Number(value)||1,.8,1.8);
      state=write01055(state);return state.inspectorFontScale;
    },
    setAppearance(patch={}){
      state.appearance={...state.appearance,...(patch&&typeof patch==='object'?patch:{})};
      state.version=2;state=write01055(state);return {...state.appearance};
    },
    setWindowGeometry(patch={}){
      state.windowGeometry={...state.windowGeometry,...(patch&&typeof patch==='object'?patch:{})};
      state=write01055(state);return {...state.windowGeometry};
    },
    resetAppearance(){
      state.appearance=cloneDefaults01055().appearance;
      state.windowGeometry=cloneDefaults01055().windowGeometry;
      state=write01055(state);return this.get();
    },
    resetAll(){
      state=cloneDefaults01055();
      try{globalThis.localStorage?.removeItem(STORAGE_KEY_01055);}catch{}
      return this.get();
    },
    storageKey:STORAGE_KEY_01055
  });
}

export { DEFAULTS_01055, STORAGE_KEY_01055 };
