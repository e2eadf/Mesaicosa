import * as S from './store.js';
import { CATS, MODULES, minutes, blocksFor, sleepFor, isWeekday, templateDay, variantFor, overrideFor } from './schedule.js';
import { mountEditor } from './editor.js';

const view = document.getElementById('view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => S.isoDate(new Date());
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const fmtDate = s => { const d = S.parseDate(s); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`; };
const hfr = s => s.replace(':', 'h');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

const dowOf = date => S.parseDate(date).getDay();
function isTT(date) { return S.getMap('tt', date, false); }
function override(date) { return S.getMap('overrides', date, null); }
function curVariant(date) { return variantFor(S.template(), dowOf(date), isTT(date)); }
function dayModified(date) { return !!overrideFor(override(date), curVariant(date)); }
function dayBlocks(date) { return blocksFor(S.template(), dowOf(date), isTT(date), override(date)); }
// une liste « toutes versions » devient {office, tt} au moment où l'on modifie une seule version
const asObj = o => !o ? {} : Array.isArray(o) ? { office: o, tt: o } : { ...o };
function checked(date, id) { return S.getMap('checks', `${date}|${id}`, false); }
function domains() {
  return [...S.alive('domains').map(d => [d.id, d.name, d.k, true]),
    ...Object.entries(MODULES).map(([id, m]) => ['mod-' + id, m.name, 'mens', false])];
}

let cleanup = null;
function render(html) { if (cleanup) { cleanup(); cleanup = null; } view.innerHTML = html; view.focus({ preventScroll: true }); window.scrollTo(0, 0); }

const onboarding = () => `<div class="card" style="text-align:center;padding:24px">
  <h2 style="margin-top:0">Ta semaine type n'est pas encore définie</h2>
  <p class="small muted">Elle reste uniquement dans cet appareil. Tu peux importer un paquet (préparé par Claude ou exporté depuis ton autre appareil), ou la construire toi-même.</p>
  <div class="row" style="justify-content:center"><a class="btn primary" href="#donnees">Importer un paquet</a><a class="btn" href="#modele/1/office">La construire moi-même</a></div></div>`;

// ---------------------------------------------------------------- Aujourd'hui
function viewDay(date, mode) {
  const tpl = S.template();
  const d = S.parseDate(date), dow = d.getDay();
  const nav = `<div class="daynav">
      <a class="btn" href="#jour/${S.addDays(date, -1)}" aria-label="Jour précédent">‹</a>
      <div class="title"><h1>${cap(fmtDate(date))}</h1>
        <div class="small muted">${date === today() ? "Aujourd'hui" : `<a href="#jour">Revenir à aujourd'hui</a>`}</div></div>
      <a class="btn" href="#jour/${S.addDays(date, 1)}" aria-label="Jour suivant">›</a></div>`;
  if (!tpl) { render(nav + onboarding()); return; }

  const hasTT = isWeekday(dow) && !!templateDay(tpl, dow)?.tt;
  const ttCard = hasTT ? `<div class="card tt-toggle">
      <button class="switch" role="switch" aria-checked="${isTT(date)}" id="tt" aria-label="Télétravail ce jour"></button>
      <div><div style="font-weight:500">Télétravail</div><div class="small muted">${isTT(date) ? 'Version télétravail de ta semaine type' : 'Version bureau de ta semaine type'}</div></div></div>` : '';

  if (mode === 'edit') {
    const all = dayBlocks(date);
    render(`${nav}
      <div class="card" style="margin-bottom:14px"><h3>Modifier ce jour</h3>
        <p class="small muted" style="margin:0">Les changements ne concernent que le ${fmtDate(date)}. Les créneaux bloqués (🔒) se changent dans la <a href="#modele/${dow}/${variantFor(tpl, dow, isTT(date))}">semaine type</a>.</p>
        <div class="row" style="margin-top:10px"><a class="btn primary" href="#jour/${date}">Terminé</a>
        ${dayModified(date) ? '<button class="btn" id="reset-day">Revenir à la semaine type</button>' : ''}</div></div>
      <div id="ed"></div>`);
    mountEditor(document.getElementById('ed'), {
      blocks: all.filter(b => !b.fixed), locked: all.filter(b => b.fixed),
      onChange: bs => S.setMap('overrides', date, { ...asObj(override(date)), [curVariant(date)]: bs }),
    });
    document.getElementById('reset-day')?.addEventListener('click', () => {
      const o = asObj(override(date)); delete o[curVariant(date)];
      Object.keys(o).length ? S.setMap('overrides', date, o) : S.delMap('overrides', date);
      toast('Jour remis comme la semaine type'); viewDay(date, 'edit');
    });
    return;
  }

  const blocks = dayBlocks(date);
  const isToday = date === today();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const counted = blocks.filter(b => b.k !== 'vie');
  const done = counted.filter(b => checked(date, b.id)).length;
  const sl = sleepFor(tpl, dow), nextWake = sleepFor(tpl, (dow + 1) % 7).wake;

  const blockHtml = b => {
    const on = checked(date, b.id);
    const now = isToday && nowMin >= minutes(b.s) && nowMin < minutes(b.e);
    const mods = (b.mods || []).filter(m => MODULES[m]).map(m => MODULES[m].ready
      ? `<a class="btn small" href="#ex/${m}">${MODULES[m].icon} ${esc(MODULES[m].name)}</a>`
      : `<span class="pill" title="Module prévu dans une prochaine version">${esc(MODULES[m].name)} · bientôt</span>`).join('');
    const extra = b.review ? `<a class="btn small" href="#boussole/revue">Ouvrir la revue</a>` : '';
    return `<div class="block c-${b.k} ${on ? 'done' : ''} ${now ? 'now' : ''}">
      <div class="time">${hfr(b.s)}<br>${hfr(b.e)}</div>
      <div><div class="lbl">${esc(b.l)}</div>${b.sub ? `<div class="sub">${esc(b.sub)}</div>` : ''}
        ${mods || extra ? `<div class="mods">${mods}${extra}</div>` : ''}</div>
      <button class="chk" role="checkbox" aria-checked="${on}" aria-label="Marquer « ${esc(b.l)} » comme fait" data-chk="${b.id}">${on ? '✓' : ''}</button>
    </div>`;
  };

  render(`${nav}${ttCard}
    <div class="spread small muted" style="margin-bottom:6px"><span>${done} / ${counted.length} fait${done > 1 ? 's' : ''}${dayModified(date) ? ' · jour modifié' : ''}</span>
      <span>Coucher ${hfr(sl.bed)} · réveil ${hfr(nextWake)}</span></div>
    <div class="progress" style="margin-bottom:14px"><span style="width:${counted.length ? Math.round(100 * done / counted.length) : 0}%"></span></div>
    <div class="blocks">${blocks.length ? blocks.map(blockHtml).join('') : '<div class="empty">Aucun créneau prévu ce jour.</div>'}</div>
    <div class="row" style="margin-top:14px"><a class="btn" href="#jour/${date}/edit">✎ Modifier ce jour</a></div>
  `);

  view.querySelector('#tt')?.addEventListener('click', () => {
    S.setMap('tt', date, !isTT(date));
    toast(isTT(date) ? 'Journée passée en télétravail' : 'Journée au bureau');
    viewDay(date);
  });
  view.querySelectorAll('[data-chk]').forEach(btn => btn.addEventListener('click', () => {
    S.setMap('checks', `${date}|${btn.dataset.chk}`, !checked(date, btn.dataset.chk));
    viewDay(date);
  }));
  if (isToday) {
    const iv = setInterval(() => { if (location.hash === '' || location.hash === '#jour' || location.hash === '#jour/' + date) viewDay(date); }, 5 * 60 * 1000);
    cleanup = () => clearInterval(iv);
  }
}

// ---------------------------------------------------------------- Semaine type
function viewTemplate(dowArg, variantArg) {
  let tpl = S.template() || { days: {} };
  const dow = Number.isInteger(Number(dowArg)) && dowArg !== undefined ? Number(dowArg) % 7 : 1;
  tpl.days[dow] ??= { wake: '07:00', bed: '23:00', office: [], tt: null };
  const day = tpl.days[dow];
  const variant = variantArg === 'tt' && isWeekday(dow) ? 'tt' : 'office';
  const order = [1, 2, 3, 4, 5, 6, 0];
  const save = () => S.setTemplate(tpl);

  render(`
    <div class="ex-head"><a class="btn" href="#semaine" aria-label="Retour à la semaine">‹</a><h1>Semaine type</h1></div>
    <p class="small muted">Ton modèle de semaine, enregistré uniquement dans cet appareil. Les créneaux bloqués (🔒) reviennent à l'identique chaque semaine ; les autres servent de point de départ et se modifient jour par jour.</p>
    <div class="seg" role="group" aria-label="Jour" style="flex-wrap:wrap;margin-bottom:10px">${order.map(n => `<button aria-pressed="${n === dow}" data-dow="${n}">${cap(JOURS[n].slice(0, 3))}</button>`).join('')}</div>
    ${isWeekday(dow) ? `<div class="row" style="margin-bottom:10px">
      <div class="seg" role="group" aria-label="Version"><button aria-pressed="${variant === 'office'}" data-var="office">Bureau</button><button aria-pressed="${variant === 'tt'}" data-var="tt">Télétravail</button></div>
      ${variant === 'tt' && !day.tt ? '<button class="btn small" id="mk-tt">Créer la version télétravail (copie de la version bureau)</button>' : ''}
      ${variant === 'tt' && day.tt ? '<button class="btn small ghost" id="rm-tt">Supprimer la version télétravail</button>' : ''}</div>` : ''}
    <div class="card row" style="margin-bottom:12px">
      <label style="flex:1">Réveil (ce matin)<input type="time" id="wake" value="${day.wake}"></label>
      <label style="flex:1">Coucher (ce soir)<input type="time" id="bed" value="${day.bed}"></label>
    </div>
    <div id="ed"></div>
    <details class="card" style="margin-top:14px"><summary>Copier ce jour vers d'autres jours</summary>
      <div class="row" style="margin-top:10px">${order.filter(n => n !== dow).map(n => `<label class="pill"><input type="checkbox" data-copy="${n}"> ${cap(JOURS[n])}</label>`).join('')}</div>
      <p class="tiny muted">Remplace la version ${variant === 'tt' ? 'télétravail' : 'bureau'} des jours cochés, ainsi que leurs heures de réveil et de coucher.</p>
      <button class="btn small" id="copy">Copier</button></details>
  `);
  view.querySelectorAll('[data-dow]').forEach(b => b.onclick = () => { location.hash = `#modele/${b.dataset.dow}/${variant}`; });
  view.querySelectorAll('[data-var]').forEach(b => b.onclick = () => { location.hash = `#modele/${dow}/${b.dataset.var}`; });
  document.getElementById('mk-tt')?.addEventListener('click', () => {
    day.tt = day.office.map(b => ({ ...b, id: S.uid() })); save(); viewTemplate(dow, 'tt');
  });
  document.getElementById('rm-tt')?.addEventListener('click', () => { day.tt = null; save(); viewTemplate(dow, 'office'); });
  document.getElementById('wake').onchange = e => { day.wake = e.target.value; save(); };
  document.getElementById('bed').onchange = e => { day.bed = e.target.value; save(); };
  const ed = document.getElementById('ed');
  if (variant === 'tt' && !day.tt) ed.innerHTML = '<div class="empty">Pas encore de version télétravail pour ce jour.</div>';
  else mountEditor(ed, { blocks: day[variant] || [], allowFixed: true, onChange: bs => { day[variant] = bs; save(); } });
  document.getElementById('copy').onclick = () => {
    const targets = [...view.querySelectorAll('[data-copy]:checked')].map(x => Number(x.dataset.copy));
    if (!targets.length) { toast('Coche au moins un jour'); return; }
    for (const n of targets) {
      tpl.days[n] ??= { wake: day.wake, bed: day.bed, office: [], tt: null };
      const t = tpl.days[n];
      t.wake = day.wake; t.bed = day.bed;
      const src = (day[variant] || []).map(b => ({ ...b, id: S.uid() }));
      if (variant === 'tt' && !isWeekday(n)) continue;
      t[variant] = src;
    }
    save(); toast(`Copié vers ${targets.length} jour(s)`);
  };
}

// ---------------------------------------------------------------- Semaine
function viewWeek(anchor) {
  const tpl = S.template();
  const mon = S.mondayOf(anchor);
  const head = `<div class="daynav">
      <a class="btn" href="#semaine/${S.addDays(mon, -7)}" aria-label="Semaine précédente">‹</a>
      <div class="title"><h1>Semaine du ${S.parseDate(mon).getDate()} ${MOIS[S.parseDate(mon).getMonth()]}</h1>
        <div class="small muted">Touche un jour pour l'ouvrir · <a href="#modele">Modifier la semaine type</a></div></div>
      <a class="btn" href="#semaine/${S.addDays(mon, 7)}" aria-label="Semaine suivante">›</a></div>`;
  if (!tpl) { render(head + onboarding()); return; }
  const days = [...Array(7)].map((_, i) => S.addDays(mon, i));
  const START = 6 * 60, END = 24 * 60, PX = 0.6, H = (END - START) * PX;
  const heads = days.map(ds => {
    const d = S.parseDate(ds);
    return `<div class="head ${ds === today() ? 'today' : ''}" data-day="${ds}">${JOURS[d.getDay()].slice(0, 3)} ${d.getDate()}${isTT(ds) ? ' · TT' : ''}${dayModified(ds) ? ' ✎' : ''}</div>`;
  }).join('');
  let axis = '';
  for (let h = 7; h <= 23; h++) axis += `<div style="top:${(h * 60 - START) * PX}px">${h}h</div>`;
  const cols = days.map(ds => {
    const dow = dowOf(ds);
    const wake = minutes(sleepFor(tpl, dow).wake), bed = minutes(sleepFor(tpl, dow).bed);
    let c = `<div class="col" style="height:${H}px" data-day="${ds}">`;
    for (let h = 7; h <= 23; h++) c += `<div class="hl" style="top:${(h * 60 - START) * PX}px"></div>`;
    if (wake > START) c += `<div class="sleep" style="top:0;height:${(wake - START) * PX}px">sommeil</div>`;
    if (bed < END && bed > START) c += `<div class="sleep" style="top:${(bed - START) * PX}px;bottom:0">sommeil</div>`;
    for (const b of dayBlocks(ds)) {
      const s = Math.max(minutes(b.s), START), e = Math.min(minutes(b.e), END);
      if (e <= s) continue;
      const top = (s - START) * PX, h = (e - s) * PX;
      c += `<div class="ev c-${b.k} ${checked(ds, b.id) ? 'done' : ''}" style="top:${top}px;height:${h - 1}px" title="${hfr(b.s)}–${hfr(b.e)} · ${esc(b.l)}">${h >= 12 ? esc(b.l) : ''}</div>`;
    }
    return c + '</div>';
  }).join('');

  const byCat = {};
  for (const ds of days) for (const b of dayBlocks(ds)) {
    if (b.k === 'vie') continue;
    const m = minutes(b.e) - minutes(b.s);
    byCat[b.k] ??= { plan: 0, done: 0 };
    byCat[b.k].plan += m; if (checked(ds, b.id)) byCat[b.k].done += m;
  }
  const sess = S.get().sessions.filter(s => days.includes(s.date) && !s.deleted);
  const stats = Object.entries(byCat).map(([k, v]) => `<div class="stat c-${k}" style="border-left:3px solid var(--c)">
    <div class="k">${esc(CATS[k])}</div><div class="v">${Math.round(v.done / 6) / 10}h <span class="small muted">/ ${Math.round(v.plan / 6) / 10}h</span></div></div>`).join('');

  render(`${head}
    <div class="legend">${Object.entries(CATS).map(([k, v]) => `<span class="c-${k}"><i></i>${esc(v)}</span>`).join('')}</div>
    <div class="week-wrap"><div class="week"><div></div>${heads}<div class="axis" style="height:${H}px">${axis}</div>${cols}</div></div>
    <h2>Temps réalisé cette semaine</h2>
    <div class="stats">${stats}<div class="stat"><div class="k">Séances Gymnase</div><div class="v">${sess.length}</div></div></div>
    <p class="small muted">Le temps réalisé correspond aux créneaux cochés. La catégorie « Vie quotidienne » (repas, trajets…) n'est pas comptée. ✎ = jour modifié.</p>
  `);
  view.querySelectorAll('[data-day]').forEach(el => el.addEventListener('click', () => { location.hash = '#jour/' + el.dataset.day; }));
}

// ---------------------------------------------------------------- Gymnase
function lastAndBest(id) {
  const ss = S.sessionsOf(id);
  if (!ss.length) return null;
  return { last: ss[ss.length - 1], best: ss.reduce((a, b) => (b.score > a.score ? b : a)), count: ss.length, series: ss.slice(-12).map(s => s.score) };
}
function spark(series) {
  if (!series || series.length < 2) return '';
  const max = Math.max(...series), min = Math.min(...series), span = max - min || 1;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${30 - ((v - min) / span) * 26}`).join(' ');
  return `<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--mens)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}
