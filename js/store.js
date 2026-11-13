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
    geo: {},         // ancien format (avant v1.4)
    geo2: {},        // countryId -> {deviceId: {ok, ko}} : additionné entre appareils
    srs: {},         // carteId -> {v: {due, ivl, ease, reps, lapses, first}, t} : progression des révisions
    srsCfg: {},      // paquetId -> {v: {on, perDay}, t}
    cards: [],       // cartes personnelles ou reçues par paquet : {id, deck, front, back, deleted, t}
    poems: [],       // textes à apprendre par cœur : {id, title, author, source, stanzas: [[vers]], deleted, t}
    memoLvl: {},     // strophe -> {v: niveau de masquage atteint, t}
    lastExport: 0,
    lastImport: 0,
  };
}

import * as C from './crypto.js';

const VAULT = 'mesaicosa.vault';   // données chiffrées
let state = null;
let key = null;                     // clé AES en mémoire tant que l'app est déverrouillée
let cred = null;                    // identifiant et mot de passe en mémoire (jamais enregistrés)
let vaultMeta = null;               // {salt, iter}
let memoryOnly = false;
let pending = Promise.resolve();

function readLS(k) { try { return localStorage.getItem(k); } catch { memoryOnly = true; return null; } }
function writeLS(k, v) { try { localStorage.setItem(k, v); } catch { memoryOnly = true; } }
function removeLS(k) { try { localStorage.removeItem(k); } catch { /* rien */ } }

// 'setup' : aucun accès créé ; 'locked' : accès existant, à déverrouiller
export function lockStatus() { return readLS(VAULT) ? 'locked' : 'setup'; }
export function isUnlocked() { return !!key; }
export function currentUser() { return cred?.user || ''; }

async function persist() {
  const box = await C.encryptText(key, JSON.stringify(state));
  writeLS(VAULT, JSON.stringify({ v: 1, salt: vaultMeta.salt, iter: vaultMeta.iter, ...box }));
}

export async function setup(user, pass) {
  vaultMeta = { salt: C.newSalt(), iter: C.ITERATIONS };
  key = await C.deriveKey(user, pass, vaultMeta.salt, vaultMeta.iter);
  cred = { user, pass };
  // reprise des données d'une version précédente non chiffrée
  const raw = readLS(KEY);
  try { state = raw ? { ...blank(), ...JSON.parse(raw) } : blank(); } catch { state = blank(); }
  migrate();
  await persist();
  removeLS(KEY);
}

export async function unlock(user, pass) {
  const v = JSON.parse(readLS(VAULT));
  const k = await C.deriveKey(user, pass, v.salt, v.iter);
  let text;
  try { text = await C.decryptText(k, v); } catch { throw new Error('Identifiant ou mot de passe incorrect.'); }
  key = k; cred = { user, pass }; vaultMeta = { salt: v.salt, iter: v.iter };
  state = { ...blank(), ...JSON.parse(text) };
  migrate();
}

export async function changeCredentials(oldPass, newUser, newPass) {
  if (oldPass !== cred.pass) throw new Error('Mot de passe actuel incorrect.');
  vaultMeta = { salt: C.newSalt(), iter: C.ITERATIONS };
  key = await C.deriveKey(newUser, newPass, vaultMeta.salt, vaultMeta.iter);
  cred = { user: newUser, pass: newPass };
  await pending; await persist();
}

export async function flush() { await pending; }

export function wipeDevice() { removeLS(VAULT); removeLS(KEY); }

export function get() { return state; }
export function isMemoryOnly() { return memoryOnly; }

// Chaque enregistrement est chiffré puis écrit, dans l'ordre.
export function save() {
  if (!key) return;
  pending = pending.then(persist).catch(() => { memoryOnly = true; });
}

// --- valeurs horodatées (le plus récent gagne lors d'une fusion)
export function setMap(map, key, v) { state[map][key] = { v, t: now() }; save(); }
export function delMap(map, key) { state[map][key] = { v: null, t: now() }; save(); }
export function getMap(map, key, dflt) { const r = state[map][key]; return r && r.v !== null && r.v !== undefined ? r.v : dflt; }

