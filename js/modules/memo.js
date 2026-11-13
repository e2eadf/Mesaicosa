// Par cœur : apprendre des poèmes et des textes, strophe par strophe, puis les réciter en répétition espacée.
// Les textes viennent de Wikisource (recherche faite par l'app depuis l'appareil) ou sont collés par l'utilisateur.
import { schedule, previewLabel, studyDay } from '../srs.js';

const WS = 'https://fr.wikisource.org/w/api.php';
const SUGGESTIONS = [
  ['Demain, dès l’aube', 'Victor Hugo'], ['L’Albatros', 'Charles Baudelaire'], ['Chanson d’automne', 'Paul Verlaine'],
  ['Le Dormeur du val', 'Arthur Rimbaud'], ['La Cigale et la Fourmi', 'Jean de La Fontaine'], ['Le Corbeau et le Renard', 'Jean de La Fontaine'],
  ['Heureux qui, comme Ulysse', 'Joachim du Bellay'], ['Mignonne, allons voir si la rose', 'Pierre de Ronsard'], ['Le Pont Mirabeau', 'Guillaume Apollinaire'],
  ['Les Conquérants', 'José-Maria de Heredia'], ['Le Lac', 'Alphonse de Lamartine'], ['Le Loup et l’Agneau', 'Jean de La Fontaine'],
];
const GRADES = [[0, 'À revoir', 'ko'], [1, 'Difficile', ''], [2, 'Bien', ''], [3, 'Facile', 'ok']];
const LEVELS = ['Texte complet', 'Quelques mots cachés', 'Un mot sur deux caché', 'Premières lettres', 'Tout caché'];

