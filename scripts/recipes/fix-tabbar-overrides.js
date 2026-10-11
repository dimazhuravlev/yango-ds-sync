// Таббары, пришедшие свапом со старого кита, несут «невидимые» оверрайды: 6-й таб видим, высота мастера 102, корень
// FIXED 80. `overrides` их не показывает полностью. Лечение: resetOverrides() (только
// если среди оверрайдов нет содержательных полей), затем корень → hug по высоте, ширина как была, нижний край как был,
// констрейнты/позиционирование как были. Вариант (App / Active tab) при resetOverrides сохраняется.
const SET_KEY8 = 'd20586ba'; const APP = 'YaPS';
const SAFE = new Set(['height', 'width', 'primaryAxisSizingMode', 'counterAxisSizingMode', 'name', 'layoutPositioning', 'constraints']);
figma.skipInvisibleInstanceChildren = false;
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const tabsVis = i => { const m = i.children.find(k => /master/.test(k.name)); const tabs = m ? m.findOne(k => k.name === 'tabs') : null; return tabs ? tabs.children.filter(t => t.visible).length : null; };
const fixed = [], skipped = [];
for (const pg of figma.root.children) { await pg.loadAsync(); const ids = [];
  for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { let M; try { M = i.mainComponent; } catch (e) { continue; } if (!M || setOf(M).key.slice(0, 8) !== SET_KEY8) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (inInst) continue; let app = ''; try { app = i.componentProperties['App'].value; } catch (e) {} if (app !== APP) continue; ids.push(i.id); }
  for (const id of ids) { const i = await figma.getNodeByIdAsync(id); if (!i) continue; const P = i.parent;
    const bad = i.overrides.flatMap(o => o.overriddenFields).filter(f => !SAFE.has(f)); if (bad.length) { skipped.push(id + ' ' + [...new Set(bad)].join(',')); continue; }
    const g = { x: i.x, w: i.width, c: i.constraints, pos: i.layoutPositioning, bottom: P.height - (i.y + i.height), parentAL: P.layoutMode && P.layoutMode !== 'NONE' };
    i.resetOverrides(); try { i.primaryAxisSizingMode = 'AUTO'; } catch (e) {}
    if (Math.abs(i.width - g.w) > 0.5) i.resize(g.w, i.height);
    if (g.pos === 'ABSOLUTE' && i.layoutPositioning !== 'ABSOLUTE') { try { i.layoutPositioning = 'ABSOLUTE'; } catch (e) {} }
    if (!g.parentAL || i.layoutPositioning === 'ABSOLUTE') { i.x = g.x; i.y = P.height - i.height - Math.round(g.bottom); }
    try { i.constraints = g.c; } catch (e) {}
    fixed.push(id + ':' + Math.round(i.height) + '/' + tabsVis(i)); } }
return { fixedN: fixed.length, skipped, fixed: fixed.slice(0, 100) };
