/* Twinkling star background for module pages (same look as the home page). */
(function () {
  const c = document.getElementById("sky");
  if (!c) return;
  const ctx = c.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stars = [];
  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round(innerWidth * innerHeight / 4200) }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() < 0.1 ? 1.4 : Math.random() < 0.45 ? 0.9 : 0.55,
      gold: Math.random() < 0.5, ph: Math.random() * 6.3, sp: 0.4 + Math.random() * 1.2,
    }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      ctx.globalAlpha = still ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * s.sp + s.ph));
      ctx.fillStyle = s.gold ? "#f4c542" : "#fff3d0";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!still) requestAnimationFrame(draw);
  }
  build(); addEventListener("resize", build); requestAnimationFrame(draw);
})();
