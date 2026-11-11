// Répétition espacée (variante de SM-2, comme Anki) + paquets de cartes.
import { FINANCE_CARDS } from './cards-finance.js';
import { BIBLE_CARDS } from './cards-bible.js';

export const BUILTIN = [
  { id: 'cap', name: 'Capitales du monde', perDay: 10 },
  { id: 'finance', name: 'Finance de marché et d\'entreprise', perDay: 8 },
  { id: 'bible', name: 'Versets (Louis Segond 1910)', perDay: 2, verse: true },
  { id: 'mine', name: 'Mes cartes', perDay: 10 },
];

let capCards = null;
const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
async function loadCapitals() {
  if (capCards) return capCards;
  const info = await fetch('data/countries.json').then(r => r.json());
  capCards = Object.entries(info).filter(([, c]) => c.u && c.c)
    .map(([id, c]) => ({ id: 'cap-' + id, deck: 'cap', hint: c.r, front: `Capitale : ${c.n}`, back: c.c }))
    .sort((a, b) => hash(a.id) - hash(b.id)); // ordre mélangé mais stable d'un jour à l'autre
  return capCards;
}

// Toutes les cartes, par paquet (intégrées + reçues par paquet + créées dans l'app)
export async function allDecks(S) {
  const user = S.alive('cards');
  const decks = BUILTIN.map(d => ({ ...d, cards: [] }));
  const byId = Object.fromEntries(decks.map(d => [d.id, d]));
  (await loadCapitals()).forEach(c => byId.cap.cards.push(c));
  FINANCE_CARDS.forEach(c => byId.finance.cards.push(c));
  BIBLE_CARDS.forEach(c => byId.bible.cards.push(c));
  for (const c of user) {
    const deckId = c.deck || 'mine';
    if (!byId[deckId]) { byId[deckId] = { id: deckId, name: deckId, perDay: 10, cards: [], custom: true }; decks.push(byId[deckId]); }
    byId[deckId].cards.push({ ...c, deck: deckId, user: true });
  }
  return decks;
}

// --- dates (la journée de révision commence à 4 h du matin)
export function studyDay(ts = Date.now()) {
  const d = new Date(ts - 4 * 3600e3);
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function addDaysStr(s, n) { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d + n); const z = k => String(k).padStart(2, '0'); return `${x.getFullYear()}-${z(x.getMonth() + 1)}-${z(x.getDate())}`; }

// Note : 0 = À revoir, 1 = Difficile, 2 = Bien, 3 = Facile
export function schedule(prev, g, today = studyDay()) {
  const s = prev ? { ...prev } : { ivl: 0, ease: 2.5, reps: 0, lapses: 0, first: today };
  if (g === 0) {
    if (s.reps > 0) s.lapses++;
    s.reps = 0; s.ivl = 0; s.ease = Math.round(Math.max(1.3, s.ease - 0.2) * 100) / 100; s.due = today;
    return s;
  }
  let ivl;
  if (s.reps === 0) ivl = g === 3 ? 4 : g === 2 ? 2 : 1;
  else if (s.reps === 1) ivl = g === 1 ? 2 : g === 2 ? 4 : 7;
  else ivl = Math.round(s.ivl * (g === 1 ? 1.2 : g === 2 ? s.ease : s.ease * 1.3));
  if (g >= 2) ivl = Math.max(ivl, s.ivl + 1);
  if (ivl >= 7) ivl = Math.round(ivl * (0.95 + Math.random() * 0.1)); // léger étalement
  s.ease = Math.round(Math.max(1.3, s.ease + (g === 1 ? -0.15 : g === 3 ? 0.15 : 0)) * 100) / 100;
  s.ivl = Math.min(ivl, 3650); s.reps++; s.due = addDaysStr(today, s.ivl);
  return s;
}
export function previewLabel(prev, g) {
  if (g === 0) return '< 10 min';
  const n = schedule(prev, g, '2000-01-01').ivl;
  return n < 30 ? `${n} j` : n < 365 ? `${Math.round(n / 30)} mois` : `${Math.round(n / 36.5) / 10} an`;
}

// Paramètres d'un paquet (activé, nouvelles cartes par jour)
export function cfg(S, deck) {
  const c = S.getMap('srsCfg', deck.id, null);
  return { on: c?.on ?? true, perDay: c?.perDay ?? deck.perDay };
}

export function deckStats(S, deck, today = studyDay()) {
  let due = 0, fresh = 0, mastered = 0, introduced = 0;
  for (const c of deck.cards) {
    const s = S.getMap('srs', c.id, null);
    if (!s) { fresh++; continue; }
    if (s.first === today) introduced++;
    if (s.due <= today) due++;
    if (s.ivl >= 21) mastered++;
  }
  const newToday = Math.max(0, Math.min(fresh, cfg(S, deck).perDay - introduced));
  return { total: deck.cards.length, due, fresh, mastered, newToday };
}

// File de révision du jour : cartes à revoir d'abord, puis nouvelles cartes (dans la limite du jour)
export function buildQueue(S, decks, max = 60, today = studyDay()) {
  const rev = [], fresh = [];
  for (const d of decks) {
    if (!cfg(S, d).on) continue;
    const st = deckStats(S, d, today);
    let n = st.newToday;
    for (const c of d.cards) {
      const s = S.getMap('srs', c.id, null);
      if (s && s.due <= today) rev.push({ c, d, due: s.due });
      else if (!s && n > 0) { fresh.push({ c, d }); n--; }
    }
  }
  rev.sort((a, b) => a.due.localeCompare(b.due));
  return [...rev, ...fresh].slice(0, max);
}
