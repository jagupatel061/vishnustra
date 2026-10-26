/* =====================================================================
   app.js — makes Vishnustra interactive
   Needs (loaded before this file): data/nakshatras.js, js/shapes.js, js/astro.js
   ===================================================================== */

const $ = (sel) => document.querySelector(sel);
const N = NAKSHATRAS;                    // the 27 stars
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const iso = (d) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10); // IST date string

/* ---------------------------------------------------------------
   1. Twinkling star background
   --------------------------------------------------------------- */
(function sky() {
  const c = $("#sky"), ctx = c.getContext("2d");
  let stars = [];
  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((innerWidth * innerHeight) / 4200);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() < 0.1 ? 1.4 : Math.random() < 0.45 ? 0.9 : 0.55,
      gold: Math.random() < 0.5, ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 1.2,
      sparkle: Math.random() < 0.035,
    }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      const a = reduceMotion ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * s.sp + s.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.gold ? "#f4c542" : "#fff3d0";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      if (s.sparkle) {
        ctx.beginPath();
        ctx.moveTo(s.x - 5, s.y); ctx.lineTo(s.x, s.y - 0.6); ctx.lineTo(s.x + 5, s.y); ctx.lineTo(s.x, s.y + 0.6); ctx.closePath();
        ctx.moveTo(s.x, s.y - 5); ctx.lineTo(s.x + 0.6, s.y); ctx.lineTo(s.x, s.y + 5); ctx.lineTo(s.x - 0.6, s.y); ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  build(); addEventListener("resize", build);
  requestAnimationFrame(draw);
})();

/* ---------------------------------------------------------------
   2. Moon-phase icon (SVG). f: 0 = new, 0.5 = full, 1 = new again
   --------------------------------------------------------------- */
function phaseIcon(f, lit = "#d9d4c8") {
  const r = 26, x = 27, y = 27, t = Math.cos(f * 2 * Math.PI), rx = Math.abs(t) * r;
  let p = `<svg viewBox="0 0 54 54"><circle cx="${x}" cy="${y}" r="${r}" fill="#141416" stroke="#4a4740" stroke-width=".8"/>`;
  if (f <= 0.5) p += `<path d="M${x} ${y - r} A${r} ${r} 0 0 1 ${x} ${y + r} A${rx} ${r} 0 0 ${t > 0 ? 0 : 1} ${x} ${y - r}Z" fill="${lit}"/>`;
  else p += `<path d="M${x} ${y - r} A${r} ${r} 0 0 0 ${x} ${y + r} A${rx} ${r} 0 0 ${t > 0 ? 1 : 0} ${x} ${y - r}Z" fill="${lit}"/>`;
  return p + "</svg>";
}

/* ---------------------------------------------------------------
   3. Star panel (opens when any star is clicked)
   --------------------------------------------------------------- */
const panel = $("#panel");
let panelStar = null;

const LANGS = [
  { key: "sa", label: "Sanskrit", speak: "hi-IN" },
  { key: "hi", label: "Hindi", speak: "hi-IN" },
  { key: "gu", label: "Gujarati", speak: "gu-IN" },
  { key: "ta", label: "Tamil", speak: "ta-IN" },
  { key: "ml", label: "Malayalam", speak: "ml-IN" },
  { key: "en", label: "English", speak: "en-IN" },
];
const nameIn = (n, key) => key === "en" ? n.en : key === "hi" ? n.sa : n[key];
const fontFor = { gu: "'Noto Sans Gujarati'", ta: "'Noto Sans Tamil'", ml: "'Noto Sans Malayalam'", sa: "var(--deva)", hi: "var(--deva)", en: "var(--body)" };

function speak(text, lang) {
  if (!("speechSynthesis" in window)) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.85;
  const v = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
  return true;
}

