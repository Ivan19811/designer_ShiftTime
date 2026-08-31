// 00954-TEMPLATE-STYLE-LIVE-LINK

import { getHeaderTemplatesDemo } from '../header/header-templates.js?v=00984';
import { getMainTemplatesDemo } from '../main/main-templates.js?v=01039';
import { getFooterTemplatesDemo } from '../footer/footer-templates.js?v=00984';
import { loadTemplatesStore } from '../store/templates-store.js';
import { assertTemplateStyleProfile00945 } from '../style-profile/template-style-profile-contract.js';
import { openTemplatesGalleryManager } from '../templates-gallery-open-bridge.js?v=01050';
import {
  getSectionStyleByProfileId00953,
  getSectionStyleRegistry00953,
  SECTION_STYLE_FOLDER_ID_00953
} from '../style-registry/section-style-registry.js?v=01033';
import {
  createSectionStyleSelectionState00954,
  createTemplateStyleLiveLinkState00954,
  readActiveTemplates00946,
  readAppliedTemplateStyleSync00954,
  readSelectedSectionStyles00954,
  readTemplateStyleLiveLink00954,
  TEMPLATE_STYLE_SYNC_AREAS_00946
} from './template-style-sync-state.js';

const AREA_LABELS_00951 = Object.freeze({ header: 'Шапка', main: 'Main', footer: 'Footer' });
const SYNC_TRANSACTION_LABEL_00954 = 'template-style-sync-save-00954';
const STYLE_SYNC_BUILD_00954 = '00954-template-style-live-link';
const INFO_HOVER_DELAY_00951 = 3000;
let activeWidgetController00954_ = null;

function clone00951_(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}

function log00951_(event, detail = {}, level = 'info') {
  const payload = { build: STYLE_SYNC_BUILD_00954, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(event, payload, level); } catch (_) {}
  try { window.__ST_PERF_DIAG__?.push?.(event, payload, level); } catch (_) {}
}

function templateRegistry00951_() {
  const system = [
    ...(getHeaderTemplatesDemo() || []),
    ...(getMainTemplatesDemo() || []),
    ...(getFooterTemplatesDemo() || [])
  ];
  let user = [];
  try {
    const store = loadTemplatesStore();
    user = Array.isArray(store?.items) ? store.items : [];
  } catch (_) {}
  const registry = new Map();
  [...user, ...system].forEach((template) => {
    if (template?.id) registry.set(String(template.id), template);
  });
  return registry;
}

function resolveAreas00951_(selectedByArea = null) {
  const active = readActiveTemplates00946();
  const registry = templateRegistry00951_();
  const committed = readSelectedSectionStyles00954().selectedByArea;
  const selectedStyles = selectedByArea && typeof selectedByArea === 'object' ? selectedByArea : committed;
  const styleRegistry = getSectionStyleRegistry00953();
  const stylesByProfileId = new Map(styleRegistry.map((record) => [String(record.profileId), record]));
  const out = {};
  TEMPLATE_STYLE_SYNC_AREAS_00946.forEach((area) => {
    const descriptor = active[area] || null;
    const template = descriptor?.templateId ? registry.get(String(descriptor.templateId)) || null : null;
    const styleReference = selectedStyles?.[area] || null;
    const templateProfileId = String(template?.styleProfile?.profileId || descriptor?.profileId || '');
    const styleRecord = styleReference?.profileId
      ? (stylesByProfileId.get(String(styleReference.profileId)) || getSectionStyleByProfileId00953(styleReference.profileId))
      : (templateProfileId ? (stylesByProfileId.get(templateProfileId) || getSectionStyleByProfileId00953(templateProfileId)) : null);
    let profile = null;
    let profileError = '';
    if (styleRecord?.styleProfile) {
      profile = styleRecord.styleProfile;
    } else if (styleReference) {
      profileError = `Зареєстрований стиль ${String(styleReference.profileId || styleReference.styleId || '')} не знайдено`;
    } else if (template?.styleProfile != null) {
      try {
        profile = assertTemplateStyleProfile00945(template.styleProfile, {
          templateId: String(template.id),
          area
        });
      } catch (error) {
        profileError = Array.isArray(error?.issues) ? error.issues.join('; ') : String(error?.message || error || '');
      }
    }
    out[area] = {
      area,
      descriptor: descriptor ? { ...descriptor, templateName: template?.name || descriptor.templateName || descriptor.templateId } : null,
      template,
      profile,
      profileError,
      styleReference,
      styleRecord
    };
  });
  return out;
}

