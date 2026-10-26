/* Simple stick-figure shapes for each nakshatra, drawn in a 40×40 box.
   pts: star positions · path: "open" | "closed" | "none" · bright: index of the yoga-tara (main star)
   Shapes are simplified for display; TEAM can refine them from a star chart. */
const SHAPES = {
  1:  { pts: [[4,24],[20,14],[35,18]], path: "open", bright: 1 },
  2:  { pts: [[8,28],[20,10],[32,26]], path: "closed", bright: 1 },
  3:  { pts: [[11,14],[18,9],[25,15],[16,21],[28,22],[21,28]], path: "none", bright: 0 },
  4:  { pts: [[4,8],[14,24],[20,29],[26,24],[36,6]], path: "open", bright: 4 },
  5:  { pts: [[9,27],[20,10],[31,27]], path: "closed", bright: 1 },
  6:  { pts: [[20,20]], path: "none", bright: 0 },
  7:  { pts: [[10,8],[17,11],[23,26],[33,31]], path: "open", bright: 1 },
  8:  { pts: [[8,20],[20,11],[32,20],[20,30]], path: "closed", bright: 1 },
  9:  { pts: [[4,27],[10,18],[18,23],[24,14],[32,18],[36,9]], path: "open", bright: 5 },
  10: { pts: [[29,33],[27,23],[21,17],[23,8],[31,6],[36,12]], path: "open", bright: 0 },
  11: { pts: [[10,14],[30,26]], path: "open", bright: 0 },
  12: { pts: [[10,26],[30,14]], path: "open", bright: 1 },
  13: { pts: [[8,10],[30,8],[33,30],[10,31]], path: "closed", bright: 2 },
  14: { pts: [[20,20]], path: "none", bright: 0 },
  15: { pts: [[20,20]], path: "none", bright: 0 },
  16: { pts: [[6,31],[12,12],[28,10],[34,29]], path: "open", bright: 1 },
  17: { pts: [[20,6],[14,18],[18,31],[30,17]], path: "open", bright: 1 },
  18: { pts: [[10,15],[20,21],[30,27]], path: "open", bright: 1 },
  19: { pts: [[4,6],[7,18],[12,28],[22,34],[32,30],[36,22],[30,16]], path: "open", bright: 6 },
  20: { pts: [[10,26],[28,13],[20,32]], path: "open", bright: 1 },
  21: { pts: [[8,14],[28,26],[16,31]], path: "open", bright: 0 },
  22: { pts: [[8,27],[20,19],[32,11]], path: "open", bright: 1 },
  23: { pts: [[13,14],[24,10],[30,20],[19,24],[9,33]], path: "open", bright: 1 },
  24: { pts: [[20,6],[30,10],[34,20],[30,30],[20,34],[10,30],[6,20],[10,10]], path: "none", bright: 0 },
  25: { pts: [[8,9],[32,9]], path: "open", bright: 0 },
  26: { pts: [[8,31],[32,31]], path: "open", bright: 0 },
  27: { pts: [[4,21],[12,14],[22,12],[32,16],[36,24],[26,27]], path: "open", bright: 0 },
};

function shapeSVG(id, opts = {}) {
  const s = SHAPES[id];
  const size = opts.size || 64;
  const hot = !!opts.hot;
  const line = hot ? "var(--gold)" : "var(--ink-3)";
  let svg = `<svg width="${size}" height="${size}" viewBox="-2 -2 44 44" aria-hidden="true">`;
  if (s.path !== "none" && s.pts.length > 1) {
    const d = "M" + s.pts.map(p => p.join(" ")).join(" L") + (s.path === "closed" ? " Z" : "");
    svg += `<path d="${d}" fill="none" stroke="${line}" stroke-width="1" stroke-linejoin="round"/>`;
  }
  s.pts.forEach((p, i) => {
    const big = i === s.bright;
    const r = big ? 2.6 : 1.7;
    if (big && hot) svg += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="var(--gold)" opacity=".28"/>`;
    svg += `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${hot ? "var(--gold-hi)" : "var(--ink)"}"/>`;
  });
  return svg + "</svg>";
}
