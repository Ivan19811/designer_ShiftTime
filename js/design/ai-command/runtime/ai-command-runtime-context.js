import { persistAiRuntimeExecution, rehydrateAiRuntimeState } from './ai-command-runtime-persistence.js';

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function inferTargetTypeFromElement(el) {
  if (!el || !el.classList) return 'unknown';
  if (el.classList.contains('st-block--menu')) return 'menu_block';
  if (el.classList.contains('st-block--button')) return 'button_block';
  if (el.classList.contains('st-block--text')) return 'text_block';
  if (el.classList.contains('st-block--icon')) return 'icon_block';
  if (el.classList.contains('st-section')) return 'section';
  if (el.classList.contains('st-row')) return 'row';
  if (el.classList.contains('st-block')) return 'container';
  return 'unknown';
}

function getElementId(el, index = 0) {
  if (!el) return `selected_${index + 1}`;
  return String(
    el.dataset?.elementId
    || el.dataset?.nodeId
    || el.dataset?.stId
    || el.dataset?.uid
    || el.dataset?.hbRef
    || el.id
    || `selected_${index + 1}`
  );
}

export function getSelectionSnapshot() {
  try {
    const raw = window.ST_SELECTION?.get?.() || null;
    const elements = Array.isArray(raw?.elements) ? raw.elements : [];
    const selectedElements = elements.map((element, index) => ({
      id: getElementId(element, index),
      type: inferTargetTypeFromElement(element),
      label: element?.dataset?.label || element?.dataset?.name || element?.id || `${inferTargetTypeFromElement(element)}_${index + 1}`,
      element,
      raw: { element },
    }));
    return {
      type: raw?.type || null,
      selectedCount: selectedElements.length,
      selectedElements,
    };
  } catch {
    return { type: null, selectedCount: 0, selectedElements: [] };
  }
}

function cloneMutationEntry(entry = {}) {
  const out = { ...entry };
  if (out.targetRef && typeof out.targetRef === 'object') {
    out.targetRef = {
      id: out.targetRef.id ?? null,
      type: out.targetRef.type ?? null,
      label: out.targetRef.label ?? null,
    };
  }
  return out;
}

function dispatchAiRuntimeEvent(name, detail) {
  try {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {}
}

function syncSelectionAndInspector(detail = {}) {
  let selectionSnapshot = null;
  try {
    if (window.ST_SELECTION && typeof window.ST_SELECTION.emit === 'function') {
      const emitted = window.ST_SELECTION.emit();
      const elements = Array.isArray(emitted?.elements) ? emitted.elements : [];
      selectionSnapshot = {
        type: emitted?.type || null,
        selectedCount: elements.length,
      };
    } else {
      selectionSnapshot = getSelectionSnapshot();
      if (selectionSnapshot?.selectedCount) {
        dispatchAiRuntimeEvent('st:selection-changed', {
          type: selectionSnapshot.type,
          elements: selectionSnapshot.selectedElements?.map((item) => item.element).filter(Boolean) || [],
        });
      }
    }
  } catch {}

  try { window.dispatchEvent(new Event('resize')); } catch {}

  const syncDetail = {
    source: 'ai-runtime',
    ...detail,
    selection: selectionSnapshot || getSelectionSnapshot(),
  };
  dispatchAiRuntimeEvent('st:ai-runtime-inspector-sync', syncDetail);
  dispatchAiRuntimeEvent('st:ai-runtime-applied', syncDetail);
  return syncDetail.selection;
}

export function createBuilderRuntimeContext({ mutationLog = [], selectionSnapshot = null } = {}) {
  const mutations = Array.isArray(mutationLog) ? mutationLog : [];
  const snapshot = selectionSnapshot && typeof selectionSnapshot === 'object'
    ? selectionSnapshot
    : getSelectionSnapshot();

  return {
    document,
    source: 'builder_runtime',
    getSelectedElements: () => snapshot?.selectedElements || [],
    resolveElement: (targetRef) => targetRef?.raw?.element || targetRef?.element || null,
    getDomElement: (targetRef) => targetRef?.raw?.element || targetRef?.element || null,
    recordMutation: (entry) => {
      const payload = {
        at: new Date().toISOString(),
        ...cloneMutationEntry(entry),
      };
      mutations.push(payload);
      dispatchAiRuntimeEvent('st:ai-runtime-mutation', payload);
    },
    onMutation: (entry) => {
      const payload = {
        at: new Date().toISOString(),
        ...cloneMutationEntry(entry),
      };
      mutations.push(payload);
    },
    beforeApplyContract: ({ contract, selectionContext, dryRun }) => {
      dispatchAiRuntimeEvent('st:ai-runtime-before-apply', {
        source: 'ai-runtime',
        contractKind: contract?.kind || null,
        selectionMode: contract?.selectionMode || null,
        selectedCount: selectionContext?.selectedCount || 0,
        dryRun: !!dryRun,
      });
    },
    afterApplyContract: ({ contract, selectionContext, result, dryRun }) => {
      // HOTFIX 00079:
      // Persist first, then sync inspector/selection. Sync can emit events and redraw parts
      // of the header. If it runs before persistence, the UI can briefly rehydrate old
      // spacing and only then jump to the new gap.
      const persistence = !dryRun
        ? persistAiRuntimeExecution(result, { document })
        : { ok: true, kind: 'ai_runtime_persistence_result', patchCount: 0, patches: [], elementCount: 0, updatedAt: null };
      const selection = syncSelectionAndInspector({
        contractKind: contract?.kind || null,
        dryRun: !!dryRun,
        summary: result?.summary || null,
      });
      try {
        if (!dryRun) rehydrateAiRuntimeState({ document });
      } catch {}
      return {
        synced: true,
        selection,
        selectedCount: selectionContext?.selectedCount || 0,
        persistence,
      };
    },
    rehydratePersistedState: () => rehydrateAiRuntimeState({ document }),
  };
}
