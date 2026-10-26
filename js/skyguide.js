/* =====================================================================
   skyguide.js — Sky Guide page
   A live dome of your sky (any place, any night) with the 27 nakshatras,
   plus when / where / how to see each one, and how many real stars your
   sky shows right now. Uses SkyCalc + SKYGUIDE + the catalogue in data/skystars.js.
   ===================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const HOUR = 3600000, MIN = 60000;
  const N = NAKSHATRAS;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } } };

  const fmt = (t) => t ? new Date(t).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).replace(/\s?([ap])\.?m\.?/i, (m, a) => " " + a.toLowerCase() + "m") : "—";
  const istISO = (t) => new Date(t + 5.5 * HOUR).toISOString().slice(0, 10);
  const DIRS = ["North", "North-east", "East", "South-east", "South", "South-west", "West", "North-west"];
  const dir = (az) => DIRS[Math.round(az / 45) % 8];
  const height = (alt) => alt > 70 ? "almost overhead" : alt > 45 ? "high up" : alt > 20 ? "halfway up" : "low";
  const bright = (m) => m < 1 ? "Very bright" : m < 2 ? "Bright" : m < 3 ? "Easy from a town" : m < 4.5 ? "Needs a dark sky" : "Very faint";

  /* ---------- the real star catalogue (data/skystars.js) ---------- */
  const D2R = Math.PI / 180;
  const CAT = (() => {
    const n = SKYSTARS.length / 3, ra = new Float32Array(n), sd = new Float32Array(n), cd = new Float32Array(n), m = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      ra[i] = SKYSTARS[i * 3]; const d = SKYSTARS[i * 3 + 1] * D2R;
      sd[i] = Math.sin(d); cd[i] = Math.cos(d); m[i] = SKYSTARS[i * 3 + 2];
    }
    return { n, ra, sd, cd, m };
  })();
  // faintest star the eye can see, for each kind of sky (magnitude)
  const SKY_TYPES = [["Big city (like Surat centre)", 3.8], ["Town or suburb", 4.8], ["Village", 5.5], ["Dark hills (like Saputara)", 6.0]];
  let skyType = +(store.get("vs-skytype") ?? 0) || 0;
  $("#skytype").innerHTML = SKY_TYPES.map((x, i) => `<option value="${i}">${x[0]}</option>`).join("");
  $("#skytype").value = String(skyType);
  let western = store.get("vs-western") !== "0";
  $("#western").checked = western;

  /* How faint can you see right now? Sky glow, twilight and moonlight all count. */
  function limitMag(P, t) {
    const base = SKY_TYPES[skyType][1];
    if (P.sun.alt > -0.8) return -5;                                     // daytime
    const f = Math.min(1, Math.max(0, (-P.sun.alt - 2) / 14));          // twilight → full dark at −16°
    let lim = 0.5 + f * (base - 0.5);
    if (P.moon.alt > 0) lim -= Astro.moonAt(new Date(t)).illumination * Math.max(0, base - 3) * 0.5;
    return lim;
  }
  // Stars near the horizon look fainter: their light crosses more air (≈ 0.28 mag per air-mass)
  const dimming = (alt) => 0.28 * (1 / Math.sin(Math.max(alt, 1) * D2R) - 1);

  /* every catalogue star at time t → callback(alt, az, effectiveMag, mag) for those above the horizon */
  function eachStar(t, cb) {
    const lst = SkyCalc.gmst(t) + place.lon, sp = Math.sin(place.lat * D2R), cp = Math.cos(place.lat * D2R);
    for (let i = 0; i < CAT.n; i++) {
      const H = (lst - CAT.ra[i]) * D2R, cH = Math.cos(H);
      const sa = sp * CAT.sd[i] + cp * CAT.cd[i] * cH;
      if (sa <= 0) continue;
      const alt = Math.asin(sa) / D2R;
      const az = (Math.atan2(-CAT.cd[i] * Math.sin(H), CAT.sd[i] * cp - CAT.cd[i] * cH * sp) / D2R + 360) % 360;
      cb(alt, az, CAT.m[i] + dimming(alt), CAT.m[i]);
    }
  }
  const altAzOf = (ra, dec, t) => SkyCalc.altAz(ra, dec, t, place.lat, place.lon);

  /* ---------- state ---------- */
  let place = { name: CITIES[0][0], lat: CITIES[0][1], lon: CITIES[0][2] };
  let dateISO, minutes, nightInfo, rows = [], selected = 0, filter = "all";

  const sel = $("#place");
  sel.innerHTML = CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join("") + `<option value="me" hidden>My location</option>`;
  const saved = store.get("vs-place");
  if (saved) { try { const p = JSON.parse(saved); if (p && typeof p.lat === "number") place = p; } catch { /* ignore */ } }
  const ci = CITIES.findIndex((c) => c[0] === place.name);
  sel.value = ci >= 0 ? String(ci) : "me";
  if (ci < 0) { sel.querySelector('[value="me"]').hidden = false; sel.querySelector('[value="me"]').textContent = place.name; }

  function setNow() {
    const now = Date.now();
    // before noon IST we are still in the previous evening's night
    const nightStart = Date.parse(istISO(now) + "T12:00:00+05:30");
    const start = now < nightStart ? nightStart - 24 * HOUR : nightStart;
    dateISO = istISO(start);
    minutes = Math.round((now - start) / MIN / 5) * 5;
    $("#date").value = dateISO;
    $("#time").value = minutes;
  }
  const timeNow = () => Date.parse(dateISO + "T12:00:00+05:30") + minutes * MIN;

  /* ---------- the night: sunset, star table ---------- */
  function computeNight() {
    nightInfo = SkyCalc.night(dateISO, place.lat, place.lon);
    const year = +dateISO.slice(0, 4);
    rows = N.map((n) => {
      const y = YOGATARA[n.id];
      return { n, y, g: SKYGUIDE[n.id], night: SkyCalc.starNight(y.ra, y.dec, nightInfo, place.lat, place.lon), season: SkyCalc.seasons(y.ra, year) };
    });
    const t = timeNow();
    const moonId = Astro.moonAt(new Date(t)).nakshatraId;
    const lit = Math.round(Astro.moonAt(new Date(t)).illumination * 100);
    $("#night-line").innerHTML = `<span>${place.name} · ${place.lat.toFixed(2)}°, ${place.lon.toFixed(2)}°</span>
      <span>Sunset <b>${fmt(nightInfo.sunset)}</b></span><span>Dark from <b>${fmt(nightInfo.dark)}</b></span>
      <span>Dawn <b>${fmt(nightInfo.dawn)}</b></span><span>Sunrise <b>${fmt(nightInfo.sunrise)}</b></span>
      <span>Moon in <b>${N[moonId - 1].en}</b>, ${lit}% lit</span>`;
  }

  /* ---------- positions at the chosen moment ---------- */
  function positions(t) {
    const sunEq = SkyCalc.sunEq(t), moonEq = SkyCalc.moonEq(t);
    return {
      sun: SkyCalc.altAz(sunEq.ra, sunEq.dec, t, place.lat, place.lon),
      moon: { ...SkyCalc.altAz(moonEq.ra, moonEq.dec, t, place.lat, place.lon), ...moonEq },
      stars: rows.map((r) => ({ ...SkyCalc.altAz(r.y.ra, r.y.dec, t, place.lat, place.lon), id: r.n.id })),
    };
  }

  /* ---------- the dome ---------- */
  const cv = $("#dome"), ctx = cv.getContext("2d");
  let W = 0, R = 0, CX = 0, CY = 0, hits = [];

  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = cv.clientWidth;
    cv.width = w * dpr; cv.height = w * dpr;
    W = cv.width; R = W / 2 - 34 * dpr; CX = CY = W / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const proj = (alt, az) => { const r = R * (90 - alt) / 90, a = az * Math.PI / 180; return [CX - r * Math.sin(a), CY - r * Math.cos(a)]; };

  function draw() {
    if (!W) return;
    const dpr = W / cv.clientWidth, t = timeNow(), P = positions(t);
    ctx.clearRect(0, 0, W, W);
    // sky colour from the Sun's height
    const s = P.sun.alt, day = Math.max(0, Math.min(1, (s + 12) / 14));
    const sky = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    sky.addColorStop(0, `rgb(${8 + 30 * day},${10 + 50 * day},${22 + 80 * day})`);
    sky.addColorStop(1, `rgb(${14 + 50 * day},${16 + 60 * day},${30 + 80 * day})`);
    ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.clip();

    // altitude rings + direction lines
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = dpr;
    ctx.setLineDash([3 * dpr, 6 * dpr]);
    for (const a of [30, 60]) { ctx.beginPath(); ctx.arc(CX, CY, R * (90 - a) / 90, 0, 7); ctx.stroke(); }
    for (let az = 0; az < 360; az += 45) { const [x, y] = proj(0, az); ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.setLineDash([]);

    // real stars: bright enough for your sky = clear; too faint = a ghost dot
    const lim = limitMag(P, t);
    eachStar(t, (alt, az, me, m) => {
      const [x, y] = proj(alt, az), seen = me <= lim;
      if (!seen && day > 0.6) return;
      ctx.globalAlpha = seen ? Math.min(1, 0.55 + (lim - me) * 0.25) : 0.13;
      ctx.fillStyle = seen ? "#f1ede4" : "#9aa3c0";
      ctx.beginPath(); ctx.arc(x, y, (0.45 + Math.max(0, 6.2 - m) * 0.36) * dpr, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // modern (Western) constellation lines, faint
    const line = (pts, style, width) => {
      ctx.strokeStyle = style; ctx.lineWidth = width * dpr; ctx.beginPath();
      let pen = false;
      for (const [ra, dec] of pts) {
        const p = altAzOf(ra, dec, t);
        if (p.alt < -3) { pen = false; continue; }
        const [x, y] = proj(Math.max(p.alt, -3), p.az);
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
      }
      ctx.stroke();
    };
    if (western) for (const id in CONLINES) for (const seg of CONLINES[id]) line(seg, "rgba(150,170,235,.22)", 0.8);

    // the 27 nakshatras: their real star shapes, in gold
    for (const id in NAKFIGURES) {
      const f = NAKFIGURES[id], on = +id === selected;
      if (f.lines) for (const seg of f.lines) line(seg, on ? "rgba(255,231,160,.95)" : "rgba(244,197,66,.6)", on ? 2.2 : 1.4);
      for (const [ra, dec] of (f.dots || [])) {
        const p = altAzOf(ra, dec, t); if (p.alt < 0) continue;
        const [x, y] = proj(p.alt, p.az);
        ctx.fillStyle = on ? "#ffe7a0" : "rgba(244,197,66,.85)"; ctx.beginPath(); ctx.arc(x, y, 1.6 * dpr, 0, 7); ctx.fill();
      }
    }

    // ecliptic: the road of the Sun, Moon and the 27 nakshatras
    ctx.strokeStyle = "rgba(244,197,66,.35)"; ctx.setLineDash([5 * dpr, 6 * dpr]); ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath(); let pen = false;
    for (let l = 0; l <= 360; l += 2) {
      const e = SkyCalc.eclToEq(l), p = SkyCalc.altAz(e.ra, e.dec, t, place.lat, place.lon);
      if (p.alt < -2) { pen = false; continue; }
      const [x, y] = proj(Math.max(p.alt, 0), p.az);
      pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
    }
    ctx.stroke(); ctx.setLineDash([]);

    // Dhruva (Polaris)
    const pol = SkyCalc.altAz(DHRUVA.ra, DHRUVA.dec, t, place.lat, place.lon);
    if (pol.alt > 0) {
      const [x, y] = proj(pol.alt, pol.az);
      ctx.fillStyle = "#cfe3ff"; ctx.beginPath(); ctx.arc(x, y, 2.6 * dpr, 0, 7); ctx.fill();
      ctx.font = `${10 * dpr}px Jost, sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = "rgba(207,227,255,.8)";
      ctx.fillText("Dhruva (Pole Star)", x, y - 8 * dpr);
    }

    // nakshatras
    hits = [];
    for (const st of P.stars) {
      if (st.alt < 0) continue;
      const [x, y] = proj(st.alt, st.az), g = SKYGUIDE[st.id], on = st.id === selected;
      const rad = Math.max(1.8, 4.6 - g.mag * 0.7) * dpr;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, rad * (on ? 6 : 3.5));
      glow.addColorStop(0, on ? "rgba(255,231,160,.65)" : "rgba(244,197,66,.25)"); glow.addColorStop(1, "rgba(244,197,66,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, rad * (on ? 6 : 3.5), 0, 7); ctx.fill();
      ctx.fillStyle = on ? "#ffe7a0" : "#f4c542"; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
      if (on) {
        ctx.strokeStyle = "rgba(255,231,160,.9)"; ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath(); ctx.arc(x, y, 15 * dpr, 0, 7); ctx.stroke();
      }
      hits.push({ id: st.id, x, y, on });
    }

    // Moon (with its phase)
    let moonBox = null;
    if (P.moon.alt > -1) {
      const [x, y] = proj(Math.max(0, P.moon.alt), P.moon.az), m = Astro.moonAt(new Date(t)), r = 9 * dpr;
      ctx.fillStyle = "rgba(236,232,223,.18)"; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, 7); ctx.fill();
      const dark = "#2a2a30", light = "#ece8df";
      ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !m.waxing); ctx.fill(); // lit half
      const w = r * Math.abs(Math.cos(m.elongation * Math.PI / 180));                              // terminator
      ctx.fillStyle = m.illumination > 0.5 ? light : dark;
      ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, w), r, 0, 0, 7); ctx.fill();
      ctx.font = `${10.5 * dpr}px Jost, sans-serif`; ctx.fillStyle = "#ece8df"; ctx.textAlign = "center";
      ctx.fillText("Moon", x, y - 15 * dpr);
      moonBox = { x1: x - 22 * dpr, x2: x + 22 * dpr, y1: y - 28 * dpr, y2: y + r + 2 * dpr };
    }
    // Sun, if it is up
    if (P.sun.alt > -1) {
      const [x, y] = proj(Math.max(0, P.sun.alt), P.sun.az);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 40 * dpr);
      g.addColorStop(0, "rgba(255,220,120,.9)"); g.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 40 * dpr, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff1c4"; ctx.beginPath(); ctx.arc(x, y, 10 * dpr, 0, 7); ctx.fill();
    }
    ctx.restore();

    // labels, moved around so they don't sit on top of each other
    const boxes = moonBox ? [moonBox] : [];
    const free = (b) => boxes.every((o) => b.x2 < o.x1 || b.x1 > o.x2 || b.y2 < o.y1 || b.y1 > o.y2);
    for (const h of [...hits].sort((a, b) => b.on - a.on)) {
      const name = N[h.id - 1].en, fs = (h.on ? 13 : 10.5) * dpr;
      ctx.font = `${h.on ? 500 : 400} ${fs}px Jost, sans-serif`;
      const w = ctx.measureText(name).width, gap = (h.on ? 20 : 9) * dpr;
      const tries = [[0, gap + fs * 0.8], [0, -gap], [w / 2 + gap, fs * 0.35], [-w / 2 - gap, fs * 0.35], [0, gap + fs * 1.9], [0, -gap - fs * 1.1]];
      let pick = null;
      for (const [dx, dy] of tries) {
        const cx = Math.min(W - w / 2 - 4, Math.max(w / 2 + 4, h.x + dx)) - h.x;
        const b = { x1: h.x + cx - w / 2 - 2, x2: h.x + cx + w / 2 + 2, y1: h.y + dy - fs, y2: h.y + dy + 2 };
        if (free(b)) { pick = [cx, dy]; break; }
      }
      if (!pick) { if (!h.on) continue; pick = tries[0]; } // no room: skip the label (tap the star to see it)
      boxes.push({ x1: h.x + pick[0] - w / 2 - 2, x2: h.x + pick[0] + w / 2 + 2, y1: h.y + pick[1] - fs, y2: h.y + pick[1] + 2 });
      ctx.fillStyle = h.on ? "#ffe7a0" : "rgba(236,232,223,.78)"; ctx.textAlign = "center";
      ctx.fillText(name, h.x + pick[0], h.y + pick[1]);
    }

    // horizon ring + compass letters
    ctx.strokeStyle = "rgba(244,197,66,.55)"; ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.stroke();
    ctx.font = `500 ${13 * dpr}px Jost, sans-serif`; ctx.fillStyle = "#f4c542"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(([l, az]) => {
      const a = az * Math.PI / 180, r = R + 18 * dpr; ctx.fillText(l, CX - r * Math.sin(a), CY - r * Math.cos(a));
    });
    ctx.textBaseline = "alphabetic";

    $("#time-label").textContent = fmt(t);
  }

  /* ---------- detail panel ---------- */
  function months(t, spread) {
    const d = new Date(t), m = d.getUTCMonth();
    if (!spread) return MONTH[m];
    return `${MON[(m + 11) % 12]} – ${MON[(m + 1) % 12]}`;
  }
  function statusAt(r, P) {
    const p = P.stars[r.n.id - 1];
    if (p.alt < 0) return { up: false, text: "Below the horizon right now" };
    if (P.sun.alt > -6) return { up: false, text: `Above the horizon, ${dir(p.az)}, but the sky is too bright` };
    return { up: true, text: `Up now · ${Math.round(p.alt)}° high · ${dir(p.az)}` };
  }
  function tonightText(r) {
    const nt = r.night;
    if (nt.never) return "Never rises from here";
    if (!nt.visibleTonight) return Math.abs(new Date(timeNow()).getUTCMonth() - new Date(r.season.hidden).getUTCMonth()) <= 1 ? "Not tonight: too close to the Sun" : "Not tonight: only up in daylight";
    const p = SkyCalc.altAz(r.y.ra, r.y.dec, nt.best, place.lat, place.lon);
    return `Best at ${fmt(nt.best)}, ${height(p.alt)} in the ${dir(p.az)}`;
  }

  function showDetail(P) {
    const r = rows[selected - 1]; if (!r) return;
    const st = statusAt(r, P), nt = r.night;
    const best = nt.visibleTonight ? SkyCalc.altAz(r.y.ra, r.y.dec, nt.best, place.lat, place.lon) : null;
    const moonSep = SkyCalc.sep(P.moon.ra, P.moon.dec, r.y.ra, r.y.dec);
    $("#detail").innerHTML = `
      <div class="d-head">
        <div class="ring">${shapeSVG(r.n.id, { size: 62, hot: true })}</div>
        <div>
          <div class="eyebrow">Nakshatra ${String(r.n.id).padStart(2, "0")} of 27 · main star ${r.y.star}</div>
          <div class="d-name">${r.n.en}<span class="deva">${r.n.sa}</span></div>
          <div class="cap muted" style="margin-top:6px;font-size:9.5px">${r.n.symbol} · ${r.n.deity.split(" (")[0]}</div>
        </div>
      </div>
      <span class="chip status ${st.up ? "up" : ""}">${st.up ? '<span class="dot"></span>' : ""}${st.text}</span>
      <div class="d-facts">
        <div><div class="k">Rises</div><div class="v">${nt.always ? "Always up" : nt.never ? "Never" : fmt(nt.rise)}</div></div>
        <div><div class="k">Sets</div><div class="v">${nt.always ? "Never sets" : nt.never ? "—" : fmt(nt.set)}</div></div>
        <div><div class="k">Best tonight</div><div class="v">${best ? `${fmt(nt.best)}<small>${Math.round(best.alt)}° high · ${dir(best.az)}</small>` : "Not tonight"}</div></div>
        <div><div class="k">Brightness</div><div class="v">${bright(r.g.mag)}<small>magnitude ${r.g.mag.toFixed(1)}</small></div></div>
        <div><div class="k">Evening sky</div><div class="v">${months(r.season.evening, true)}<small>high in the south at 9 pm</small></div></div>
        <div><div class="k">Hidden by Sun</div><div class="v">${months(r.season.hidden)}<small>lost in the Sun's glare</small></div></div>
      </div>
      <div class="howto"><div class="cap gold">What you'll see</div><p>${r.g.see}</p></div>
      <div class="howto"><div class="cap gold">How to find it</div><p>${r.g.find}</p></div>
      ${moonSep < 14 ? `<div class="moon-note">☾ The Moon is right next to ${r.n.en} at this time (${Math.round(moonSep)}° away). It points the way, but its glow hides faint stars.</div>` : ""}
      <div class="row">
        <a class="btn" href="index.html?star=${r.n.id}">Story &amp; shloka →</a>
        <a class="btn" href="portal.html">Sky Portal on your phone</a>
      </div>`;
  }

  /* ---------- the list of 27 ---------- */
  function showList(P) {
    $("#list").innerHTML = rows.filter((r) => {
      if (filter === "now") return statusAt(r, P).up;
      if (filter === "night") return r.night.visibleTonight;
      if (filter === "no") return !r.night.visibleTonight;
      return true;
    }).map((r) => {
      const st = statusAt(r, P);
      return `<button class="s-card${r.n.id === selected ? " on" : ""}" type="button" data-id="${r.n.id}">
        <span>${shapeSVG(r.n.id, { size: 48, hot: st.up })}</span>
        <span><span class="nm">${r.n.en}</span>
          <span class="st" style="display:block">${st.up ? `<span class="dot-up"></span><b>${st.text}</b>` : st.text}</span>
          <span class="st" style="display:block">${tonightText(r)}</span></span>
      </button>`;
    }).join("") || `<p class="muted">None at this time. Try moving the time slider.</p>`;
  }

  /* ---------- how many stars above you? ---------- */
  function showAbove(P) {
    const t = timeNow(), lim = limitMag(P, t);
    let up = 0, seen = 0;
    eachStar(t, (alt, az, me, m) => { up++; if (me <= lim && alt > 2) seen++; });
    $("#above-place").textContent = place.name.split(" (")[0];
    $("#above-time").textContent = new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) + " IST";
    $("#c-seen").textContent = seen.toLocaleString("en-IN");
    const why = P.sun.alt > -0.8 ? "The Sun is up, so no stars until dusk."
      : P.sun.alt > -12 ? "Twilight: more stars appear as the sky darkens."
      : P.moon.alt > 0 && Astro.moonAt(new Date(t)).illumination > 0.5 ? "The bright Moon is up and hides the faint ones."
      : "";
    $("#c-seen-sub").textContent = `Out of ${up.toLocaleString("en-IN")} stars above the horizon that a perfect dark sky would show. ${why} Change "Your sky" to compare.`;
    const cons = Object.entries(CONNAMES).map(([id, c]) => ({ id, c, alt: altAzOf(c[2], c[3], t).alt })).filter((x) => x.alt > 0).sort((a, b) => b.alt - a.alt);
    $("#c-cons").textContent = cons.length;
    $("#c-nak").textContent = P.stars.filter((x) => x.alt > 0).length;
    $("#con-list").innerHTML = cons.map((x) => `<span>${x.c[0]}${x.c[1] ? `<span class="deva">${x.c[1]}</span>` : ""}</span>`).join("");
    const bs = BRIGHTSTARS.map(([ra, dec, m, name]) => ({ name, m, ...altAzOf(ra, dec, t) }))
      .filter((b) => b.alt > 3).slice(0, 9);
    $("#bright-list").innerHTML = bs.length ? bs.map((b) => `<div class="b-row"><span>${b.name} <span class="muted" style="font-size:11px">mag ${b.m.toFixed(1)}</span></span><span class="w">${height(b.alt)} · ${dir(b.az)}</span></div>`).join("")
      : `<p class="muted" style="margin:0">No bright stars above the horizon.</p>`;
  }

  /* ---------- update everything ---------- */
  function render(full) {
    if (full) computeNight();
    const P = positions(timeNow());
    if (!selected) {
      // start with the highest nakshatra in the sky, or the Moon's star
      const up = P.stars.filter((s) => s.alt > 10).sort((a, b) => b.alt - a.alt)[0];
      selected = P.sun.alt < -6 && up ? up.id : Astro.moonAt(new Date(timeNow())).nakshatraId;
    }
    draw(); showDetail(P); showList(P); showAbove(P);
  }

  /* ---------- controls ---------- */
  sel.addEventListener("change", () => {
    if (sel.value === "me") return;
    const c = CITIES[+sel.value];
    place = { name: c[0], lat: c[1], lon: c[2] };
    store.set("vs-place", JSON.stringify(place));
    render(true);
  });
  $("#locate").addEventListener("click", () => {
    const b = $("#locate");
    if (!navigator.geolocation) { b.textContent = "Not available"; return; }
    b.textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition((pos) => {
      place = { name: "My location", lat: pos.coords.latitude, lon: pos.coords.longitude };
      const o = sel.querySelector('[value="me"]'); o.hidden = false; o.textContent = "My location"; sel.value = "me";
      store.set("vs-place", JSON.stringify(place));
      b.textContent = "⌖ My location";
      render(true);
    }, () => { b.textContent = "Location blocked"; setTimeout(() => (b.textContent = "⌖ My location"), 2500); }, { timeout: 10000 });
  });
  $("#skytype").addEventListener("change", (e) => { skyType = +e.target.value; store.set("vs-skytype", String(skyType)); render(false); });
  $("#western").addEventListener("change", (e) => { western = e.target.checked; store.set("vs-western", western ? "1" : "0"); draw(); });
  $("#date").addEventListener("change", (e) => { if (!e.target.value) return; dateISO = e.target.value; render(true); });
  $("#now").addEventListener("click", () => { stop(); setNow(); render(true); });
  let listTimer = 0;
  $("#time").addEventListener("input", (e) => {
    minutes = +e.target.value; const P = positions(timeNow());
    draw(); showDetail(P);
    clearTimeout(listTimer); listTimer = setTimeout(() => { showList(P); showAbove(P); }, 150);
  });

  // play through the night
  let playing = 0;
  function stop() { cancelAnimationFrame(playing); playing = 0; $("#play").textContent = "▶"; }
  $("#play").addEventListener("click", () => {
    if (playing) return stop();
    $("#play").textContent = "❚❚";
    let last = 0;
    const step = (ts) => {
      if (ts - last > 40) {
        last = ts; minutes = (minutes + 5) % 1445; $("#time").value = minutes;
        const P = positions(timeNow()); draw(); if (minutes % 30 === 0) { showDetail(P); showList(P); showAbove(P); }
      }
      playing = requestAnimationFrame(step);
    };
    playing = requestAnimationFrame(step);
  });

  // tap a star on the dome
  cv.addEventListener("click", (e) => {
    const b = cv.getBoundingClientRect(), dpr = W / b.width;
    const x = (e.clientX - b.left) * dpr, y = (e.clientY - b.top) * dpr;
    let best = null, d0 = 26 * dpr;
    for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < d0) { d0 = d; best = h; } }
    if (best) { selected = best.id; render(false); }
  });
  $("#list").addEventListener("click", (e) => {
    const c = e.target.closest(".s-card"); if (!c) return;
    selected = +c.dataset.id; render(false);
    $(".sky-grid").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector(".filters").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-f]"); if (!b) return;
    filter = b.dataset.f;
    document.querySelectorAll(".filters button").forEach((x) => x.classList.toggle("on", x === b));
    showList(positions(timeNow()));
  });

  addEventListener("resize", () => { size(); draw(); });
  const sid = +new URLSearchParams(location.search).get("star");
  if (sid >= 1 && sid <= 27) selected = sid;
  setNow(); size(); render(true);
})();
