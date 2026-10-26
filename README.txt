VISHNUSTRA — Foundation of Indian Culture project
Made by Jagruti Patel, Mahek Desai & Varun Danecha
====================================================================

A full website + backend about the 27 nakshatras.
Frontend: HTML, CSS, JavaScript.  Backend: Node.js (built-in modules only).
Database: server/data/db.json (open it in VS Code and watch it fill up).


1) ONE-TIME SETUP (5 minutes)
-------------------------------------------------
  a. Install Node.js (LTS) from https://nodejs.org  → keep clicking Next.
     Check: open a terminal and type   node -v   (you should see v18 or higher)
  b. Unzip this folder. In VS Code: File → Open Folder → choose "vishnustra".
  c. Nothing else to install. There are no npm packages.


2) RUN IT (every time)
-------------------------------------------------
  In VS Code: Terminal → New Terminal, then type:

      npm start

  (or press F5 and choose "Run Vishnustra server")

  The terminal prints the addresses:
      Laptop (open this):   http://localhost:3000
      QR Room:              http://localhost:3000/room.html
      Backend data page:    http://localhost:3000/admin.html
      Phones (same Wi-Fi):  https://192.168.x.x:3443

  Windows may ask "Allow Node.js on networks?" → tick Private, click Allow.
  Stop the server with Ctrl + C.

  IMPORTANT: open the site from http://localhost:3000 — NOT from Live Server.
  Live Server shows the pages, but without the backend (no saving, no phones).


3) JURY DAY: THE QR ROOM
-------------------------------------------------
  1. Turn on your phone's HOTSPOT. Connect the laptop to it.
     (College Wi-Fi often blocks phone-to-laptop connections; a hotspot always works.)
  2. Run  npm start  on the laptop.  (If you connected to the hotspot AFTER starting,
     stop with Ctrl+C and run npm start again so it picks up the new address.)
  3. Open http://localhost:3000/room.html on the laptop, full screen (F11).
  4. Jury members connect their phones to the same hotspot and scan the QR.
  5. The first time, the phone says "Your connection is not private":
        Android/Chrome: tap  Advanced → Proceed to 192.168…
        iPhone/Safari:  tap  Show Details → visit this website → Visit Website
     This is normal: it's our own local certificate (server/certs), needed so the
     phone camera is allowed.
  6. They enter name + birth date → the camera shows their star on the wall,
     and their star + name appear on the laptop. iPhone: tap "Enable motion".
  7. Show the examiners http://localhost:3000/admin.html and server/data/db.json —
     the data arrives live.

  Rehearse first: on the room page press "Add a test guest" to see the effect.
  Clear data before the jury: admin page → "Clear all data", or  npm run reset-data


4) WHERE THE DATA IS STORED (for the viva)
-------------------------------------------------
  server/data/db.json has 5 collections:
    guests        name, birth date, time of day, nakshatra, pada, room, device, time
    lookups       every "Find your birth star" search on the home page
    poll          "Did you already know your nakshatra?" answers
    questions     questions asked to Rishi AI
    certificates  people who finished The Lost Observatory
  The server calculates the nakshatra itself from the birth date (server/server.js → starFor),
  saves the record (server/db.js → insert), and pushes it live to the room and admin pages
  using Server-Sent Events (/api/rooms/CODE/stream, /api/admin/stream).

  API routes (server/server.js):
    GET  /api/info                    server address for the QR code
    GET  /api/qr?text=…               QR code image made by the server
    GET  /api/star?date=YYYY-MM-DD    calculate a nakshatra
    POST /api/lookups                 save a birth-star search
    GET/POST /api/poll                poll results / save an answer
    GET/POST /api/rooms/CODE/guests   list / add jury guests
    GET  /api/rooms/CODE/stream       live updates for the QR room
    POST /api/rishi                   Rishi AI question (log + Gemini if a key is set)
    POST /api/certificates            save an Observatory certificate
    GET/POST /api/snap                photo star-matching via astrometry.net
    GET  /api/admin/data              the whole database
    GET  /api/admin/stream            live updates for the admin page


5) OPTIONAL EXTRAS (.env file)
-------------------------------------------------
  Copy .env.example to .env and fill in:
    GEMINI_API_KEY      → Rishi AI answers with Google Gemini (free key: aistudio.google.com).
                          Without it, Rishi answers from our own star data (works offline).
    ASTROMETRY_API_KEY  → Snap the Sky matches real photos (free key: nova.astrometry.net).
                          Without it, "Try a sample sky" still works.
  Restart the server after editing .env. These need internet.


