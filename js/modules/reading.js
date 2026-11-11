import { READING_TEXTS } from '../content.js';

const words = t => t.replace(/\s+/g, ' ').trim().split(' ');

export function mount(el, api) {
  const { esc } = api;
  const TEXTS = [...READING_TEXTS, ...api.S.alive('readingTexts')];
  let timer = null, timeouts = [];
  const lastWpm = () => { const h = api.history().filter(s => s.details.mode === 'scroll' || s.details.mode === 'rsvp'); return h.length ? h[h.length - 1].details.wpm : 300; };
  let opts = { mode: 'full', own: false, wpm: lastWpm(), chunk: 1, custom: '' };

  // L'app choisit le texte : jamais lu d'abord, sinon le moins récemment lu.
  function nextText() {
    const lastRead = {};
    api.history().forEach(s => { if (s.details.text) lastRead[s.details.text] = Math.max(lastRead[s.details.text] || 0, s.ts); });
    const unread = TEXTS.filter(t => !lastRead[t.id]);
    if (unread.length) return unread[Math.floor(Math.random() * unread.length)];
    return TEXTS.slice().sort((a, b) => lastRead[a.id] - lastRead[b.id])[0];
  }
  let chosen = nextText();

  function intro() {
    const readIds = new Set(api.history().map(s => s.details.text));
    const hist = api.history().slice(-6).reverse();
    el.innerHTML = `
      <div class="card" style="display:grid;gap:14px">
        <div><div class="small muted" style="margin-bottom:6px">Méthode</div>
          <div class="seg" role="group" aria-label="Méthode">
            <button data-m="full" aria-pressed="${opts.mode === 'full'}">Texte chronométré</button>
            <button data-m="scroll" aria-pressed="${opts.mode === 'scroll'}">Texte qui défile</button></div>
          <p class="tiny muted" style="margin:6px 0 0">${opts.mode === 'full' ? 'Tu lis le texte entier à ton rythme, chronomètre lancé : c\'est la mesure de ta vraie vitesse.' : 'Le texte défile à la vitesse choisie : suis la bande de lecture sans revenir en arrière. Idéal pour pousser ta vitesse au-delà de ton confort.'}</p></div>
        <div class="small">${opts.own ? 'Ton propre texte (sans quiz)' : `Prochain texte : <b>${esc(chosen.theme)}</b> · ${words(chosen.text).length} mots, suivi d'un quiz`}
          <div class="tiny muted">${TEXTS.filter(t => readIds.has(t.id)).length} texte(s) lu(s) sur ${TEXTS.length}</div></div>
        <label class="row small" style="gap:6px"><input type="checkbox" id="own" ${opts.own ? 'checked' : ''}> Lire plutôt un texte à moi (article, chapitre…)</label>
        <div id="custom-wrap" style="display:${opts.own ? 'block' : 'none'}">
          <textarea id="custom" placeholder="Colle ici un article ou un chapitre">${esc(opts.custom)}</textarea>
          <div class="tiny" style="color:var(--ko);display:none" id="custom-err">Colle d'abord un texte d'au moins 30 mots.</div></div>
        ${opts.mode === 'scroll' ? `<div><label class="small muted" for="wpm">Vitesse de départ : <b id="wpmv">${opts.wpm}</b> mots/min</label>
          <input type="range" id="wpm" min="100" max="900" step="25" value="${opts.wpm}" style="width:100%"></div>` : ''}
        <div><button class="btn primary" id="go">Commencer</button></div>
      </div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Méthode</th><th>Vitesse</th><th>Compréhension</th><th>Score</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.details.mode === 'scroll' ? 'Défilement' : s.details.mode === 'rsvp' ? 'Mot à mot' : 'Chrono'}</td><td>${s.details.wpm}</td><td>${s.details.comp == null ? '—' : s.details.comp + ' %'}</td><td>${s.score}</td></tr>`).join('')}</table>
        <p class="tiny muted">Score = vitesse × compréhension : lire vite sans retenir ne compte pas.</p>` : ''}`;
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { opts.mode = b.dataset.m; keep(); intro(); });
        el.querySelector('#own').onchange = e => { keep(); opts.own = e.target.checked; intro(); };
    const wpm = el.querySelector('#wpm');
    if (wpm) wpm.oninput = () => { opts.wpm = Number(wpm.value); el.querySelector('#wpmv').textContent = opts.wpm; };
    el.querySelector('#custom').oninput = () => { el.querySelector('#custom-err').style.display = 'none'; };
    el.querySelector('#go').onclick = () => {
      keep();
      if (opts.own && words(opts.custom).length < 30) { el.querySelector('#custom-err').style.display = 'block'; return; }
      opts.mode === 'scroll' ? scroll() : full();
    };
  }
  function keep() { const c = el.querySelector('#custom'); if (c) opts.custom = c.value; }
  function current() { return opts.own ? { id: 'custom', title: 'Mon texte', text: opts.custom, quiz: null } : chosen; }

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

  // --- texte qui défile en continu, à vitesse réglable (bande de lecture au tiers supérieur)
  function scroll() {
    const T = current(), n = words(T.text).length;
    let wpm = opts.wpm, paused = true, started = false, offset = 0, last = 0, activeMs = 0, raf = 0;
    el.innerHTML = `<div class="spread small" style="margin-bottom:8px"><span>Vitesse <b id="sv">${wpm}</b> mots/min</span><span id="sp">0 %</span></div>
      <div class="scroller" id="sc" aria-label="Texte qui défile"><div class="inner" id="si">${T.text.split('\n').map(p => `<p>${esc(p)}</p>`).join('')}</div>
        <div class="band"></div><div class="fade-t"></div><div class="fade-b"></div></div>
      <div class="row" style="justify-content:center;margin-top:10px">
        <button class="btn" id="slow" aria-label="Ralentir">− 25</button><button class="btn primary" id="pp">Démarrer</button><button class="btn" id="fast" aria-label="Accélérer">+ 25</button>
        <button class="btn ghost" id="stop">Arrêter</button></div>
      <p class="tiny muted" style="text-align:center">Lis la ligne qui passe dans la bande bleue. Touche le texte ou appuie sur Espace pour mettre en pause ; ajuste la vitesse en direct.</p>`;
    const sc = el.querySelector('#sc'), si = el.querySelector('#si');
    const startY = sc.clientHeight * 0.32;                 // le texte commence dans la bande
    const total = () => si.scrollHeight;                   // hauteur du texte
    const pxPerMs = () => total() / (n / wpm * 60000);     // parcourir tout le texte en n/wpm minutes
    const place = () => { si.style.transform = `translateY(${startY - offset}px)`; el.querySelector('#sp').textContent = `${Math.min(100, Math.round(100 * offset / total()))} %`; };
    const frame = t => {
      if (paused) return;
      const dt = last ? t - last : 0; last = t; activeMs += dt;
      offset += dt * pxPerMs(); place();
      if (offset >= total()) { cancelAnimationFrame(raf); return quiz(T, Math.round(n / (activeMs / 60000)), 'scroll'); }
      raf = requestAnimationFrame(frame);
    };
    const toggle = () => {
      paused = !paused; started = true;
      el.querySelector('#pp').textContent = paused ? 'Reprendre' : 'Pause';
      if (!paused) { last = 0; raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
    };
    const setW = d => { wpm = Math.max(100, Math.min(900, wpm + d)); opts.wpm = wpm; el.querySelector('#sv').textContent = wpm; };
    el.querySelector('#pp').onclick = toggle; sc.onclick = toggle;
    el.querySelector('#slow').onclick = () => setW(-25); el.querySelector('#fast').onclick = () => setW(25);
    const key = e => { if (!el.contains(sc)) return; if (e.code === 'Space') { e.preventDefault(); toggle(); } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setW(25); else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setW(-25); };
    document.addEventListener('keydown', key);
    timeouts.push(() => { document.removeEventListener('keydown', key); cancelAnimationFrame(raf); });
    el.querySelector('#stop').onclick = () => { cancelAnimationFrame(raf); intro(); };
    place();
  }

  // --- questionnaire
  function quiz(T, wpm, mode) {
    clearTimeout(timer); clearInterval(timer);
    if (!T.quiz) {
      api.save(wpm, 'mots/min', { mode, wpm, comp: null, text: T.id });
      el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)"><h3>${wpm} mots/min</h3>
        <p class="small muted">Pas de quiz pour un texte personnel : résume-le en une phrase à voix haute pour vérifier ta compréhension.</p>
        <button class="btn primary" id="again">Autre lecture</button></div>`;
      el.querySelector('#again').onclick = () => { chosen = nextText(); intro(); }; return;
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
        : (mode === 'scroll' ? `Bonne compréhension : essaie ${Math.min(900, wpm + 50)} mots/min la prochaine fois.` : 'Bonne compréhension : essaie de lire un peu plus vite la prochaine fois.');
      if (mode === 'scroll' && comp >= 75) opts.wpm = Math.min(900, wpm + 50);
      el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)">
        <h3>${wpm} mots/min · ${comp} % de compréhension</h3><p>Score : <b>${score}</b></p>
        <p class="small muted">${advice} Pour repère, un adulte lit en moyenne entre 200 et 300 mots/min.</p>
        <button class="btn primary" id="again">Lecture suivante</button></div>`;
      el.querySelector('#again').onclick = () => { chosen = nextText(); intro(); };
    };
    show();
  }

  intro();
  return () => { clearTimeout(timer); clearInterval(timer); timeouts.forEach(f => typeof f === 'function' && f()); };
}
