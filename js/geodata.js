// Données de la carte du monde, partagées par Géographie et Actus.
// Les territoires d'outre-mer (data/outremer.json) sont détachés de leur pays au chargement.
import { geoCentroid, feature } from '../vendor/geo.js';

let cache = null;
const json = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

export async function loadWorld() {
  if (cache) return cache;
  const [topo, info, flags, om] = await Promise.all([
    json('data/world.json'), json('data/countries.json'),
    json('data/flags.json').catch(() => ({})), json('data/outremer.json').catch(() => null),
  ]);
  const feats = feature(topo, topo.objects.countries).features;
  if (om) {
    Object.assign(info, om.countries || {});
    Object.assign(flags, om.flags || {});
    for (const s of om.split || []) {
      const f = feats.find(x => String(x.id) === String(s.from));
      if (!f || f.geometry.type !== 'MultiPolygon') continue;
      const [x0, x1, y0, y1] = s.box, take = [], keep = [];
      for (const c of f.geometry.coordinates) {
        const [x, y] = geoCentroid({ type: 'Polygon', coordinates: c });
        (x >= x0 && x <= x1 && y >= y0 && y <= y1 ? take : keep).push(c);
      }
      if (!take.length || !keep.length) continue;
      f.geometry = keep.length === 1 ? { type: 'Polygon', coordinates: keep[0] } : { type: 'MultiPolygon', coordinates: keep };
      feats.push({ type: 'Feature', id: s.id, properties: { name: info[s.id]?.n || s.id },
        geometry: take.length === 1 ? { type: 'Polygon', coordinates: take[0] } : { type: 'MultiPolygon', coordinates: take } });
    }
  }
  feats.forEach(f => { f.info = info[f.id] || { n: f.properties.name, r: '?' }; });
  const byI2 = {}; Object.values(info).forEach(i => { if (i.i2) byI2[i.i2] = i; });
  cache = { feats, info, flags, byI2 };
  return cache;
}
