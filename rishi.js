/* =====================================================================
   rishi.js — Rishi AI
   · On Netlify with GEMINI_API_KEY: questions go to netlify/functions/rishi.js,
     which answers using ONLY Vishnustra's star data.
   · Anywhere else (Live Server, offline): a built-in answer engine that reads
     the same star data. It handles stars, deities, symbols, trees, shlokas,
     name sounds, birth dates, tonight's star and common topics.
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const N = NAKSHATRAS;
const log = $("#log");
const chatHistory = [];           // for the AI mode
let aiMode = false;

/* ---------- star name matching (with common spellings) ---------- */
const ALIASES = {
  1: ["ashwini", "ashvini", "aswini", "ashwathi", "aswathi"],
  2: ["bharani"],
  3: ["krittika", "kritika", "krithika", "karthigai", "kartika"],
  4: ["rohini"],
  5: ["mrigashira", "mrigashirsha", "mrigasira", "makayiram"],
  6: ["ardra", "aridra", "thiruvathira", "thiruvadhirai"],
  7: ["punarvasu", "punarpoosam", "punartham"],
  8: ["pushya", "pushyami", "poosam", "pooyam"],
  9: ["ashlesha", "aslesha", "ayilyam"],
  10: ["magha", "makha", "makam", "magam"],
  11: ["purva phalguni", "poorva phalguni", "purva falguni", "pubba", "pooram"],
  12: ["uttara phalguni", "uttaraphalguni", "uthiram", "uthram"],
  13: ["hasta", "hastha", "hastham", "atham"],
  14: ["chitra", "chithra", "chithirai", "chithira"],
  15: ["swati", "swathi", "svati", "chothi"],
  16: ["vishakha", "visakha", "vishaka", "visakam"],
  17: ["anuradha", "anusham", "anizham"],
  18: ["jyeshtha", "jyeshta", "jyestha", "kettai", "thrikketta"],
  19: ["mula", "moola", "moolam"],
  20: ["purva ashadha", "poorvashada", "purvashadha", "pooradam"],
  21: ["uttara ashadha", "uttarashadha", "uthradam", "uthiradam"],
  22: ["shravana", "shravan", "sravana", "thiruvonam", "onam"],
  23: ["dhanishta", "dhanishtha", "avittam", "shravishtha"],
  24: ["shatabhisha", "satabhisha", "shatabhishak", "sadhayam", "chathayam"],
  25: ["purva bhadrapada", "poorva bhadrapada", "purvabhadra", "poorattathi"],
  26: ["uttara bhadrapada", "uttarabhadra", "uthrattathi"],
  27: ["revati", "revathi"],
};
const ALIAS_LIST = Object.entries(ALIASES).flatMap(([id, arr]) => arr.map((a) => [a, +id])).sort((a, b) => b[0].length - a[0].length);
function findStarIn(q) {
  for (const [a, id] of ALIAS_LIST) if (q.includes(a)) return N[id - 1];
  return null;
}

/* ---------- dates ---------- */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function findDate(q) {
  let m = q.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = q.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);            // dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = q.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\s*,?\s*(\d{4})/); // 14 august 2005
  if (m && MONTHS.includes(m[2].slice(0, 3))) return `${m[3]}-${String(MONTHS.indexOf(m[2].slice(0, 3)) + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = q.match(/([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})/);  // august 14 2005
  if (m && MONTHS.includes(m[1].slice(0, 3))) return `${m[3]}-${String(MONTHS.indexOf(m[1].slice(0, 3)) + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return null;
}
function findTime(q) {
  const m = q.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/);
  if (m) { let h = +m[1]; if (m[3] === "pm" && h < 12) h += 12; if (m[3] === "am" && h === 12) h = 0; return `${String(h).padStart(2, "0")}:${m[2]}`; }
  for (const w of ["dawn", "morning", "noon", "afternoon", "dusk", "evening", "night"]) if (q.includes(w)) return { dawn: "dawn", morning: "dawn", noon: "day", afternoon: "day", dusk: "dusk", evening: "dusk", night: "night" }[w];
  return "";
}

/* ---------- names ---------- */
function nameMatch(name) {
  const nm = name.toLowerCase().replace(/[^a-z]/g, "");
  let best = null;
  for (const s of N) for (const syl of s.syllables) {
    const k = syl.toLowerCase();
    if (nm.startsWith(k) && (!best || k.length > best.syl.length)) best = { star: s, syl };
  }
  return best;
}

