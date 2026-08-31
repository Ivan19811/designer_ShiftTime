// core/reducer.js

export const ActionTypes = {
  ADD_OBJECT: 'ADD_OBJECT',
  REMOVE_OBJECT: 'REMOVE_OBJECT',
  SET_SELECTED: 'SET_SELECTED',
  TOGGLE_OBJECT_VISIBLE: 'TOGGLE_OBJECT_VISIBLE',
  TOGGLE_OBJECT_LOCKED: 'TOGGLE_OBJECT_LOCKED',
  SET_CAN_PARAMS: 'SET_CAN_PARAMS',
  SET_ENV_ENABLED: 'SET_ENV_ENABLED',
  SET_TIME: 'SET_TIME',
  SET_ZOOM: 'SET_ZOOM',
  SET_UI: 'SET_UI',
  SET_SELECTED_KEYFRAME: 'SET_SELECTED_KEYFRAME'
};

export const initialState = {
  ui: {
    sidebarCollapsed: false,
    inspectorCollapsed: false,
    inspectorWidth: 380,
    zoom: 1.0
  },
  project: {
    duration: 3600,
    time: 0.0,
    fps: 60
  },
  scene: {
    objects: {},
    order: [],
    selectedObjectId: null,
    envEnabled: true,
    canParams: {
      rotationY: 0,
      cameraZ: 7.4,
      cameraY: 1.55,
      cameraX: 0.0,
      scale: 1.0
    }
  },
  timeline: {
    // Phase 1: треки як в StepC, keyframes по параметрах
    tracks: {
      rotationY: { id: 'rotationY', label: 'RotationY (rad)', easing: 'easeInOutCubic', keyframes: [] },
      cameraX:   { id: 'cameraX',   label: 'CameraX',         easing: 'easeInOutCubic', keyframes: [] },
      cameraZ:   { id: 'cameraZ',   label: 'CameraZ',         easing: 'easeInOutCubic', keyframes: [] },
      cameraY:   { id: 'cameraY',   label: 'CameraY',         easing: 'easeInOutCubic', keyframes: [] },
      scale:     { id: 'scale',     label: 'Scale',           easing: 'easeInOutCubic', keyframes: [] }
    },
    order: ['rotationY','cameraX','cameraY','cameraZ','scale']
    ,
    selectedKeyframe: null
  }
};

function ensureKeyframeIds(trackId, keyframes) {
  const kfs = Array.isArray(keyframes) ? keyframes.slice() : [];
  let n = 0;
  const seen = new Set();
  for (const k of kfs) {
    if (k && typeof k.id === 'string' && k.id) {
      if (seen.has(k.id)) {
        k.id = '';
      } else {
        seen.add(k.id);
      }
    }
  }
  for (const k of kfs) {
    if (!k || typeof k !== 'object') continue;
    if (typeof k.id !== 'string' || !k.id) {
      // stable-ish id: track + t + counter
      k.id = `kf_${trackId}_${Math.round(clamp(k.t,0,1)*100000)}_${n++}`;
      while (seen.has(k.id)) k.id = `kf_${trackId}_${Math.round(clamp(k.t,0,1)*100000)}_${n++}`;
      seen.add(k.id);
    }
  }
  return kfs;
}

function normalizeObject(input) {
  const obj = { ...(input || {}) };
  if (typeof obj.visible !== 'boolean') obj.visible = true;
  if (typeof obj.locked !== 'boolean') obj.locked = false;
  return obj;
}