/* Festivals that belong to a star (data/festivals.js), with their next dates */
let festCache = null;
function festivalsOf(id) {
  if (typeof FESTIVALS === "undefined") return [];
  if (!festCache) festCache = FestCalc.upcoming(new Date(), FESTIVALS);
  return festCache.filter((f) => (f.kind === "star" ? f.star : f.named || LUNAR_MONTHS[f.month][2]) === id);
}
const shortDate = (iso) => new Date(iso + "T12:00:00+05:30").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function openStar(id) {
  const n = N[id - 1];
  panelStar = n;
  $("#sp-shape").innerHTML = shapeSVG(id, { size: 80, hot: true });
  $("#sp-num").textContent = `Nakshatra ${String(id).padStart(2, "0")} of 27`;
  $("#sp-title").innerHTML = `${n.en}<span class="deva">${n.sa}</span>`;
  $("#sp-sub").textContent = `${n.symbol} · ${n.western}`;

  $("#sp-langs").innerHTML = LANGS.map((l) =>
    `<button class="lang" type="button" data-say="${nameIn(n, l.key)}" data-lang="${l.speak}">
       <span style="font-family:${fontFor[l.key]}">${nameIn(n, l.key)}</span><small>${l.label}</small>
       <span class="spk" aria-hidden="true">▸</span></button>`).join("");

  const facts = [
    ["Deity", n.deity], ["Symbol", n.symbol], ["Sacred tree", n.tree],
    ["Name sounds", n.syllables.join(" · ")], ["Western star", n.western],
  ];
  const fests = festivalsOf(id);
  if (fests.length) facts.push(["Festivals", fests.map((f) => `<a class="gold" href="festivals.html">${f.name}</a>${f.date ? ` <span class="muted">· ${shortDate(f.date)}</span>` : ""}`).join("<br>")]);
  $("#sp-facts").innerHTML = facts.map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");

  $("#sp-shloka").textContent = n.shloka.text;
  $("#sp-meaning").textContent = n.shloka.meaning + (n.note ? ` ${n.note}` : "");
  $("#sp-src").textContent = `Vishnu Sahasranama · verse ${n.shloka.verse} · pada 1 of ${n.en}`;
  $("#sp-name-in").value = "";
  $("#sp-name-out").textContent = "";

  if (typeof panel.showModal === "function") panel.showModal(); else panel.setAttribute("open", "");
}

$("#sp-card").addEventListener("click", () => { if (panelStar) StarCard.open({ id: panelStar.id, ...(panelStar.id === lastFound.id ? lastFound : {}) }); });
$("#sp-close").addEventListener("click", () => { speechSynthesis?.cancel(); panel.close(); });
panel.addEventListener("click", (e) => { if (e.target === panel) panel.close(); }); // click outside closes
panel.addEventListener("close", () => { if ("speechSynthesis" in window) speechSynthesis.cancel(); });

$("#sp-langs").addEventListener("click", (e) => {
  const b = e.target.closest(".lang"); if (!b) return;
  if (!speak(b.dataset.say, b.dataset.lang)) b.querySelector("small").textContent = "No voice on this device";
});
$("#sp-listen").addEventListener("click", () => {
  if (!panelStar) return;
  const ok = speak(panelStar.shloka.text.replace(/[।॥\n]/g, " "), "hi-IN");
  if (!ok) $("#sp-listen").textContent = "Voice not available";
});

/* Name check: does a name begin with this star's traditional sounds? */
function bestMatch(name) {
  const nm = name.toLowerCase().replace(/[^a-z]/g, "");
  let best = null;
  for (const s of N) for (const syl of s.syllables) {
    const k = syl.toLowerCase();
    if (nm.startsWith(k) && (!best || k.length > best.syl.length)) best = { star: s, syl: k };
  }
  return best;
}
$("#sp-nameform").addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = $("#sp-name-in").value.trim(), out = $("#sp-name-out");
  if (!raw) { out.textContent = "Type a name first."; return; }
  const mine = panelStar.syllables.find((s) => raw.toLowerCase().startsWith(s.toLowerCase()));
  if (mine) { out.innerHTML = `<span class="gold">✦ ${raw}</span> begins with “${mine}”, one of ${panelStar.en}'s sounds.`; return; }
  const m = bestMatch(raw);
  out.innerHTML = m
    ? `${raw} doesn't use ${panelStar.en}'s sounds. It begins with “${m.syl}”, which belongs to <span class="gold">${m.star.en}</span>.`
    : `${raw} doesn't start with any of the listed nakshatra sounds.`;
});

