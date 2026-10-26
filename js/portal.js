/* =====================================================================
   portal.js — Sky Portal
   1. Read name + birth details → find the nakshatra
   2. Open the back camera full screen
   3. Draw a glowing circular "portal" with the constellation inside;
      the stars shift as the phone tilts (device orientation)
   4. Send { name, star } to the QR room, if the page was opened from a QR
   ===================================================================== */
const params = new URLSearchParams(location.search);
const roomCode = Room.clean(params.get("room") || "");
const $ = (s) => document.querySelector(s);

if (roomCode) {
  $("#room-chip").hidden = false;
  $("#room-chip-text").textContent = "Joining room " + roomCode;
}
$("#p-slot").addEventListener("change", () => { $("#p-time-wrap").hidden = $("#p-slot").value !== "exact"; });

let star = null, guestName = "";
let tiltX = 0, tiltY = 0;          // smoothed tilt offsets (px)
let targetX = 0, targetY = 0;
let openT = 0;                     // portal opening animation start
let raf = 0, stream = null;

$("#pform").addEventListener("submit", async (e) => {
  e.preventDefault();
  guestName = $("#p-name").value.trim() || "Guest";
  const slot = $("#p-slot").value, exactTime = $("#p-time").value;
  let time = slot;
  if (time === "exact") time = exactTime || "12:00";
  const r = Astro.findStar($("#p-date").value, time);
  star = NAKSHATRAS[r.primary.nakshatraIndex];

  $("#v-who").textContent = `${guestName} · born under`;
  $("#v-name").innerHTML = `${star.en}<span class="deva">${star.sa}</span>`;
  $("#v-shloka").textContent = star.shloka.text;
  $("#view").hidden = false;
  document.body.style.overflow = "hidden";
  openT = performance.now();
  startCamera();
  loop();

  if (roomCode) {
    $("#v-sent").textContent = "Sending to the big screen…";
    try {
      const { mode } = await Room.add(roomCode, { name: guestName, date: $("#p-date").value, slot, time: exactTime, starId: star.id, star: star.en, sa: star.sa });
      $("#v-sent").textContent = mode === "demo" ? `Demo mode: sent to room ${roomCode} on this device` : `✦ Your star is on the big screen · room ${roomCode}`;
      $("#v-sent").classList.add("live");
    } catch (err) {
      $("#v-sent").textContent = "Couldn't reach the room. Check the internet connection.";
    }
  } else {
    $("#v-sent").textContent = "Not in a room · scan the QR on the jury table to join";
  }
});

async function startCamera() {
  const chip = $("#cam-chip");
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    $("#cam").srcObject = stream;
    chip.textContent = "Camera on"; chip.classList.add("live");
  } catch (err) {
    chip.textContent = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "No camera · showing the sky only" : "Camera needs https · showing the sky only";
  }
}

/* Device tilt → parallax. iPhone needs a tap to allow motion. */
function onTilt(e) {
  const g = Math.max(-45, Math.min(45, e.gamma || 0));   // left/right
  const b = Math.max(-45, Math.min(45, (e.beta || 0) - 60)); // forward/back around holding angle
  targetX = -g * 4; targetY = -b * 4;
}
function enableMotion() {
  const DO = window.DeviceOrientationEvent;
  if (DO && typeof DO.requestPermission === "function") {
    DO.requestPermission().then((s) => {
      if (s === "granted") { addEventListener("deviceorientation", onTilt); $("#motion-btn").textContent = "Motion on"; }
      else $("#motion-btn").textContent = "Motion blocked";
    }).catch(() => { $("#motion-btn").textContent = "Motion blocked"; });
  } else if (DO) {
    addEventListener("deviceorientation", onTilt); $("#motion-btn").textContent = "Motion on";
  } else {
    $("#motion-btn").textContent = "No motion sensor";
  }
}
$("#motion-btn").addEventListener("click", enableMotion);
if (!(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function")) enableMotion();
/* Desktop: mouse moves the sky a little, so it can be shown on a laptop too */
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  targetX = (e.clientX / innerWidth - 0.5) * -120; targetY = (e.clientY / innerHeight - 0.5) * -120;
});

$("#close-view").addEventListener("click", () => {
  $("#view").hidden = true; document.body.style.overflow = "";
  cancelAnimationFrame(raf);
  if (stream) stream.getTracks().forEach((t) => t.stop());
});

/* ---------- drawing ---------- */
const cv = $("#portal"), ctx = cv.getContext("2d");
let field = [];
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  field = Array.from({ length: 260 }, () => ({
    x: (Math.random() - 0.5) * 2.4, y: (Math.random() - 0.5) * 2.4,
    r: Math.random() < 0.12 ? 1.6 : Math.random() < 0.5 ? 1 : 0.6,
    gold: Math.random() < 0.45, ph: Math.random() * 6.3,
  }));
}
resize(); addEventListener("resize", resize);