export function reducer(state, action) {
  const t = action && action.type;
  switch (t) {
    case ActionTypes.SET_UI: {
      return {
        ...state,
        ui: { ...state.ui, ...(action.patch || {}) }
      };
    }
    case ActionTypes.SET_TIME: {
      const time = clamp(action.time ?? 0, 0, state.project.duration);
      return {
        ...state,
        project: { ...state.project, time },
      };
    }
    case ActionTypes.SET_ZOOM: {
      const zoom = clamp(action.zoom ?? 1, 0.25, 4);
      return {
        ...state,
        ui: { ...state.ui, zoom }
      };
    }
    case ActionTypes.SET_ENV_ENABLED: {
      return {
        ...state,
        scene: { ...state.scene, envEnabled: !!action.enabled }
      };
    }
    case ActionTypes.ADD_OBJECT: {
      // Object model (Phase 2.1 base):
      // { id, type, name, visible, locked, ...payload }
      const obj = normalizeObject(action.object);
      if (!obj || !obj.id) return state;
      if (state.scene.objects[obj.id]) return state;
      return {
        ...state,
        scene: {
          ...state.scene,
          objects: { ...state.scene.objects, [obj.id]: obj },
          order: [...state.scene.order, obj.id],
          selectedObjectId: obj.id
        }
      };
    }

    case ActionTypes.TOGGLE_OBJECT_VISIBLE: {
      const id = action.id;
      const obj = state.scene.objects[id];
      if (!id || !obj) return state;
      return {
        ...state,
        scene: {
          ...state.scene,
          objects: {
            ...state.scene.objects,
            [id]: { ...obj, visible: !obj.visible }
          }
        }
      };
    }

    case ActionTypes.TOGGLE_OBJECT_LOCKED: {
      const id = action.id;
      const obj = state.scene.objects[id];
      if (!id || !obj) return state;
      return {
        ...state,
        scene: {
          ...state.scene,
          objects: {
            ...state.scene.objects,
            [id]: { ...obj, locked: !obj.locked }
          }
        }
      };
    }
    case ActionTypes.REMOVE_OBJECT: {
      const id = action.id;
      if (!id || !state.scene.objects[id]) return state;
      const nextObjects = { ...state.scene.objects };
      delete nextObjects[id];
      const nextOrder = state.scene.order.filter(x => x !== id);
      const selectedObjectId = state.scene.selectedObjectId === id ? (nextOrder[0] || null) : state.scene.selectedObjectId;
      return {
        ...state,
        scene: { ...state.scene, objects: nextObjects, order: nextOrder, selectedObjectId }
      };
    }
    case ActionTypes.SET_SELECTED: {
      const id = action.id;
      if (id && !state.scene.objects[id]) return state;
      return {
        ...state,
        scene: { ...state.scene, selectedObjectId: id || null }
      };
    }

    case ActionTypes.SET_SELECTED_KEYFRAME: {
      // { trackId, keyframeId } | null
      const next = action.payload || null;
      if (!next) {
        return { ...state, timeline: { ...state.timeline, selectedKeyframe: null } };
      }
      const tr = state.timeline.tracks[next.trackId];
      if (!tr) return state;
      const kfs = Array.isArray(tr.keyframes) ? tr.keyframes: [];
      if (!kfs.some(k => k && k.id === next.keyframeId)) return state;
      return { ...state, timeline: { ...state.timeline, selectedKeyframe: { trackId: next.trackId, keyframeId: next.keyframeId } } };
    }

    // Phase 2.1 base: visibility/locking in Layers
    case ActionTypes.TOGGLE_OBJECT_VISIBLE: {
      const id = action.id;
      const obj = state.scene.objects[id];
      if (!obj) return state;
      return {
        ...state,
        scene: {
          ...state.scene,
          objects: {
            ...state.scene.objects,
            [id]: { ...obj, visible: !obj.visible }
          }
        }
      };
    }
    case ActionTypes.TOGGLE_OBJECT_LOCKED: {
      const id = action.id;
      const obj = state.scene.objects[id];
      if (!obj) return state;
      return {
        ...state,
        scene: {
          ...state.scene,
          objects: {
            ...state.scene.objects,
            [id]: { ...obj, locked: !obj.locked }
          }
        }
      };
    }
    case ActionTypes.SET_CAN_PARAMS: {
      return {
        ...state,
        scene: { ...state.scene, canParams: { ...state.scene.canParams, ...(action.patch || {}) } }
      };
    }
    // Phase 1: редагування keyframes напряму
    case 'UPDATE_KEYFRAME': {
      const { trackId, index, patch } = action;
      const tr = state.timeline.tracks[trackId];
      if (!tr) return state;
      const kfs = ensureKeyframeIds(trackId, tr.keyframes);
      if (!kfs[index]) return state;
      kfs[index] = {
        ...kfs[index],
        ...(patch || {})
      };
      // clamp + sort
      kfs.forEach(k => { k.t = clamp(k.t, 0, 1); });
      kfs.sort((a,b)=>a.t-b.t);
      return {
        ...state,
        timeline: {
          ...state.timeline,
          tracks: {
            ...state.timeline.tracks,
            [trackId]: { ...tr, keyframes: kfs }
          }
        }
      };
    }

    case 'UPDATE_KEYFRAME_BY_ID': {
      const { trackId, keyframeId, patch } = action;
      const tr = state.timeline.tracks[trackId];
      if (!tr) return state;
      const kfs = ensureKeyframeIds(trackId, tr.keyframes);
      const idx = kfs.findIndex(k => k && k.id === keyframeId);
      if (idx < 0) return state;
      kfs[idx] = { ...kfs[idx], ...(patch || {}) };
      kfs.forEach(k => { k.t = clamp(k.t, 0, 1); });
      kfs.sort((a,b)=>a.t-b.t);
      return {
        ...state,
        timeline: {
          ...state.timeline,
          tracks: {
            ...state.timeline.tracks,
            [trackId]: { ...tr, keyframes: kfs }
          }
        }
      };
    }
    case 'ADD_KEYFRAME': {
      const { trackId, atT } = action;
      const tr = state.timeline.tracks[trackId];
      if (!tr) return state;
      const kfs = ensureKeyframeIds(trackId, tr.keyframes);
      const t0 = clamp(atT ?? 0, 0, 1);
      const v0 = tr.keyframes.length ? tr.keyframes[tr.keyframes.length-1].v : 0;
      const nextId = `kf_${trackId}_${Math.round(t0*100000)}_${kfs.length}`;
      // 2.5-B: per-keyframe interpolation for the outgoing segment.
      // Default: use track easing if present, otherwise linear.
      const defaultInterp = (tr && tr.easing) ? String(tr.easing) : 'linear';
      kfs.push({ id: nextId, t: t0, v: v0, interp: defaultInterp });
      kfs.sort((a,b)=>a.t-b.t);
      return {
        ...state,
        timeline: {
          ...state.timeline,
          tracks: {
            ...state.timeline.tracks,
            [trackId]: { ...tr, keyframes: kfs }
          },
          selectedKeyframe: { trackId, keyframeId: nextId }
        }
      };
    }
    case 'DELETE_KEYFRAME': {
      const { trackId, index } = action;
      const tr = state.timeline.tracks[trackId];
      if (!tr) return state;
      const kfs = ensureKeyframeIds(trackId, tr.keyframes);
      if (!kfs[index]) return state;
      const deletedId = kfs[index].id;
      kfs.splice(index, 1);
      const sel = state.timeline.selectedKeyframe;
      const nextSel = (sel && sel.trackId === trackId && sel.keyframeId === deletedId) ? null : sel;
      return {
        ...state,
        timeline: {
          ...state.timeline,
          tracks: {
            ...state.timeline.tracks,
            [trackId]: { ...tr, keyframes: kfs }
          },
          selectedKeyframe: nextSel
        }
      };
    }

    default:
      return state;
  }
}

function clamp(v, a, b){
  return Math.max(a, Math.min(b, Number(v)));
}