export function resolveTemplateStyleSyncAreas00946() {
  return resolveAreas00951_();
}

function defaultMasterArea00951_(areas, applied) {
  if (applied?.masterArea && areas[applied.masterArea]?.profile) return applied.masterArea;
  const profileAreas = TEMPLATE_STYLE_SYNC_AREAS_00946.filter((area) => !!areas[area]?.profile);
  if (profileAreas.length === 1) return profileAreas[0];
  if (profileAreas.includes('header')) return 'header';
  if (profileAreas.length) return profileAreas[0];
  return TEMPLATE_STYLE_SYNC_AREAS_00946.find((area) => !!areas[area]?.descriptor) || 'header';
}

function defaultAreaModes00951_(masterArea, applied) {
  const stored = applied?.areaModes && typeof applied.areaModes === 'object' ? applied.areaModes : {};
  return Object.fromEntries(TEMPLATE_STYLE_SYNC_AREAS_00946.map((area) => [
    area,
    area === masterArea ? 'own' : (stored[area] === 'own' ? 'own' : 'master')
  ]));
}

function syncApi00951_() {
  return window.ST_TEMPLATE_STYLE_SYNC_00954 || null;
}

function lastActionIsSync00951_() {
  const label = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.historyStatus?.()?.lastUndoLabel;
  return label === SYNC_TRANSACTION_LABEL_00954 || label === 'template-style-sync-save-00953' || label === 'template-style-sync-save-00951' || label === 'template-style-sync-once-00946';
}

function appliedProfileInfo00951_(applied, area) {
  const info = applied?.profilesByArea?.[area];
  return info && typeof info === 'object' ? info : null;
}

