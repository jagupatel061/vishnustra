/* =====================================================================
   mudra.js — Mudra Cosmos
   Sky map: each nakshatra's main star at its real RA/Dec, drawn with a
   stereographic projection (like looking out from the centre of a globe).
   Controls: mouse/touch drag + wheel/pinch, or hand gestures through the
   webcam using Google MediaPipe Hand Landmarker (loaded only on request).
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const D2R = Math.PI / 180;
const cv = $("#mc-canvas"), ctx = cv.getContext("2d");

let view = { ra: 75, dec: 18, zoom: 1 };   // start looking at Taurus–Orion (Krittika, Rohini, Ardra)
let target = { ...view };
let W = 0, H = 0, selected = null, flashDhruva = 0;

function resize() {
  const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize(); addEventListener("resize", resize);

/* ---------- maths: RA/Dec → screen ---------- */
function vec(ra, dec) { const a = ra * D2R, d = dec * D2R; return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; }
function project(ra, dec) {
  let [x, y, z] = vec(ra, dec);
  const a = -view.ra * D2R, d = -view.dec * D2R;
  // rotate around z by -ra, then around y by +dec so the view centre sits on +x
  let x1 = x * Math.cos(a) - y * Math.sin(a), y1 = x * Math.sin(a) + y * Math.cos(a), z1 = z;
  let x2 = x1 * Math.cos(d) - z1 * Math.sin(d), z2 = x1 * Math.sin(d) + z1 * Math.cos(d);
  if (x2 < -0.2) return null;                       // behind us
  const k = 2 / (1 + x2), scale = Math.min(W, H) * 0.42 * view.zoom;
  return [W / 2 - k * y1 * scale, H / 2 - k * z2 * scale, x2];   // minus: sky seen from inside, east to the left
}

/* ---------- background stars (fixed, random on the sphere) ---------- */
const BG = (() => { let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: 1400 }, () => ({ ra: r() * 360, dec: Math.asin(2 * r() - 1) / D2R, m: r(), gold: r() < 0.35 })); })();

/* ---------- drawing ---------- */
function drawStarGlow(x, y, r, strong) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
  g.addColorStop(0, "rgba(255,246,207,1)"); g.addColorStop(0.3, strong ? "rgba(244,197,66,.85)" : "rgba(244,197,66,.5)"); g.addColorStop(1, "rgba(244,165,32,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 6.283); ctx.fill();
}

