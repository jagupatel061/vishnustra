/* =====================================================================
   room.js — shares jury stars between phones and the laptop
   Modes, in order of preference:
   · "server"   — the Vishnustra backend (npm start). Saved in server/data/db.json,
                  pushed live to the room screen with Server-Sent Events.
   · "firebase" — only if js/config.js has Firebase settings (hosting without the server)
   · "demo"     — same device only (two tabs), for rehearsing without a server
   Needs js/api.js loaded first.
   ===================================================================== */
const Room = (() => {
  const cfg = window.VISHNUSTRA_CONFIG || {};
  let db = null, ready = null;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("Could not load " + src));
      document.head.appendChild(s);
    });
  }

  function init() {
    if (ready) return ready;
    ready = (async () => {
      if (await API.info()) return "server";
      if (cfg.firebase) {
        try {
          await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
          await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js");
          if (!firebase.apps.length) firebase.initializeApp(cfg.firebase);
          db = firebase.database();
          return "firebase";
        } catch (e) { console.warn("Firebase unavailable:", e); }
      }
      return "demo";
    })();
    return ready;
  }

  const key = (code) => "vishnustra-room-" + code;
  const clean = (code) => String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  function newCode() {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join("");
  }

  /* guest: { name, date, slot, time } (server calculates the star)
            plus { starId, star, sa } for the other modes */
  async function add(code, guest) {
    code = clean(code);
    const mode = await init();
    if (mode === "server") return { mode, guest: await API.post(`/rooms/${code}/guests`, guest) };
    const g = { name: guest.name, starId: guest.starId, star: guest.star, sa: guest.sa, at: Date.now() };
    if (mode === "firebase") { await db.ref(`rooms/${code}/guests`).push(g); return { mode, guest: g }; }
    let list = [];
    try { list = JSON.parse(localStorage.getItem(key(code)) || "[]"); } catch {}
    list.push(g);
    try { localStorage.setItem(key(code), JSON.stringify(list)); } catch {}
    try { new BroadcastChannel(key(code)).postMessage(g); } catch {}
    return { mode, guest: g };
  }

  /* onGuest(guest) for every existing and new guest; onClear() when the room is emptied */
  async function listen(code, onGuest, onClear = () => {}) {
    code = clean(code);
    const mode = await init();
    if (mode === "server") {
      const es = new EventSource(`${API.base}/rooms/${code}/stream`);
      const seen = new Set();
      es.addEventListener("guest", (e) => { const g = JSON.parse(e.data); if (!seen.has(g.id)) { seen.add(g.id); onGuest(g); } });
      es.addEventListener("cleared", () => { seen.clear(); onClear(); });
    } else if (mode === "firebase") {
      db.ref(`rooms/${code}/guests`).on("child_added", (snap) => onGuest(snap.val()));
    } else {
      let list = [];
      try { list = JSON.parse(localStorage.getItem(key(code)) || "[]"); } catch {}
      list.forEach(onGuest);
      try { new BroadcastChannel(key(code)).onmessage = (e) => onGuest(e.data); } catch {}
    }
    return mode;
  }

  async function clear(code) {
    code = clean(code);
    const mode = await init();
    if (mode === "server") await fetch(`${API.base}/rooms/${code}`, { method: "DELETE" });
    else if (mode === "firebase") await db.ref(`rooms/${code}`).remove();
    else try { localStorage.removeItem(key(code)); } catch {}
  }

  return { add, listen, clear, newCode, clean, init };
})();