6) FILES
-------------------------------------------------
  index.html          Home: solar system, hero, Time Machine, 27 stars, Find your star + poll,
                      Sky as Vishnu (Shishumara + shlokas), modules, astronomers
  portal.html         Sky Portal (phone camera + your star)
  room.html           QR Room (laptop screen)
  rishi.html          Rishi AI chat
  mudra.html          Mudra Cosmos (hand-gesture sky map; needs internet for hand tracking)
  observatory.html    The Lost Observatory game
  snap.html           Snap the Real Sky
  sky.html            Sky Guide: live sky dome for any city/night + when/where/how to see all 27
  festivals.html      Festival Calendar: next date of each star festival + months named by stars
  admin.html          Backend data (live)
  data/nakshatras.js  All 27 stars: names in 5 languages, facts, shlokas, sky positions  ← research team checks
  js/astro.js         Moon position (Jean Meeus) + Lahiri ayanamsa → nakshatra + pada
  js/qr.js            Our own QR code generator (works offline)
  js/festcalc.js      Festival dates: new/full moons, lunar months (adhika too), star days
  data/festivals.js   The 15 festivals and their rules  ← research team checks
  js/skycalc.js       Sky Guide maths: sidereal time → altitude/azimuth, rise/set, sunset, seasons
  data/skyguide.js    How to find each star (star-hops), brightness, cities  ← research team checks
  js/starcard.js      Star Card: draws a 1080×1350 picture of your star to download/share
  js/api.js, js/room.js   Frontend ↔ backend
  server/server.js    The backend (HTTP + HTTPS, API, live updates)
  server/db.js        The database code
  server/data/db.json The database file
  server/certs/       Local HTTPS certificate (so phone cameras work)


7) VIVA NOTES
-------------------------------------------------
  - Moon position: Jean Meeus, Astronomical Algorithms, ch. 47 (main periodic terms).
    Sidereal longitude = tropical − Lahiri ayanamsa (23°51′ at 2000, +50.29″/year).
    Nakshatra = floor(sidereal ÷ 13°20′) + 1; pada = quarter of 3°20′.
  - Checked against festivals: Onam = Shravana, Karthigai Deepam = Krittika, Chitra Pournami = Chitra.
  - Shlokas: Vishnu Sahasranama (Mahabharata, Anushasana Parva). By devotional tradition
    its 108 verses match the 108 padas: star N, pada P → verse 4(N−1)+P.
  - Shishumara, Dhruva and the 27 daughters of Daksha: Vishnu Purana (H.H. Wilson's translation).
  - Festival Calendar: a lunar month starts at a new moon and is named from the Sun's sidereal
    sign then (Sun in Meena → Chaitra …); two new moons in one sign → adhika (leap) month.
    Its full moon sits near the star it is named after (Kartika ↔ Krittika).
    Star festivals (Onam, Karthigai Deepam …) = Moon's star at sunrise in the solar month;
    if the star comes twice in that month, the second one. Checked: 2026 Onam 26 Aug,
    Raksha Bandhan 28 Aug, Aadi Pooram 14 Aug, Panguni Uttiram 1 Apr, Karthigai Deepam 24 Nov.
  - Sky Guide: local sidereal time = 280.46° + 360.9856°×(days since 2000) + longitude.
    Hour angle = sidereal time − RA. Then altitude = asin(sinφ sinδ + cosφ cosδ cosH).
    "Evening sky" months = when the star crosses the south at 9 p.m.; "hidden" = when the Sun
    stands next to it. Check any answer against Stellarium (free app).
  - "This is cultural astronomy, not prediction."

8) RUN WITHOUT INSTALLING ANYTHING
-------------------------------------------------
  OPTION A — Online (nothing on the laptop; best for the jury)
    The site runs on Render's free server with a real https link, so phones on ANY
    network (college Wi-Fi, mobile data) can scan the QR, and there is no "not private" warning.
    1. Make a free account at https://github.com → "New repository" → name it vishnustra.
       On the repository page click "uploading an existing file" and drag in ALL the files
       and folders from this vishnustra folder → Commit changes.
    2. Make a free account at https://render.com (sign in with GitHub).
    3. New → Blueprint → choose the vishnustra repository → Apply.
       (Or New → Web Service → choose the repo → Start command: npm start → Free → Create.)
    4. After 2–3 minutes you get a link like https://vishnustra.onrender.com
       Room: https://vishnustra.onrender.com/room.html   Data: …/admin.html
    Notes: the free server sleeps after 15 minutes without visitors; open the link
    2 minutes before the jury to wake it. Its database file resets when Render restarts
    the server, so show the live data on /admin.html during the demo
    (and keep your local copy of server/data/db.json to show in VS Code).
    To add Gemini / astrometry keys: Render → your service → Environment.

  OPTION B — On the laptop with "portable" Node.js (no installer, no admin rights)
    1. https://nodejs.org/en/download → Windows → "Standalone Binary (.zip)".
    2. Unzip it inside this vishnustra folder (a folder like node-v22.x.x-win-x64 appears).
    3. Double-click START-VISHNUSTRA.bat. The same terminal window as "npm start" opens.
       Everything in sections 2–4 above works the same.
