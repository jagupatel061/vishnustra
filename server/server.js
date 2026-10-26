/* =====================================================================
   VISHNUSTRA — backend server
   Run:  npm start        (or: node server/server.js)
   Uses only Node.js built-in modules, so no "npm install" is needed.

   It does four jobs:
   1. Serves the website (index.html, portal.html, room.html …)
   2. Runs on HTTP for the laptop  → http://localhost:3000
      and HTTPS for phones         → https://<laptop-wifi-ip>:3443
      (phone cameras only work on https)
   3. Provides the API in /api/... and stores data in server/data/db.json
   4. Pushes live updates (Server-Sent Events) to the QR room and admin page
   ===================================================================== */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { URL } = require("url");

const ROOT = path.join(__dirname, "..");
loadEnv(path.join(ROOT, ".env"));

const db = require("./db");
const Astro = require("../js/astro.js");
const QR = require("../js/qr.js");
const { NAKSHATRAS, VISHNU_PURANA } = require("../data/nakshatras.js");

const PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const ASTROMETRY_KEY = process.env.ASTROMETRY_API_KEY || "";

/* ---------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------- */
function loadEnv(file) {               // reads KEY=value lines from .env (if it exists)
  try {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

function lanAddress() {                // the laptop's address on the Wi-Fi / hotspot
  const list = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family !== "IPv4" || a.internal) continue;
      const score = /^192\.168\./.test(a.address) ? 3 : /^172\.(1[6-9]|2\d|3[01])\./.test(a.address) ? 2 : /^10\./.test(a.address) ? 1 : 0;
      const virtual = /vmware|virtualbox|vethernet|docker|wsl|loopback|bluetooth/i.test(name) ? -5 : 0;
      list.push({ address: a.address, score: score + virtual });
    }
  }
  list.sort((a, b) => b.score - a.score);
  return list.length ? list[0].address : "127.0.0.1";
}

/* If the site is reached through a public domain (e.g. vishnustra.onrender.com),
   return that https address so the QR code works from any network. */
function publicUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const name = host.replace(/:\d+$/, "");
  const local = !name || name === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(name) || name.endsWith(".local");
  if (local) return null;
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  return `${proto}://${host}`;
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req, limit = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("Body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

const clean = (s, n = 40) => String(s ?? "").replace(/[<>]/g, "").trim().slice(0, n);
const roomCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

function starFor(date, slot, time) {
  const t = slot === "exact" ? (time || "12:00") : (slot || "");
  const r = Astro.findStar(date, t);
  const n = NAKSHATRAS[r.primary.nakshatraIndex];
  return { starId: n.id, star: n.en, sa: n.sa, pada: r.primary.pada, exact: r.exact,
           alternatives: r.alternatives.map((a) => NAKSHATRAS[a.nakshatraIndex].en).filter((x) => x !== n.en) };
}

/* ---------------------------------------------------------------
   Live updates (Server-Sent Events)
   --------------------------------------------------------------- */
const streams = { rooms: new Map(), admin: new Set() };

function openStream(req, res) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
  res.write("retry: 3000\n\n");
  const ping = setInterval(() => res.write(": ping\n\n"), 20000);
  req.on("close", () => clearInterval(ping));
}
function push(res, event, data) { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
function broadcastRoom(code, event, data) { for (const res of streams.rooms.get(code) || []) push(res, event, data); }
function broadcastAdmin(collection, row) { for (const res of streams.admin) push(res, "change", { collection, row }); }

/* ---------------------------------------------------------------
   API routes
   --------------------------------------------------------------- */
async function api(req, res, url) {
  const p = url.pathname, m = req.method;

  // --- server info: used by the room page to build the QR link ---
  if (p === "/api/info" && m === "GET") {
    const ip = lanAddress();
    return send(res, 200, {
      server: true, lanIp: ip,
      // Hosted online (Render etc.): phones use the public https address.
      // On a laptop: phones use the laptop's Wi-Fi address.
      phoneUrl: publicUrl(req) || (hasCerts ? `https://${ip}:${HTTPS_PORT}` : `http://${ip}:${PORT}`),
      laptopUrl: `http://localhost:${PORT}`, https: hasCerts, ai: !!GEMINI_KEY, snap: !!ASTROMETRY_KEY,
      counts: Object.fromEntries(Object.entries(db.snapshot()).map(([k, v]) => [k, v.length])),
    });
  }

  // --- QR code as SVG (made on the server, works offline) ---
  if (p === "/api/qr" && m === "GET") {
    const text = url.searchParams.get("text") || "";
    if (!text || text.length > 200) return send(res, 400, { error: "text required (max 200 chars)" });
    return send(res, 200, QR.svg(text, { dark: "#0a0a0b", light: "#f6f1e4", border: 2 }), "image/svg+xml");
  }

  // --- calculate a birth star on the server ---
  if (p === "/api/star" && m === "GET") {
    const date = url.searchParams.get("date");
    if (!isDate(date)) return send(res, 400, { error: "date must be YYYY-MM-DD" });
    return send(res, 200, starFor(date, url.searchParams.get("slot"), url.searchParams.get("time")));
  }

  // --- "Find your birth star" searches ---
  if (p === "/api/lookups" && m === "POST") {
    const b = await readBody(req);
    if (!isDate(b.date)) return send(res, 400, { error: "date must be YYYY-MM-DD" });
    const row = db.insert("lookups", { date: b.date, slot: clean(b.slot, 10), ...starFor(b.date, b.slot, b.time), page: clean(b.page, 20) });
    broadcastAdmin("lookups", row);
    return send(res, 201, row);
  }

  // --- poll: did you already know your star? ---
  if (p === "/api/poll" && m === "POST") {
    const b = await readBody(req);
    if (typeof b.knew !== "boolean") return send(res, 400, { error: "knew must be true or false" });
    const row = db.insert("poll", { knew: b.knew, starId: Number(b.starId) || null });
    broadcastAdmin("poll", row);
  }
  if (p === "/api/poll") {
    const all = db.all("poll"), yes = all.filter((r) => r.knew).length;
    return send(res, 200, { total: all.length, yes, no: all.length - yes, percentYes: all.length ? Math.round((yes / all.length) * 100) : 0 });
  }

  // --- QR rooms ---
  let mm = p.match(/^\/api\/rooms\/([A-Za-z0-9]{1,6})\/(guests|stream)$/);
  if (mm) {
    const code = roomCode(mm[1]);
    if (mm[2] === "stream" && m === "GET") {
      openStream(req, res);
      if (!streams.rooms.has(code)) streams.rooms.set(code, new Set());
      streams.rooms.get(code).add(res);
      for (const g of db.where("guests", (r) => r.room === code)) push(res, "guest", g);
      req.on("close", () => streams.rooms.get(code)?.delete(res));
      return;
    }
    if (mm[2] === "guests" && m === "GET") return send(res, 200, db.where("guests", (r) => r.room === code));
    if (mm[2] === "guests" && m === "POST") {
      const b = await readBody(req);
      const name = clean(b.name, 24) || "Guest";
      let star;
      if (isDate(b.date)) star = starFor(b.date, b.slot, b.time);          // the server calculates the star itself
      else if (b.starId >= 1 && b.starId <= 27) { const n = NAKSHATRAS[b.starId - 1]; star = { starId: n.id, star: n.en, sa: n.sa }; }
      else return send(res, 400, { error: "date (YYYY-MM-DD) or starId required" });
      const ua = String(req.headers["user-agent"] || "");
      const device = /iphone|ipad/i.test(ua) ? "iPhone" : /android/i.test(ua) ? "Android" : /mobile/i.test(ua) ? "Phone" : "Laptop";
      const row = db.insert("guests", { room: code, name, date: isDate(b.date) ? b.date : null, slot: clean(b.slot, 10) || null, ...star, device });
      broadcastRoom(code, "guest", row); broadcastAdmin("guests", row);
      return send(res, 201, row);
    }
  }
  mm = p.match(/^\/api\/rooms\/([A-Za-z0-9]{1,6})$/);
  if (mm && m === "DELETE") {
    const code = roomCode(mm[1]);
    const n = db.remove("guests", (r) => r.room === code);
    broadcastRoom(code, "cleared", {}); broadcastAdmin("guests", null);
    return send(res, 200, { removed: n });
  }

  // --- Rishi AI: log every question; answer with Gemini if a key is set ---
  if (p === "/api/rishi" && m === "POST") {
    const b = await readBody(req);
    if (b.ping) return send(res, 200, { ai: !!GEMINI_KEY });
    const question = clean(b.question, 500);
    if (!question) return send(res, 400, { error: "question required" });
    let answer = "", source = "offline";
    if (GEMINI_KEY && !b.logOnly) {
      try { answer = await gemini(question, Array.isArray(b.history) ? b.history.slice(-6) : []); source = "gemini"; } catch (e) { source = "offline (Gemini failed)"; }
    }
    const row = db.insert("questions", { question, source: b.logOnly ? "offline" : source });
    broadcastAdmin("questions", row);
    return send(res, 200, { ai: !!answer, answer });
  }

  // --- certificates from The Lost Observatory ---
  if (p === "/api/certificates" && m === "POST") {
    const b = await readBody(req);
    const row = db.insert("certificates", { name: clean(b.name, 28) || "Sky-watcher", minutes: Math.max(0, Math.min(999, Number(b.minutes) || 0)) });
    broadcastAdmin("certificates", row);
    return send(res, 201, row);
  }

  // --- Snap the Real Sky: proxy to astrometry.net ---
  if (p === "/api/snap") return snap(req, res, url);

  // --- admin: everything in the database, plus a live stream ---
  if (p === "/api/admin/data" && m === "GET") return send(res, 200, { file: path.relative(ROOT, db.FILE), ...db.snapshot() });
  if (p === "/api/admin/stream" && m === "GET") {
    openStream(req, res); streams.admin.add(res);
    req.on("close", () => streams.admin.delete(res));
    return;
  }
  if (p === "/api/admin/reset" && m === "POST") {
    db.reset(); broadcastAdmin("all", null);
    for (const [code] of streams.rooms) broadcastRoom(code, "cleared", {});
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: "No such API route" });
}

