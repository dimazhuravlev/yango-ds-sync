// Отвязанные копии `carousel / Movies` (фрейм: `header` Library + `carousel` из карточек Library `card / poster / *`) →
// инстанс Library `carousel / Movies` целиком (правило: карусель — компонентом, не шапка + карточки). Вариант
// Type=poster|top 10 (по карточкам), Size — из варианта карточек, RTL=off. Слоты 01…06 свапаются на мастер старой
// карточки и получают её оверрайды по именному пути (картинка, тексты, бейджи); шапка — повтор оверрайдов старой шапки;
// лишние слоты скрыты булевыми. Сверка видимых текстов и картинок; при расхождении новый инстанс удаляется, копия остаётся.
// Копии с посторонними детьми (Badge, rows, картинки вместо карусели) пропускаются — руками. `Type=top 10` есть только
// в `Size=medium`: топ-10 на small-карточках остаётся копией (novariant).
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const KEY = '4d1844b63ed905a432c3bb5c545593393d5ff6fe';
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const norm = s => s.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim();
const isVis = (n, root) => { let a = n; while (a && a.id !== root.id && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = X => X.findAll(n => n.type === 'TEXT' && isVis(n, X)).map(t => t.characters.trim()).filter(Boolean).sort();
const imgOf = X => X.findAll(n => 'fills' in n && Array.isArray(n.fills) && isVis(n, X)).flatMap(n => n.fills.filter(f => f.type === 'IMAGE' && f.visible !== false).map(f => f.imageHash)).sort();
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
const ownNode = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return false; a = a.parent; } return true; };
/*@GUARD*/
function walk(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { const k = norm(c.name); cnt[k] = (cnt[k] || 0) + 1; const p = path + '/' + k + '#' + cnt[k]; m.set(p, c); rec(c, p); } }; rec(root, ''); return m; }
function snap(root) { const out = []; for (const [p, n] of walk(root)) { const r = { p, vis: n.visible, type: n.type }; if (n.type === 'TEXT') r.chars = n.characters; if ('fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')) r.fills = JSON.parse(JSON.stringify(n.fills)); if (n.type === 'INSTANCE' && n.mainComponent) { r.main = n.mainComponent; try { r.props = Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) { r.props = {}; } } out.push(r); } return out; }
async function setText(t, s) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters; if (ref) { let a = t.parent; while (a && !(a.type === 'INSTANCE' && ref in a.componentProperties)) a = a.parent; if (a) { a.setProperties({ [ref]: s }); return; } } t.characters = s; }
async function replay(X, S) { let M = walk(X);
  for (const r of S) { let n = M.get(r.p); if (n && n.removed) { M = walk(X); n = M.get(r.p); } if (!n || n.removed || n.type !== r.type) continue;
    if (r.type === 'INSTANCE' && n.mainComponent && r.main && n.mainComponent.id !== r.main.id && r.main.remote) { try { n.swapComponent(r.main); } catch (e) {} M = walk(X); n = M.get(r.p); if (!n) continue; }
    if (r.type === 'INSTANCE') { let defs; try { defs = n.componentProperties; } catch (e) { defs = {}; } const set = {}; for (const [k, v] of Object.entries(defs)) { const b = k.replace(/#.*/, ''); if (b in r.props && r.props[b] !== v.value && v.type !== 'INSTANCE_SWAP') set[k] = r.props[b]; } if (Object.keys(set).length) { try { n.setProperties(set); } catch (e) {} } } }
  const M2 = walk(X); for (const r of S) { const n = M2.get(r.p); if (!n || n.removed || n.type !== r.type) continue; if (n.visible !== r.vis && !(n.componentPropertyReferences && n.componentPropertyReferences.visible)) n.visible = r.vis; if (r.fills && 'fills' in n) { try { if (JSON.stringify(n.fills) !== JSON.stringify(r.fills)) n.fills = r.fills; } catch (e) {} } if (r.type === 'TEXT' && n.characters !== r.chars && !(n.componentPropertyReferences && n.componentPropertyReferences.characters)) { try { await setText(n, r.chars); } catch (e) {} } } }
const CS = await figma.importComponentSetByKeyAsync(KEY);
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { ok: 0, skip: [], fail: [], sample: {} }; out[pg.name.replace(/^[^\wА-Яа-яЁё]+/, '').slice(0, 10)] = R;
  const frames = pg.findAll(n => n.type === 'FRAME' && /^carousel \/ movies$/i.test(n.name.trim()) && ownNode(n)).map(f => f.id);
  for (const fid of frames) { const F = await figma.getNodeByIdAsync(fid); if (!F) continue; let N = null, GG = null; try {
    const hdr = F.children.find(c => c.type === 'INSTANCE' && c.mainComponent && setOf(c.mainComponent).key.startsWith('409e75f2')); const row = F.children.find(c => c.type === 'FRAME' && /^carousel/i.test(c.name));
    if (!hdr || !row || F.children.length !== 2) { R.skip.push(fid + ' structure ' + F.children.map(c => esc(c.name).slice(0, 12) + '[' + c.type[0] + ']').join(',').slice(0, 60)); continue; }
    const cards = row.children.filter(c => c.type === 'INSTANCE' && c.mainComponent && /^card \/ poster/.test(setOf(c.mainComponent).name)); if (!cards.length || cards.length > 6 || cards.length !== row.children.length) { R.skip.push(fid + ' cards ' + cards.length + '/' + row.children.length); continue; }
    const cvp = vpOf(cards[0].mainComponent.name); const size = (cvp.Size || 'small').toLowerCase(); const top10 = /top-10/.test(setOf(cards[0].mainComponent).name) && cards.some(c => c.findOne(n => /top-10|number/i.test(n.name) && n.visible && isVis(n, c)));
    const vname = 'Type=' + (top10 ? 'top 10' : 'poster') + ', RTL=off, Size=' + size; const V = CS.children.find(c => c.name === vname); if (!V) { R.skip.push(fid + ' novariant ' + vname); continue; }
    const t0 = visT(F), h0 = imgOf(F); const par = F.parent, idx = par.children.findIndex(c => c.id === F.id); const g = { x: F.x, y: F.y, w: F.width, h: F.height, pos: F.layoutPositioning, c: F.constraints, vis: F.visible }; let lsh = null; try { lsh = F.layoutSizingHorizontal; } catch (e) {}
    GG = geoGuard(F); N = V.createInstance(); par.insertChild(idx, N);
    const props = {}; for (const [k, v] of Object.entries(N.componentProperties)) { const b = k.replace(/#.*/, ''); if (b === 'Header') props[k] = true; const m = /^0(\d)$/.exec(b); if (m) props[k] = (+m[1] <= cards.length); } N.setProperties(props);
    const nh = N.findOne(n => n.type === 'INSTANCE' && n.mainComponent && setOf(n.mainComponent).key.startsWith('409e75f2')); if (nh) { if (nh.mainComponent.id !== hdr.mainComponent.id) { try { nh.swapComponent(hdr.mainComponent); } catch (e) {} } const nh2 = N.findOne(n => n.type === 'INSTANCE' && n.mainComponent && setOf(n.mainComponent).key.startsWith('409e75f2')); await replay(nh2, snap(hdr)); }
    for (let i = 0; i < cards.length; i++) { const slot = N.findOne(n => n.type === 'INSTANCE' && n.name === '0' + (i + 1)); if (!slot) continue; const old = cards[i]; if (slot.mainComponent.id !== old.mainComponent.id) { try { slot.swapComponent(old.mainComponent); } catch (e) {} } const slot2 = N.findOne(n => n.type === 'INSTANCE' && n.name === '0' + (i + 1)); await replay(slot2, snap(old)); await replay(slot2, snap(old)); }
    try { if (N.layoutPositioning !== g.pos) N.layoutPositioning = g.pos; } catch (e) {} try { N.constraints = g.c; } catch (e) {} const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE'); if (g.pos === 'ABSOLUTE' || !parentAL) { N.x = g.x; N.y = g.y; } try { if (lsh === 'FILL') N.layoutSizingHorizontal = 'FILL'; else N.resize(g.w, N.height); } catch (e) {} N.visible = g.vis; N.name = 'carousel / Movies';
    const t1 = visT(N), h1 = imgOf(N);
    const mv = GG.moved(N);
    if (JSON.stringify(t0) === JSON.stringify(t1) && h0.every(hh => h1.includes(hh)) && !mv.length) { F.remove(); R.ok++; if (!R.sample[vname]) R.sample[vname] = N.id; } else { N.remove(); N = null; GG.repair(); R.fail.push(fid + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '') + ' t:' + esc(t0.filter(t => !t1.includes(t)).join('|')).slice(0, 40) + ' / +' + esc(t1.filter(t => !t0.includes(t)).join('|')).slice(0, 30) + ' img:' + h0.length + '>' + h1.length); }
  } catch (e) { if (N && !N.removed) { try { N.remove(); } catch (e2) {} } if (GG) { try { GG.repair(); } catch (e3) {} } R.fail.push(fid + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
