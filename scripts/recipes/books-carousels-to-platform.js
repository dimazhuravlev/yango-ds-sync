// ДС Книг → ДС Платформа: карусели книг. Пара «header ДС + section (cover textbook 192)» → `carousel / Books` Size=large,
// пара «header ДС + slider (обложки 144)» и slider со своим видимым heading → Size=medium. Перенос: заголовок, видимость
// стрелки, до 6 обложек (картинка + эффекты, пропорция → ближайший Ratio, квадрат → audiobook), прогресс с текстом.
// Карточки в мастере карусели фиксированной ширины — на инстансе HUG, иначе обложка новой пропорции обрезается.
// Значок вместо процента (флажок «прочитано») в карточке ДС не переносится — id в R.flags. Проверено на ЯПС «Книги».
// MODE 'preview' — копии экранов TARGETS справа (снять, потом удалить [preview]); 'page' — вся страница PAGES.
const MODE = 'preview'; // 'preview' | 'write' | 'page'
const PAGES = /Книги/;
const TARGETS = []; // preview: экраны; write: узлы
const CLEAN = []; // id [preview]-копий для удаления
figma.skipInvisibleInstanceChildren = false;
const pg = figma.root.children.find(p => PAGES.test(p.name)); if (!pg) throw new Error('PAGES'); await figma.setCurrentPageAsync(pg);
const SET = await figma.importComponentSetByKeyAsync('37d8933114c1f57a35f479173fa8b38798106f69');
const V = SET.children.find(c => c.name === 'Type=poster, RTL=off, Size=large');
const VM = SET.children.find(c => c.name === 'Type=poster, RTL=off, Size=medium');
const BOOKSET = await figma.importComponentSetByKeyAsync('0cd671fa9b041346a95adf2df8f8310a1ebbc322');
const ratios = [...new Set(BOOKSET.children.filter(c => /Type=book, Size=large/.test(c.name)).map(c => c.name.match(/Ratio=([\d:]+)/)[1]))];
const nearRatio = (w, h) => ratios.map(r => { const [a, b] = r.split(':').map(Number); return [r, Math.abs(a / b - w / h)]; }).sort((x, y) => x[1] - y[1])[0][0];
const loadAll = async n => { for (const t of n.findAll(x => x.type === 'TEXT')) for (const f of t.getRangeAllFontNames(0, t.characters.length)) { try { await figma.loadFontAsync(f); } catch (e) {} } };
const keyOf = x => { const m = x.type === 'INSTANCE' && x.mainComponent; if (!m) return null; return m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.key : m.key; };
const isSlider = n => keyOf(n) === '2c85f21854f0b2317ccc6e38f3cf9d061ba8c365';
const isStack = n => n.type === 'FRAME' && n.children.length === 2 && keyOf(n.children[0]) === '409e75f2a9132b187f7f319c51f086509406d9df' && (keyOf(n.children[1]) === '4097e564b4d5297869fc53aceaeef6c4e17cbadd' || (isSlider(n.children[1]) && !n.children[1].findOne(x => x.name === 'heading').visible));
const R = { done: [], kept: [], errors: [] };
for (const id of CLEAN) { const c = await figma.getNodeByIdAsync(id); if (c && /^\[preview\]/.test(c.name)) c.remove(); }
const convert = async st => {
  const sl = isSlider(st); let title, actionVis, covers, VV = V;
  if (sl) { const hd = st.findOne(x => x.name === 'heading' && x.type === 'INSTANCE'); title = hd.findOne(x => x.type === 'TEXT').characters; actionVis = true; covers = st.findOne(x => x.name === 'list').children.filter(c => c.visible).map(it => it.type === 'INSTANCE' ? it : it.children[0]); VV = VM; }
  else { const h = st.children[0], sec = st.children[1]; title = h.findOne(x => x.type === 'TEXT' && x.name === 'title').characters; actionVis = (h.findOne(x => x.name === 'action') || { visible: true }).visible;
    if (isSlider(sec)) { covers = sec.findOne(x => x.name === 'list').children.filter(c => c.visible).map(it => it.type === 'INSTANCE' ? it : it.children[0]); VV = VM; } else covers = sec.findOne(x => x.name === 'section content').children.filter(c => c.visible && c.type === 'INSTANCE'); }
  const data = covers.slice(0, 6).map(c => { const img = [c, ...c.findAll(() => true)].find(x => Array.isArray(x.fills) && x.fills.some(f => f.type === 'IMAGE'));
    const pb = c.findOne ? c.findOne(x => x.name === 'progress badge' && x.type === 'INSTANCE') : null; const pbt = pb && pb.findOne(x => x.type === 'TEXT');
    return { w: c.width, h: c.height, fills: img ? img.fills : null, fx: img ? img.effects : [], prog: !!(pb && pb.visible && pbt && pbt.visible), progIcon: !!(pb && pb.visible && !(pbt && pbt.visible)), progText: pbt ? pbt.characters : null }; });
  const parent = st.parent, idx = parent.children.indexOf(st);
  const i = VV.createInstance(); parent.insertChild(idx, i); let stage = 'build';
  try {
    if (st.layoutPositioning === 'ABSOLUTE') { i.layoutPositioning = 'ABSOLUTE'; i.x = st.x; i.y = st.y; }
    if (!parent.layoutMode || parent.layoutMode === 'NONE') { i.x = st.x; i.y = st.y; }
    i.resize(st.width, i.height); i.primaryAxisSizingMode = 'AUTO'; if (st.layoutSizingHorizontal === 'FILL') i.layoutSizingHorizontal = 'FILL';
    await loadAll(i);
    const ht = i.findOne(x => x.type === 'TEXT' && x.name === 'title'); ht.characters = title;
    const act = i.findOne(x => x.name === 'action'); if (act) act.visible = actionVis;
    const props = {}; for (const k of Object.keys(i.componentProperties)) { const m = k.match(/^0(\d)#/); if (m) props[k] = Number(m[1]) <= data.length; } i.setProperties(props);
    const car = i.findOne(x => x.name === 'carousel');
    for (let n = 0; n < data.length; n++) { const d = data[n]; const card = car.children[n];
      const sq = Math.abs(d.w / d.h - 1) < 0.05; const pk = Object.keys(card.componentProperties).find(k => /^Progress/.test(k)); const pp = sq ? { Type: 'audiobook', Ratio: '1:1' } : { Ratio: nearRatio(d.w, d.h) }; if (pk) pp[pk] = d.prog; card.setProperties(pp); card.layoutSizingHorizontal = 'HUG'; if (d.progIcon) R.flags = (R.flags || []).concat(card.id);
      await loadAll(card);
      if (d.fills) { const cov = card.findOne(x => x.name === 'cover'); const im = cov.type === 'INSTANCE' ? (cov.findOne(x => Array.isArray(x.fills) && x.fills.some(f => f.type === 'IMAGE')) || cov) : cov; im.fills = d.fills; if (d.fx && d.fx.length) im.effects = d.fx; }
      if (d.prog && d.progText) { const p = card.findOne(x => x.name === 'progress'); const t = p && p.findOne(x => x.type === 'TEXT'); if (t) t.characters = d.progText; } }
    i.name = 'carousel / Books';
    const ok = i.findOne(x => x.type === 'TEXT' && x.name === 'title').characters === title;
    if (!ok) throw new Error('title mismatch');
    const line = st.id + ' → ' + i.id + ' "' + title + '" ' + data.length + ' cards h ' + Math.round(st.height) + '→' + Math.round(i.height) + ' y ' + Math.round(st.y) + '/' + Math.round(i.y);
    stage = 'commit'; st.remove(); R.done.push(line);
  } catch (e) { if (stage === 'build') i.remove(); R.errors.push(st.id + ' ' + stage + ' ' + String(e.message || e).slice(0, 120)); }
};
if (MODE === 'preview') {
  for (const id of TARGETS) { const orig = await figma.getNodeByIdAsync(id); let top = orig; while (top.parent && top.parent.type !== 'PAGE') top = top.parent;
    const holder = figma.createFrame(); pg.appendChild(holder); holder.name = '[preview] ' + orig.name; holder.fills = []; holder.resize(orig.width, orig.height); holder.clipsContent = true;
    for (let a = orig; a && a.type !== 'PAGE'; a = a.parent) for (const [k, v] of Object.entries(a.explicitVariableModes || {})) { try { const c = await figma.variables.getVariableCollectionByIdAsync(k); if (c && !(k in holder.explicitVariableModes)) holder.setExplicitVariableModeForCollection(c, v); } catch (e) {} }
    holder.x = top.absoluteBoundingBox.x + top.absoluteBoundingBox.width + 400; holder.y = orig.absoluteBoundingBox.y;
    const clone = orig.clone(); holder.appendChild(clone); clone.x = 0; clone.y = 0;
    for (const st of clone.findAll(n => n.visible && isStack(n))) await convert(st);
    for (const st of clone.findAll(n => n.visible && isSlider(n) && n.findOne(x => x.name === 'heading').visible)) await convert(st);
    R.preview = (R.preview || []).concat(holder.id); }
} else if (MODE === 'page') { const st1 = pg.findAll(n => !n.id.includes(';') && n.visible && isStack(n)); for (const st of st1) await convert(st);
  const st2 = pg.findAll(n => !n.id.includes(';') && n.visible && isSlider(n) && n.findOne(x => x.name === 'heading').visible); for (const st of st2) await convert(st);
} else { for (const id of TARGETS) { const st = await figma.getNodeByIdAsync(id); if (st && (isStack(st) || isSlider(st))) await convert(st); else R.errors.push(id + ' not a stack'); } }
return R;
