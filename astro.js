/* =====================================================================
   astro.js — where is the Moon, and which nakshatra is it in?
   ---------------------------------------------------------------------
   Moon longitude: main periodic terms from Jean Meeus,
   "Astronomical Algorithms" (2nd ed.), chapter 47. Accuracy ≈ 0.05°,
   far finer than one nakshatra (13°20′ = 13.333°).

   Sidereal (Indian) longitude = tropical longitude − Lahiri ayanamsa.
   Nakshatra number = floor(sidereal longitude / 13.333…) + 1
   Pada (quarter)   = floor((sidereal longitude mod 13.333…) / 3.333…) + 1
   ===================================================================== */

const Astro = (() => {
  const D2R = Math.PI / 180;
  const norm = (x) => ((x % 360) + 360) % 360;
  const SPAN = 360 / 27; // 13.333…°

  // Julian Day from a JS Date (UTC)
  function julianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  // Centuries since J2000.0
  function centuries(date) {
    return (julianDay(date) - 2451545.0) / 36525;
  }

  // Moon's tropical ecliptic longitude in degrees (Meeus ch. 47, main terms)
  function moonLongitude(date) {
    const T = centuries(date);
    const Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
    const D  = norm(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
    const M  = norm(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
    const Mp = norm(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
    const F  = norm(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T);
    const E  = 1 - 0.002516 * T - 0.0000074 * T * T;

    // [coefficient (deg), D, M, M', F]
    const terms = [
      [6.288774, 0, 0, 1, 0], [1.274027, 2, 0, -1, 0], [0.658314, 2, 0, 0, 0],
      [0.213618, 0, 0, 2, 0], [-0.185116, 0, 1, 0, 0], [-0.114332, 0, 0, 0, 2],
      [0.058793, 2, 0, -2, 0], [0.057066, 2, -1, -1, 0], [0.053322, 2, 0, 1, 0],
      [0.045758, 2, -1, 0, 0], [-0.040923, 0, 1, -1, 0], [-0.034720, 1, 0, 0, 0],
      [-0.030383, 0, 1, 1, 0], [0.015327, 2, 0, 0, -2], [-0.012528, 0, 0, 1, 2],
      [0.010980, 0, 0, 1, -2], [0.010675, 4, 0, -1, 0], [0.010034, 0, 0, 3, 0],
      [0.008548, 4, 0, -2, 0], [-0.007888, 2, 1, -1, 0], [-0.006766, 2, 1, 0, 0],
      [-0.005163, 1, 0, -1, 0], [0.004987, 1, 1, 0, 0], [0.004036, 2, -1, 1, 0],
      [0.003994, 2, 0, 2, 0], [0.003861, 4, 0, 0, 0], [0.003665, 2, 0, -3, 0],
      [-0.002689, 0, 1, -2, 0], [-0.002602, 2, 0, -1, 2], [0.002390, 2, -1, -2, 0],
      [-0.002348, 1, 0, 1, 0], [0.002236, 2, -2, 0, 0], [-0.002120, 0, 1, 2, 0],
      [-0.002069, 0, 2, 0, 0], [0.002048, 2, -2, -1, 0], [-0.001773, 2, 0, 1, -2],
      [-0.001595, 2, 0, 0, 2], [0.001215, 4, -1, -1, 0], [-0.001110, 0, 0, 2, 2],
    ];

    let sum = 0;
    for (const [c, d, m, mp, f] of terms) {
      const arg = (d * D + m * M + mp * Mp + f * F) * D2R;
      let k = c;
      if (Math.abs(m) === 1) k *= E;
      if (Math.abs(m) === 2) k *= E * E;
      sum += k * Math.sin(arg);
    }
    // small additive terms (Venus, Jupiter, flattening)
    const A1 = norm(119.75 + 131.849 * T), A2 = norm(53.09 + 479264.29 * T);
    sum += 0.003958 * Math.sin(A1 * D2R) + 0.001962 * Math.sin((Lp - F) * D2R) + 0.000318 * Math.sin(A2 * D2R);

    return norm(Lp + sum);
  }

  // Sun's tropical ecliptic longitude in degrees (Meeus ch. 25, low precision ≈ 0.01°)
  function sunLongitude(date) {
    const T = centuries(date);
    const L0 = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const C = (1.914602 - 0.004817 * T) * Math.sin(M * D2R)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M * D2R)
            + 0.000289 * Math.sin(3 * M * D2R);
    return norm(L0 + C);
  }

  // Lahiri (Chitrapaksha) ayanamsa, degrees. 23°51′11″ at J2000, ~50.29″ per year.
  function ayanamsa(date) {
    const years = (julianDay(date) - 2451545.0) / 365.25;
    return 23.85306 + years * (50.29 / 3600);
  }

  function siderealMoon(date) {
    return norm(moonLongitude(date) - ayanamsa(date));
  }

  // Everything about the Moon at one moment
  function moonAt(date) {
    const sid = siderealMoon(date);
    const index = Math.floor(sid / SPAN);          // 0..26
    const within = sid - index * SPAN;
    const pada = Math.floor(within / (SPAN / 4)) + 1;
    const elong = norm(moonLongitude(date) - sunLongitude(date)); // 0 = new, 180 = full
    const illumination = (1 - Math.cos(elong * D2R)) / 2;
    return {
      sidereal: sid,
      nakshatraIndex: index,          // 0-based, Ashwini = 0
      nakshatraId: index + 1,         // 1-based
      pada,
      progress: within / SPAN,        // how far through this nakshatra (0..1)
      elongation: elong,
      illumination,
      phaseName: phaseName(elong),
      waxing: elong < 180,
    };
  }

  function phaseName(e) {
    if (e < 6 || e > 354) return "New Moon";
    if (e < 84) return "Waxing Crescent";
    if (e < 96) return "First Quarter";
    if (e < 174) return "Waxing Gibbous";
    if (e < 186) return "Full Moon";
    if (e < 264) return "Waning Gibbous";
    if (e < 276) return "Last Quarter";
    return "Waning Crescent";
  }

  /* Birth date (YYYY-MM-DD) + time, read as Indian Standard Time.
     time: "HH:MM", or one of "dawn" | "day" | "dusk" | "night", or "" (unknown). */
  const SLOTS = { dawn: "06:00", day: "12:00", dusk: "18:00", night: "22:00" };

  function istToDate(dateStr, hhmm) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = hhmm.split(":").map(Number);
    return new Date(Date.UTC(y, m - 1, d, hh, mm) - 5.5 * 3600 * 1000);
  }

  function findStar(dateStr, time) {
    if (time && /^\d{1,2}:\d{2}$/.test(time)) {
      const r = moonAt(istToDate(dateStr, time));
      return { exact: true, primary: r, alternatives: [] };
    }
    if (time && SLOTS[time]) {
      const r = moonAt(istToDate(dateStr, SLOTS[time]));
      return { exact: false, primary: r, alternatives: [] };
    }
    // Unknown time: check the whole day (00:00–23:59 IST)
    const start = moonAt(istToDate(dateStr, "00:00"));
    const end = moonAt(istToDate(dateStr, "23:59"));
    const noon = moonAt(istToDate(dateStr, "12:00"));
    const alts = end.nakshatraIndex !== start.nakshatraIndex ? [start, end].filter(r => r.nakshatraIndex !== noon.nakshatraIndex) : [];
    return { exact: false, primary: noon, alternatives: alts };
  }

  return { moonAt, findStar, moonLongitude, sunLongitude, ayanamsa, siderealMoon, istToDate, SPAN };
})();

if (typeof module !== "undefined") module.exports = Astro;