function suggestion() {
  const ready = Object.keys(MODULES).filter(m => MODULES[m].ready);
  const score = m => {
    const w = S.getMap('weights', 'mod-' + m, 2);
    const ss = S.sessionsOf(m); const last = ss.length ? ss[ss.length - 1].ts : 0;
    const days = (Date.now() - last) / 864e5;
    return w * 10 + Math.min(days, 14);
  };
  return ready.sort((a, b) => score(b) - score(a)).slice(0, 2);
}
function viewGym() {
  const sug = suggestion();
  const card = id => {
    const m = MODULES[id], st = lastAndBest(id);
    const unit = st ? st.last.unit : '';
    return `<${m.ready ? 'a href="#ex/' + id + '"' : 'div'} class="card mod-card ${m.ready ? '' : 'soon'}" style="text-decoration:none;color:inherit">
      <div class="top"><h3>${m.icon} ${esc(m.name)}</h3>${m.ready ? '' : '<span class="pill">Bientôt</span>'}</div>
      <div class="small muted">${esc(m.where)}</div>
      ${st ? `<div class="row small"><span>Dernier : <b>${st.last.score}</b> ${esc(unit)}</span><span class="muted">Record : ${st.best.score}</span><span class="muted">${st.count} séance${st.count > 1 ? 's' : ''}</span></div>${spark(st.series)}`
           : (m.ready ? '<div class="small muted">Aucune séance pour l\'instant</div>' : '')}
    </${m.ready ? 'a' : 'div'}>`;
  };
  render(`
    <h1>Gymnase</h1>
    <p class="muted small">Des séances courtes et mesurées. La suggestion tient compte de tes priorités (Boussole) et de ce que tu n'as pas travaillé récemment.</p>
    <div class="card suggest" style="margin:14px 0">
      <div class="small muted">Suggestion du moment</div>
      <div class="row" style="margin-top:8px">${sug.map(m => `<a class="btn primary" href="#ex/${m}">${MODULES[m].icon} ${esc(MODULES[m].name)}</a>`).join('')}</div>
    </div>
    <div class="grid">${Object.keys(MODULES).map(card).join('')}</div>
  `);
}

