import { TYPING_TEXTS } from '../content.js';

const norm = s => s.replace(/[«»“”]/g, '"').replace(/[’‘]/g, "'").replace(/œ/g, 'oe').replace(/Œ/g, 'Oe').replace(/[  ]/g, ' ').replace(/…/g, '...');
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

let uiPref = (() => { try { return localStorage.getItem('mesaicosa.kb') !== 'off'; } catch { return true; } })();

export function mount(el, api) {
  const { esc } = api;
  let text, typed, errors, start, timer, finished;

  function pick() {
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
    const h = api.history().filter(s => s.details.acc != null);
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
      <div class="kb-hint muted" id="kb-hint"></div>`;
  }

  function setup() {
    text = pick(); typed = ''; errors = 0; start = 0; finished = false; clearInterval(timer);
    const hist = api.history().slice(-5).reverse();
    el.innerHTML = `
      ${trend()}
      <div class="spread small" style="margin-bottom:10px">
        <span>Vitesse <b class="timer" id="wpm">0</b> mots/min</span>
        <span>Précision <b class="timer" id="acc">100</b> %</span>
        <span>Temps <b class="timer" id="time">0</b> s</span>
      </div>
      <div class="typing-text" id="tt" tabindex="0" aria-label="Texte à recopier. Touche ici puis tape."></div>
      <textarea class="hidden-input" id="in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Zone de frappe"></textarea>
      ${uiPref ? kbHtml() : ''}
      <p class="small muted">Garde les yeux sur l'écran, jamais sur ton clavier : le clavier affiché te montre la touche et le doigt à utiliser. Index posés sur F et J (les touches à repère). Au début, la précision sera basse : c'est normal, elle montera avec la régularité. Les guillemets et « œ » s'écrivent " et oe.</p>
      <div class="row"><button class="btn" id="new">Autre texte</button>
        <label class="row small" style="gap:6px"><input type="checkbox" id="kbt" ${uiPref ? 'checked' : ''}> Clavier à l'écran</label></div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Mots/min</th><th>Précision</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.score}</td><td>${s.details.acc ?? '—'} %</td></tr>`).join('')}</table>` : ''}
    `;
    const tt = el.querySelector('#tt'), inp = el.querySelector('#in');
    const focus = () => inp.focus();
    tt.addEventListener('click', focus); tt.addEventListener('focus', focus);
    inp.addEventListener('input', onInput);
    el.querySelector('#new').onclick = setup;
    el.querySelector('#kbt').onchange = e => { uiPref = e.target.checked; try { localStorage.setItem('mesaicosa.kb', uiPref ? 'on' : 'off'); } catch { } setup(); };
    draw(); setTimeout(focus, 50);
  }

  function showNextKey() {
    const kb = el.querySelector('#kb'); if (!kb) return;
    kb.querySelectorAll('.next,.then').forEach(k => k.classList.remove('next', 'then'));
    const hint = el.querySelector('#kb-hint');
    if (typed.length >= text.length) { hint.textContent = ''; return; }
    // si la frappe précédente est fausse, on montre la touche Retour arrière
    const wrongAt = [...typed].findIndex((c, i) => c !== text[i]);
    if (wrongAt >= 0) { hint.innerHTML = '<span class="feedback-ko">Erreur : efface avec Retour arrière (auriculaire droit)</span>'; return; }
    const ch = text[typed.length];
    const seq = keysFor(ch);
    if (!seq.length) { hint.textContent = `Caractère spécial : ${ch}`; return; }
    const parts = [];
    seq.forEach((s, i) => {
      const cls = i === 0 ? 'next' : 'then';
      if (s.space) { kb.querySelector('[data-space]').classList.add(cls); parts.push('espace (pouce)'); return; }
      kb.querySelector(`[data-k="${CSS.escape(s.k[0])}"]`)?.classList.add(cls);
      if (s.shift) kb.querySelector(`[data-shift="${s.k[2][0] === 'l' ? 'r' : 'l'}"]`)?.classList.add(cls);
      parts.push(`${s.shift ? 'Maj + ' : ''}${s.k[0].toUpperCase()} (${FINGER[s.k[2]]})`);
    });
    hint.textContent = parts.join(' puis ');
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
    api.save(s.wpm, 'mots/min', { acc: s.acc, secs: Math.round(s.secs), chars: text.length, tid: tid(text), kb: uiPref });
    const best = Math.max(...api.history().map(x => x.score));
    const advice = s.acc < 85 ? "Précision encore basse : c'est normal en apprenant à taper sans regarder. Ralentis volontairement et garde les yeux sur l'écran."
      : s.acc < 95 ? 'Bonne progression. Continue à viser la régularité ; la vitesse viendra seule.'
      : 'Très bonne précision : tu peux essayer d\'accélérer un peu.';
    el.insertAdjacentHTML('afterbegin', `<div class="card" style="margin-bottom:14px;border-color:var(--ok)">
      <h3>${s.wpm} mots/min · ${s.acc} % de précision</h3>
      <p class="small muted" style="margin:4px 0 10px">${s.wpm >= best ? 'Record de vitesse ! ' : ''}${advice}</p>
      <button class="btn primary" id="again">Texte suivant</button></div>`);
    el.querySelector('#again').onclick = setup;
    el.querySelector('#again').focus();
    window.scrollTo(0, 0);
  }

  setup();
  return () => clearInterval(timer);
}
