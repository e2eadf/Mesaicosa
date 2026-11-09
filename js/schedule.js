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
  memo:      { name: 'Apprentissage par cœur', ready: false, where: 'Téléphone', icon: '❖' },
  finance:   { name: 'Finance',        ready: false, where: 'Téléphone', icon: '€' },
  eloquence: { name: 'Éloquence',      ready: false, where: 'Ordinateur (voix)', icon: '◔' },
  ia:        { name: "Comprendre l'IA", ready: false, where: 'Téléphone', icon: '◇' },
  actus:     { name: 'Actus des pays', ready: false, where: 'Téléphone', icon: '◎' },
  bible:     { name: 'Bible (connaissance)', ready: false, where: 'Téléphone', icon: '✝' },
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

// Créneaux d'un jour = créneaux bloqués de la semaine type + créneaux libres (du jour s'ils ont été modifiés)
export function blocksFor(template, dow, wantTT, override) {
  const d = templateDay(template, dow);
  if (!d) return [];
  const variant = variantFor(template, dow, wantTT);
  const base = d[variant] || [];
  const fixed = base.filter(b => b.fixed);
  const flex = overrideFor(override, variant) || base.filter(b => !b.fixed);
  return sortBlocks([...fixed, ...flex]);
}

export function sleepFor(template, dow) {
  const d = templateDay(template, dow);
  return d ? { wake: d.wake || '07:00', bed: d.bed || '23:00' } : { wake: '07:00', bed: '23:00' };
}
