// core/store.js
// Мінімальний store у стилі "єдине джерело правди".
// У Phase 1: тільки те, що потрібно для layout + demo bindings.

export function createStore({ initialState, reducer }) {
  let state = initialState;
  const listeners = new Set();

  function getState() { return state; }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function dispatch(action) {
    const prev = state;
    state = reducer(state, action);
    if (state !== prev) {
      listeners.forEach(fn => {
        try { fn(state, action); } catch (e) { console.warn('[animator.store] listener failed', e); }
      });
    }
    return action;
  }

  return { getState, subscribe, dispatch };
}
