// /frontend/widgets/admin/admin.js
// Логіка сторінки адміна: таби, live-таблиця користувачів, ролі, видимість, підключення Theme UI

/* ============================ КОНСТАНТИ ================================== */

// 01581 · Server permissions are authoritative; legacy GAS roles are not identities.
import {getCrmAuthToken01581,getCrmAuthScope01581} from './auth.js';
import {t01581 as t} from '../../js/i18n/uk-01581.js';
const apiBase=()=>String(window.ST_SSO_API_BASE_01581||location.origin+'/api/v1').replace(/\/$/,'');
async function protectedAdmin01581(path,method='GET',body){
 const token=getCrmAuthToken01581();if(!token)throw new Error(t('auth.loginRequired'));
 const res=await fetch(apiBase()+path,{method,cache:'no-store',headers:{authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const json=await res.json().catch(()=>({}));if(!res.ok)throw new Error(json.error||t('auth.noAccess'));return json;
}


// Канонічні ролі (для демо і селектів у “Видимість”)
const DEFAULT_ROLES = [
  { key: 'owner', name:'owner',perms:['admin.view','admin.users.manage'] },
  { key: 'admin', name:'admin',perms:['admin.view','admin.users.manage'] },
  { key: 'manager', name:'manager',perms:['orders.write','catalog.write'] },
  { key: 'viewer', name:'viewer',perms:[] },
];

// Ключ для localStorage (матриця видимості)
const LS_VIS_MATRIX = 'st_visibility_matrix';

/* ============================ УТИЛІТИ ==================================== */

function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[c]));
}

/* ============================ ТАБИ ======================================= */

function setupTabs(root){
  const tabs   = Array.from(root.querySelectorAll('.admin-tab-btn'));
  const panels = Array.from(root.querySelectorAll('section[data-admin-panel]'));

  const showPanel = (id) => {
    panels.forEach(sec => sec.classList.toggle('hidden', sec.getAttribute('data-admin-panel') !== id));
    tabs.forEach(btn => btn.classList.toggle('is-active', btn.dataset.adminTab === id));
  };

  // дефолт — users
  showPanel('users');

  root.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.admin-tab-btn');
    if (!tabBtn) return;
    e.preventDefault();
    const id = tabBtn.dataset.adminTab;
    if (id) showPanel(id);
  });
}

/* ====================== LIVE USERS (Google Sheets via GAS) =============== */

async function apiListUsers(){
  try{const data=await protectedAdmin01581('/admin/members');return {success:true,users:(data.members||[]).map(row=>({no:row.id,name:row.name||'',email:row.email||'',role:row.role||'viewer',status:row.status||'',phone:'',login:'',comment:row.workspaceName||row.storeName||''}))};}
  catch(err){return {success:false,error:String(err?.message||err)};}
}
async function apiUpdateRole(id,role){
  try{const result=await protectedAdmin01581('/admin/members/'+encodeURIComponent(id),'PATCH',{role});return {success:true,user:result.member};}
  catch(err){return {success:false,error:String(err?.message||err)};}
}

async function loadUsersIntoTable(tbody){
  const json = await apiListUsers();
  if (!json?.success || !Array.isArray(json.users)) {
    console.warn('list-users response:', json);
    tbody.innerHTML = `<tr><td colspan="8" class="text-white/70">Не вдалося завантажити користувачів</td></tr>`;
    return;
  }
  tbody.innerHTML = json.users.map(u => {
    const fio  = [u.surname, u.name].filter(Boolean).join(' ');
    const role = String(u.role || '').toLowerCase() || 'user';
    return `
      <tr data-id="${escapeHtml(String(u.no||''))}" data-role="${escapeHtml(role)}">
        <td class="py-2 pe-4">${escapeHtml(String(u.no||''))}</td>
        <td class="py-2 pe-4">${escapeHtml(fio || '—')}</td>
        <td class="py-2 pe-4">${escapeHtml(String(u.phone||''))}</td>
        <td class="py-2 pe-4">${escapeHtml(String(u.email||''))}</td>
        <td class="py-2 pe-4">${escapeHtml(String(u.login||''))}</td>
        <td class="py-2 pe-4">
          <select class="role-select input sm" style="width:auto">
            ${['owner','admin','manager','editor','viewer','catalog-manager','order-manager'].map(r => `<option value="${r}" ${r===role?'selected':''}>${r}</option>`).join('')}
          </select>
        </td>
        <td class="py-2 pe-4">${escapeHtml(String(u.comment||''))}</td>
        <td class="py-2 pe-0 text-right">
          <button class="btn btn-ghost sm btn-change-role">Змінити роль</button>
        </td>
      </tr>
    `;
  }).join('');
}

