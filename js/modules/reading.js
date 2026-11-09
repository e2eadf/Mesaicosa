import { READING_TEXTS } from '../content.js';

const words = t => t.replace(/\s+/g, ' ').trim().split(' ');

export function mount(el, api) {
  const { esc } = api;
  const TEXTS = [...READING_TEXTS, ...api.S.alive('readingTexts')];
  let timer = null, timeouts = [];
  const lastWpm = () => { const h = api.history().filter(s => s.details.mode === 'rsvp'); return h.length ? h[h.length - 1].details.wpm : 300; };
  let opts = { mode: 'full', textId: TEXTS[0].id, wpm: lastWpm(), chunk: 1, custom: '' };

  function intro() {
    const done = new Set(api.history().map(s => s.details.text));
    const hist = api.history().slice(-6).reverse();
    el.innerHTML = `
      <div class="card" style="display:grid;gap:14px">
        <div><div class="small muted" style="margin-bottom:6px">Méthode</div>
          <div class="seg" role="group" aria-label="Méthode">
            <button data-m="full" aria-pressed="${opts.mode === 'full'}">Texte chronométré</button>
            <button data-m="rsvp" aria-pressed="${opts.mode === 'rsvp'}">Défilement rapide</button></div>
          <p class="tiny muted" style="margin:6px 0 0">${opts.mode === 'full' ? 'Tu lis le texte entier à ton rythme, chronomètre lancé : c\'est la mesure de ta vraie vitesse.' : 'Les mots s\'affichent un à un au centre, sans mouvement des yeux : idéal pour pousser ta vitesse au-delà de ton confort.'}</p></div>
        <div><label class="small muted" for="txt">Texte</label>
          <select id="txt">${TEXTS.map(t => `<option value="${t.id}" ${t.id === opts.textId ? 'selected' : ''}>${esc(t.theme)} — ${esc(t.title)}${done.has(t.id) ? ' ✓' : ''}</option>`).join('')}
          <option value="custom" ${opts.textId === 'custom' ? 'selected' : ''}>Mon propre texte (sans quiz)</option></select></div>
        <div id="custom-wrap" style="display:${opts.textId === 'custom' ? 'block' : 'none'}">
          <textarea id="custom" placeholder="Colle ici un article ou un chapitre">${esc(opts.custom)}</textarea>
          <div class="tiny" style="color:var(--ko);display:none" id="custom-err">Colle d'abord un texte d'au moins 30 mots.</div></div>
        ${opts.mode === 'rsvp' ? `<div><label class="small muted" for="wpm">Vitesse : <b id="wpmv">${opts.wpm}</b> mots/min</label>
          <input type="range" id="wpm" min="150" max="900" step="25" value="${opts.wpm}" style="width:100%"></div>
          <div><span class="small muted">Mots par affichage</span>
          <div class="seg" role="group" aria-label="Mots par affichage">${[1, 2, 3].map(n => `<button data-c="${n}" aria-pressed="${opts.chunk === n}">${n}</button>`).join('')}</div></div>` : ''}
        <div><button class="btn primary" id="go">Commencer</button></div>
      </div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Méthode</th><th>Vitesse</th><th>Compréhension</th><th>Score</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.details.mode === 'rsvp' ? 'Défilement' : 'Chrono'}</td><td>${s.details.wpm}</td><td>${s.details.comp == null ? '—' : s.details.comp + ' %'}</td><td>${s.score}</td></tr>`).join('')}</table>
        <p class="tiny muted">Score = vitesse × compréhension : lire vite sans retenir ne compte pas.</p>` : ''}`;
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { opts.mode = b.dataset.m; keep(); intro(); });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { opts.chunk = Number(b.dataset.c); el.querySelectorAll('[data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    el.querySelector('#txt').onchange = e => { opts.textId = e.target.value; el.querySelector('#custom-wrap').style.display = opts.textId === 'custom' ? 'block' : 'none'; };
    const wpm = el.querySelector('#wpm');
    if (wpm) wpm.oninput = () => { opts.wpm = Number(wpm.value); el.querySelector('#wpmv').textContent = opts.wpm; };
    el.querySelector('#custom').oninput = () => { el.querySelector('#custom-err').style.display = 'none'; };
    el.querySelector('#go').onclick = () => {
      keep();
      if (opts.textId === 'custom' && words(opts.custom).length < 30) { el.querySelector('#custom-err').style.display = 'block'; return; }
      opts.mode === 'rsvp' ? rsvp() : full();
    };
  }
  function keep() { const c = el.querySelector('#custom'); if (c) opts.custom = c.value; const t = el.querySelector('#txt'); if (t) opts.textId = t.value; }
  function current() { return opts.textId === 'custom' ? { id: 'custom', title: 'Mon texte', text: opts.custom, quiz: null } : TEXTS.find(t => t.id === opts.textId); }

  // --- lecture complète chronométrée
  function full() {
    const T = current(), n = words(T.text).length;
    el.innerHTML = `<div class="card" style="text-align:center"><p style="margin-top:0">${n} mots. Lis normalement, sans revenir en arrière. Appuie sur « Terminé » à la dernière ligne.</p>
      <button class="btn primary" id="st">Lancer le chronomètre</button></div>`;
    el.querySelector('#st').onclick = () => {
      const t0 = Date.now();
      el.innerHTML = `<h2 style="margin-top:0">${esc(T.title)}</h2>
        <div class="card" style="font-size:18px;line-height:1.7">${T.text.split('\n').map(p => `<p>${esc(p)}</p>`).join('')}</div>
        <div style="position:sticky;bottom:calc(var(--tab-h) + 12px);text-align:center;margin-top:12px"><button class="btn primary" id="end">Terminé · <span class="timer" id="tm">0:00</span></button></div>`;
      timer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); const tm = el.querySelector('#tm'); if (tm) tm.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500);
      el.querySelector('#end').onclick = () => { const wpm = Math.round(n / ((Date.now() - t0) / 60000));
        if (wpm > 1500) { el.querySelector('#end').insertAdjacentHTML('afterend', '<div class="small feedback-ko" style="margin-top:6px">Un peu trop rapide pour être une vraie lecture : prends le temps de lire le texte en entier.</div>'); return; }
        clearInterval(timer); quiz(T, wpm, 'full'); };
    };
  }

  // --- défilement RSVP
  function rsvp() {
    const T = current(), w = words(T.text), chunks = [];
    for (let i = 0; i < w.length; i += opts.chunk) chunks.push(w.slice(i, i + opts.chunk).join(' '));
    let i = 0, paused = false, t0 = 0, pausedMs = 0, pauseStart = 0;
    el.innerHTML = `<div class="rsvp" id="rv" aria-live="off">Prêt ?</div>
      <div class="progress" style="margin:10px 0"><span id="pg" style="width:0"></span></div>
      <div class="row" style="justify-content:center"><button class="btn" id="pp">Pause</button><button class="btn ghost" id="stop">Arrêter</button></div>
      <p class="tiny muted" style="text-align:center">${opts.wpm} mots/min · touche la zone de texte ou la barre d'espace pour mettre en pause</p>`;
    const rv = el.querySelector('#rv');
    const orp = word => { const k = Math.max(0, Math.min(word.length - 1, Math.floor((word.length - 1) * 0.35))); return `${esc(word.slice(0, k))}<span class="orp">${esc(word[k] || '')}</span>${esc(word.slice(k + 1))}`; };
    const show = c => { rv.innerHTML = opts.chunk === 1 ? orp(c) : esc(c); };
    const step = () => {
      if (paused) return;
      if (i >= chunks.length) { const wpm = Math.round(w.length / ((Date.now() - t0 - pausedMs) / 60000)); return quiz(T, Math.min(wpm, opts.wpm), 'rsvp'); }
      const c = chunks[i++]; show(c);
      el.querySelector('#pg').style.width = `${Math.round(100 * i / chunks.length)}%`;
      let ms = 60000 / opts.wpm * opts.chunk;
      if (/[.!?…]$/.test(c)) ms *= 2; else if (/[,;:]$/.test(c)) ms *= 1.5;
      if (c.length > 12 && opts.chunk === 1) ms *= 1.2;
      timer = setTimeout(step, ms);
    };
    const toggle = () => {
      paused = !paused; el.querySelector('#pp').textContent = paused ? 'Reprendre' : 'Pause';
      if (paused) { pauseStart = Date.now(); clearTimeout(timer); } else { pausedMs += Date.now() - pauseStart; step(); }
    };
    el.querySelector('#pp').onclick = toggle; rv.onclick = toggle;
    const key = e => { if (e.code === 'Space' && el.contains(rv)) { e.preventDefault(); toggle(); } };
    document.addEventListener('keydown', key); timeouts.push(() => document.removeEventListener('keydown', key));
    el.querySelector('#stop').onclick = () => { clearTimeout(timer); intro(); };
    let n = 3; rv.textContent = n;
    const cd = () => { n--; if (n > 0) { rv.textContent = n; timer = setTimeout(cd, 700); } else { t0 = Date.now(); step(); } };
    timer = setTimeout(cd, 700);
  }

  // --- questionnaire
  function quiz(T, wpm, mode) {
    clearTimeout(timer); clearInterval(timer);
    if (!T.quiz) {
      api.save(wpm, 'mots/min', { mode, wpm, comp: null, text: T.id });
      el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)"><h3>${wpm} mots/min</h3>
        <p class="small muted">Pas de quiz pour un texte personnel : résume-le en une phrase à voix haute pour vérifier ta compréhension.</p>
        <button class="btn primary" id="again">Autre lecture</button></div>`;
      el.querySelector('#again').onclick = intro; return;
    }
    let k = 0, good = 0;
    const show = () => {
      const q = T.quiz[k];
      el.innerHTML = `<div class="spread small"><span>Compréhension · question ${k + 1} / ${T.quiz.length}</span><span>Vitesse : ${wpm} mots/min</span></div>
        <div class="q-banner" style="text-align:left">${esc(q.q)}</div>
        <div class="choices">${q.a.map((a, i) => `<button class="btn choice" data-i="${i}">${esc(a)}</button>`).join('')}</div>`;
      let done = false;
      el.querySelectorAll('.choice').forEach(b => b.onclick = () => {
        if (done) return; done = true;
        const ok = Number(b.dataset.i) === q.c; if (ok) good++;
        el.querySelectorAll('.choice')[q.c].classList.add('ok'); if (!ok) b.classList.add('ko');
        const t = setTimeout(() => { k++; k < T.quiz.length ? show() : result(); }, ok ? 700 : 1600); timeouts.push(() => clearTimeout(t));
      });
    };
    const result = () => {
      const comp = Math.round(100 * good / T.quiz.length), score = Math.round(wpm * comp / 100);
      api.save(score, 'pts', { mode, wpm, comp, text: T.id });
      const advice = comp < 75 ? 'Compréhension insuffisante : ralentis un peu la prochaine fois.'
        : (mode === 'rsvp' ? `Bonne compréhension : essaie ${Math.min(900, wpm + 50)} mots/min la prochaine fois.` : 'Bonne compréhension : essaie de lire un peu plus vite la prochaine fois.');
      if (mode === 'rsvp' && comp >= 75) opts.wpm = Math.min(900, wpm + 50);
      el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)">
        <h3>${wpm} mots/min · ${comp} % de compréhension</h3><p>Score : <b>${score}</b></p>
        <p class="small muted">${advice} Pour repère, un adulte lit en moyenne entre 200 et 300 mots/min.</p>
        <button class="btn primary" id="again">Autre lecture</button></div>`;
      el.querySelector('#again').onclick = intro;
    };
    show();
  }

  intro();
  return () => { clearTimeout(timer); clearInterval(timer); timeouts.forEach(f => typeof f === 'function' && f()); };
}
