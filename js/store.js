// Stockage local (dans l'appareil uniquement) + fusion entre appareils + paquets.
const KEY = 'mesaicosa.v1';
const now = () => Date.now();
export const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 8);

function blank() {
  return {
    version: 2,
    deviceId: uid(),
    template: null,  // {v: {days: {0..6: {wake, bed, office:[blocs], tt:[blocs]|null}}}, t}
    overrides: {},   // 'YYYY-MM-DD' -> {v: [blocs libres du jour], t}
    tt: {},          // 'YYYY-MM-DD' -> {v:bool, t}
    checks: {},      // 'YYYY-MM-DD|blocId' -> {v:bool, t}
    weights: {},     // domainId -> {v:1|2|3, t}
    domains: [],     // {id, name, k, deleted, t}
    objectives: [],  // {id, horizon, domain, text, done, deleted, t}
    sessions: [],    // {id, module, date, ts, score, unit, details, t}
    reviews: [],     // {id, week, wins, blocks, focus, t}
    typingTexts: [], // {id, text, deleted, t}
    readingTexts: [],// {id, title, theme, text, quiz, deleted, t}
    geo: {},         // countryId -> {ok, ko, t}
    lastExport: 0,
    lastImport: 0,
  };
}

let state;
let memoryOnly = false;
try {
  const raw = localStorage.getItem(KEY);
  state = raw ? { ...blank(), ...JSON.parse(raw) } : blank();
} catch (e) {
  memoryOnly = true;
  state = blank();
}

export function get() { return state; }
export function isMemoryOnly() { return memoryOnly; }

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { memoryOnly = true; }
}

// --- valeurs horodatées (le plus récent gagne lors d'une fusion)
export function setMap(map, key, v) { state[map][key] = { v, t: now() }; save(); }
export function delMap(map, key) { state[map][key] = { v: null, t: now() }; save(); }
export function getMap(map, key, dflt) { const r = state[map][key]; return r && r.v !== null && r.v !== undefined ? r.v : dflt; }

export function template() { return state.template?.v || null; }
export function setTemplate(v) { state.template = { v, t: now() }; save(); }

export function upsert(list, item) {
  const arr = state[list];
  const i = arr.findIndex(x => x.id === item.id);
  const rec = { ...item, t: now() };
  if (i >= 0) arr[i] = rec; else arr.push(rec);
  save();
  return rec;
}
export const alive = list => state[list].filter(x => !x.deleted);

export function addSession(module, score, unit, details = {}) {
  const d = new Date();
  return upsert('sessions', { id: uid(), module, date: isoDate(d), ts: d.getTime(), score, unit, details });
}
export function sessionsOf(module) {
  return state.sessions.filter(s => s.module === module && !s.deleted).sort((a, b) => a.ts - b.ts);
}

export function geoMark(id, ok) {
  const r = state.geo[id] || { ok: 0, ko: 0 };
  state.geo[id] = { ok: r.ok + (ok ? 1 : 0), ko: r.ko + (ok ? 0 : 1), t: now() };
  save();
}

// --- fusion
function mergeMap(a = {}, b = {}) {
  const out = { ...a };
  for (const k in b) if (!out[k] || (b[k].t || 0) > (out[k].t || 0)) out[k] = b[k];
  return out;
}
function mergeList(a = [], b = []) {
  const m = new Map(a.map(x => [x.id, x]));
  for (const x of b) { const y = m.get(x.id); if (!y || (x.t || 0) > (y.t || 0)) m.set(x.id, x); }
  return [...m.values()];
}
const MAPS = ['tt', 'checks', 'weights', 'overrides'];
const LISTS = ['objectives', 'sessions', 'reviews', 'domains', 'typingTexts', 'readingTexts'];

function mergeBackup(inc) {
  const before = state.sessions.length;
  for (const k of MAPS) state[k] = mergeMap(state[k], inc[k]);
  for (const k of LISTS) state[k] = mergeList(state[k], inc[k]);
  if (inc.template && (!state.template || (inc.template.t || 0) > (state.template.t || 0))) state.template = inc.template;
  for (const id in inc.geo || {}) {
    const a = state.geo[id] || { ok: 0, ko: 0, t: 0 }, b = inc.geo[id];
    state.geo[id] = { ok: Math.max(a.ok, b.ok), ko: Math.max(a.ko, b.ko), t: Math.max(a.t || 0, b.t || 0) };
  }
  state.lastImport = now();
  save();
  return state.sessions.length - before;
}

// Un paquet ajoute ou remplace des éléments précis (préparé dans l'app ou par Claude).
function packSummary(d) {
  const out = [];
  if (d.template) out.push('Semaine type complète (remplace la semaine type actuelle)');
  if (d.days) out.push(`Créneaux libres de ${Object.keys(d.days).length} jour(s) : ${Object.keys(d.days).sort().map(x => x.split('-').reverse().slice(0, 2).join('/')).join(', ')}`);
  if (d.tt) out.push(`Jours de télétravail : ${Object.keys(d.tt).sort().join(', ')}`);
  if (d.domains) out.push(`${d.domains.length} domaine(s)`);
  if (d.objectives) out.push(`${d.objectives.length} objectif(s)`);
  if (d.weights) out.push(`${Object.keys(d.weights).length} priorité(s)`);
  if (d.typingTexts) out.push(`${d.typingTexts.length} texte(s) de dactylographie`);
  if (d.readingTexts) out.push(`${d.readingTexts.length} texte(s) de lecture rapide`);
  return out;
}
function applyPack(d) {
  const t = now();
  if (d.template) state.template = { v: d.template, t };
  for (const date in d.days || {}) state.overrides[date] = { v: d.days[date], t };
  for (const date in d.tt || {}) state.tt[date] = { v: !!d.tt[date], t };
  for (const k in d.weights || {}) state.weights[k] = { v: d.weights[k], t };
  const lists = { domains: d.domains, objectives: d.objectives, typingTexts: d.typingTexts, readingTexts: d.readingTexts };
  for (const k in lists) if (lists[k]) state[k] = mergeList(state[k], lists[k].map(x => ({ ...x, t })));
  state.lastImport = t;
  save();
}

// Lit un fichier ; renvoie de quoi afficher un aperçu puis appliquer.
export function readFile(text) {
  let p;
  try { p = JSON.parse(text); } catch { throw new Error("Ce fichier n'est pas lisible par MESAICOSA."); }
  if (!p || p.app !== 'mesaicosa' || !p.data) throw new Error("Ce fichier ne vient pas de MESAICOSA.");
  if (p.kind === 'paquet') {
    return { kind: 'paquet', title: p.title || 'Paquet', note: p.note || '', lines: packSummary(p.data), apply: () => applyPack(p.data) };
  }
  return { kind: 'sauvegarde', title: `Sauvegarde du ${new Date(p.exportedAt).toLocaleString('fr-FR')}`, lines: [], apply: () => mergeBackup(p.data) };
}

export function exportJSON() {
  state.lastExport = now(); save();
  return JSON.stringify({ app: 'mesaicosa', kind: 'sauvegarde', exportedAt: new Date().toISOString(), data: state });
}

export function resetAll() { state = blank(); save(); }

// --- dates
export function isoDate(d) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return isoDate(d); }
export function mondayOf(s) { const d = parseDate(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return isoDate(d); }
