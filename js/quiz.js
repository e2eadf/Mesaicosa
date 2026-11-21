// Moteur de QCM partagé (cas pratiques de finance, naturalisation…).
// Les résultats par question sont gardés dans la carte « srs » sous une clé préfixée (ex. « nat:… »), ce qui permet de revoir ses erreurs.
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * opts: {
 *   bank: [{ id, t, q, o: [..], c, x, v?, s? }], topics: { key: label },
 *   prefix: 'nat', counts: [[10,'10'],…], shuffleOptions: bool,
 *   exam: { n: 40, minutes: 45, pass: 32, label } | null,
 *   intro: html, lang: 'fr'|'en'
 * }
 */
export function mountQuiz(el, api, opts) {
  const { esc, S } = api;
  const en = opts.lang === 'en';
  const T = en
    ? { all: 'All topics', topic: 'Topic', count: 'Number of questions', start: 'Start', mistakes: 'Review my mistakes', none: 'No mistakes to review yet.', next: 'Next', end: 'Finish', stop: 'Stop', correct: 'Correct.', wrong: 'Not quite.', answer: 'Answer', last: 'Recent sessions', date: 'Date', score: 'Score', mode: 'Mode', practice: 'Practice', again: 'Again', menu: 'Back', missed: 'To review', progress: 'Mastered', case: 'Case', q: 'Question' }
    : { all: 'Tous les thèmes', topic: 'Thème', count: 'Nombre de questions', start: 'Commencer', mistakes: 'Revoir mes erreurs', none: 'Aucune erreur à revoir pour l\'instant.', next: 'Suivant', end: 'Terminer', stop: 'Arrêter', correct: 'Bonne réponse.', wrong: 'Ce n\'est pas ça.', answer: 'Réponse', last: 'Dernières séances', date: 'Date', score: 'Score', mode: 'Mode', practice: 'Entraînement', again: 'Recommencer', menu: 'Retour', missed: 'À revoir', progress: 'Maîtrisées', case: 'Situation', q: 'Question' };
  const key = id => `${opts.prefix}:${id}`;
  const stat = id => S.getMap('srs', key(id), null) || { ok: 0, ko: 0 };
  const mark = (id, good) => { const s = stat(id); S.setMap('srs', key(id), { ok: s.ok + (good ? 1 : 0), ko: s.ko + (good ? 0 : 1), last: good ? 1 : 0 }); };
  const missed = () => opts.bank.filter(b => stat(b.id).last === 0);
  let topic = 'all', count = (opts.counts || [[10]])[0][0];
  let queue, idx, ok, answered, mode, timer, deadline, wrongs;

  // tirage pondéré : jamais vues et ratées d'abord
  function pick(pool, n) {
    const w = pool.map(b => { const s = stat(b.id); return s.ok + s.ko === 0 ? 3 : s.last === 0 ? 4 : 1 / (1 + s.ok); });
    const out = [], used = new Set();
    while (out.length < Math.min(n, pool.length)) {
      let tot = 0; pool.forEach((_, i) => { if (!used.has(i)) tot += w[i]; });
      let r = Math.random() * tot;
      for (let i = 0; i < pool.length; i++) { if (used.has(i)) continue; r -= w[i]; if (r <= 0 || i === pool.length - 1) { used.add(i); out.push(pool[i]); break; } }
    }
    return out;
  }
  // examen blanc : répartition proportionnelle par thème, mises en situation incluses
  function examQueue() {
    const n = opts.exam.n, byT = {};
    opts.bank.forEach(b => (byT[b.t] ??= []).push(b));
    const keys = Object.keys(byT), total = opts.bank.length;
    let out = [];
    keys.forEach(k => { out.push(...pick(byT[k], Math.round(n * byT[k].length / total))); });
    if (out.length > n) out = shuffle(out).slice(0, n);
    while (out.length < n) { const rest = opts.bank.filter(b => !out.includes(b)); if (!rest.length) break; out.push(rest[Math.floor(Math.random() * rest.length)]); }
    return shuffle(out);
  }

  function intro() {
    clearInterval(timer);
    const hist = api.history().slice(-6).reverse();
    const mastered = opts.bank.filter(b => stat(b.id).last === 1).length;
    const seg = (name, items, cur) => `<div class="seg" role="group" aria-label="${name}" style="flex-wrap:wrap">${items.map(([k, l]) => `<button data-${name}="${k}" aria-pressed="${String(k) === String(cur)}">${esc(l)}</button>`).join('')}</div>`;
    el.innerHTML = `
      ${opts.intro || ''}
      <div class="card"><div style="display:grid;gap:14px">
        <div><label class="small muted" for="qz-topic">${T.topic}</label>
          <select id="qz-topic"><option value="all">${T.all} (${opts.bank.length})</option>${Object.entries(opts.topics).map(([k, l]) => `<option value="${k}" ${k === topic ? 'selected' : ''}>${esc(l)} (${opts.bank.filter(b => b.t === k).length})</option>`).join('')}</select></div>
        <div><div class="small muted" style="margin-bottom:6px">${T.count}</div>${seg('count', opts.counts, count)}</div>
        <div class="row"><button class="btn primary" id="qz-go">${T.start}</button>
          <button class="btn" id="qz-miss">${T.mistakes} (${missed().length})</button>
          ${opts.exam ? `<button class="btn" id="qz-exam">${esc(opts.exam.label)}</button>` : ''}</div>
        <div class="small muted">${T.progress} : ${mastered} / ${opts.bank.length}</div>
        <div class="progress"><span style="width:${Math.round(100 * mastered / opts.bank.length)}%;background:var(--ok)"></span></div>
      </div></div>
      ${hist.length ? `<h2>${T.last}</h2><table class="hist"><tr><th>${T.date}</th><th>${T.mode}</th><th>${T.score}</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${esc(s.details.label || '')}</td><td>${s.details.ok}/${s.details.n} · ${s.score} %</td></tr>`).join('')}</table>` : ''}`;
    el.querySelector('#qz-topic').onchange = e => { topic = e.target.value; };
    el.querySelectorAll('[data-count]').forEach(b => b.onclick = () => { count = Number(b.dataset.count); el.querySelectorAll('[data-count]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    el.querySelector('#qz-go').onclick = () => { const pool = opts.bank.filter(b => topic === 'all' || b.t === topic); start(pick(pool, count), 'practice'); };
    el.querySelector('#qz-miss').onclick = () => { const m = missed(); if (!m.length) { api.toast(T.none); return; } start(shuffle(m.slice()).slice(0, 40), 'missed'); };
    el.querySelector('#qz-exam')?.addEventListener('click', () => start(examQueue(), 'exam'));
  }

  function start(q, m) {
    queue = q; idx = 0; ok = 0; mode = m; wrongs = [];
    clearInterval(timer);
    if (m === 'exam') {
      deadline = Date.now() + opts.exam.minutes * 60000;
      timer = setInterval(() => { const t = el.querySelector('#qz-time'); const left = Math.max(0, deadline - Date.now()); if (t) t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`; if (!left) end(); }, 1000);
    }
    show();
  }

  function show() {
    const b = queue[idx]; answered = false;
    const order = opts.shuffleOptions ? shuffle(b.o.map((_, i) => i)) : b.o.map((_, i) => i);
    el.innerHTML = `
      <div class="spread small" style="margin-bottom:8px"><span>${T.q} ${idx + 1} / ${queue.length}${mode === 'exam' ? ` · ⏱ <b id="qz-time"></b>` : ''}</span><span>${ok} ✓</span>
        <button class="btn small ghost" id="qz-stop">${T.stop}</button></div>
      <div class="card">
        <div class="tiny muted" style="margin-bottom:6px">${esc(opts.topics[b.t] || '')}${b.s ? ` · ${T.case}` : ''}</div>
        ${b.v ? `<p style="margin:0 0 10px;line-height:1.6">${esc(b.v)}</p>` : ''}
        <div style="font-weight:600;font-size:17px;line-height:1.5;margin-bottom:12px">${esc(b.q)}</div>
        <div class="choices" style="grid-template-columns:1fr">${order.map((i, k) => `<button class="btn choice" data-i="${i}" style="text-align:left;justify-content:flex-start"><b style="margin-right:8px">${LETTERS[k]}</b> ${esc(b.o[i])}</button>`).join('')}</div>
        <div id="qz-fb" style="margin-top:10px"></div>
      </div>`;
    if (mode === 'exam') timer && el.querySelector('#qz-time') && (el.querySelector('#qz-time').textContent = '…');
    el.querySelector('#qz-stop').onclick = () => (idx > 0 || answered ? end() : intro());
    el.querySelectorAll('.choice').forEach(btn => btn.onclick = () => answer(Number(btn.dataset.i), btn));
  }

  function answer(i, btn) {
    if (answered) return; answered = true;
    const b = queue[idx], good = i === b.c;
    mark(b.id, good); if (good) ok++; else wrongs.push(b);
    const fb = el.querySelector('#qz-fb');
    if (mode === 'exam') { next(); return; }   // pas de correction pendant l'examen blanc
    el.querySelectorAll('.choice').forEach(x => { if (Number(x.dataset.i) === b.c) x.classList.add('ok'); });
    if (!good) btn.classList.add('ko');
    fb.innerHTML = `<div class="${good ? 'feedback-ok' : 'feedback-ko'}" style="font-weight:600;margin-bottom:4px">${good ? T.correct : T.wrong}</div>
      <div class="small" style="line-height:1.6">${esc(b.x)}</div>
      <div style="margin-top:10px"><button class="btn primary" id="qz-next">${idx + 1 < queue.length ? T.next : T.end}</button></div>`;
    el.querySelector('#qz-next').onclick = next;
  }
  function next() { idx++; idx < queue.length ? show() : end(); }

  function end() {
    clearInterval(timer);
    const n = Math.min(queue.length, idx + (answered && idx < queue.length ? 1 : 0));
    if (!n) { intro(); return; }
    const pct = Math.round(100 * ok / n);
    const label = mode === 'exam' ? opts.exam.label : mode === 'missed' ? T.mistakes : (topic === 'all' ? T.all : opts.topics[topic]);
    api.save(pct, '%', { ok, n, label, mode, topic });
    const passed = mode === 'exam' && ok >= opts.exam.pass && n === queue.length;
    el.innerHTML = `<div class="card" style="text-align:center;border-color:${mode === 'exam' ? (passed ? 'var(--ok)' : 'var(--ko)') : 'var(--ok)'}">
        <h3>${ok} / ${n} · ${pct} %</h3>
        ${mode === 'exam' ? `<p class="${passed ? 'feedback-ok' : 'feedback-ko'}">${passed ? (en ? 'Pass' : 'Réussi') : (en ? 'Not passed' : 'Pas encore réussi')} (${en ? 'pass mark' : 'seuil'} : ${opts.exam.pass} / ${opts.exam.n})</p>` : ''}
        <button class="btn primary" id="qz-again">${T.again}</button> <button class="btn" id="qz-menu">${T.menu}</button></div>
      ${wrongs.length ? `<h2>${T.missed}</h2>${wrongs.map(b => `<div class="card" style="margin-bottom:8px"><div style="font-weight:600">${esc(b.q)}</div>
        <div class="small feedback-ok" style="margin:4px 0">${T.answer} : ${esc(b.o[b.c])}</div><div class="small muted">${esc(b.x)}</div></div>`).join('')}` : ''}`;
    el.querySelector('#qz-again').onclick = () => mode === 'exam' ? start(examQueue(), 'exam') : mode === 'missed' ? (missed().length ? start(shuffle(missed()).slice(0, 40), 'missed') : intro()) : start(pick(opts.bank.filter(b => topic === 'all' || b.t === topic), count), 'practice');
    el.querySelector('#qz-menu').onclick = intro;
  }

  intro();
  return () => clearInterval(timer);
}
