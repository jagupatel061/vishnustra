/* =====================================================================
   admin.js — live view of the backend database (server/data/db.json)
   Loads /api/admin/data, then listens to /api/admin/stream and reloads
   whenever a record is added anywhere on the site.
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const when = (iso) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const STAR_NAMES = ["", "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const SLOT = { dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night", exact: "Exact time", "": "Not sure" };

const TABLES = [
  { key: "guests", title: "QR room guests", cols: [["Time", (r) => when(r.createdAt)], ["Room", (r) => r.room], ["Name", (r) => r.name], ["Birth date", (r) => r.date], ["Born around", (r) => SLOT[r.slot ?? ""] ?? r.slot], ["Nakshatra", (r) => r.star, "star"], ["Pada", (r) => r.pada], ["Device", (r) => r.device]] },
  { key: "lookups", title: "Birth-star searches", cols: [["Time", (r) => when(r.createdAt)], ["Birth date", (r) => r.date], ["Born around", (r) => SLOT[r.slot ?? ""] ?? r.slot], ["Nakshatra", (r) => r.star, "star"], ["Pada", (r) => r.pada], ["Could also be", (r) => (r.alternatives || []).join(", ") || "—"]] },
  { key: "poll", title: "Poll · did you know your star?", cols: [["Time", (r) => when(r.createdAt)], ["Answer", (r) => (r.knew ? "Yes, I knew" : "No, new to me")], ["Their star", (r) => STAR_NAMES[r.starId] || "—", "star"]] },
  { key: "questions", title: "Questions asked to Rishi AI", cols: [["Time", (r) => when(r.createdAt)], ["Question", (r) => r.question, "wrap"], ["Answered by", (r) => r.source]] },
  { key: "certificates", title: "Lost Observatory certificates", cols: [["Time", (r) => when(r.createdAt)], ["Name", (r) => r.name], ["Minutes", (r) => r.minutes]] },
];

let known = new Set(), first = true;

function render(d) {
  const poll = d.poll || [], yes = poll.filter((p) => p.knew).length;
  $("#file").textContent = d.file || "server/data/db.json";
  $("#tiles").innerHTML = [
    ["Room guests", d.guests.length], ["Star searches", d.lookups.length],
    ["Poll", poll.length ? `${Math.round((yes / poll.length) * 100)}<small>% knew</small>` : "0"],
    ["Rishi questions", d.questions.length], ["Certificates", d.certificates.length],
  ].map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");

  $("#tables").innerHTML = TABLES.map((t) => {
    const rows = [...(d[t.key] || [])].reverse();
    const body = rows.length
      ? rows.map((r) => `<tr class="${!first && !known.has(r.id) ? "new" : ""}">${t.cols.map(([, f, cls]) => `<td class="${cls || ""}">${esc(f(r))}</td>`).join("")}</tr>`).join("")
      : `<tr class="empty"><td colspan="${t.cols.length}">Nothing yet</td></tr>`;
    return `<section><div class="tbl-head"><h2>${t.title}</h2><span class="cap muted">${rows.length} ${rows.length === 1 ? "record" : "records"}</span></div>
      <div class="scroll"><table><thead><tr>${t.cols.map(([h]) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div></section>`;
  }).join("");
  known = new Set(TABLES.flatMap((t) => (d[t.key] || []).map((r) => r.id)));
  first = false;
}

let timer = 0;
async function load() {
  try { render(await API.get("/admin/data")); }
  catch { $("#offline").hidden = false; }
}

API.info().then((info) => {
  if (!info) {
    $("#offline").hidden = false;
    $("#live-text").textContent = "Server not running";
    render({ guests: [], lookups: [], poll: [], questions: [], certificates: [] });
    return;
  }
  load();
  const es = new EventSource(API.base + "/admin/stream");
  es.onopen = () => { $("#live-text").textContent = "Live · updates automatically"; $("#live").classList.add("live"); };
  es.onerror = () => { $("#live-text").textContent = "Reconnecting…"; $("#live").classList.remove("live"); };
  es.addEventListener("change", () => { clearTimeout(timer); timer = setTimeout(load, 120); });
});

/* two-step clear (no pop-up dialogs) */
let armed = false;
$("#reset").addEventListener("click", async () => {
  if (!armed) { armed = true; $("#reset").textContent = "Click again to delete everything"; $("#reset-note").textContent = "This empties server/data/db.json."; setTimeout(() => { armed = false; $("#reset").textContent = "Clear all data"; $("#reset-note").textContent = ""; }, 4000); return; }
  armed = false;
  try { await API.post("/admin/reset", {}); $("#reset").textContent = "Clear all data"; $("#reset-note").textContent = "All data cleared."; load(); }
  catch { $("#reset-note").textContent = "Couldn't clear: is the server running?"; }
});
