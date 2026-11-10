// ДС Книг → ДС Платформа: `snippet textbook` → `list-item / media` Content=book. Перенос: название, автор; плашка «Книга» из
// snippet meta → описание «Книга · автор» (вторая подпись и точка — видимостью слоёв, как в образце ДС); 18+ → «18+ Icon»
// у заголовка; обложка (картинка + эффекты, Ratio ближайший, квадрат → audiobook), прогресс; справа пусто (Icon off).
// Своя линия-разделитель после строки → Divider Bottom у строки, линия удаляется. Номер в серии в ДС не переносится.
// MODE 'preview' | 'write' (TARGETS — id строк) | 'page'. Проверено на ЯПС «Книги».
const MODE = 'preview'; // 'preview' | 'write' | 'page'
const PAGES = /Книги/;
const TARGETS = []; // preview: экраны; write: узлы
const CLEAN = []; // id [preview]-копий для удаления
figma.skipInvisibleInstanceChildren = false;
const pg = figma.root.children.find(p => PAGES.test(p.name)); if (!pg) throw new Error('PAGES'); await figma.setCurrentPageAsync(pg);
const LSET = await figma.importComponentSetByKeyAsync('9ad7e8ec1d2595a8c6d370a62a2ab73abed5f051');
const LV = LSET.children.find(c => c.name === 'Type=regular, Content=book, Skeleton=no, RTL=off');
const ratios = ['3:5', '5:8', '2:3', '7:10', '3:4'];
const nearRatio = (w, h) => ratios.map(r => { const [a, b] = r.split(':').map(Number); return [r, Math.abs(a / b - w / h)]; }).sort((x, y) => x[1] - y[1])[0][0];
const loadAll = async n => { for (const t of n.findAll(x => x.type === 'TEXT')) for (const f of t.getRangeAllFontNames(0, t.characters.length)) { try { await figma.loadFontAsync(f); } catch (e) {} } };
const keyOf = x => { const m = x.type === 'INSTANCE' && x.mainComponent; if (!m) return null; return m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.key : m.key; };
const isSnip = n => keyOf(n) === 'dfa53f091eb3f85c0834454b027ebbbc6fb9aac8';
const setText = (inst, val) => { const k = Object.keys(inst.componentProperties).find(k => /^Text/.test(k)); if (k) inst.setProperties({ [k]: val }); else { const t = inst.findOne(x => x.type === 'TEXT'); t.characters = val; } };
const vis = n => { for (let a = n; a; a = a.parent) { if (a.visible === false) return false; if (a.type === 'INSTANCE' && !a.id.includes(';')) break; } return true; };
const R = { done: [], errors: [] };
for (const id of CLEAN) { const c = await figma.getNodeByIdAsync(id); if (c && /^\[preview\]/.test(c.name)) c.remove(); }
const convert = async sn => {
  const cov = sn.findOne(x => x.name === 'cover textbook' && x.type === 'INSTANCE');
  const img = cov.findOne(x => x.name === 'image' && Array.isArray(x.fills) && x.fills.some(f => f.type === 'IMAGE'));
  const pb = cov.findOne(x => x.name === 'progress badge' && x.type === 'INSTANCE'); const pbt = pb && pb.findOne(x => x.type === 'TEXT');
  const title = sn.findOne(x => x.type === 'TEXT' && x.name === 'title').characters;
  const author = sn.findOne(x => x.type === 'TEXT' && x.name === 'author'); const authorTxt = author && vis(author) ? author.characters : null;
  const meta = sn.findOne(x => x.name === 'snippet meta' && x.type === 'INSTANCE'); const metaOn = meta && vis(meta);
  const bdg = metaOn ? meta.findOne(x => x.name === 'badge' && x.type === 'INSTANCE') : null; const badgeTxt = bdg && vis(bdg) ? bdg.findOne(x => x.type === 'TEXT').characters : null;
  const age = metaOn ? meta.findOne(x => x.name === 'age restriction' && x.type === 'INSTANCE') : null; const ageOn = !!(age && vis(age));
  const nxt = sn.parent.children[sn.parent.children.indexOf(sn) + 1]; const line = nxt && nxt.type === 'LINE' && /divider/i.test(nxt.name) ? nxt : null;
  const sq = Math.abs(cov.width / cov.height - 1) < 0.05;
  const d = { fills: img ? img.fills : null, fx: img ? img.effects : [], prog: !!(pb && vis(pb) && pbt && vis(pbt)), progText: pbt ? pbt.characters : null };
  const parent = sn.parent, idx = parent.children.indexOf(sn);
  const i = LV.createInstance(); parent.insertChild(idx, i); let stage = 'build';
  try {
    if (!parent.layoutMode || parent.layoutMode === 'NONE') { i.x = sn.x; i.y = sn.y; }
    i.resize(sn.width, i.height); if (sn.layoutSizingHorizontal === 'FILL') i.layoutSizingHorizontal = 'FILL';
    const P = {}; for (const k of Object.keys(i.componentProperties)) { if (/^Divider Bottom/.test(k)) P[k] = !!line; if (/^Icon#/.test(k)) P[k] = false; if (/^Actions/.test(k) || /^Chevron/.test(k) || /^Monetization/.test(k) || /^Overlay/.test(k) || /^Delete/.test(k) || /^Divider Top/.test(k)) P[k] = false; }
    i.setProperties(P);
    await loadAll(i);
    const tl = i.findOne(x => x.type === 'INSTANCE' && x.name === 'text-label');
    const tk = {}; for (const k of Object.keys(tl.componentProperties)) { if (/^Description/.test(k)) tk[k] = !!(authorTxt || badgeTxt); } tl.setProperties(tk);
    setText(tl.findOne(x => x.type === 'INSTANCE' && x.name === 'title'), title);
    const ttl = tl.findOne(x => x.type === 'INSTANCE' && x.name === 'title'); const ak = Object.keys(ttl.componentProperties).find(k => /^18\+ Icon/.test(k)); if (ak) ttl.setProperties({ [ak]: ageOn });
    const desc = tl.findOne(x => x.type === 'INSTANCE' && x.name === 'description');
    if (badgeTxt && authorTxt) { setText(desc, badgeTxt); const lf = desc.findOne(x => x.name === 'label' && x.type === 'FRAME'); const dot = lf.findOne(x => x.name === 'divider dot'); const l2 = lf.children.filter(x => x.type === 'TEXT')[1]; dot.visible = true; l2.visible = true; l2.characters = authorTxt; }
    else if (authorTxt || badgeTxt) setText(desc, authorTxt || badgeTxt);
    const card = i.findOne(x => x.type === 'INSTANCE' && x.name === 'card / book');
    const pk = Object.keys(card.componentProperties).find(k => /^Progress/.test(k));
    const pp = sq ? { Type: 'audiobook', Ratio: '1:1' } : { Ratio: nearRatio(cov.width, cov.height) }; if (pk) pp[pk] = d.prog; card.setProperties(pp);
    const sz = card.findChild(x => x.name === 'size'); if (sz && sz.layoutSizingHorizontal !== 'FILL') sz.layoutSizingHorizontal = 'FILL';
    await loadAll(card);
    if (d.fills) { const cv = card.findOne(x => x.name === 'cover'); const im = cv.type === 'INSTANCE' ? (cv.findOne(x => Array.isArray(x.fills) && x.fills.some(f => f.type === 'IMAGE')) || cv) : cv; im.fills = d.fills; if (d.fx && d.fx.length) im.effects = d.fx; }
    if (d.prog && d.progText) { const p = card.findOne(x => x.name === 'progress'); const t = p && p.findOne(x => x.type === 'TEXT'); if (t) t.characters = d.progText; }
    i.name = 'list-item / media';
    const shown = i.findAll(x => x.type === 'TEXT' && vis(x)).map(t => t.characters);
    if (!shown.includes(title) || (authorTxt && !shown.includes(authorTxt)) || (badgeTxt && !shown.includes(badgeTxt))) throw new Error('texts ' + shown.join('|'));
    const log = sn.id + ' → ' + i.id + ' "' + title.slice(0, 20) + '" ' + (badgeTxt || '-') + (ageOn ? ' 18+' : '') + (line ? ' div' : '') + ' h ' + Math.round(sn.height) + '→' + Math.round(i.height);
    stage = 'commit'; sn.remove(); if (line) line.remove(); R.done.push(log);
  } catch (e) { if (stage === 'build') i.remove(); R.errors.push(sn.id + ' ' + stage + ' ' + String(e.message || e).slice(0, 140)); }
};
if (MODE === 'preview') {
  let dy = 0;
  for (const id of TARGETS) { const orig = await figma.getNodeByIdAsync(id); let top = orig; while (top.parent && top.parent.type !== 'PAGE') top = top.parent;
    const holder = figma.createFrame(); pg.appendChild(holder); holder.name = '[preview] ' + orig.name; holder.fills = []; holder.resize(orig.width, orig.height); holder.clipsContent = true;
    for (let a = orig; a && a.type !== 'PAGE'; a = a.parent) for (const [k, v] of Object.entries(a.explicitVariableModes || {})) { try { const c = await figma.variables.getVariableCollectionByIdAsync(k); if (c && !(k in holder.explicitVariableModes)) holder.setExplicitVariableModeForCollection(c, v); } catch (e) {} }
    holder.x = top.absoluteBoundingBox.x + top.absoluteBoundingBox.width + 400 + dy; dy += 500; holder.y = orig.absoluteBoundingBox.y;
    const clone = orig.clone(); holder.appendChild(clone); clone.x = 0; clone.y = 0;
    for (const sn of clone.findAll(n => isSnip(n))) await convert(sn);
    R.preview = (R.preview || []).concat(holder.id); }
} else if (MODE === 'page') { for (const sn of pg.findAll(n => !n.id.includes(';') && isSnip(n))) await convert(sn);
} else { for (const id of TARGETS) { const sn = await figma.getNodeByIdAsync(id); if (sn && isSnip(sn)) await convert(sn); else R.errors.push(id + ' not a snippet'); } }
return R;
