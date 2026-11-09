import { geoNaturalEarth1, geoPath, geoArea, zoom, zoomIdentity, select, feature } from '../../vendor/geo.js';

const REGIONS = ['Monde', 'Europe', 'Afrique', 'Asie', 'Amérique du Nord et centrale', 'Amérique du Sud', 'Océanie'];
const MODES = [['ou', 'Où est… ?'], ['nom', 'Quel est ce pays ?'], ['cap', 'Capitales']];
const N_Q = 10;
let cache = null;

async function loadData() {
  if (cache) return cache;
  const [topo, info] = await Promise.all([
    fetch('data/world.json').then(r => r.json()),
    fetch('data/countries.json').then(r => r.json()),
  ]);
  const feats = feature(topo, topo.objects.countries).features;
  feats.forEach(f => { f.info = info[f.id] || { n: f.properties.name, r: '?' }; });
  cache = { feats, info };
  return cache;
}

// plus grand polygone d'un pays (évite que la Guyane étire le cadrage de la France)
function mainPart(f) {
  if (f.geometry.type !== 'MultiPolygon') return f;
  let best = null, ba = -1;
  for (const coords of f.geometry.coordinates) {
    const g = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
    const a = geoArea(g); if (a > ba) { ba = a; best = g; }
  }
  return best;
}
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function mount(el, api) {
  const { esc, S } = api;
  let mode = 'ou', region = 'Europe';
  let data, queue, idx, ok, answered, svgSel, gSel, zoomer, path, timeouts = [];
  const later = (fn, ms) => timeouts.push(setTimeout(fn, ms));

  function weightedPick(pool, n) {
    const geo = S.get().geo;
    const w = pool.map(f => { const r = geo[f.id] || { ok: 0, ko: 0 }; return 1 + 3 * r.ko / (r.ok + r.ko + 1) + (r.ok + r.ko === 0 ? 1 : 0); });
    const out = [], used = new Set();
    while (out.length < Math.min(n, pool.length)) {
      let tot = 0; pool.forEach((f, i) => { if (!used.has(i)) tot += w[i]; });
      let x = Math.random() * tot;
      for (let i = 0; i < pool.length; i++) { if (used.has(i)) continue; x -= w[i]; if (x <= 0) { used.add(i); out.push(pool[i]); break; } }
    }
    return out;
  }

  function intro() {
    const hist = api.history().slice(-6).reverse();
    el.innerHTML = `
      <div class="card">
        <div style="display:grid;gap:12px">
          <div><div class="small muted" style="margin-bottom:6px">Exercice</div>
            <div class="seg" role="group" aria-label="Exercice">${MODES.map(([k, l]) => `<button data-mode="${k}" aria-pressed="${k === mode}">${l}</button>`).join('')}</div></div>
          <div><label class="small muted" for="reg">Zone</label>
            <select id="reg">${REGIONS.map(r => `<option ${r === region ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
          <div><button class="btn primary" id="go">Commencer (${N_Q} questions)</button></div>
        </div>
        <p class="tiny muted" style="margin-bottom:0">Les pays que tu rates reviennent plus souvent. Sur la carte : pince ou molette pour zoomer, glisse pour te déplacer.</p>
      </div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Exercice</th><th>Zone</th><th>Score</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${esc((MODES.find(m => m[0] === s.details.mode) || [, ''])[1])}</td><td>${esc(s.details.region)}</td><td>${s.score} %</td></tr>`).join('')}</table>` : ''}
      <h2>Tes points faibles</h2><div id="weak" class="small muted">—</div>`;
    el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
      mode = b.dataset.mode; el.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b));
    });
    el.querySelector('#reg').onchange = e => { region = e.target.value; };
    el.querySelector('#go').onclick = start;
    loadData().then(d => {
      data = d;
      const geo = S.get().geo;
      const weak = Object.entries(geo).filter(([, r]) => r.ko > 0).sort((a, b) => (b[1].ko - b[1].ok) - (a[1].ko - a[1].ok)).slice(0, 10);
      const w = el.querySelector('#weak');
      if (w) w.innerHTML = weak.length ? weak.map(([id, r]) => `${esc(d.info[id]?.n || id)} <span class="tiny">(${r.ok}✓ ${r.ko}✗)</span>`).join(' · ') : 'Pas encore de données.';
    }).catch(() => { const w = el.querySelector('#weak'); if (w) w.textContent = 'Carte indisponible.'; });
  }

  function poolFor() {
    return data.feats.filter(f => f.info.u && (region === 'Monde' || f.info.r === region) && (mode !== 'cap' || f.info.c));
  }

  async function start() {
    data = await loadData();
    const pool = poolFor();
    queue = weightedPick(pool, N_Q); idx = 0; ok = 0;
    if (mode === 'cap') return quizCap(pool);
    el.innerHTML = `
      <div class="spread small" style="margin-bottom:6px"><span>Question <b id="qn">1</b> / ${queue.length}</span><span><b id="okn">0</b> juste(s)</span></div>
      <div class="q-banner" id="qb" aria-live="polite"></div>
      <div class="map-wrap"><svg viewBox="0 0 960 520" id="map" role="img" aria-label="Carte du monde"></svg>
        <div class="map-tools"><button class="btn" id="zi" aria-label="Zoomer">+</button><button class="btn" id="zo" aria-label="Dézoomer">−</button><button class="btn" id="zr" aria-label="Recentrer">⤾</button></div></div>
      <div id="choices" class="choices" style="margin-top:12px"></div>
      <div id="fb" class="small" style="text-align:center;min-height:22px;margin-top:8px"></div>`;
    drawMap(pool);
    ask();
  }

  function drawMap(pool) {
    const W = 960, H = 520;
    const inRegion = new Set(pool.map(f => f.id));
    const fitFeats = region === 'Monde' ? { type: 'Sphere' }
      : { type: 'FeatureCollection', features: data.feats.filter(f => f.info.r === region && f.id !== '643').map(mainPart) };
    const proj = geoNaturalEarth1().fitExtent([[12, 12], [W - 12, H - 12]], fitFeats);
    path = geoPath(proj);
    svgSel = select(el.querySelector('#map'));
    gSel = svgSel.append('g');
    gSel.append('path').attr('class', 'sea').attr('d', path({ type: 'Sphere' }));
    gSel.selectAll('path.land').data(data.feats).enter().append('path')
      .attr('class', d => 'land' + (inRegion.has(d.id) || mode === 'nom' ? '' : ' off'))
      .attr('data-id', d => d.id).attr('d', path)
      .on('click', (ev, d) => onMapClick(d));
    // repères cliquables pour les petits pays
    if (mode === 'ou') {
      gSel.selectAll('circle.mini').data(pool.filter(f => (f.info.a || 1e9) < 15000)).enter().append('circle')
        .attr('class', 'land').attr('data-id', d => d.id)
        .attr('cx', d => path.centroid(mainPart(d))[0]).attr('cy', d => path.centroid(mainPart(d))[1])
        .attr('r', 5).attr('vector-effect', 'non-scaling-stroke').style('fill-opacity', .55)
        .on('click', (ev, d) => onMapClick(d));
    }
    zoomer = zoom().scaleExtent([1, 24]).translateExtent([[-200, -200], [W + 200, H + 200]])
      .on('zoom', ev => { gSel.attr('transform', ev.transform); gSel.selectAll('circle').attr('r', 5 / ev.transform.k); });
    svgSel.call(zoomer);
    el.querySelector('#zi').onclick = () => svgSel.call(zoomer.scaleBy, 1.6);
    el.querySelector('#zo').onclick = () => svgSel.call(zoomer.scaleBy, 1 / 1.6);
    el.querySelector('#zr').onclick = () => svgSel.call(zoomer.transform, zoomIdentity);
  }

  function setClass(id, cls) { gSel.selectAll(`[data-id="${CSS.escape(id)}"]`).classed(cls, true); }
  function clearMarks() { gSel.selectAll('.good,.bad,.target').classed('good', false).classed('bad', false).classed('target', false); }

  function ask() {
    answered = false; clearMarks();
    const f = queue[idx];
    el.querySelector('#qn').textContent = idx + 1;
    el.querySelector('#fb').innerHTML = '';
    const choices = el.querySelector('#choices');
    if (mode === 'ou') {
      el.querySelector('#qb').textContent = `Où est : ${f.info.n} ?`;
      choices.innerHTML = '';
    } else {
      el.querySelector('#qb').textContent = 'Quel est ce pays ?';
      setClass(f.id, 'target');
      const pool = data.feats.filter(x => x.info.u && x.id !== f.id && (x.info.r === f.info.r));
      const opts = shuffle([f, ...shuffle(pool.slice()).slice(0, 3)]);
      choices.innerHTML = opts.map(o => `<button class="btn choice" data-id="${o.id}">${esc(o.info.n)}</button>`).join('');
      choices.querySelectorAll('button').forEach(b => b.onclick = () => answer(b.dataset.id === f.id, b));
      if ((f.info.a || 1e9) < 15000) {
        const [x, y] = path.centroid(mainPart(f));
        gSel.append('circle').attr('class', 'land target tmp').attr('cx', x).attr('cy', y).attr('r', 6).attr('data-id', f.id);
      }
    }
  }

  function onMapClick(d) {
    if (mode !== 'ou' || answered) return;
    const f = queue[idx];
    const good = d.id === f.id;
    if (!good) setClass(d.id, 'bad');
    answer(good, null, d);
  }

  function answer(good, btn, clicked) {
    if (answered) return; answered = true;
    const f = queue[idx];
    S.geoMark(f.id, good);
    if (good) ok++;
    el.querySelector('#okn').textContent = ok;
    setClass(f.id, good ? 'good' : 'target');
    const fb = el.querySelector('#fb');
    if (mode === 'ou') fb.innerHTML = good ? `<span class="feedback-ok">Bien vu, ${esc(f.info.n)}.</span>`
      : `<span class="feedback-ko">Tu as touché ${esc(clicked?.info?.n || 'la mer')}. ${esc(f.info.n)} est en bleu.</span>`;
    else {
      el.querySelectorAll('.choice').forEach(b => { if (b.dataset.id === f.id) b.classList.add('ok'); });
      if (!good && btn) btn.classList.add('ko');
      fb.innerHTML = good ? `<span class="feedback-ok">Exact.</span>` : `<span class="feedback-ko">C'était ${esc(f.info.n)}.</span>`;
    }
    later(() => { gSel.selectAll('circle.tmp').remove(); idx++; idx < queue.length ? ask() : end(); }, good ? 900 : 2200);
  }

  function quizCap(pool) {
    const qs = queue.map(f => {
      const reverse = Math.random() < 0.4;
      const others = shuffle(pool.filter(x => x.id !== f.id)).slice(0, 3);
      return reverse
        ? { f, q: `${f.info.c} est la capitale de…`, opts: shuffle([f, ...others].map(x => ({ id: x.id, t: x.info.n }))) }
        : { f, q: `Quelle est la capitale de : ${f.info.n} ?`, opts: shuffle([f, ...others].map(x => ({ id: x.id, t: x.info.c }))) };
    });
    const show = () => {
      const it = qs[idx]; answered = false;
      el.innerHTML = `<div class="spread small" style="margin-bottom:6px"><span>Question ${idx + 1} / ${qs.length}</span><span>${ok} juste(s)</span></div>
        <div class="q-banner">${esc(it.q)}</div>
        <div class="choices">${it.opts.map(o => `<button class="btn choice" data-id="${o.id}">${esc(o.t)}</button>`).join('')}</div>
        <div id="fb" class="small" style="text-align:center;min-height:22px;margin-top:10px"></div>`;
      el.querySelectorAll('.choice').forEach(b => b.onclick = () => {
        if (answered) return; answered = true;
        const good = b.dataset.id === it.f.id;
        S.geoMark(it.f.id, good); if (good) ok++;
        el.querySelectorAll('.choice').forEach(x => { if (x.dataset.id === it.f.id) x.classList.add('ok'); });
        if (!good) b.classList.add('ko');
        el.querySelector('#fb').innerHTML = good ? '<span class="feedback-ok">Exact.</span>'
          : `<span class="feedback-ko">${esc(it.f.info.n)} → ${esc(it.f.info.c)}</span>`;
        later(() => { idx++; idx < qs.length ? show() : end(); }, good ? 800 : 2000);
      });
    };
    show();
  }

  function end() {
    const n = queue.length, pct = Math.round(100 * ok / n);
    api.save(pct, '%', { mode, region, ok, n });
    el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)">
      <h3>${ok} / ${n} · ${pct} %</h3>
      <p class="small muted">${pct === 100 ? 'Sans faute. Passe à une autre zone ou un autre exercice.' : 'Les pays manqués reviendront plus souvent.'}</p>
      <button class="btn primary" id="again">Rejouer</button> <button class="btn" id="menu">Changer d'exercice</button></div>`;
    el.querySelector('#again').onclick = start;
    el.querySelector('#menu').onclick = intro;
  }

  intro();
  return () => timeouts.forEach(clearTimeout);
}
