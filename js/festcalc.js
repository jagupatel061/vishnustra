/* =====================================================================
   festcalc.js — find the next date of each festival (uses astro.js)
   ---------------------------------------------------------------------
   Lunar months (amanta): a month starts at a new moon. Its name comes
   from the Sun's sidereal sign at that new moon (Sun in Meena → Chaitra,
   Mesha → Vaishakha …). If two new moons fall in the same sign, the
   first month is "adhika" (an extra leap month) and has no festivals.
   The full moon in the middle of that month gives its name: the Moon
   is then near the nakshatra the month is named after.

   Star festivals: the first day (Moon's star at 6 a.m. IST) in the
   right solar month (Sun's sidereal sign); if the star comes twice
   that month, the second one.
   ===================================================================== */
const FestCalc = (() => {
  const A = typeof Astro !== "undefined" ? Astro : require("./astro.js");
  const norm = (x) => ((x % 360) + 360) % 360;
  const DAY = 86400000;
  const elong = (t) => norm(A.moonLongitude(new Date(t)) - A.sunLongitude(new Date(t)));
  const sunSign = (t) => Math.floor(norm(A.sunLongitude(new Date(t)) - A.ayanamsa(new Date(t))) / 30);
  const istDay = (t) => new Date(t + 5.5 * 3600000).toISOString().slice(0, 10); // YYYY-MM-DD in IST
  const istAt = (day, hh) => Date.parse(day + "T00:00:00Z") - 5.5 * 3600000 + hh * 3600000;

  // moments when elongation crosses `target` (0 = new moon, 180 = full moon)
  function crossings(from, to, target) {
    const out = [];
    const f = (t) => norm(elong(t) - target + 180) - 180; // signed distance
    let t0 = from, v0 = f(t0);
    for (let t1 = from + DAY / 2; t1 <= to; t1 += DAY / 2) {
      const v1 = f(t1);
      if (v0 < 0 && v1 >= 0) {
        let a = t0, b = t1;
        for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; }
        out.push((a + b) / 2);
      }
      t0 = t1; v0 = v1;
    }
    return out;
  }

  // lunar months between two moments: [{ month, adhika, start, full }]
  function lunarMonths(from, to) {
    const news = crossings(from - 35 * DAY, to + 35 * DAY, 0);
    const fulls = crossings(from - 35 * DAY, to + 35 * DAY, 180);
    const months = [];
    for (let i = 0; i < news.length - 1; i++) {
      const s = sunSign(news[i]), next = sunSign(news[i + 1]);
      const full = fulls.find((f) => f > news[i] && f < news[i + 1]);
      if (!full) continue;
      months.push({ month: (s + 1) % 12, adhika: s === next, start: news[i], full });
    }
    return months;
  }

  /* The festival day for a full moon = the date on which the 15th tithi
     (elongation 168°–180°) is running at sunrise (≈ 6:30 a.m. IST).
     Night festivals (Holika Dahan, Sharad Purnima) use the evening
     (≈ 6:30 p.m.) instead. If no such moment exists (a short tithi),
     the date of the full-moon moment itself. */
  function purnimaDay(full, when = "sunrise") {
    const hh = when === "evening" ? 18.5 : 6.5;
    const d0 = istDay(full - DAY), d1 = istDay(full), d2 = istDay(full + DAY);
    for (const d of [d0, d1, d2]) { const e = elong(istAt(d, hh)); if (e >= 168 && e < 180) return d; }
    return d1;
  }

  // next date of each festival, starting from `fromDate` (a Date)
  function upcoming(fromDate, festivals) {
    const from = istAt(istDay(fromDate.getTime()), 0);
    const to = from + 400 * DAY;
    const months = lunarMonths(from, to);
    // day table for star festivals
    const days = [];
    for (let t = from; t < to; t += DAY) {
      const d = istDay(t + 12 * 3600000);
      const sun = istAt(d, 6);
      days.push({ d, sign: sunSign(sun), star: A.moonAt(new Date(sun)).nakshatraId, starNoon: A.moonAt(new Date(istAt(d, 12))).nakshatraId });
    }
    // group the days into solar months (runs of the same Sun sign)
    const blocks = [];
    for (const x of days) {
      const b = blocks[blocks.length - 1];
      if (b && b.sign === x.sign) b.days.push(x); else blocks.push({ sign: x.sign, days: [x] });
    }
    const today = istDay(fromDate.getTime());
    return festivals.map((f) => {
      let date = null, extra = {};
      if (f.kind === "purnima") {
        for (const m of months) {
          if (m.adhika) continue;
          if (f.sign !== undefined ? sunSign(m.full) !== f.sign : m.month !== f.month) continue;
          const d = purnimaDay(m.full, f.when);
          if (d >= today) { date = d; extra = { moonStar: A.moonAt(new Date(m.full)).nakshatraId, fullAt: m.full }; break; }
        }
      } else {
        /* Tamil / Kerala rule: if the star comes twice in the solar month,
           the festival is kept on the second (later) one. */
        for (const b of blocks) {
          if (b.sign !== f.sign) continue;
          let hits = b.days.filter((x) => x.star === f.star);
          if (!hits.length) hits = b.days.filter((x) => x.starNoon === f.star);
          // keep the first day of each separate visit of the Moon to the star
          hits = hits.filter((x, i) => i === 0 || Date.parse(x.d) - Date.parse(hits[i - 1].d) > DAY);
          const hit = hits[hits.length - 1];
          if (hit && hit.d >= today) { date = hit.d; break; }
        }
      }
      const daysAway = date ? Math.round((Date.parse(date) - Date.parse(today)) / DAY) : null;
      return { ...f, date, daysAway, ...extra };
    }).sort((a, b) => (a.daysAway ?? 9999) - (b.daysAway ?? 9999));
  }

  // the next 12 named full moons (for the "months named by stars" table)
  function nextFullMoons(fromDate, count = 12) {
    const from = fromDate.getTime();
    return lunarMonths(from, from + 400 * DAY)
      .map((m) => ({ ...m, date: purnimaDay(m.full), moonStar: A.moonAt(new Date(m.full)).nakshatraId }))
      .filter((m) => m.date >= istDay(from))
      .slice(0, count);
  }

  return { upcoming, nextFullMoons, istDay };
})();

if (typeof module !== "undefined") module.exports = FestCalc;