async function viewExercise(id) {
  const m = MODULES[id];
  if (!m || !m.ready) { location.hash = '#gymnase'; return; }
  render(`<div class="ex"><div class="ex-head"><a class="btn" href="#gymnase" aria-label="Retour au Gymnase">‹</a><h1>${m.icon} ${esc(m.name)}</h1></div><div id="ex-body"><p class="muted">Chargement…</p></div></div>`);
  const mod = await import(`./modules/${id}.js`);
  const body = document.getElementById('ex-body');
  const api = {
    S, esc, toast,
    save(score, unit, details) { S.addSession(id, score, unit, details); },
    history: () => S.sessionsOf(id),
  };
  cleanup = mod.mount(body, api) || null;
}


// ---------------------------------------------------------------- Boussole
const HORIZONS = [['long', 'Long terme', '1 an et plus'], ['moyen', 'Ce trimestre', '3 mois'], ['court', 'Cette semaine', '7 jours']];
const WLABELS = { 1: 'Maintien', 2: 'Normal', 3: 'Priorité' };
function viewCompass(section) {
  const st = S.get();
  const DOMS = domains();
  const objs = S.alive('objectives');
  const domName = id => (DOMS.find(d => d[0] === id) || [, ''])[1];
  const domOptions = `<option value="">Sans domaine</option>` + DOMS.map(d => `<option value="${d[0]}">${esc(d[1])}</option>`).join('');
  const hz = ([k, t, sub]) => {
    const list = objs.filter(o => o.horizon === k);
    return `<div class="card"><div class="spread"><h3>${t}</h3><span class="small muted">${sub}</span></div>
      ${list.length ? list.map(o => `<div class="obj ${o.done ? 'done' : ''}">
        <button class="chk c-mens" role="checkbox" aria-checked="${!!o.done}" data-odone="${o.id}" aria-label="Objectif atteint">${o.done ? '✓' : ''}</button>
        <div class="t">${esc(o.text)}${o.domain ? `<div class="tiny muted">${esc(domName(o.domain))}</div>` : ''}</div>
        <button class="btn ghost small" data-odel="${o.id}" aria-label="Supprimer l'objectif">✕</button></div>`).join('')
        : '<p class="small muted">Aucun objectif pour l\'instant.</p>'}
      <form class="row" data-hz="${k}" style="margin-top:8px">
        <input type="text" name="text" placeholder="Nouvel objectif" aria-label="Nouvel objectif">
        <select name="domain" aria-label="Domaine">${domOptions}</select>
        <button class="btn small" type="submit">Ajouter</button>
        <div class="tiny" style="color:var(--ko);display:none" data-err>Écris d'abord l'objectif.</div>
      </form></div>`;
  };
  const weights = DOMS.map(([id, name, k, custom]) => {
    const v = S.getMap('weights', id, 2);
    return `<div class="wrow"><span class="c-${k}" style="border-left:3px solid var(--c);padding-left:8px">${esc(name)}
        ${custom ? `<button class="btn ghost small" data-ddel="${id}" aria-label="Supprimer le domaine ${esc(name)}">✕</button>` : ''}</span>
      <div class="seg" role="group" aria-label="Poids de ${esc(name)}">${[1, 2, 3].map(n => `<button aria-pressed="${v === n}" data-w="${id}" data-v="${n}">${WLABELS[n]}</button>`).join('')}</div></div>`;
  }).join('');

  const mon = S.mondayOf(today());
  const rev = st.reviews.find(r => r.week === mon) || { id: S.uid(), week: mon, wins: '', blocks: '', focus: '' };
  const days = [...Array(7)].map((_, i) => S.addDays(mon, i));
  let plan = 0, done = 0;
  for (const ds of days) for (const b of dayBlocks(ds)) { if (b.k === 'vie') continue; plan++; if (checked(ds, b.id)) done++; }
  const sess = st.sessions.filter(s => days.includes(s.date) && !s.deleted);
  const perMod = Object.keys(MODULES).filter(m => MODULES[m].ready).map(m => `${MODULES[m].name} : ${sess.filter(s => s.module === m).length}`).join(' · ');
  const past = st.reviews.filter(r => r.week !== mon).sort((a, b) => b.week.localeCompare(a.week)).slice(0, 4);

  render(`
    <h1>Boussole</h1>
    <p class="muted small">Ce que tu vises, et l'importance de chaque domaine. Les priorités orientent les suggestions du Gymnase.</p>
    <h2>Objectifs</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${HORIZONS.map(hz).join('')}</div>
    <h2 id="revue">Revue de la semaine</h2>
    <div class="card">
      <div class="stats" style="margin-bottom:12px">
        <div class="stat"><div class="k">Créneaux cochés</div><div class="v">${done} <span class="small muted">/ ${plan}</span></div></div>
        <div class="stat"><div class="k">Séances Gymnase</div><div class="v">${sess.length}</div></div>
      </div>
      <p class="small muted" style="margin-top:0">${esc(perMod)}</p>
      <form id="review" style="display:grid;gap:10px">
        <label>Ce qui a bien marché<textarea name="wins">${esc(rev.wins)}</textarea></label>
        <label>Ce qui a bloqué<textarea name="blocks">${esc(rev.blocks)}</textarea></label>
        <label>Mon focus pour la semaine prochaine<textarea name="focus">${esc(rev.focus)}</textarea></label>
        <div><button class="btn primary" type="submit">Enregistrer la revue</button></div>
      </form>
      ${past.length ? `<h3 style="margin-top:16px">Revues précédentes</h3>${past.map(r => `<details><summary class="small">Semaine du ${esc(r.week)}</summary>
        <p class="small"><b>Réussites :</b> ${esc(r.wins) || '—'}<br><b>Blocages :</b> ${esc(r.blocks) || '—'}<br><b>Focus :</b> ${esc(r.focus) || '—'}</p></details>`).join('')}` : ''}
    </div>
    <h2>Domaines et priorités</h2>
    <div class="card weights">${weights}
      <form class="row" id="dom-add" style="margin-top:8px;border-top:1px solid var(--line);padding-top:12px">
        <input type="text" name="name" placeholder="Nouveau domaine (ex. un projet)" aria-label="Nouveau domaine" style="flex:2">
        <select name="k" aria-label="Catégorie" style="flex:1">${Object.entries(CATS).filter(([k]) => k !== 'mens').map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>
        <button class="btn small" type="submit">Ajouter</button>
        <div class="tiny" style="color:var(--ko);display:none" data-err>Donne un nom au domaine.</div></form>
    </div>
  `);
  if (section === 'revue') document.getElementById('revue').scrollIntoView();

  view.querySelectorAll('form[data-hz]').forEach(f => {
    const err = f.querySelector('[data-err]');
    f.text.addEventListener('input', () => { err.style.display = 'none'; });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const text = f.text.value.trim();
      if (!text) { err.style.display = 'block'; f.text.focus(); return; }
      S.upsert('objectives', { id: S.uid(), horizon: f.dataset.hz, domain: f.domain.value, text, done: false });
      viewCompass();
    });
  });
  view.querySelectorAll('[data-odone]').forEach(b => b.addEventListener('click', () => {
    const o = S.get().objectives.find(x => x.id === b.dataset.odone); S.upsert('objectives', { ...o, done: !o.done }); viewCompass();
  }));
  view.querySelectorAll('[data-odel]').forEach(b => b.addEventListener('click', () => {
    const o = S.get().objectives.find(x => x.id === b.dataset.odel); S.upsert('objectives', { ...o, deleted: true }); toast('Objectif supprimé'); viewCompass();
  }));
  view.querySelectorAll('[data-ddel]').forEach(b => b.addEventListener('click', () => {
    const o = S.get().domains.find(x => x.id === b.dataset.ddel); S.upsert('domains', { ...o, deleted: true }); toast('Domaine supprimé'); viewCompass();
  }));
  view.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => {
    S.setMap('weights', b.dataset.w, Number(b.dataset.v));
    b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  const da = document.getElementById('dom-add');
  da.name.addEventListener('input', () => { da.querySelector('[data-err]').style.display = 'none'; });
  da.addEventListener('submit', e => {
    e.preventDefault();
    const name = da.name.value.trim();
    if (!name) { da.querySelector('[data-err]').style.display = 'block'; return; }
    S.upsert('domains', { id: 'd-' + S.uid(), name, k: da.k.value }); viewCompass();
  });
  document.getElementById('review').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target;
    S.upsert('reviews', { ...rev, wins: f.wins.value.trim(), blocks: f.blocks.value.trim(), focus: f.focus.value.trim() });
    toast('Revue enregistrée');
  });
}

