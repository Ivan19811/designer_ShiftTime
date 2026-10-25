// widgets/order/js/order-edit-mode.js
// 00078 — редагування існуючого замовлення у вже наявній формі створення.

const EDIT_STATE_KEY = 'crm.orderEdit.v1';
const CUSTOMER_LS_KEY = 'customerDraft_v2';
const ORDER_LS_KEY = 'order';
const ORDER_NOTE_LS_KEY = 'crm.orderNote.v1';

function normalizeOrderGroup(value) {
  return String(value ?? '').trim().replace(/^0+/, '') || '0';
}

function cleanPhone(value) {
  return String(value ?? '').trim().replace(/^'/, '');
}

function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeState(state) {
  localStorage.setItem(EDIT_STATE_KEY, JSON.stringify(state));
  return state;
}

export function getOrderEditState() {
  const state = readJson(EDIT_STATE_KEY, null);
  if (!state || state.active !== true || !state.order_group) return null;
  return state;
}

function removeDescriptionStorage() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && /^Опис\s+\d+$/u.test(key)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('descriptionCounter');
  localStorage.removeItem('activeDescriptionId');
}

function clearDraftOnly() {
  localStorage.setItem(ORDER_LS_KEY, '[]');
  localStorage.removeItem(CUSTOMER_LS_KEY);
  localStorage.removeItem(ORDER_NOTE_LS_KEY);
  removeDescriptionStorage();
}