/* ---------- topic answers ---------- */
const TOPICS = [
  { k: ["why 27", "27 nakshatra", "how many nakshatra", "twenty seven", "twenty-seven"],
    a: () => `The Moon takes about <b>27.3 days</b> to travel once around the sky against the stars. Ancient Indian astronomers split its path into <b>27 equal parts</b>, one for roughly each night, so each nakshatra spans 360° ÷ 27 = <b>13°20′</b>. Some older lists also add a 28th star, <b>Abhijit</b>.` },
  { k: ["what is a nakshatra", "what is nakshatra", "what are nakshatra", "meaning of nakshatra", "lunar mansion"],
    a: () => `A <b>nakshatra</b> is a "lunar mansion": one of 27 star-groups along the Moon's path. Each has a main star, a symbol, a ruling deity and stories. Indian calendars, festivals and naming customs still use them.` },
  { k: ["pada", "quarter"],
    a: () => `Each nakshatra is divided into <b>4 padas</b> (quarters) of 3°20′. 27 × 4 = <b>108 padas</b>. By tradition, the 108 main verses of the Vishnu Sahasranama are matched to these 108 padas, which is how each star on Vishnustra gets its shloka.` },
  { k: ["daksha", "27 wives", "wives", "why does the moon wane", "moon wane", "curse"],
    a: () => `In the old story, <b>Daksha</b> gave 27 daughters, the nakshatras, in marriage to <b>Chandra</b>, the Moon. Chandra loved <b>Rohini</b> most. The others complained, Daksha cursed him to waste away, and Shiva softened the curse so the Moon fades and grows back every month. The Vishnu Purana mentions the 27 daughters given to Soma.` },
  { k: ["shishumara", "porpoise", "dolphin", "sky as vishnu", "body of vishnu"],
    a: () => `The Vishnu Purana pictures the whole starry sky as <b>Shishumara</b>, a celestial porpoise that is the star-form of Vishnu. <b>Dhruva</b>, the pole star, sits at its tail, and all the stars turn around it. See it on the home page under "The Sky as Vishnu".` },
  { k: ["dhruva", "pole star", "polaris", "north star"],
    a: () => `<b>Dhruva</b> was a young prince whose devotion to Vishnu earned him a fixed place in the sky: the pole star. Because it sits almost exactly above Earth's axis, every other star seems to circle around it through the night.` },
  { k: ["vishnu purana"],
    a: () => `The <b>Vishnu Purana</b> is one of the major Puranas. Its second book describes the cosmos: the Sun's and Moon's chariots, the planets, the nakshatras and Shishumara, with Dhruva at the tail. Vishnustra uses it for the "Sky as Vishnu" section.` },
  { k: ["sahasranama", "1000 names", "thousand names", "shloka", "sloka", "mantra", "verse"],
    a: () => `The <b>Vishnu Sahasranama</b>, the thousand names of Vishnu, comes from the Mahabharata (Anushasana Parva). Its 108 main verses are matched by devotional tradition to the 108 nakshatra padas: star number N, pada P, uses verse 4(N−1)+P. Ask me for a star's shloka, e.g. "What is Rohini's shloka?"` },
  { k: ["vedanga jyotisha", "lagadha"],
    a: () => `The <b>Vedanga Jyotisha</b>, attributed to <b>Lagadha</b>, is among the oldest Indian texts on astronomy. It sets out a calendar using the Sun, the Moon and the nakshatras, mainly to time Vedic rituals.` },
  { k: ["aryabhata", "aryabhatiya"],
    a: () => `<b>Aryabhata</b> (born 476 CE) wrote the <b>Aryabhatiya</b>. He explained that the Earth rotates on its axis, gave a precise value for π and described eclipses as shadows, not demons.` },
  { k: ["varahamihira", "pancha", "brihat samhita"],
    a: () => `<b>Varahamihira</b> (6th century CE) compiled the <b>Pancha-siddhantika</b>, a summary of five astronomical traditions, and wrote the <b>Brihat Samhita</b>, which covers astronomy, weather, plants and more.` },
  { k: ["ayanamsa", "sidereal", "tropical", "lahiri", "precession"],
    a: () => `Indian astronomy measures the Moon against the <b>stars</b> (sidereal), while Western calendars measure from the equinox (tropical). The gap between them, about 24° today, is the <b>ayanamsa</b>; it grows slowly because Earth's axis wobbles (precession). Vishnustra uses the standard <b>Lahiri</b> ayanamsa.` },
  { k: ["how does this website", "how do you calculate", "how is it calculated", "calculation", "algorithm"],
    a: () => `Vishnustra calculates the Moon's position with the main terms of Jean Meeus's <i>Astronomical Algorithms</i>, subtracts the Lahiri ayanamsa, then divides by 13°20′. The nakshatra number is that result plus one. It matches festival dates such as Onam (Shravana) and Karthigai Deepam (Krittika).` },
  { k: ["rashi", "zodiac", "sun sign", "moon sign"],
    a: () => `A <b>rashi</b> (zodiac sign) is 30° of the sky, and a nakshatra is 13°20′, so each rashi holds <b>2¼ nakshatras</b> (9 padas). For example, Aries (Mesha) holds Ashwini, Bharani and the first quarter of Krittika.` },
  { k: ["predict", "future", "fortune", "horoscope", "lucky", "marriage", "astrology", "career"],
    a: () => `Vishnustra is about <b>cultural astronomy, not prediction</b>. I can tell you how Indian traditions understood the stars, their stories, shlokas and festivals, but I don't forecast anyone's future.` },
  { k: ["festival", "onam", "karthigai", "chitra pournami", "pongal"],
    a: () => `Many festivals follow the nakshatras: <b>Onam</b> is on Thiruvonam (Shravana) in Chingam, <b>Karthigai Deepam</b> is when the full Moon is in Krittika, and <b>Chitra Pournami</b> is the full Moon in Chitra.` },
  { k: ["abhijit", "28"],
    a: () => `<b>Abhijit</b> is a 28th nakshatra found in some older lists, such as the Atharvaveda. It's linked with the bright star Vega. The standard system used today, and on Vishnustra, has 27.` },
  { k: ["hello", "hi ", "namaste", "hey"],
    a: () => `Namaste! I'm the Rishi. Ask me about any of the 27 nakshatras, its shloka, or which star you were born under.` },
];

