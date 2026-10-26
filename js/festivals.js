/* =====================================================================
   festivals.js — Festival Calendar page
   Uses FestCalc (js/festcalc.js) to find the next date of each festival
   in data/festivals.js, then draws the cards.
   ===================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const now = new Date();
  const list = FestCalc.upcoming(now, FESTIVALS);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = (iso) => { const [y, m, d] = iso.split("-").map(Number); return { y, m: MON[m - 1], d }; };
  const longDate = (iso) => new Date(iso + "T12:00:00+05:30").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const away = (n) => n === 0 ? "Today" : n === 1 ? "Tomorrow" : `in ${n} days`;

  // which nakshatra a festival belongs to
  const starOf = (f) => f.kind === "star" ? f.star : f.named || LUNAR_MONTHS[f.month][2];
  const rule = (f) => f.kind === "star"
    ? `Moon in ${NAKSHATRAS[f.star - 1].en} · Tamil/Malayalam month ${SOLAR_MONTHS[f.sign]}`
    : f.sign !== undefined ? `Full moon · Tamil month ${SOLAR_MONTHS[f.sign].split(" /")[0]}`
    : `Full moon of ${LUNAR_MONTHS[f.month][0]} · named after ${NAKSHATRAS[LUNAR_MONTHS[f.month][2] - 1].en}`;

  $("#today-text").textContent = "Today · Moon in " + NAKSHATRAS[Astro.moonAt(now).nakshatraIndex].en;

  // 1. the next festival, large
  const nx = list[0];
  const ns = NAKSHATRAS[starOf(nx) - 1];
  $("#next").innerHTML = `
    <div class="ring">${shapeSVG(ns.id, { size: 72, hot: true })}</div>
    <div>
      <span class="cap gold">Next festival · ${longDate(nx.date)}</span>
      <h2>${nx.name}</h2>
      <div class="meta muted" style="font-size:12px;margin-top:6px">${rule(nx)} · ${nx.region}</div>
      <p>${nx.story}</p>
      <a class="star-link" href="index.html?star=${ns.id}">${shapeSVG(ns.id, { size: 22, hot: true })}${ns.en} <span class="deva">${ns.sa}</span> →</a>
    </div>
    <div class="count"><div class="n">${nx.daysAway}</div><div class="cap muted">${nx.daysAway === 1 ? "day to go" : "days to go"}</div></div>`;

  // 2. all festivals
  function draw(filter) {
    $("#grid").innerHTML = list.filter((f) => filter === "all" || f.kind === filter).map((f) => {
      const p = parts(f.date), s = NAKSHATRAS[starOf(f) - 1];
      return `<article class="fest">
        <div class="date"><div class="d">${p.d}</div><div class="m">${p.m}</div><div class="y">${p.y}</div></div>
        <div>
          <h3>${f.name}</h3>
          <div class="meta">${f.region} · <span class="${f.daysAway <= 30 ? "soon" : ""}">${away(f.daysAway)}</span></div>
          <p>${f.story}</p>
          <div class="meta" style="margin-top:10px">${rule(f)}</div>
          <a class="star-link" href="index.html?star=${s.id}">${shapeSVG(s.id, { size: 22, hot: true })}${s.en} →</a>
        </div>
      </article>`;
    }).join("");
  }
  draw("all");
  document.querySelector(".filters").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-f]"); if (!b) return;
    document.querySelectorAll(".filters button").forEach((x) => x.classList.toggle("on", x === b));
    draw(b.dataset.f);
  });

  // 3. the twelve months and their stars
  $("#months").innerHTML = FestCalc.nextFullMoons(now, 12).map((m) => {
    const [name, deva, named] = LUNAR_MONTHS[m.month], p = parts(m.date);
    const real = NAKSHATRAS[m.moonStar - 1].en, nm = NAKSHATRAS[named - 1].en;
    return `<div class="mon${m.adhika ? " adhika" : ""}">
      <div class="deva">${deva}</div>
      <div class="nm">${name}${m.adhika ? ' <span class="muted" style="font-size:10px">· ADHIKA</span>' : ""}</div>
      <div class="from">named after <span class="gold">${nm}</span></div>
      <div class="when">Full moon ${p.d} ${p.m} ${p.y}<br>Moon in ${real}</div>
    </div>`;
  }).join("");
})();
