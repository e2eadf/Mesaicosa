// Éditeur de créneaux, utilisé pour la semaine type et pour un jour précis.
import { CATS, MODULES, minutes, sortBlocks } from './schedule.js';
import { uid } from './store.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hfr = s => s.replace(':', 'h');

/**
 * @param el conteneur
 * @param opts.blocks créneaux modifiables
 * @param opts.locked créneaux affichés en lecture seule (bloqués)
 * @param opts.allowFixed true dans la semaine type : on peut marquer un créneau comme bloqué
 * @param opts.onChange(blocks) appelé à chaque modification
 */
export function mountEditor(el, opts) {
  let blocks = sortBlocks(opts.blocks || []);
  let editing = null; // id en cours, ou 'new'

  function rowHtml(b, locked) {
    const mods = (b.mods || []).map(m => MODULES[m]?.name).filter(Boolean);
    if (b.review) mods.push('Revue hebdo');
    return `<div class="block c-${b.k}" style="grid-template-columns:62px 1fr auto">
      <div class="time">${hfr(b.s)}<br>${hfr(b.e)}</div>
      <div><div class="lbl">${b.fixed ? '🔒 ' : ''}${esc(b.l)}</div>
        <div class="sub">${esc(CATS[b.k] || '')}${b.sub ? ' · ' + esc(b.sub) : ''}${mods.length ? ' · ' + esc(mods.join(', ')) : ''}</div></div>
      <div class="row" style="gap:4px">${locked ? '<span class="tiny muted">bloqué</span>'
        : `<button class="btn small ghost" data-edit="${b.id}" aria-label="Modifier ${esc(b.l)}">✎</button>
           <button class="btn small ghost" data-del="${b.id}" aria-label="Supprimer ${esc(b.l)}">✕</button>`}</div>
    </div>`;
  }

  function formHtml(b) {
    const modChips = [...Object.entries(MODULES).map(([id, m]) => [id, m.name]), ['__review', 'Revue hebdo']]
      .map(([id, name]) => {
        const on = id === '__review' ? !!b.review : (b.mods || []).includes(id);
        return `<label class="pill" style="cursor:pointer"><input type="checkbox" data-mod="${id}" ${on ? 'checked' : ''}> ${esc(name)}</label>`;
      }).join(' ');
    return `<form class="card" id="blk-form" style="display:grid;gap:10px;border-color:var(--accent)">
      <div class="row" style="flex-wrap:nowrap">
        <label style="flex:1">Début<input type="time" name="s" value="${b.s}" required></label>
        <label style="flex:1">Fin<input type="time" name="e" value="${b.e}" required></label>
      </div>
      <label>Libellé<input type="text" name="l" value="${esc(b.l)}" placeholder="Piano"></label>
      <label>Catégorie<select name="k">${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${k === b.k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
      <label>Précision (facultatif)<input type="text" name="sub" value="${esc(b.sub || '')}" placeholder="Sur téléphone"></label>
      <div><div class="small muted" style="margin-bottom:4px">Raccourcis vers le Gymnase</div><div class="row" style="gap:6px">${modChips}</div></div>
      ${opts.allowFixed ? `<label class="row"><input type="checkbox" name="fixed" ${b.fixed ? 'checked' : ''}> Créneau bloqué (identique chaque semaine, non modifiable jour par jour)</label>` : ''}
      <div class="small feedback-ko" id="blk-err"></div>
      <div class="row"><button class="btn primary" type="submit">Enregistrer</button><button class="btn ghost" type="button" id="blk-cancel">Annuler</button></div>
    </form>`;
  }

  function draw() {
    const all = sortBlocks([...(opts.locked || []).map(b => ({ ...b, __locked: true })), ...blocks]);
    const current = editing === 'new' ? { id: 'new', s: '20:30', e: '21:00', k: 'perso', l: '' } : blocks.find(b => b.id === editing);
    el.innerHTML = `
      <div class="row" style="margin-bottom:10px"><button class="btn" id="blk-add">+ Ajouter un créneau</button></div>
      ${editing === 'new' ? formHtml(current) : ''}
      <div class="blocks">${all.length ? all.map(b => b.id === editing && !b.__locked ? formHtml(current) : rowHtml(b, b.__locked)).join('') : '<div class="empty">Aucun créneau pour ce jour.</div>'}</div>`;
    el.querySelector('#blk-add').onclick = () => { editing = 'new'; draw(); el.querySelector('#blk-form [name=l]').focus(); };
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { editing = b.dataset.edit; draw(); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      blocks = blocks.filter(x => x.id !== b.dataset.del); opts.onChange(blocks); draw();
    });
    const f = el.querySelector('#blk-form');
    if (f) {
      const err = f.querySelector('#blk-err');
      f.addEventListener('input', () => { err.textContent = ''; });
      f.querySelector('#blk-cancel').onclick = () => { editing = null; draw(); };
      f.addEventListener('submit', e => {
        e.preventDefault();
        const l = f.l.value.trim(), s = f.s.value, en = f.e.value;
        if (!l) { err.textContent = 'Donne un nom au créneau.'; f.l.focus(); return; }
        if (!s || !en || minutes(en) <= minutes(s)) { err.textContent = 'La fin doit être après le début.'; f.e.focus(); return; }
        const mods = [...f.querySelectorAll('[data-mod]:checked')].map(x => x.dataset.mod);
        const rec = { id: editing === 'new' ? uid() : editing, s, e: en, l, k: f.k.value };
        if (f.sub.value.trim()) rec.sub = f.sub.value.trim();
        const m = mods.filter(x => x !== '__review'); if (m.length) rec.mods = m;
        if (mods.includes('__review')) rec.review = true;
        if (opts.allowFixed && f.fixed?.checked) rec.fixed = true;
        blocks = sortBlocks(editing === 'new' ? [...blocks, rec] : blocks.map(x => x.id === editing ? rec : x));
        editing = null; opts.onChange(blocks); draw();
      });
    }
  }
  draw();
}