export function beginOrderEdit(orderGroup) {
  const og = normalizeOrderGroup(orderGroup);
  if (!og || og === '0') throw new Error('Не вказано order_group/AW для редагування');

  clearDraftOnly();
  writeState({
    active: true,
    status: 'requested',
    order_group: og,
    requestedAt: Date.now(),
    source: 'all-orders'
  });

  if ((location.hash || '').replace(/^#/, '') === 'nova-poshta') {
    location.reload();
  } else {
    location.hash = 'nova-poshta';
  }
}

function parseDescription(description) {
  const text = String(description ?? '').trim();
  const details = {};
  if (!text) return details;

  text.split(/\r?\n/).forEach((line) => {
    const s = String(line || '').trim();
    let m;
    if ((m = s.match(/^Напис\s+(?:в\s+)?Верху\s*:\s*(.*)$/iu))) details.top = m[1].trim();
    else if ((m = s.match(/^Напис\s+по\s+центру\s*:\s*(.*)$/iu))) details.center = m[1].trim();
    else if ((m = s.match(/^Напис\s+(?:з|в)\s*низу\s*:\s*(.*)$/iu))) details.bottom = m[1].trim();
    else if ((m = s.match(/^(?:Опис\s+)?Рисун(?:ок|ка)\s*:\s*(.*)$/iu))) details.drawing = m[1].trim();
  });

  if (!Object.keys(details).length) details.drawing = text;
  return details;
}

function buildOrderItems(rows) {
  removeDescriptionStorage();

  const items = rows.map((row, index) => {
    const details = parseDescription(row.description);
    const hasDetails = Object.values(details).some((v) => String(v || '').trim());
    const descriptionId = `Опис ${index + 1}`;

    if (hasDetails) localStorage.setItem(descriptionId, JSON.stringify(details));

    return {
      name: String(row.product ?? '').trim(),
      size: String(row.size ?? '').trim(),
      price: Number(String(row.price ?? '0').replace(',', '.')) || 0,
      marketplace: String(row.marketplace ?? '').trim(),
      comment: String(row.comment ?? '').trim(),
      extra: hasDetails
        ? `<button class="category-button" id="${descriptionId}" data-order-index="${index}">ОПИС</button>`
        : '',
      details
    };
  });

  localStorage.setItem('descriptionCounter', String(items.length + 1));
  return items;
}

function buildWarehouseText(row) {
  const direct = String(row.warehouse ?? '').trim();
  if (direct) return direct;
  return [row.warehouseType, row.warehouseNumber, row.street]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
    .join(': ');
}

function buildCustomerDraft(first) {
  const email = String(first.email ?? '').trim();
  const otherSurname = String(first.otherSurname ?? '').trim();
  const otherName = String(first.otherName ?? '').trim();
  const otherPhone = cleanPhone(first.otherPhone);

  return {
    partner: String(first.partner ?? '').trim(),
    surname: String(first.surname ?? first.clientSurname ?? '').trim(),
    name: String(first.name ?? first.clientFirstname ?? '').trim(),
    patronymic: String(first.patronymic ?? first.clientPatronymic ?? '').trim(),
    number: cleanPhone(first.number ?? first.phone),
    email,
    otherToggle: Boolean(otherSurname || otherName || otherPhone),
    otherSurname,
    otherName,
    otherPhone,
    emailToggle: Boolean(email),
    region: String(first.region ?? '').trim(),
    city: String(first.city ?? '').trim(),
    district: String(first.district ?? '').trim(),
    warehouse: buildWarehouseText(first),
    street: String(first.street ?? '').trim(),
    warehouseNumber: String(first.warehouseNumber ?? '').trim(),
    warehouseType: String(first.warehouseType ?? '').trim()
  };
}

function getSheetsBase() {
  return String(
    window._CONFIG?.SHEETS_WEBAPP_URL ??
    window.SHEETS_WEBAPP_URL ??
    window.SHIFTTIME_SHEETS_URL ??
    ''
  ).replace(/\/+$/, '');
}

async function fetchRowsByOrderGroup(orderGroup) {
  const base = getSheetsBase();
  if (!base) throw new Error('Не задано SHEETS_WEBAPP_URL');

  const url = new URL(base);
  url.searchParams.set('mode', 'orders');
  url.searchParams.set('og', orderGroup);
  url.searchParams.set('_', String(Date.now()));

  const response = await fetch(url.toString(), { cache: 'no-store', credentials: 'omit' });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Помилка читання замовлення: HTTP ${response.status}`);

  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error('Apps Script повернув не JSON під час читання замовлення'); }

  const rows = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  const og = normalizeOrderGroup(orderGroup);
  return rows.filter((row) => normalizeOrderGroup(row.order_group ?? row.orderGroup ?? row.AW) === og);
}

export async function prepareOrderEditMode() {
  const state = getOrderEditState();
  if (!state) return null;

  const rows = await fetchRowsByOrderGroup(state.order_group);
  if (!rows.length) throw new Error(`Замовлення AW ${state.order_group} не знайдено`);

  const first = rows[0];
  const orderItems = buildOrderItems(rows);
  localStorage.setItem(ORDER_LS_KEY, JSON.stringify(orderItems));
  localStorage.setItem(CUSTOMER_LS_KEY, JSON.stringify(buildCustomerDraft(first)));

  const orderNote = String(first.note ?? first.res1 ?? '').trim();
  if (orderNote) localStorage.setItem(ORDER_NOTE_LS_KEY, orderNote);
  else localStorage.removeItem(ORDER_NOTE_LS_KEY);

  return writeState({
    ...state,
    status: 'hydrated',
    hydratedAt: Date.now(),
    rowCount: rows.length,
    finance: {
      discount: first.discount ?? '',
      prepay: first.prepay ?? '',
      olxDelivery: first.olxDelivery ?? '',
      promDelivery: first.promDelivery ?? '',
      paidDelivery: first.paidDelivery ?? ''
    },
    note: orderNote,
    original: {
      id: first.id ?? first.orderId ?? '',
      id_month: first.id_month ?? '',
      id_manager: first.id_manager ?? first.idManager ?? '',
      manager: first.manager ?? '',
      created_at: first.created_at ?? first.createdAt ?? '',
      ttn: first.ttn ?? '',
      post: first.post ?? '',
      status: first.shipStatus ?? first.status ?? ''
    }
  });
}

function setInputValue(id, value, { show = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? '';
  if (show && String(value ?? '').trim() !== '') el.style.display = 'inline-block';
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export function mountOrderEditMode() {
  const state = getOrderEditState();
  if (!state || state.status !== 'hydrated') return false;

  setInputValue('discountInput', state.finance?.discount);
  setInputValue('prepaymentInput', state.finance?.prepay);
  setInputValue('olxInput', state.finance?.olxDelivery, { show: true });
  setInputValue('promInput', state.finance?.promDelivery, { show: true });
  setInputValue('deliveryInput', state.finance?.paidDelivery, { show: true });

  const submitBtn = document.getElementById('submitAll');
  if (submitBtn) {
    submitBtn.textContent = 'Змінити';
    submitBtn.dataset.orderEditMode = '1';
    submitBtn.dataset.orderGroup = state.order_group;
  }

  const actionWrap = submitBtn?.parentElement;
  if (actionWrap && !document.getElementById('cancelOrderEdit')) {
    actionWrap.classList.add('flex', 'items-center', 'justify-center', 'gap-3');
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'cancelOrderEdit';
    cancelBtn.textContent = 'Скасувати';
    cancelBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded shadow';
    cancelBtn.addEventListener('click', () => cancelOrderEdit({ navigate: true }));
    actionWrap.appendChild(cancelBtn);
  }

  const title = document.querySelector('#widget-header-origin h2');
  if (title) title.textContent = `Редагування замовлення №${state.order_group}`;

  return true;
}

export async function updateExistingOrder(payload) {
  const state = getOrderEditState();
  if (!state) throw new Error('Режим редагування не активний');

  const response = await fetch('/api/orders/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify({
      ...payload,
      action: 'updateOrder',
      mode: 'update-order',
      order_group: state.order_group,
      orderId: state.order_group
    })
  });

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (_) {}

  if (!response.ok || !data || data.success !== true) {
    throw new Error(data?.error || raw || `HTTP ${response.status}`);
  }
  return data;
}

export function clearOrderEditState() {
  localStorage.removeItem(EDIT_STATE_KEY);
}

export function completeOrderEdit() {
  clearOrderEditState();
}

export function cancelOrderEdit({ navigate = false } = {}) {
  clearDraftOnly();
  clearOrderEditState();

  if (Array.isArray(window.order)) window.order.length = 0;
  if (typeof window.updateOrderView === 'function') window.updateOrderView();

  if (navigate) location.hash = 'all-orders';
}