function setupUsersTab(root){
  const liveBlock = root.querySelector('#usersLiveBlock');
  const liveTbody = root.querySelector('#users-live-tbody');
  const toggleBtn = root.querySelector('#btnToggleUsersLive');
  const filterSel = root.querySelector('#usersRoleFilter');

  // Toggle + lazy load
  root.addEventListener('click', async (e) => {
    if (!e.target.closest('#btnToggleUsersLive')) return;
    if (!liveBlock) return;

    const willHide = !liveBlock.classList.contains('hidden');
    liveBlock.classList.toggle('hidden', willHide);
    if (toggleBtn) toggleBtn.textContent = willHide ? 'Показати користувачів' : 'Приховати користувачів';

    if (!willHide && !liveBlock.dataset.loaded) {
      await loadUsersIntoTable(liveTbody);
      liveBlock.dataset.loaded = '1';
    }
  });

  // Зміна ролі
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-change-role');
    if (!btn) return;

    const tr   = btn.closest('tr[data-id]');
    const id   = tr?.dataset.id;
    const sel  = tr?.querySelector('.role-select');
    const role = sel?.value;
    if (!id || !role) return;

    btn.disabled = true; btn.textContent = 'Зберігаю...';
    const r = await apiUpdateRole(id, role);
    btn.disabled = false; btn.textContent = 'Змінити роль';
    if (!r?.success) {
      alert(r?.error || 'Помилка оновлення ролі');
      return;
    }
    tr.dataset.role = String(role).toLowerCase();
  });

  // Фільтр
  filterSel?.addEventListener('change', () => {
    const val = String(filterSel.value || '').toLowerCase();
    root.querySelectorAll('#users-live-tbody tr').forEach(tr => {
      const r = String(tr.dataset.role || '').toLowerCase();
      tr.classList.toggle('hidden', !!val && r !== val);
    });
  });
}

/* ============================ РОЛІ (демо) ================================ */

async function renderRolesList(container){
  try{
    const response=await protectedAdmin01581('/admin/roles');
    container.innerHTML=(response.roles||[]).map(row=>{
      const key=String(row.role||'');
      const perms=Array.isArray(row.capabilities)?row.capabilities:[];
      return `<div class="item"><div class="item-col"><div class="item-title">${escapeHtml(key)}</div></div><div class="item-actions row gap"><span class="input sm" style="width:auto">${escapeHtml(perms.join(', ')||'—')}</span></div></div>`;
    }).join('');
  }catch(e){container.textContent=String(e?.message||t('auth.noAccess'));}
}
function setupRolesTab(root){
  const box = root.querySelector('#admin-roles-container');
  if (box) renderRolesList(box);

  root.addEventListener('click', (e) => {
    if (!e.target.closest('#btnCreateRole')) return;
    e.preventDefault();
    alert('Створення кастомних ролей — у наступній ітерації. Зараз використовується DEMO-набір.');
  });
}

/* ============================ ВИДИМІСТЬ =================================== */