// ---------------------------------------------------------------- Données
function viewData() {
  const st = S.get();
  const fmt = t => t ? new Date(t).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'jamais';
  render(`
    <h1>Données</h1>
    <p class="muted small">Tout est enregistré uniquement dans cet appareil : rien n'est envoyé sur internet. Pour l'autre appareil, partage une sauvegarde (Quick Share) puis importe-la de l'autre côté ; les deux versions sont fusionnées.</p>
    ${S.isMemoryOnly() ? `<div class="card" style="border-color:var(--ko);margin-bottom:12px"><b>Stockage indisponible.</b> Ce navigateur bloque l'enregistrement local : tes données seront perdues à la fermeture. Ouvre l'app depuis son adresse habituelle, hors navigation privée.</div>` : ''}
    <div class="grid">
      <div class="card"><h3>Envoyer vers l'autre appareil</h3>
        <p class="small muted">Dernier export : ${fmt(st.lastExport)}</p>
        <div class="row"><button class="btn primary" id="share">Partager mes données</button>
        <button class="btn" id="dl">Télécharger le fichier</button></div></div>
      <div class="card"><h3>Importer</h3>
        <p class="small muted">Une sauvegarde de ton autre appareil, ou un paquet préparé par Claude (semaine type, objectifs, textes…). Dernier import : ${fmt(st.lastImport)}</p>
        <label class="btn primary" for="imp">Choisir un fichier</label>
        <input type="file" id="imp" accept="application/json,.json" class="hidden-input">
        <div id="imp-msg" style="margin-top:10px"></div></div>
    </div>
    <h2>Contenu de cet appareil</h2>
    <div class="stats">
      <div class="stat"><div class="k">Semaine type</div><div class="v">${S.template() ? 'Oui' : 'Non'}</div></div>
      <div class="stat"><div class="k">Séances</div><div class="v">${st.sessions.length}</div></div>
      <div class="stat"><div class="k">Objectifs</div><div class="v">${S.alive('objectives').length}</div></div>
      <div class="stat"><div class="k">Domaines</div><div class="v">${S.alive('domains').length}</div></div>
      <div class="stat"><div class="k">Jours modifiés</div><div class="v">${Object.values(st.overrides).filter(x => x.v).length}</div></div>
      <div class="stat"><div class="k">Textes ajoutés</div><div class="v">${S.alive('typingTexts').length + S.alive('readingTexts').length}</div></div>
    </div>
    <h2>Installer l'app</h2>
    <p class="small">Sur Android (Chrome) : menu ⋮ puis <b>Installer l'application</b>. Sur Windows (Chrome ou Edge) : icône d'installation à droite de la barre d'adresse. Une fois installée, l'app fonctionne hors ligne.</p>
    <h2>Zone sensible</h2>
    <div class="card"><p class="small" style="margin-top:0">Effacer toutes les données de cet appareil. Pense à exporter avant.</p>
      <button class="btn" id="reset">Tout effacer…</button><div id="reset-confirm"></div></div>
    <p class="tiny muted" style="margin-top:24px">MESAICOSA v1.2 · Mens sana in corpore sano</p>
  `);
  const fileName = () => `mesaicosa-${today()}.json`;
  const download = () => {
    const blob = new Blob([S.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName(); a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Fichier téléchargé');
  };
  document.getElementById('dl').onclick = download;
  document.getElementById('share').onclick = async () => {
    const file = new File([S.exportJSON()], fileName(), { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Sauvegarde MESAICOSA' }); toast('Sauvegarde partagée'); }
      catch (e) { if (e.name !== 'AbortError') download(); }
    } else download();
  };
  document.getElementById('imp').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const msg = document.getElementById('imp-msg');
    e.target.value = '';
    let r;
    try { r = S.readFile(await f.text()); }
    catch (err) { msg.innerHTML = `<span class="small feedback-ko">${esc(err.message)}</span>`; return; }
    if (r.kind === 'sauvegarde') {
      const n = r.apply();
      msg.innerHTML = `<span class="small feedback-ok">Sauvegarde fusionnée : ${n} nouvelle${n > 1 ? 's' : ''} séance${n > 1 ? 's' : ''}, le reste est à jour.</span>`;
      return;
    }
    msg.innerHTML = `<div class="card" style="border-color:var(--accent)"><h3>${esc(r.title)}</h3>
      ${r.note ? `<p class="small muted" style="margin-top:0">${esc(r.note)}</p>` : ''}
      <ul class="small">${r.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <div class="row"><button class="btn primary" id="pk-yes">Appliquer ce paquet</button><button class="btn ghost" id="pk-no">Annuler</button></div></div>`;
    document.getElementById('pk-yes').onclick = () => { r.apply(); toast('Paquet appliqué'); location.hash = '#jour'; };
    document.getElementById('pk-no').onclick = () => { msg.innerHTML = ''; };
  };
  document.getElementById('reset').onclick = () => {
    document.getElementById('reset-confirm').innerHTML = `<p class="small feedback-ko">Toutes les données de cet appareil seront effacées définitivement.</p>
      <button class="btn" id="reset-yes" style="border-color:var(--ko);color:var(--ko)">Oui, tout effacer</button> <button class="btn ghost" id="reset-no">Annuler</button>`;
    document.getElementById('reset-yes').onclick = () => { S.resetAll(); toast('Données effacées'); viewData(); };
    document.getElementById('reset-no').onclick = () => { document.getElementById('reset-confirm').innerHTML = ''; };
  };
}

// ---------------------------------------------------------------- Routeur
function route() {
  const [name, arg, arg2] = (location.hash.slice(1) || 'jour').split('/');
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('active',
    a.dataset.tab === name || (name === 'ex' && a.dataset.tab === 'gymnase') || (name === 'modele' && a.dataset.tab === 'semaine')));
  if (name === 'jour') viewDay(arg || today(), arg2);
  else if (name === 'semaine') viewWeek(arg || today());
  else if (name === 'modele') viewTemplate(arg ?? 1, arg2);
  else if (name === 'gymnase') viewGym();
  else if (name === 'ex') viewExercise(arg);
  else if (name === 'boussole') viewCompass(arg);
  else if (name === 'donnees') viewData();
  else viewDay(today());
}
window.addEventListener('hashchange', route);
route();

(() => {
  const st = S.get();
  if (st.sessions.length && Date.now() - (st.lastExport || 0) > 7 * 864e5) setTimeout(() => toast('Pense à partager tes données vers ton autre appareil (onglet Données)'), 1500);
})();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
