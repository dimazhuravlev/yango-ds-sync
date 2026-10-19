// Шапки секций чужих ДС (`header` a0ad828e: title + `. / header / right` + description; `❌ header / static` dda77164
// старой Платформы) → ДС Платформа `header / static-old` (77b566d2). Создание на месте по ролям: вариант RTL × Type (medium → Medium,
// xSmall → XSmall…), булевы Description / Action / Counter, тексты title / description / action; геометрия старого
// (ширина, позиция, FILL), высота — ДС Платформа; сверка видимых текстов; старый удаляется при успехе.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const FROM = new Set(['a0ad828e', 'dda77164']); const KEY = '77b566d20c18c850b2d7a89f544cbbf63f423c45';
const TYPE = { large: 'Large', xlarge: 'Large', medium: 'Medium', small: 'Small', xsmall: 'XSmall' };
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const isVis = (n, root) => { let a = n; while (a && a !== root) { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = X => X.findAll(n => n.type === 'TEXT' && isVis(n, X)).map(t => t.characters.trim()).filter(Boolean).sort();
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
const findVariant = (set, want) => set.children.find(c => { const v = vpOf(c.name); return Object.keys(want).every(k => v[k] === want[k]); });
async function setText(t, s) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters; if (ref) { let a = t.parent; while (a && !(a.type === 'INSTANCE' && ref in a.componentProperties)) a = a.parent; if (a) { a.setProperties({ [ref]: s }); return; } } t.characters = s; }
/*@GUARD*/
function geoOf(X) { const par = X.parent; const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE'); let lsh = null, lsv = null, la = null, lg = null; try { lsh = X.layoutSizingHorizontal; lsv = X.layoutSizingVertical; la = X.layoutAlign; lg = X.layoutGrow; } catch (e) {} return { x: X.x, y: X.y, w: X.width, h: X.height, pos: X.layoutPositioning, c: X.constraints, lsh, lsv, la, lg, vis: X.visible, op: X.opacity, name: X.name, idx: par.children.indexOf(X), parentAL }; }
function geoApply(N, g, keepH) { try { if (N.layoutPositioning !== g.pos) N.layoutPositioning = g.pos; } catch (e) {} try { N.constraints = g.c; } catch (e) {} const absolute = g.pos === 'ABSOLUTE' || !g.parentAL; if (absolute) { N.x = g.x; N.y = g.y; } else { try { if (g.la) N.layoutAlign = g.la; if (g.lg) N.layoutGrow = g.lg; } catch (e) {} } const h = keepH ? N.height : g.h; try { if (g.lsh === 'FILL') { N.layoutSizingHorizontal = 'FILL'; if (Math.abs(N.height - h) > .5) N.resize(N.width, h); } else N.resize(g.w, h); if (g.lsv === 'FILL') N.layoutSizingVertical = 'FILL'; } catch (e) { try { N.resize(g.w, h); } catch (e2) {} } N.visible = g.vis; N.opacity = g.op; }
const set = await figma.importComponentSetByKeyAsync(KEY);
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { ok: 0, fail: [], skip: [], sample: [] }; out[pg.name.replace(/^[^\wА-Яа-яЁё]+/, '').slice(0, 10)] = R;
  const targets = [];
  for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { const M = i.mainComponent; if (!M || !M.remote) continue; if (!FROM.has(setOf(M).key.slice(0, 8))) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (inInst) continue; targets.push(i); }
  for (const X of targets) { let N = null, GG = null; try {
    const vp = vpOf(X.mainComponent.name); const type = TYPE[String(vp.Type || 'medium').toLowerCase()]; const rtl = /^on$/i.test(vp.RTL || '') ? 'on' : 'off';
    if (!type) { R.skip.push(X.id + ' type ' + esc(vp.Type)); continue; }
    const tgt = findVariant(set, { RTL: rtl, Type: type }); if (!tgt) { R.skip.push(X.id + ' novariant ' + rtl + '/' + type); continue; }
    let props = {}; try { for (const [k, v] of Object.entries(X.componentProperties)) if (v.type === 'BOOLEAN') props[k.replace(/#.*/, '')] = v.value; } catch (e) {}
    const tNode = X.findOne(n => n.type === 'TEXT' && n.name === 'title'), dNode = X.findOne(n => n.type === 'TEXT' && n.name === 'description'), aNode = X.findOne(n => n.type === 'TEXT' && n.name === 'action');
    const title = tNode ? tNode.characters : null, desc = dNode ? dNode.characters : null, action = aNode ? aNode.characters : null;
    const descVis = dNode ? isVis(dNode, X) : false, actVis = aNode ? isVis(aNode, X) : false; const t0 = visT(X);
    const g = geoOf(X); const par = X.parent; GG = geoGuard(X);
    N = tgt.createInstance(); par.insertChild(g.idx, N);
    const rs = {}; for (const [k, v] of Object.entries(N.componentProperties)) { const b = k.replace(/#.*/, ''); if (v.type === 'BOOLEAN') { const want = b === 'Description' ? descVis : b === 'Action' ? actVis : b === 'Counter' ? !!props.Counter : v.value; if (want !== v.value) rs[k] = want; } } if (Object.keys(rs).length) N.setProperties(rs);
    const nt = N.findOne(n => n.type === 'TEXT' && n.name === 'title'); if (nt && title !== null) await setText(nt, title);
    const nd = N.findOne(n => n.type === 'TEXT' && n.name === 'description'); if (nd && desc !== null && descVis) await setText(nd, desc);
    const na = N.findOne(n => n.type === 'TEXT' && n.name === 'action'); if (na && action !== null && actVis) await setText(na, action);
    geoApply(N, g, true); N.name = 'header';
    const t1 = visT(N);
    const mv = GG.moved(N);
    if (JSON.stringify(t0) === JSON.stringify(t1) && !mv.length) { X.remove(); R.ok++; if (R.sample.length < 2) R.sample.push(N.id); } else { N.remove(); N = null; GG.repair(); R.fail.push(X.id + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '') + ' ' + esc(t0.join('|')).slice(0, 40) + '>' + esc(t1.join('|')).slice(0, 40)); }
  } catch (e) { if (N && !N.removed) { try { N.remove(); } catch (e2) {} } if (GG) { try { GG.repair(); } catch (e3) {} } R.fail.push(X.id + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