/* ---------------------------------------------------------------
   4. Tonight's star (hero)
   --------------------------------------------------------------- */
const now = new Date();
const tonight = Astro.moonAt(now);
$("#tonight-name").textContent = N[tonight.nakshatraIndex].en;
$("#tonight").addEventListener("click", () => openStar(tonight.nakshatraId));

/* ---------------------------------------------------------------
   5. The 27 strip
   --------------------------------------------------------------- */
const strip = $("#strip");
strip.innerHTML = N.map((n) =>
  `<button class="star-chip" type="button" role="listitem" data-id="${n.id}" aria-label="${n.en}, ${n.symbol}">
     <span class="ring">${shapeSVG(n.id, { size: 52 })}</span>
     <span class="nm">${n.en}</span>
     <span class="sub">${String(n.id).padStart(2, "0")} · ${n.symbol.split(" /")[0]}</span>
   </button>`).join("");
strip.addEventListener("click", (e) => { const b = e.target.closest(".star-chip"); if (b) openStar(+b.dataset.id); });

function highlightChip(id) {
  strip.querySelectorAll(".star-chip").forEach((b) => {
    const on = +b.dataset.id === id;
    b.classList.toggle("on", on);
    b.querySelector(".ring").innerHTML = shapeSVG(+b.dataset.id, { size: 52, hot: on });
  });
  const el = strip.querySelector(`[data-id="${id}"]`);
  if (el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
}
function syncBar() {
  const max = strip.scrollWidth - strip.clientWidth;
  const frac = max > 0 ? strip.scrollLeft / max : 0;
  const w = Math.max(12, (strip.clientWidth / strip.scrollWidth) * 100);
  $("#strip-bar").style.width = w + "%";
  $("#strip-bar").style.left = frac * (100 - w) + "%";
}
strip.addEventListener("scroll", syncBar, { passive: true });
addEventListener("resize", syncBar);
$("#strip-prev").addEventListener("click", () => strip.scrollBy({ left: -strip.clientWidth * 0.8, behavior: "smooth" }));
$("#strip-next").addEventListener("click", () => strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: "smooth" }));

/* ---------------------------------------------------------------
   6. Find your birth star
   --------------------------------------------------------------- */
const slot = $("#f-slot");
slot.addEventListener("change", () => { $("#f-time-wrap").hidden = slot.value !== "exact"; });

let lastFound = { id: 0 };
function showResult(isExample) {
  const date = $("#f-date").value;
  if (!date) return;
  let time = slot.value;
  if (time === "exact") time = $("#f-time").value || "12:00";
  const r = Astro.findStar(date, time);
  const n = N[r.primary.nakshatraIndex];
  const alts = r.alternatives.map((a) => N[a.nakshatraIndex].en).filter((x) => x !== n.en);
  let note = r.exact ? `Pada ${r.primary.pada} · exact time used.`
    : alts.length ? `The Moon changed stars that day. It could also be ${alts.join(" or ")}. Add a time to be sure.`
    : `Moon in ${n.en} for this part of the day.`;
  $("#find-result").innerHTML = `
    <span class="cap muted" style="font-size:9.5px">${isExample ? "Example · " : ""}You were born under</span>
    <span class="star">${n.en} <span class="deva" style="font-style:normal;font-size:20px">${n.sa}</span></span>
    <span class="note">${note}</span>
    <div class="row" style="margin-top:8px">
      <button class="btn" type="button" id="find-open">Open ${n.en} →</button>
      <button class="btn solid" type="button" id="find-card">My star card ✦</button>
    </div>`;
  lastFound = { id: n.id, date, pada: r.exact ? r.primary.pada : null };
  $("#find-open").addEventListener("click", () => openStar(n.id));
  $("#find-card").addEventListener("click", () => StarCard.open(lastFound));
  highlightChip(n.id);
  markShishu(n.id);
  if (!isExample) {
    API.save("/lookups", { date, slot: slot.value, time: $("#f-time").value, page: "home" });
    showPoll(n.id);
  }
}

