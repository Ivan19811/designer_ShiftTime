// backend/src/server.js
// === designer_ShiftTime API (Render) ===
// Node 18+ (є global fetch)

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ===== ENV =====
const PORT = process.env.PORT || 8080;

// URL твого опублікованого GAS Web App.
// ПІДСТАВЛЯЄМО ПОВНИЙ РОБОЧИЙ URL (наприклад, googleusercontent .../macros/echo?...&lib=...)
// БЕЗ ?res=... наприкінці — параметри додаємо тут.
const SHEETS_WEBAPP_URL = (process.env.SHEETS_WEBAPP_URL || "").trim();

// CORS
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "").trim(); // "*" або порожньо
const ALLOWLIST = String(process.env.CORS_ALLOWLIST || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ===== APP =====
const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// --- CORS: або * або конкретні домени ---
const corsOptions = {
  origin: (origin, cb) => {
    if (CORS_ORIGIN === "*") return cb(null, true);
    if (!origin) return cb(null, true); // дозволимо curl/Postman
    if (ALLOWLIST.length === 0) return cb(null, false);
    const ok = ALLOWLIST.some((a) => origin === a);
    cb(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));

// --- Базовий throttling на всі /api/* ---
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ===== ХЕЛПЕРИ =====
function buildGASUrl(pathQuery) {
  // pathQuery може бути рядок типу "?res=designer&mode=list" або об'єкт {res:"designer",mode:"list"}
  if (!SHEETS_WEBAPP_URL) return "";
  const base = SHEETS_WEBAPP_URL; // може вже містити "?"
  const query =
    typeof pathQuery === "string"
      ? pathQuery.replace(/^\?/, "")
      : new URLSearchParams(pathQuery || {}).toString();
  const sep = base.includes("?") ? "&" : "?";
  return query ? `${base}${sep}${query}` : base;
}

async function forwardToGAS({ pathQuery, method = "GET", bodyObj = null }) {
  if (!SHEETS_WEBAPP_URL) {
    return { status: 500, body: { error: "SHEETS_WEBAPP_URL is not set" } };
  }
  const url = buildGASUrl(pathQuery);
  const init = { method, headers: { "User-Agent": "designer_ShiftTime/1.0" } };
  if (bodyObj != null) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(bodyObj);
  }
  const r = await fetch(url, init);
  const text = await r.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: r.status, body: data };
}

// ===== ENDPOINTS =====

// Root ping
app.get("/", (req, res) => {
  res.json({ ok: true, service: "designer_ShiftTime_api" });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "designer_ShiftTime_api",
    time: new Date().toISOString(),
    hasSheetsUrl: Boolean(SHEETS_WEBAPP_URL),
  });
});

// --- TEMPLATES (тимчасово статично) ---
app.get("/api/templates", (req, res) => {
  res.json([
    {
      id: "shop-demo",
      name: "Магазин — демо",
      features: ["Каталог", "Кошик", "Checkout"],
    },
    {
      id: "landing-clean",
      name: "Лендінг — чистий",
      features: ["Секції", "Форми", "Галерея"],
    },
    { id: "empty", name: "Порожній шаблон", features: [] },
  ]);
});

// --- KV (конфіг через GAS res=kv) ---
app.get("/api/kv", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({ pathQuery: { res: "kv", mode: "list" } });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/kv", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({
      pathQuery: { res: "kv", mode: "upsert" },
      method: "POST",
      bodyObj: req.body || {},
    });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- PROJECTS (через GAS res=designer) ---
// GET /api/projects → список проєктів
app.get("/api/projects", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({
      pathQuery: { res: "designer", mode: "list" },
    });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/projects → створення проєкту
// body: { name, templateId, domain?, createdBy? }
app.post("/api/projects", async (req, res) => {
  try {
    const payload = req.body || {};
    const { status, body } = await forwardToGAS({
      pathQuery: { res: "designer", mode: "create" },
      method: "POST",
      bodyObj: payload,
    });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Unknown API route guard
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "Unknown API route" });
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`designer_ShiftTime_api running on :${PORT}`);
});