function draw(t) {
  requestAnimationFrame(draw);
  view.ra += (((target.ra - view.ra + 540) % 360) - 180) * 0.15;
  view.dec += (target.dec - view.dec) * 0.15;
  view.zoom += (target.zoom - view.zoom) * 0.15;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  bg.addColorStop(0, "#0d0c1c"); bg.addColorStop(1, "#040406");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  for (const s of BG) {
    const p = project(s.ra, s.dec); if (!p) continue;
    ctx.globalAlpha = 0.25 + s.m * 0.6;
    ctx.fillStyle = s.gold ? "#f4c542" : "#fff3d0";
    ctx.fillRect(p[0], p[1], s.m > 0.9 ? 1.6 : 1, s.m > 0.9 ? 1.6 : 1);
  }
  ctx.globalAlpha = 1;

  // the Moon's road: dashed line through the 27 main stars, in order
  ctx.setLineDash([3, 6]); ctx.strokeStyle = "rgba(244,197,66,.28)"; ctx.lineWidth = 1;
  ctx.beginPath(); let first = true;
  for (let i = 0; i <= 27; i++) {
    const y = YOGATARA[(i % 27) + 1], p = project(y.ra, y.dec);
    if (!p) { first = true; continue; }
    first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false;
  }
  ctx.stroke(); ctx.setLineDash([]);

  // each nakshatra: its stick figure placed around the main star
  const unit = Math.min(W, H) * 0.0016 * view.zoom;
  hits = [];
  NAKSHATRAS.forEach((n) => {
    const y = YOGATARA[n.id], p = project(y.ra, y.dec); if (!p) return;
    const sh = SHAPES[n.id], b = sh.pts[sh.bright];
    const P = sh.pts.map(([x, yy]) => [p[0] + (x - b[0]) * unit * 2.2, p[1] + (yy - b[1]) * unit * 2.2]);
    const on = selected === n.id;
    if (sh.path !== "none" && P.length > 1) {
      ctx.strokeStyle = on ? "#f4c542" : "rgba(244,197,66,.45)"; ctx.lineWidth = on ? 1.6 : 1;
      ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
      if (sh.path === "closed") ctx.closePath(); ctx.stroke();
    }
    P.forEach((q, i) => {
      if (i === sh.bright) drawStarGlow(q[0], q[1], on ? 4.5 : 3, on);
      ctx.fillStyle = "#fff6dc"; ctx.beginPath(); ctx.arc(q[0], q[1], i === sh.bright ? 2.4 : 1.5, 0, 6.283); ctx.fill();
    });
    ctx.fillStyle = on ? "#f4c542" : "#c9c3b3";
    ctx.font = `${on ? 500 : 400} ${on ? 13 : 11}px Jost, sans-serif`; ctx.textAlign = "center";
    ctx.fillText(n.en, p[0], p[1] + 22);
    hits.push({ id: n.id, x: p[0], y: p[1] });
  });

  // Dhruva
  const d = project(DHRUVA.ra, DHRUVA.dec);
  if (d) {
    drawStarGlow(d[0], d[1], 4 + (flashDhruva > t ? 3 * Math.abs(Math.sin(t / 150)) : 0), true);
    ctx.fillStyle = "#f4c542"; ctx.font = "500 11px Jost, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("DHRUVA · POLE STAR", d[0], d[1] - 16);
    hits.push({ id: 0, x: d[0], y: d[1] });
  }

  // compass text
  ctx.fillStyle = "#6f6b63"; ctx.font = "10px Jost, sans-serif"; ctx.textAlign = "left";
  ctx.fillText(`Looking at RA ${(((view.ra % 360) + 360) % 360).toFixed(0)}°  Dec ${view.dec.toFixed(0)}°  ·  zoom ${view.zoom.toFixed(1)}×`, 14, H - 14);
}
let hits = [];
requestAnimationFrame(draw);

/* ---------- star info ---------- */
function showInfo(id) {
  selected = id;
  if (id === 0) {
    $("#info").innerHTML = `<p class="cap muted" style="margin:0">The fixed star</p><div class="nm">Dhruva</div>
      <p style="margin:8px 0 0;font-size:13px;color:var(--ink-2)">Polaris, the pole star. In the Vishnu Purana it sits at the tail of Shishumara, and the whole sky turns around it.</p>`;
    return;
  }
  const n = NAKSHATRAS[id - 1], y = YOGATARA[id];
  $("#info").innerHTML = `<p class="cap muted" style="margin:0">Nakshatra ${id} of 27</p>
    <div class="nm">${n.en} <span class="deva" style="font-style:normal;font-size:20px">${n.sa}</span></div>
    <p style="margin:8px 0 0;font-size:13px;color:var(--ink-2)">Main star: <b style="font-weight:400;color:var(--ink)">${y.star}</b> · RA ${y.ra.toFixed(1)}°, Dec ${y.dec.toFixed(1)}°<br>
    Symbol: ${n.symbol} · Deity: ${n.deity}</p>
    <a class="btn" href="index.html#atlas" style="margin-top:12px">Read its shloka →</a>`;
}
function pickAt(x, y) {
  let best = null, bd = 26 * 26;
  for (const h of hits) { const d = (h.x - x) ** 2 + (h.y - y) ** 2; if (d < bd) { bd = d; best = h; } }
  if (best) showInfo(best.id);
}

/* ---------- mouse / touch ---------- */
const pointers = new Map(); let lastPinch = 0, moved = 0;
cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.offsetX, e.offsetY]); moved = 0; });
cv.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  const [px, py] = pointers.get(e.pointerId); const dx = e.offsetX - px, dy = e.offsetY - py;
  pointers.set(e.pointerId, [e.offsetX, e.offsetY]); moved += Math.abs(dx) + Math.abs(dy);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (lastPinch) target.zoom = Math.max(0.5, Math.min(6, target.zoom * dist / lastPinch));
    lastPinch = dist; return;
  }
  const per = 120 / (Math.min(W, H) * view.zoom);
  target.ra += dx * per; target.dec = Math.max(-80, Math.min(89, target.dec + dy * per));
});
const up = (e) => { if (pointers.size === 1 && moved < 6) pickAt(e.offsetX, e.offsetY); pointers.delete(e.pointerId); lastPinch = 0; };
cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
cv.addEventListener("wheel", (e) => { e.preventDefault(); target.zoom = Math.max(0.5, Math.min(6, target.zoom * (e.deltaY < 0 ? 1.12 : 0.89))); }, { passive: false });

