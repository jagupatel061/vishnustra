/* =====================================================================
   NAKSHATRA — star data for the whole website
   ---------------------------------------------------------------------
   Every page reads from this one file.

   SHLOKA SOURCE
   - Text: Vishnu Sahasranama (Mahabharata, Anushasana Parva), names
     section, verses 1–108. Verse text as printed at
     bhaktibharat.com/mantra/shri-vishnu-sahasranam-path
   - Star ↔ verse rule (devotional tradition): 108 verses = 27 stars × 4
     padas. Star N, pada P → verse 4(N−1)+P.
     Source: SriPedia (Ramanuja list) archive, Mar 2003, msg00117.
   - Each star's featured shloka = its pada-1 verse (first of its four).
   - "meaning" = a simple English paraphrase of the names in the verse.
     TEAM: check each meaning against a printed translation
     (e.g. Gita Press) before submission.

   TEAM: also verify `tree` and `syllables` — lists vary by source.
   ===================================================================== */

const NAKSHATRAS = [
  { id: 1, en: "Ashwini", sa: "अश्विनी", gu: "અશ્વિની", ta: "அசுவினி", ml: "അശ്വതി",
    deity: "The Ashvins (divine twin healers)", symbol: "Horse's head",
    western: "β & γ Arietis", tree: "Kuchla", syllables: ["Chu", "Che", "Cho", "La"],
    shloka: { verse: 1,
      text: "विश्वं विष्णुर्वषट्कारो भूतभव्यभवत्प्रभुः।\nभूतकृद्भूतभृद्भावो भूतात्मा भूतभावनः॥",
      meaning: "He is the universe itself, the all-pervading Vishnu, lord of past, present and future — creator, sustainer and soul of all beings." } },

  { id: 2, en: "Bharani", sa: "भरणी", gu: "ભરણી", ta: "பரணி", ml: "ഭരണി",
    deity: "Yama", symbol: "Yoni (womb)",
    western: "35, 39 & 41 Arietis", tree: "Amla", syllables: ["Li", "Lu", "Le", "Lo"],
    shloka: { verse: 5,
      text: "स्वयंभूः शम्भुरादित्यः पुष्कराक्षो महास्वनः।\nअनादिनिधनो धाता विधाता धातुरुत्तमः॥",
      meaning: "Self-born, bringer of joy, the radiant sun, lotus-eyed, of mighty voice — without beginning or end, the creator and supporter of all." } },

  { id: 3, en: "Krittika", sa: "कृत्तिका", gu: "કૃત્તિકા", ta: "கார்த்திகை", ml: "കാർത്തിക",
    deity: "Agni", symbol: "Flame / blade",
    western: "Pleiades", tree: "Gular (cluster fig)", syllables: ["A", "I", "U", "E"],
    shloka: { verse: 9,
      text: "ईश्वरो विक्रमी धन्वी मेधावी विक्रमः क्रमः।\nअनुत्तमो दुराधर्षः कृतज्ञः कृतिरात्मवान्॥",
      meaning: "The Lord, full of valour, the archer, the wise one, whose stride spans the worlds — unsurpassed, unconquerable, grateful and self-possessed." } },

  { id: 4, en: "Rohini", sa: "रोहिणी", gu: "રોહિણી", ta: "ரோகிணி", ml: "രോഹിണി",
    deity: "Brahma (Prajapati)", symbol: "Chariot",
    western: "Aldebaran (Hyades)", tree: "Jamun", syllables: ["O", "Va", "Vi", "Vu"],
    shloka: { verse: 13,
      text: "रुद्रो बहुशिरा बभ्रुर्विश्वयोनिः शुचिश्रवाः।\nअमृतः शाश्वतः स्थाणुर्वरारोहो महातपाः॥",
      meaning: "Rudra, many-headed, the upholder, source of the universe, of pure fame — immortal, eternal, steadfast, the highest refuge, great in austerity." } },

  { id: 5, en: "Mrigashira", sa: "मृगशिरा", gu: "મૃગશીર્ષ", ta: "மிருகசீரிடம்", ml: "മകയിരം",
    deity: "Soma (the Moon)", symbol: "Deer's head",
    western: "λ Orionis (Meissa)", tree: "Khair", syllables: ["Ve", "Vo", "Ka", "Ki"],
    shloka: { verse: 17,
      text: "उपेन्द्रो वामनः प्रांशुरमोघः शुचिरूर्जितः।\nअतीन्द्रः संग्रहः सर्गो धृतात्मा नियमो यमः॥",
      meaning: "Upendra, Vamana the dwarf who grew to fill the sky, whose acts never fail, pure and mighty — beyond Indra, gatherer of all, creation itself, self-controlled." } },

  { id: 6, en: "Ardra", sa: "आर्द्रा", gu: "આર્દ્રા", ta: "திருவாதிரை", ml: "തിരുവാതിര",
    deity: "Rudra", symbol: "Teardrop",
    western: "Betelgeuse", tree: "Agar", syllables: ["Ku", "Gha", "Ng", "Chha"],
    shloka: { verse: 21,
      text: "मरीचिर्दमनो हंसः सुपर्णो भुजगोत्तमः।\nहिरण्यनाभः सुतपाः पद्मनाभः प्रजापतिः॥",
      meaning: "The radiant ray, the tamer, the swan, Suparna the great eagle, best of serpents — golden-navelled, great ascetic, lotus-navelled, lord of beings." } },

  { id: 7, en: "Punarvasu", sa: "पुनर्वसु", gu: "પુનર્વસુ", ta: "புனர்பூசம்", ml: "പുണർതം",
    deity: "Aditi", symbol: "Quiver of arrows",
    western: "Castor & Pollux", tree: "Bamboo", syllables: ["Ke", "Ko", "Ha", "Hi"],
    shloka: { verse: 25,
      text: "आवर्तनो निवृत्तात्मा संवृतः संप्रमर्दनः।\nअहः संवर्तको वह्निरनिलो धरणीधरः॥",
      meaning: "He who turns the wheel of time yet stands beyond it — the day itself, the one who folds the worlds back in, fire, wind, and bearer of the earth." } },

  { id: 8, en: "Pushya", sa: "पुष्य", gu: "પુષ્ય", ta: "பூசம்", ml: "പൂയം",
    deity: "Brihaspati", symbol: "Flower / cow's udder",
    western: "γ, δ & θ Cancri", tree: "Peepal", syllables: ["Hu", "He", "Ho", "Da"],
    shloka: { verse: 29,
      text: "सुभुजो दुर्धरो वाग्मी महेन्द्रो वसुदो वसुः।\nनैकरूपो बृहद्रूपः शिपिविष्टः प्रकाशनः॥",
      meaning: "Of graceful arms, unconquerable, eloquent, the great Indra, giver of wealth and wealth itself — of many and vast forms, pervading as light, the illuminator." } },

  { id: 9, en: "Ashlesha", sa: "आश्लेषा", gu: "આશ્લેષા", ta: "ஆயில்யம்", ml: "ആയില്യം",
    deity: "The Nagas (serpents)", symbol: "Coiled serpent",
    western: "δ, ε, η, ρ & σ Hydrae", tree: "Nagkesar", syllables: ["Di", "Du", "De", "Do"],
    shloka: { verse: 33,
      text: "युगादिकृद्युगावर्तो नैकमायो महाशनः।\nअदृश्यो व्यक्तरूपश्च सहस्रजिदनन्तजित्॥",
      meaning: "Maker of the beginning of every yuga, who turns the ages round — of countless wonders, unseen yet visible, victor over thousands, conqueror of the endless." } },

  { id: 10, en: "Magha", sa: "मघा", gu: "મઘા", ta: "மகம்", ml: "മകം",
    deity: "The Pitrs (ancestors)", symbol: "Royal throne",
    western: "Regulus", tree: "Banyan", syllables: ["Ma", "Mi", "Mu", "Me"],
    shloka: { verse: 37,
      text: "अशोकस्तारणस्तारः शूरः शौरिर्जनेश्वरः।\nअनुकूलः शतावर्तः पद्मी पद्मनिभेक्षणः॥",
      meaning: "Free of sorrow, the one who carries beings across, the saviour, the hero, lord of people — ever kind, of a hundred turnings, holding the lotus, lotus-eyed." } },

  { id: 11, en: "Purva Phalguni", sa: "पूर्व फाल्गुनी", gu: "પૂર્વા ફાલ્ગુની", ta: "பூரம்", ml: "പൂരം",
    deity: "Bhaga", symbol: "Front legs of a bed",
    western: "δ & θ Leonis", tree: "Palash", syllables: ["Mo", "Ta", "Ti", "Tu"],
    shloka: { verse: 41,
      text: "उद्भवः क्षोभणो देवः श्रीगर्भः परमेश्वरः।\nकरणं कारणं कर्ता विकर्ता गहनो गुहः॥",
      meaning: "The source of all, who sets creation in motion, the shining God holding Shri within — the means and the cause, the maker and transformer, deep and hidden." } },

  { id: 12, en: "Uttara Phalguni", sa: "उत्तर फाल्गुनी", gu: "ઉત્તરા ફાલ્ગુની", ta: "உத்திரம்", ml: "ഉത്രം",
    deity: "Aryaman", symbol: "Back legs of a bed",
    western: "Denebola", tree: "Pakar (fig)", syllables: ["Te", "To", "Pa", "Pi"],
    shloka: { verse: 45,
      text: "ऋतुः सुदर्शनः कालः परमेष्ठी परिग्रहः।\nउग्रः संवत्सरो दक्षो विश्रामो विश्वदक्षिणः॥",
      meaning: "He is the seasons, the auspicious sight, Time itself, the supreme who embraces all — the mighty one, the Year, the skilful, the place of rest, most generous." } },

  { id: 13, en: "Hasta", sa: "हस्त", gu: "હસ્ત", ta: "அஸ்தம்", ml: "അത്തം",
    deity: "Savitr (the Sun)", symbol: "Open hand",
    western: "α–ε Corvi", tree: "Reetha", syllables: ["Pu", "Sha", "Na", "Tha"],
    shloka: { verse: 49,
      text: "सुव्रतः सुमुखः सूक्ष्मः सुघोषः सुखदः सुहृत्।\nमनोहरो जितक्रोधो वीरबाहुर्विदारणः॥",
      meaning: "Of noble vows and a gracious face, subtle, sweet of voice, giver of joy, the true friend — enchanting, master of anger, mighty-armed, destroyer of evil." } },

  { id: 14, en: "Chitra", sa: "चित्रा", gu: "ચિત્રા", ta: "சித்திரை", ml: "ചിത്തിര",
    deity: "Tvashtr (Vishvakarma)", symbol: "Bright jewel",
    western: "Spica", tree: "Bael", syllables: ["Pe", "Po", "Ra", "Ri"],
    shloka: { verse: 53,
      text: "उत्तरो गोपतिर्गोप्ता ज्ञानगम्यः पुरातनः।\nशरीरभूतभृद्भोक्ता कपीन्द्रो भूरिदक्षिणः॥",
      meaning: "The one who lifts beings across, lord and protector, reached through wisdom, the ancient one — sustainer of all bodies, the enjoyer, lord of the vanaras, endlessly generous." } },

  { id: 15, en: "Swati", sa: "स्वाति", gu: "સ્વાતિ", ta: "சுவாதி", ml: "ചോതി",
    deity: "Vayu (wind)", symbol: "Young sprout in the wind",
    western: "Arcturus", tree: "Arjuna", syllables: ["Ru", "Re", "Ro", "Ta"],
    shloka: { verse: 57,
      text: "महर्षिः कपिलाचार्यः कृतज्ञो मेदिनीपतिः।\nत्रिपदस्त्रिदशाध्यक्षो महाशृङ्गः कृतान्तकृत्॥",
      meaning: "The great sage Kapila, the grateful lord of the earth — Tripada, who measured the worlds in three steps, lord of the gods, the great-horned fish, who ends death." } },

  { id: 16, en: "Vishakha", sa: "विशाखा", gu: "વિશાખા", ta: "விசாகம்", ml: "വിശാഖം",
    deity: "Indra & Agni", symbol: "Triumphal arch",
    western: "α, β, γ & ι Librae", tree: "Vikankata", syllables: ["Ti", "Tu", "Te", "To"],
    shloka: { verse: 61,
      text: "सुधन्वा खण्डपरशुर्दारुणो द्रविणप्रदः।\nदिवःस्पृक् सर्वदृग्व्यासो वाचस्पतिरयोनिजः॥",
      meaning: "Bearer of the fine bow and the axe, fierce to evil, giver of wealth — who touches the heavens, sees all, the sage Vyasa, lord of speech, born of no womb." } },

  { id: 17, en: "Anuradha", sa: "अनुराधा", gu: "અનુરાધા", ta: "அனுஷம்", ml: "അനിഴം",
    deity: "Mitra", symbol: "Lotus",
    western: "β, δ & π Scorpii", tree: "Bakul", syllables: ["Na", "Ni", "Nu", "Ne"],
    shloka: { verse: 65,
      text: "श्रीदः श्रीशः श्रीनिवासः श्रीनिधिः श्रीविभावनः।\nश्रीधरः श्रीकरः श्रेयः श्रीमाँल्लोकत्रयाश्रयः॥",
      meaning: "Giver of Shri, lord of Shri, home and treasure of Shri, who reveals her glory — bearer and maker of fortune, the highest good, refuge of the three worlds." } },

  { id: 18, en: "Jyeshtha", sa: "ज्येष्ठा", gu: "જ્યેષ્ઠા", ta: "கேட்டை", ml: "തൃക്കേട്ട",
    deity: "Indra", symbol: "Earring / umbrella",
    western: "Antares", tree: "Semal", syllables: ["No", "Ya", "Yi", "Yu"],
    shloka: { verse: 69,
      text: "कालनेमिनिहा वीरः शौरिः शूरजनेश्वरः।\nत्रिलोकात्मा त्रिलोकेशः केशवः केशिहा हरिः॥",
      meaning: "Slayer of the demon Kalanemi, the hero, lord of the brave — soul and lord of the three worlds, Keshava, slayer of Keshi, Hari." } },

  { id: 19, en: "Mula", sa: "मूल", gu: "મૂળ", ta: "மூலம்", ml: "മൂലം",
    deity: "Nirriti", symbol: "Bunch of roots",
    western: "λ Scorpii (Shaula)", tree: "Sal", syllables: ["Ye", "Yo", "Ba", "Bi"],
    shloka: { verse: 73,
      text: "स्तव्यः स्तवप्रियः स्तोत्रं स्तुतिः स्तोता रणप्रियः।\nपूर्णः पूरयिता पुण्यः पुण्यकीर्तिरनामयः॥",
      meaning: "Worthy of praise and loving it — the hymn, the praise and the singer too — complete, the fulfiller, holy, of sacred fame, free from all suffering." } },

  { id: 20, en: "Purva Ashadha", sa: "पूर्वाषाढ़ा", gu: "પૂર્વાષાઢા", ta: "பூராடம்", ml: "പൂരാടം",
    deity: "Apas (the waters)", symbol: "Elephant tusk / fan",
    western: "δ & ε Sagittarii", tree: "Ashoka", syllables: ["Bu", "Dha", "Bha", "Dha"],
    shloka: { verse: 77,
      text: "विश्वमूर्तिर्महामूर्तिर्दीप्तमूर्तिरमूर्तिमान्।\nअनेकमूर्तिरव्यक्तः शतमूर्तिः शताननः॥",
      meaning: "Whose form is the universe — vast, radiant, yet formless — of many forms, unmanifest, with a hundred forms and a hundred faces." } },

  { id: 21, en: "Uttara Ashadha", sa: "उत्तराषाढ़ा", gu: "ઉત્તરાષાઢા", ta: "உத்திராடம்", ml: "ഉത്രാടം",
    deity: "The Vishvadevas", symbol: "Elephant tusk",
    western: "ζ & σ Sagittarii", tree: "Jackfruit", syllables: ["Be", "Bo", "Ja", "Ji"],
    shloka: { verse: 81,
      text: "तेजोवृषो द्युतिधरः सर्वशस्त्रभृतां वरः।\nप्रग्रहो निग्रहो व्यग्रो नैकशृङ्गो गदाग्रजः॥",
      meaning: "Showering radiance, bearer of brilliance, best of all who bear arms — who receives devotion, restrains evil, is never troubled, many-horned, elder brother of Gada." } },

  { id: 22, en: "Shravana", sa: "श्रवण", gu: "શ્રવણ", ta: "திருவோணம்", ml: "തിരുവോണം",
    deity: "Vishnu", symbol: "Ear / three footprints",
    western: "Altair", tree: "Aak", syllables: ["Ju", "Je", "Jo", "Gha"],
    shloka: { verse: 85,
      text: "उद्भवः सुन्दरः सुन्दो रत्ननाभः सुलोचनः।\nअर्को वाजसनः शृङ्गी जयन्तः सर्वविज्जयी॥",
      meaning: "The source, the beautiful, the compassionate, jewel-navelled, lovely-eyed — radiant as the sun, giver of food, the horned one, ever-victorious, all-knowing conqueror." },
    note: "Shravana is Vishnu's own nakshatra." },

  { id: 23, en: "Dhanishta", sa: "धनिष्ठा", gu: "ધનિષ્ઠા", ta: "அவிட்டம்", ml: "അവിട്ടം",
    deity: "The eight Vasus", symbol: "Drum (mridanga)",
    western: "Delphinus", tree: "Shami", syllables: ["Ga", "Gi", "Gu", "Ge"],
    shloka: { verse: 89,
      text: "सहस्रार्चिः सप्तजिह्वः सप्तैधाः सप्तवाहनः।\nअमूर्तिरनघोऽचिन्त्यो भयकृद्भयनाशनः॥",
      meaning: "Of a thousand rays, the seven-tongued fire, of seven flames, drawn by seven horses — formless, sinless, beyond thought, who brings fear to evil and removes all fear." } },

  { id: 24, en: "Shatabhisha", sa: "शतभिषा", gu: "શતભિષા", ta: "சதயம்", ml: "ചതയം",
    deity: "Varuna", symbol: "Empty circle",
    western: "γ Aquarii", tree: "Kadamba", syllables: ["Go", "Sa", "Si", "Su"],
    shloka: { verse: 93,
      text: "सत्त्ववान् सात्त्विकः सत्यः सत्यधर्मपरायणः।\nअभिप्रायः प्रियार्होऽर्हः प्रियकृत् प्रीतिवर्धनः॥",
      meaning: "Full of goodness, pure, truth itself, devoted to truth and dharma — the goal of all seeking, worthy of love and worship, who does good and increases joy." } },

  { id: 25, en: "Purva Bhadrapada", sa: "पूर्व भाद्रपद", gu: "પૂર્વા ભાદ્રપદા", ta: "பூரட்டாதி", ml: "പൂരുരുട്ടാതി",
    deity: "Aja Ekapada", symbol: "Front legs of a cot",
    western: "α & β Pegasi", tree: "Mango", syllables: ["Se", "So", "Da", "Di"],
    shloka: { verse: 97,
      text: "अरौद्रः कुण्डली चक्री विक्रम्यूर्जितशासनः।\nशब्दातिगः शब्दसहः शिशिरः शर्वरीकरः॥",
      meaning: "Never wrathful, wearing earrings, bearer of the discus, mighty, whose command prevails — beyond words, the cool one, the maker of the night." } },

  { id: 26, en: "Uttara Bhadrapada", sa: "उत्तर भाद्रपद", gu: "ઉત્તરા ભાદ્રપદા", ta: "உத்திரட்டாதி", ml: "ഉത്രട്ടാതി",
    deity: "Ahirbudhnya", symbol: "Back legs of a cot / twins",
    western: "γ Pegasi & α Andromedae", tree: "Neem", syllables: ["Du", "Tha", "Jha", "Na"],
    shloka: { verse: 101,
      text: "अनादिर्भूर्भुवो लक्ष्मीः सुवीरो रुचिराङ्गदः।\nजननो जनजन्मादिर्भीमो भीमपराक्रमः॥",
      meaning: "Without beginning, the earth and the sky, glory itself, the great hero with shining armlets — creator of beings, root of all birth, awesome in might." } },

  { id: 27, en: "Revati", sa: "रेवती", gu: "રેવતી", ta: "ரேவதி", ml: "രേവതി",
    deity: "Pushan", symbol: "Fish / drum",
    western: "ζ Piscium", tree: "Mahua", syllables: ["De", "Do", "Cha", "Chi"],
    shloka: { verse: 105,
      text: "यज्ञभृद् यज्ञकृद् यज्ञी यज्ञभुक् यज्ञसाधनः।\nयज्ञान्तकृद् यज्ञगुह्यमन्नमन्नाद एव च॥",
      meaning: "Bearer, maker and lord of the sacrifice, its enjoyer and its means — who completes it, its hidden secret, the food and the one who eats it." } },
];

