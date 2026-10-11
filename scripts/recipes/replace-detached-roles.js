// Отвязанные копии с переносом «по ролям» — когда структура копии не совпадает с компонентом и именной повтор
// (replace-detached-generic.js) не сходится. Новый инстанс Library встаёт на место копии (родитель, индекс, FILL или
// x/y + констрейнты, ширина), роли переносятся явно, сверка видимых текстов (и картинок); копия удаляется только при
// совпадении, иначе новый инстанс удаляется. Сначала один узел и скриншот до/после, потом пачка.
// JOB:
//  header — фрейм `header / static` (title [+ стрелка/иконка] + description) → `header` `RTL=off, type=static`:
//           заголовок, видимость и текст description, видимость action по старой стрелке. Высота станет 52.
//  promo  — фрейм `promo block` → `Promo Block` `Content=title, Platform=phone, RTL=off`: полный именной повтор +
//           описание в `meta / stack / description`, бейдж по видимости старого `top-10`, логотип и кнопки повтором.
// Добавить JOB: дамп копии и варианта Library (дети до 3 уровней), сопоставить роли, дописать блок по образцу.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const JOB = 'header';
const SKIP = new Set([]);   // id секций/экранов, которые не трогать
const SPEC = {
  header: { match: f => f.name.trim().toLowerCase() === 'header / static', setKey: '409e75f2a9132b187f7f319c51f086509406d9df', variant: { RTL: 'off', type: 'static' } },
  promo: { match: f => f.name.trim().toLowerCase() === 'promo block', setKey: '1b90a4bb24065bc2bc532acffa5ae35fac8d6aa4', variant: { Content: 'title', Platform: 'phone', RTL: 'off' } } };
