// 01056 · Builder UI preferences adapter v3.
// Fix: nullable numeric appearance values stay null instead of being coerced to 0.
// UI code talks only to this adapter. Browser persistence remains isolated here.
// MarketplaceStore / MarketplaceRepository are intentionally not involved.

const STORAGE_KEY_01056 = 'st_builder_ui_preferences_v1';

const DEFAULTS_01056 = Object.freeze({
  version: 3,
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

function cloneDefaults01056(){ return JSON.parse(JSON.stringify(DEFAULTS_01056)); }
function finiteOrNull01056(value){
  // null/undefined/empty means "inherit the parent/default value".
  // Number(null) === 0 was the 01055 bug that silently created overrides.
  if(value===null || value===undefined || value==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}
function clamp01056(value,min,max){ return Math.min(max,Math.max(min,value)); }
function normalizeColor01056(value){
  const v=String(value||'').trim();
  return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():'';
}

const NULLABLE_NUMERIC_KEYS_01056 = Object.freeze([
  'radius','borderWidth','shadow','workspacePadding',
  'additionalRadius','additionalBorderWidth','sideRadius','sideBorderWidth'
]);

function migrateLegacy01056(raw){
  if(!raw || typeof raw!=='object')return raw;
  const copy=JSON.parse(JSON.stringify(raw));
  const version=Number(copy.version)||1;
  if(version<3){
    const a=copy.appearance&&typeof copy.appearance==='object'?copy.appearance:{};
    // 01055 converted every untouched null numeric preference to 0 on any write.
    // We cannot distinguish that accidental zero from an intentional zero in v2,
    // so v3 performs a one-time safe migration back to inheritance. A user can
    // explicitly choose 0 again after the migration if square/no-border is desired.
    for(const key of NULLABLE_NUMERIC_KEYS_01056){
      if(a[key]===0 || a[key]==='0')a[key]=null;
    }
    copy.appearance=a;
    copy.version=3;
  }
  return copy;
}

function normalize01056(raw){
  raw=migrateLegacy01056(raw);
  const out=cloneDefaults01056();
  if(!raw||typeof raw!=='object')return out;

  const inspectorScale=Number(raw.inspectorFontScale);
  if(Number.isFinite(inspectorScale))out.inspectorFontScale=clamp01056(inspectorScale,.8,1.8);

  const a=raw.appearance&&typeof raw.appearance==='object'?raw.appearance:{};
  const scaleRanges={fontScale:[.8,1.6],additionalFontScale:[.8,2.2],sideFontScale:[.8,2.2]};
  Object.entries(scaleRanges).forEach(([key,[min,max]])=>{
    const n=Number(a[key]);
    if(Number.isFinite(n))out.appearance[key]=clamp01056(n,min,max);
  });

  [
    'background','surface','surfaceAlt','header','text','muted','border','accent',
    'additionalSurface','additionalSurfaceAlt','additionalText','additionalMuted','additionalBorder','additionalAccent',
    'sidePanel','sideSurface','sideText','sideMuted','sideBorder','sideNotice','sideNoticeText','sideWarn','sideWarnText'
  ].forEach((key)=>{out.appearance[key]=normalizeColor01056(a[key]);});

  const numericRanges={
    radius:[0,36],borderWidth:[0,4],shadow:[0,100],workspacePadding:[0,36],
    additionalRadius:[0,36],additionalBorderWidth:[0,4],sideRadius:[0,36],sideBorderWidth:[0,4]
  };
  Object.entries(numericRanges).forEach(([key,[min,max]])=>{
    const n=finiteOrNull01056(a[key]);
    out.appearance[key]=n===null?null:clamp01056(n,min,max);
  });

  const g=raw.windowGeometry&&typeof raw.windowGeometry==='object'?raw.windowGeometry:{};
  ['left','top','width','height'].forEach((key)=>{out.windowGeometry[key]=finiteOrNull01056(g[key]);});
  return out;
}

function read01056(){
  try{
    const rawText=globalThis.localStorage?.getItem(STORAGE_KEY_01056);
    if(!rawText)return cloneDefaults01056();
    const raw=JSON.parse(rawText);
    const normalized=normalize01056(raw);
    // Persist the one-time v2 → v3 repair immediately, before any new UI interaction.
    if(Number(raw?.version)!==3){
      try{globalThis.localStorage?.setItem(STORAGE_KEY_01056,JSON.stringify(normalized));}catch{}
    }
    return normalized;
  }catch{return cloneDefaults01056();}
}
function write01056(next){
  const normalized=normalize01056(next);
  try{globalThis.localStorage?.setItem(STORAGE_KEY_01056,JSON.stringify(normalized));}catch{}
  return normalized;
}

export function createBuilderUiPreferences01056(){
  let state=read01056();
  // Reading 01054/01055 state automatically migrates it to the v3 nullable-number contract.
  if(state.version!==3){state.version=3;state=write01056(state);}
  return Object.freeze({
    get(){return JSON.parse(JSON.stringify(state));},
    setInspectorFontScale(value){
      state.inspectorFontScale=clamp01056(Number(value)||1,.8,1.8);
      state=write01056(state);return state.inspectorFontScale;
    },
    setAppearance(patch={}){
      state.appearance={...state.appearance,...(patch&&typeof patch==='object'?patch:{})};
      state.version=3;state=write01056(state);return {...state.appearance};
    },
    setWindowGeometry(patch={}){
      state.windowGeometry={...state.windowGeometry,...(patch&&typeof patch==='object'?patch:{})};
      state=write01056(state);return {...state.windowGeometry};
    },
    resetAppearance(){
      state.appearance=cloneDefaults01056().appearance;
      state.windowGeometry=cloneDefaults01056().windowGeometry;
      state=write01056(state);return this.get();
    },
    resetAll(){
      state=cloneDefaults01056();
      try{globalThis.localStorage?.removeItem(STORAGE_KEY_01056);}catch{}
      return this.get();
    },
    storageKey:STORAGE_KEY_01056
  });
}

export { DEFAULTS_01056, STORAGE_KEY_01056 };