/* Vishnu Purana elements for the "Sky as Vishnu" section.
   TEAM: confirm chapter numbers in H.H. Wilson's translation (1840). */
const VISHNU_PURANA = [
  { title: "The 27 daughters of Daksha", where: "Book 1",
    text: "Daksha gives twenty-seven of his daughters to Soma, the Moon — the 27 nakshatras he visits each night." },
  { title: "Shishumara — the sky as Vishnu", where: "Book 2",
    text: "The starry sky is pictured as Shishumara, the celestial porpoise, the star-form of Vishnu, with Dhruva at its tail. All the stars turn around it." },
  { title: "Dhruva, the pole star", where: "Book 1",
    text: "A young prince's devotion to Vishnu earns him a fixed place in the sky — the pole star around which the heavens revolve." },
  { title: "The Moon's chariot", where: "Book 2",
    text: "The Moon crosses the sky in a chariot drawn by white horses." },
  { title: "Cosmic time", where: "Book 1",
    text: "Time is measured in vast cycles — from the yugas up to a day of Brahma." },
];

/* Sky position (J2000, degrees) of each nakshatra's main star (yoga-tara).
   Used by Mudra Cosmos (real sky map) and Snap the Real Sky (which stars are in a photo). */
const YOGATARA = {
  1: { star: "β Arietis", ra: 28.66, dec: 20.81 },   2: { star: "41 Arietis", ra: 42.50, dec: 27.26 },
  3: { star: "Alcyone (η Tau)", ra: 56.87, dec: 24.11 }, 4: { star: "Aldebaran", ra: 68.98, dec: 16.51 },
  5: { star: "λ Orionis", ra: 83.78, dec: 9.93 },     6: { star: "Betelgeuse", ra: 88.79, dec: 7.41 },
  7: { star: "Pollux", ra: 116.33, dec: 28.03 },      8: { star: "δ Cancri", ra: 131.17, dec: 18.15 },
  9: { star: "ε Hydrae", ra: 131.69, dec: 6.42 },     10: { star: "Regulus", ra: 152.09, dec: 11.97 },
  11: { star: "δ Leonis", ra: 168.53, dec: 20.52 },   12: { star: "Denebola", ra: 177.26, dec: 14.57 },
  13: { star: "δ Corvi", ra: 187.47, dec: -16.52 },   14: { star: "Spica", ra: 201.30, dec: -11.16 },
  15: { star: "Arcturus", ra: 213.92, dec: 19.18 },   16: { star: "α Librae", ra: 222.72, dec: -16.04 },
  17: { star: "δ Scorpii", ra: 240.08, dec: -22.62 }, 18: { star: "Antares", ra: 247.35, dec: -26.43 },
  19: { star: "λ Scorpii (Shaula)", ra: 263.40, dec: -37.10 }, 20: { star: "δ Sagittarii", ra: 275.25, dec: -29.83 },
  21: { star: "σ Sagittarii", ra: 283.82, dec: -26.30 }, 22: { star: "Altair", ra: 297.70, dec: 8.87 },
  23: { star: "β Delphini", ra: 309.39, dec: 14.60 }, 24: { star: "λ Aquarii", ra: 343.15, dec: -7.58 },
  25: { star: "Markab (α Peg)", ra: 346.19, dec: 15.21 }, 26: { star: "Algenib (γ Peg)", ra: 3.31, dec: 15.18 },
  27: { star: "ζ Piscium", ra: 18.43, dec: 7.58 },
};
const DHRUVA = { star: "Polaris (Dhruva)", ra: 37.95, dec: 89.26 };

if (typeof module !== "undefined") module.exports = { NAKSHATRAS, VISHNU_PURANA, YOGATARA, DHRUVA };
