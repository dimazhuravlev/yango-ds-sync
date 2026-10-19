// Мёртвые чипсы чужого кита (`chips` d36e1806: State=default|active, внутри `. / chips / master` с label/counter/иконкой) →
// ДС Платформа `chips` 3ee666c7 `Type=default, RTL=off, Cross=off, Icon=false`, `Active` по карте (default → off, active →
// on <BRAND>); подпись — текст label; геометрия (позиция, FILL, видимость). Внешние инстансы на экранах и внутри локальных
// мастеров (инстансы мастера подтянутся сами). Сверка подписи; старый удаляется при успехе.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const FROM = 'd36e1806'; const KEY = '3ee666c709ef3cbd1f7d527bc952e226205d8a4b';
const BRAND = 'YaPS';   // 'YaPS' | 'Yango Play' — активный чипс бренда; для Allplay — что скажет пользователь
const ACTIVE = { default: 'off', active: 'on ' + BRAND };
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const isVis = (n, root) => { let a = n; while (a && a.id !== root.id && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
const findVariant = (set, want) => set.children.find(c => { const v = vpOf(c.name); return Object.keys(want).every(k => v[k] === want[k]); });
async function setText(t, s) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters; if (ref) { let a = t.parent; while (a && !(a.type === 'INSTANCE' && ref in a.componentProperties)) a = a.parent; if (a) { a.setProperties({ [ref]: s }); return; } } t.characters = s; }
/*@GUARD*/
function geoOf(X) { const par = X.parent; const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE'); let lsh = null, lsv = null, la = null, lg = null; try { lsh = X.layoutSizingHorizontal; lsv = X.layoutSizingVertical; la = X.layoutAlign; lg = X.layoutGrow; } catch (e) {} return { x: X.x, y: X.y, w: X.width, h: X.height, pos: X.layoutPositioning, c: X.constraints, lsh, lsv, la, lg, vis: X.visible, op: X.opacity, name: X.name, idx: par.children.indexOf(X), parentAL }; }
function geoApply(N, g, keepW) { try { if (N.layoutPositioning !== g.pos) N.layoutPositioning = g.pos; } catch (e) {} try { N.constraints = g.c; } catch (e) {} const absolute = g.pos === 'ABSOLUTE' || !g.parentAL; if (absolute) { N.x = g.x; N.y = g.y; } else { try { if (g.la) N.layoutAlign = g.la; if (g.lg) N.layoutGrow = g.lg; } catch (e) {} } try { if (g.lsh === 'FILL') N.layoutSizingHorizontal = 'FILL'; else if (!keepW) N.resize(g.w, N.height); if (g.lsv === 'FILL') N.layoutSizingVertical = 'FILL'; } catch (e) {} N.visible = g.vis; N.opacity = g.op; }
const set = await figma.importComponentSetByKeyAsync(KEY);
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { ok: 0, fail: [], skip: [], sample: [] }; out[pg.name.replace(/^[^\wА-Яа-яЁё]+/, '').slice(0, 10)] = R;
  const targets = [];
  for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { let M = null; try { M = i.mainComponent; } catch (e) { continue; } if (!M || !M.remote || setOf(M).key.slice(0, 8) !== FROM) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (inInst) continue; targets.push(i.id); }
  for (const id of targets) { const X = await figma.getNodeByIdAsync(id); if (!X) continue; let N = null, GG = null; try {
    const vp = vpOf(X.mainComponent.name); const active = ACTIVE[vp.State || 'default'] || 'off';
    const tgt = findVariant(set, { Type: 'default', RTL: 'off', Active: active, Cross: 'off', Icon: 'false' }); if (!tgt) { R.skip.push(id + ' novariant ' + active); continue; }
    const lab = X.findOne(n => n.type === 'TEXT' && n.name === 'label') || X.findOne(n => n.type === 'TEXT' && isVis(n, X)); const label = lab ? lab.characters : null;
    const g = geoOf(X); const par = X.parent; GG = geoGuard(X);
    N = tgt.createInstance(); par.insertChild(g.idx, N);
    const nl = N.findOne(n => n.type === 'TEXT'); if (nl && label !== null) await setText(nl, label);
    geoApply(N, g, true); N.name = 'chips';
    const got = N.findOne(n => n.type === 'TEXT' && isVis(n, N));
    const mv = GG.moved(N);
    if ((label === null || (got && got.characters === label)) && !mv.length) { X.remove(); R.ok++; if (R.sample.length < 2) R.sample.push(N.id); } else { N.remove(); N = null; GG.repair(); R.fail.push(id + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '') + ' text ' + esc(label || '').slice(0, 20) + '>' + esc(got ? got.characters : '-').slice(0, 20)); }
  } catch (e) { if (N && !N.removed) { try { N.remove(); } catch (e2) {} } if (GG) { try { GG.repair(); } catch (e3) {} } R.fail.push(id + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
