import { TYPING_TEXTS } from '../content.js';

const norm = s => s.replace(/[“”]/g, '"').replace(/[’‘]/g, "'").replace(/[  ]/g, ' ').replace(/…/g, '...');

// Codes Alt (Windows, pavé numérique) pour les caractères absents du clavier AZERTY
const ALT = [['à', '133'], ['À', '0192'], ['â', '131'], ['Â', '0194'], ['é', '130'], ['É', '0201'], ['è', '138'], ['È', '0200'],
  ['ê', '136'], ['Ê', '0202'], ['ë', '137'], ['Ë', '0203'], ['î', '140'], ['Î', '0206'], ['ï', '139'], ['Ï', '0207'],
  ['ô', '147'], ['Ô', '0212'], ['œ', '0156'], ['Œ', '0140'], ['û', '150'], ['Û', '0219'], ['ù', '151'], ['Ù', '0217'],
  ['ü', '129'], ['Ü', '0220'], ['ç', '135'], ['Ç', '128'], ['«', '174'], ['»', '175'], ['€', '0128']];
const ALTMAP = Object.fromEntries(ALT);
// caractères qui n'existent pas directement sur le clavier : on montre le code Alt
const NEEDS_ALT = new Set(['À', 'Â', 'É', 'È', 'Ê', 'Ë', 'Î', 'Ï', 'Ô', 'Œ', 'Û', 'Ù', 'Ü', 'Ç', 'œ', '«', '»']);
const tid = t => t.slice(0, 48);