/* ---------------------------------------------------------------
   Gemini (Rishi AI) — answers only from Vishnustra's research
   --------------------------------------------------------------- */
const RISHI_CONTEXT = [
  ...NAKSHATRAS.map((n) => `${n.id}. ${n.en} (${n.sa}) — deity: ${n.deity}; symbol: ${n.symbol}; main star: ${n.western}; tree: ${n.tree}; name sounds: ${n.syllables.join(", ")}; Vishnu Sahasranama verse ${n.shloka.verse}: ${n.shloka.text.replace(/\n/g, " ")} — meaning: ${n.shloka.meaning}`),
  ...VISHNU_PURANA.map((v) => `Vishnu Purana — ${v.title} (${v.where}): ${v.text}`),
  "Each nakshatra spans 13°20′ with 4 padas; 108 padas match the 108 main verses of the Vishnu Sahasranama (Mahabharata) by tradition: star N pada P = verse 4(N−1)+P. The Moon circles the sky in about 27.3 days. Vishnustra uses the Lahiri ayanamsa.",
].join("\n");
const RISHI_SYSTEM = `You are "the Rishi", a warm guide on Vishnustra, a student website about the 27 nakshatras. Answer ONLY from the context. If it isn't there, say so and suggest a related question. Never invent Sanskrit. This is cultural astronomy, not prediction: never forecast anyone's future. Keep answers to 2–5 simple sentences; use **bold** for star names.\n\nCONTEXT:\n${RISHI_CONTEXT}`;

async function gemini(question, history) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: RISHI_SYSTEM }] },
      contents: [...history.map((h) => ({ role: h.role === "model" ? "model" : "user", parts: [{ text: String(h.text).slice(0, 800) }] })), { role: "user", parts: [{ text: question }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
    }),
  });
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") || "";
  if (!text) throw new Error(j?.error?.message || "empty answer");
  return text;
}

/* ---------------------------------------------------------------
   Snap the Real Sky — astrometry.net
   --------------------------------------------------------------- */
