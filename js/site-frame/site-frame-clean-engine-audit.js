// js/site-frame/site-frame-clean-engine-audit.js
// 00914: diagnostics for Main shadow presets and mutually-exclusive inner shadow controls.
// No DOM mutation observer, timer, fallback or repair; drag remains in the shared SiteFrame edit layer.

(() => {
  'use strict';

  const VERSION = '00914-clean-engine-audit-main-shadow-preset-inner-parity';
  const MANIFEST = Object.freeze({
    baseZip: '00914-MAIN-SHADOW-PRESET-INNER-PARITY.zip',
    proofBaseZip: '00886-TEMPLATE-GALLERY-SINGLE-OWNER-FIX.zip',
    proofSource: '00886-user-runtime-log-2026-07-05T15:22:24.482Z',
    nextStage: '00915-MAIN-STYLE-CONTROLS-PARITY',
    resolvedCuts: Object.freeze([
      'BOOT_FOOTER_BUILDER_STATIC',
      'FOOTER_BUILDER_LIVE_DND_RUNTIME',
      'HF_ADAPTER_RUNTIME_OWNERSHIP',
      'EDIT_LAYER_SCAN_TREE_GEOMETRY_MUTATION',
      'EDIT_LAYER_GLOBAL_CHILD_BOUNDARY_PASS',
      'EDIT_LAYER_FRAME_ENVELOPE_COMMIT',
      'EDIT_LAYER_ROW_EQUATION_RECOMMIT',
      'EDIT_LAYER_HEADER_MENU_SPECIAL_CASES',
      'EDIT_LAYER_CLOSEST_OWNER_FALLBACK',
      'EDIT_LAYER_VERSION_ALIAS_CHAIN',
      'HF_DND_OLD_ROW_RECOMMIT_CALLS',
      'EDIT_LAYER_CENTERED_CHILD_FEEDBACK_LOOP',
      'EDIT_LAYER_WIDTH_CHANGE_HEIGHT_OMISSION',
      'EDIT_LAYER_PARENT_MIN_IGNORED_MANUAL_CHILD',
      'HF_SHARED_SELECTION_MUTATION_OBSERVER',
      'HF_SHARED_SELECTION_OVERLAY_RUNTIME',
      'HF_SHARED_GLOBAL_POINTER_CAPTURE',
      'HF_SHARED_LIVE_CONTAINER_DND',
      'HEADER_LIVE_DND_INSTALLER',
      'DUPLICATE_FOOTER_POINTER_SELECTION',
      'LEGACY_HF_SHARED_SELECTION_DND_CORE_FILE',
      'HEADER_DESIGN_MUTATION_OBSERVER',
      'FOOTER_DESIGN_MUTATION_OBSERVER',
      'HEADER_DESIGN_DEBOUNCE_TIMER',
      'FOOTER_DESIGN_DEBOUNCE_TIMER',
      'DESIGN_BRIDGE_PAGE_REATTACH_LOOPS',
      'LEGACY_HEADER_DESIGN_BRIDGE_FILE',
      'LEGACY_FOOTER_DESIGN_BRIDGE_FILE',
      'LEGACY_DESIGN_BRIDGE_GLOBAL_APIS',
      'EDIT_LAYER_CONCATENATED_TEXT_MIN_WIDTH',
      'EDIT_LAYER_RESIZED_WIDTH_BECAME_MINIMUM',
      'CLEAN_STORE_ENGINE_ISOLATED',
      'EDIT_LAYER_DIRECT_DOM_TRANSACTION_AUTHORITY',
      'EDIT_LAYER_DIRECT_GEOMETRY_STYLE_WRITES',
      'PERSISTENCE_DOM_PRIMARY_AUTHORITY',
      'TEXT_DRAFT_ROOT_SAVE_RERENDER_FOCUS_LOSS',
      'TEXT_UNDO_TARGET_RESET_AFTER_MAIN_RERENDER',
      'MAIN_RADIUS_ACTIVE_SELECTION_VAR_NOT_UPDATED',
      'MAIN_BORDER_COLOR_LIVE_INPUT_UNTHROTTLED',
      'TEXT_EDITABLE_MASKED_BLOCK_DRAG_START',
      'MAIN_FILL_DOM_ONLY_NOT_PERSISTED',
      'MAIN_FILL_DROPPED_AFTER_ROOT_SAVE',
      'WIDGET_HEADER_BUILDER_IMPORT',
      'WIDGET_FOOTER_BUILDER_IMPORT',
      'MENU_BUILDER_HEADER_IMPORT',
      'LEGACY_SITE_CANVAS',
      'LEGACY_FOOTER_BUILDER',
      'LEGACY_HEADER_BUILDER',
      'MENU_BUILDER_MUTATION_OBSERVER',
      'MENU_BUILDER_FRAME_RETRY_LOOP',
      'MENU_BUILDER_GEOMETRY_FREEZE',
      'LEGACY_HEADER_RUNTIME_OBSERVER_DND',
      'LEGACY_FOOTER_RUNTIME_TIMER_OVERLAY',
      'SITE_FRAME_SLOT_SELECTION_NOT_INSTALLED',
      'CANVAS_LINK_NATIVE_NAVIGATION_RELOAD',
      'HEADER_SEARCH_MENU_AUTHORED_COLUMN_LAYOUT',
      'HASHCHANGE_HEADER_FOOTER_RERENDER',
      'SELECTION_RESIZE_HANDLES_REMOVED_WITH_LEGACY_BUILDER',
      'CONTAINER_PAIR_DIAGONAL_HEIGHT_DROPPED',
      'VISIBLE_RESIZE_HANDLE_BORDERS',
      'MULTIPLE_SELECTION_HIGHLIGHT_LAYERS',
      'SELECTED_ELEMENT_BEHIND_SIBLING_OR_PARENT',
      'SELECTION_DUPLICATED_COLOR_PALETTE',
      'PURE_HORIZONTAL_RESIZE_MUTATED_HEIGHT',
      'SELECTION_WHOLE_SLOT_SCAN',
      'LIVE_POINTER_TREE_MEASUREMENT',
      'OWNED_HEIGHT_USED_AS_INTRINSIC_MINIMUM',
      'HEADER_TEXT_CHILD_HEIGHT_100_PERCENT',
      'PARENT_RESIZE_CHANGED_DIRECT_CHILD_HEIGHT',
      'RENDERED_CHILD_STRETCH_BECAME_PARENT_MINIMUM',
      'MAIN_STARTER_SECTION_IN_STATIC_HTML',
      'MAIN_SHARED_SITE_ROOT_AREA_AUTHORITY',
      'MAIN_LEGACY_DIRECT_ROOT_CONTENT',
      'MAIN_SELECTION_BEFORE_SELECTION_STAGE',
      'MAIN_DRAG_RESIZE_BEFORE_EDIT_STAGE',
      'TEMPLATE_GALLERY_SITE_FLOW_MIXING',
      'TEMPLATE_GALLERY_SITE_ROOT_ONLY_HIDE',
      'DUPLICATE_TEMPLATE_GALLERY_OPEN_LISTENER',
      'TEMPLATE_GALLERY_RETRY_OPEN_LOOP',
      'TEMPLATE_GALLERY_DELAYED_REOPEN_AFTER_CLOSE',
      'TEMPLATE_GALLERY_CANVAS_SCROLL_CHILD',
      'TEMPLATE_GALLERY_BOOT_TIME_RUNTIME_FALSE_NEGATIVE',
      'MAIN_EMPTY_FRAME_STAGE_COMPLETED',
      'MAIN_SELECTION_ONLY_STORE_RENDERER_ENABLED',
      'MAIN_TEMPLATE_GALLERY_ADD_REPLACE_ENABLED',
      'MAIN_TEMPLATE_REPLACE_WITHOUT_ACTIVE_FALLS_BACK_TO_ADD',
      'MAIN_TEMPLATE_STORE_RELOAD_STYLE_LOSS',
      'HF_DOM_BLOCK_INTERNAL_MARKUP_CAPTURED_AS_FRAME_CHILDREN',
      'HF_RESIZE_TRANSACTION_BLOCK_CHILD_CONTRACT_FAILURE',
      'MAIN_TEMPLATE_LEAF_INHERITED_CANVAS_CARD_BACKGROUND',
      'MAIN_AREA_MISSING_FROM_PAGE_TREE',
      'MAIN_SLOT_VISUAL_WRAPPER_GUTTER',
      'MAIN_SECTION_FORCED_SIDE_MARGIN',
      'TOOLBAR_DELETE_BUTTON_UNBOUND',
      'LAST_MAIN_SECTION_PROTECTED',
      'EMPTY_MAIN_RECREATED_AFTER_DELETE',
      'MAIN_DRAG_ONLY_DISABLED',
      'MAIN_SEPARATE_DRAG_ENGINE_RISK',
      'MAIN_RESIZE_ONLY_DISABLED',
      'MAIN_SEPARATE_RESIZE_ENGINE_RISK',
      'MAIN_PARENT_GROW_DEFERRED_UNTIL_POINTERUP',
      'MAIN_CHILD_TEMPORARILY_ESCAPED_FIXED_PARENT',
      'PAIR_RESIZE_ROUNDING_DRIFT',
      'PAIR_RESIZE_NON_ADJACENT_STORE_REWRITE',
      'FLEX_PAIR_FREEZE_ALL_SIBLINGS',
      'PAIR_MINIMUM_INFEASIBLE_JUMP',
      'MAIN_HISTORY_DOM_SNAPSHOT_AUTHORITY',
      'MAIN_UNDO_POINTERMOVE_SPAM',
      'MAIN_REDO_NOT_CLEARED_AFTER_NEW_TRANSACTION',
      'MAIN_TEMPLATE_REPLACE_LEAVES_STALE_NODES',
    ]),
  });

  function runtimeSignals() {
    const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876 || null;
    const authorityContract = authority?.contract || null;
    const edit = window.ST_SITE_FRAME_EDIT_LAYER_00882 || null;
    const editContract = edit?.contract || null;
    const persistence = window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876 || null;
    const selection = window.__ST_SITE_FRAME_EXPLICIT_SELECTION_00887__ || null;
    const workspace = window.ST_SITE_FRAME_WORKSPACE_RUNTIME_00888 || null;
    const builderMode = window.ST_SITE_FRAME_BUILDER_MODE_00878 || null;
    const galleryWorkspace = window.ST_TEMPLATE_GALLERY_WORKSPACE_00886 || null;
    const galleryBridge = window.ST_TEMPLATE_GALLERY_OPEN_BRIDGE_00886 || null;
    const headerRuntime = window.ST_SITE_HEADER_RUNTIME_00878 || null;
    const footerRuntime = window.ST_SITE_FOOTER_RUNTIME_00878 || null;

    const root = document.getElementById('site-root');
    const header = document.getElementById('st-site-header-slot');
    const main = document.getElementById('st-site-main-slot');
    const footer = document.getElementById('st-site-footer-slot');
    const canvasScroller = document.querySelector('#builder-root .canvas__scroll, .canvas__scroll');
    const canvasScrollbarGutter = canvasScroller instanceof HTMLElement
      ? String(getComputedStyle(canvasScroller).scrollbarGutter || '')
      : '';
    const exactAreaOrder = Array.from(root?.children || []).map((node) => node.id);
    const mainArea = authority?.store?.findArea?.('main') || null;
    const state = authority?.getState?.() || null;
    const storeMainIds = Object.values(state?.nodes || {})
      .filter((node) => node?.area === 'main' && node?.kind !== 'area')
      .map((node) => String(node.id || ''))
      .filter(Boolean)
      .sort();
    const domMainIds = Array.from(main?.querySelectorAll?.('[data-sf-area="main"][data-sf-id]') || [])
      .map((node) => String(node.dataset.sfId || ''))
      .filter(Boolean)
      .sort();
    const current = document.querySelector('#st-site-header-slot .sf-selection-current,#st-site-main-slot .sf-selection-current,#st-site-footer-slot .sf-selection-current');
    const selectedArea = current?.closest?.('#st-site-main-slot') ? 'main' : current?.closest?.('#st-site-footer-slot') ? 'footer' : current ? 'header' : '';
    const selectedHandleCount = current?.querySelectorAll?.(':scope > .st-resize[data-site-frame-selection-handle="00887"]')?.length || 0;

    return {
      authority: !!authority,
      storeAuthority: authorityContract?.storeAuthority === true,
      jsonPrimary: authorityContract?.jsonPrimary === true,
      transactions: authorityContract?.transactions === true,
      rendererOwnedGeometryWrites: authorityContract?.rendererOwnedGeometryWrites === true,
      editLayerDirectDomGeometryWrites: authorityContract?.editLayerDirectDomGeometryWrites === true,
      mainAreaRoot: String(authorityContract?.mainAreaRoot || ''),
      mainFrameOnly: authorityContract?.mainFrameOnly === true,
      mainStructureJsonPrimary: authorityContract?.mainStructureJsonPrimary === true,
      authorityMainSelectionOnly: authorityContract?.mainSelectionOnly === true,
      authorityMainDrag: authorityContract?.mainDrag === true,
      authorityMainResize: authorityContract?.mainResize === true,
      authorityMainTemplates: authorityContract?.mainTemplates === true,
      authorityMainTemplateModes: Array.isArray(authorityContract?.mainTemplateModes) ? [...authorityContract.mainTemplateModes] : [],
      authorityMainEdgeToEdge: authorityContract?.mainEdgeToEdge === true,
      authorityEmptyMainIsValid: authorityContract?.emptyMainIsValid === true,
      authorityToolbarDelete: authorityContract?.toolbarDelete === true,
      authoritySharedMoveNode: authorityContract?.sharedMoveNode === true,
      authorityMoveAreas: Array.isArray(authorityContract?.moveAreas) ? [...authorityContract.moveAreas] : [],
      authorityMoveMode: String(authorityContract?.moveMode || ''),
      authorityBlockCrossContainer: authorityContract?.blockCrossContainer === true,
      authorityLiveParentGrow: authorityContract?.liveParentGrow === true,
      authorityNaturalFlowAreas: Array.isArray(authorityContract?.naturalFlowAreas) ? [...authorityContract.naturalFlowAreas] : [],
      authorityLiveParentGrowMeasurement: String(authorityContract?.liveParentGrowMeasurement || ''),
      authorityResizeEquations: authorityContract?.resizeEquations === true,
      authorityAdjacentPairEquation: String(authorityContract?.adjacentPairEquation || ''),
      authorityIntegerPixelConservation: authorityContract?.integerPixelConservation === true,
      authorityPairOnlyStorePatches: authorityContract?.pairOnlyStorePatches === true,
      authorityNonAdjacentWidthsInvariant: authorityContract?.nonAdjacentWidthsInvariant === true,
      authorityPairMinimumRule: String(authorityContract?.pairMinimumRule || ''),
      authorityPairCanvasWidthInvariant: authorityContract?.pairCanvasWidthInvariant === true,
      authorityCanvasScrollbarGutter: String(authorityContract?.canvasScrollbarGutter || ''),
      authorityDomStructureContract: String(authorityContract?.domStructureContract || ''),
      authorityAuthoredBlocksOpaque: authorityContract?.authoredBlocksOpaque === true,
      authorityInternalImplementationBlocksExcluded: authorityContract?.internalImplementationBlocksExcluded === true,

      editLayer: !!edit,
      editStoreAuthority: editContract?.storeTransactionAuthority === true,
      editRendererAuthority: editContract?.rendererOwnedGeometryWrites === true,
      editDirectDomWrites: editContract?.directDomGeometryWrites === true,
      editStrictAxis: editContract?.strictAxisResize === true,
      editParentResizeMutatesChildren: editContract?.parentResizeMutatesChildren === true,
      editDomStructureContract: String(editContract?.domStructureContract || ''),
      editCanonicalFrameTargetResolution: editContract?.canonicalFrameTargetResolution === true,
      editCanonicalTreeScan: editContract?.canonicalTreeScan === true,
      editSharedDragContract: editContract?.sharedDragContract === true,
      editMainDrag: editContract?.mainDrag === true,
      editMainResize: editContract?.mainResize === true,
      editResizeAreas: Array.isArray(editContract?.resizeAreas) ? [...editContract.resizeAreas] : [],
      editDragAreas: Array.isArray(editContract?.dragAreas) ? [...editContract.dragAreas] : [],
      editDragMode: String(editContract?.dragMode || ''),
      editBlockCrossContainer: editContract?.blockCrossContainer === true,
      editDragStoreAuthority: editContract?.dragStoreAuthority === true,
      editDragDirectDomCommit: editContract?.dragDirectDomCommit === true,
      editLiveAncestorGrowDuringPointer: editContract?.liveAncestorGrowDuringPointer === true,
      editLiveParentGrowAreas: Array.isArray(editContract?.liveParentGrowAreas) ? [...editContract.liveParentGrowAreas] : [],
      editLiveParentGrowMeasurement: String(editContract?.liveParentGrowMeasurement || ''),
      editResizeEquationsVersion: String(editContract?.resizeEquationsVersion || ''),
      editAdjacentPairEquation: String(editContract?.adjacentPairEquation || ''),
      editIntegerPixelConservation: editContract?.integerPixelConservation === true,
      editPairOnlyStorePatches: editContract?.pairOnlyStorePatches === true,
      editNonAdjacentWidthsInvariant: editContract?.nonAdjacentWidthsInvariant === true,
      editPairMinimumRule: String(editContract?.pairMinimumRule || ''),
      editPairCanvasWidthInvariant: editContract?.pairCanvasWidthInvariant === true,
      editCanvasScrollbarGutter: String(editContract?.canvasScrollbarGutter || ''),

      persistence: !!persistence,
      persistenceAuthority: String(persistence?.contract?.authority || ''),
      persistenceExplicitOnly: persistence?.contract?.explicitOnly === true,
      persistenceSelectionSanitized: persistence?.contract?.selectionUiSanitized === true,

      selection: !!selection,
      selectionObservers: Number(selection?.observers ?? -1),
      selectionGlobalPointerListeners: Number(selection?.globalPointerListeners ?? -1),
      selectionSlotPointerListeners: Number(selection?.slotPointerListeners ?? -1),
      selectionInspectorColorAuthority: selection?.inspectorColorAuthority === true,
      selectionDuplicatedPalette: selection?.duplicatedSelectionPalette === true,
      selectionPreviousOnlyCleanup: selection?.previousSelectionOnlyCleanup === true,
      selectionFullSlotScan: selection?.fullSlotSelectionScan === true,
      selectionMainOnly: selection?.mainSelectionOnly === true,
      selectionMainDragEnabled: selection?.mainDragEnabled === true,
      selectionMainResizeEnabled: selection?.mainResizeEnabled === true,
      selectionMainHandleCount: Number(selection?.mainResizeHandleCount ?? -1),
      selectionHeaderFooterHandleCount: Number(selection?.resizeHandleCountPerSelection ?? -1),
      selectedArea,
      selectedHandleCount,
      selectedHandleCountValid: !current || selectedHandleCount === 8,
      headerSelectionInstalled: header?.dataset?.siteFrameSelection00887 === '1',
      mainSelectionInstalled: main?.dataset?.siteFrameSelection00887 === '1',
      mainDragInstalled: main?.dataset?.siteFrameMainDrag === '1',
      mainResizeInstalled: main?.dataset?.siteFrameMainResize === '1',
      footerSelectionInstalled: footer?.dataset?.siteFrameSelection00887 === '1',

      workspace: !!workspace,
      workspaceExactAreaOrder: Array.isArray(workspace?.exactAreaOrder) ? [...workspace.exactAreaOrder] : [],
      workspaceMainSlotId: String(workspace?.mainSlotId || ''),
      workspaceMainFrameOnly: workspace?.mainFrameOnly === true,
      workspaceMainSelection: workspace?.mainSelection === true,
      workspaceMainDrag: workspace?.mainDrag === true,
      workspaceMainResize: workspace?.mainResize === true,
      workspaceLiveParentGrow: workspace?.liveParentGrow === true,
      workspaceNaturalFlow: workspace?.naturalFlow === true,
      workspaceResizeEquations: workspace?.resizeEquations === true,
      workspaceAdjacentPairEquation: String(workspace?.adjacentPairEquation || ''),
      workspacePairCanvasWidthInvariant: workspace?.pairCanvasWidthInvariant === true,
      workspaceCanvasScrollbarGutter: String(workspace?.canvasScrollbarGutter || ''),
      workspacePersistenceUndoRedo: workspace?.persistenceUndoRedo === true,
      workspaceMainTextEditable: workspace?.mainTextEditable === true,
      workspaceTextLocalActionHistory: workspace?.textLocalActionHistory === true,
      workspaceTextFocusStableDuringDraftSave: workspace?.textFocusStableDuringDraftSave === true,
      workspaceMainTextSavePreservesLiveDom: workspace?.mainTextSavePreservesLiveDom === true,
      workspaceMainFillStylePersistence: workspace?.mainFillStylePersistence === true,
      workspaceMainFillStyleJsonPrimary: workspace?.mainFillStyleJsonPrimary === true,
      workspaceMainFillThemeReady: workspace?.mainFillThemeReady === true,
      workspaceMainFillLiveDraftSync: workspace?.mainFillLiveDraftSync === true,
      workspaceMainFillRootSaveBeforeSelectionLoss: workspace?.mainFillRootSaveBeforeSelectionLoss === true,
      workspaceMainRadiusStylePersistence: workspace?.mainRadiusStylePersistence === true,
      workspaceMainRadiusStyleJsonPrimary: workspace?.mainRadiusStyleJsonPrimary === true,
      workspaceMainRadiusLiveDraftSync: workspace?.mainRadiusLiveDraftSync === true,
      workspaceMainRadiusLiveRafQuiet: workspace?.mainRadiusLiveRafQuiet === true,
      workspaceMainRadiusSelectionVisualVariableSync: workspace?.mainRadiusSelectionVisualVariableSync === true,
      workspaceMainBorderColorStylePersistence: workspace?.mainBorderColorStylePersistence === true,
      workspaceMainBorderColorStyleJsonPrimary: workspace?.mainBorderColorStyleJsonPrimary === true,
      workspaceMainBorderColorLiveDraftSync: workspace?.mainBorderColorLiveDraftSync === true,
      workspaceMainBorderColorLiveRafQuiet: workspace?.mainBorderColorLiveRafQuiet === true,
      workspaceMainBorderColorLiveStoreWrites: workspace?.mainBorderColorLiveStoreWrites === false,
      workspaceMainBorderColorLiveRootSaves: workspace?.mainBorderColorLiveRootSaves === false,
      workspaceMainBorderColorSelectionLossFlush: workspace?.mainBorderColorSelectionLossFlush === true,
      workspaceMainTemplates: workspace?.mainTemplates === true,
      workspaceObservers: Number(workspace?.observers ?? -1),
      workspaceTimers: Number(workspace?.timers ?? -1),
      workspaceRetryLoops: Number(workspace?.retryLoops ?? -1),
      workspaceGeometryNormalizers: Number(workspace?.geometryNormalizers ?? -1),
      workspaceDragRuntimes: Number(workspace?.dragRuntimes ?? -1),
      workspaceLegacyCanvasRuntime: workspace?.legacyCanvasRuntime === true,

      siteMainApi: typeof window.SiteMain?.ensure === 'function',
      siteMainJsonPrimary: window.SiteMain?.contract?.jsonPrimary === true,
      siteMainSelection: window.SiteMain?.contract?.selection === true,
      siteMainDrag: window.SiteMain?.contract?.drag === true,
      siteMainResize: window.SiteMain?.contract?.resize === true,
      siteMainLiveParentGrow: window.SiteMain?.contract?.liveParentGrow === true,
      siteMainNaturalFlow: window.SiteMain?.contract?.naturalFlow === true,
      siteMainResizeEquations: window.SiteMain?.contract?.resizeEquations === true,
      siteMainAdjacentPairEquation: String(window.SiteMain?.contract?.adjacentPairEquation || ''),
      siteMainPairCanvasWidthInvariant: window.SiteMain?.contract?.pairCanvasWidthInvariant === true,
      siteMainCanvasScrollbarGutter: String(window.SiteMain?.contract?.canvasScrollbarGutter || ''),
      siteMainPersistenceUndoRedo: window.SiteMain?.contract?.persistenceUndoRedo === true,
      siteMainTextEditable: window.SiteMain?.contract?.mainTextEditable === true,
      siteMainTextLocalActionHistory: window.SiteMain?.contract?.textLocalActionHistory === true,
      siteMainTextFocusStableDuringDraftSave: window.SiteMain?.contract?.textFocusStableDuringDraftSave === true,
      siteMainTextSavePreservesLiveDom: window.SiteMain?.contract?.mainTextSavePreservesLiveDom === true,
      siteMainFillStylePersistence: window.SiteMain?.contract?.mainFillStylePersistence === true,
      siteMainFillStyleJsonPrimary: window.SiteMain?.contract?.mainFillStyleJsonPrimary === true,
      siteMainFillThemeReady: window.SiteMain?.contract?.mainFillThemeReady === true,
      siteMainFillLiveDraftSync: window.SiteMain?.contract?.mainFillLiveDraftSync === true,
      siteMainFillRootSaveBeforeSelectionLoss: window.SiteMain?.contract?.mainFillRootSaveBeforeSelectionLoss === true,
      siteMainRadiusStylePersistence: window.SiteMain?.contract?.mainRadiusStylePersistence === true,
      siteMainRadiusStyleJsonPrimary: window.SiteMain?.contract?.mainRadiusStyleJsonPrimary === true,
      siteMainRadiusLiveDraftSync: window.SiteMain?.contract?.mainRadiusLiveDraftSync === true,
      siteMainRadiusLiveRafQuiet: window.SiteMain?.contract?.mainRadiusLiveRafQuiet === true,
      siteMainRadiusSelectionVisualVariableSync: window.SiteMain?.contract?.mainRadiusSelectionVisualVariableSync === true,
      siteMainBorderColorStylePersistence: window.SiteMain?.contract?.mainBorderColorStylePersistence === true,
      siteMainBorderColorStyleJsonPrimary: window.SiteMain?.contract?.mainBorderColorStyleJsonPrimary === true,
      siteMainBorderColorLiveDraftSync: window.SiteMain?.contract?.mainBorderColorLiveDraftSync === true,
      siteMainBorderColorLiveRafQuiet: window.SiteMain?.contract?.mainBorderColorLiveRafQuiet === true,
      siteMainBorderColorLiveStoreWrites: window.SiteMain?.contract?.mainBorderColorLiveStoreWrites === false,
      siteMainBorderColorLiveRootSaves: window.SiteMain?.contract?.mainBorderColorLiveRootSaves === false,
      siteMainBorderColorSelectionLossFlush: window.SiteMain?.contract?.mainBorderColorSelectionLossFlush === true,
      siteMainTemplates: window.SiteMain?.contract?.templates === true,

      rootExists: root instanceof HTMLElement,
      headerExists: header instanceof HTMLElement,
      mainExists: main instanceof HTMLElement,
      footerExists: footer instanceof HTMLElement,
      mainTag: String(main?.tagName || '').toLowerCase(),
      mainStage: String(main?.dataset?.siteFrameMainStage || ''),
      mainPointerEvents: main ? getComputedStyle(main).pointerEvents : '',
      mainHeight: Number(main?.getBoundingClientRect?.().height ?? -1),
      mainPaddingTop: main ? getComputedStyle(main).paddingTop : '',
      mainPaddingRight: main ? getComputedStyle(main).paddingRight : '',
      mainPaddingBottom: main ? getComputedStyle(main).paddingBottom : '',
      mainPaddingLeft: main ? getComputedStyle(main).paddingLeft : '',
      mainBackgroundColor: main ? getComputedStyle(main).backgroundColor : '',
      mainMinHeight: main ? getComputedStyle(main).minHeight : '',
      canvasScrollerExists: canvasScroller instanceof HTMLElement,
      canvasScrollbarGutter,
      canvasScrollbarGutterStable: canvasScrollbarGutter.split(/\s+/).includes('stable'),
      authorityPersistenceUndoRedo: authorityContract?.persistenceUndoRedo === true,
      authorityMainTextEditable: authorityContract?.mainTextEditable === true,
      authorityTextLocalActionHistory: authorityContract?.textLocalActionHistory === true,
      authorityTextFocusStableDuringDraftSave: authorityContract?.textFocusStableDuringDraftSave === true,
      authorityMainTextSavePreservesLiveDom: authorityContract?.mainTextSavePreservesLiveDom === true,
      authorityMainFillStylePersistence: authorityContract?.mainFillStylePersistence === true,
      authorityMainFillStyleJsonPrimary: authorityContract?.mainFillStyleJsonPrimary === true,
      authorityMainFillThemeReady: authorityContract?.mainFillThemeReady === true,
      authorityMainFillLiveDraftSync: authorityContract?.mainFillLiveDraftSync === true,
      authorityMainFillRootSaveBeforeSelectionLoss: authorityContract?.mainFillRootSaveBeforeSelectionLoss === true,
      authorityMainRadiusStylePersistence: authorityContract?.mainRadiusStylePersistence === true,
      authorityMainRadiusStyleJsonPrimary: authorityContract?.mainRadiusStyleJsonPrimary === true,
      authorityMainRadiusLiveDraftSync: authorityContract?.mainRadiusLiveDraftSync === true,
      authorityMainRadiusLiveRafQuiet: authorityContract?.mainRadiusLiveRafQuiet === true,
      authorityMainRadiusSelectionVisualVariableSync: authorityContract?.mainRadiusSelectionVisualVariableSync === true,
      authorityMainBorderColorStylePersistence: authorityContract?.mainBorderColorStylePersistence === true,
      authorityMainBorderColorStyleJsonPrimary: authorityContract?.mainBorderColorStyleJsonPrimary === true,
      authorityMainBorderColorLiveDraftSync: authorityContract?.mainBorderColorLiveDraftSync === true,
      authorityMainBorderColorLiveRafQuiet: authorityContract?.mainBorderColorLiveRafQuiet === true,
      authorityMainBorderColorLiveStoreWrites: authorityContract?.mainBorderColorLiveStoreWrites === false,
      authorityMainBorderColorLiveRootSaves: authorityContract?.mainBorderColorLiveRootSaves === false,
      authorityMainBorderColorSelectionLossFlush: authorityContract?.mainBorderColorSelectionLossFlush === true,
      authorityHistoryJsonPrimary: authorityContract?.historyJsonPrimary === true,
      authorityHistoryHtmlSnapshots: authorityContract?.historyHtmlSnapshots === false,
      authorityOneStepPerCommittedTransaction: authorityContract?.oneStepPerCommittedTransaction === true,
      historyApi: typeof authority?.undo === 'function' && typeof authority?.redo === 'function' && typeof authority?.historyStatus === 'function',
      historyStatus: authority?.historyStatus?.() || null,
      historyStorageKey: String(authorityContract?.historyStorageKey || ''),
      undoButtonInstalled: document.getElementById('undo-btn')?.dataset?.siteFrameHistory === '00899',
      redoButtonInstalled: document.getElementById('redo-btn')?.dataset?.siteFrameHistory === '00899',
      toolbarDeleteInstalled: document.getElementById('delete-btn')?.dataset?.siteFrameDeleteController === '00892',
      exactAreaOrder,
      exactAreaOrderValid: exactAreaOrder.join(',') === 'st-site-header-slot,st-site-main-slot,st-site-footer-slot',
      mainSectionCount: main?.querySelectorAll?.(':scope > .sf-main-selection-section')?.length || 0,
      mainLevelCount: main?.querySelectorAll?.('.sf-main-selection-level')?.length || 0,
      mainContainerCount: main?.querySelectorAll?.('.sf-main-selection-container')?.length || 0,
      mainBlockCount: main?.querySelectorAll?.('.sf-main-selection-block')?.length || 0,
      mainResizeHandleCount: main?.querySelectorAll?.('.st-resize')?.length || 0,
      mainDragMarkerCount: main?.querySelectorAll?.('.st-drag-marker,.st-drop-marker,[draggable="true"]')?.length || 0,
      mainTemplateMarkerCount: main?.querySelectorAll?.('[data-template-id],[data-template-source]')?.length || 0,
      mainSectionsHaveRole: Array.from(main?.querySelectorAll?.(':scope > .st-section') || []).every((node) => node.dataset.secRole === 'main'),
      mainLeafCanvasDefaultsNeutralized: Array.from(main?.querySelectorAll?.('.sf-main-selection-block') || []).every((node) => {
        const style = getComputedStyle(node);
        return style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderTopWidth === '0px';
      }),
      mainTreeRootPresent: !!document.querySelector('#page-tree-root [data-special-key="main"]'),
      mainTreeNodeCount: document.querySelectorAll('#page-tree-root [data-special-key^="main__"]').length,
      mainStoreAreaChildren: Array.isArray(mainArea?.children) ? mainArea.children.length : -1,
      mainStoreIds: storeMainIds,
      mainDomIds: domMainIds,
      mainStoreDomExact: JSON.stringify(storeMainIds) === JSON.stringify(domMainIds),

      builderMode: !!builderMode,
      builderModeObservers: Number(builderMode?.observers ?? -1),
      builderModeTimers: Number(builderMode?.timers ?? -1),
      builderModeRetryLoops: Number(builderMode?.retryLoops ?? -1),
      builderModeGlobalPointerListeners: Number(builderMode?.globalPointerListeners ?? -1),
      builderModeGeometryWrites: Number(builderMode?.geometryWrites ?? -1),

      galleryWorkspace: !!galleryWorkspace,
      galleryExclusiveWorkspace: galleryWorkspace?.exclusiveWorkspace === true,
      galleryDedicatedOverlay: galleryWorkspace?.dedicatedOverlayLayer === true,
      galleryNormalFlowMixing: galleryWorkspace?.normalFlowMixing === true,
      gallerySingleOwner: galleryWorkspace?.singleOwner === true,
      galleryIdempotentEnter: galleryWorkspace?.idempotentEnter === true,
      gallerySingleMount: galleryWorkspace?.singleMount === true,
      galleryObservers: Number(galleryWorkspace?.observers ?? -1),
      galleryTimers: Number(galleryWorkspace?.timers ?? -1),
      galleryRetryLoops: Number(galleryWorkspace?.retryLoops ?? -1),
      galleryBridge: !!galleryBridge,
      galleryBridgeSingleOwner: galleryBridge?.singleOwner === true,
      galleryBridgeLazyImportCalls: Number(galleryBridge?.lazyImportCalls ?? -1),
      galleryBridgeRealOpenCalls: Number(galleryBridge?.realOpenCalls ?? -1),
      galleryBridgeRetryLoops: Number(galleryBridge?.retryLoops ?? -1),
      galleryBridgeDelayedReopen: galleryBridge?.delayedReopen === true,
      galleryEmptyValid: galleryBridge?.emptyGalleryIsValid === true,

      headerRuntime: !!headerRuntime,
      footerRuntime: !!footerRuntime,
      headerHashAuthority: headerRuntime?.hashNavigationAuthority === true,
      footerHashAuthority: footerRuntime?.hashNavigationAuthority === true,
      oldSelection00881Absent: !window.__ST_SITE_FRAME_EXPLICIT_SELECTION_00881__,
      oldWorkspace00884Absent: !window.ST_SITE_FRAME_WORKSPACE_RUNTIME_00884,
      oldWorkspace00887Absent: !window.ST_SITE_FRAME_WORKSPACE_RUNTIME_00887,
    };
  }

  function buildReport(reason = 'manual') {
    const runtime = runtimeSignals();

    const architectureReady = runtime.authority
      && runtime.storeAuthority
      && runtime.jsonPrimary
      && runtime.transactions
      && runtime.rendererOwnedGeometryWrites
      && runtime.editLayerDirectDomGeometryWrites === false
      && runtime.editLayer
      && runtime.editStoreAuthority
      && runtime.editRendererAuthority
      && runtime.editDirectDomWrites === false
      && runtime.authorityDomStructureContract === '00889-site-frame-dom-structure-contract'
      && runtime.authorityAuthoredBlocksOpaque
      && runtime.authorityInternalImplementationBlocksExcluded
      && runtime.editDomStructureContract === runtime.authorityDomStructureContract
      && runtime.editCanonicalFrameTargetResolution
      && runtime.editCanonicalTreeScan
      && runtime.persistence
      && runtime.persistenceAuthority === 'site-frame-store-json-primary'
      && runtime.persistenceExplicitOnly
      && runtime.persistenceSelectionSanitized;

    const headerFooterEngineStable = architectureReady
      && runtime.selection
      && runtime.selectionObservers === 0
      && runtime.selectionGlobalPointerListeners === 0
      && runtime.selectionInspectorColorAuthority
      && runtime.selectionDuplicatedPalette === false
      && runtime.selectionPreviousOnlyCleanup
      && runtime.selectionFullSlotScan === false
      && runtime.selectionHeaderFooterHandleCount === 8
      && runtime.headerSelectionInstalled
      && runtime.footerSelectionInstalled
      && runtime.selectedHandleCountValid
      && runtime.builderMode
      && runtime.builderModeObservers === 0
      && runtime.builderModeTimers === 0
      && runtime.builderModeRetryLoops === 0
      && runtime.builderModeGlobalPointerListeners === 0
      && runtime.builderModeGeometryWrites === 0
      && runtime.headerRuntime
      && runtime.footerRuntime
      && runtime.headerHashAuthority === false
      && runtime.footerHashAuthority === false;

    const galleryBridgeIdle = runtime.galleryBridgeLazyImportCalls === 0 && runtime.galleryBridgeRealOpenCalls === 0;
    const galleryBridgeOpenedOnce = runtime.galleryBridgeLazyImportCalls === 1 && runtime.galleryBridgeRealOpenCalls === 1;
    const templateGalleryReady = runtime.galleryWorkspace
      && runtime.galleryExclusiveWorkspace
      && runtime.galleryDedicatedOverlay
      && runtime.galleryNormalFlowMixing === false
      && runtime.gallerySingleOwner
      && runtime.galleryIdempotentEnter
      && runtime.gallerySingleMount
      && runtime.galleryObservers === 0
      && runtime.galleryTimers === 0
      && runtime.galleryRetryLoops === 0
      && runtime.galleryBridge
      && runtime.galleryBridgeSingleOwner
      && (galleryBridgeIdle || galleryBridgeOpenedOnce)
      && runtime.galleryBridgeRetryLoops === 0
      && runtime.galleryBridgeDelayedReopen === false
      && runtime.galleryEmptyValid;

    const mainDragReady = runtime.mainAreaRoot === '#st-site-main-slot'
      && runtime.mainFrameOnly === false
      && runtime.mainStructureJsonPrimary
      && runtime.authorityMainSelectionOnly === false
      && runtime.authorityMainDrag === true
      && runtime.authorityMainResize === true
      && runtime.authorityMainTemplates === true
      && runtime.authorityMainTemplateModes.join(',') === 'add,replace'
      && runtime.workspace
      && runtime.workspaceExactAreaOrder.join(',') === 'header,main,footer'
      && runtime.workspaceMainSlotId === 'st-site-main-slot'
      && runtime.workspaceMainFrameOnly === false
      && runtime.workspaceMainSelection
      && runtime.workspaceMainDrag === true
      && runtime.workspaceMainResize === true
      && runtime.workspaceLiveParentGrow
      && runtime.workspaceNaturalFlow
      && runtime.workspaceResizeEquations
      && runtime.workspaceAdjacentPairEquation === 'active-plus-adjacent-constant'
      && runtime.workspaceMainTemplates === true
      && runtime.workspaceObservers === 0
      && runtime.workspaceTimers === 0
      && runtime.workspaceRetryLoops === 0
      && runtime.workspaceGeometryNormalizers === 0
      && runtime.workspaceDragRuntimes === 0
      && runtime.workspaceLegacyCanvasRuntime === false
      && runtime.siteMainApi
      && runtime.siteMainJsonPrimary
      && runtime.siteMainSelection
      && runtime.siteMainDrag === true
      && runtime.siteMainResize === true
      && runtime.siteMainLiveParentGrow
      && runtime.siteMainNaturalFlow
      && runtime.siteMainResizeEquations
      && runtime.siteMainAdjacentPairEquation === 'active-plus-adjacent-constant'
      && runtime.siteMainTemplates === true
      && runtime.mainExists
      && runtime.mainTag === 'main'
      && runtime.mainStage === '00914-main-shadow-preset-inner-parity'
      && runtime.mainPointerEvents !== 'none'
      && runtime.mainHeight >= 0
      && runtime.mainPaddingTop === '0px'
      && runtime.mainPaddingRight === '0px'
      && runtime.mainPaddingBottom === '0px'
      && runtime.mainPaddingLeft === '0px'
      && runtime.mainBackgroundColor === 'rgba(0, 0, 0, 0)'
      && runtime.mainMinHeight === '0px'
      && runtime.authorityMainEdgeToEdge
      && runtime.authorityEmptyMainIsValid
      && runtime.authorityToolbarDelete
      && runtime.authoritySharedMoveNode
      && runtime.authorityMoveAreas.join(',') === 'main'
      && runtime.authorityMoveMode === 'same-parent-plus-block-reparent'
      && runtime.authorityBlockCrossContainer
      && runtime.authorityLiveParentGrow
      && runtime.authorityNaturalFlowAreas.join(',') === 'header,main,footer'
      && runtime.authorityLiveParentGrowMeasurement === 'active-child-bottom-only'
      && runtime.authorityResizeEquations
      && runtime.authorityAdjacentPairEquation === 'active-plus-adjacent-constant'
      && runtime.authorityIntegerPixelConservation
      && runtime.authorityPairOnlyStorePatches
      && runtime.authorityNonAdjacentWidthsInvariant
      && runtime.authorityPairMinimumRule === 'intrinsic-or-current-if-already-undersized'
      && runtime.authorityPairCanvasWidthInvariant
      && runtime.authorityCanvasScrollbarGutter === 'stable'
      && runtime.editSharedDragContract
      && runtime.editMainDrag
      && runtime.editMainResize === true
      && runtime.editResizeAreas.join(',') === 'header,main,footer'
      && runtime.editDragAreas.join(',') === 'main'
      && runtime.editDragMode === 'same-parent-plus-block-reparent'
      && runtime.editBlockCrossContainer
      && runtime.editDragStoreAuthority
      && runtime.editDragDirectDomCommit === false
      && runtime.editLiveAncestorGrowDuringPointer
      && runtime.editLiveParentGrowAreas.join(',') === 'header,main,footer'
      && runtime.editLiveParentGrowMeasurement === 'active-child-bottom-only'
      && runtime.editResizeEquationsVersion === '00898-site-frame-adjacent-pair-canvas-width-invariant'
      && runtime.editAdjacentPairEquation === 'active-plus-adjacent-constant'
      && runtime.editIntegerPixelConservation
      && runtime.editPairOnlyStorePatches
      && runtime.editNonAdjacentWidthsInvariant
      && runtime.editPairMinimumRule === 'intrinsic-or-current-if-already-undersized'
      && runtime.editPairCanvasWidthInvariant
      && runtime.editCanvasScrollbarGutter === 'stable'
      && runtime.workspacePairCanvasWidthInvariant
      && runtime.workspaceCanvasScrollbarGutter === 'stable'
      && runtime.siteMainPairCanvasWidthInvariant
      && runtime.siteMainCanvasScrollbarGutter === 'stable'
      && runtime.authorityPersistenceUndoRedo
      && runtime.authorityHistoryJsonPrimary
      && runtime.authorityHistoryHtmlSnapshots
      && runtime.authorityOneStepPerCommittedTransaction
      && runtime.authorityTextFocusStableDuringDraftSave
      && runtime.authorityMainTextSavePreservesLiveDom
      && runtime.authorityMainFillStylePersistence
      && runtime.authorityMainFillStyleJsonPrimary
      && runtime.authorityMainFillThemeReady
      && runtime.authorityMainFillLiveDraftSync
      && runtime.authorityMainFillRootSaveBeforeSelectionLoss
      && runtime.authorityMainRadiusStylePersistence
      && runtime.authorityMainRadiusStyleJsonPrimary
      && runtime.authorityMainRadiusLiveDraftSync
      && runtime.authorityMainRadiusLiveRafQuiet
      && runtime.authorityMainRadiusSelectionVisualVariableSync
      && runtime.authorityMainBorderColorStylePersistence
      && runtime.authorityMainBorderColorStyleJsonPrimary
      && runtime.authorityMainBorderColorLiveDraftSync
      && runtime.authorityMainBorderColorLiveRafQuiet
      && runtime.authorityMainBorderColorLiveStoreWrites
      && runtime.authorityMainBorderColorLiveRootSaves
      && runtime.authorityMainBorderColorSelectionLossFlush
      && runtime.historyApi
      && runtime.historyStorageKey === 'st_site_frame_history_v1'
      && runtime.undoButtonInstalled
      && runtime.redoButtonInstalled
      && runtime.workspacePersistenceUndoRedo
      && runtime.workspaceTextFocusStableDuringDraftSave
      && runtime.workspaceMainTextSavePreservesLiveDom
      && runtime.workspaceMainFillStylePersistence
      && runtime.workspaceMainFillStyleJsonPrimary
      && runtime.workspaceMainFillThemeReady
      && runtime.workspaceMainFillLiveDraftSync
      && runtime.workspaceMainFillRootSaveBeforeSelectionLoss
      && runtime.workspaceMainRadiusStylePersistence
      && runtime.workspaceMainRadiusStyleJsonPrimary
      && runtime.workspaceMainRadiusLiveDraftSync
      && runtime.workspaceMainRadiusLiveRafQuiet
      && runtime.workspaceMainRadiusSelectionVisualVariableSync
      && runtime.workspaceMainBorderColorStylePersistence
      && runtime.workspaceMainBorderColorStyleJsonPrimary
      && runtime.workspaceMainBorderColorLiveDraftSync
      && runtime.workspaceMainBorderColorLiveRafQuiet
      && runtime.workspaceMainBorderColorLiveStoreWrites
      && runtime.workspaceMainBorderColorLiveRootSaves
      && runtime.workspaceMainBorderColorSelectionLossFlush
      && runtime.siteMainPersistenceUndoRedo
      && runtime.siteMainTextFocusStableDuringDraftSave
      && runtime.siteMainTextSavePreservesLiveDom
      && runtime.siteMainFillStylePersistence
      && runtime.siteMainFillStyleJsonPrimary
      && runtime.siteMainFillThemeReady
      && runtime.siteMainFillLiveDraftSync
      && runtime.siteMainFillRootSaveBeforeSelectionLoss
      && runtime.siteMainRadiusStylePersistence
      && runtime.siteMainRadiusStyleJsonPrimary
      && runtime.siteMainRadiusLiveDraftSync
      && runtime.siteMainRadiusLiveRafQuiet
      && runtime.siteMainRadiusSelectionVisualVariableSync
      && runtime.siteMainBorderColorStylePersistence
      && runtime.siteMainBorderColorStyleJsonPrimary
      && runtime.siteMainBorderColorLiveDraftSync
      && runtime.siteMainBorderColorLiveRafQuiet
      && runtime.siteMainBorderColorLiveStoreWrites
      && runtime.siteMainBorderColorLiveRootSaves
      && runtime.siteMainBorderColorSelectionLossFlush
      && runtime.canvasScrollerExists
      && runtime.canvasScrollbarGutterStable
      && runtime.toolbarDeleteInstalled
      && runtime.exactAreaOrderValid
      && (runtime.mainSectionCount === 0 || (runtime.mainLevelCount >= 1 && runtime.mainContainerCount >= 1 && runtime.mainBlockCount >= 1))
      && runtime.mainSelectionInstalled
      && runtime.mainDragInstalled
      && runtime.mainResizeInstalled
      && runtime.selectionMainOnly === false
      && runtime.selectionMainDragEnabled
      && runtime.selectionMainResizeEnabled
      && runtime.selectionMainHandleCount === 8
      && (runtime.mainResizeHandleCount === 0 || runtime.mainResizeHandleCount === 8)
      && runtime.mainDragMarkerCount === 0
      && runtime.mainTemplateMarkerCount >= 0
      && runtime.mainStoreAreaChildren >= 0
      && runtime.mainStoreDomExact
      && runtime.oldSelection00881Absent
      && runtime.oldWorkspace00884Absent
      && runtime.oldWorkspace00887Absent;

    const mainTemplatesReady = mainDragReady
      && runtime.authorityMainTemplates === true
      && runtime.authorityMainTemplateModes.join(',') === 'add,replace'
      && runtime.workspaceMainTemplates === true
      && runtime.siteMainTemplates === true
      && runtime.mainStoreDomExact;

    const allReady = headerFooterEngineStable && templateGalleryReady && mainDragReady && mainTemplatesReady;
    const blockers = [
      ...(architectureReady ? [] : ['STORE_TRANSACTION_AUTHORITY_RUNTIME_PROOF_FAILED']),
      ...(headerFooterEngineStable ? [] : ['HEADER_FOOTER_ENGINE_RUNTIME_PROOF_FAILED']),
      ...(templateGalleryReady ? [] : ['TEMPLATE_GALLERY_SINGLE_OWNER_CONTRACT_FAILED']),
      ...(mainDragReady ? [] : ['MAIN_BLOCK_TRANSFER_DRAG_RUNTIME_PROOF_FAILED']),
      ...(mainTemplatesReady ? [] : ['MAIN_TEMPLATES_ADD_REPLACE_RUNTIME_PROOF_FAILED']),
    ];

    return {
      version: VERSION,
      reason,
      clean: allReady,
      mainAllowed: allReady,
      headerFooterEngineStable,
      templateGalleryReady,
      mainSelectionReady: mainDragReady,
      mainDragReady,
      mainTemplatesReady,
      mainUnlockScope: allReady ? '00914-main-shadow-preset-inner-parity' : 'locked',
      architectureReady,
      blockers,
      blockerCount: blockers.length,
      resolvedCuts: MANIFEST.resolvedCuts,
      architectureBlockers: blockers,
      runtime,
      nextCutOrder: allReady ? ['00915-main-style-controls-parity'] : ['repeat-00914-main-shadow-preset-inner-parity-proof'],
    };
  }

  function push(event, detail, level = 'info') {
    const name = `clean-engine-audit:${event}-00914`;
    try { window.__ST_PERF_DIAG__?.push?.(name, detail, level); } catch {}
    try { window.__ST_ALL_LOG__?.push?.(name, detail, level); } catch {}
    try { (level === 'warn' ? console.warn : console.info)(`[${name}]`, detail); } catch {}
  }

  function run(reason = 'manual') {
    const report = buildReport(reason);
    window.__ST_CLEAN_ENGINE_AUDIT_LAST_00914 = report;
    push('summary', report, report.blockerCount ? 'warn' : 'info');
    return report;
  }

  window.ST_CLEAN_ENGINE_AUDIT_00914 = Object.freeze({ version: VERSION, manifest: MANIFEST, run });

  const boot = () => queueMicrotask(() => {
    push('boot', {
      version: VERSION,
      diagnosticsOnly: true,
      mutatesDom: false,
      installsObserver: false,
      installsTimer: false,
      installsPointerHandler: false,
      allLogReady: !!window.__ST_ALL_LOG__?.push,
    });
    run('post-boot');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
