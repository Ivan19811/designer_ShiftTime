// backend/src/server.js
// === designer_ShiftTime API (Render) ===
// Node 18+ (є global fetch).

import JSZip from "jszip"; // для ZIP-деплою
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ===== ENV =====
const NETLIFY_TOKEN = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
const NETLIFY_TEAM_SLUG = (process.env.NETLIFY_TEAM_SLUG || "").trim(); // опційно


const PORT = process.env.PORT || 8080;
const SHEETS_WEBAPP_URL = (process.env.SHEETS_WEBAPP_URL || "").trim();
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "").trim();
const ALLOWLIST = String(process.env.CORS_ALLOWLIST || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// ===== APP =====
const app = express();
app.use(helmet());

// --- CORS ---
const corsOptions = {
  origin: (origin, cb) => {
    if (CORS_ORIGIN === "*") return cb(null, true);
    if (!origin) return cb(null, true); // curl/Postman/локально
    if (ALLOWLIST.length === 0) return cb(null, false);
    const ok = ALLOWLIST.some(a => origin === a);
    cb(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ===== ХЕЛПЕРИ: побудова URL до GAS + запит з cache-buster =====
function buildGASUrl(pathQuery) {
  if (!SHEETS_WEBAPP_URL) return "";
  let params = new URLSearchParams();
  if (typeof pathQuery === "string") {
    params = new URLSearchParams(pathQuery.replace(/^\?/, ""));
  } else if (pathQuery && typeof pathQuery === "object") {
    for (const [k, v] of Object.entries(pathQuery)) params.set(k, String(v));
  }
  // вимикаємо кеш GAS
  params.set("_t", Date.now().toString());
  const base = SHEETS_WEBAPP_URL;
  const sep = base.includes("?") ? "&" : "?";
  const query = params.toString();
  return query ? `${base}${sep}${query}` : base;
}

// --- робота з KV напряму через GAS ---
async function kvGet(key) {
  const { status, body } = await forwardToGAS({ pathQuery: { res: "kv", mode: "get", key } });
  if (status === 200 && body && typeof body.value !== "undefined") return body.value;
  return null;
}
async function kvUpsert(items) {
  // items: [{ key, value }]
  return forwardToGAS({
    pathQuery: { res: "kv", mode: "upsert" },
    method: "POST",
    bodyObj: { items }
  });
}

// --- ZIP helper ---
async function zipFromFiles(files) {
  const zip = new JSZip();
  for (const f of files) zip.file(f.path, f.content ?? "");
  return await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// --- Netlify ZIP deploy ---
async function deployZipToNetlify({ zipBuffer, siteId }) {
  if (!NETLIFY_TOKEN) return { status: 500, body: { error: "NETLIFY_AUTH_TOKEN is not set" } };
  if (!siteId) return { status: 400, body: { error: "siteId is required" } };

  const url = `https://api.netlify.com/api/v1/sites/${siteId}/deploys`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}`, "Content-Type": "application/zip" },
    body: zipBuffer
  });
  let data; try { data = await r.json(); } catch { data = await r.text(); }
  return { status: r.status, body: data };
}



async function forwardToGAS({ pathQuery, method = "GET", bodyObj = null }) {
  if (!SHEETS_WEBAPP_URL) {
    return { status: 500, body: { error: "SHEETS_WEBAPP_URL is not set" } };
  }
  const url = buildGASUrl(pathQuery);
  const init = { method, headers: { "Accept": "application/json", "User-Agent": "designer_ShiftTime/1.0" } };
  if (bodyObj != null) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(bodyObj);
  }
  const r = await fetch(url, init);
  const text = await r.text();
  let data = text;
  try { data = JSON.parse(text); } catch {}
  return { status: r.status, body: data };
}

// ===== Генератор файлів шаблону (MVP publish) =====
function buildTemplateFiles(project) {
  const { name = "Мій сайт", domain = "", templateId = "landing-clean" } = project || {};

  if (templateId === "shop-demo") {
    const html = `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${name} — магазин</title><link rel="stylesheet" href="./assets/style.css"/></head>
<body>
<header class="container"><h1>${name}</h1><p class="muted">Домен: ${domain || "—"}</p></header>
<main class="container"><section id="catalog"></section><section id="cart"></section></main>
<script src="./assets/app.js"></script></body></html>`;
    const css = `*{box-sizing:border-box}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;background:#0b0f17;color:#e6e8ec}
.container{max-width:1100px;margin:24px auto;padding:0 16px}
h1{margin:0 0 8px}.muted{opacity:.7}
#catalog,#cart{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;margin:12px 0}`;
    const js = `console.log("Shop demo for:", ${JSON.stringify(name)});`;

    return [
      { path: "index.html", content: html },
      { path: "assets/style.css", content: css },
      { path: "assets/app.js", content: js },
    ];
  }

  // landing-clean за замовчуванням
  const html = `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${name}</title><link rel="stylesheet" href="./assets/style.css"/></head>
<body><main class="hero"><h1>${name}</h1><p>Домен: ${domain || "—"}</p><a class="btn" href="#cta">Почати</a></main>
<script src="./assets/app.js"></script></body></html>`;
  const css = `:root{--brand:#4f46e5}*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#0b0f17;color:#e6e8ec}
.hero{min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px}
h1{font-size:48px;margin:0 0 16px}.btn{display:inline-block;padding:10px 18px;border-radius:999px;background:var(--brand);color:#fff;text-decoration:none}`;
  const js = `console.log("Landing for:", ${JSON.stringify(name)});`;

  return [
    { path: "index.html", content: html },
    { path: "assets/style.css", content: css },
    { path: "assets/app.js", content: js },
  ];
}


// ===== helpers (став вище за ENDPOINTS, якщо раптом винесеш окремо)
function extractProjects(body) {
  // GAS може повертати або чистий масив, або { data: [...] }
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  return null;
}

// ===== ENDPOINTS =====

// Ping
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "designer_ShiftTime_api",
    time: new Date().toISOString(),
    hasSheetsUrl: Boolean(SHEETS_WEBAPP_URL),
  });
});