const ASTRO_API = "https://nova.astrometry.net/api";
async function snap(req, res, url) {
  try {
    if (req.method === "POST") {
      const b = await readBody(req);
      if (b.ping) return send(res, 200, { ready: !!ASTROMETRY_KEY });
      if (!ASTROMETRY_KEY) return send(res, 200, { error: "ASTROMETRY_API_KEY is not set in .env" });
      const mt = String(b.image || "").match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!mt) return send(res, 400, { error: "Send the photo as a data URL" });
      const login = await (await fetch(`${ASTRO_API}/login`, { method: "POST", body: new URLSearchParams({ "request-json": JSON.stringify({ apikey: ASTROMETRY_KEY }) }) })).json();
      if (login.status !== "success") return send(res, 502, { error: "astrometry.net login failed" });
      const form = new FormData();
      form.append("request-json", JSON.stringify({ session: login.session, publicly_visible: "n", allow_commercial_use: "n", allow_modifications: "n" }));
      form.append("file", new Blob([Buffer.from(mt[2], "base64")], { type: mt[1] }), "sky.jpg");
      const up = await (await fetch(`${ASTRO_API}/upload`, { method: "POST", body: form })).json();
      if (up.status !== "success") return send(res, 502, { error: "Upload to astrometry.net failed" });
      return send(res, 200, { subid: up.subid });
    }
    const subid = url.searchParams.get("subid");
    if (!subid) return send(res, 400, { error: "subid missing" });
    const sub = await (await fetch(`${ASTRO_API}/submissions/${encodeURIComponent(subid)}`)).json();
    const job = (sub.jobs || []).find((x) => x);
    if (!job) return send(res, 200, { status: "solving" });
    const js = await (await fetch(`${ASTRO_API}/jobs/${job}`)).json();
    if (js.status === "failure") return send(res, 200, { status: "failure" });
    if (js.status !== "success") return send(res, 200, { status: "solving" });
    const calibration = await (await fetch(`${ASTRO_API}/jobs/${job}/calibration/`)).json();
    const ann = await (await fetch(`${ASTRO_API}/jobs/${job}/annotations/`)).json();
    return send(res, 200, { status: "success", calibration, annotations: ann.annotations || [] });
  } catch (e) {
    return send(res, 502, { error: e.message || "Star matcher error" });
  }
}

/* ---------------------------------------------------------------
   Static files (the website itself)
   --------------------------------------------------------------- */
const BLOCKED = /^\/(server|node_modules|\.env|\.git)(\/|$)/i;
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  if (BLOCKED.test(p)) return send(res, 403, "Not available", "text/plain");
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) return send(res, 403, "Not available", "text/plain");
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "Not found", "text/plain");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------------------------------------------------------------
   Start HTTP + HTTPS
   --------------------------------------------------------------- */
async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 400, { error: e.message || "Bad request" });
  }
}

const certDir = path.join(__dirname, "certs");
const hasCerts = fs.existsSync(path.join(certDir, "key.pem")) && fs.existsSync(path.join(certDir, "cert.pem"));

http.createServer(handler).listen(PORT, "0.0.0.0", () => {
  const ip = lanAddress();
  const line = "─".repeat(58);
  console.log(`\n${line}\n  VISHNUSTRA server is running\n${line}`);
  console.log(`  Laptop (open this):   http://localhost:${PORT}`);
  console.log(`  QR Room:              http://localhost:${PORT}/room.html`);
  console.log(`  Backend data page:    http://localhost:${PORT}/admin.html`);
  if (hasCerts) console.log(`  Phones (same Wi-Fi):  https://${ip}:${HTTPS_PORT}`);
  else console.log(`  Phones (same Wi-Fi):  http://${ip}:${PORT}   (no HTTPS certificate found: phone camera won't work)`);
  console.log(`  Database file:        ${path.relative(ROOT, db.FILE)}`);
  console.log(`  Rishi AI:             ${GEMINI_KEY ? "Gemini (key found)" : "offline answers (add GEMINI_API_KEY to .env for Gemini)"}`);
  console.log(`  Snap the Sky:         ${ASTROMETRY_KEY ? "astrometry.net (key found)" : "sample mode (add ASTROMETRY_API_KEY to .env)"}`);
  console.log(`${line}\n  Press Ctrl + C to stop.\n`);
});

if (hasCerts) {
  https.createServer({ key: fs.readFileSync(path.join(certDir, "key.pem")), cert: fs.readFileSync(path.join(certDir, "cert.pem")) }, handler)
    .listen(HTTPS_PORT, "0.0.0.0");
}
