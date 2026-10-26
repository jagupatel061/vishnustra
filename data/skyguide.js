/* =====================================================================
   SKY GUIDE — how to find each nakshatra with your own eyes
   mag  = brightness of the main star (smaller = brighter; 0–1 very bright,
          2–3 easy from a town, 4+ needs a dark sky)
   find = a simple star-hop from something easy to spot
   see  = what it looks like
   TEAM: check against a star chart (Stellarium is free) before the jury.
   ===================================================================== */
const SKYGUIDE = {
  1:  { mag: 2.6, see: "Two stars close together, the horse's head.",
        find: "Halfway between the Pleiades and the Great Square of Pegasus, look for a short, bent line of two or three stars (Sheratan and Hamal in Aries)." },
  2:  { mag: 3.6, see: "A small, faint triangle of three stars.",
        find: "Just east of Ashwini, about a third of the way from Ashwini to the Pleiades. Needs a dark sky away from city lights." },
  3:  { mag: 2.9, see: "A tiny misty cluster, like a little dipper. Six or seven stars to the eye.",
        find: "Follow the three stars of Orion's belt up and to the right, past orange Aldebaran, to the misty cluster: the Pleiades." },
  4:  { mag: 0.9, see: "A bright orange star at the tip of a V-shaped group (the Hyades), like a cart.",
        find: "Follow Orion's belt upward to the right: the first bright orange star you meet is Aldebaran, the 'eye of the bull'." },
  5:  { mag: 3.4, see: "A small, faint triangle: the deer's head.",
        find: "Find Orion's two shoulder stars, red Betelgeuse and Bellatrix. The faint little triangle just above and between them is Orion's head." },
  6:  { mag: 0.5, see: "A single bright red-orange star: a teardrop, or a jewel.",
        find: "Orion's shoulder: above the three belt stars, the bright reddish one on the eastern (left, in the evening) side is Betelgeuse." },
  7:  { mag: 1.1, see: "Two bright stars side by side, like twins (Castor and Pollux).",
        find: "From Orion, look up and to the left (east) for two bright stars in a pair. Pollux is the brighter, slightly orange one." },
  8:  { mag: 3.9, see: "Faint stars around a misty patch, the Beehive cluster (Praesepe).",
        find: "Halfway between Pollux and Regulus, in an empty-looking area, a fuzzy patch shows on a dark night. It is the 'flower' of Pushya." },
  9:  { mag: 3.4, see: "A small ring of five or six stars: the coiled serpent's head.",
        find: "Below the faint Cancer stars, east of bright Procyon, look for a small loop of stars: the head of Hydra, the water snake." },
  10: { mag: 1.4, see: "A bright white star at the base of a backward question mark (the Sickle of Leo).",
        find: "Leo looks like a lion lying down. Regulus is its heart: the bright star at the bottom of the 'hook' of stars." },
  11: { mag: 2.6, see: "The lion's back: two stars of a triangle, the front legs of a bed.",
        find: "From Regulus look east (left) to a triangle of stars at the lion's hip. The western pair of that area is Purva Phalguni." },
  12: { mag: 2.1, see: "The lion's tail: a medium-bright star at the eastern end of Leo.",
        find: "Keep going east from the lion's hip triangle: the last bright star at the tip of the tail is Denebola." },
  13: { mag: 2.9, see: "Four stars in a small, slanted box, like an open palm.",
        find: "From bright Spica, look a little to the west (right) and down: a neat four-sided shape, Corvus the crow. It is the 'hand'." },
  14: { mag: 1.0, see: "A single bright, blue-white star, shining like a pearl.",
        find: "Follow the curve of the Big Dipper's handle: arc to orange Arcturus, then 'speed on' to Spica." },
  15: { mag: 0.0, see: "A single bright orange star, the brightest in the northern sky.",
        find: "Follow the curve of the Big Dipper's handle outward: the first very bright star you meet is Arcturus." },
  16: { mag: 2.8, see: "Two medium stars, the pans of a scale (Libra), shaped like a gate.",
        find: "Between Spica and the red heart of the Scorpion (Antares), look for two fairly bright stars, well apart." },
  17: { mag: 2.3, see: "A short, curved line of three stars: the Scorpion's head and claws.",
        find: "Find red Antares low in the south. The curved line of three stars just to its right (west) is Anuradha." },
  18: { mag: 1.0, see: "A bright red star with a fainter star on each side.",
        find: "Low in the south on summer evenings, the brightest reddish star in the curving Scorpion is Antares, its heart." },
  19: { mag: 1.6, see: "Two stars close together at the end of a curled tail: the sting.",
        find: "Follow the Scorpion's body from Antares down and to the left, to the hook at its tail. It points toward the centre of our galaxy." },
  20: { mag: 2.7, see: "Stars of the 'Teapot' shape in Sagittarius: the spout side.",
        find: "Just east (left) of the Scorpion's tail, find a shape like a teapot. The stars on its western (spout) side are Purva Ashadha." },
  21: { mag: 2.0, see: "The handle side of the 'Teapot'.",
        find: "In the same Teapot shape, the stars on its eastern (handle) side are Uttara Ashadha. Nunki is the brightest of them." },
  22: { mag: 0.8, see: "A bright star with a fainter star on each side, in a line: three footprints.",
        find: "Look for a bright star high in the sky on evenings from August to November, with a small star close above and below it." },
  23: { mag: 3.6, see: "A small diamond of four stars with a tail, like a drum (Delphinus, the dolphin).",
        find: "From Altair (Shravana), look up and to the left (north-east): a tiny, neat diamond of stars." },
  24: { mag: 3.7, see: "A faint, scattered circle of stars: 'a hundred healers'.",
        find: "Below the Great Square of Pegasus, in Aquarius. Hard to see: wait for a dark, moonless sky and let your eyes adjust for 15 minutes." },
  25: { mag: 2.5, see: "The western side of a huge square of four stars (the Great Square of Pegasus).",
        find: "On autumn evenings, look high in the east for a very big square of four medium-bright stars. Its two right-hand (western) stars are Purva Bhadrapada." },
  26: { mag: 2.8, see: "The eastern side of the Great Square of Pegasus.",
        find: "In the same Great Square, the two left-hand (eastern) stars are Uttara Bhadrapada." },
  27: { mag: 5.2, see: "A very faint star in Pisces, the last nakshatra.",
        find: "South-east of the Great Square, along a faint loop of stars in Pisces. It needs binoculars or a very dark village sky." },
};

const CITIES = [
  ["Surat (Auro University)", 21.17, 72.83], ["Ahmedabad", 23.03, 72.58], ["Vadodara", 22.31, 73.18],
  ["Mumbai", 19.08, 72.88], ["Pune", 18.52, 73.86], ["Delhi", 28.61, 77.21], ["Jaipur", 26.91, 75.79],
  ["Varanasi", 25.32, 83.01], ["Kolkata", 22.57, 88.36], ["Guwahati", 26.14, 91.74], ["Hyderabad", 17.39, 78.49],
  ["Bengaluru", 12.97, 77.59], ["Chennai", 13.08, 80.27], ["Kochi", 9.93, 76.27],
];

if (typeof module !== "undefined") module.exports = { SKYGUIDE, CITIES };
