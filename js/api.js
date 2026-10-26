/* =====================================================================
   api.js — talks to the Vishnustra backend (server/server.js)
   API.info() resolves to the server info, or null when the page was opened
   without the server (e.g. Live Server / double-click). Pages then fall back
   to working on their own, without saving data.
   ===================================================================== */
const API = (() => {
  const base = (window.VISHNUSTRA_CONFIG && window.VISHNUSTRA_CONFIG.api) || "/api";
  let infoPromise = null;

  function info() {
    if (!infoPromise) {
      infoPromise = (async () => {
        try {
          const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 2500);
          const r = await fetch(base + "/info", { signal: ctrl.signal, cache: "no-store" });
          if (!r.ok) return null;
          const j = await r.json();
          return j && j.server ? j : null;
        } catch { return null; }
      })();
    }
    return infoPromise;
  }

  async function post(path, body) {
    const r = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Request failed (" + r.status + ")");
    return j;
  }
  async function get(path) {
    const r = await fetch(base + path, { cache: "no-store" });
    if (!r.ok) throw new Error("Request failed (" + r.status + ")");
    return r.json();
  }

  /* Save something only if the server is running; never breaks the page. */
  async function save(path, body) {
    if (!(await info())) return null;
    try { return await post(path, body); } catch (e) { console.warn("Could not save:", e.message); return null; }
  }

  return { info, post, get, save, base };
})();
