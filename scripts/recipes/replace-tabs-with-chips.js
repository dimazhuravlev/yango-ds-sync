// Ряды табов-кнопок старых китов (`❌ Tabs` 7d2c36a6, `Navigation Tabs` e58a0307: инстанс из старых кнопок с подписями) →
// Library `chips-row` RTL=False: подписи видимых кнопок → chip 1…5 по порядку, лишние чипсы скрыты, chip 1 — `Active=on
// <BRAND>`; геометрия (позиция, ширина, видимость) старого ряда; сверка подписей; старый удаляется при успехе.
// `❌ Buttons` (8728d5ec: контейнер 40×40 с круглыми кнопками-иконками, одна видимая) → Library `button`
// Size=M • 40px, Icon=only, тип по карте кнопок, глиф свапом; позиция = контейнер + смещение кнопки.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const BRAND = 'YaPS';   // 'YaPS' | 'Yango Play'; для Allplay — что скажет пользователь
const TABS = new Set(['7d2c36a6', 'e58a0307']); const XBTN = '8728d5ec';
const CHIPS_KEY = '552e8650d0026a2e71e4e59a022bc4f020df7595'; const BTN_KEY = '2781fb17aa9a7986b89626d2e769efad4c8ade7c';
const TYPE = { primary: 'secondary', secondary: 'secondary', 'extra-2': 'secondary', inverted: 'white', 'extra-1': 'dark', plain: 'plain', 'accent Yango Play': 'accent ' + BRAND, 'accent YaPS': 'accent ' + BRAND, accent: 'accent ' + BRAND };
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const norm = s => s.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim();
const isVis = (n, root) => { let a = n; while (a && a !== root) { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const isIcon = n => n.type === 'INSTANCE' && n.mainComponent && /^icon/i.test(norm(setOf(n.mainComponent).name));
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
async function setText(t, s) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters; if (ref) { let a = t.parent; while (a && !(a.type === 'INSTANCE' && ref in a.componentProperties)) a = a.parent; if (a) { a.setProperties({ [ref]: s }); return; } } t.characters = s; }
/*@GUARD*/
function geoOf(X) { const par = X.parent; const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE'); let lsh = null, lsv = null, la = null, lg = null; try { lsh = X.layoutSizingHorizontal; lsv = X.layoutSizingVertical; la = X.layoutAlign; lg = X.layoutGrow; } catch (e) {} return { x: X.x, y: X.y, w: X.width, h: X.height, pos: X.layoutPositioning, c: X.constraints, lsh, lsv, la, lg, vis: X.visible, op: X.opacity, name: X.name, idx: par.children.findIndex(c => c.id === X.id), parentAL }; }
function geoApply(N, g, keepH) { try { if (N.layoutPositioning !== g.pos) N.layoutPositioning = g.pos; } catch (e) {} try { N.constraints = g.c; } catch (e) {} const absolute = g.pos === 'ABSOLUTE' || !g.parentAL; if (absolute) { N.x = g.x; N.y = g.y; } else { try { if (g.la) N.layoutAlign = g.la; if (g.lg) N.layoutGrow = g.lg; } catch (e) {} } const h = keepH ? N.height : g.h; try { if (g.lsh === 'FILL') { N.layoutSizingHorizontal = 'FILL'; if (Math.abs(N.height - h) > .5) N.resize(N.width, h); } else N.resize(g.w, h); if (g.lsv === 'FILL') N.layoutSizingVertical = 'FILL'; } catch (e) { try { N.resize(g.w, h); } catch (e2) {} } N.visible = g.vis; N.opacity = g.op; }
const CR = await figma.importComponentSetByKeyAsync(CHIPS_KEY); const crv = CR.children.find(c => /RTL=False/.test(c.name)) || CR.children[0];
const BS = await figma.importComponentSetByKeyAsync(BTN_KEY);
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { tabs: 0, btn: 0, fail: [], skip: [], sample: [] }; out[pg.name.replace(/^[^\wА-Яа-яЁё]+/, '').slice(0, 10)] = R;
  const targets = [];
  for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { const M = i.mainComponent; if (!M || !M.remote) continue; const k8 = setOf(M).key.slice(0, 8); if (!TABS.has(k8) && k8 !== XBTN) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (inInst) continue; targets.push([i, k8]); }
  for (const [X, k8] of targets) { let N = null, GG = null; try {
    const g = geoOf(X); const par = X.parent; GG = geoGuard(X);
    if (TABS.has(k8)) {
      const labels = X.children.filter(c => c.type === 'INSTANCE' && c.visible).map(c => { const t = c.findOne(n => n.type === 'TEXT'); return t ? t.characters.trim() : ''; }).filter(Boolean);
      if (!labels.length) { R.skip.push(X.id + ' nolabels'); continue; }
      if (labels.length > 5) { R.skip.push(X.id + ' >5 labels ' + esc(labels.join('|')).slice(0, 60)); continue; }
      N = crv.createInstance(); par.insertChild(g.idx, N);
      for (let i = 0; i < 5; i++) { const chip = N.children.find(c => c.name === 'chip ' + (i + 1)); if (!chip) continue; if (i < labels.length) { const t = chip.findOne(n => n.type === 'TEXT'); if (t) await setText(t, labels[i]); if (i === 0) { try { chip.setProperties({ Active: 'on ' + BRAND }); } catch (e) {} } } else chip.visible = false; }
      geoApply(N, g, true); N.name = 'chips-row';
      const got = N.children.filter(c => c.visible).map(c => { const t = c.findOne(n => n.type === 'TEXT'); return t ? t.characters.trim() : ''; });
      const mv = GG.moved(N);
      if (JSON.stringify(got) === JSON.stringify(labels) && !mv.length) { X.remove(); R.tabs++; if (R.sample.length < 2) R.sample.push(N.id); } else { N.remove(); N = null; GG.repair(); R.fail.push(X.id + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '') + ' chips ' + esc(labels.join('|')).slice(0, 40) + '>' + esc(got.join('|')).slice(0, 40)); }
    } else {
      const inner = X.children.filter(c => c.type === 'INSTANCE' && c.visible && c.mainComponent); if (!inner.length) { X.remove(); R.skip.push(X.id + ' empty wrapper removed'); continue; }
      const made = []; let bad = null;
      for (const b of inner) { const vp = vpOf(b.mainComponent.name); const type = TYPE[vp.Type] || 'secondary'; const vn = 'Size=M • 40px, Type=' + type + ', Icon=only, State=default'; const tgt = BS.children.find(c => c.name === vn); if (!tgt) { bad = 'novariant ' + vn; break; }
        const glyph = b.findOne(isIcon); const gm = glyph ? glyph.mainComponent : null; const n = tgt.createInstance(); par.insertChild(g.idx + made.length, n); made.push(n);
        if (gm) { const slot = n.findOne(isIcon); if (slot && slot.mainComponent.id !== gm.id) { try { slot.swapComponent(gm); } catch (e) {} } }
        const absolute = g.pos === 'ABSOLUTE' || !g.parentAL; try { if (n.layoutPositioning !== g.pos) n.layoutPositioning = g.pos; } catch (e) {} try { n.constraints = g.c; } catch (e) {} if (absolute) { n.x = g.x + b.x; n.y = g.y + b.y; } n.visible = g.vis; n.opacity = g.op; n.name = 'button';
        const ns = n.findOne(x => isIcon(x) && isVis(x, n)); if (gm && !(ns && setOf(ns.mainComponent).key === setOf(gm).key)) { bad = 'icon'; break; } }
      if (bad) { for (const n of made) n.remove(); GG.repair(); R.fail.push(X.id + ' ' + esc(bad).slice(0, 60)); } else { X.remove(); GG.repair(); R.btn += made.length; if (R.sample.length < 2) R.sample.push(made[0].id); }
    }
  } catch (e) { if (N && !N.removed) { try { N.remove(); } catch (e2) {} } if (GG) { try { GG.repair(); } catch (e3) {} } R.fail.push(X.id + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
