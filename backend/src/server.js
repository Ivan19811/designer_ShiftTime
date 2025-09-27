// backend/src/server.js
// === designer_ShiftTime API (Render) ===
// Node 18+ (є global fetch). Без зовнішніх залежностей для fetch.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ===== ENV =====
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

// --- CORS: або * або конкретні домени ---
const corsOptions = {
  origin: (origin, cb) => {
    if (CORS_ORIGIN === "*") return cb(null, true);
    if (!origin) return cb(null, true); // дозволимо curl/Postman
    if (ALLOWLIST.length === 0) return cb(null, false);
    const ok = ALLOWLIST.some(a => origin === a);
    cb(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));

// --- Базовий throttling на всі /api/* ---
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ===== ХЕЛПЕР: безпечно форвардимо до GAS =====
async function forwardToGAS({ pathQuery, method = "GET", bodyObj = null }) {
  if (!SHEETS_WEBAPP_URL) {
    return { status: 500, body: { error: "SHEETS_WEBAPP_URL is not set" } };
  }
  const url = `${SHEETS_WEBAPP_URL}${pathQuery}`;
  const init = { method };
  if (bodyObj != null) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(bodyObj);
  }
  const r = await fetch(url, init);
  const text = await r.text();
  // GAS може повертати і текст, і JSON — пробуємо розпарсити
  let data = text;
  try { data = JSON.parse(text); } catch {}
  return { status: r.status, body: data };
}

// ===== ENDPOINTS =====

// Ping
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "designer_ShiftTime_api",
    time: new Date().toISOString(),
    hasSheetsUrl: Boolean(SHEETS_WEBAPP_URL)
  });
});

// --- KV (конфіг) ---
app.get("/api/kv", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({ pathQuery: "?res=kv&mode=list" });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/kv", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({
      pathQuery: "?res=kv&mode=upsert",
      method: "POST",
      bodyObj: req.body || {}
    });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- PROJECTS для Конструктора (через GAS res=designer) ---
// GET /api/projects → список проєктів
app.get("/api/projects", async (req, res) => {
  try {
    const { status, body } = await forwardToGAS({ pathQuery: "?res=designer&mode=list" });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/projects → створення проєкту
// Очікуємо у body: { name, templateId, domain?, createdBy? }
app.post("/api/projects", async (req, res) => {
  try {
    const payload = req.body || {};
    const { status, body } = await forwardToGAS({
      pathQuery: "?res=designer&mode=create",
      method: "POST",
      bodyObj: payload
    });
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// (За потреби додамо /api/publish, /api/templates: зараз шаблони можна тимчасово тримати тут статично)

// ===== START =====
app.listen(PORT, () => {
  console.log(`designer_ShiftTime_api running on :${PORT}`);
});
