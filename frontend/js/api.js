// Мінімальний клієнт до нашого бекенда (через Netlify-проксі /api/*)

const $ = (s) => document.querySelector(s);
const out = $("#out");

async function call(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers||{}) } });
  const text = await r.text();
  try { return { status: r.status, data: JSON.parse(text) }; }
  catch { return { status: r.status, data: text }; }
}

$("#btnHealth").onclick = async () => {
  out.textContent = "Запит /api/health ...";
  const res = await call("/api/health");
  out.textContent = JSON.stringify(res, null, 2);
};

$("#btnKV").onclick = async () => {
  out.textContent = "Запит /api/kv ...";
  const res = await call("/api/kv");
  out.textContent = JSON.stringify(res, null, 2);
};

$("#btnTpl").onclick = async () => {
  out.textContent = "Запит /api/templates ...";
  const res = await call("/api/templates");
  out.textContent = JSON.stringify(res, null, 2);
};
