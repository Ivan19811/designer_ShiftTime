// 01054 · Builder UI preferences adapter.
// UI code talks to this adapter only. Physical browser persistence is isolated here.

const STORAGE_KEY_01054 = 'st_builder_ui_preferences_v1';

const DEFAULTS_01054 = Object.freeze({
  version: 1,
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
    workspacePadding: null
  },
  windowGeometry: {
    left: null,
    top: null,
    width: null,
    height: null
  }
});

function cloneDefaults01054(){
  return JSON.parse(JSON.stringify(DEFAULTS_01054));
}

function finiteOrNull01054(value){
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeColor01054(value){
  const v = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : '';
}

function normalize01054(raw){
  const out = cloneDefaults01054();
  if (!raw || typeof raw !== 'object') return out;
  const inspectorScale = Number(raw.inspectorFontScale);
  if (Number.isFinite(inspectorScale)) out.inspectorFontScale = Math.min(1.8, Math.max(.8, inspectorScale));

  const a = raw.appearance && typeof raw.appearance === 'object' ? raw.appearance : {};
  const fontScale = Number(a.fontScale);
  if (Number.isFinite(fontScale)) out.appearance.fontScale = Math.min(1.6, Math.max(.8, fontScale));
  ['background','surface','surfaceAlt','header','text','muted','border','accent'].forEach((key)=>{
    out.appearance[key] = normalizeColor01054(a[key]);
  });
  const radius = finiteOrNull01054(a.radius);
  const borderWidth = finiteOrNull01054(a.borderWidth);
  const shadow = finiteOrNull01054(a.shadow);
  const workspacePadding = finiteOrNull01054(a.workspacePadding);
  out.appearance.radius = radius === null ? null : Math.min(36, Math.max(0, radius));
  out.appearance.borderWidth = borderWidth === null ? null : Math.min(4, Math.max(0, borderWidth));
  out.appearance.shadow = shadow === null ? null : Math.min(100, Math.max(0, shadow));
  out.appearance.workspacePadding = workspacePadding === null ? null : Math.min(36, Math.max(0, workspacePadding));

  const g = raw.windowGeometry && typeof raw.windowGeometry === 'object' ? raw.windowGeometry : {};
  ['left','top','width','height'].forEach((key)=>{ out.windowGeometry[key] = finiteOrNull01054(g[key]); });
  return out;
}

function read01054(){
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY_01054);
    return raw ? normalize01054(JSON.parse(raw)) : cloneDefaults01054();
  } catch {
    return cloneDefaults01054();
  }
}

function write01054(next){
  const normalized = normalize01054(next);
  try { globalThis.localStorage?.setItem(STORAGE_KEY_01054, JSON.stringify(normalized)); } catch {}
  return normalized;
}

export function createBuilderUiPreferences01054(){
  let state = read01054();
  return Object.freeze({
    get(){ return JSON.parse(JSON.stringify(state)); },
    setInspectorFontScale(value){
      state.inspectorFontScale = Math.min(1.8, Math.max(.8, Number(value) || 1));
      state = write01054(state);
      return state.inspectorFontScale;
    },
    setAppearance(patch={}){
      state.appearance = { ...state.appearance, ...(patch && typeof patch === 'object' ? patch : {}) };
      state = write01054(state);
      return { ...state.appearance };
    },
    setWindowGeometry(patch={}){
      state.windowGeometry = { ...state.windowGeometry, ...(patch && typeof patch === 'object' ? patch : {}) };
      state = write01054(state);
      return { ...state.windowGeometry };
    },
    resetAppearance(){
      state.appearance = cloneDefaults01054().appearance;
      state.windowGeometry = cloneDefaults01054().windowGeometry;
      state = write01054(state);
      return this.get();
    },
    resetAll(){
      state = cloneDefaults01054();
      try { globalThis.localStorage?.removeItem(STORAGE_KEY_01054); } catch {}
      return this.get();
    },
    storageKey: STORAGE_KEY_01054
  });
}

export { DEFAULTS_01054, STORAGE_KEY_01054 };