// Clavier AZERTY (France) : [caractère, caractère avec Maj, doigt]
const ROWS = [
  [['²', '', 'lp'], ['&', '1', 'lp'], ['é', '2', 'lr'], ['"', '3', 'lm'], ["'", '4', 'li'], ['(', '5', 'li'], ['-', '6', 'ri'], ['è', '7', 'ri'], ['_', '8', 'rm'], ['ç', '9', 'rr'], ['à', '0', 'rp'], [')', '°', 'rp'], ['=', '+', 'rp']],
  [['a', 'A', 'lp'], ['z', 'Z', 'lr'], ['e', 'E', 'lm'], ['r', 'R', 'li'], ['t', 'T', 'li'], ['y', 'Y', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'], ['^', '¨', 'rp'], ['$', '£', 'rp']],
  [['q', 'Q', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'], ['g', 'G', 'li'], ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], ['m', 'M', 'rp'], ['ù', '%', 'rp'], ['*', 'µ', 'rp']],
  [['<', '>', 'lp'], ['w', 'W', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'], ['n', 'N', 'ri'], [',', '?', 'ri'], [';', '.', 'rm'], [':', '/', 'rr'], ['!', '§', 'rp']],
];
const HOME = new Set(['f', 'j']);
const FINGER = { lp: 'auriculaire gauche', lr: 'annulaire gauche', lm: 'majeur gauche', li: 'index gauche', ri: 'index droit', rm: 'majeur droit', rr: 'annulaire droit', rp: 'auriculaire droit', th: 'pouce' };
const DEAD = { 'â': ['^', 'a'], 'ê': ['^', 'e'], 'î': ['^', 'i'], 'ô': ['^', 'o'], 'û': ['^', 'u'], 'ë': ['¨', 'e'], 'ï': ['¨', 'i'], 'ü': ['¨', 'u'], 'Ê': ['^', 'E'] };

function findKey(ch) {
  for (const row of ROWS) for (const k of row) {
    if (k[0] === ch) return { k, shift: false };
    if (k[1] === ch) return { k, shift: true };
  }
  return null;
}
// Suite de touches pour taper un caractère
function keysFor(ch) {
  if (ch === ' ') return [{ space: true }];
  if (DEAD[ch]) return DEAD[ch].map(findKey).filter(Boolean);
  const f = findKey(ch);
  return f ? [f] : [];
}

// Exercices de syllabes et chaînes fréquentes en français
const DRILLS = {
  bi: { label: 'Bigrammes', units: ['es', 'le', 'de', 'en', 're', 'nt', 'on', 'er', 'ou', 'te', 'ai', 'an', 'ur', 'ne', 'se', 'la', 'it', 'me', 'qu', 'ue', 'ie', 'et', 'ce', 'el', 'ra', 'ri', 'is', 'us', 'oi', 'au'] },
  tri: { label: 'Trigrammes', units: ['ent', 'les', 'ion', 'que', 'des', 'est', 'our', 'ait', 'men', 'ant', 'tio', 'par', 'ell', 'con', 'pou', 'ous', 'dan', 'ans', 'eur', 'res', 'ais', 'ité', 'ère', 'ple', 'tre', 'pre', 'com', 'ffe', 'emp', 'eau'] },
  mots: { label: 'Mots et élisions', units: ['de', 'la', 'le', 'et', 'les', 'des', 'un', 'une', 'du', 'que', 'est', 'pour', 'qui', 'dans', 'par', 'plus', 'pas', 'sur', 'avec', 'mais', 'nous', 'vous', 'tout', 'comme', 'fait', 'être', 'avoir', "l'", "d'un", "qu'il", "c'est", "n'est", "j'ai", "s'il", "aujourd'hui", 'été', 'très', 'où', 'déjà', 'après', 'voilà'] },
  ponct: { label: 'Ponctuation et chiffres', units: ['1, 2, 3.', '(oui)', '« non »', '10 %', '25 €', '?', '!', ':', ';', '12/05', '7,5', 'p. 42', 'n° 3', '2026', '-', '_', '"ok"', '1 000', '9h30', 'a + b = c'] },
};
const drillText = kind => {
  const u = DRILLS[kind].units, out = [];
  if (kind === 'ponct') { while (out.join(' ').length < 80) out.push(u[Math.floor(Math.random() * u.length)]); return out.join(' '); }
  // chaque unité trois fois de suite, puis un mélange
  const pickU = () => u[Math.floor(Math.random() * u.length)];
  for (let i = 0; i < 4; i++) { const x = pickU(); out.push(x, x, x); }
  while (out.join(' ').length < 90) out.push(pickU());
  return out.join(' ');
};
const LETTERS = 'azertyuiopqsdfghjklmwxcvbn'.split('').concat(['é', 'è', 'à', 'ç', 'ù']);
const MODES = [['texte', 'Textes'], ['syll', 'Syllabes et chaînes'], ['lettres', 'Lettres éclair']];
let modePref = (() => { try { return localStorage.getItem('mesaicosa.typemode') || 'texte'; } catch { return 'texte'; } })();
let drillPref = (() => { try { return localStorage.getItem('mesaicosa.typedrill') || 'bi'; } catch { return 'bi'; } })();

let uiPref = (() => { try { return localStorage.getItem('mesaicosa.kb') !== 'off'; } catch { return true; } })();

export function mount(el, api) {
  const { esc } = api;
  let text, typed, errors, start, timer, finished;

  function pick() {
    if (modePref === 'syll') return drillText(drillPref);
    const pool = [...TYPING_TEXTS, ...api.S.alive('typingTexts').map(x => x.text)].map(norm);
    const used = {}; const hist = api.history();
    hist.forEach(s => { if (s.details.tid) used[s.details.tid] = (used[s.details.tid] || 0) + 1; });
    const recent = new Set(hist.slice(-5).map(s => s.details.tid));
    const min = Math.min(...pool.map(t => used[tid(t)] || 0));
    let cands = pool.filter(t => (used[tid(t)] || 0) === min && !recent.has(tid(t)));
    if (!cands.length) cands = pool.filter(t => !recent.has(tid(t)));
    if (!cands.length) cands = pool;
    return cands[Math.floor(Math.random() * cands.length)];
  }

  function trend() {
    const h = api.history().filter(s => s.details.acc != null && (s.details.mode || 'texte') === modePref);
    if (h.length < 2) return '';
    const avg = a => Math.round(a.reduce((x, s) => x + s.details.acc, 0) / a.length);
    const last = h.slice(-5), prev = h.slice(-10, -5);
    const w = a => Math.round(a.reduce((x, s) => x + s.score, 0) / a.length);
    return `<div class="stats" style="margin-bottom:12px">
      <div class="stat"><div class="k">Précision (5 dernières)</div><div class="v">${avg(last)} %${prev.length ? ` <span class="small ${avg(last) >= avg(prev) ? 'feedback-ok' : 'feedback-ko'}">${avg(last) >= avg(prev) ? '▲' : '▼'} ${Math.abs(avg(last) - avg(prev))}</span>` : ''}</div></div>
      <div class="stat"><div class="k">Vitesse (5 dernières)</div><div class="v">${w(last)} <span class="small muted">mots/min</span></div></div>
      <div class="stat"><div class="k">Séances</div><div class="v">${h.length}</div></div></div>`;
  }

  function kbHtml() {
    const row = (r, i) => `<div class="krow">${i === 3 ? '<div class="k wide" data-shift="l">Maj</div>' : ''}${r.map(k =>
      `<div class="k f-${k[2]} ${HOME.has(k[0]) ? 'home' : ''}" data-k="${esc(k[0])}">${k[1] && k[1] !== k[0].toUpperCase() ? `<span class="sh">${esc(k[1])}</span>` : ''}${esc(/^[a-z]$/.test(k[0]) ? k[0].toUpperCase() : k[0])}</div>`).join('')}${i === 3 ? '<div class="k wide" data-shift="r">Maj</div>' : ''}</div>`;
    return `<div class="kb" id="kb" aria-hidden="true">${ROWS.map(row).join('')}<div class="krow"><div class="k space f-th" data-space="1">espace</div></div></div>
      <div class="kb-hint muted" id="kb-hint"></div>
      <details class="card" id="alt-panel" open style="margin-top:10px"><summary class="small">Caractères spéciaux : Alt + code (pavé numérique)</summary>
        <div class="alt-grid">${ALT.map(([c, code]) => `<div class="alt-cell" data-ch="${esc(c)}"><b>${esc(c)}</b><span>${code}</span></div>`).join('')}</div>
        <p class="tiny muted" style="margin-bottom:0">Maintiens Alt, tape le code sur le pavé numérique (Verr Num activé), puis relâche Alt.</p></details>`;
  }

  const modeBar = () => `<div class="seg" role="group" aria-label="Mode" style="flex-wrap:wrap;margin-bottom:10px">${MODES.map(([k, l]) => `<button data-mode="${k}" aria-pressed="${k === modePref}">${l}</button>`).join('')}</div>
    ${modePref === 'syll' ? `<div class="seg" role="group" aria-label="Exercice" style="flex-wrap:wrap;margin-bottom:10px">${Object.entries(DRILLS).map(([k, d]) => `<button data-drill="${k}" aria-pressed="${k === drillPref}">${d.label}</button>`).join('')}</div>` : ''}`;
  const bindModes = () => {
    el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { modePref = b.dataset.mode; try { localStorage.setItem('mesaicosa.typemode', modePref); } catch { } start0(); });
    el.querySelectorAll('[data-drill]').forEach(b => b.onclick = () => { drillPref = b.dataset.drill; try { localStorage.setItem('mesaicosa.typedrill', drillPref); } catch { } start0(); });
  };
  const start0 = () => { clearInterval(timer); modePref === 'lettres' ? letters() : setup(); };

  // ——— Lettres éclair : une lettre s'affiche, il faut la taper le plus vite possible
  function letters() {
    clearInterval(timer); finished = false;
    const N = 30; let i = 0, cur = '', shownAt = 0, times = [], miss = 0, started = false;
    const hist = api.history().filter(s => s.details.mode === 'lettres').slice(-5).reverse();
    el.innerHTML = `${modeBar()}
      <div class="spread small" style="margin-bottom:10px"><span>Lettre <b id="li">0</b> / ${N}</span><span>Erreurs <b id="lm">0</b></span><span>Moyenne <b id="lt">—</b> ms</span></div>
      <div class="card" id="lbox" tabindex="0" style="text-align:center;padding:30px 10px;cursor:pointer">
        <div id="lch" style="font-size:96px;font-weight:700;line-height:1;font-family:var(--mono, monospace)">▶</div>
        <div class="small muted" id="lmsg" style="margin-top:10px">Touche ici (ou appuie sur Entrée) pour commencer, puis tape chaque lettre dès qu'elle apparaît.</div></div>
      <input class="hidden-input" id="lin" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Zone de frappe">
      <p class="small muted">Garde les doigts sur la rangée de repos (Q S D F – J K L M) et les yeux sur l'écran. Les lettres accentuées é è à ç ù sont sur la rangée des chiffres et à droite.</p>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Lettres/min</th><th>Temps moyen</th><th>Précision</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.score}</td><td>${s.details.avg} ms</td><td>${s.details.acc} %</td></tr>`).join('')}</table>` : ''}`;
    bindModes();
    const inp = el.querySelector('#lin'), box = el.querySelector('#lbox');
    const focus = () => inp.focus();
    const nextLetter = () => {
      let c; do { c = LETTERS[Math.floor(Math.random() * LETTERS.length)]; } while (c === cur);
      cur = c; shownAt = performance.now();
      el.querySelector('#lch').textContent = c; el.querySelector('#li').textContent = i + 1;
    };
    const go = () => { if (started) return; started = true; el.querySelector('#lmsg').textContent = 'Tape la lettre affichée.'; nextLetter(); focus(); };
    box.addEventListener('click', () => { go(); focus(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    inp.addEventListener('input', e => {
      const v = norm(e.target.value); e.target.value = '';
      if (!started || finished || !v) return;
      const ch = v[v.length - 1].toLowerCase();
      if (ch === cur) {
        times.push(performance.now() - shownAt); i++;
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        el.querySelector('#lt').textContent = avg;
        if (i >= N) return done();
        nextLetter();
      } else {
        miss++; el.querySelector('#lm').textContent = miss;
        const l = el.querySelector('#lch'); l.style.color = 'var(--ko)'; setTimeout(() => { l.style.color = ''; }, 200);
      }
    });
    function done() {
      finished = true;
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const lpm = Math.round(60000 / avg), acc = Math.round(100 * N / (N + miss));
      const prev = api.history().filter(s => s.details.mode === 'lettres');
      const best = prev.length ? Math.max(...prev.map(x => x.score)) : 0;
      api.save(lpm, 'lettres/min', { mode: 'lettres', avg, acc, n: N });
      el.querySelector('#lch').textContent = '✓';
      el.querySelector('#lmsg').innerHTML = `<b>${lpm} lettres/min</b> · ${avg} ms en moyenne · ${acc} % de précision${lpm > best ? ' · record !' : ''}<br><button class="btn primary" id="lag" style="margin-top:10px">Recommencer</button>`;
      el.querySelector('#lag').onclick = letters;
    }
    setTimeout(focus, 50);
  }

  function setup() {
    text = pick(); typed = ''; errors = 0; start = 0; finished = false; clearInterval(timer);
    const hist = api.history().filter(s => (s.details.mode || 'texte') === modePref).slice(-5).reverse();
    el.innerHTML = `
      ${modeBar()}
      ${trend()}
      <div class="spread small" style="margin-bottom:10px">
        <span>Vitesse <b class="timer" id="wpm">0</b> mots/min</span>
        <span>Précision <b class="timer" id="acc">100</b> %</span>
        <span>Temps <b class="timer" id="time">0</b> s</span>
      </div>
      <div class="typing-text" id="tt" tabindex="0" aria-label="Texte à recopier. Touche ici puis tape."></div>
      <textarea class="hidden-input" id="in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Zone de frappe"></textarea>
      ${uiPref ? kbHtml() : ''}
      <p class="small muted">Garde les yeux sur l'écran, jamais sur ton clavier : le clavier affiché te montre la touche et le doigt à utiliser. Index posés sur F et J (les touches à repère). Au début, la précision sera basse : c'est normal, elle montera avec la régularité. Après une erreur, tu peux continuer ou corriger avec Retour arrière. Les caractères absents du clavier (É, À, œ, « »…) se tapent avec Alt + code : voir le tableau.</p>
      <div class="row"><button class="btn" id="new">${modePref === 'syll' ? 'Autre série' : 'Autre texte'}</button>
        <label class="row small" style="gap:6px"><input type="checkbox" id="kbt" ${uiPref ? 'checked' : ''}> Clavier à l'écran</label></div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Mots/min</th><th>Précision</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.score}</td><td>${s.details.acc ?? '—'} %</td></tr>`).join('')}</table>` : ''}
    `;
    const tt = el.querySelector('#tt'), inp = el.querySelector('#in');
    const focus = () => inp.focus();
    tt.addEventListener('click', focus); tt.addEventListener('focus', focus);
    inp.addEventListener('input', onInput);
    el.querySelector('#new').onclick = setup;
    bindModes();
    el.querySelector('#kbt').onchange = e => { uiPref = e.target.checked; try { localStorage.setItem('mesaicosa.kb', uiPref ? 'on' : 'off'); } catch { } setup(); };
    draw(); setTimeout(focus, 50);
  }

  function showNextKey() {
    const kb = el.querySelector('#kb'); if (!kb) return;
    kb.querySelectorAll('.next,.then').forEach(k => k.classList.remove('next', 'then'));
    const hint = el.querySelector('#kb-hint');
    if (typed.length >= text.length) { hint.textContent = ''; return; }
    // si la frappe précédente est fausse, on montre la touche Retour arrière
    // une erreur ne bloque pas : on montre toujours la touche suivante ; corriger reste possible avec Retour arrière
    const lastWrong = typed.length && typed[typed.length - 1] !== text[typed.length - 1];
    const errNote = lastWrong ? '<span class="feedback-ko">Erreur · continue, ou corrige avec Retour arrière.</span> ' : '';
    el.querySelectorAll('#alt-panel .alt-cell').forEach(c => c.classList.remove('next'));
    const ch = text[typed.length];
    if (NEEDS_ALT.has(ch) && ALTMAP[ch]) {
      hint.innerHTML = `${errNote}<b>${esc(ch)}</b> : Alt + ${ALTMAP[ch]} (pavé numérique, Verr Num activé)`;
      el.querySelector(`#alt-panel [data-ch="${CSS.escape(ch)}"]`)?.classList.add('next');
      return;
    }
    const seq = keysFor(ch);
    if (!seq.length) { hint.innerHTML = `${errNote}Caractère spécial : ${esc(ch)}`; return; }
    const parts = [];
    seq.forEach((s, i) => {
      const cls = i === 0 ? 'next' : 'then';
      if (s.space) { kb.querySelector('[data-space]').classList.add(cls); parts.push('espace (pouce)'); return; }
      kb.querySelector(`[data-k="${CSS.escape(s.k[0])}"]`)?.classList.add(cls);
      if (s.shift) kb.querySelector(`[data-shift="${s.k[2][0] === 'l' ? 'r' : 'l'}"]`)?.classList.add(cls);
      parts.push(`${s.shift ? 'Maj + ' : ''}${s.k[0].toUpperCase()} (${FINGER[s.k[2]]})`);
    });
    hint.innerHTML = errNote + esc(parts.join(' puis '));
  }

  function draw() {
    const tt = el.querySelector('#tt'); if (!tt) return;
    let html = '';
    for (let i = 0; i < typed.length; i++) {
      const ch = esc(text[i]);
      html += typed[i] === text[i] ? `<span class="ok">${ch}</span>` : `<span class="ko">${text[i] === ' ' ? '·' : ch}</span>`;
    }
    if (typed.length < text.length) html += `<span class="cur">${esc(text[typed.length])}</span><span class="rest">${esc(text.slice(typed.length + 1))}</span>`;
    tt.innerHTML = html;
    showNextKey();
  }

  function stats() {
    const secs = start ? (Date.now() - start) / 1000 : 0;
    let correct = 0; for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++;
    const wpm = secs > 1 ? Math.round((correct / 5) / (secs / 60)) : 0;
    const keys = typed.length + errors;
    const acc = keys ? Math.round(100 * (keys - errors) / keys) : 100;
    return { secs, wpm, acc };
  }
  function tick() {
    const s = stats();
    const w = el.querySelector('#wpm'); if (!w) return;
    w.textContent = s.wpm; el.querySelector('#acc').textContent = s.acc; el.querySelector('#time').textContent = Math.round(s.secs);
  }

  function onInput(e) {
    if (finished) return;
    const v = norm(e.target.value);
    if (!start && v.length) { start = Date.now(); timer = setInterval(tick, 500); }
    if (v.length > typed.length) {
      for (let i = typed.length; i < v.length && i < text.length; i++) if (v[i] !== text[i]) errors++;
    }
    typed = v.slice(0, text.length);
    draw(); tick();
    if (typed.length >= text.length) finish();
  }

  function finish() {
    finished = true; clearInterval(timer);
    const s = stats();
    api.save(s.wpm, 'mots/min', { mode: modePref, drill: modePref === 'syll' ? drillPref : undefined, acc: s.acc, secs: Math.round(s.secs), chars: text.length, tid: modePref === 'texte' ? tid(text) : undefined, kb: uiPref });
    const best = Math.max(...api.history().filter(x => (x.details.mode || 'texte') === modePref).map(x => x.score));
    const advice = s.acc < 85 ? "Précision encore basse : c'est normal en apprenant à taper sans regarder. Ralentis volontairement et garde les yeux sur l'écran."
      : s.acc < 95 ? 'Bonne progression. Continue à viser la régularité ; la vitesse viendra seule.'
      : 'Très bonne précision : tu peux essayer d\'accélérer un peu.';
    el.insertAdjacentHTML('afterbegin', `<div class="card" style="margin-bottom:14px;border-color:var(--ok)">
      <h3>${s.wpm} mots/min · ${s.acc} % de précision</h3>
      <p class="small muted" style="margin:4px 0 10px">${s.wpm >= best ? 'Record de vitesse ! ' : ''}${advice}</p>
      <button class="btn primary" id="again">${modePref === 'syll' ? 'Série suivante' : 'Texte suivant'}</button></div>`);
    el.querySelector('#again').onclick = setup;
    el.querySelector('#again').focus();
    window.scrollTo(0, 0);
  }

  start0();
  return () => clearInterval(timer);
}
