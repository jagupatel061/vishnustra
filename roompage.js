/* =====================================================================
   roompage.js — QR Room (open on the laptop during the jury)
   Shows a QR code → phones open portal.html?room=CODE → each guest's star
   lights up on the ring of 27 with their name.
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const url = new URL(location.href);
let code = Room.clean(url.searchParams.get("room"));
if (!code) { code = Room.newCode(); url.searchParams.set("room", code); history.replaceState(null, "", url); }

$("#code").textContent = code;

/* The QR link: with the backend running, phones use the laptop's Wi-Fi address over https */
let joinURL = new URL("portal.html?room=" + code, location.href).href;
function drawQR(link) {
  joinURL = link;
  $("#url").textContent = link;
  try { $("#qr").innerHTML = QR.svg(link, { dark: "#0a0a0b", light: "#f6f1e4", border: 1 }); }
  catch { $("#qr").innerHTML = `<p style="color:#333;text-align:center;font-size:13px;padding:10px">Open this link on the phone:<br>${link}</p>`; }
}
drawQR(joinURL);
API.info().then((info) => {
  if (info) {
    drawQR(`${info.phoneUrl}/portal.html?room=${code}`);
    $("#phone-help").hidden = false;
    $("#local-warn").hidden = true;
  } else if (/^(127\.|localhost$|0\.0\.0\.0)/.test(location.hostname) || location.protocol === "file:") {
    $("#local-warn").hidden = false;
  }
});

/* ---------- the shared sky ---------- */
const cv = $("#room-canvas"), ctx = cv.getContext("2d");
const guests = [];            // { name, starId, star, sa, at, born }
const byStar = {};            // starId -> [names]
let size = 600;
function resize() {
  const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  size = r.width; cv.width = r.width * dpr; cv.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize(); addEventListener("resize", resize);

const pos = (k, R) => { const a = (k / 27) * Math.PI * 2 - Math.PI / 2; return [size / 2 + Math.cos(a) * R, size / 2 + Math.sin(a) * R, a]; };

function draw(t) {
  requestAnimationFrame(draw);
  const S = size, c = S / 2, R = S * 0.34;
  ctx.clearRect(0, 0, S, S);
  // centre: the Moon's path label
  const g = ctx.createRadialGradient(c, c, 0, c, c, R);
  g.addColorStop(0, "rgba(244,197,66,.07)"); g.addColorStop(1, "rgba(244,197,66,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, R, 0, 6.283); ctx.fill();
  ctx.strokeStyle = "#2c2c30"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c, c, R, 0, 6.283); ctx.stroke();
  ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.arc(c, c, R * 0.62, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);

  ctx.textAlign = "center"; ctx.fillStyle = "#f4c542";
  ctx.font = `${Math.round(S * 0.06)}px "Tiro Devanagari Sanskrit", serif`; ctx.fillText("नक्षत्र", c, c - S * 0.01);
  ctx.fillStyle = "#a9a499"; ctx.font = `${Math.max(10, Math.round(S * 0.018))}px Jost, sans-serif`;
  ctx.fillText(guests.length ? `${guests.length} ${guests.length === 1 ? "star" : "stars"} in this room` : "Scan the QR to add your star", c, c + S * 0.05);

  for (let k = 0; k < 27; k++) {
    const n = NAKSHATRAS[k], names = byStar[n.id] || [];
    const [x, y, a] = pos(k, R), lit = names.length > 0;
    if (lit) {
      const pulse = 1 + 0.12 * Math.sin(t / 380 + k);
      const gl = ctx.createRadialGradient(x, y, 0, x, y, 30 * pulse);
      gl.addColorStop(0, "rgba(255,246,207,1)"); gl.addColorStop(0.25, "rgba(244,197,66,.75)"); gl.addColorStop(1, "rgba(244,165,32,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 30 * pulse, 0, 6.283); ctx.fill();
      ctx.strokeStyle = "rgba(244,197,66,.35)"; ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(x, y); ctx.stroke();
    }
    ctx.fillStyle = lit ? "#fff1c2" : "#6f6b63";
    ctx.beginPath(); ctx.arc(x, y, lit ? 5 : 2.6, 0, 6.283); ctx.fill();
    // star name: horizontal, pushed outward, aligned by side so nothing overlaps the ring
    const [lx, ly] = pos(k, R + S * 0.03);
    const short = n.en.replace("Purva ", "P. ").replace("Uttara ", "U. ");
    ctx.textAlign = Math.abs(Math.cos(a)) < 0.25 ? "center" : Math.cos(a) > 0 ? "left" : "right";
    ctx.fillStyle = lit ? "#f4c542" : "#6f6b63";
    ctx.font = `${lit ? 500 : 400} ${Math.max(9, Math.round(S * (lit ? 0.02 : 0.016)))}px Jost, sans-serif`;
    ctx.fillText(short.toUpperCase(), lx, ly + (Math.sin(a) > 0.6 ? 10 : Math.sin(a) < -0.6 ? -4 : 4));
    // guest names stacked inward, toward the centre
    if (lit) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#ece8df"; ctx.font = `italic ${Math.max(12, Math.round(S * 0.024))}px "Cormorant Garamond", serif`;
      names.slice(-3).forEach((nm, i) => {
        const [gx, gy] = pos(k, R - S * (0.06 + i * 0.04));
        ctx.fillText(nm, gx, gy + 4);
      });
    }
  }
  // newest guest: a shooting light from the centre
  const last = guests[guests.length - 1];
  if (last && t - last.born < 1600) {
    const p = (t - last.born) / 1600, [x, y] = pos(last.starId - 1, R);
    const hx = c + (x - c) * p, hy = c + (y - c) * p;
    const gl = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18);
    gl.addColorStop(0, "rgba(255,246,207,1)"); gl.addColorStop(1, "rgba(244,197,66,0)");
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hx, hy, 18, 0, 6.283); ctx.fill();
  }
}
requestAnimationFrame(draw);