export function template() { return state.template?.v || null; }
// La semaine type est datée jour par jour, pour fusionner finement entre appareils
export function setTemplate(v) {
  const old = state.template?.v, t = now();
  const dt = { ...(state.template?.dt || {}) };
  for (let d = 0; d < 7; d++) if (JSON.stringify(old?.days?.[d] ?? null) !== JSON.stringify(v?.days?.[d] ?? null)) dt[d] = t;
  state.template = { v: structuredClone(v), t, dt };
  save();
}
function mergeTemplate(a, b) {
  if (!a) return b; if (!b) return a;
  const dayT = (x, d) => x.dt?.[d] ?? x.t ?? 0;
  const out = { v: { ...(a.v || {}), days: {} }, t: Math.max(a.t || 0, b.t || 0), dt: {} };
  for (let d = 0; d < 7; d++) {
    const win = dayT(b, d) > dayT(a, d) ? b : a;
    const day = win.v?.days?.[d] ?? (win === a ? b : a).v?.days?.[d];
    if (day !== undefined) out.v.days[d] = day;
    out.dt[d] = Math.max(dayT(a, d), dayT(b, d));
  }
  return out;
}

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
  const per = state.geo2[id] ||= {};
  const r = per[state.deviceId] || { ok: 0, ko: 0 };
  per[state.deviceId] = { ok: r.ok + (ok ? 1 : 0), ko: r.ko + (ok ? 0 : 1) };
  save();
}
// Statistiques d'un pays, tous appareils confondus
export function geoStats() {
  const out = {};
  for (const id in state.geo2) {
    let ok = 0, ko = 0;
    for (const d in state.geo2[id]) { ok += state.geo2[id][d].ok; ko += state.geo2[id][d].ko; }
    out[id] = { ok, ko };
  }
  return out;
}
function migrate() {
  state.geo2 ||= {};
  if (state.geo && Object.keys(state.geo).length && !Object.keys(state.geo2).length) {
    for (const id in state.geo) state.geo2[id] = { [state.deviceId]: { ok: state.geo[id].ok || 0, ko: state.geo[id].ko || 0 } };
    state.geo = {};
  }
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
const MAPS = ['tt', 'checks', 'weights', 'overrides', 'srs', 'srsCfg', 'memoLvl'];
const LISTS = ['objectives', 'sessions', 'reviews', 'domains', 'typingTexts', 'readingTexts', 'cards', 'poems'];

function mergeBackup(inc) {
  const before = state.sessions.length;
  for (const k of MAPS) state[k] = mergeMap(state[k], inc[k]);
  for (const k of LISTS) state[k] = mergeList(state[k], inc[k]);
  if (inc.template) state.template = mergeTemplate(state.template, inc.template);
  // ancien format reçu d'un appareil non encore mis à jour : rattaché à un appareil fictif
  for (const id in inc.geo || {}) {
    const per = state.geo2[id] ||= {}; const r = inc.geo[id], dv = 'ancien-' + (inc.deviceId || 'x');
    per[dv] = { ok: Math.max(per[dv]?.ok || 0, r.ok || 0), ko: Math.max(per[dv]?.ko || 0, r.ko || 0) };
  }
  for (const id in inc.geo2 || {}) {
    const per = state.geo2[id] ||= {};
    for (const dv in inc.geo2[id]) {
      const a = per[dv] || { ok: 0, ko: 0 }, b = inc.geo2[id][dv];
      per[dv] = { ok: Math.max(a.ok, b.ok), ko: Math.max(a.ko, b.ko) };
    }
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
  if (d.cards) out.push(`${d.cards.length} carte(s) de révision`);
  if (d.poems) out.push(`${d.poems.length} texte(s) à apprendre par cœur`);
  return out;
}
function applyPack(d) {
  const t = now();
  if (d.template) state.template = { v: d.template, t, dt: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(i => [i, t])) };
  for (const date in d.days || {}) state.overrides[date] = { v: d.days[date], t };
  for (const date in d.tt || {}) state.tt[date] = { v: !!d.tt[date], t };
  for (const k in d.weights || {}) state.weights[k] = { v: d.weights[k], t };
  const lists = { domains: d.domains, objectives: d.objectives, typingTexts: d.typingTexts, readingTexts: d.readingTexts, cards: d.cards, poems: d.poems };
  for (const k in lists) if (lists[k]) state[k] = mergeList(state[k], lists[k].map(x => ({ ...x, t })));
  state.lastImport = t;
  save();
}

// Lit un fichier ; renvoie de quoi afficher un aperçu puis appliquer.
// Sauvegarde chiffrée : essaie l'accès actuel, sinon demande celui de l'autre appareil (other).
export async function readFile(text, other) {
  let p;
  try { p = JSON.parse(text); } catch { throw new Error("Ce fichier n'est pas lisible par MESAICOSA."); }
  if (p && p.app === 'mesaicosa' && p.kind === 'sauvegarde-chiffree') {
    const tries = other ? [other] : [cred];
    let out = null;
    for (const c of tries) {
      try { const k = await C.deriveKey(c.user, c.pass, p.salt, p.iter); out = await C.decryptText(k, p); break; } catch { /* suivant */ }
    }
    if (!out) { const e = new Error(other ? 'Identifiant ou mot de passe incorrect pour ce fichier.' : 'NEED_PASSWORD'); e.code = other ? 'BAD' : 'NEED_PASSWORD'; throw e; }
    p = JSON.parse(out);
  }
  if (!p || p.app !== 'mesaicosa' || !p.data) throw new Error("Ce fichier ne vient pas de MESAICOSA.");
  if (p.kind === 'paquet') {
    return { kind: 'paquet', title: p.title || 'Paquet', note: p.note || '', lines: packSummary(p.data), apply: () => applyPack(p.data) };
  }
  return { kind: 'sauvegarde', title: `Sauvegarde du ${new Date(p.exportedAt).toLocaleString('fr-FR')}`, lines: [], apply: () => mergeBackup(p.data) };
}

// La sauvegarde partagée est chiffrée avec ton identifiant et ton mot de passe.
export async function exportJSON() {
  state.lastExport = now(); save();
  const inner = JSON.stringify({ app: 'mesaicosa', kind: 'sauvegarde', exportedAt: new Date().toISOString(), data: state });
  const salt = C.newSalt();
  const k = await C.deriveKey(cred.user, cred.pass, salt, C.ITERATIONS);
  const box = await C.encryptText(k, inner);
  return JSON.stringify({ app: 'mesaicosa', kind: 'sauvegarde-chiffree', v: 1, salt, iter: C.ITERATIONS, ...box });
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
