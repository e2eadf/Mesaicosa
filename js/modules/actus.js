// Actus : l'actualité mondiale (À la une) et pays par pays, publiée chaque jour par Claude à côté de l'app (dossier news/).
import { geoNaturalEarth1, geoPath, zoom, zoomIdentity, select } from '../../vendor/geo.js';
import { loadWorld } from '../geodata.js';

export const CATS = {
  politique: { label: '(Géo)politique', color: 'var(--spi)' },
  incidents: { label: 'Incidents', color: 'var(--ko)' },
  economie: { label: 'Économie et finance', color: 'var(--proj)' },
  sciences: { label: 'Sciences et technologies', color: 'var(--sport)' },
  societe: { label: 'Société', color: 'var(--perso)' },
};
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fmtDay = s => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d); return `${JOURS[x.getDay()]} ${d} ${MOIS[m - 1]}`; };
const daysAgo = s => { const [y, m, d] = s.split('-').map(Number); return Math.round((Date.now() - new Date(y, m - 1, d)) / 864e5); };

async function getJSON(url) {
  // le service worker sert la version réseau si possible, sinon la dernière version enregistrée
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

export function mount(el, api) {
  const { esc } = api;
  let tab = 'une', day = null, filter = new Set(Object.keys(CATS)), country = null;
  let top = null, pays = {}, updated = null, geo = null;
  let svgSel, gSel, path, zoomer;

  const linkHtml = l => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="news-link">${esc(l.src || 'Source')}${l.t ? ` · ${esc(l.t)}` : ''} ↗</a>`;
  const catPill = c => CATS[c] ? `<span class="pill" style="background:transparent;border:1px solid ${CATS[c].color};color:${CATS[c].color}">${esc(CATS[c].label)}</span>` : '';

  async function load() {
    el.innerHTML = '<p class="muted">Chargement des actus…</p>';
    await loadGeo().catch(() => {});
    const index = await getJSON('news/index.json').catch(() => ({ files: {} }));
    const res = await Promise.allSettled([getJSON('news/top.json'), ...Object.keys(index.files || {}).map(f => getJSON(`news/pays-${f}.json`))]);
    if (res[0].status === 'fulfilled') top = res[0].value;
    pays = {};
    const stamps = [];
    if (top?.updated) stamps.push(top.updated);
    res.slice(1).forEach(r => { if (r.status === 'fulfilled') { Object.assign(pays, r.value.countries || {}); if (r.value.updated) stamps.push(r.value.updated); } });
    updated = stamps.sort().pop() || null;
    if (!top && !Object.keys(pays).length) {
      el.innerHTML = `<div class="card"><h3>Pas encore d'actus</h3><p class="small muted" style="margin-bottom:0">Les actus sont publiées chaque matin par Claude à côté de l'app. Si c'est ta première ouverture, connecte-toi à internet ; sinon, la première publication n'a pas encore eu lieu.</p></div>`;
      return;
    }
    if (!top) tab = 'pays';
    day = top?.days?.[0]?.date || null;
    render();
  }

  function render() {
    el.innerHTML = `
      <div class="spread" style="margin-bottom:10px">
        <div class="seg" role="group" aria-label="Vue"><button data-tab="une" aria-pressed="${tab === 'une'}">À la une</button><button data-tab="pays" aria-pressed="${tab === 'pays'}">Pays</button></div>
        <span class="tiny muted">${updated ? `Mis à jour ${new Date(updated).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}</span>
      </div>
      <div id="pane"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    tab === 'une' ? renderTop(el.querySelector('#pane')) : renderPays(el.querySelector('#pane'));
  }

  // ---------------------------------------------------------------- À la une
  function renderTop(pane) {
    if (!top?.days?.length) { pane.innerHTML = '<p class="small muted">Pas encore de « À la une » : elle est publiée chaque matin vers 6h40.</p>'; return; }
    const d = top.days.find(x => x.date === day) || top.days[0];
    pane.innerHTML = `
      <div class="row" style="gap:6px;margin-bottom:12px">${top.days.map(x => `<button class="pill" data-day="${x.date}" style="border:none;cursor:pointer;${x.date === d.date ? 'background:var(--accent);color:#fff' : ''}">${daysAgo(x.date) === 0 ? "Aujourd'hui" : fmtDay(x.date)}</button>`).join('')}</div>
      <div style="display:grid;gap:10px">${d.items.map((it, i) => `
        <article class="card news">
          <div class="spread" style="margin-bottom:4px"><span class="tiny muted">${i + 1}</span>${catPill(it.cat)}</div>
          <h3 style="margin:0 0 6px">${esc(it.title)}</h3>
          <p style="margin:0 0 8px;line-height:1.55">${esc(it.summary)}</p>
          ${it.countries?.length ? `<div class="row" style="gap:6px;margin-bottom:6px">${it.countries.map(c => `<button class="pill" data-go="${esc(c)}" style="border:none;cursor:pointer">${esc(nameOf(c))}</button>`).join('')}</div>` : ''}
          <div class="news-links">${(it.links || []).map(linkHtml).join('')}</div>
        </article>`).join('')}</div>`;
    pane.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { day = b.dataset.day; renderTop(pane); });
    pane.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { country = b.dataset.go; tab = 'pays'; render(); });
  }

  // ---------------------------------------------------------------- Pays
  const nameOf = code => geo?.byI2[code.toLowerCase()]?.n || code;
  // (les territoires d'outre-mer ont un code propre, ex. RE ; leur pays de rattachement est dans « par »)
  async function loadGeo() { if (!geo) geo = await loadWorld(); return geo; }
  const itemsOf = code => (pays[code]?.items || []).filter(it => filter.has(it.cat));
  function heat(code) {
    const its = itemsOf(code); if (!its.length) return 0;
    const fresh = Math.min(...its.map(it => daysAgo(it.date)));
    return fresh <= 1 ? 3 : fresh <= 3 ? 2 : 1;
  }

  async function renderPays(pane) {
    await loadGeo();
    const covered = Object.keys(pays).length;
    pane.innerHTML = `
      <div class="row" style="gap:6px;margin-bottom:10px">${Object.entries(CATS).map(([k, c]) => `<button class="pill" data-cat="${k}" aria-pressed="${filter.has(k)}" style="cursor:pointer;border:1px solid ${c.color};${filter.has(k) ? `background:${c.color};color:#fff` : `background:transparent;color:${c.color}`}">${esc(c.label)}</button>`).join('')}</div>
      <div class="row" style="margin-bottom:8px;flex-wrap:nowrap">
        <select id="pick" aria-label="Choisir un pays"><option value="">Choisir un pays…</option>${Object.keys(pays).map(c => [c, nameOf(c)]).sort((a, b) => a[1].localeCompare(b[1], 'fr')).map(([c, n]) => `<option value="${c}" ${c === country ? 'selected' : ''}>${esc(n)} (${itemsOf(c).length})</option>`).join('')}</select></div>
      <div class="map-wrap" id="mw"><svg id="map" role="img" aria-label="Carte des actus"></svg>
        <div class="map-tools"><button class="btn" id="zi" aria-label="Zoomer">+</button><button class="btn" id="zo" aria-label="Dézoomer">−</button><button class="btn" id="zr" aria-label="Recentrer">⤾</button></div></div>
      <div class="legend tiny"><span><i style="background:var(--accent);opacity:1"></i>Actu d'aujourd'hui ou d'hier</span><span><i style="background:var(--accent);opacity:.55"></i>Cette semaine</span><span><i style="background:var(--accent);opacity:.25"></i>Plus ancienne</span><span>${covered} pays suivis</span></div>
      <div id="detail"></div>`;
    pane.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { filter.has(b.dataset.cat) ? filter.delete(b.dataset.cat) : filter.add(b.dataset.cat); if (!filter.size) filter = new Set(Object.keys(CATS)); renderPays(pane); });
    pane.querySelector('#pick').onchange = e => { if (e.target.value) showCountry(e.target.value); };
    drawMap();
    if (country) showCountry(country);
  }

  function drawMap() {
    const mw = el.querySelector('#mw'), wrapW = mw.clientWidth || 700, W = 960;
    const H = Math.round(W * (wrapW < 700 ? Math.min(1.1, (window.innerHeight * 0.45) / wrapW) : 0.52));
    const svg = el.querySelector('#map'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    path = geoPath(geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], { type: 'Sphere' }));
    svgSel = select(svg); gSel = svgSel.append('g');
    gSel.append('path').attr('class', 'sea').attr('d', path({ type: 'Sphere' }));
    gSel.selectAll('path.land').data(geo.feats).enter().append('path')
      .attr('class', d => { const c = d.info.i2?.toUpperCase(); const h = c ? heat(c) : 0; return `land news-h${h}`; })
      .attr('data-i2', d => d.info.i2 || '').attr('d', path)
      .on('click', (ev, d) => { if (d.info.i2) showCountry(d.info.i2.toUpperCase(), d); });
    zoomer = zoom().scaleExtent([1, 24]).on('zoom', ev => gSel.attr('transform', ev.transform));
    svgSel.call(zoomer).on('dblclick.zoom', null);
    el.querySelector('#zi').onclick = () => svgSel.call(zoomer.scaleBy, 1.6);
    el.querySelector('#zo').onclick = () => svgSel.call(zoomer.scaleBy, 1 / 1.6);
    el.querySelector('#zr').onclick = () => svgSel.call(zoomer.transform, zoomIdentity);
  }

  function showCountry(code) {
    country = code;
    gSel?.selectAll('.sel').classed('sel', false);
    gSel?.selectAll(`[data-i2="${code.toLowerCase()}"]`).classed('sel', true);
    const i = geo.byI2[code.toLowerCase()] || { n: code };
    const data = pays[code];
    const det = el.querySelector('#detail');
    const flag = geo.flags[code.toLowerCase()] ? `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(geo.flags[code.toLowerCase()])}" alt="" style="height:28px;border-radius:3px;border:1px solid var(--line)">` : '';
    let body;
    if (i.t && !i.u && !data) body = `<p class="small muted">Ce territoire n'est pas suivi séparément : ses actus sont avec celles du pays de rattachement.</p>${i.par ? `<button class="btn" id="par">Voir ${esc(nameOf(i.par))}</button>` : ''}`;
    else if (!data) body = '<p class="small muted">Pas encore d\'actualité recensée pour ce pays.</p>';
    else {
      const its = itemsOf(code).slice().sort((a, b) => b.date.localeCompare(a.date));
      body = `<div class="tiny muted" style="margin-bottom:8px">Dernière revue : ${fmtDay(data.checked)}</div>` + (its.length ? Object.keys(CATS).filter(k => its.some(it => it.cat === k)).map(k => `
        <h3 style="margin:14px 0 6px;color:${CATS[k].color}">${esc(CATS[k].label)}</h3>
        ${its.filter(it => it.cat === k).map(it => `<div class="news-item"><div class="tiny muted">${fmtDay(it.date)}</div>
          <div style="font-weight:600;margin:2px 0">${esc(it.title)}</div><div class="small" style="line-height:1.55">${esc(it.summary)}</div>
          <div class="news-links">${(it.links || []).map(linkHtml).join('')}</div></div>`).join('')}`).join('')
        : '<p class="small muted">Rien de notable dans les catégories choisies.</p>');
    }
    det.innerHTML = `<div class="card" style="margin-top:12px"><div class="row" style="gap:10px">${flag}<h2 style="margin:0">${esc(i.n)}</h2></div>${body}</div>`;
    det.querySelector('#par')?.addEventListener('click', () => { el.querySelector('#pick').value = i.par; showCountry(i.par); });
    det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  load();
  return () => {};
}
