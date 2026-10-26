/* =====================================================================
   db.js — Vishnustra's database
   A simple JSON document store. Everything is kept in memory and saved to
   server/data/db.json after each change, so you can open that file in
   VS Code and watch new records appear while people use the site.

   Collections:
     guests        jury members who joined a QR room (name, birth date, star, room)
     lookups       every "Find your birth star" search
     poll          answers to "Did you already know your nakshatra?"
     questions     questions asked to Rishi AI
     certificates  people who finished The Lost Observatory
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = path.join(__dirname, "data", "db.json");
const EMPTY = { guests: [], lookups: [], poll: [], questions: [], certificates: [] };

let data = load();
let saveTimer = null;

function load() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return { ...structuredClone(EMPTY), ...parsed };
  } catch {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    return structuredClone(EMPTY);
  }
}

function save() {
  // write to a temporary file, then rename: the JSON is never half-written
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);
  }, 50);
}

/** Add a record to a collection. Returns the stored record (with id + time). */
function insert(collection, record) {
  if (!data[collection]) throw new Error("Unknown collection " + collection);
  const row = { id: crypto.randomUUID().slice(0, 8), createdAt: new Date().toISOString(), ...record };
  data[collection].push(row);
  save();
  return row;
}

function all(collection) { return data[collection] || []; }
function where(collection, fn) { return all(collection).filter(fn); }

function remove(collection, fn) {
  const before = all(collection).length;
  data[collection] = all(collection).filter((r) => !fn(r));
  save();
  return before - data[collection].length;
}

function reset() { data = structuredClone(EMPTY); save(); }
function snapshot() { return data; }

module.exports = { insert, all, where, remove, reset, snapshot, FILE };