const sid = (p, i) => `poem:${p.id}:${i}`;
function speak(text) { try { const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { } }
const hashN = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

// --- extraction du texte d'une page Wikisource (HTML → strophes)
export function parseWikisource(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('.mw-editsection, sup, .reference, .references, .mw-references-wrap, .noprint, .ws-noexport, .headertemplate, .ws-header, table, style, script, .ws-summary, .mw-heading, h1, h2, h3, h4, .pagenum, .ws-pagenum').forEach(n => n.remove());
  // <br> = fin de vers, fin de <p>/<div> = fin de strophe ; les retours à la ligne du HTML lui-même sont ignorés
  const BR = '\u0001', PAR = '\u0002';
  const toText = node => {
    node.querySelectorAll('br').forEach(br => br.replaceWith(BR));
    node.querySelectorAll('p, div').forEach(p => { p.append(PAR); });
    return node.textContent + PAR;
  };
  const poems = [...doc.querySelectorAll('.poem')];
  const raw = (poems.length ? poems.map(toText).join(PAR) : toText(doc.querySelector('.mw-parser-output') || doc.body))
    .replace(/\s+/g, ' ')
    .replace(/\u0001\s*(?:\u0001\s*)+/g, PAR);   // ligne vide (deux <br> de suite) = changement de strophe
  const stanzas = raw.split(PAR)
    .map(b => b.split(BR).map(l => l.trim()).filter(l => l && !/^\d+$/.test(l)))
    .filter(s => s.length);
  // découpe les blocs trop longs (fables d'un seul tenant) en morceaux de 4 vers environ
  const out = [];
  for (const s of stanzas) {
    if (s.length <= 8) { out.push(s); continue; }
    const n = Math.ceil(s.length / 4), size = Math.ceil(s.length / n);
    for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  }
  return out;
}
export function parsePasted(text) {
  return text.replace(/\r/g, '').split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(s => s.length);
}

export function mount(el, api) {
  const { esc, S, toast } = api;
  let current = null, tab = 'apprendre', cleanupKeys = null;
  const poems = () => S.alive('poems');
  const today = () => studyDay();
  const learned = (p, i) => !!S.getMap('srs', sid(p, i), null);
  const due = (p, i) => { const s = S.getMap('srs', sid(p, i), null); return s && s.due <= today(); };
  const dueIdx = p => p.stanzas.map((_, i) => i).filter(i => due(p, i));

  // ---------------------------------------------------------------- Bibliothèque
  function library() {
    current = null;
    const list = poems();
    const dueList = list.map(p => ({ p, d: dueIdx(p) })).filter(x => x.d.length);
    el.innerHTML = `
      ${dueList.length ? `<div class="card suggest" style="margin-bottom:12px"><div class="small muted">À réciter aujourd'hui</div>
        ${dueList.map(x => `<div class="spread" style="margin-top:8px"><span><b>${esc(x.p.title)}</b> <span class="small muted">· ${x.d.length} strophe${x.d.length > 1 ? 's' : ''}</span></span>
          <button class="btn small primary" data-due="${esc(x.p.id)}">Réciter</button></div>`).join('')}</div>` : ''}
      <h2 style="margin-top:0">Mes textes</h2>
      ${list.length ? `<div style="display:grid;gap:10px">${list.map(p => {
        const n = p.stanzas.length, l = p.stanzas.filter((_, i) => learned(p, i)).length;
        return `<button class="card" data-open="${esc(p.id)}" style="text-align:left;cursor:pointer;display:grid;gap:6px">
          <div class="spread"><b>${esc(p.title)}</b><span class="small muted">${l} / ${n} strophe${n > 1 ? 's' : ''}</span></div>
          ${p.author ? `<div class="small muted">${esc(p.author)}</div>` : ''}
          <div class="progress"><span style="width:${Math.round(100 * l / n)}%;background:var(--ok)"></span></div></button>`;
      }).join('')}</div>` : '<p class="small muted">Aucun texte pour l\'instant. Cherche un poème sur Wikisource ou colle un texte ci-dessous.</p>'}
      <h2>Ajouter un texte</h2>
      <div class="card" style="display:grid;gap:10px">
        <div class="seg" role="group" aria-label="Source"><button data-src="ws" aria-pressed="true">Chercher sur Wikisource</button><button data-src="paste" aria-pressed="false">Coller un texte</button></div>
        <div id="src-ws">
          <form id="ws-form" class="row" style="flex-wrap:nowrap"><input type="text" name="q" placeholder="Titre ou premier vers, auteur" aria-label="Recherche Wikisource"><button class="btn primary" type="submit">Chercher</button></form>
          <div class="row" style="gap:6px;margin-top:8px">${SUGGESTIONS.map(([t, a]) => `<button class="pill" data-sug="${esc(t + ' ' + a)}" style="border:none;cursor:pointer">${esc(t)} · <span class="muted">${esc(a.split(' ').pop())}</span></button>`).join('')}</div>
          <div id="ws-res" style="margin-top:10px"></div>
          <p class="tiny muted" style="margin-bottom:0">Wikisource est une bibliothèque libre : les textes anciens y sont dans le domaine public. Une connexion internet est nécessaire pour la recherche ; ensuite, le texte est enregistré dans l'appareil.</p>
        </div>
        <form id="src-paste" style="display:none;gap:8px">
          <input type="text" name="title" placeholder="Titre" aria-label="Titre">
          <input type="text" name="author" placeholder="Auteur (facultatif)" aria-label="Auteur">
          <textarea name="text" placeholder="Colle le texte ici. Laisse une ligne vide entre deux strophes." style="min-height:160px" aria-label="Texte"></textarea>
          <div class="small feedback-ko" id="paste-err"></div>
          <div><button class="btn primary" type="submit">Ajouter</button></div>
        </form>
      </div>
      ${histHtml()}`;
    el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openPoem(b.dataset.open, 'apprendre'));
    el.querySelectorAll('[data-due]').forEach(b => b.onclick = () => openPoem(b.dataset.due, 'reciter', true));
    el.querySelectorAll('[data-src]').forEach(b => b.onclick = () => {
      el.querySelectorAll('[data-src]').forEach(x => x.setAttribute('aria-pressed', x === b));
      el.querySelector('#src-ws').style.display = b.dataset.src === 'ws' ? '' : 'none';
      el.querySelector('#src-paste').style.display = b.dataset.src === 'paste' ? 'grid' : 'none';
    });
    const wf = el.querySelector('#ws-form');
    wf.onsubmit = e => { e.preventDefault(); if (wf.q.value.trim()) search(wf.q.value.trim()); };
    el.querySelectorAll('[data-sug]').forEach(b => b.onclick = () => { wf.q.value = b.dataset.sug; search(b.dataset.sug); });
    const pf = el.querySelector('#src-paste');
    pf.addEventListener('input', () => { pf.querySelector('#paste-err').textContent = ''; });
    pf.onsubmit = e => {
      e.preventDefault();
      const stanzas = parsePasted(pf.text.value);
      if (!pf.title.value.trim()) { pf.querySelector('#paste-err').textContent = 'Donne un titre au texte.'; return; }
      if (!stanzas.length) { pf.querySelector('#paste-err').textContent = 'Colle d\'abord le texte.'; return; }
      const p = S.upsert('poems', { id: 'pm-' + S.uid(), title: pf.title.value.trim(), author: pf.author.value.trim(), source: 'Texte ajouté', stanzas });
      toast('Texte ajouté'); openPoem(p.id, 'lire');
    };
  }

  function histHtml() {
    const h = api.history().slice(-5).reverse();
    return h.length ? `<h2>Dernières séances</h2><table class="hist"><tr><th>Date</th><th>Texte</th><th>Strophes</th><th>Réussite</th></tr>
      ${h.map(s => `<tr><td>${esc(s.date)}</td><td>${esc(s.details.title || '')}</td><td>${s.details.n}</td><td>${s.score} %</td></tr>`).join('')}</table>` : '';
  }

  // ---------------------------------------------------------------- Wikisource
  async function search(q) {
    const res = el.querySelector('#ws-res');
    res.innerHTML = '<p class="small muted">Recherche sur Wikisource…</p>';
    try {
      const url = `${WS}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=0&srlimit=10&srprop=&format=json&origin=*`;
      const d = await fetch(url).then(r => r.json());
      const items = d.query?.search || [];
      if (!items.length) { res.innerHTML = '<p class="small muted">Aucun résultat. Essaie avec le premier vers ou le nom de l\'auteur.</p>'; return; }
      res.innerHTML = `<div class="small muted" style="margin-bottom:6px">Choisis la bonne page :</div><div style="display:grid;gap:6px">${items.map(it =>
        `<button class="btn choice" data-page="${esc(it.title)}" style="text-align:left">${esc(it.title.replace(/\//g, ' › '))}</button>`).join('')}</div>`;
      res.querySelectorAll('[data-page]').forEach(b => b.onclick = () => preview(b.dataset.page));
    } catch {
      res.innerHTML = '<p class="small feedback-ko">Wikisource est injoignable (pas de réseau ?). Réessaie avec une connexion.</p>';
    }
  }

  async function preview(page) {
    const res = el.querySelector('#ws-res');
    res.innerHTML = '<p class="small muted">Chargement du texte…</p>';
    try {
      const url = `${WS}?action=parse&page=${encodeURIComponent(page)}&prop=text&redirects=1&format=json&formatversion=2&origin=*`;
      const d = await fetch(url).then(r => r.json());
      if (d.error) throw new Error(d.error.info);
      const stanzas = parseWikisource(d.parse.text);
      const lines = stanzas.reduce((a, s) => a + s.length, 0);
      if (!stanzas.length || lines < 2) { res.innerHTML = '<p class="small feedback-ko">Cette page ne contient pas de texte exploitable (c\'est sans doute un sommaire de recueil). Choisis un autre résultat.</p>'; return; }
      const parts = d.parse.title.split('/');
      res.innerHTML = `<form class="card" id="ws-add" style="display:grid;gap:8px;border-color:var(--accent)">
        <div class="small muted">${stanzas.length} strophe${stanzas.length > 1 ? 's' : ''} · ${lines} vers · source : Wikisource</div>
        <div style="font-style:italic;line-height:1.6">${stanzas[0].slice(0, 2).map(esc).join('<br>')}${stanzas[0].length > 2 || stanzas.length > 1 ? '<br>…' : ''}</div>
        ${lines > 120 ? '<p class="small feedback-ko" style="margin:0">Texte très long : tu pourras supprimer les strophes inutiles après l\'ajout.</p>' : ''}
        <input type="text" name="title" value="${esc(parts[parts.length - 1])}" aria-label="Titre">
        <input type="text" name="author" placeholder="Auteur" aria-label="Auteur" value="${esc(guessAuthor(el.querySelector('#ws-form').q.value))}">
        <div class="row"><button class="btn primary" type="submit">Ajouter à mes textes</button><button class="btn ghost" type="button" id="ws-cancel">Annuler</button></div></form>`;
      res.querySelector('#ws-cancel').onclick = () => { res.innerHTML = ''; };
      res.querySelector('#ws-add').onsubmit = e => {
        e.preventDefault(); const f = e.target;
        const p = S.upsert('poems', { id: 'pm-' + S.uid(), title: f.title.value.trim() || parts[parts.length - 1], author: f.author.value.trim(), source: `Wikisource : ${d.parse.title}`, stanzas });
        toast('Texte ajouté'); openPoem(p.id, 'lire');
      };
    } catch {
      res.innerHTML = '<p class="small feedback-ko">Impossible de charger cette page. Réessaie, ou choisis un autre résultat.</p>';
    }
  }
  const guessAuthor = q => { const s = SUGGESTIONS.find(([t, a]) => q === t + ' ' + a); return s ? s[1] : ''; };

  // ---------------------------------------------------------------- Un texte
  function openPoem(id, t, dueOnly = false) {
    current = poems().find(p => p.id === id); if (!current) return library();
    tab = t; renderPoem(dueOnly);
  }

  function renderPoem(dueOnly = false) {
    if (cleanupKeys) { cleanupKeys(); cleanupKeys = null; }
    const p = current;
    const n = p.stanzas.length, l = p.stanzas.filter((_, i) => learned(p, i)).length;
    el.innerHTML = `
      <div class="spread" style="margin-bottom:6px"><button class="btn small" id="lib">‹ Mes textes</button>
        <span class="small muted">${l} / ${n} strophe${n > 1 ? 's' : ''} apprise${l > 1 ? 's' : ''}</span></div>
      <h2 style="margin:6px 0 2px">${esc(p.title)}</h2>
      <div class="small muted" style="margin-bottom:10px">${esc(p.author || '')}${p.author && p.source ? ' · ' : ''}${esc(p.source || '')}</div>
      <div class="seg" role="group" aria-label="Étape" style="margin-bottom:12px">
        ${[['lire', 'Lire et écouter'], ['apprendre', 'Apprendre'], ['reciter', 'Réciter']].map(([k, lb]) => `<button data-tab="${k}" aria-pressed="${tab === k}">${lb}</button>`).join('')}</div>
      <div id="pane"></div>`;
    el.querySelector('#lib').onclick = () => { try { speechSynthesis.cancel(); } catch { } library(); };
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; renderPoem(); });
    const pane = el.querySelector('#pane');
    if (tab === 'lire') paneRead(pane);
    else if (tab === 'apprendre') paneLearn(pane);
    else paneRecite(pane, dueOnly);
  }

  function paneRead(pane) {
    const p = current;
    pane.innerHTML = `<div class="row" style="margin-bottom:10px"><button class="btn" id="say-all">🔊 Écouter tout</button><button class="btn ghost" id="say-stop">Arrêter</button></div>
      ${p.stanzas.map((s, i) => `<div class="card" style="margin-bottom:8px;display:grid;grid-template-columns:1fr auto;gap:8px">
        <div style="line-height:1.7">${s.map(esc).join('<br>')}</div>
        <div style="display:grid;gap:6px;align-content:start"><button class="btn small" data-say="${i}" aria-label="Écouter la strophe ${i + 1}">🔊</button>
          <button class="btn small ghost" data-rm="${i}" aria-label="Supprimer la strophe ${i + 1}">✕</button></div></div>`).join('')}
      <details class="card"><summary class="small">Supprimer ce texte</summary>
        <p class="small">Le texte et ta progression sur ce texte seront supprimés.</p><button class="btn small" id="del-poem" style="border-color:var(--ko);color:var(--ko)">Supprimer</button></details>`;
    pane.querySelector('#say-all').onclick = () => speak(p.stanzas.map(s => s.join('\n')).join('\n\n'));
    pane.querySelector('#say-stop').onclick = () => { try { speechSynthesis.cancel(); } catch { } };
    pane.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(p.stanzas[+b.dataset.say].join('\n')));
    pane.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      if (p.stanzas.length <= 1) { toast('Un texte doit garder au moins une strophe'); return; }
      const stanzas = p.stanzas.filter((_, i) => i !== +b.dataset.rm);
      current = S.upsert('poems', { ...p, stanzas }); toast('Strophe supprimée'); renderPoem();
    });
    pane.querySelector('#del-poem').onclick = () => { S.upsert('poems', { ...p, deleted: true }); toast('Texte supprimé'); library(); };
  }

  // Masquage progressif : 0 tout visible … 4 tout caché ; toucher un mot caché le montre
  function masked(lines, level, key) {
    let w = 0;
    return lines.map(line => line.replace(/[A-Za-zÀ-ÖØ-öø-ÿœŒ'’-]+/g, word => {
      const i = w++;
      const hide = level >= 3 || (level === 1 && hashN(key + i) % 4 === 0) || (level === 2 && hashN(key + i) % 2 === 0);
      if (!hide) return esc(word);
      const shown = level === 3 ? esc(word[0]) + '<span class="mask-rest">' + '_'.repeat(Math.max(1, word.length - 1)) + '</span>' : '<span class="mask-rest">' + '_'.repeat(word.length) + '</span>';
      return `<span class="mask" data-w="${esc(word)}" tabindex="0">${shown}</span>`;
    })).join('<br>');
  }

  function paneLearn(pane) {
    const p = current;
    let i = p.stanzas.findIndex((_, k) => !learned(p, k));
    if (i < 0) i = 0;
    const draw = () => {
      const level = S.getMap('memoLvl', sid(p, i), 0);
      pane.innerHTML = `
        <div class="row" style="gap:6px;margin-bottom:10px">${p.stanzas.map((_, k) => `<button class="pill" data-st="${k}" style="border:none;cursor:pointer;${k === i ? 'background:var(--accent);color:#fff' : ''}">${learned(p, k) ? '✓ ' : ''}${k + 1}</button>`).join('')}</div>
        <div class="card" style="font-size:19px;line-height:1.9;min-height:140px">${masked(p.stanzas[i], level, sid(p, i))}</div>
        <div class="small muted" style="margin:8px 0">Niveau : <b>${LEVELS[level]}</b>. Lis la strophe à voix haute en complétant les mots cachés ; touche un mot caché pour le voir.</div>
        <div class="row">
          <button class="btn" id="lv-down" ${level === 0 ? 'disabled' : ''}>− Moins caché</button>
          ${level < 4 ? '<button class="btn primary" id="lv-up">Plus caché +</button>' : '<button class="btn primary" id="known">✓ Je la récite sans erreur</button>'}
          <button class="btn ghost" id="say">🔊</button></div>
        <p class="tiny muted">Méthode : relis la strophe en masquant de plus en plus de mots, jusqu'à pouvoir la dire de mémoire. Ensuite, elle revient en récitation les jours suivants, de plus en plus espacés.</p>`;
      pane.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { i = +b.dataset.st; draw(); });
      pane.querySelectorAll('.mask').forEach(m => m.onclick = () => { m.innerHTML = esc(m.dataset.w); m.classList.add('peek'); });
      pane.querySelector('#lv-down').onclick = () => { S.setMap('memoLvl', sid(p, i), Math.max(0, level - 1)); draw(); };
      pane.querySelector('#lv-up')?.addEventListener('click', () => { S.setMap('memoLvl', sid(p, i), Math.min(4, level + 1)); draw(); });
      pane.querySelector('#say').onclick = () => speak(p.stanzas[i].join('\n'));
      pane.querySelector('#known')?.addEventListener('click', () => {
        if (!learned(p, i)) S.setMap('srs', sid(p, i), schedule(null, 2, today()));
        api.save(100, '%', { title: p.title, poem: p.id, n: 1, mode: 'apprendre' });
        const nextI = p.stanzas.findIndex((_, k) => !learned(p, k));
        if (nextI < 0) { toast('Texte entièrement appris ! Récite-le maintenant en entier.'); tab = 'reciter'; renderPoem(); return; }
        toast(`Strophe ${i + 1} apprise`); i = nextI; draw();
      });
    };
    draw();
  }

  // Récitation : chaque vers apparaît à la demande, puis on note la strophe (répétition espacée)
  function paneRecite(pane, dueOnly) {
    const p = current;
    let order = dueOnly ? dueIdx(p) : p.stanzas.map((_, k) => k).filter(k => learned(p, k));
    if (!order.length) {
      pane.innerHTML = '<div class="empty">Aucune strophe apprise pour l\'instant. Commence par l\'onglet « Apprendre ».</div>';
      return;
    }
    let pos = 0, shown = 0, n = 0, good = 0;
    const draw = () => {
      if (pos >= order.length) return finish();
      const i = order[pos], st = p.stanzas[i], full = shown >= st.length;
      const prev = S.getMap('srs', sid(p, i), null);
      pane.innerHTML = `
        <div class="spread small" style="margin-bottom:8px"><span>Strophe ${i + 1} · ${pos + 1} / ${order.length}</span><button class="btn small ghost" id="stop">Terminer</button></div>
        <div class="card" style="font-size:19px;line-height:1.9;min-height:140px">
          ${st.map((line, k) => k < shown ? esc(line) : `<span class="muted">${'·'.repeat(Math.min(24, Math.max(6, Math.round(line.length / 2))))}</span>`).join('<br>')}</div>
        ${full ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">${GRADES.map(([g, lb, cls]) =>
            `<button class="btn choice ${cls}" data-g="${g}" style="flex-direction:column;justify-content:center;text-align:center;padding:8px 4px"><span>${lb}</span><span class="tiny muted">${previewLabel(prev, g)}</span></button>`).join('')}</div>
            <p class="tiny muted" style="text-align:center">Note honnêtement : « Bien » si tu as tout récité, avec au plus une hésitation.</p>`
          : `<div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="line">Vers suivant</button><button class="btn" id="all">Toute la strophe</button></div>
            <p class="tiny muted" style="text-align:center">Récite le vers de tête, puis affiche-le pour vérifier. Clavier : Espace.</p>`}`;
      pane.querySelector('#stop').onclick = finish;
      pane.querySelector('#line')?.addEventListener('click', () => { shown++; draw(); });
      pane.querySelector('#all')?.addEventListener('click', () => { shown = st.length; draw(); });
      pane.querySelectorAll('[data-g]').forEach(b => b.onclick = () => grade(+b.dataset.g));
    };
    const grade = g => {
      const i = order[pos];
      S.setMap('srs', sid(p, i), schedule(S.getMap('srs', sid(p, i), null), g, today()));
      n++; if (g >= 2) good++;
      if (g === 0) S.setMap('memoLvl', sid(p, i), 2);
      pos++; shown = 0; draw();
    };
    const finish = () => {
      if (cleanupKeys) { cleanupKeys(); cleanupKeys = null; }
      if (n) api.save(Math.round(100 * good / n), '%', { title: p.title, poem: p.id, n, mode: 'reciter' });
      pane.innerHTML = `<div class="card" style="text-align:center;border-color:var(--ok)"><h3>${n ? `${n} strophe${n > 1 ? 's' : ''} récitée${n > 1 ? 's' : ''}` : 'Récitation terminée'}</h3>
        ${n ? `<p class="small muted">${good} bien récitée${good > 1 ? 's' : ''}. Les strophes ratées reviendront plus vite, et repassent au masquage partiel dans « Apprendre ».</p>` : ''}
        <button class="btn primary" id="back">Mes textes</button></div>`;
      pane.querySelector('#back').onclick = library;
    };
    const key = e => {
      if (!pane.isConnected || e.target.matches?.('input,textarea')) return;
      const st = p.stanzas[order[pos]];
      if (pos < order.length && st && shown < st.length && (e.code === 'Space' || e.key === 'Enter')) { e.preventDefault(); shown++; draw(); }
      else if (st && shown >= st.length && ['1', '2', '3', '4'].includes(e.key)) grade(Number(e.key) - 1);
    };
    document.addEventListener('keydown', key);
    cleanupKeys = () => document.removeEventListener('keydown', key);
    draw();
  }

  library();
  return () => { if (cleanupKeys) cleanupKeys(); try { speechSynthesis.cancel(); } catch { } };
}
