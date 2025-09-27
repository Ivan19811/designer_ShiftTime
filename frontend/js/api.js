const $ = (s) => document.querySelector(s);
const outStatus = $("#outStatus");
const outCreate = $("#outCreate");
const outList   = $("#outList");
const selTpl    = $("#prjTpl");

async function call(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers||{}) } });
  const text = await r.text();
  try { return { status: r.status, data: JSON.parse(text) }; }
  catch { return { status: r.status, data: text }; }
}

// ---- Статус / KV / Templates ----
$("#btnHealth").onclick = async () => {
  outStatus.textContent = "Запит /api/health ...";
  const res = await call("/api/health");
  outStatus.textContent = JSON.stringify(res, null, 2);
};

$("#btnKV").onclick = async () => {
  outStatus.textContent = "Запит /api/kv ...";
  const res = await call("/api/kv");
  outStatus.textContent = JSON.stringify(res, null, 2);
};

$("#btnTpl").onclick = async () => {
  outStatus.textContent = "Запит /api/templates ...";
  const res = await call("/api/templates");
  outStatus.textContent = JSON.stringify(res, null, 2);
};

// ---- Шаблони в селект ----
async function loadTemplates() {
  const res = await call("/api/templates");
  const list = Array.isArray(res.data) ? res.data : [];
  selTpl.innerHTML = "";
  for (const t of list) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.name} (${t.features?.length || 0})`;
    selTpl.appendChild(opt);
  }
}
loadTemplates();

// ---- Створити проект ----
$("#btnCreate").onclick = async () => {
  const name   = $("#prjName").value.trim();
  const tpl    = $("#prjTpl").value;
  const domain = $("#prjDomain").value.trim();

  if (!name) {
    outCreate.textContent = "Вкажи назву проекту";
    return;
  }

  outCreate.textContent = "Створюю...";
  const res = await call("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name, templateId: tpl, domain, createdBy: "admin" })
  });
  outCreate.textContent = JSON.stringify(res, null, 2);
  // після створення — оновимо список
  await listProjects();
};

// ---- Список проектів ----
async function listProjects() {
  outList.textContent = "Завантажую...";
  const res = await call("/api/projects");
  outList.textContent = JSON.stringify(res, null, 2);
}
$("#btnList").onclick = listProjects;
// автозавантаження
listProjects();