/* ---------- guests ---------- */
let toastTimer = 0;
function addGuest(gst) {
  if (!gst || !gst.starId) return;
  gst.born = performance.now();
  guests.push(gst);
  (byStar[gst.starId] = byStar[gst.starId] || []).push(gst.name);
  $("#count").textContent = guests.length;
  const list = $("#guests");
  if (guests.length === 1) list.innerHTML = "";
  list.insertAdjacentHTML("afterbegin", `<div class="guest"><b>${escapeHTML(gst.name)}</b><span>${gst.star}</span></div>`);
  const tEl = $("#toast");
  tEl.innerHTML = `${escapeHTML(gst.name)} was born under <span>${gst.star}</span>`;
  tEl.style.opacity = 1; clearTimeout(toastTimer); toastTimer = setTimeout(() => (tEl.style.opacity = 0), 3500);
}
function escapeHTML(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function clearAll() {
  guests.length = 0; for (const k in byStar) delete byStar[k];
  $("#count").textContent = "0";
  $("#guests").innerHTML = `<p class="muted" style="margin:0;font-size:12.5px">Waiting for the first phone…</p>`;
}
Room.listen(code, addGuest, clearAll).then((mode) => {
  const label = { server: "Live · saved on the server", firebase: "Live · Firebase", demo: "Demo · same device only" }[mode];
  $("#mode-text").textContent = label;
  if (mode !== "demo") $("#mode-chip").classList.add("live");
});

/* test guest for rehearsal */
const SAMPLE = ["Priya", "Arjun", "Meera", "Kabir", "Ananya", "Rohan", "Isha", "Dev"];
$("#demo").addEventListener("click", () => {
  const n = NAKSHATRAS[Math.floor(Math.random() * 27)];
  Room.add(code, { name: SAMPLE[Math.floor(Math.random() * SAMPLE.length)], starId: n.id, star: n.en, sa: n.sa });
});
$("#newroom").addEventListener("click", () => { location.href = "room.html"; });
$("#clear").addEventListener("click", () => Room.clear(code));