/* Poll: "Did you already know your nakshatra?" — answers are saved on the server */
async function showPoll(starId) {
  const box = document.getElementById("poll");
  const info = await API.info();
  if (!info) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<span class="cap muted" style="font-size:9.5px">Quick poll · did you already know your nakshatra?</span>
    <div class="row"><button class="btn" type="button" data-k="1">Yes, I knew</button><button class="btn" type="button" data-k="0">No, new to me</button></div>`;
  box.onclick = async (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    try {
      const s = await API.post("/poll", { knew: b.dataset.k === "1", starId });
      box.innerHTML = `<span class="cap muted" style="font-size:9.5px">Thanks! Poll so far</span>
        <div class="pollbar"><i style="width:${s.percentYes}%"></i></div>
        <span class="note">${s.percentYes}% of ${s.total} ${s.total === 1 ? "person" : "people"} already knew their star.</span>`;
    } catch { box.innerHTML = `<span class="note">Couldn't save the answer. Is the server running?</span>`; }
  };
}
$("#find-form").addEventListener("submit", (e) => { e.preventDefault(); showResult(false); });

/* ---------------------------------------------------------------
   7. Lunar Time Machine
   --------------------------------------------------------------- */
const PHASES = [["New", 0.02], ["Crescent", 0.15], ["Half", 0.25], ["Gibbous", 0.38], ["Full", 0.5]];
$("#phases").innerHTML = PHASES.map(([nm, f]) => `<div class="phase" data-p="${nm}">${phaseIcon(f)}<span>${nm}</span></div>`).join("");

const orbit = $("#orbit-svg");
(function buildOrbit() {
  let o = `<circle cx="200" cy="200" r="168" fill="none" stroke="#2c2c30" stroke-width="1"/>`;
  for (let k = 0; k < 27; k++) {
    const a = (k / 27) * Math.PI * 2 - Math.PI / 2;
    o += `<circle class="o-dot" data-k="${k}" cx="${200 + Math.cos(a) * 168}" cy="${200 + Math.sin(a) * 168}" r="2.4" fill="#6f6b63"/>`;
  }
  o += `<g id="o-moon"><circle r="16" fill="#f4c542" opacity=".18"/><circle r="6" fill="#f4c542"/></g>`;
  o += `<text id="o-label" text-anchor="middle" font-size="11" letter-spacing="2.5" fill="#f4c542" font-family="Jost, sans-serif"></text>`;
  orbit.innerHTML = o;
})();

const tmDate = $("#tm-date"), tmSlide = $("#tm-slide");
tmDate.value = iso(now);

function baseDate() {
  const [y, m, d] = tmDate.value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 21 - 5.5, 0)); // 9 pm IST on the chosen day
}
function updateTM() {
  const t = new Date(baseDate().getTime() + Number(tmSlide.value) * 86400e3);
  const r = Astro.moonAt(t), n = N[r.nakshatraIndex];
  $("#tm-phase").textContent = r.phaseName;
  $("#tm-illum").textContent = Math.round(r.illumination * 100) + "%";
  $("#tm-star").textContent = n.en;
  $("#tm-star").onclick = () => openStar(n.id);
  $("#tm-pada").textContent = `${r.pada} of 4`;

  // which phase icon to light
  const f = r.elongation / 360, d = Math.min(f, 1 - f); // 0 new … 0.5 full
  const pick = PHASES.reduce((b, p) => Math.abs(p[1] - d) < Math.abs(b[1] - d) ? p : b);
  document.querySelectorAll(".phase").forEach((el) => el.classList.toggle("on", el.dataset.p === pick[0]));

  // move the moon marker around the 27-star ring
  const a = (r.sidereal / 360) * Math.PI * 2 - Math.PI / 2;
  const x = 200 + Math.cos(a) * 168, y = 200 + Math.sin(a) * 168;
  $("#o-moon").setAttribute("transform", `translate(${x} ${y})`);
  const lab = $("#o-label");
  lab.setAttribute("x", 200 + Math.cos(a) * 196); lab.setAttribute("y", 200 + Math.sin(a) * 196 + 4);
  lab.textContent = n.en.toUpperCase();
  orbit.querySelectorAll(".o-dot").forEach((c) => {
    const on = +c.dataset.k === r.nakshatraIndex;
    c.setAttribute("fill", on ? "#f4c542" : "#6f6b63"); c.setAttribute("r", on ? 3.6 : 2.4);
  });

  // date timeline
  const s = new Date(baseDate().getTime() - 15 * 86400e3), e = new Date(baseDate().getTime() + 15 * 86400e3);
  $("#tm-start").textContent = fmt(s); $("#tm-end").textContent = fmt(e);
  const pos = ((Number(tmSlide.value) + 15) / 30) * 100;
  $("#timeline").innerHTML = `
    <span style="top:0">${fmt(s)}</span>
    <span style="top:100%">${fmt(e)}</span>
    <i class="dot" style="top:${pos}%"></i>
    <span class="now" style="top:${pos}%">${fmt(t)}</span>`;
}
tmDate.addEventListener("input", () => { tmSlide.value = 0; updateTM(); });
tmSlide.addEventListener("input", updateTM);

