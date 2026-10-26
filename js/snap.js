/* =====================================================================
   snap.js — Snap the Real Sky
   Real mode (on Netlify with ASTROMETRY_API_KEY): the photo is sent to
   astrometry.net through netlify/functions/snap.js. It returns where in the
   sky the photo points (RA, Dec, radius) and the named stars it found.
   We then list the nakshatras whose main star is inside the photo.
   Sample mode: a sky image drawn from real star positions (Taurus–Orion),
   "solved" instantly, so the idea can be shown anywhere, even offline.
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const D2R = Math.PI / 180;
const cfg = window.VISHNUSTRA_CONFIG || {};
let realMode = false, imageData = null, imgW = 0, imgH = 0;

/* ---------- helpers ---------- */
function angDist(ra1, dec1, ra2, dec2) {
  const a = Math.sin(dec1 * D2R) * Math.sin(dec2 * D2R) + Math.cos(dec1 * D2R) * Math.cos(dec2 * D2R) * Math.cos((ra1 - ra2) * D2R);
  return Math.acos(Math.max(-1, Math.min(1, a))) / D2R;
}
function status(msg, busy = true) { $("#status-box").hidden = false; $("#status").textContent = msg; $("#status-box .progress").hidden = !busy; }

function showPhoto(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      imgW = img.naturalWidth; imgH = img.naturalHeight;
      $("#photo").innerHTML = ""; $("#photo").appendChild(img);
      const ov = document.createElement("canvas"); ov.className = "ov"; ov.id = "ov";
      $("#photo").appendChild(ov);
      res(img);
    };
    img.src = src;
  });
}

/* Shrink big photos before upload (max 1600 px) */
function downscale(file) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.9));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ---------- choosing a photo ---------- */
async function useFile(file) {
  if (!file || !file.type.startsWith("image/")) { status("That file isn't an image. Choose a JPG or PNG.", false); return; }
  imageData = await downscale(file);
  await showPhoto(imageData);
  $("#solve").disabled = false;
  $("#vis").innerHTML = `<p class="muted" style="margin:0;font-size:13px">Photo ready. Press "Find the nakshatras".</p>`;
  $("#field").textContent = "";
  status(realMode ? "Ready to match." : "Real matching needs an astrometry.net key in .env (see README). Try the sample sky meanwhile.", false);
}
$("#file").addEventListener("change", (e) => useFile(e.target.files[0]));
const drop = $("#photo");
drop.addEventListener("dragover", (e) => { e.preventDefault(); $("#drop")?.classList.add("over"); });
drop.addEventListener("dragleave", () => $("#drop")?.classList.remove("over"));
drop.addEventListener("drop", (e) => { e.preventDefault(); useFile(e.dataTransfer.files[0]); });

/* ---------- drawing results ---------- */
function drawLabels(points) {
  // points: [{x, y, label, sub, gold}] in image pixel coordinates
  const ov = $("#ov"), img = $("#photo img"); if (!ov || !img) return;
  const w = img.clientWidth, h = img.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  ov.width = w * dpr; ov.height = h * dpr; const c = ov.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sx = w / imgW, sy = h / imgH;
  for (const p of points) {
    const x = p.x * sx, y = p.y * sy;
    c.strokeStyle = p.gold ? "#f4c542" : "rgba(255,243,208,.6)"; c.lineWidth = p.gold ? 1.6 : 1;
    c.beginPath(); c.arc(x, y, p.gold ? 14 : 8, 0, 6.283); c.stroke();
    c.font = `${p.gold ? "italic 500 18px 'Cormorant Garamond', serif" : "11px Jost, sans-serif"}`;
    c.fillStyle = p.gold ? "#f4c542" : "rgba(255,243,208,.75)"; c.textAlign = "left";
    c.fillText(p.label, x + (p.gold ? 18 : 11), y + 4);
    if (p.sub) { c.font = "10px Jost, sans-serif"; c.fillStyle = "rgba(236,232,223,.7)"; c.fillText(p.sub, x + 18, y + 18); }
  }
}
function listVisible(ra, dec, radius) {
  const vis = NAKSHATRAS.filter((n) => angDist(ra, dec, YOGATARA[n.id].ra, YOGATARA[n.id].dec) <= radius);
  $("#vis").innerHTML = vis.length
    ? vis.map((n) => `<a href="index.html#atlas"><b style="font-weight:400">${YOGATARA[n.id].star}</b><span>${n.en}</span></a>`).join("")
    : `<p class="muted" style="margin:0;font-size:13px">No nakshatra main stars in this part of the sky. The photo points away from the Moon's path.</p>`;
  $("#field").textContent = `Photo centre: RA ${ra.toFixed(1)}°, Dec ${dec.toFixed(1)}° · field radius ${radius.toFixed(1)}°`;
  return vis;
}

/* ---------- real matching through the Netlify function ---------- */
async function checkReal() {
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(cfg.snapEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ping: true }), signal: ctrl.signal });
    if (!r.ok) return false;
    return !!(await r.json()).ready;
  } catch { return false; }
}