// Тимчасово статичні шаблони
app.get("/api/templates", (req, res) => {
  res.json([
    { id: "shop-demo",     name: "Магазин — демо",   features: ["Каталог","Кошик","Checkout"] },
    { id: "landing-clean", name: "Лендінг — чистий", features: ["Секції","Форми","Галерея"] },
    { id: "empty",         name: "Порожній шаблон",  features: [] }
  ]);
});

// KV
// KV (нормалізуємо відповідь у масив елементів {key,value})
app.get("/api/kv", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({ pathQuery: { res: "kv", mode: "list" } });

    let normalized = body;

    // якщо GAS повернув { data: [...] } — беремо data
    if (body && Array.isArray(body.data)) {
      normalized = body.data;
    }
    // якщо повернув мапу { "k1": {...}, "k2": {...} } — конвертуємо у [{key,value}]
    else if (body && typeof body === "object" && !Array.isArray(body)) {
      normalized = Object.entries(body).map(([key, value]) => ({ key, value }));
    }

    res.status(status).json(normalized);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});


app.post("/api/kv", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({
      pathQuery: { res: "kv", mode: "upsert" },
      method: "POST",
      bodyObj: req.body || {}
    });
    res.status(status).json(body);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// PROJECTS: list + create
app.get("/api/projects", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({ pathQuery: { res: "designer", mode: "list" } });
    res.status(status).json(body); // лишаємо як є (масив або {data:[...]})
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/projects", async (req, res) => {
  try {
    const payload = req.body || {};
    const { status, body } = await forwardToGAS({
      pathQuery: { res: "designer", mode: "create" },
      method: "POST",
      bodyObj: payload
    });
    res.status(status).json(body);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// === отримати ОДИН проєкт по id (шукаємо локально в списку)
app.get("/api/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, body } = await forwardToGAS({ pathQuery: { res: "designer", mode: "list" } });
    const list = extractProjects(body);
    if (status !== 200 || !list) return res.status(500).json({ error: "Cannot read projects list" });
    const item = list.find(p => Number(p.id) === id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, item });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// === створити Netlify-сайт під проект
// body: { projectId, name? }

app.post("/api/netlify/site", async (req, res) => {
  try {
    if (!NETLIFY_TOKEN) return res.status(500).json({ error: "NETLIFY_AUTH_TOKEN is not set" });

    const { projectId, name } = req.body || {};
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    const siteName = (name || `p-${projectId}-${Math.random().toString(36).slice(2,7)}`).toLowerCase();

    // створюємо завжди через /api/v1/sites
    // якщо NETLIFY_TEAM_SLUG заданий — додаємо його в payload як account_slug
    const payload = NETLIFY_TEAM_SLUG
      ? { name: siteName, account_slug: NETLIFY_TEAM_SLUG }
      : { name: siteName };

    const r = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let data; try { data = await r.json(); } catch { data = await r.text(); }
    if (r.status >= 300) return res.status(r.status).json(data);

    // збережемо мапу в KV, щоб /api/deploy знав, куди заливати
    await kvUpsert([{ key: `site:${projectId}`, value: { siteId: data.id, url: data.ssl_url, name: data.name } }]);

    res.json({ ok: true, siteId: data.id, url: data.ssl_url, name: data.name, admin_url: data.admin_url });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});



// === publish → повернути файли сайту (HTML/CSS/JS)
app.post("/api/publish", async (req, res) => {
  try {
    const id = Number((req.body || {}).id);
    if (!id) return res.status(400).json({ error: "id is required" });

    const { status, body } = await forwardToGAS({ pathQuery: { res: "designer", mode: "list" } });
    const list = extractProjects(body);
    if (status !== 200 || !list) return res.status(500).json({ error: "Cannot read projects list" });
    const project = list.find(p => Number(p.id) === id);
    if (!project) return res.status(404).json({ error: "project not found" });

    const files = buildTemplateFiles(project);
    res.json({ ok: true, files });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// === deploy → зібрати ZIP і залити на Netlify
// body: { id, siteId? }
app.post("/api/deploy", async (req, res) => {
  try {
    const { id, siteId: siteIdInBody } = req.body || {};
    if (!id) return res.status(400).json({ error: "id is required" });

    const { status, body } = await forwardToGAS({ pathQuery: { res: "designer", mode: "list" } });
    const list = extractProjects(body);
    if (status !== 200 || !list) return res.status(500).json({ error: "Cannot read projects list" });

    const project = list.find(p => Number(p.id) === Number(id));
    if (!project) return res.status(404).json({ error: "project not found" });

    const files = buildTemplateFiles(project);
    const zipBuffer = await zipFromFiles(files);

    let destSiteId = siteIdInBody;
    if (!destSiteId) {
      const mapping = await kvGet(`site:${id}`);
      if (mapping && mapping.siteId) destSiteId = mapping.siteId;
    }
    if (!destSiteId) return res.status(400).json({ error: "siteId not linked. First call /api/netlify/site" });

    const out = await deployZipToNetlify({ zipBuffer, siteId: destSiteId });
    res.status(out.status).json(out.body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ===== START (ставимо в самому низу файла, ПІСЛЯ всіх маршрутів)
app.listen(PORT, () => {
  console.log(`designer_ShiftTime_api running on :${PORT}`);
});