/* ---------- the offline answer engine ---------- */
function starCard(n) {
  return `<b>${n.en}</b> (${n.sa}) is nakshatra ${n.id} of 27. Symbol: ${n.symbol}. Deity: ${n.deity}. Sacred tree: ${n.tree}. Main star: ${n.western}. Traditional name sounds: ${n.syllables.join(", ")}.${n.note ? " " + n.note : ""}`;
}
function shlokaHTML(n) {
  return `<b>${n.en}'s shloka</b><span class="deva">${n.shloka.text}</span>${n.shloka.meaning}<span class="src">Vishnu Sahasranama · verse ${n.shloka.verse}</span>`;
}

function offlineAnswer(raw) {
  const q = " " + raw.toLowerCase().replace(/[?!]/g, " ") + " ";

  // 1. a birth date → their star
  const date = findDate(q);
  if (date) {
    const r = Astro.findStar(date, findTime(q));
    const n = N[r.primary.nakshatraIndex];
    const alt = r.alternatives.map((a) => N[a.nakshatraIndex].en).filter((x) => x !== n.en);
    return `For <b>${date.split("-").reverse().join("-")}</b>, the Moon was in <b>${n.en}</b> (${n.sa}).${alt.length ? ` It changed stars that day, so it could also be ${alt.join(" or ")}. Tell me the birth time to be sure.` : ""}<br><br>${starCard(n)}`;
  }

  // 2. tonight / today
  if (/\b(tonight|today|right now|now|currently)\b/.test(q) && /(moon|star|nakshatra)/.test(q)) {
    const r = Astro.moonAt(new Date()), n = N[r.nakshatraIndex];
    return `Right now the Moon is in <b>${n.en}</b> (${n.sa}), pada ${r.pada}. It is a <b>${r.phaseName.toLowerCase()}</b>, about ${Math.round(r.illumination * 100)}% lit.`;
  }

  // 3. a name → its star
  const nm = q.match(/\bname\s+(?:is\s+)?([a-z]+)/) || q.match(/\b([a-z]+)\s+(?:follow|match)/);
  if (nm && !["my", "the", "a", "does", "this"].includes(nm[1])) {
    const name = nm[1][0].toUpperCase() + nm[1].slice(1);
    const m = nameMatch(name);
    return m ? `<b>${name}</b> begins with "${m.syl}", one of the traditional sounds of <b>${m.star.en}</b>. Families following the custom would choose such a name for a child born under ${m.star.en}.`
             : `<b>${name}</b> doesn't begin with any of the listed nakshatra sounds.`;
  }

  // 4. a specific star
  const n = findStarIn(q);
  if (n) {
    if (/(shloka|sloka|mantra|verse|sahasranama|chant)/.test(q)) return shlokaHTML(n);
    if (/(deity|god|devta|devata|ruler|ruled)/.test(q)) return `The deity of <b>${n.en}</b> is <b>${n.deity}</b>.`;
    if (/(symbol|sign|shape)/.test(q)) return `The symbol of <b>${n.en}</b> is <b>${n.symbol}</b>.`;
    if (/(tree|plant)/.test(q)) return `The sacred tree of <b>${n.en}</b> is <b>${n.tree}</b>. Temples plant these in <i>nakshatra vanas</i>, gardens of 27 trees.`;
    if (/(name|letter|syllable|sound|baby)/.test(q)) return `Traditional name sounds for <b>${n.en}</b>: <b>${n.syllables.join(", ")}</b> (one for each pada).`;
    if (/(western|english|star called|which star|constellation|telescope)/.test(q)) return `<b>${n.en}</b>'s main star is <b>${n.western}</b>${YOGATARA[n.id] ? ` (${YOGATARA[n.id].star})` : ""}.`;
    return starCard(n) + `<br><br>Ask "What is ${n.en}'s shloka?" to read its verse.`;
  }

  // 5. topics
  for (const t of TOPICS) if (t.k.some((k) => q.includes(k))) return t.a();

  return `I answer from Vishnustra's research about the 27 nakshatras. Try asking about a star (e.g. "Tell me about Chitra"), a shloka, a birth date, Shishumara or Dhruva.`;
}