figma.skipInvisibleInstanceChildren = false;
for (const f of [['YS Text', 'Bold'], ['YS Text', 'Medium'], ['YS Text', 'Regular'], ['YS Display', 'Bold'], ['Yango Text', 'Medium'], ['Yango Text', 'Bold']]) { try { await figma.loadFontAsync({ family: f[0], style: f[1] }); } catch (e) {} }
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
const isVis = (n, root) => { let a = n; while (a && a.id !== root.id && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = X => X.findAll(n => n.type === 'TEXT' && isVis(n, X)).map(t => t.characters.replace(/\s+/g, ' ').trim()).filter(Boolean).sort();
const visImg = X => X.findAll(n => 'fills' in n && Array.isArray(n.fills) && isVis(n, X)).flatMap(n => n.fills.filter(f => f.type === 'IMAGE' && f.visible !== false).map(f => f.imageHash)).sort();
const own = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE' || SKIP.has(a.id)) return false; a = a.parent; } return true; };
async function loadAll(root) { for (const t of root.findAll(n => n.type === 'TEXT')) { try { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); } catch (e) {} } }
async function setText(t, s) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters; if (ref) { let a = t.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { let pr = null; try { pr = a.componentProperties; } catch (e) {} if (pr && pr[ref]) { a.setProperties({ [ref]: s }); return; } } a = a.parent; } } t.characters = s; }
// именной повтор (как в replace-detached-generic.js)
const nm = n => { const s = n.name.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim(); return n.type === 'INSTANCE' && /^icon/.test(s) ? 'icon' : s; };
/*@GUARD*/
function walkAll(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { const k = nm(c); cnt[k] = (cnt[k] || 0) + 1; const p = path + '\u0001' + k + '#' + cnt[k]; m.set(p, c); rec(c, p); } }; rec(root, ''); return m; }
function snapAll(root) { const out = []; for (const [p, n] of walkAll(root)) { const r = { p, vis: n.visible, type: n.type }; if (n.type === 'TEXT') r.chars = n.characters; if ('fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')) r.fills = JSON.parse(JSON.stringify(n.fills.filter(f => f.type !== 'VIDEO'))); if (n.type === 'INSTANCE') { r.main = n.mainComponent; try { r.props = Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) { r.props = {}; } } out.push(r); } return out; }
async function applyProps(n, props) { let defs; try { defs = n.componentProperties; } catch (e) { return; } for (const [k, v] of Object.entries(defs)) { const b = k.replace(/#.*/, ''); if (!(b in props) || props[b] === v.value || v.type === 'INSTANCE_SWAP') continue; try { n.setProperties({ [k]: props[b] }); } catch (e) {} } }
async function replayAll(R, S) { for (let pass = 0; pass < 2; pass++) { let M = walkAll(R);
  for (const r of S) { let n = M.get(r.p); if (!n || n.removed || n.type !== 'INSTANCE' || r.type !== 'INSTANCE') continue; if (r.main && n.mainComponent && n.mainComponent.id !== r.main.id && setOf(n.mainComponent).key === setOf(r.main).key) { try { n.swapComponent(r.main); } catch (e) {} M = walkAll(R); n = M.get(r.p); if (!n) continue; } await applyProps(n, r.props); }
  M = walkAll(R);
  for (const r of S) { const n = M.get(r.p); if (!n || n.removed || n.type !== r.type) continue; if (n.visible !== r.vis && !(n.componentPropertyReferences && n.componentPropertyReferences.visible)) { try { n.visible = r.vis; } catch (e) {} } if (r.fills && 'fills' in n) { try { n.fills = r.fills; } catch (e) {} } if (r.type === 'TEXT' && n.characters !== r.chars && !(n.componentPropertyReferences && n.componentPropertyReferences.characters)) { try { await setText(n, r.chars); } catch (e) {} } } } }
const ROLES = {
  async header(F, N) { const tF = F.children.find(c => c.name === 'title'), dF = F.children.find(c => c.name === 'description'); if (!tF) return 'notitle';
    const tT = tF.type === 'TEXT' ? tF : tF.findOne(n => n.type === 'TEXT'); const dT = dF ? (dF.type === 'TEXT' ? dF : dF.findOne(n => n.type === 'TEXT')) : null;
    const descVis = !!(dT && isVis(dT, F)); const actVis = !!(tF.findOne && tF.findOne(n => n.type === 'INSTANCE' && isVis(n, F)));
    const nt = N.findOne(n => n.type === 'TEXT' && n.name === 'title'); if (nt && tT) await setText(nt, tT.characters);
    const nd = N.findOne(n => n.name === 'description' && n.type === 'FRAME'); if (nd) { nd.visible = descVis; const ndt = nd.findOne(n => n.type === 'TEXT'); if (ndt && descVis) await setText(ndt, dT.characters); }
    const na = N.findOne(n => n.name === 'action' && n.type === 'FRAME'); if (na) na.visible = actVis; return null; },
  async promo(F, N) { const S = snapAll(F); await replayAll(N, S); const om = F.findOne(n => n.name === 'meta'); const meta = N.findOne(n => n.name === 'meta'); if (!om || !meta) return 'nometa';
    const od = om.findOne(n => n.type === 'TEXT' && n.name === 'description'); const nd = meta.findOne(n => n.type === 'TEXT' && n.name === 'description'); if (nd && od) await setText(nd, od.characters);
    const ot = om.findOne(n => n.name === 'top-10'); const badge = meta.findOne(n => n.name === 'badge'); if (badge) badge.visible = !!(ot && ot.visible);
    const ol = om.findOne(n => n.type === 'INSTANCE' && /logo/.test(n.name)); const nl = meta.findOne(n => n.type === 'INSTANCE' && n.name === 'logo'); if (ol && nl) { const S2 = snapAll(ol); if (nl.mainComponent.id !== ol.mainComponent.id && setOf(nl.mainComponent).key === setOf(ol.mainComponent).key) { try { nl.swapComponent(ol.mainComponent); } catch (e) {} } await replayAll(meta.findOne(n => n.type === 'INSTANCE' && n.name === 'logo'), S2); }
    const ob = om.findOne(n => n.type === 'INSTANCE' && n.name === 'buttons'); const nb = meta.findOne(n => n.type === 'INSTANCE' && n.name === 'buttons'); if (ob && nb) await replayAll(nb, snapAll(ob)); return null; } };
const spec = SPEC[JOB]; const S0 = await figma.importComponentSetByKeyAsync(spec.setKey); const V = S0.children.find(c => { const v = vpOf(c.name); return Object.entries(spec.variant).every(([k, x]) => v[k] === x); });
if (!V) throw new Error('variant not found ' + JSON.stringify(spec.variant));
const out = { ok: [], fail: [] };
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync();
  const ids = pg.findAll(n => n.type === 'FRAME' && spec.match(n) && own(n)).map(n => n.id);
  for (const id of ids) { const F = await figma.getNodeByIdAsync(id); if (!F) continue; let N = null, GG = null; try {
    await loadAll(F); const t0 = visT(F), i0 = visImg(F); const par = F.parent, idx = par.children.findIndex(c => c.id === F.id); const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE');
    const g = { x: F.x, y: F.y, w: F.width, h: F.height, pos: F.layoutPositioning, c: F.constraints, vis: F.visible }; let lsh = null; try { lsh = F.layoutSizingHorizontal; } catch (e) {}
    GG = geoGuard(F); N = V.createInstance(); await loadAll(N); par.insertChild(idx, N);
    if (parentAL && g.pos !== 'ABSOLUTE') { try { if (lsh === 'FILL') N.layoutSizingHorizontal = 'FILL'; else N.resize(g.w, N.height); } catch (e) {} } else { if (parentAL) { try { N.layoutPositioning = 'ABSOLUTE'; } catch (e) {} } N.x = g.x; N.y = g.y; try { N.constraints = g.c; } catch (e) {} if (Math.abs(N.width - g.w) > .5) N.resize(g.w, N.height); }
    const err = await ROLES[JOB](F, N); N.visible = g.vis; N.name = JOB === 'header' ? 'header' : 'Promo Block';
    const t1 = visT(N), i1 = visImg(N); const okI = i0.every(h => i1.includes(h)) && i1.every(h => i0.includes(h));
    const mv = GG.moved(N);
    if (!err && JSON.stringify(t0) === JSON.stringify(t1) && okI && !mv.length) { F.remove(); out.ok.push(id + '>' + N.id + ' h' + Math.round(g.h) + '/' + Math.round(N.height)); }
    else { N.remove(); N = null; GG.repair(); out.fail.push(id + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '') + (err ? ' ' + err : '') + ' -' + esc(t0.filter(t => !t1.includes(t)).join('|')).slice(0, 40) + ' +' + esc(t1.filter(t => !t0.includes(t)).join('|')).slice(0, 40) + ' img ' + i0.length + '/' + i1.length); }
  } catch (e) { if (N && !N.removed) { try { N.remove(); } catch (e2) {} } if (GG) { try { GG.repair(); } catch (e3) {} } out.fail.push(id + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
