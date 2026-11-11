// Écran de révision (répétition espacée), partagé par les modules Révisions, Finance et Bible.
import { allDecks, buildQueue, deckStats, cfg, schedule, previewLabel, studyDay } from '../srs.js';

const GRADES = [[0, 'À revoir', 'ko'], [1, 'Difficile', ''], [2, 'Bien', ''], [3, 'Facile', 'ok']];
// Indice : seulement la première lettre de chaque mot, ponctuation conservée
const firstLetters = t => t.replace(/([A-Za-zÀ-ÖØ-öø-ÿ])[A-Za-zÀ-ÖØ-öø-ÿ'’-]*/g, '$1');

export function mountSrs(el, api, opts = {}) {
  const { esc, S, toast } = api;
  const only = opts.only || null;   // ex. ['finance']
  let decks = [], keyHandler = null;

  const visible = () => decks.filter(d => (!only || only.includes(d.id)) && d.cards.length);

  async function intro() {
    decks = await allDecks(S);
    const today = studyDay();
    const rows = visible().map(d => {
      const st = deckStats(S, d, today), c = cfg(S, d);
      return `<div class="card" style="display:grid;gap:8px">
        <div class="spread"><label class="row" style="gap:8px;font-weight:500"><input type="checkbox" data-on="${esc(d.id)}" ${c.on ? 'checked' : ''}> ${esc(d.name)}</label>
          <span class="small muted">${st.mastered} / ${st.total} maîtrisées</span></div>
        <div class="row small"><span class="pill accent">${st.due} à revoir</span><span class="pill">${st.newToday} nouvelle${st.newToday > 1 ? 's' : ''} aujourd'hui</span>
          <span class="muted">${st.fresh} jamais vue${st.fresh > 1 ? 's' : ''}</span></div>
        <div class="progress"><span style="width:${st.total ? Math.round(100 * st.mastered / st.total) : 0}%;background:var(--ok)"></span></div>
        <label class="row small muted" style="gap:6px">Nouvelles cartes par jour
          <select data-per="${esc(d.id)}" style="width:auto;min-height:32px;padding:4px 8px">${[0, 1, 2, 3, 5, 8, 10, 15, 20, 30].map(n => `<option ${n === c.perDay ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>`;
    }).join('');
    const q = buildQueue(S, visible(), 500, today);
    const mine = S.alive('cards').filter(c => !only || only.includes(c.deck || 'mine'));
    const hist = api.history().slice(-5).reverse();
    el.innerHTML = `
      <div class="card suggest" style="margin-bottom:12px;text-align:center">
        ${q.length ? `<div class="small muted">Aujourd'hui</div><div style="font-size:28px;font-weight:600">${q.length} carte${q.length > 1 ? 's' : ''}</div>
          <button class="btn primary" id="go" style="margin-top:6px">Réviser</button>`
          : `<div style="font-weight:500">Rien à réviser pour l'instant.</div><div class="small muted">Reviens demain, ou augmente le nombre de nouvelles cartes par jour.</div>`}
      </div>
      <div style="display:grid;gap:10px">${rows}</div>
      <p class="tiny muted">Le principe : chaque carte revient juste avant que tu l'oublies. Réponds honnêtement : « À revoir » la remontre dans quelques minutes, « Facile » l'espace beaucoup plus.</p>
      <h2>Ajouter une carte</h2>
      <form class="card" id="add" style="display:grid;gap:8px">
        <input type="text" name="front" placeholder="Question ou recto (ex. Duration d'une obligation zéro-coupon ?)" aria-label="Recto">
        <textarea name="back" placeholder="Réponse ou verso" aria-label="Verso" style="min-height:70px"></textarea>
        <label class="small muted">Paquet <select name="deck" style="width:auto">${(only || ['mine', 'finance', 'bible']).map(id => `<option value="${id}">${esc((decks.find(d => d.id === id) || { name: id }).name)}</option>`).join('')}</select></label>
        <div class="small feedback-ko" id="add-err"></div>
        <div><button class="btn" type="submit">Ajouter</button></div>
      </form>
      ${mine.length ? `<details class="card" style="margin-top:10px"><summary>Mes cartes (${mine.length})</summary>
        <div style="margin-top:8px">${mine.map(c => `<div class="obj"><div class="t"><b>${esc(c.front)}</b><div class="small muted">${esc(c.back)}</div></div>
          <button class="btn ghost small" data-del="${esc(c.id)}" aria-label="Supprimer la carte">✕</button></div>`).join('')}</div></details>` : ''}
      ${hist.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Cartes</th><th>Réussies du premier coup</th></tr>
        ${hist.map(s => `<tr><td>${esc(s.date)}</td><td>${s.details.n}</td><td>${s.score} %</td></tr>`).join('')}</table>` : ''}`;
    el.querySelector('#go')?.addEventListener('click', () => run(q));
    el.querySelectorAll('[data-on]').forEach(b => b.onchange = () => {
      const d = decks.find(x => x.id === b.dataset.on); S.setMap('srsCfg', d.id, { ...cfg(S, d), on: b.checked }); intro();
    });
    el.querySelectorAll('[data-per]').forEach(b => b.onchange = () => {
      const d = decks.find(x => x.id === b.dataset.per); S.setMap('srsCfg', d.id, { ...cfg(S, d), perDay: Number(b.value) }); intro();
    });
    const f = el.querySelector('#add');
    f.addEventListener('input', () => { f.querySelector('#add-err').textContent = ''; });
    f.onsubmit = e => {
      e.preventDefault();
      const front = f.front.value.trim(), back = f.back.value.trim();
      if (!front || !back) { f.querySelector('#add-err').textContent = 'Remplis le recto et le verso.'; return; }
      S.upsert('cards', { id: 'u-' + S.uid(), deck: f.deck.value, front, back });
      toast('Carte ajoutée'); intro();
    };
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const c = S.get().cards.find(x => x.id === b.dataset.del); S.upsert('cards', { ...c, deleted: true }); toast('Carte supprimée'); intro();
    });
  }

  function run(queue) {
    const today = studyDay();
    let i = 0, shown = false, hint = false, n = 0, firstOk = 0, again = 0;
    const seen = new Set(), failed = new Set();
    const q = queue.slice();

    const draw = () => {
      if (i >= q.length) return end();
      const { c, d } = q[i];
      const prev = S.getMap('srs', c.id, null);
      const isNew = !prev;
      el.innerHTML = `
        <div class="spread small" style="margin-bottom:8px"><span>${q.length - i} restante${q.length - i > 1 ? 's' : ''}</span>
          <span class="muted">${esc(d.name)}${isNew ? ' · nouvelle' : ''}</span><button class="btn small ghost" id="stop">Terminer</button></div>
        <div class="progress" style="margin-bottom:12px"><span style="width:${Math.round(100 * i / q.length)}%"></span></div>
        <div class="card" id="flash" style="min-height:220px;display:grid;align-content:center;gap:12px;text-align:center;cursor:pointer">
          ${c.hint ? `<div class="tiny muted">${esc(c.hint)}</div>` : ''}
          <div style="font-size:${c.front.length > 80 ? 18 : 22}px;font-weight:600;line-height:1.4">${esc(c.front)}</div>
          ${d.verse && hint && !shown ? `<div style="font-size:18px;letter-spacing:.12em;line-height:1.7;color:var(--muted)">${esc(firstLetters(c.back))}</div>` : ''}
          ${shown ? `<hr style="border:none;border-top:1px solid var(--line);width:100%;margin:4px 0"><div style="font-size:${c.back.length > 140 ? 16 : 19}px;line-height:1.6;white-space:pre-wrap">${esc(c.back)}</div>` : ''}
        </div>
        ${shown ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">${GRADES.map(([g, l, cls]) =>
          `<button class="btn choice ${cls}" data-g="${g}" style="flex-direction:column;justify-content:center;text-align:center;padding:8px 4px"><span>${l}</span><span class="tiny muted">${previewLabel(prev, g)}</span></button>`).join('')}</div>
          <p class="tiny muted" style="text-align:center">Clavier : 1, 2, 3, 4</p>`
        : `<div class="row" style="justify-content:center;margin-top:12px">${d.verse && !hint ? '<button class="btn" id="hint">Indice : premières lettres</button>' : ''}<button class="btn primary" id="show">Afficher la réponse</button></div>
          <p class="tiny muted" style="text-align:center">Récite ou réponds de tête, puis vérifie. Clavier : Espace.</p>`}`;
      el.querySelector('#stop').onclick = end;
      el.querySelector('#hint')?.addEventListener('click', e => { e.stopPropagation(); hint = true; draw(); });
      const reveal = () => { if (!shown) { shown = true; draw(); } };
      el.querySelector('#show')?.addEventListener('click', reveal);
      el.querySelector('#flash').onclick = reveal;
      el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => grade(Number(b.dataset.g)));
    };

    const grade = g => {
      const { c } = q[i];
      const prev = S.getMap('srs', c.id, null);
      S.setMap('srs', c.id, schedule(prev, g, today));
      if (!seen.has(c.id)) { seen.add(c.id); n++; if (g >= 1) firstOk++; }
      if (g === 0) { again++; failed.add(c.id); q.splice(Math.min(q.length, i + 5), 0, q[i]); }
      i++; shown = false; hint = false; draw();
    };

    const end = () => {
      document.removeEventListener('keydown', keyHandler); keyHandler = null;
      if (n > 0) api.save(Math.round(100 * firstOk / n), '%', { n, again, decks: [...new Set(q.map(x => x.d.id))] });
      el.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)">
        <h3>${n ? `${n} carte${n > 1 ? 's' : ''} révisée${n > 1 ? 's' : ''}` : 'Séance terminée'}</h3>
        ${n ? `<p class="small muted">${Math.round(100 * firstOk / n)} % réussies du premier coup${again ? ` · ${failed.size} à retravailler` : ''}.</p>` : ''}
        <button class="btn primary" id="back">Retour aux paquets</button></div>`;
      el.querySelector('#back').onclick = intro;
    };

    keyHandler = e => {
      if (!el.isConnected) return;
      if (e.target.matches?.('input,textarea,select')) return;
      if (!shown && (e.code === 'Space' || e.key === 'Enter')) { e.preventDefault(); shown = true; draw(); }
      else if (shown && ['1', '2', '3', '4'].includes(e.key)) grade(Number(e.key) - 1);
    };
    document.addEventListener('keydown', keyHandler);
    draw();
  }

  intro();
  return () => { if (keyHandler) document.removeEventListener('keydown', keyHandler); };
}