/* ---------------------------------------------------------------
   8. Sky as Vishnu — Shishumara with 27 stars along its body
   --------------------------------------------------------------- */
const SPINE = "M705 248 C 640 196, 540 168, 440 196 S 270 300, 190 262 S 118 160, 96 96";
(function buildShishu() {
  const box = $("#shishu");
  box.innerHTML = `
  <svg viewBox="0 0 800 450" role="group" aria-label="Shishumara, the sky as Vishnu, with 27 stars">
    <defs>
      <radialGradient id="dh"><stop offset="0" stop-color="#fff6cf"/><stop offset=".35" stop-color="#f4c542"/><stop offset="1" stop-color="#f4a520" stop-opacity="0"/></radialGradient>
      <linearGradient id="body" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#f4c542" stop-opacity=".10"/><stop offset="1" stop-color="#f4c542" stop-opacity=".02"/></linearGradient>
    </defs>
    <!-- body: wide soft stroke along the spine, with a fine outline -->
    <path d="${SPINE}" fill="none" stroke="#3a3328" stroke-width="78" stroke-linecap="round"/>
    <path d="${SPINE}" fill="none" stroke="#0b0b0c" stroke-width="76" stroke-linecap="round"/>
    <path d="${SPINE}" fill="none" stroke="url(#body)" stroke-width="76" stroke-linecap="round"/>
    <!-- snout, fins and tail flukes -->
    <path d="M735 262 Q 770 270 790 262 Q 770 252 742 240" fill="none" stroke="#5a4a28" stroke-width="1"/>
    <path d="M540 172 Q 520 120 470 108 Q 505 150 500 178" fill="none" stroke="#5a4a28" stroke-width="1"/>
    <path d="M440 236 Q 430 290 400 312 Q 455 296 470 228" fill="none" stroke="#5a4a28" stroke-width="1"/>
    <path d="M96 96 Q 60 70 40 82 Q 70 92 88 112 M96 96 Q 110 52 98 30 Q 92 64 82 92" fill="none" stroke="#5a4a28" stroke-width="1"/>
    <circle cx="718" cy="236" r="3" fill="#8c6a2a"/>
    <path id="spine" d="${SPINE}" fill="none" stroke="#5a4a28" stroke-width=".8" stroke-dasharray="2 5"/>
    <g id="s-stars"></g>
    <!-- Dhruva, the pole star, at the tail -->
    <g class="s-dhruva" transform="translate(96 96)">
      <circle r="34" fill="url(#dh)" opacity=".55"/><circle r="9" fill="url(#dh)"/>
      <path d="M0 -22 L1.6 -1.6 L22 0 L1.6 1.6 L0 22 L-1.6 1.6 L-22 0 L-1.6 -1.6Z" fill="#fff1c2"/>
      <text x="34" y="-14" font-size="10" letter-spacing="2.5" fill="#f4c542" font-family="Jost, sans-serif">DHRUVA · POLE STAR</text>
    </g>
  </svg>`;
  const spine = $("#spine"), L = spine.getTotalLength();
  let g = "";
  N.forEach((n, i) => {
    const p = spine.getPointAtLength(L * (0.03 + (i / 26) * 0.86));
    const up = i % 2 === 0 ? -14 : 22;
    g += `<g class="s-star" data-id="${n.id}" tabindex="0" role="button" aria-label="${n.en}: open its shloka" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
      <circle r="13" fill="transparent"/><circle class="dot" r="3.2" fill="#ece8df"/>
      <text y="${up}" text-anchor="middle">${n.en}</text></g>`;
  });
  $("#s-stars").innerHTML = g;
  const pick = (e) => { const s = e.target.closest(".s-star"); if (s) openStar(+s.dataset.id); };
  $("#s-stars").addEventListener("click", pick);
  $("#s-stars").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e); } });
})();
function markShishu(id) {
  document.querySelectorAll(".s-star").forEach((s) => {
    const on = +s.dataset.id === id;
    s.classList.toggle("on", on);
    s.querySelector(".dot").setAttribute("fill", on ? "#f4c542" : "#ece8df");
    s.querySelector(".dot").setAttribute("r", on ? 5 : 3.2);
  });
}

