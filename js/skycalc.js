/* =====================================================================
   skycalc.js — where is a star in YOUR sky? (uses astro.js)
   ---------------------------------------------------------------------
   Star position (RA/Dec, J2000) + place (lat/lon) + time
     → local sidereal time → hour angle → altitude & azimuth.
   Sun and Moon come from their ecliptic longitude (astro.js).
   Precession since 2000 (≈ 0.4°) is ignored: far below what the eye sees.
   ===================================================================== */
const SkyCalc = (() => {
  const A = typeof Astro !== "undefined" ? Astro : require("./astro.js");
  const D = Math.PI / 180, norm = (x) => ((x % 360) + 360) % 360;
  const MIN = 60000, HOUR = 3600000, DAY = 86400000;
  const EPS = 23.4393; // tilt of the Earth's axis

  const jd = (t) => t / DAY + 2440587.5;
  const gmst = (t) => norm(280.46061837 + 360.98564736629 * (jd(t) - 2451545)); // degrees

  // ecliptic (longitude, latitude) → equatorial (RA, Dec)
  function eclToEq(lam, beta = 0) {
    const l = lam * D, b = beta * D, e = EPS * D;
    const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
    const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
    return { ra: norm(ra / D), dec: dec / D };
  }

  // altitude (0° horizon … 90° overhead) and azimuth (0° N, 90° E, 180° S, 270° W)
  function altAz(ra, dec, t, lat, lon) {
    const H = norm(gmst(t) + lon - ra) * D, d = dec * D, p = lat * D;
    const alt = Math.asin(Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H));
    const az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.cos(H) * Math.sin(p));
    return { alt: alt / D, az: norm(az / D) };
  }

  // Moon's ecliptic latitude, main terms (Meeus ch. 47), ±5°
  function moonLat(t) {
    const T = (jd(t) - 2451545) / 36525;
    const Dm = norm(297.8501921 + 445267.1114034 * T) * D, Mp = norm(134.9633964 + 477198.8675055 * T) * D;
    const F = norm(93.2720950 + 483202.0175233 * T) * D;
    return 5.128122 * Math.sin(F) + 0.280602 * Math.sin(Mp + F) + 0.277693 * Math.sin(Mp - F) + 0.173237 * Math.sin(2 * Dm - F);
  }
  const sunEq = (t) => eclToEq(A.sunLongitude(new Date(t)));
  const moonEq = (t) => eclToEq(A.moonLongitude(new Date(t)), moonLat(t));
  const sunAlt = (t, lat, lon) => { const s = sunEq(t); return altAz(s.ra, s.dec, t, lat, lon).alt; };

  // angle between two sky positions (degrees)
  function sep(ra1, dec1, ra2, dec2) {
    const c = Math.sin(dec1 * D) * Math.sin(dec2 * D) + Math.cos(dec1 * D) * Math.cos(dec2 * D) * Math.cos((ra1 - ra2) * D);
    return Math.acos(Math.min(1, Math.max(-1, c))) / D;
  }

  // midnight IST of a date "YYYY-MM-DD" → ms
  const istMidnight = (iso) => Date.parse(iso + "T00:00:00Z") - 5.5 * HOUR;

  /* The night that begins on `iso` (noon to next noon, IST):
     sunset, dark (Sun 12° below horizon), dawn, sunrise */
  function night(iso, lat, lon) {
    const t0 = istMidnight(iso) + 12 * HOUR, out = { start: t0, end: t0 + DAY };
    let prev = sunAlt(t0, lat, lon);
    for (let t = t0 + 5 * MIN; t <= t0 + DAY; t += 5 * MIN) {
      const a = sunAlt(t, lat, lon);
      if (prev >= -0.83 && a < -0.83 && !out.sunset) out.sunset = t;
      if (prev >= -12 && a < -12 && !out.dark) out.dark = t;
      if (prev < -12 && a >= -12 && out.dark && !out.dawn) out.dawn = t;
      if (prev < -0.83 && a >= -0.83 && out.sunset && !out.sunrise) out.sunrise = t;
      prev = a;
    }
    return out;
  }

  /* One star through that night: rise / set times, highest point while it is dark */
  function starNight(ra, dec, n, lat, lon) {
    const r = { rise: null, set: null, best: null, bestAlt: -90, never: false, always: false };
    let prev = altAz(ra, dec, n.start, lat, lon).alt, maxAll = prev, minAll = prev;
    for (let t = n.start + 10 * MIN; t <= n.end; t += 10 * MIN) {
      const a = altAz(ra, dec, t, lat, lon).alt;
      if (prev < 0 && a >= 0 && !r.rise) r.rise = t;
      if (prev >= 0 && a < 0 && !r.set) r.set = t;
      if (n.dark && n.dawn && t >= n.dark && t <= n.dawn && a > r.bestAlt) { r.bestAlt = a; r.best = t; }
      maxAll = Math.max(maxAll, a); minAll = Math.min(minAll, a);
      prev = a;
    }
    r.never = maxAll < 0; r.always = minAll > 0;
    r.visibleTonight = r.bestAlt >= 10;
    return r;
  }

  /* Through the year: when is the star high in the evening (9 p.m.),
     and when is it hidden in the Sun's glare? Returns day-of-year numbers. */
  function seasons(ra, year) {
    let evening = null, eBest = 999, hidden = null, hBest = 999;
    for (let d = 0; d < 366; d++) {
      const t = Date.UTC(year, 0, 1) + d * DAY, s = sunEq(t).ra;
      const e = Math.abs(norm(s - (ra - 135) + 180) - 180); // star crosses the south at ~9 p.m.
      const h = Math.abs(norm(s - ra + 180) - 180);          // star sits next to the Sun
      if (e < eBest) { eBest = e; evening = t; }
      if (h < hBest) { hBest = h; hidden = t; }
    }
    return { evening, hidden };
  }

  return { gmst, altAz, eclToEq, sunEq, moonEq, sunAlt, sep, night, starNight, seasons, istMidnight };
})();

if (typeof module !== "undefined") module.exports = SkyCalc;
