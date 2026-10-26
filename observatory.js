/* =====================================================================
   observatory.js — The Lost Observatory
   Five gates (riddles from the project's research) → final gate: find
   Dhruva, the one star that does not move → the observatory opens.
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const DEV = ["१", "२", "३", "४", "५", "६"];

const GATES = [
  { title: "Gate of the Moon", story: "The first seal shows the Moon walking a road of stars, resting in a new mansion each night.",
    q: "How many mansions does the Moon visit on its road around the sky?", type: "number", answer: 27,
    hint: "The Moon circles the sky in about 27.3 days.", learn: "Correct. 27 nakshatras, each spanning 13°20′ of the sky." },
  { title: "Gate of Quarters", story: "Each mansion on the seal is cut into four equal pieces, the padas.",
    q: "How many padas are there in the whole sky?", type: "number", answer: 108,
    hint: "27 mansions × 4 quarters.", learn: "Correct. 108 padas, the same as the 108 main verses of the Vishnu Sahasranama." },
  { title: "Gate of Love", story: "The third seal tells of Chandra, the Moon, who married the 27 daughters of Daksha but loved only one.",
    q: "Who was the Moon's favourite, whose love brought Daksha's curse?", type: "choice", choices: ["Krittika", "Rohini", "Chitra", "Revati"], answer: "Rohini",
    hint: "Her name means 'the red one'; her star is Aldebaran.", learn: "Correct. Because of the curse, the Moon wanes and grows back every month." },
  { title: "Gate of Vishnu", story: "The fourth seal is carved with three giant footsteps, the strides of Vamana across the worlds.",
    q: "Which nakshatra is ruled by Vishnu himself?", type: "choice", choices: ["Ashwini", "Magha", "Shravana", "Pushya"], answer: "Shravana",
    hint: "Kerala celebrates Onam on this star, called Thiruvonam.", learn: "Correct. Shravana's deity is Vishnu, and its symbol includes three footprints." },
  { title: "Gate of the Verse", story: "The last seal holds a Sanskrit verse. The rule on the stone reads: star N begins at verse 4 × (N − 1) + 1.",
    q: "Rohini is star number 4. Which verse of the Vishnu Sahasranama is her first shloka?", type: "number", answer: 13,
    hint: "4 × (4 − 1) + 1.", learn: "Correct. Verse 13: रुद्रो बहुशिरा बभ्रुर्विश्वयोनिः…" },
];

let step = 0, started = Date.now();
try { const s = JSON.parse(localStorage.getItem("vishnustra-observatory") || "null"); if (s) { step = s.step; started = s.started; } } catch {}
const save = () => { try { localStorage.setItem("vishnustra-observatory", JSON.stringify({ step, started })); } catch {} };

function renderSeals() {
  const items = [...GATES.map((g) => g.title), "Find Dhruva"];
  $("#seals").innerHTML = items.map((t, i) =>
    `<div class="seal ${i < step ? "done" : i === step ? "now" : ""}"><span class="num">${i < step ? "✓" : DEV[i]}</span><span class="lbl">${t}</span></div>`).join("");
}

function render() {
  renderSeals();
  const st = $("#stage");
  if (step < GATES.length) {
    const g = GATES[step];
    st.innerHTML = `
      <span class="eyebrow">Gate ${step + 1} of 6</span>
      <h2>${g.title}</h2>
      <p class="story">${g.story}</p>
      <p class="q">${g.q}</p>
      ${g.type === "choice"
        ? `<div class="choices">${g.choices.map((c) => `<button type="button" data-c="${c}">${c}</button>`).join("")}</div>`
        : `<form class="answer-row" id="ans"><label for="a-in" class="cap" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Answer</label><input id="a-in" inputmode="numeric" autocomplete="off" placeholder="?"><button class="btn solid" type="submit">Break the seal</button></form>`}
      <div class="row" style="margin-top:14px"><button class="btn" type="button" id="hint">Hint</button></div>
      <div class="feedback" id="fb"></div>`;
    const check = (val) => {
      const ok = g.type === "number" ? Number(String(val).trim()) === g.answer : val === g.answer;
      const fb = $("#fb");
      if (ok) {
        fb.className = "feedback good"; fb.textContent = g.learn + " The seal breaks…";
        st.querySelectorAll("button, input").forEach((el) => (el.disabled = true));
        setTimeout(() => { step++; save(); render(); }, 1800);
      } else {
        fb.className = "feedback bad"; fb.textContent = "The seal holds. Try again, or take a hint.";
      }
    };
    if (g.type === "choice") st.querySelector(".choices").addEventListener("click", (e) => { if (e.target.dataset.c) check(e.target.dataset.c); });
    else { $("#ans").addEventListener("submit", (e) => { e.preventDefault(); check($("#a-in").value); }); $("#a-in").focus({ preventScroll: true }); }
    $("#hint").addEventListener("click", () => { const fb = $("#fb"); fb.className = "feedback"; fb.textContent = "Hint: " + g.hint; });
  } else if (step === GATES.length) {
    renderDhruva(st);
  } else {
    renderWin(st);
  }
}

/* ---------- Gate 6: find the star that doesn't move ---------- */
let raf = 0;
function renderDhruva(st) {
  st.innerHTML = `
    <span class="eyebrow">Gate 6 of 6</span>
    <h2>Find Dhruva</h2>
    <p class="story">The door opens onto the night sky. Every star wheels slowly across it except one. The Vishnu Purana places it at the tail of Shishumara, the still point of the heavens.</p>
    <p class="q">Watch the sky, then tap the one star that never moves.</p>
    <canvas class="stage" id="dhruva-cv" aria-label="A rotating starfield. Tap the star that stays still."></canvas>
    <div class="feedback" id="fb"></div>`;
  const cv = $("#dhruva-cv"), ctx = cv.getContext("2d");
  let W, H, pole;
  const stars = Array.from({ length: 240 }, () => ({ r: Math.random(), a: Math.random() * 6.283, m: Math.random() }));
  function size() {
    const b = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = b.width; H = b.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pole = { x: W * 0.63, y: H * 0.38 };
  }
  size(); addEventListener("resize", size);
  function draw(t) {
    raf = requestAnimationFrame(draw);
    ctx.fillStyle = "#050507"; ctx.fillRect(0, 0, W, H);
    const R = Math.hypot(W, H);
    const rot = t / 9000;
    for (const s of stars) {
      const rr = 20 + s.r * R, a = s.a + rot;
      const x = pole.x + Math.cos(a) * rr, y = pole.y + Math.sin(a) * rr;
      if (x < -5 || y < -5 || x > W + 5 || y > H + 5) continue;
      ctx.globalAlpha = 0.35 + s.m * 0.65;
      ctx.fillStyle = s.m > 0.85 ? "#f4c542" : "#fff3d0";
      ctx.beginPath(); ctx.arc(x, y, s.m > 0.92 ? 2 : 1.2, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Dhruva: same size as the bright stars, so it has to be found by watching
    ctx.fillStyle = "#fff3d0"; ctx.beginPath(); ctx.arc(pole.x, pole.y, 2.1, 0, 6.283); ctx.fill();
  }
  raf = requestAnimationFrame(draw);
  cv.addEventListener("click", (e) => {
    const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    const fb = $("#fb");
    if (Math.hypot(x - pole.x, y - pole.y) < 22) {
      cancelAnimationFrame(raf);
      fb.className = "feedback good"; fb.textContent = "You found Dhruva, the pole star. The observatory awakens…";
      setTimeout(() => { step++; save(); render(); }, 1600);
    } else {
      fb.className = "feedback bad"; fb.textContent = "That star is moving with the others. Look for the one that stays still.";
    }
  });
}

/* ---------- the open observatory ---------- */
function renderWin(st) {
  const mins = Math.max(1, Math.round((Date.now() - started) / 60000));
  st.innerHTML = `
    <div class="win">
      <svg width="100%" viewBox="0 0 520 220" style="max-width:520px" role="img" aria-label="The observatory, a giant stone sundial, glowing at dawn">
        <defs>
          <radialGradient id="sun" cx=".7" cy=".55" r=".5"><stop offset="0" stop-color="#ffe7a0"/><stop offset=".35" stop-color="#f4c542" stop-opacity=".6"/><stop offset="1" stop-color="#f4c542" stop-opacity="0"/></radialGradient>
          <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2f1c"/><stop offset="1" stop-color="#14100a"/></linearGradient>
        </defs>
        <rect width="520" height="220" fill="#07060a"/>
        <circle cx="370" cy="120" r="110" fill="url(#sun)"/>
        <path d="M60 200 L260 40 L280 40 L280 200 Z" fill="url(#stone)" stroke="#8c6a2a"/>
        <g stroke="#f4c542" stroke-width="1" opacity=".7">${Array.from({ length: 12 }, (_, i) => `<line x1="${70 + i * 17}" y1="${192 - i * 13.4}" x2="${84 + i * 17}" y2="${192 - i * 13.4}"/>`).join("")}</g>
        <path d="M280 200 A 120 120 0 0 1 400 80 L400 200 Z" fill="url(#stone)" stroke="#8c6a2a" opacity=".9"/>
        <path d="M290 200 A 110 110 0 0 1 400 90" fill="none" stroke="#f4c542" stroke-dasharray="2 6"/>
        <rect x="0" y="200" width="520" height="20" fill="#0d0b08"/>
        <circle cx="268" cy="28" r="3" fill="#fff1c2"/><circle cx="268" cy="28" r="10" fill="#f4c542" opacity=".25"/>
      </svg>
      <span class="eyebrow">All six seals broken · ${mins} min</span>
      <h2 style="margin:0">The observatory is open</h2>
      <p class="story" style="margin:0 auto">Its great stone sundial, like the Samrat Yantra at Jantar Mantar, catches the first light. You read the sky the way the old astronomers did.</p>
      <form class="row" id="cert-form" style="justify-content:center">
        <div class="field" style="min-width:220px"><label for="cert-name">Your name for the certificate</label><input id="cert-name" maxlength="28" placeholder="e.g. Priya"></div>
        <button class="btn solid" type="submit" style="align-self:flex-end">Make my certificate</button>
      </form>
      <div class="cert" id="cert" hidden></div>
    </div>`;
  $("#cert-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = ($("#cert-name").value.trim() || "Sky-watcher").replace(/[<>&]/g, "");
    API.save("/certificates", { name, minutes: mins });
    $("#cert").hidden = false;
    $("#cert").innerHTML = `<p class="cap muted" style="margin:0">Vishnustra · The Lost Observatory</p>
      <div class="title" style="margin-top:10px">${name}</div>
      <p style="margin:8px 0 0">is named a <b class="gold" style="font-weight:500">Rishi of the Sky</b></p>
      <p class="muted" style="margin:10px 0 0;font-size:12px">for breaking all six seals and finding Dhruva · ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p class="deva gold" style="margin:12px 0 0">ध्रुवं पश्यामि</p>`;
  });
}

$("#restart").addEventListener("click", () => { cancelAnimationFrame(raf); step = 0; started = Date.now(); save(); render(); });
render();