$("#reset").addEventListener("click", () => { target = { ra: 75, dec: 18, zoom: 1 }; });
$("#find-dhruva").addEventListener("click", () => { target = { ra: DHRUVA.ra, dec: 70, zoom: 1 }; flashDhruva = performance.now() + 3000; showInfo(0); });

/* ---------- hand gestures (MediaPipe) ---------- */
let landmarker = null, video = $("#mc-video"), handCv = $("#mc-hand"), hctx = handCv.getContext("2d");
let lastPalm = null, lastPinchY = null, gesture = "";

$("#start-cam").addEventListener("click", async () => {
  const btn = $("#start-cam"); btn.disabled = true; $("#cam-text").textContent = "Loading hand tracking…";
  try {
    const mp = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
    const files = await mp.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    landmarker = await mp.HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
      runningMode: "VIDEO", numHands: 1,
    });
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
    await video.play();
    $("#pip").hidden = false; $("#gesture").hidden = false;
    $("#cam-text").textContent = "Camera on · show your hand"; $("#cam-status").classList.add("live");
    btn.textContent = "Camera on";
    requestAnimationFrame(track);
  } catch (err) {
    console.warn(err);
    btn.disabled = false;
    $("#cam-text").textContent = location.protocol === "https:" || /^(localhost|127\.)/.test(location.hostname)
      ? "Couldn't start the camera · mouse mode" : "Camera needs https · mouse mode";
  }
});

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function classify(L) {
  const palm = dist(L[0], L[9]);                         // wrist → middle knuckle = hand size
  const tipsNear = [8, 12, 16, 20].filter((i) => dist(L[i], L[0]) < palm * 1.1).length;
  if (tipsNear >= 4) return "mushti";
  if (dist(L[4], L[8]) < palm * 0.35) return "hamsasya";
  return "pataka";
}
function track() {
  if (!landmarker) return;
  requestAnimationFrame(track);
  if (video.readyState < 2) return;
  const res = landmarker.detectForVideo(video, performance.now());
  handCv.width = video.videoWidth; handCv.height = video.videoHeight;
  hctx.clearRect(0, 0, handCv.width, handCv.height);
  const L = res.landmarks && res.landmarks[0];
  if (!L) { $("#gesture").textContent = "No hand"; lastPalm = lastPinchY = null; return; }

  // draw the hand skeleton in gold
  const E = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  hctx.strokeStyle = "#f4c542"; hctx.lineWidth = 3;
  E.forEach(([a, b]) => { hctx.beginPath(); hctx.moveTo(L[a].x * handCv.width, L[a].y * handCv.height); hctx.lineTo(L[b].x * handCv.width, L[b].y * handCv.height); hctx.stroke(); });
  hctx.fillStyle = "#fff1c2"; L.forEach((p) => { hctx.beginPath(); hctx.arc(p.x * handCv.width, p.y * handCv.height, 4, 0, 6.283); hctx.fill(); });

  gesture = classify(L);
  $("#gesture").textContent = { pataka: "Pataka · turning", hamsasya: "Hamsasya · zooming", mushti: "Mushti · holding" }[gesture];
  $("#gesture").classList.toggle("live", gesture !== "mushti");

  const palm = L[9];
  if (gesture === "pataka") {
    if (lastPalm) {
      const dx = (palm.x - lastPalm.x), dy = (palm.y - lastPalm.y); // camera is mirrored on screen
      target.ra -= dx * 160 / view.zoom; target.dec = Math.max(-80, Math.min(89, target.dec + dy * 120 / view.zoom));
    }
    lastPalm = { x: palm.x, y: palm.y }; lastPinchY = null;
  } else if (gesture === "hamsasya") {
    const yy = (L[4].y + L[8].y) / 2;
    if (lastPinchY != null) target.zoom = Math.max(0.5, Math.min(6, target.zoom * (1 + (lastPinchY - yy) * 3)));
    lastPinchY = yy; lastPalm = null;
  } else { lastPalm = lastPinchY = null; }
}