/* ---------- AI mode (Netlify function) ---------- */
const cfg = window.VISHNUSTRA_CONFIG || {};
async function checkAI() {
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(cfg.rishiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ping: true }), signal: ctrl.signal });
    if (!r.ok) return false;
    const j = await r.json();
    return !!j.ai;
  } catch { return false; }
}
async function aiAnswer(q) {
  const r = await fetch(cfg.rishiEndpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: q, history: chatHistory.slice(-6) }),
  });
  if (!r.ok) throw new Error("AI error " + r.status);
  const j = await r.json();
  if (!j.answer) throw new Error("No answer");
  return j.answer;
}

/* ---------- chat UI ---------- */
function esc(s) { return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
function textToHTML(t) { // simple formatting for AI text: **bold**, line breaks
  return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
}
function add(role, html) {
  const d = document.createElement("div");
  d.className = "msg " + role; d.innerHTML = html;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
  return d;
}

async function ask(q) {
  q = q.trim(); if (!q) return;
  add("me", esc(q));
  const wait = add("ai", `<span class="typing">The Rishi is thinking…</span>`);
  let html;
  // dates, tonight's star and shlokas are always answered by the exact calculator/data
  const exact = findDate(q.toLowerCase()) || /(tonight|right now)/i.test(q) || /(shloka|sloka|verse)/i.test(q);
  if (aiMode && !exact) {
    try { const a = await aiAnswer(q); html = textToHTML(a); chatHistory.push({ role: "user", text: q }, { role: "model", text: a }); }
    catch { html = offlineAnswer(q); }
  } else {
    await new Promise((r) => setTimeout(r, 350));
    html = offlineAnswer(q);
  }
  if (!aiMode || exact) API.save("/rishi", { question: q, logOnly: true });   // the server keeps a log of questions
  wait.innerHTML = html;
  log.scrollTop = log.scrollHeight;
}

$("#ask").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#q").value; $("#q").value = ""; ask(v); });
$("#sugg").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });

add("ai", `Namaste. I'm the <b>Rishi</b>. Ask me about the 27 nakshatras, their shlokas from the Vishnu Sahasranama, the Vishnu Purana's sky, or the star you were born under.`);
checkAI().then((ok) => {
  aiMode = ok;
  $("#mode-text").textContent = ok ? "Gemini AI · grounded in our research" : "Offline knowledge · from our star data";
  if (ok) $("#mode").classList.add("live");
});
