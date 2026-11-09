const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

const GEN = {
  1: () => pickOne([
    () => { const a = R(10, 89), b = R(2, 9); return [`${a} + ${b}`, a + b]; },
    () => { const a = R(12, 99), b = R(2, 9); return [`${a} − ${b}`, a - b]; },
  ])(),
  2: () => pickOne([
    () => { const a = R(2, 9), b = R(2, 9); return [`${a} × ${b}`, a * b]; },
    () => { const a = R(11, 59), b = R(11, 39); return [`${a} + ${b}`, a + b]; },
  ])(),
  3: () => pickOne([
    () => { const a = R(31, 99), b = R(12, 69); return a > b ? [`${a} − ${b}`, a - b] : [`${a} + ${b}`, a + b]; },
    () => { const a = R(11, 25), b = R(3, 9); return [`${a} × ${b}`, a * b]; },
    () => { const b = R(3, 9), q = R(3, 12); return [`${b * q} ÷ ${b}`, q]; },
  ])(),
  4: () => pickOne([
    () => { const a = R(26, 99), b = R(3, 9); return [`${a} × ${b}`, a * b]; },
    () => { const p = pickOne([10, 20, 25, 50]), n = R(2, 40) * (p === 25 ? 4 : 10); return [`${p} % de ${n}`, n * p / 100]; },
    () => { const b = R(6, 15), q = R(6, 15); return [`${b * q} ÷ ${b}`, q]; },
  ])(),
  5: () => pickOne([
    () => { const a = R(11, 29), b = R(11, 19); return [`${a} × ${b}`, a * b]; },
    () => { const a = R(11, 25); return [`${a}²`, a * a]; },
    () => { const p = pickOne([5, 15, 30, 75]), n = R(2, 30) * 20; return [`${p} % de ${n}`, n * p / 100]; },
    () => { const a = R(120, 899), b = R(45, 399); return [`${a} + ${b}`, a + b]; },
  ])(),
  6: () => pickOne([
    () => { const a = R(21, 99), b = R(21, 99); return [`${a} × ${b}`, a * b]; },
    () => { const a = R(400, 999), b = R(120, 399); return [`${a} − ${b}`, a - b]; },
    () => { const p = R(2, 19) * 5, n = R(2, 40) * 20; return [`${p} % de ${n}`, n * p / 100]; },
    () => { const b = R(12, 25), q = R(12, 40); return [`${b * q} ÷ ${b}`, q]; },
  ])(),
};
const DURATION = 60;

export function mount(el, api) {
  const { esc } = api;
  let level, timer, q, ans, ok, ko, pts, t0, running = false;

  function startLevel() {
    const h = api.history();
    return h.length ? (h[h.length - 1].details.next || 1) : 1;
  }

  function intro() {
    level = startLevel();
    const hist = api.history().slice(-5).reverse();
    el.innerHTML = `
      <div class="card" style="text-align:center">
        <p style="margin-top:0">${DURATION} secondes pour enchaîner un maximum de calculs. La bonne réponse passe automatiquement à la suivante.</p>
        <div class="row" style="justify-content:center;margin-bottom:12px">
          <label class="small muted" for="lvl">Niveau</label>
          <select id="lvl" style="width:auto">${[1, 2, 3, 4, 5, 6].map(n => `<option ${n === level ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </div>
        <button class="btn primary" id="go">Commencer</button>
        <p class="tiny muted">Niveaux : 1 additions simples · 2 tables · 3 opérations à deux chiffres · 4 pourcentages faciles · 5 carrés et produits · 6 expert. Le niveau s'ajuste à tes résultats.</p>
      </div>
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Points</th><th>Justes</th><th>Niveau</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.score}</td><td>${s.details.ok}/${s.details.ok + s.details.ko}</td><td>${s.details.level}</td></tr>`).join('')}</table>` : ''}`;
    el.querySelector('#go').onclick = () => { level = Number(el.querySelector('#lvl').value); run(); };
  }

  function nextQ() {
    const lv = Math.random() < 0.7 || level === 1 ? level : R(1, level - 1);
    [q, ans] = GEN[lv]();
    el.querySelector('#q').textContent = q;
    const inp = el.querySelector('#a'); inp.value = ''; inp.focus();
  }

  function run() {
    ok = 0; ko = 0; pts = 0; t0 = Date.now(); running = true;
    el.innerHTML = `
      <div class="spread"><span class="small">Niveau ${level}</span><span class="timer" id="t">${DURATION}</span><span class="small"><b id="ok">0</b> juste(s)</span></div>
      <div class="big-q" id="q" aria-live="polite"></div>
      <input class="big-in" id="a" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Ta réponse">
      <div id="fb" class="small" style="text-align:center;min-height:22px;margin-top:6px"></div>
      <div class="row" style="justify-content:center;margin-top:8px"><button class="btn" id="skip">Passer</button></div>`;
    const inp = el.querySelector('#a'), fb = el.querySelector('#fb');
    inp.addEventListener('input', () => {
      if (inp.value.trim() !== '' && Number(inp.value.replace(',', '.')) === ans) {
        ok++; pts += level; el.querySelector('#ok').textContent = ok; fb.innerHTML = ''; nextQ();
      }
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && inp.value.trim() !== '') { ko++; fb.innerHTML = `<span class="feedback-ko">${esc(q)} = ${ans}</span>`; nextQ(); }
    });
    el.querySelector('#skip').onclick = () => { ko++; fb.innerHTML = `<span class="feedback-ko">${esc(q)} = ${ans}</span>`; nextQ(); };
    timer = setInterval(() => {
      const left = DURATION - Math.floor((Date.now() - t0) / 1000);
      const t = el.querySelector('#t'); if (t) t.textContent = Math.max(0, left);
      if (left <= 0) end();
    }, 250);
    nextQ();
  }

  function end() {
    clearInterval(timer); running = false;
    const total = ok + ko, acc = total ? ok / total : 0;
    let next = level;
    if (ok >= 18 && acc >= 0.9) next = Math.min(6, level + 1);
    else if (ok < 8) next = Math.max(1, level - 1);
    api.save(pts, 'points', { ok, ko, level, next });
    el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)">
      <h3>${ok} calcul${ok > 1 ? 's' : ''} juste${ok > 1 ? 's' : ''} · ${pts} points</h3>
      <p class="small muted">${ko} erreur(s) ou passé(s). ${next > level ? `Bravo, prochaine séance au niveau ${next}.` : next < level ? `Prochaine séance au niveau ${next} pour consolider.` : `Tu restes au niveau ${level}.`}</p>
      <button class="btn primary" id="again">Rejouer</button> <a class="btn" href="#gymnase">Retour</a></div>`;
    el.querySelector('#again').onclick = intro;
  }

  intro();
  return () => { clearInterval(timer); };
}
