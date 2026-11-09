import { TYPING_TEXTS } from '../content.js';

const norm = s => s.replace(/[«»“”]/g, '"').replace(/[’‘]/g, "'").replace(/œ/g, 'oe').replace(/Œ/g, 'Oe').replace(/[  ]/g, ' ');

export function mount(el, api) {
  const { esc } = api;
  let text, typed, errors, start, timer, finished;
  let lastIdx = -1;

  function pick() {
    const pool = [...TYPING_TEXTS, ...api.S.alive('typingTexts').map(x => x.text)];
    let i; do { i = Math.floor(Math.random() * pool.length); } while (i === lastIdx && pool.length > 1);
    lastIdx = i; return norm(pool[i]);
  }

  function setup() {
    text = pick(); typed = ''; errors = 0; start = 0; finished = false; clearInterval(timer);
    const hist = api.history().slice(-5).reverse();
    el.innerHTML = `
      <div class="spread small" style="margin-bottom:10px">
        <span>Vitesse <b class="timer" id="wpm">0</b> mots/min</span>
        <span>Précision <b class="timer" id="acc">100</b> %</span>
        <span>Temps <b class="timer" id="time">0</b> s</span>
      </div>
      <div class="typing-text" id="tt" tabindex="0" aria-label="Texte à recopier. Touche ici puis tape."></div>
      <textarea class="hidden-input" id="in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Zone de frappe"></textarea>
      <p class="small muted">Touche le texte puis commence à taper : le chronomètre démarre à la première touche. Les guillemets et « œ » s'écrivent " et oe.</p>
      <div class="row"><button class="btn" id="new">Autre texte</button></div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Mots/min</th><th>Précision</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.score}</td><td>${s.details.acc ?? '—'} %</td></tr>`).join('')}</table>` : ''}
    `;
    const tt = el.querySelector('#tt'), inp = el.querySelector('#in');
    const focus = () => inp.focus();
    tt.addEventListener('click', focus); tt.addEventListener('focus', focus);
    inp.addEventListener('input', onInput);
    el.querySelector('#new').onclick = setup;
    draw(); setTimeout(focus, 50);
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
    api.save(s.wpm, 'mots/min', { acc: s.acc, secs: Math.round(s.secs), chars: text.length });
    const best = Math.max(...api.history().map(x => x.score));
    el.insertAdjacentHTML('afterbegin', `<div class="card" style="margin-bottom:14px;border-color:var(--ok)">
      <h3>${s.wpm} mots/min · ${s.acc} % de précision</h3>
      <p class="small muted" style="margin:4px 0 10px">${s.wpm >= best ? 'Nouveau record !' : `Record : ${best} mots/min`} Vise une précision d'au moins 95 % avant de chercher la vitesse.</p>
      <button class="btn primary" id="again">Texte suivant</button></div>`);
    el.querySelector('#again').onclick = setup;
    el.querySelector('#again').focus();
  }

  setup();
  return () => clearInterval(timer);
}