function fillRoleSelects(root){
  const options = DEFAULT_ROLES.map(r => `<option value="${r.key}">${r.name}</option>`).join('');
  root.querySelectorAll('.admin-role-select').forEach(sel => { sel.innerHTML = options; });
}

function readVisibilityMatrix(){
  try { return JSON.parse(localStorage.getItem(LS_VIS_MATRIX) || '{}'); }
  catch { return {}; }
}
function writeVisibilityMatrix(m){ localStorage.setItem(LS_VIS_MATRIX, JSON.stringify(m || {})); }

function setupVisibilityTab(root){
  fillRoleSelects(root);

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-toggle-visibility');
    if (!btn) return;

    const wrap = btn.closest('.item, .flex, div');
    const sel  = wrap?.querySelector('.admin-role-select');
    const role = sel?.value || 'user';
    const key  = btn.getAttribute('data-key');
    if (!key) return;

    const matrix = readVisibilityMatrix();
    matrix[key] = matrix[key] || {};
    matrix[key][role] = !matrix[key][role];
    writeVisibilityMatrix(matrix);

    // простий візуальний фідбек
    btn.classList.toggle('btn-primary');
  });
}

/* ============================ THEME UI ==================================== */
/** УНІВЕРСАЛЬНИЙ динамічний імпорт theme.js:
 *  - шлях рахується ВІДНОСНО цього файлу (admin.js), тому працює і локально, і на Netlify
 *  - для локалки додаємо cache-bust ?ts=...
 */
function tryInitThemeUI() {
  if (window.__themeUI_INITIALIZED__) return;
  try {
    const url = new URL('./theme.js', import.meta.url);
    const isLocal = location.hostname === 'localhost' || location.hostname.startsWith('127.');
    if (isLocal) url.searchParams.set('ts', Date.now());

    import(url.href)
      .then(m => {
        if (typeof m.initThemeUI === 'function') {
          m.initThemeUI();
          window.__themeUI_INITIALIZED__ = true;
        } else {
          console.warn('[Theme] initThemeUI() не знайдено в theme.js');
        }
      })
      .catch(err => console.error('[Theme] import failed:', err));
  } catch (err) {
    console.error('[Theme] import error:', err);
  }
}

/* ============================ INIT ENTRY ================================== */

export function initAdminPage(){
  const root = document.getElementById('admin-root');
  if (!root) return;
  const scope=getCrmAuthScope01581();
  if(!['owner','admin'].includes(String(scope?.role||''))){
    root.querySelectorAll('.admin-tab-btn').forEach(el=>{el.disabled=true;});
    root.querySelectorAll('section[data-admin-panel]').forEach(el=>el.classList.add('hidden'));
    const target=root.querySelector('#admin-users-container')||root;
    let note=document.getElementById('crmAdminAccessNotice01581');
    if(!note){note=document.createElement('p');note.id='crmAdminAccessNotice01581';target.prepend(note);}
    note.textContent=t('auth.loginRequired');return;
  }
  if(root.dataset.ssoAdminInitialized01581)return;
  root.dataset.ssoAdminInitialized01581='1';
  root.querySelectorAll('.admin-tab-btn').forEach(el=>{el.disabled=false;});
  document.getElementById('crmAdminAccessNotice01581')?.remove();

  setupTabs(root);
  setupUsersTab(root);
  setupRolesTab(root);
  setupVisibilityTab(root);

  // ініціалізація Theme UI після монту сторінки
  tryInitThemeUI();

  // показати таб Users як активний
  root.querySelector('.admin-tab-btn[data-admin-tab="users"]')?.classList.add('is-active');
}

/* ============================ ЕКСПОРТ ЗАМОВЧУВАННЯ ======================= */

window.addEventListener('st:crm-auth-changed-01581',()=>{
  const root=document.getElementById('admin-root');
  if(!root)return;
  if(!getCrmAuthScope01581())delete root.dataset.ssoAdminInitialized01581;
  initAdminPage();
});

export default { initAdminPage };
