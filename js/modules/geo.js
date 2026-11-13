import { geoNaturalEarth1, geoPath, geoArea, zoom, zoomIdentity, zoomTransform, interpolateZoom, select, feature } from '../../vendor/geo.js';

const nf = new Intl.NumberFormat('fr-FR');
const curName = code => { try { const n = new Intl.DisplayNames(['fr'], { type: 'currency' }).of(code); return n.charAt(0).toUpperCase() + n.slice(1); } catch { return code; } };
function speak(text) { try { const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { } }

const ALL = 'Tous les continents';
const REGIONS = [ALL, 'Europe', 'Afrique', 'Asie', 'Amérique du Nord et centrale', 'Amérique du Sud', 'Océanie'];
const MODES = [['ou', 'Où est… ?'], ['nom', 'Quel est ce pays ?'], ['cap', 'Capitales']];
const COUNTS = [[10, '10'], [25, '25'], [0, 'Tous']];
let cache = null;

async function loadData() {
  if (cache) return cache;
  const [topo, info, flags] = await Promise.all([
    fetch('data/world.json').then(r => r.json()),
    fetch('data/countries.json').then(r => r.json()),
    fetch('data/flags.json').then(r => r.json()).catch(() => ({})),
  ]);
  const feats = feature(topo, topo.objects.countries).features;
  feats.forEach(f => { f.info = info[f.id] || { n: f.properties.name, r: '?' }; });
  cache = { feats, info, flags };
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
const regionLabel = r => r === ALL ? 'Monde' : r;

export function mount(el, api) {
  const { esc, S } = api;
  const saved = (() => { const h = api.history(); return h.length ? h[h.length - 1].details : {}; })();
  let mode = saved.mode || 'ou';
  let region = REGIONS.includes(saved.region) ? saved.region : (saved.region === 'Monde' ? ALL : 'Europe');
  let count = saved.count ?? 10;
  let terr = saved.terr ?? true;   // territoires dépendants et États non membres de l'ONU
  const inPool = i => i.u || (terr && i.t);
  let data, queue, idx, ok, answered, selected, lastClick, svgSel, gSel, zoomer, path, waiting = false, VW = 960, VH = 520, anim = 0, timeouts = [];
  const later = (fn, ms) => timeouts.push(setTimeout(fn, ms));

  function weightedPick(pool, n) {
    const st = S.geoStats();
    const w = pool.map(f => { const r = st[f.id] || { ok: 0, ko: 0 }; return 1 + 3 * r.ko / (r.ok + r.ko + 1) + (r.ok + r.ko === 0 ? 1 : 0); });
    const out = [], used = new Set();
    while (out.length < Math.min(n, pool.length)) {
      let tot = 0; pool.forEach((f, i) => { if (!used.has(i)) tot += w[i]; });
      let x = Math.random() * tot;
      for (let i = 0; i < pool.length; i++) { if (used.has(i)) continue; x -= w[i]; if (x <= 0 || i === pool.length - 1) { used.add(i); out.push(pool[i]); break; } }
    }
    return out;
  }

  const seg = (name, items, cur) => `<div class="seg" role="group" aria-label="${name}" style="flex-wrap:wrap">${items.map(([k, l]) => `<button data-${name}="${k}" aria-pressed="${k === cur}">${l}</button>`).join('')}</div>`;

  function intro() {
    const hist = api.history().slice(-6).reverse();
    el.innerHTML = `
      <div class="card">
        <div style="display:grid;gap:14px">
          <div><div class="small muted" style="margin-bottom:6px">Exercice</div>${seg('mode', MODES, mode)}</div>
          <div><label class="small muted" for="reg">Zone</label>
            <select id="reg">${REGIONS.map(r => `<option ${r === region ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
          <div><div class="small muted" style="margin-bottom:6px">Nombre de questions</div>${seg('count', COUNTS, count)}
            <div class="tiny muted" id="cnt-info" style="margin-top:4px"></div></div>
          <label class="row small" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" id="terr" ${terr ? 'checked' : ''} style="margin-top:3px">
            <span>Inclure les territoires dépendants (Groenland, Nouvelle-Calédonie, Porto Rico, Hong Kong…) et les États non membres de l'ONU (Vatican, Palestine, Kosovo, Taïwan)</span></label>
          <div><button class="btn primary" id="go">Commencer</button></div>
        </div>
        <p class="tiny muted" style="margin-bottom:0">Touche un pays pour le sélectionner, puis « Valider » (ou touche-le deux fois de suite). Les pays que tu rates reviennent plus souvent. Pince ou molette pour zoomer, glisse pour te déplacer.</p>
      </div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Exercice</th><th>Zone</th><th>Score</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${esc((MODES.find(m => m[0] === s.details.mode) || [, ''])[1])}</td><td>${esc(regionLabel(s.details.region))}</td><td>${s.details.ok}/${s.details.n} · ${s.score} %</td></tr>`).join('')}</table>` : ''}
      <h2>Tes points faibles</h2><div id="weak" class="small muted">—</div>`;
    const info = () => {
      if (!data) return;
      const n = poolFor().length;
      el.querySelector('#cnt-info').textContent = `${n} pays${terr ? ' et territoires' : ''} dans cette zone${count && count < n ? ` · ${count} questions tirées au sort` : ''}`;
    };
    el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; el.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b)); info(); });
    el.querySelectorAll('[data-count]').forEach(b => b.onclick = () => { count = Number(b.dataset.count); el.querySelectorAll('[data-count]').forEach(x => x.setAttribute('aria-pressed', x === b)); info(); });
    el.querySelector('#reg').onchange = e => { region = e.target.value; info(); };
    el.querySelector('#terr').onchange = e => { terr = e.target.checked; info(); };
    el.querySelector('#go').onclick = start;
    loadData().then(d => {
      data = d; info();
      const st = S.geoStats();
      const weak = Object.entries(st).filter(([, r]) => r.ko > 0).sort((a, b) => (b[1].ko - b[1].ok) - (a[1].ko - a[1].ok)).slice(0, 10);
      const w = el.querySelector('#weak');
      if (w) w.innerHTML = weak.length ? weak.map(([id, r]) => `${esc(d.info[id]?.n || id)} <span class="tiny">(${r.ok}✓ ${r.ko}✗)</span>`).join(' · ') : 'Pas encore de données.';
    }).catch(() => { const w = el.querySelector('#weak'); if (w) w.textContent = 'Carte indisponible.'; });
  }

  function poolFor() {
    return data.feats.filter(f => inPool(f.info) && (region === ALL || f.info.r === region) && (mode !== 'cap' || (f.info.c && f.info.c !== '—')));
  }

  async function start() {
    data = await loadData();
    const pool = poolFor();
    queue = weightedPick(pool, count || pool.length); idx = 0; ok = 0;
    if (mode === 'cap') return quizCap(pool);
    el.innerHTML = `
      <div class="spread small" style="margin-bottom:6px"><span>Question <b id="qn">1</b> / ${queue.length}</span><span><b id="okn">0</b> juste(s)</span>
        <button class="btn small ghost" id="stop">Arrêter</button></div>
      <div class="q-banner" id="qb" aria-live="polite" style="padding-bottom:2px"></div>
      ${mode === 'ou' ? '<div id="fb" class="small" style="text-align:center;min-height:20px;margin-bottom:6px"></div>' : ''}
      <div class="map-wrap" id="mw"><svg id="map" role="img" aria-label="Carte du monde"></svg>
        <div class="map-tools"><button class="btn" id="zi" aria-label="Zoomer">+</button><button class="btn" id="zo" aria-label="Dézoomer">−</button><button class="btn" id="zr" aria-label="Recentrer">⤾</button></div>
        ${mode === 'ou' ? `<div class="map-validate"><button class="btn primary" id="val" disabled>Valider</button></div>` : ''}</div>
      <div id="choices" class="choices" style="margin-top:12px"></div>
      ${mode !== 'ou' ? '<div id="fb" class="small" style="text-align:center;min-height:22px;margin-top:8px"></div>' : ''}`;
    el.querySelector('#stop').onclick = () => (idx > 0 || answered ? end() : intro());
    drawMap(pool);
    el.querySelector('#val')?.addEventListener('click', () => { if (selected) validate(selected); });
    ask();
  }

  function drawMap(pool) {
    // carte plus haute sur téléphone : on cadre la zone en largeur et on montre ce qu'il y a autour
    const mw = el.querySelector('#mw');
    const wrapW = mw.clientWidth || 700;
    const W = 960;
    const portrait = wrapW < 700;
    // hauteur disponible : de la carte jusqu'à la barre d'onglets, en gardant une marge
    const tab = window.innerWidth < 900 ? 64 : 0;
    const avail = window.innerHeight - mw.getBoundingClientRect().top - tab - (mode === 'ou' ? 16 : 150) - 12;
    const targetH = portrait ? Math.max(260, Math.min(avail, wrapW * 1.5)) : Math.max(320, Math.min(avail, wrapW * 0.6));
    const H = Math.round(W * targetH / wrapW);
    const svg = el.querySelector('#map');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    VW = W; VH = H;
    const inRegion = new Set(pool.map(f => f.id));
    const fitFeats = region === ALL ? { type: 'Sphere' }
      : { type: 'FeatureCollection', features: data.feats.filter(f => f.info.r === region && f.id !== '643').map(mainPart) };
    const proj = geoNaturalEarth1().fitExtent([[12, 12], [W - 12, H - 12]], fitFeats);
    path = geoPath(proj);
    svgSel = select(svg);
    gSel = svgSel.append('g');
    gSel.append('path').attr('class', 'sea').attr('d', path({ type: 'Sphere' }));
    gSel.selectAll('path.land').data(data.feats).enter().append('path')
      .attr('class', d => 'land' + (inRegion.has(d.id) || mode === 'nom' ? '' : ' off'))
      .attr('data-id', d => d.id).attr('d', path)
      .on('click', (ev, d) => onMapClick(d));
    if (mode === 'ou') {
      gSel.selectAll('circle.mini').data(pool.filter(f => (f.info.a || 1e9) < 15000)).enter().append('circle')
        .attr('class', 'land mini').attr('data-id', d => d.id)
        .attr('cx', d => path.centroid(mainPart(d))[0]).attr('cy', d => path.centroid(mainPart(d))[1])
        .attr('r', 6).attr('vector-effect', 'non-scaling-stroke').style('fill-opacity', .55)
        .on('click', (ev, d) => onMapClick(d));
    }
    zoomer = zoom().scaleExtent([1, 30]).translateExtent([[-300, -300], [W + 300, H + 300]])
      .on('zoom', ev => { gSel.attr('transform', ev.transform); gSel.selectAll('circle').attr('r', 6 / ev.transform.k); });
    svgSel.call(zoomer).on('dblclick.zoom', null);
    svgSel.on('click.next', () => { if (waiting) next(); });
    el.querySelector('#zi').onclick = () => svgSel.call(zoomer.scaleBy, 1.6);
    el.querySelector('#zo').onclick = () => svgSel.call(zoomer.scaleBy, 1 / 1.6);
    el.querySelector('#zr').onclick = () => svgSel.call(zoomer.transform, zoomIdentity);
  }

  const marks = sel => gSel.selectAll(sel);
  function setClass(id, cls, on = true) { marks(`[data-id="${CSS.escape(id)}"]`).classed(cls, on); }
  function clearMarks() { marks('.good,.bad,.target,.sel').classed('good', false).classed('bad', false).classed('target', false).classed('sel', false); }

  function ask() {
    answered = false; selected = null; lastClick = null; clearMarks();
    const f = queue[idx];
    el.querySelector('#qn').textContent = idx + 1;
    el.querySelector('#fb').innerHTML = '';
    const val = el.querySelector('#val'); if (val) { val.disabled = true; val.textContent = 'Valider'; }
    const choices = el.querySelector('#choices');
    if (mode === 'ou') {
      el.querySelector('#qb').textContent = `Où est : ${f.info.n} ?`;
      choices.innerHTML = '';
    } else {
      el.querySelector('#qb').textContent = 'Quel est ce pays ?';
      setClass(f.id, 'target');
      const pool = data.feats.filter(x => inPool(x.info) && x.id !== f.id && (x.info.r === f.info.r));
      const opts = shuffle([f, ...shuffle(pool.slice()).slice(0, 3)]);
      choices.innerHTML = opts.map(o => `<button class="btn choice" data-id="${o.id}">${esc(o.info.n)}</button>`).join('');
      choices.querySelectorAll('button').forEach(b => b.onclick = () => answer(b.dataset.id === f.id, b));
      if ((f.info.a || 1e9) < 15000) {
        const [x, y] = path.centroid(mainPart(f));
        gSel.append('circle').attr('class', 'land target tmp').attr('cx', x).attr('cy', y).attr('r', 7).attr('data-id', f.id);
      }
    }
  }

  // 1er clic : sélection ; 2e clic sur le même pays (moins de 0,6 s) ou bouton « Valider » : réponse
  function onMapClick(d) {
    if (waiting || mode !== 'ou' || answered) return;
    const t = Date.now();
    if (selected && selected.id === d.id && lastClick && t - lastClick < 600) { validate(d); return; }
    if (selected) setClass(selected.id, 'sel', false);
    selected = d; lastClick = t;
    setClass(d.id, 'sel');
    const val = el.querySelector('#val'); val.disabled = false; val.textContent = 'Valider ce pays';
  }

  function validate(d) {
    if (answered) return;
    const f = queue[idx], good = d.id === f.id;
    setClass(d.id, 'sel', false);
    if (!good) setClass(d.id, 'bad');
    el.querySelector('#val').disabled = true;
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
      : `<span class="feedback-ko">Tu as choisi ${esc(clicked?.info?.n || 'la mer')}. ${esc(f.info.n)} est en bleu.</span>`;
    else {
      el.querySelectorAll('.choice').forEach(b => { if (b.dataset.id === f.id) b.classList.add('ok'); });
      if (!good && btn) btn.classList.add('ko');
      fb.innerHTML = good ? `<span class="feedback-ok">Exact.</span>` : `<span class="feedback-ko">C'était ${esc(f.info.n)}.</span>`;
    }
    showFiche(f, good);
  }

  // --- après chaque réponse : zoom sur le bon pays et fiche d'identité ; le clic suivant passe à la question suivante
  function animateTo(view, ms = 650) {
    cancelAnimationFrame(anim);
    const t = zoomTransform(svgSel.node());
    const from = [(VW / 2 - t.x) / t.k, (VH / 2 - t.y) / t.k, VW / t.k];
    const interp = interpolateZoom(from, view);
    const dur = Math.max(250, Math.min(ms, interp.duration * 0.5));
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const [x, y, w] = interp(e), k = VW / w;
      svgSel.call(zoomer.transform, zoomIdentity.translate(VW / 2 - x * k, VH / 2 - y * k).scale(k));
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function showFiche(f, good) {
    // activé juste après : le clic qui vient de répondre ne doit pas déjà passer à la suite
    setTimeout(() => { waiting = true; }, 60);
    const [[x0, y0], [x1, y1]] = path.bounds(mainPart(f));
    const w = Math.min(VW * 1.2, Math.max(VW / 16, (x1 - x0) * 2.6, (y1 - y0) * 2.6 * VW / VH));
    // le pays apparaît dans la moitié haute, la fiche occupe le bas
    animateTo([(x0 + x1) / 2, (y0 + y1) / 2 + (w * VH / VW) * 0.2, w]);
    const i = f.info;
    const val = el.querySelector('.map-validate'); if (val) val.style.display = 'none';
    el.querySelector('#mw').insertAdjacentHTML('beforeend', `<div class="fiche ${good ? 'good' : 'bad'}" id="fiche" role="dialog" aria-label="Fiche ${esc(i.n)}">
      <div class="fiche-top">${i.i2 && data.flags[i.i2] ? `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(data.flags[i.i2])}" alt="Drapeau : ${esc(i.n)}" class="flag">` : ''}
        <button class="btn small" id="say" aria-label="Écouter la prononciation">🔊</button></div>
      <div class="fiche-name">${esc(i.n)}</div>
      <dl>
        ${i.st ? `<dt>Statut</dt><dd>${esc(i.st)}</dd>` : ''}
        ${i.c && i.c !== '—' ? `<dt>Capitale</dt><dd>${esc(i.c)}</dd>` : ''}
        ${i.p ? `<dt>Population</dt><dd>${nf.format(i.p)}${i.py ? ` <span class="tiny muted">(${i.py})</span>` : ''}</dd>` : ''}
        ${i.a ? `<dt>Superficie</dt><dd>${nf.format(i.a)} km²</dd>` : ''}
        ${i.cur?.length ? `<dt>Monnaie</dt><dd>${i.cur.map(c => `${esc(curName(c))} (${esc(c)})`).join(', ')}</dd>` : ''}
        <dt>Continent</dt><dd>${esc(i.r)}</dd>
      </dl>
      <div class="tiny muted fiche-next">Touche la carte ou la fiche pour continuer</div></div>`);
    const fiche = el.querySelector('#fiche');
    fiche.addEventListener('click', e => { e.stopPropagation(); next(); });
    el.querySelector('#say').addEventListener('click', e => { e.stopPropagation(); speak(`${i.n}. Capitale : ${i.c || 'aucune'}.`); });
    if (mode === 'nom') {
      el.querySelector('#choices').insertAdjacentHTML('beforeend', '<button class="btn primary" id="nxt">Suivant</button>');
      el.querySelector('#nxt').onclick = next;
    }
  }

  function next() {
    if (!waiting) return;
    waiting = false;
    el.querySelector('#fiche')?.remove();
    const val = el.querySelector('.map-validate'); if (val) val.style.display = '';
    gSel.selectAll('circle.tmp').remove();
    idx++;
    if (idx >= queue.length) { end(); return; }
    animateTo([VW / 2, VH / 2, VW], 450);
    ask();
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
      el.innerHTML = `<div class="spread small" style="margin-bottom:6px"><span>Question ${idx + 1} / ${qs.length}</span><span>${ok} juste(s)</span><button class="btn small ghost" id="stop">Arrêter</button></div>
        <div class="q-banner">${esc(it.q)}</div>
        <div class="choices">${it.opts.map(o => `<button class="btn choice" data-id="${o.id}">${esc(o.t)}</button>`).join('')}</div>
        <div id="fb" class="small" style="text-align:center;min-height:22px;margin-top:10px"></div>`;
      el.querySelector('#stop').onclick = () => (idx > 0 ? end() : intro());
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
    timeouts.forEach(clearTimeout); timeouts = [];
    waiting = false;
    const n = Math.min(queue.length, idx + (answered && idx < queue.length ? 1 : 0));
    if (!n) { intro(); return; }
    const pct = Math.round(100 * ok / n);
    api.save(pct, '%', { mode, region, ok, n, count, terr, total: queue.length });
    el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)">
      <h3>${ok} / ${n} · ${pct} %</h3>
      <p class="small muted">${n < queue.length ? `Séance arrêtée après ${n} questions sur ${queue.length}. ` : ''}${pct === 100 ? 'Sans faute. Passe à une autre zone ou un autre exercice.' : 'Les pays manqués reviendront plus souvent.'}</p>
      <button class="btn primary" id="again">Rejouer</button> <button class="btn" id="menu">Changer d'exercice</button></div>`;
    el.querySelector('#again').onclick = start;
    el.querySelector('#menu').onclick = intro;
  }

  intro();
  return () => { timeouts.forEach(clearTimeout); cancelAnimationFrame(anim); try { speechSynthesis.cancel(); } catch { } };
}
