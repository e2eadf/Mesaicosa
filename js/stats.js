// Page Statistiques du Gymnase : activité, évolution de chaque module, détail par exercice.
const MODE_LABELS = {
  texte: 'Textes', syll: 'Syllabes et chaînes', lettres: 'Lettres éclair',
  ou: 'Où est… ?', nom: 'Quel est ce pays ?', cap: 'Capitales', drap: 'Drapeaux',
  practice: 'Entraînement', missed: 'Revoir mes erreurs', exam: 'Examen blanc',
  apprendre: 'Apprendre', reciter: 'Réciter',
};
const PERIODS = [[30, '30 jours'], [90, '3 mois'], [365, '1 an'], [0, 'Tout']];
const DEFAULT_MODE = { typing: 'texte' };
const modeOf = s => s.details?.mode || DEFAULT_MODE[s.module] || '';
const modeLabel = m => MODE_LABELS[m] || (m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Toutes les séances');
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const round = n => Math.round(n * 10) / 10;
const fmtD = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

const narrow = () => window.innerWidth < 600;
let period = (() => { try { return Number(localStorage.getItem('mesaicosa.statsPeriod') ?? 90); } catch { return 90; } })();

// Courbe : un point par séance + moyenne glissante sur 5 séances
function lineChart(series, { h = 200, unit = '' } = {}) {
  if (series.length < 2) return '<p class="small muted">Il faut au moins deux séances pour tracer une courbe.</p>';
  const W = narrow() ? 360 : 640, H = narrow() ? Math.round(h * 0.8) : h, L = 34, R = 10, T = 12, B = 24;
  const ys = series.map(s => s.score);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1; lo = Math.max(0, lo - pad); hi += pad;
  const t0 = series[0].ts, t1 = series[series.length - 1].ts, span = t1 - t0 || 1;
  // abscisse : temps réel si les séances sont étalées, sinon rang de la séance
  const byTime = span > 864e5;
  const x = (s, i) => L + (W - L - R) * (byTime ? (s.ts - t0) / span : i / (series.length - 1));
  const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const ticks = [lo, (lo + hi) / 2, hi].map(v => Math.round(v));
  const ma = series.map((_, i) => avg(series.slice(Math.max(0, i - 4), i + 1).map(s => s.score)));
  const pts = series.map((s, i) => `<circle cx="${x(s, i).toFixed(1)}" cy="${y(s.score).toFixed(1)}" r="3" fill="var(--mens)" opacity=".45"><title>${fmtD(s.ts)} : ${s.score} ${unit}</title></circle>`).join('');
  const maPath = ma.map((v, i) => `${i ? 'L' : 'M'}${x(series[i], i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Évolution du score">
    ${ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`).join('')}
    <path d="${maPath}" fill="none" stroke="var(--mens)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts}
    <text x="${L}" y="${H - 6}" font-size="11" fill="var(--muted)">${fmtD(t0)}</text>
    <text x="${W - R}" y="${H - 6}" font-size="11" fill="var(--muted)" text-anchor="end">${fmtD(t1)}</text>
  </svg>
  <div class="tiny muted">Points : chaque séance · trait : moyenne des 5 dernières séances</div>`;
}

// Barres : nombre de séances par semaine (12 dernières semaines)
function weekBars(sessions, S) {
  const mon = S.mondayOf(S.isoDate(new Date()));
  const weeks = [...Array(12)].map((_, i) => S.addDays(mon, -7 * (11 - i)));
  const counts = weeks.map(w => { const e = S.addDays(w, 7); return sessions.filter(s => s.date >= w && s.date < e).length; });
  const max = Math.max(1, ...counts), W = narrow() ? 360 : 640, H = narrow() ? 110 : 120, B = 20, bw = (W - 20) / 12;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Séances par semaine">
    ${counts.map((c, i) => {
      const bh = (H - B - 16) * c / max, xx = 10 + i * bw;
      return `<rect x="${xx + 4}" y="${H - B - bh}" width="${bw - 8}" height="${Math.max(bh, c ? 2 : 0)}" rx="3" fill="var(--mens)" opacity="${i === 11 ? 1 : .6}"><title>Semaine du ${S.parseDate(weeks[i]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${c} séance(s)</title></rect>
        ${c ? `<text x="${xx + bw / 2}" y="${H - B - bh - 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${c}</text>` : ''}
        ${i % 2 === 1 ? `<text x="${xx + bw / 2}" y="${H - 5}" text-anchor="middle" font-size="10" fill="var(--muted)">${S.parseDate(weeks[i]).getDate()}/${S.parseDate(weeks[i]).getMonth() + 1}</text>` : ''}`;
    }).join('')}
  </svg>`;
}

// Jours consécutifs avec au moins une séance (jusqu'à aujourd'hui ou hier)
function streak(sessions, S) {
  const days = new Set(sessions.map(s => s.date));
  let d = S.isoDate(new Date()), n = 0;
  if (!days.has(d)) d = S.addDays(d, -1);
  while (days.has(d)) { n++; d = S.addDays(d, -1); }
  return n;
}

function trendHtml(list) {
  if (list.length < 4) return '';
  const k = Math.min(5, Math.floor(list.length / 2));
  const last = avg(list.slice(-k).map(s => s.score)), prev = avg(list.slice(-2 * k, -k).map(s => s.score));
  const d = round(last - prev);
  if (!prev && !last) return '';
  const pct = prev ? Math.round(100 * (last - prev) / prev) : 0;
  return `<span class="small ${d >= 0 ? 'feedback-ok' : 'feedback-ko'}" title="Moyenne des ${k} dernières séances comparée aux ${k} précédentes">${d >= 0 ? '▲' : '▼'} ${Math.abs(pct)} %</span>`;
}

export function viewStats(el, { S, esc, MODULES }, arg, sub) {
  const since = period ? S.addDays(S.isoDate(new Date()), -period) : '0000';
  const all = S.get().sessions.filter(s => !s.deleted && MODULES[s.module]).sort((a, b) => a.ts - b.ts);
  const inPeriod = all.filter(s => s.date > since);
  const periodSeg = `<div class="seg" role="group" aria-label="Période" style="flex-wrap:wrap">${PERIODS.map(([k, l]) => `<button data-period="${k}" aria-pressed="${k === period}">${l}</button>`).join('')}</div>`;

  if (arg && MODULES[arg]) return detail(arg);

  const mods = Object.keys(MODULES).filter(m => all.some(s => s.module === m));
  const cards = mods.map(m => {
    const list = all.filter(s => s.module === m);
    const lp = inPeriod.filter(s => s.module === m);
    const modes = [...new Set(list.map(modeOf))];
    const main = modes.length > 1 ? modes.map(md => [md, list.filter(s => modeOf(s) === md)]).sort((a, b) => b[1].length - a[1].length)[0] : [modes[0], list];
    const ser = main[1], last = ser[ser.length - 1];
    const best = ser.reduce((a, b) => (b.score > a.score ? b : a));
    return `<a class="card" style="display:grid;gap:6px;text-decoration:none;color:inherit" href="#stats/${m}">
      <div class="spread"><h3 style="margin:0">${MODULES[m].icon} ${esc(MODULES[m].name)}</h3>${trendHtml(ser)}</div>
      <div class="small muted">${modes.length > 1 ? esc(modeLabel(main[0])) + ' · ' : ''}${lp.length} séance${lp.length > 1 ? 's' : ''} sur la période · ${list.length} au total</div>
      <div class="row small"><span>Dernier : <b>${last.score}</b> ${esc(last.unit)}</span><span class="muted">Record : ${best.score}</span></div>
      ${miniSpark(ser.slice(-20).map(s => s.score))}
    </a>`;
  }).join('');
  const activeDays = new Set(inPeriod.map(s => s.date)).size;

  el.innerHTML = `
    <div class="ex-head"><a class="btn" href="#gymnase" aria-label="Retour au Gymnase">‹</a><h1>Statistiques</h1></div>
    <div style="margin-bottom:12px">${periodSeg}</div>
    <div class="stats" style="margin-bottom:14px">
      <div class="stat"><div class="k">Séances</div><div class="v">${inPeriod.length}</div></div>
      <div class="stat"><div class="k">Jours actifs</div><div class="v">${activeDays}</div></div>
      <div class="stat"><div class="k">Série en cours</div><div class="v">${streak(all, S)} <span class="small muted">jour${streak(all, S) > 1 ? 's' : ''}</span></div></div>
      <div class="stat"><div class="k">Modules pratiqués</div><div class="v">${new Set(inPeriod.map(s => s.module)).size}</div></div>
    </div>
    <div class="card" style="margin-bottom:14px"><h3 style="margin-top:0">Séances par semaine</h3>${weekBars(all, S)}</div>
    ${all.length ? `<h2>Par module</h2><p class="small muted">Touche un module pour voir son évolution en détail. La flèche compare la moyenne des dernières séances à celle des précédentes.</p>
      <div class="grid">${cards}</div>` : '<div class="empty">Aucune séance enregistrée pour l’instant. Les statistiques apparaîtront après tes premières séances au Gymnase.</div>'}`;
  bindPeriod();

  function bindPeriod() {
    el.querySelectorAll('[data-period]').forEach(b => b.onclick = () => {
      period = Number(b.dataset.period); try { localStorage.setItem('mesaicosa.statsPeriod', period); } catch { }
      viewStats(el, { S, esc, MODULES }, arg, sub);
    });
  }

  function detail(m) {
    const list = all.filter(s => s.module === m);
    const modes = [...new Set(list.map(modeOf))];
    const cur = modes.includes(sub) ? sub : modes.map(md => [md, list.filter(s => modeOf(s) === md).length]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const ser = list.filter(s => modeOf(s) === cur);
    const serP = ser.filter(s => s.date > since);
    const unit = ser[ser.length - 1]?.unit || '';
    const best = ser.length ? ser.reduce((a, b) => (b.score > a.score ? b : a)) : null;
    const first5 = avg(ser.slice(0, 5).map(s => s.score)), last5 = avg(ser.slice(-5).map(s => s.score));
    const extra = s => {
      const d = s.details || {};
      return [d.acc != null ? `${d.acc} % de précision` : '', d.region ? esc(d.region === 'Tous les continents' ? 'Monde' : d.region) : '',
        d.label ? esc(d.label) : '', d.title ? esc(d.title) : '', d.ok != null && d.n ? `${d.ok}/${d.n}` : '', d.level ? `niveau ${d.level}` : '', d.avg ? `${d.avg} ms` : '']
        .filter(Boolean).join(' · ');
    };
    el.innerHTML = `
      <div class="ex-head"><a class="btn" href="#stats" aria-label="Retour aux statistiques">‹</a><h1>${MODULES[m].icon} ${esc(MODULES[m].name)}</h1></div>
      ${modes.length > 1 ? `<div class="seg" role="group" aria-label="Exercice" style="flex-wrap:wrap;margin-bottom:10px">${modes.map(md => `<button data-mode="${esc(md)}" aria-pressed="${md === cur}">${esc(modeLabel(md))}</button>`).join('')}</div>` : ''}
      <div style="margin-bottom:12px">${periodSeg}</div>
      <div class="stats" style="margin-bottom:14px">
        <div class="stat"><div class="k">Séances (période)</div><div class="v">${serP.length} <span class="small muted">/ ${ser.length}</span></div></div>
        <div class="stat"><div class="k">Record</div><div class="v">${best ? best.score : '—'} <span class="small muted">${esc(unit)}</span></div></div>
        <div class="stat"><div class="k">Moyenne (5 dernières)</div><div class="v">${round(last5)} <span class="small muted">${esc(unit)}</span></div></div>
        <div class="stat"><div class="k">Progrès depuis le début</div><div class="v">${ser.length >= 6 ? `${last5 >= first5 ? '+' : ''}${round(last5 - first5)}` : '—'} <span class="small muted">${ser.length >= 6 ? esc(unit) : ''}</span></div></div>
      </div>
      <div class="card" style="margin-bottom:14px"><h3 style="margin-top:0">Évolution${unit ? ` (${esc(unit)})` : ''}</h3>${lineChart(serP.length >= 2 ? serP : ser, { unit })}
        ${serP.length < 2 && ser.length >= 2 ? '<div class="tiny muted">Pas assez de séances sur la période : toutes les séances sont affichées.</div>' : ''}</div>
      <h2>Dernières séances</h2>
      <table class="hist"><tr><th>Date</th><th>Score</th><th>Détail</th></tr>
        ${ser.slice(-15).reverse().map(s => `<tr><td>${esc(s.date)}</td><td>${s.score} ${esc(s.unit)}</td><td class="small">${extra(s)}</td></tr>`).join('')}</table>
      <div class="row" style="margin-top:12px"><a class="btn primary" href="#ex/${m}">S'entraîner</a></div>`;
    el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => viewStats(el, { S, esc, MODULES }, m, b.dataset.mode));
    el.querySelectorAll('[data-period]').forEach(b => b.onclick = () => {
      period = Number(b.dataset.period); try { localStorage.setItem('mesaicosa.statsPeriod', period); } catch { }
      viewStats(el, { S, esc, MODULES }, m, cur);
    });
  }
}

function miniSpark(series) {
  if (series.length < 2) return '';
  const max = Math.max(...series), min = Math.min(...series), span = max - min || 1;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${30 - ((v - min) / span) * 26}`).join(' ');
  return `<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--mens)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}
