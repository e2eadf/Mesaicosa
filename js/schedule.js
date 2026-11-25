// Moteur d'agenda. Aucune donnée personnelle ici : la semaine type et les domaines
// sont stockés dans l'appareil (store) et arrivent par l'app ou par un paquet importé.
export const CATS = {
  spi: 'Spiritualité', trav: 'Travail et emploi', sport: 'Sport et repos', mens: 'Upgrade Mens',
  proj: 'Projets', perso: 'Loisirs et proches', vie: 'Vie quotidienne',
};

// Fonctionnalités de l'app (pas des données personnelles)
export const MODULES = {
  typing:    { name: 'Dactylographie', ready: true,  where: 'Ordinateur', icon: '⌨' },
  mental:    { name: 'Calcul mental',  ready: true,  where: 'Téléphone ou ordinateur', icon: '∑' },
  geo:       { name: 'Géographie',     ready: true,  where: 'Téléphone ou ordinateur', icon: '◍' },
  reading:   { name: 'Lecture rapide', ready: true,  where: 'Téléphone ou ordinateur', icon: '≡' },
  memo:      { name: 'Par cœur (poèmes et textes)', ready: true, where: 'Téléphone ou ordinateur', icon: '❖' },
  cards:     { name: 'Cartes (capitales, finance, versets)', ready: true, where: 'Téléphone ou ordinateur', icon: '▣' },
  finance:   { name: 'Finance (cartes en anglais)', ready: true, where: 'Téléphone ou ordinateur', icon: '€' },
  cfa:       { name: 'Finance – cas pratiques (CFA)', ready: true, where: 'À la maison (ordinateur)', icon: '∫' },
  eloquence: { name: 'Éloquence',      ready: false, where: 'Ordinateur (voix)', icon: '◔' },
  ia:        { name: "Comprendre l'IA", ready: false, where: 'Téléphone', icon: '◇' },
  actus:     { name: 'Actus', ready: true, where: 'Téléphone ou ordinateur', icon: '◎' },
  bible:     { name: 'Versets bibliques', ready: true, where: 'Téléphone ou ordinateur', icon: '✝' },
  natur:     { name: 'Naturalisation (examen civique)', ready: true, where: 'Téléphone ou ordinateur', icon: '⚑' },
};

export const minutes = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const sortBlocks = bs => bs.slice().sort((a, b) => minutes(a.s) - minutes(b.s));
export const isWeekday = dow => dow >= 1 && dow <= 5;

export function templateDay(template, dow) { return template?.days?.[dow] || null; }

// Variante utilisée pour un jour : télétravail si demandé et si la semaine type en prévoit une
export function variantFor(template, dow, wantTT) {
  const d = templateDay(template, dow);
  return wantTT && isWeekday(dow) && d?.tt ? 'tt' : 'office';
}

// Créneaux libres modifiés pour un jour : soit une liste (toutes versions), soit {office, tt}
export function overrideFor(override, variant) {
  if (!override) return null;
  if (Array.isArray(override)) return override;
  return override[variant] || null;
}

// Semaines alternées : un créneau avec « wk » (0 ou 1) n'apparaît qu'une semaine sur deux.
// La semaine 0 est celle qui contient template.wkAnchor (date AAAA-MM-JJ), puis on alterne.
export function weekParity(template, date) {
  if (!template?.wkAnchor || !date) return 0;
  const day = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const monday = n => n - ((new Date(n * 864e5).getUTCDay() + 6) % 7);
  const w = Math.round((monday(day(date)) - monday(day(template.wkAnchor))) / 7);
  return ((w % 2) + 2) % 2;
}
const inWeek = (b, parity) => b.wk == null || b.wk === parity;

// Créneaux d'un jour = créneaux bloqués de la semaine type + créneaux libres (du jour s'ils ont été modifiés)
export function blocksFor(template, dow, wantTT, override, date) {
  const d = templateDay(template, dow);
  if (!d) return [];
  const variant = variantFor(template, dow, wantTT);
  const parity = weekParity(template, date);
  const base = (d[variant] || []).filter(b => inWeek(b, parity));
  // un planning peut retirer exceptionnellement un créneau bloqué ce jour-là : { office: [...], skip: ['eglise'] }
  const skip = override && !Array.isArray(override) ? override.skip || [] : [];
  const fixed = base.filter(b => b.fixed && !skip.includes(b.id));
  const flex = overrideFor(override, variant) || base.filter(b => !b.fixed);
  return sortBlocks([...fixed, ...flex]);
}

// Réveil et coucher ; les jours de télétravail peuvent avoir leur propre heure de réveil (wakeTT)
export function sleepFor(template, dow, tt = false) {
  const d = templateDay(template, dow);
  if (!d) return { wake: '07:00', bed: '23:00' };
  return { wake: (tt && d.tt && d.wakeTT) || d.wake || '07:00', bed: d.bed || '23:00' };
}
