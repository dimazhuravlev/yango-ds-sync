// Чужие коллекции в ПЕРЕОПРЕДЕЛЕНИЯХ внутри инстансов (песочницы вроде «sandbox · misha» → Constants, старые Theme):
// они держат чужие библиотеки в меню режимов проекта. 07 смотрит только свои узлы — этот рецепт смотрит вложенные.
// Цвет заливки / обводки, привязанный к коллекции не из 🌈 Стилей (или к удалённой Typography* / Constants), →
// переменная мастера на том же пути (от верхнего инстанса), а если в мастере её нет — ближайшая из Theme / Product.
// Трогает ТОЛЬКО уже переопределённые свойства (top.overrides) — иначе создаст новые переопределения (см. гочи).
// MODE 'report' → 'fix', PAGES — одна страница на вызов. Проверено 2026-10-19 на Movies (sandbox · misha).
const PAGES = null; if (!PAGES) throw new Error('PAGES: подстрока имени страницы');
const MODE = 'report';
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const OURS = ['17df014a0d', '7d07641e1f', 'e8bd5f0ef3', '498cff0363']; // Product, Theme, Typography constants, .Color constants
const COL = [['Accent colors/Primary','2614253864f5ca1361d329f89c8d6efac6323e06',[.847,.553,.988,1]],['Fill/One','a3049cdb8248b8d0608a4ea23d3d09d2fe7ca4c1',[1,1,1,1]],['Fill/Four','6f96fc6c49a5d30859577747c0a6a8a35bb2adc2',[1,1,1,.8]],['Fill/Five','9cb950892b437ea8f915a4c9dddaa787519c3d3f',[1,1,1,.6]],['Fill/Subtitle','af7aaf043131ad0549367fd4377a19f900bd34bb',[1,1,1,.5]],['Fill/Inverted','e7f2fdb15f592032455e93e139b9af7a94ed6893',[0,0,0,1]],['Surface/One','87e63293ec061298b3d1da584890ffa4de77e9ac',[0,0,0,1]]];
const cc = new Map(); const colOf = async id => { if (cc.has(id)) return cc.get(id); let r = null; try { const v = await figma.variables.getVariableByIdAsync(id); const c = v && await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId); r = c ? { c, v } : null; } catch (e) {} cc.set(id, r); return r; };
const foreign = i => !i || !OURS.some(k => i.c.key.startsWith(k)) || /^\.?Typography( Theme| Headline)?$|^Constants$/.test(i.c.name);
const pg = figma.root.children.find(p => PAGES.test(p.name)); if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync();
const R = { found: 0, fromMaster: 0, nearest: 0, notOverride: 0, map: {}, errors: [] };
const ovCache = new Map();
for (const n of pg.findAll(x => x.id.includes(';') && (Array.isArray(x.fills) || Array.isArray(x.strokes)))) {
  let top = null, a = n; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE' && !a.id.includes(';')) top = a; a = a.parent; } if (!top) continue;
  if (!ovCache.has(top.id)) ovCache.set(top.id, top.overrides || []);
  const fields = (ovCache.get(top.id).find(o => o.id === n.id) || {}).overriddenFields || [];
  for (const prop of ['fills', 'strokes']) { if (!Array.isArray(n[prop])) continue; let ch = false; const arr = [];
    for (let i = 0; i < n[prop].length; i++) { const p = n[prop][i]; const b = p.boundVariables && p.boundVariables.color; const info = b ? await colOf(b.id) : null;
      if (!b || !foreign(info)) { arr.push(p); continue; } R.found++;
      if (!fields.includes(prop)) { R.notOverride++; arr.push(p); continue; } // приходит из мастера — чинить в мастере
      const M = await top.getMainComponentAsync(); const path = []; let c = n; while (c.id !== top.id) { const par = c.parent; path.unshift(par.children.findIndex(x => x.id === c.id)); c = par; }
      let tw = M; for (const k of path) tw = tw && 'children' in tw ? tw.children[k] : null;
      const tb = tw && Array.isArray(tw[prop]) && tw[prop][i] && tw[prop][i].boundVariables && tw[prop][i].boundVariables.color;
      let target = null, how = '';
      if (tb) { const ti = await colOf(tb.id); if (!foreign(ti)) { target = ti.v; how = 'master'; } }
      if (!target) { const rgba = [p.color.r, p.color.g, p.color.b, p.opacity === undefined ? 1 : p.opacity]; let best = COL[0], bd = 9; for (const cl of COL) { const d = Math.hypot(...cl[2].map((v, j) => v - rgba[j])); if (d < bd) { bd = d; best = cl; } } target = await figma.variables.importVariableByKeyAsync(best[1]); how = 'nearest'; }
      R[how === 'master' ? 'fromMaster' : 'nearest']++; const k = esc(info ? info.c.name + '::' + info.v.name : '?') + ' -> ' + esc(target.name) + ' (' + how + ')'; R.map[k] = (R.map[k] || 0) + 1;
      arr.push(MODE === 'fix' ? { ...figma.variables.setBoundVariableForPaint(p, 'color', target), opacity: p.opacity } : p); ch = true; }
    if (ch && MODE === 'fix') { try { n[prop] = arr; } catch (e) { if (R.errors.length < 6) R.errors.push(n.id + ' ' + String(e.message || e).slice(0, 50)); } } } }
return R;