function loop(t = performance.now()) {
  raf = requestAnimationFrame(loop);
  const W = innerWidth, H = innerHeight;
  tiltX += (targetX - tiltX) * 0.08; tiltY += (targetY - tiltY) * 0.08;
  const open = Math.min(1, (t - openT) / 1400), ease = 1 - Math.pow(1 - open, 3);
  const cx = W / 2 + tiltX * 0.25, cy = H * 0.42 + tiltY * 0.25;
  const R = Math.max(2, Math.min(W, H) * 0.38 * ease);

  ctx.clearRect(0, 0, W, H);
  // dim the real room a little so the portal stands out
  ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(0, 0, W, H);

  // outer glow
  const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.5);
  glow.addColorStop(0, "rgba(244,197,66,.35)"); glow.addColorStop(1, "rgba(244,197,66,0)");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, 6.283); ctx.fill();

  // inside the portal: night sky
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(R, 1), 0, 6.283); ctx.clip();
  const skyG = ctx.createRadialGradient(cx, cy - R * 0.3, 0, cx, cy, R);
  skyG.addColorStop(0, "#1b1840"); skyG.addColorStop(0.7, "#08071a"); skyG.addColorStop(1, "#030308");
  ctx.fillStyle = skyG; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  const px = tiltX, py = tiltY; // stars move more than the frame = depth
  for (const s of field) {
    const x = cx + s.x * R + px * 0.6, y = cy + s.y * R + py * 0.6;
    ctx.globalAlpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 700 + s.ph));
    ctx.fillStyle = s.gold ? "#f4c542" : "#fff6dc";
    ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // the constellation
  if (star) {
    const sh = SHAPES[star.id], scale = (R * 1.3) / 40;
    const ox = cx - 20 * scale + px, oy = cy - 20 * scale + py;
    const P = sh.pts.map(([x, y]) => [ox + x * scale, oy + y * scale]);
    const reveal = Math.min(1, Math.max(0, (t - openT - 900) / 1200));
    if (sh.path !== "none" && P.length > 1) {
      ctx.strokeStyle = "rgba(244,197,66,.85)"; ctx.lineWidth = 1.6;
      ctx.shadowColor = "#f4c542"; ctx.shadowBlur = 12;
      ctx.beginPath();
      const segs = P.length - (sh.path === "closed" ? 0 : 1);
      const upto = segs * reveal;
      P.forEach((p, i) => (i === 0 ? ctx.moveTo(...p) : i <= upto ? ctx.lineTo(...p) : null));
      if (sh.path === "closed" && reveal >= 1) ctx.closePath();
      ctx.stroke(); ctx.shadowBlur = 0;
    }
    P.forEach((p, i) => {
      const big = i === sh.bright, pulse = 1 + 0.15 * Math.sin(t / 400 + i);
      const r = (big ? 9 : 4.5) * pulse * Math.min(1, reveal * 2 + 0.2);
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 4);
      g.addColorStop(0, "rgba(255,246,207,1)"); g.addColorStop(0.25, "rgba(244,197,66,.8)"); g.addColorStop(1, "rgba(244,165,32,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r * 4, 0, 6.283); ctx.fill();
      if (big) { // four-point flare
        ctx.fillStyle = "#fff1c2"; const L = r * 3.2;
        ctx.beginPath();
        ctx.moveTo(p[0], p[1] - L); ctx.lineTo(p[0] + 1.6, p[1] - 1.6); ctx.lineTo(p[0] + L, p[1]); ctx.lineTo(p[0] + 1.6, p[1] + 1.6);
        ctx.lineTo(p[0], p[1] + L); ctx.lineTo(p[0] - 1.6, p[1] + 1.6); ctx.lineTo(p[0] - L, p[1]); ctx.lineTo(p[0] - 1.6, p[1] - 1.6);
        ctx.closePath(); ctx.fill();
      }
    });
    // label
    if (reveal > 0.6) {
      ctx.globalAlpha = Math.min(1, (reveal - 0.6) * 2.5);
      ctx.fillStyle = "#f4c542"; ctx.font = "500 12px Jost, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${guestName.toUpperCase()} · ${star.en.toUpperCase()}`.split("").join(String.fromCharCode(8202)), cx + px, cy + R * 0.82 + py * 0.3);
      ctx.globalAlpha = 1;
    }
  }
  // inner shading toward the rim
  const rim = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R);
  rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, "rgba(0,0,0,.55)");
  ctx.fillStyle = rim; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.restore();

  // the gold ring with 27 ticks
  if (R > 2) {
    ctx.strokeStyle = "#f4c542"; ctx.lineWidth = 2; ctx.shadowColor = "#f4c542"; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(244,197,66,.55)";
    ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, 6.283); ctx.stroke();
    for (let k = 0; k < 27; k++) {
      const a = (k / 27) * 6.283 - 1.5708 + t / 20000;
      const on = star && k === star.id - 1;
      ctx.strokeStyle = on ? "#fff1c2" : "rgba(244,197,66,.6)"; ctx.lineWidth = on ? 3 : 1;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4));
      ctx.lineTo(cx + Math.cos(a) * (R + (on ? 22 : 14)), cy + Math.sin(a) * (R + (on ? 22 : 14))); ctx.stroke();
    }
  }
}
