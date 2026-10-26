/* =====================================================================
   starcard.js — "Star Card": a 1080 × 1350 image of your nakshatra
   (constellation, names, deity, symbol, tree, Vishnu Sahasranama shloka)
   drawn on a canvas, to download or share from a phone.

   StarCard.open({ id, name, date, pada })   → opens the preview window
   Needs: data/nakshatras.js, js/shapes.js (SHAPES)
   ===================================================================== */
const StarCard = (() => {
  const W = 1080, H = 1350;
  const C = { bg: "#0a0a0b", gold: "#f4c542", hi: "#ffe7a0", dim: "#8c6a2a", ink: "#ece8df", ink2: "#a9a499", ink3: "#6f6b63" };
  const F = { serif: '"Cormorant Garamond", Georgia, serif', sans: 'Jost, system-ui, sans-serif', deva: '"Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif' };
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let moonImg = null;
  function loadMoon() {
    if (moonImg) return Promise.resolve(moonImg);
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => { moonImg = im; res(im); };
      im.onerror = () => res(null);
      im.src = "assets/moon-full.png";
    });
  }
  async function loadFonts(n) {
    if (!document.fonts) return;
    try {
      await Promise.all([
        document.fonts.load(`italic 500 120px "Cormorant Garamond"`),
        document.fonts.load(`300 26px Jost`), document.fonts.load(`400 26px Jost`),
        document.fonts.load(`64px "Tiro Devanagari Sanskrit"`, n.sa + n.shloka.text),
      ]);
    } catch { /* draw with fallback fonts */ }
  }

  // tiny seeded random, so each star always gets the same background
  function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

  function spaced(ctx, text, x, y, spacing, align = "left") {
    const chars = [...text];
    const width = chars.reduce((w, c) => w + ctx.measureText(c).width + spacing, -spacing);
    let cx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
    ctx.textAlign = "left";
    for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + spacing; }
  }
  function wrap(ctx, text, maxW) {
    const words = text.split(" "), lines = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  const short = (s) => s.split(" (")[0].split(" / ")[0];

  async function draw(canvas, o) {
    const n = NAKSHATRAS[o.id - 1];
    await Promise.all([loadFonts(n), loadMoon()]);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    // background + glow
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    let g = ctx.createRadialGradient(W / 2, 420, 0, W / 2, 420, 620);
    g.addColorStop(0, "rgba(244,197,66,.16)"); g.addColorStop(1, "rgba(244,197,66,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // background stars
    const r = rng(o.id);
    for (let i = 0; i < 170; i++) {
      ctx.globalAlpha = 0.15 + r() * 0.55;
      ctx.fillStyle = r() > 0.85 ? C.hi : C.ink;
      ctx.beginPath(); ctx.arc(r() * W, r() * H, r() * 1.6 + 0.3, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // moon, top right (screen blend removes its dark background)
    if (moonImg) {
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.9;
      ctx.drawImage(moonImg, W - 300, -110, 400, 400);
      ctx.restore();
    }

    // double frame
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.strokeStyle = C.dim; ctx.lineWidth = 1; ctx.strokeRect(50, 50, W - 100, H - 100);

    // header
    ctx.fillStyle = C.gold; ctx.font = `400 24px ${F.sans}`;
    spaced(ctx, "VISHNUSTRA", 96, 118, 9);
    ctx.fillStyle = C.ink3; ctx.font = `300 20px ${F.sans}`;
    spaced(ctx, `NAKSHATRA ${String(n.id).padStart(2, "0")} OF 27`, 96, 152, 5);

    // constellation (SHAPES box is 40 × 40)
    const s = SHAPES[n.id], cx = W / 2, cy = 395, k = 8.4;
    const P = s.pts.map(([x, y]) => [cx + (x - 20) * k, cy + (y - 20) * k]);
    ctx.beginPath(); ctx.arc(cx, cy, 215, 0, 7); ctx.strokeStyle = "rgba(244,197,66,.28)"; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.setLineDash([2, 9]); ctx.beginPath(); ctx.arc(cx, cy, 245, 0, 7); ctx.strokeStyle = "rgba(244,197,66,.35)"; ctx.stroke(); ctx.setLineDash([]);
    if (s.path !== "none" && P.length > 1) {
      ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.path === "closed") ctx.closePath();
      ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.75; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke(); ctx.globalAlpha = 1;
    }
    P.forEach(([x, y], i) => {
      const big = i === s.bright, rad = big ? 13 : 8;
      g = ctx.createRadialGradient(x, y, 0, x, y, rad * 4.5);
      g.addColorStop(0, "rgba(255,231,160,.55)"); g.addColorStop(1, "rgba(255,231,160,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad * 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = big ? C.hi : C.ink; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    });

    // name block
    let y = 688;
    if (o.name) {
      ctx.fillStyle = C.ink2; ctx.font = `400 22px ${F.sans}`;
      spaced(ctx, `${o.name.toUpperCase().slice(0, 28)} · BORN UNDER`, W / 2, y, 6, "center");
    }
    ctx.textAlign = "center"; ctx.fillStyle = C.gold;
    let size = 132; ctx.font = `italic 500 ${size}px ${F.serif}`;
    while (ctx.measureText(n.en).width > W - 220 && size > 70) { size -= 6; ctx.font = `italic 500 ${size}px ${F.serif}`; }
    ctx.fillText(n.en, W / 2, y + 120);
    ctx.fillStyle = C.ink; ctx.font = `58px ${F.deva}`;
    ctx.fillText(n.sa, W / 2, y + 200);

    // divider ✦
    y += 250;
    ctx.strokeStyle = C.dim; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(140, y); ctx.lineTo(W / 2 - 30, y); ctx.moveTo(W / 2 + 30, y); ctx.lineTo(W - 140, y); ctx.stroke();
    ctx.fillStyle = C.gold; ctx.font = `26px ${F.sans}`; ctx.fillText("✦", W / 2, y + 9);

    // facts: deity · symbol · tree
    y += 62;
    const cols = [["DEITY", short(n.deity)], ["SYMBOL", short(n.symbol)], ["SACRED TREE", short(n.tree)]];
    cols.forEach(([k2, v], i) => {
      const x = 200 + i * 340;
      ctx.fillStyle = C.ink3; ctx.font = `400 17px ${F.sans}`; spaced(ctx, k2, x, y, 5, "center");
      ctx.fillStyle = C.ink; ctx.font = `italic 500 34px ${F.serif}`; ctx.textAlign = "center";
      wrap(ctx, v, 300).slice(0, 2).forEach((ln, j) => ctx.fillText(ln, x, y + 46 + j * 36));
    });

    // shloka
    y += 132;
    ctx.fillStyle = C.hi; ctx.font = `33px ${F.deva}`; ctx.textAlign = "center";
    const sl = n.shloka.text.split("\n");
    sl.forEach((ln, j) => {
      let fs = 33; ctx.font = `${fs}px ${F.deva}`;
      while (ctx.measureText(ln).width > W - 200 && fs > 22) { fs -= 1; ctx.font = `${fs}px ${F.deva}`; }
      ctx.fillText(ln, W / 2, y + j * 50);
    });
    ctx.fillStyle = C.ink3; ctx.font = `400 17px ${F.sans}`;
    spaced(ctx, `VISHNU SAHASRANAMA · VERSE ${n.shloka.verse}`, W / 2, y + (sl.length - 1) * 50 + 46, 5, "center");

    // footer
    const bits = [];
    if (o.date) { const [yy, mm, dd] = o.date.split("-").map(Number); bits.push(`BORN ${dd} ${MON[mm - 1].toUpperCase()} ${yy}`); }
    if (o.pada) bits.push(`PADA ${o.pada}`);
    bits.push(`NAME SOUNDS ${n.syllables.join(" · ").toUpperCase()}`);
    ctx.fillStyle = C.gold; ctx.font = `400 17px ${F.sans}`;
    spaced(ctx, bits.join("   ·   "), W / 2, H - 76, 4, "center");
    return canvas;
  }

  /* ---------- preview window ---------- */
  let dlg, cv, opts;
  function build() {
    const st = document.createElement("style");
    st.textContent = `
      dialog.card-dlg { border: 1px solid var(--line-2); border-radius: 14px; background: #0c0c0e; color: var(--ink); padding: 0; width: min(880px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); }
      dialog.card-dlg::backdrop { background: rgba(4,4,6,.8); backdrop-filter: blur(3px); }
      .card-in { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 22px; padding: 22px; align-items: start; }
      .card-in canvas { width: 100%; height: auto; max-height: calc(100dvh - 90px); object-fit: contain; border-radius: 8px; background: #000; }
      .card-side { display: flex; flex-direction: column; gap: 14px; }
      .card-side h3 { margin: 0; font-family: var(--accent-serif); font-style: italic; font-weight: 500; font-size: 28px; color: var(--gold); line-height: 1.1; }
      .card-side .btn { justify-content: center; }
      .card-msg { font-size: 12px; color: var(--ink-3); min-height: 1.4em; }
      @media (max-width: 700px) { .card-in { grid-template-columns: 1fr; padding: 14px; } .card-in canvas { max-height: 56dvh; } }`;
    document.head.appendChild(st);
    dlg = document.createElement("dialog");
    dlg.className = "card-dlg";
    dlg.setAttribute("aria-label", "Your star card");
    dlg.innerHTML = `
      <div class="card-in">
        <canvas width="1080" height="1350" aria-label="Star card preview"></canvas>
        <div class="card-side">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:10px">
            <div><span class="cap muted" style="font-size:9.5px">Take your star home</span><h3>Your star card</h3></div>
            <button class="x-btn" type="button" data-close aria-label="Close">×</button>
          </div>
          <div class="field"><label for="card-name">Your name (optional)</label><input id="card-name" maxlength="28" autocomplete="off" placeholder="e.g. Jagruti"></div>
          <button class="btn solid" type="button" data-dl>Download image ↓</button>
          <button class="btn" type="button" data-share hidden>Share…</button>
          <div class="card-msg" aria-live="polite"></div>
          <p class="muted" style="font-size:12px;margin:0">A 1080 × 1350 picture, the size of an Instagram post. On a phone, use Share to save it to your photos.</p>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    cv = dlg.querySelector("canvas");
    const msg = dlg.querySelector(".card-msg");
    dlg.querySelector("[data-close]").onclick = () => dlg.close();
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    let t = 0;
    dlg.querySelector("#card-name").addEventListener("input", (e) => {
      clearTimeout(t); t = setTimeout(() => { opts.name = e.target.value.trim(); draw(cv, opts); }, 180);
    });
    const fileName = () => `vishnustra-${NAKSHATRAS[opts.id - 1].en.toLowerCase().replace(/\s+/g, "-")}${opts.name ? "-" + opts.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}.png`;
    const blob = () => new Promise((res) => cv.toBlob(res, "image/png"));
    dlg.querySelector("[data-dl]").onclick = async () => {
      const b = await blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = fileName();
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      msg.textContent = "✦ Saved as " + fileName();
    };
    const shareBtn = dlg.querySelector("[data-share]");
    try { shareBtn.hidden = !(navigator.canShare && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] })); } catch { shareBtn.hidden = true; }
    shareBtn.onclick = async () => {
      try {
        const f = new File([await blob()], fileName(), { type: "image/png" });
        await navigator.share({ files: [f], title: "My nakshatra · Vishnustra" });
      } catch { /* closed the share sheet */ }
    };
  }

  function open(o) {
    if (!dlg) build();
    opts = { ...o };
    dlg.querySelector("#card-name").value = opts.name || "";
    dlg.querySelector(".card-msg").textContent = "";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    draw(cv, opts);
  }

  return { open, draw };
})();
