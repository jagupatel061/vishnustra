/* =====================================================================
   FESTIVALS that follow the nakshatras
   ---------------------------------------------------------------------
   Two kinds:
   1. "star"  — the day the Moon is in a given nakshatra during a given
                solar month (Sun's sidereal sign). Used in Tamil Nadu
                and Kerala: Onam, Karthigai Deepam, Thaipusam …
                sign: 0 Mesha, 1 Vrishabha, 2 Mithuna, 3 Karka, 4 Simha,
                5 Kanya, 6 Tula, 7 Vrischika, 8 Dhanu, 9 Makara,
                10 Kumbha, 11 Meena
   2. "purnima" — the full moon of a lunar month (or, with `sign`, the
                full moon while the Sun is in that solar month). Lunar months are
                named after the nakshatra the full Moon sits in:
                Chaitra ← Chitra, Vaishakha ← Vishakha, Kartika ← Krittika …
                month: 0 Chaitra … 11 Phalguna

   TEAM: check each date against a printed panchang (calendar).
   Local panchangs can differ by one day.
   ===================================================================== */

const LUNAR_MONTHS = [
  // [month name, Devanagari, nakshatra id it is named after]
  ["Chaitra", "चैत्र", 14], ["Vaishakha", "वैशाख", 16], ["Jyeshtha", "ज्येष्ठ", 18],
  ["Ashadha", "आषाढ", 20], ["Shravana", "श्रावण", 22], ["Bhadrapada", "भाद्रपद", 25],
  ["Ashvin", "आश्विन", 1], ["Kartika", "कार्तिक", 3], ["Margashirsha", "मार्गशीर्ष", 5],
  ["Pausha", "पौष", 8], ["Magha", "माघ", 10], ["Phalguna", "फाल्गुन", 12],
];

const SOLAR_MONTHS = ["Chithirai / Medam", "Vaikasi / Edavam", "Aani / Mithunam", "Aadi / Karkidakam",
  "Aavani / Chingam", "Purattasi / Kanni", "Aippasi / Thulam", "Karthigai / Vrischikam",
  "Margazhi / Dhanu", "Thai / Makaram", "Masi / Kumbham", "Panguni / Meenam"];

const FESTIVALS = [
  { id: "onam", name: "Onam · Thiruvonam", kind: "star", star: 22, sign: 4, region: "Kerala",
    story: "King Mahabali's yearly visit. Vishnu came as Vamana, the dwarf, on the day of Shravana (Thiruvonam), the star of Vishnu himself." },
  { id: "karthigai", name: "Karthigai Deepam", kind: "star", star: 3, sign: 7, region: "Tamil Nadu",
    story: "Lamps on every doorstep and a great fire on Tiruvannamalai hill, on the day of Krittika, the star of Agni, the fire god." },
  { id: "arudra", name: "Arudra Darshan", kind: "star", star: 6, sign: 8, region: "Tamil Nadu · Kerala",
    story: "Shiva's cosmic dance as Nataraja at Chidambaram, celebrated under Ardra (Thiruvathirai), Rudra's star." },
  { id: "thaipusam", name: "Thaipusam", kind: "star", star: 8, sign: 9, region: "Tamil Nadu · Malaysia · Singapore",
    story: "Murugan receives the divine spear from Parvati. Devotees carry the kavadi, under Pushya (Poosam)." },
  { id: "masimagam", name: "Masi Magam", kind: "star", star: 10, sign: 10, region: "Tamil Nadu · Kerala",
    story: "Temple deities are taken to the sea and tanks for a holy bath on the day of Magha. Kumbakonam's Mahamaham tank fills with pilgrims." },
  { id: "panguni", name: "Panguni Uttiram", kind: "star", star: 12, sign: 11, region: "Tamil Nadu",
    story: "The day of divine weddings — Shiva and Parvati, Murugan and Deivanai, Rama and Sita — under Uttara Phalguni, the star of marriage." },
  { id: "vaikasi", name: "Vaikasi Visakam", kind: "star", star: 16, sign: 1, region: "Tamil Nadu",
    story: "The birthday of Murugan, celebrated when the Moon is in Vishakha in the month of Vaikasi." },
  { id: "aadipooram", name: "Aadi Pooram", kind: "star", star: 11, sign: 3, region: "Tamil Nadu",
    story: "The birthday of Andal, the poet-saint who sang to Vishnu, under Purva Phalguni (Pooram)." },

  { id: "chitra", name: "Chitra Pournami", kind: "purnima", sign: 0, named: 14, region: "Tamil Nadu",
    story: "The full moon of the Tamil month Chithirai, when the Moon shines near Chitra (Spica). Day of Chitragupta, who keeps the record of every deed." },
  { id: "buddha", name: "Buddha Purnima", kind: "purnima", month: 1, region: "All India",
    story: "Birth, enlightenment and passing of the Buddha, all on the full moon of Vaishakha, near the star Vishakha." },
  { id: "guru", name: "Guru Purnima", kind: "purnima", month: 3, region: "All India",
    story: "Honour to teachers and to Vyasa, who arranged the Vedas, on the full moon of Ashadha." },
  { id: "raksha", name: "Raksha Bandhan", kind: "purnima", month: 4, region: "North & West India",
    story: "The thread of protection, tied on the full moon of Shravana — the month named after Vishnu's star." },
  { id: "sharad", name: "Sharad Purnima", kind: "purnima", month: 6, when: "evening", region: "All India",
    story: "The brightest moon of autumn. Kheer is left under the moonlight; Krishna's Raas Leela is remembered." },
  { id: "kartik", name: "Kartik Purnima · Dev Deepawali", kind: "purnima", month: 7, region: "Varanasi · All India",
    story: "The full moon near Krittika. The ghats of Varanasi glow with lamps; Vishnu's Matsya avatar is remembered." },
  { id: "holi", name: "Holika Dahan", kind: "purnima", month: 11, when: "evening", region: "All India",
    story: "The bonfire on the full moon of Phalguna — Vishnu as Narasimha saves Prahlada. Colours follow the next morning." },
];

if (typeof module !== "undefined") module.exports = { FESTIVALS, LUNAR_MONTHS, SOLAR_MONTHS };