$("#solve").addEventListener("click", async () => {
  if (!imageData) return;
  if (!realMode) { status("The star matcher needs the server running with ASTROMETRY_API_KEY in .env (see README). The sample sky shows how it works.", false); return; }
  $("#solve").disabled = true;
  try {
    status("Uploading your photo to the star matcher…");
    let r = await fetch(cfg.snapEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: imageData }) });
    const up = await r.json();
    if (!up.subid) throw new Error(up.error || "Upload failed");
    const t0 = Date.now();
    while (Date.now() - t0 < 5 * 60 * 1000) {
      status(`Matching the stars… ${Math.round((Date.now() - t0) / 1000)} s`);
      await new Promise((res) => setTimeout(res, 5000));
      r = await fetch(`${cfg.snapEndpoint}?subid=${up.subid}`);
      const j = await r.json();
      if (j.status === "success") {
        const { ra, dec, radius } = j.calibration;
        const vis = listVisible(ra, dec, radius);
        const names = new Set(vis.map((n) => YOGATARA[n.id].star.toLowerCase()));
        const scale = imgW / (j.width || imgW);
        drawLabels((j.annotations || []).filter((a) => a.names && a.names.length).slice(0, 40).map((a) => {
          const nm = a.names[0], hit = vis.find((n) => YOGATARA[n.id].star.toLowerCase().includes(nm.toLowerCase()) || nm.toLowerCase().includes(YOGATARA[n.id].star.toLowerCase().split(" ")[0]));
          return { x: a.pixelx * scale, y: a.pixely * scale, label: hit ? hit.en : nm, sub: hit ? nm : "", gold: !!hit };
        }));
        status(`Matched in ${Math.round((Date.now() - t0) / 1000)} s.`, false);
        $("#solve").disabled = false; return;
      }
      if (j.status === "failure") throw new Error("The matcher couldn't recognise these stars. Try a clearer or wider photo.");
    }
    throw new Error("Matching took too long. Try again or use a smaller photo.");
  } catch (e) {
    status(e.message || "Something went wrong.", false);
    $("#solve").disabled = false;
  }
});

/* ---------- sample sky (works offline) ---------- */
const SAMPLE = { ra: 74, dec: 12, radius: 24 };
const EXTRA = [ // other bright stars in Taurus–Orion, real positions (deg) and rough brightness
  ["Elnath", 81.57, 28.61, 3], ["Bellatrix", 81.28, 6.35, 3], ["Rigel", 78.63, -8.2, 5], ["Mintaka", 83.0, -0.3, 2.5],
  ["Alnilam", 84.05, -1.2, 3], ["Alnitak", 85.19, -1.94, 3], ["Saiph", 86.94, -9.67, 2.5], ["ζ Tau", 84.41, 21.14, 2],
  ["γ Tau", 64.95, 15.63, 1.8], ["δ Tau", 65.73, 17.54, 1.6], ["θ Tau", 67.15, 15.87, 1.8], ["ε Tau", 67.15, 19.18, 2],
  ["Atlas", 57.29, 24.05, 1.6], ["Electra", 56.22, 24.11, 1.6], ["Maia", 56.46, 24.37, 1.5], ["Merope", 56.58, 23.95, 1.4], ["Taygeta", 56.3, 24.47, 1.3],
  ["π³ Ori", 72.46, 6.96, 1.6], ["Hassaleh", 74.25, 33.17, 2],
];
$("#sample").addEventListener("click", async () => {
  const W = 1400, H = 1000, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#05060d"); g.addColorStop(1, "#0d0f1a");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const f = W / 2 / Math.tan(SAMPLE.radius * D2R); // gnomonic projection
  const proj = (ra, dec) => {
    const A = ra * D2R, Dd = dec * D2R, A0 = SAMPLE.ra * D2R, D0 = SAMPLE.dec * D2R;
    const cosc = Math.sin(D0) * Math.sin(Dd) + Math.cos(D0) * Math.cos(Dd) * Math.cos(A - A0);
    return [W / 2 - f * Math.cos(Dd) * Math.sin(A - A0) / cosc, H / 2 - f * (Math.cos(D0) * Math.sin(Dd) - Math.sin(D0) * Math.cos(Dd) * Math.cos(A - A0)) / cosc];
  };
  let s = 3; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(255,248,230,${0.15 + rnd() * 0.5})`; x.fillRect(rnd() * W, rnd() * H, 1.2, 1.2); }
  const star = (p, m, warm) => {
    const gl = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], m * 4);
    gl.addColorStop(0, "rgba(255,255,255,1)"); gl.addColorStop(0.3, warm ? "rgba(255,190,140,.7)" : "rgba(200,215,255,.6)"); gl.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gl; x.beginPath(); x.arc(p[0], p[1], m * 4, 0, 6.283); x.fill();
  };
  EXTRA.forEach(([, ra, dec, m]) => star(proj(ra, dec), m, false));
  [3, 4, 5, 6].forEach((id) => star(proj(YOGATARA[id].ra, YOGATARA[id].dec), id === 4 || id === 6 ? 5 : 2.5, id === 4 || id === 6));
  imageData = c.toDataURL("image/jpeg", 0.92);
  await showPhoto(imageData);
  status("Matching the sample sky…");
  await new Promise((r) => setTimeout(r, 1200));
  const vis = listVisible(SAMPLE.ra, SAMPLE.dec, SAMPLE.radius);
  drawLabels([
    ...vis.map((n) => { const p = proj(YOGATARA[n.id].ra, YOGATARA[n.id].dec); return { x: p[0], y: p[1], label: n.en, sub: YOGATARA[n.id].star, gold: true }; }),
    ...EXTRA.filter((e) => e[3] >= 2.5).map(([nm, ra, dec]) => { const p = proj(ra, dec); return { x: p[0], y: p[1], label: nm }; }),
  ]);
  status("Sample sky matched: Taurus and Orion, home of Krittika, Rohini, Mrigashira and Ardra.", false);
  $("#solve").disabled = true;
});
addEventListener("resize", () => {}); // labels are redrawn on the next match

checkReal().then((ok) => {
  realMode = ok;
  $("#mode-text").textContent = ok ? "Live star matching" : "Sample mode · add a key for real matching";
  if (ok) $("#mode").classList.add("live");
});