/* Vishnu Purana story cards */
$("#vp-cards").insertAdjacentHTML("beforeend", VISHNU_PURANA.map((v) =>
  `<div class="vp-card"><span class="cap">${v.where}</span><h4>${v.title}</h4><p>${v.text}</p></div>`).join(""));

/* ---------------------------------------------------------------
   8b. Solar system intro — planets at their real (mean) positions,
       Earth + Moon, and the ring of 27 nakshatras around everything
   --------------------------------------------------------------- */
(function solar() {
  const cv = document.getElementById("solar"); if (!cv) return;
  const ctx = cv.getContext("2d");
  // mean longitude at J2000 (deg), daily motion (deg/day), distance (AU), size, colour
  const PLANETS = [
    ["Mercury", 252.2509, 4.0923344, 0.39, 2.2, "#b9b2a6"],
    ["Venus", 181.9798, 1.6021302, 0.72, 3.4, "#e9d8a6"],
    ["Earth", 100.4645, 0.9856474, 1.0, 3.8, "#7fb2e5"],
    ["Mars", 355.4330, 0.5240208, 1.52, 3, "#d9774a"],
    ["Jupiter", 34.3515, 0.0830853, 5.2, 6.5, "#d8b98c"],
    ["Saturn", 50.0775, 0.0334443, 9.54, 5.5, "#e6cf98"],
  ];
  let S = 600, dayOffset = 0, playing = false, lastT = 0;
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    S = r.width; cv.width = S * dpr; cv.height = S * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener("resize", size);
  const rad = (a) => (a * Math.PI) / 180;
  const orbitR = (au) => S * 0.07 + Math.sqrt(au) * S * 0.105;

  function draw(t) {
    requestAnimationFrame(draw);
    if (playing) { dayOffset += (t - lastT) / 1000 * 6; if (dayOffset > 30) { dayOffset = 30; playing = false; $("#solar-play").textContent = "Play a month ▸"; } }
    lastT = t;
    const date = new Date(Date.now() + dayOffset * 86400e3);
    const days = (date.getTime() / 86400000 + 2440587.5) - 2451545.0;
    const c = S / 2;
    ctx.clearRect(0, 0, S, S);

    // ring of 27 nakshatras (by ecliptic longitude; sidereal start + ayanamsa)
    const ayan = Astro.ayanamsa(date), R27 = S * 0.47;
    const moonTrop = Astro.moonLongitude(date);
    const now = Astro.moonAt(date);
    ctx.strokeStyle = "#2c2c30"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c, c, R27, 0, 6.283); ctx.stroke();
    for (let k = 0; k < 27; k++) {
      const a0 = rad(k * 13.3333 + ayan), a1 = rad((k + 1) * 13.3333 + ayan), on = k === now.nakshatraIndex;
      if (on) {
        ctx.strokeStyle = "#f4c542"; ctx.lineWidth = 4; ctx.shadowColor = "#f4c542"; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(c, c, R27, -a1, -a0); ctx.stroke(); ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = "#4a4740"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a0) * (R27 - 5), c - Math.sin(a0) * (R27 - 5)); ctx.lineTo(c + Math.cos(a0) * (R27 + 5), c - Math.sin(a0) * (R27 + 5)); ctx.stroke();
      const am = (a0 + a1) / 2, lr = R27 - S * (on ? 0.055 : 0.03), lx = c + Math.cos(am) * lr, ly = c - Math.sin(am) * lr;
      ctx.fillStyle = on ? "#f4c542" : "#6f6b63"; ctx.textAlign = "center";
      ctx.font = `${on ? 500 : 400} ${Math.max(8, Math.round(S * (on ? 0.02 : 0.015)))}px Jost, sans-serif`;
      ctx.fillText(on ? N[k].en.toUpperCase() : String(k + 1), lx, ly + 4);
    }

    // Sun
    const sg = ctx.createRadialGradient(c, c, 0, c, c, S * 0.07);
    sg.addColorStop(0, "#fff6cf"); sg.addColorStop(0.35, "#f4c542"); sg.addColorStop(1, "rgba(244,165,32,0)");
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(c, c, S * 0.07, 0, 6.283); ctx.fill();

    // planets
    let earth = null;
    for (const [name, L0, n, au, r, col] of PLANETS) {
      const R = orbitR(au), L = rad((L0 + n * days) % 360);
      ctx.strokeStyle = name === "Earth" ? "rgba(244,197,66,.55)" : "#1f1f22"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(c, c, R, 0, 6.283); ctx.stroke();
      const x = c + Math.cos(L) * R, y = c - Math.sin(L) * R;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * S / 600, 0, 6.283); ctx.fill();
      if (name === "Saturn") { ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(x, y, r * 2 * S / 600, r * 0.7 * S / 600, -0.4, 0, 6.283); ctx.stroke(); }
      ctx.fillStyle = name === "Earth" ? "#ece8df" : "#6f6b63"; ctx.font = `${Math.max(9, Math.round(S * 0.016))}px Jost, sans-serif`;
      ctx.fillText(name, x, y - r * S / 600 - 7);
      if (name === "Earth") earth = [x, y];
    }

    // Moon around Earth, and the line of sight to its nakshatra
    const mL = rad(moonTrop), mr = S * 0.035;
    const mx = earth[0] + Math.cos(mL) * mr, my = earth[1] - Math.sin(mL) * mr;
    ctx.strokeStyle = "rgba(236,232,223,.25)"; ctx.beginPath(); ctx.arc(earth[0], earth[1], mr, 0, 6.283); ctx.stroke();
    const tx = c + Math.cos(mL) * R27, ty = c - Math.sin(mL) * R27;
    ctx.setLineDash([3, 5]); ctx.strokeStyle = "rgba(244,197,66,.6)"; ctx.beginPath(); ctx.moveTo(earth[0], earth[1]); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#ece8df"; ctx.beginPath(); ctx.arc(mx, my, 3.2 * S / 600, 0, 6.283); ctx.fill();

    $("#solar-now").innerHTML = `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}: the Moon is in <b>${N[now.nakshatraIndex].en}</b>, ${now.phaseName.toLowerCase()}.`;
  }
  requestAnimationFrame(draw);
  $("#solar-play").addEventListener("click", () => {
    if (dayOffset >= 30) dayOffset = 0;
    playing = !playing; $("#solar-play").textContent = playing ? "Pause ❚❚" : "Play a month ▸";
  });
  $("#solar-today").addEventListener("click", () => { dayOffset = 0; playing = false; $("#solar-play").textContent = "Play a month ▸"; });
})();

/* ---------------------------------------------------------------
   9. Start: time machine on today, example birth star shown
   --------------------------------------------------------------- */
updateTM();
showResult(true);
syncBar();

/* index.html?star=8 opens that star straight away (used by the Festival Calendar) */
(function openFromLink() {
  const id = +new URLSearchParams(location.search).get("star");
  if (id >= 1 && id <= 27) { highlightChip(id); setTimeout(() => openStar(id), 300); }
})();