export function initTemplateStyleSyncWidget00954(host) {
  if (!(host instanceof HTMLElement)) return null;
  if (host.dataset.styleSyncReady === '00954') return host.__styleSyncController00954 || null;
  if (activeWidgetController00954_?.host !== host) activeWidgetController00954_?.destroy?.('widget-host-replaced-00954');
  host.dataset.styleSyncReady = '00954';

  let committedSelections = readSelectedSectionStyles00954();
  let pendingSelectedByArea = clone00951_(committedSelections.selectedByArea || {});
  let areas = resolveAreas00951_(pendingSelectedByArea);
  let applied = readAppliedTemplateStyleSync00954();
  let liveLink = readTemplateStyleLiveLink00954();
  let syncMode = liveLink.enabled ? 'live-link' : 'once';
  let masterArea = defaultMasterArea00951_(areas, liveLink.enabled ? liveLink : applied);
  let areaModes = defaultAreaModes00951_(masterArea, liveLink.enabled ? liveLink : applied);
  let previewActive = false;
  let dirty = false;
  let status = '';
  let statusKind = 'info';
  let hoverTimer = 0;

  host.innerHTML = `
    <div class="st-style-sync" data-style-sync-widget="00954" data-style-sync-build="${STYLE_SYNC_BUILD_00954}">
      <div class="st-style-sync__mode">Режим синхронізації · збірка 00954</div>
      <div class="st-style-sync__mode-switch" data-style-sync-mode-switch>
        <button type="button" data-style-sync-mode="once">Застосувати один раз</button>
        <button type="button" data-style-sync-mode="live-link">Підтримувати синхронізацію</button>
      </div>
      <div class="st-style-sync__note">Вибір стилю одразу показує результат. Текст, фотографії, структура та геометрія не змінюються.</div>
      <div class="st-style-sync__areas" data-style-sync-areas></div>
      <div class="st-style-sync__status" data-style-sync-status aria-live="polite"></div>
      <div class="st-style-sync__actions">
        <button class="st-btn st-style-sync__btn" type="button" data-style-sync-preview>Оновити Preview</button>
        <button class="st-btn st-style-sync__btn st-style-sync__btn--save" type="button" data-style-sync-save>Зберегти</button>
        <button class="st-btn st-style-sync__btn" type="button" data-style-sync-cancel>Скасувати</button>
        <button class="st-btn st-style-sync__btn st-style-sync__btn--restore" type="button" data-style-sync-restore>Повернути власні стилі</button>
      </div>
    </div>
  `;

  const areasHost = host.querySelector('[data-style-sync-areas]');
  const statusEl = host.querySelector('[data-style-sync-status]');
  const previewBtn = host.querySelector('[data-style-sync-preview]');
  const saveBtn = host.querySelector('[data-style-sync-save]');
  const cancelBtn = host.querySelector('[data-style-sync-cancel]');
  const restoreBtn = host.querySelector('[data-style-sync-restore]');
  const infoPopup = document.createElement('section');
  infoPopup.className = 'st-style-sync-info';
  const modeButtons = Array.from(host.querySelectorAll('[data-style-sync-mode]'));
  infoPopup.dataset.styleSyncInfoPopup = '00954';
  infoPopup.setAttribute('role', 'tooltip');
  infoPopup.hidden = true;
  document.body.appendChild(infoPopup);

  function setStatus00951_(message, kind = 'info') {
    status = String(message || '');
    statusKind = String(kind || 'info');
  }

  function effectiveSourceArea00951_(area) {
    return area !== masterArea && areaModes[area] === 'master' ? masterArea : area;
  }

  function requestPayload00951_() {
    const plan = {};
    const activeTemplates = {};
    const missing = [];
    TEMPLATE_STYLE_SYNC_AREAS_00946.forEach((area) => {
      activeTemplates[area] = areas[area]?.descriptor || null;
      const sourceArea = effectiveSourceArea00951_(area);
      const info = areas[sourceArea];
      const profile = info?.profile;
      if (!profile?.theme) {
        missing.push(area);
        return;
      }
      plan[area] = {
        area,
        sourceArea,
        theme: clone00951_(profile.theme),
        styleId: String(info.styleReference?.styleId || info.styleRecord?.styleId || ''),
        styleName: String(info.styleReference?.styleName || info.styleRecord?.name || info.template?.name || profile.profileId || ''),
        sourceTemplateId: String(info.styleReference?.sourceTemplateId || profile.templateId || info.template?.id || ''),
        profileId: String(profile.profileId || ''),
        collectionId: String(profile.collectionId || '')
      };
    });
    return {
      ok: missing.length === 0 && Object.keys(plan).length === TEMPLATE_STYLE_SYNC_AREAS_00946.length,
      missing,
      plan,
      syncMode,
      masterArea,
      areaModes: { ...areaModes },
      activeTemplates,
      selectionState: createSectionStyleSelectionState00954(pendingSelectedByArea),
      liveLinkState: createTemplateStyleLiveLinkState00954({ mode: syncMode, masterArea, areaModes })
    };
  }

  function hideInfo00951_() {
    window.clearTimeout(hoverTimer);
    hoverTimer = 0;
    infoPopup.hidden = true;
  }

  function appendInfoField00951_(grid, label, value) {
    const key = document.createElement('div');
    key.className = 'st-style-sync-info__key';
    key.textContent = label;
    const val = document.createElement('div');
    val.className = 'st-style-sync-info__value';
    val.textContent = value || '—';
    grid.append(key, val);
  }

  function showInfo00951_(area, anchor) {
    const sourceArea = effectiveSourceArea00951_(area);
    const current = areas[sourceArea] || {};
    const payloadItem = requestPayload00951_().plan?.[area] || {};
    const saved = appliedProfileInfo00951_(applied, area);
    const info = dirty ? payloadItem : (saved || payloadItem);
    infoPopup.replaceChildren();

    const eyebrow = document.createElement('div');
    eyebrow.className = 'st-style-sync-info__eyebrow';
    eyebrow.textContent = dirty ? 'PREVIEW · НЕ ЗБЕРЕЖЕНО' : 'ЗАСТОСОВАНИЙ ШАБЛОН СТИЛЮ';
    const title = document.createElement('div');
    title.className = 'st-style-sync-info__title';
    title.textContent = AREA_LABELS_00951[area];
    const styleName = document.createElement('div');
    styleName.className = 'st-style-sync-info__name';
    styleName.textContent = String(info.styleName || current.styleReference?.styleName || current.styleRecord?.name || 'Стиль активного шаблону');
    const grid = document.createElement('div');
    grid.className = 'st-style-sync-info__grid';
    appendInfoField00951_(grid, 'Номер стилю', String(info.styleId || current.styleReference?.styleId || current.styleRecord?.styleId || 'системний'));
    appendInfoField00951_(grid, 'Profile ID', String(info.profileId || current.profile?.profileId || ''));
    appendInfoField00951_(grid, 'Collection ID', String(info.collectionId || current.profile?.collectionId || ''));
    appendInfoField00951_(grid, 'Шаблон-джерело', String(info.sourceTemplateId || current.descriptor?.templateId || ''));
    appendInfoField00951_(grid, 'Джерело області', AREA_LABELS_00951[info.sourceArea || sourceArea] || String(info.sourceArea || sourceArea));
    appendInfoField00951_(grid, 'Режим області', area === masterArea ? 'Головний · власний стиль' : (areaModes[area] === 'master' ? 'Головний стиль' : 'Власний стиль'));
    appendInfoField00951_(grid, 'Зв’язок', syncMode === 'live-link' ? 'Підтримувати синхронізацію' : 'Застосувати один раз');
    if (!dirty && applied?.appliedAt) appendInfoField00951_(grid, 'Збережено', new Date(Number(applied.appliedAt)).toLocaleString('uk-UA'));
    infoPopup.append(eyebrow, title, styleName, grid);
    infoPopup.hidden = false;

    const rect = anchor.getBoundingClientRect();
    const popupRect = infoPopup.getBoundingClientRect();
    const gap = 10;
    const left = Math.max(12, Math.min(window.innerWidth - popupRect.width - 12, rect.left));
    const below = rect.bottom + gap;
    const top = below + popupRect.height <= window.innerHeight - 12
      ? below
      : Math.max(12, rect.top - popupRect.height - gap);
    infoPopup.style.left = `${Math.round(left)}px`;
    infoPopup.style.top = `${Math.round(top)}px`;
    log00951_('template-style-info-opened-00951', { area, dirty, delayMs: INFO_HOVER_DELAY_00951, profileId: String(info.profileId || '') });
  }

  function scheduleInfo00951_(area, anchor, delay = INFO_HOVER_DELAY_00951) {
    hideInfo00951_();
    hoverTimer = window.setTimeout(() => showInfo00951_(area, anchor), delay);
  }

  function cancelPreview00951_(reason = 'template-style-sync-ui-cancel-00951') {
    if (previewActive) syncApi00951_()?.cancel?.(reason);
    previewActive = false;
  }

  function autoPreview00951_(reason) {
    const payload = requestPayload00951_();
    if (!payload.ok) {
      cancelPreview00951_(`invalid-plan:${reason}`);
      dirty = false;
      setStatus00951_(`Preview неможливий: немає Style Profile для ${payload.missing.map((area) => AREA_LABELS_00951[area]).join(', ')}.`, 'error');
      render00951_();
      return { ok: false, reason: 'incomplete-style-plan', missing: payload.missing };
    }
    const result = syncApi00951_()?.previewPlan?.(payload) || { ok: false, reason: 'preview-plan-api-unavailable' };
    previewActive = !!result?.ok;
    dirty = !!result?.ok;
    setStatus00951_(
      result?.ok ? 'Preview активний для Шапки, Main і Footer. Натисніть червону кнопку «Зберегти» або «Скасувати».' : `Preview не виконано: ${result?.reason || 'невідома причина'}`,
      result?.ok ? 'warn' : 'error'
    );
    render00951_();
    log00951_('template-style-auto-preview-00951', { reason, ok: !!result?.ok, masterArea, areaModes: { ...areaModes }, allAreas: Object.keys(payload.plan) });
    return result;
  }

  function render00951_() {
    hideInfo00951_();
    modeButtons.forEach((button) => {
      const active = button.dataset.styleSyncMode === syncMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    areasHost.replaceChildren();
    const masterProfile = areas[masterArea]?.profile || null;
    TEMPLATE_STYLE_SYNC_AREAS_00946.forEach((area) => {
      const info = areas[area];
      const row = document.createElement('div');
      row.className = `st-style-sync__area${dirty ? ' is-previewing' : ''}`;
      row.dataset.area = area;

      const top = document.createElement('div');
      top.className = 'st-style-sync__area-top';
      const identity = document.createElement('div');
      identity.className = 'st-style-sync__identity';
      const label = document.createElement('div');
      label.className = 'st-style-sync__area-label';
      label.dataset.styleSyncInfoArea = area;
      label.tabIndex = 0;
      label.setAttribute('aria-label', `${AREA_LABELS_00951[area]}. Утримуйте вказівник 3 секунди для інформації про стиль.`);
      label.textContent = AREA_LABELS_00951[area];
      label.addEventListener('mouseenter', () => scheduleInfo00951_(area, label));
      label.addEventListener('mouseleave', hideInfo00951_);
      label.addEventListener('focus', () => scheduleInfo00951_(area, label, 0));
      label.addEventListener('blur', hideInfo00951_);
      const name = document.createElement('div');
      name.className = 'st-style-sync__template-name';
      name.textContent = info.styleRecord
        ? `Стиль: ${info.styleRecord.name} · Шаблон: ${info.descriptor?.templateName || 'не визначено'}`
        : (info.descriptor?.templateName || 'Активний шаблон не визначено');
      identity.append(label, name);

      const controls = document.createElement('div');
      controls.className = 'st-style-sync__area-controls';
      const gear = document.createElement('button');
      gear.type = 'button';
      gear.className = 'st-style-sync__style-picker';
      gear.dataset.styleSyncPick = area;
      gear.title = `Вибрати інший стиль для області «${AREA_LABELS_00951[area]}»`;
      gear.setAttribute('aria-label', gear.title);
      gear.textContent = '⚙';
      gear.addEventListener('click', () => {
        setStatus00951_(`Відкриваю «Стилі Секцій» для області «${AREA_LABELS_00951[area]}».`);
        render00951_();
        openTemplatesGalleryManager('section-styles', {
          styleSelectionArea: area,
          folderId: SECTION_STYLE_FOLDER_ID_00953,
          templateId: info.styleRecord?.styleId || ''
        });
      });

      const masterLabel = document.createElement('label');
      masterLabel.className = 'st-style-sync__master';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'st-style-sync-master-00951';
      radio.value = area;
      radio.checked = masterArea === area;
      radio.disabled = !info.profile;
      radio.addEventListener('change', () => {
        const before = masterArea;
        if (!radio.checked || !info.profile) {
          log00951_('template-style-sync-master-radio-rejected-00951', { before, requested: area, profileId: String(info.profile?.profileId || '') }, 'warn');
          return;
        }
        masterArea = area;
        TEMPLATE_STYLE_SYNC_AREAS_00946.forEach((candidate) => {
          areaModes[candidate] = candidate === area ? 'own' : 'master';
        });
        autoPreview00951_('master-area-change');
        log00951_('template-style-sync-master-radio-changed-00951', { before, masterArea, areaModes: { ...areaModes } });
      });
      masterLabel.append(radio, document.createTextNode('Головний'));
      controls.append(gear, masterLabel);
      top.append(identity, controls);

      const modes = document.createElement('div');
      modes.className = 'st-style-sync__switch';
      ['own', 'master'].forEach((mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = mode === 'own' ? 'Власний стиль' : 'Головний стиль';
        button.className = `st-style-sync__switch-btn${areaModes[area] === mode ? ' is-active' : ''}`;
        button.disabled = area === masterArea || (mode === 'master' && !masterProfile) || (mode === 'own' && !info.profile);
        button.addEventListener('click', () => {
          if (areaModes[area] === mode) return;
          areaModes[area] = mode;
          autoPreview00951_(`area-mode-${area}-${mode}`);
        });
        modes.appendChild(button);
      });

      const profileState = document.createElement('div');
      profileState.className = `st-style-sync__profile${info.profile ? ' is-ready' : ' is-missing'}`;
      profileState.textContent = info.profile
        ? `${info.styleRecord ? 'Стиль з галереї' : 'Стиль активного шаблону'}: ${info.profile.profileId}`
        : (info.profileError ? 'Style Profile має помилку contract' : 'Style Profile ще не додано');
      if (info.profileError) profileState.title = info.profileError;
      row.append(top, modes, profileState);
      areasHost.appendChild(row);
    });

    const payload = requestPayload00951_();
    const ready = payload.ok && !!syncApi00951_()?.previewPlan && !!syncApi00951_()?.savePlan;
    previewBtn.disabled = !ready;
    saveBtn.disabled = !ready || !dirty;
    saveBtn.classList.toggle('is-dirty', ready && dirty);
    cancelBtn.disabled = !previewActive || !dirty;
    restoreBtn.disabled = dirty || (!previewActive && !lastActionIsSync00951_());

    if (!status) {
      if (!payload.ok) setStatus00951_(`Немає Style Profile для: ${payload.missing.map((area) => AREA_LABELS_00951[area]).join(', ')}.`, 'warn');
      else setStatus00951_(syncMode === 'live-link'
        ? 'Live Link: зміна стилю головної області оновлює Preview лише для підключених областей.'
        : 'Одноразовий режим: після збереження області стануть незалежними.', 'ok');
    }
    statusEl.textContent = status;
    statusEl.dataset.kind = statusKind;
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const requestedMode = button.dataset.styleSyncMode === 'live-link' ? 'live-link' : 'once';
      if (requestedMode === syncMode) return;
      syncMode = requestedMode;
      if (syncMode === 'live-link') {
        TEMPLATE_STYLE_SYNC_AREAS_00946.forEach((area) => {
          if (area !== masterArea && areaModes[area] !== 'own') areaModes[area] = 'master';
        });
      }
      setStatus00951_(syncMode === 'live-link'
        ? 'Режим Live Link вибрано. Після «Зберегти» зв’язок залишиться активним.'
        : 'Одноразовий режим вибрано. Після «Зберегти» зв’язки буде вимкнено.', 'warn');
      autoPreview00951_(`sync-mode-${syncMode}`);
    });
  });

  previewBtn.addEventListener('click', () => autoPreview00951_('manual-preview-refresh'));

  saveBtn.addEventListener('click', () => {
    if (!dirty) return;
    const payload = requestPayload00951_();
    const result = payload.ok
      ? (syncApi00951_()?.savePlan?.(payload) || { ok: false, reason: 'save-plan-api-unavailable' })
      : { ok: false, reason: 'incomplete-style-plan' };
    if (result?.ok) {
      previewActive = false;
      dirty = false;
      applied = readAppliedTemplateStyleSync00954();
      liveLink = readTemplateStyleLiveLink00954();
      syncMode = liveLink.enabled ? 'live-link' : 'once';
      committedSelections = readSelectedSectionStyles00954();
      pendingSelectedByArea = clone00951_(committedSelections.selectedByArea || {});
      areas = resolveAreas00951_(pendingSelectedByArea);
      masterArea = defaultMasterArea00951_(areas, liveLink.enabled ? liveLink : applied);
      areaModes = defaultAreaModes00951_(masterArea, liveLink.enabled ? liveLink : applied);
      setStatus00951_(liveLink.enabled
        ? `Live Link збережено одним Store-комітом: ${liveLink.linkedAreas.map((area) => AREA_LABELS_00951[area]).join(', ')} підключено до ${AREA_LABELS_00951[masterArea]}.`
        : 'Стилі застосовано один раз одним Store-комітом. Усі області тепер незалежні.', 'ok');
    } else {
      setStatus00951_(`Збереження не виконано: ${result?.reason || 'невідома причина'}`, 'error');
    }
    render00951_();
  });

  cancelBtn.addEventListener('click', () => {
    cancelPreview00951_('template-style-sync-ui-cancel-00951');
    dirty = false;
    applied = readAppliedTemplateStyleSync00954();
    liveLink = readTemplateStyleLiveLink00954();
    syncMode = liveLink.enabled ? 'live-link' : 'once';
    committedSelections = readSelectedSectionStyles00954();
    pendingSelectedByArea = clone00951_(committedSelections.selectedByArea || {});
    areas = resolveAreas00951_(pendingSelectedByArea);
    masterArea = defaultMasterArea00951_(areas, liveLink.enabled ? liveLink : applied);
    areaModes = defaultAreaModes00951_(masterArea, liveLink.enabled ? liveLink : applied);
    setStatus00951_('Preview скасовано. Стилі, вибір шаблонів і режими повернено до початкового збереженого стану.', 'ok');
    render00951_();
  });

  restoreBtn.addEventListener('click', () => {
    const result = syncApi00951_()?.restoreOwn?.();
    setStatus00951_(
      result?.ok ? 'Останню синхронізацію скасовано одним Undo.' : 'Повернення доступне лише поки синхронізація є останньою дією.',
      result?.ok ? 'ok' : 'warn'
    );
    applied = readAppliedTemplateStyleSync00954();
    liveLink = readTemplateStyleLiveLink00954();
    syncMode = liveLink.enabled ? 'live-link' : 'once';
    committedSelections = readSelectedSectionStyles00954();
    pendingSelectedByArea = clone00951_(committedSelections.selectedByArea || {});
    areas = resolveAreas00951_(pendingSelectedByArea);
    render00951_();
  });

  const refresh00951_ = (event = null) => {
    const changedArea = String(event?.detail?.area || '');
    cancelPreview00951_('template-style-sync-active-template-refresh-00951');
    dirty = false;
    committedSelections = readSelectedSectionStyles00954();
    pendingSelectedByArea = clone00951_(committedSelections.selectedByArea || {});
    applied = readAppliedTemplateStyleSync00954();
    liveLink = readTemplateStyleLiveLink00954();
    syncMode = liveLink.enabled ? 'live-link' : 'once';
    if (liveLink.enabled && TEMPLATE_STYLE_SYNC_AREAS_00946.includes(changedArea)) {
      pendingSelectedByArea[changedArea] = null;
    }
    areas = resolveAreas00951_(pendingSelectedByArea);
    masterArea = defaultMasterArea00951_(areas, liveLink.enabled ? liveLink : applied);
    areaModes = defaultAreaModes00951_(masterArea, liveLink.enabled ? liveLink : applied);
    status = '';
    const linkedTemplateChanged = liveLink.enabled
      && (changedArea === masterArea || liveLink.linkedAreas.includes(changedArea));
    if (linkedTemplateChanged) {
      autoPreview00951_(`live-link-active-template-${changedArea}`);
    } else {
      render00951_();
    }
  };
  const onApplied00954_ = () => {
    if (dirty) return;
    applied = readAppliedTemplateStyleSync00954();
    liveLink = readTemplateStyleLiveLink00954();
    syncMode = liveLink.enabled ? 'live-link' : 'once';
    render00951_();
  };
  const onCandidate00954_ = (event) => {
    const selectedArea = String(event?.detail?.area || '');
    const reference = event?.detail?.reference;
    if (!TEMPLATE_STYLE_SYNC_AREAS_00946.includes(selectedArea) || !reference?.profileId) return;
    pendingSelectedByArea[selectedArea] = clone00951_(reference);
    areas = resolveAreas00951_(pendingSelectedByArea);
    if (!areas[masterArea]?.profile && areas[selectedArea]?.profile) masterArea = selectedArea;
    areaModes[selectedArea] = 'own';
    autoPreview00951_(`gallery-style-${selectedArea}`);
  };
  const onKeydown00954_ = (event) => {
    if (event.key === 'Escape') hideInfo00951_();
  };
  window.addEventListener('st:active-template-changed-00946', refresh00951_);
  window.addEventListener('st:template-style-sync-applied-00954', onApplied00954_);
  window.addEventListener('st:site-frame-history-restored', refresh00951_);
  window.addEventListener('st:section-style-candidate-00954', onCandidate00954_);
  window.addEventListener('scroll', hideInfo00951_, true);
  window.addEventListener('resize', hideInfo00951_);
  window.addEventListener('keydown', onKeydown00954_);

  let destroyed00954_ = false;
  const controller = Object.freeze({
    host,
    refresh: refresh00951_,
    cancelPreview: cancelPreview00951_,
    preview: autoPreview00951_,
    requestPayload: () => clone00951_(requestPayload00951_()),
    destroy: (reason = 'widget-destroy-00954') => {
      if (destroyed00954_) return false;
      destroyed00954_ = true;
      cancelPreview00951_(reason);
      hideInfo00951_();
      window.removeEventListener?.('st:active-template-changed-00946', refresh00951_);
      window.removeEventListener?.('st:template-style-sync-applied-00954', onApplied00954_);
      window.removeEventListener?.('st:site-frame-history-restored', refresh00951_);
      window.removeEventListener?.('st:section-style-candidate-00954', onCandidate00954_);
      window.removeEventListener?.('scroll', hideInfo00951_, true);
      window.removeEventListener?.('resize', hideInfo00951_);
      window.removeEventListener?.('keydown', onKeydown00954_);
      infoPopup.remove?.();
      if (activeWidgetController00954_ === controller) activeWidgetController00954_ = null;
      delete host.dataset.styleSyncReady;
      delete host.__styleSyncController00954;
      return true;
    },
    snapshot: () => ({
      version: STYLE_SYNC_BUILD_00954,
      syncMode,
      liveLinkEnabled: syncMode === 'live-link',
      linkedAreas: TEMPLATE_STYLE_SYNC_AREAS_00946.filter((area) => area !== masterArea && areaModes[area] === 'master'),
      masterArea,
      areaModes: { ...areaModes },
      previewActive,
      dirty,
      allAreasPlanned: Object.keys(requestPayload00951_().plan || {}),
      profiles: Object.fromEntries(TEMPLATE_STYLE_SYNC_AREAS_00946.map((area) => [area, {
        selectableAsMaster: !!areas[area]?.profile,
        templateId: String(areas[area]?.descriptor?.templateId || ''),
        profileId: String(areas[area]?.profile?.profileId || ''),
        selectedStyleId: String(areas[area]?.styleReference?.styleId || areas[area]?.styleRecord?.styleId || ''),
        selectedStyleName: String(areas[area]?.styleReference?.styleName || areas[area]?.styleRecord?.name || ''),
        effectiveSourceArea: effectiveSourceArea00951_(area),
        profileError: String(areas[area]?.profileError || ''),
        radio: (() => {
          const input = host.querySelector(`input[name="st-style-sync-master-00951"][value="${area}"]`);
          return input ? { checked: !!input.checked, disabled: !!input.disabled } : null;
        })()
      }])),
      actions: {
        previewDisabled: !!previewBtn.disabled,
        saveDisabled: !!saveBtn.disabled,
        saveDirty: saveBtn.classList.contains('is-dirty'),
        cancelDisabled: !!cancelBtn.disabled,
        restoreDisabled: !!restoreBtn.disabled
      }
    })
  });
  host.__styleSyncController00954 = controller;
  activeWidgetController00954_ = controller;
  window.ST_TEMPLATE_STYLE_SYNC_WIDGET_00954 = controller;
  render00951_();
  log00951_('template-style-sync-widget-ready-00954', controller.snapshot());
  return controller;
}
