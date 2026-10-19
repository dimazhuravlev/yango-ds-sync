// Файлы ДС (ДС Платформа, Графика, Органайзер) и проекты: привязки к СТАРЫМ версиям коллекций 🌈 Стилей → актуальные.
// Почему: переменная, которую в Стилях удалили или пересоздали (новый ключ), не переезжает при «Update all» — слой
// остаётся на старой версии коллекции навсегда. Старая версия Product в файле = опции с (i)/(!) в переключателе режимов
// у всех потребителей (Allplay, Yango Play AR); старая Theme / Typography тянется в проекты через мастера.
// Куда вести: тот же ключ в актуальной версии → то же имя → MAP (удалённые переменные) → удалённые Typography* /
// Constants по имени (как в rebind-typography-vars.js) → иначе unmapped (в отчёт, спросить владельца ДС).
// Актуальная версия — что отдаёт importVariableByKeyAsync по ключу из teamLibrary (в самих Стилях — локальные).
// .Color constants скрыта от публикации и не импортируется: прямые привязки к её старой версии — только в отчёт.
// NESTED = false — свои слои (сначала); true — переопределения внутри инстансов (после того как мастера поправлены и
// опубликованы, иначе создаст лишние переопределения). MODE 'report' → 'fix'. RANGE — страницы [от, до).
// Проверено 2026-10-19: ДС Платформа, Графика, Органайзер.
const RANGE = [0, 100]; const MODE = 'report'; const NESTED = false;
const MAP = { 'Theme::Accent/Primary': ['prod', 'Accent colors/Primary'], 'Theme::Accent/Secondary': ['prod', 'Accent colors/Primary'] };
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const KEYS = { prod: '17df014a0d', theme: '7d07641e1f', tc: 'e8bd5f0ef3' };
const CUR = {}; for (const k of Object.keys(KEYS)) CUR[k] = { id: null, byKey: new Map(), byName: new Map() };
const locals = await figma.variables.getLocalVariableCollectionsAsync();
for (const [k, key] of Object.entries(KEYS)) { const lc = locals.find(c => c.key.startsWith(key)); if (!lc) continue; CUR[k].id = lc.id; for (const id of lc.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); const e = { key: v.key, v }; CUR[k].byKey.set(v.key, e); CUR[k].byName.set(v.name, e); } }
if (Object.values(CUR).some(c => !c.id)) { const libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (const [k, key] of Object.entries(KEYS)) { if (CUR[k].id) continue; const lc = libs.find(c => c.key.startsWith(key)); if (!lc) throw new Error('нет доступа к ' + k + ' из 🌈 Стили');
    for (const lv of await figma.teamLibrary.getVariablesInLibraryCollectionAsync(lc.key)) { const e = { key: lv.key, v: null }; CUR[k].byKey.set(lv.key, e); CUR[k].byName.set(lv.name, e); }
    const first = CUR[k].byKey.values().next().value; first.v = await figma.variables.importVariableByKeyAsync(first.key); CUR[k].id = first.v.variableCollectionId; } }
const get = async e => { if (!e.v) e.v = await figma.variables.importVariableByKeyAsync(e.key); return e.v; };
const cc = new Map(); const col = async id => { if (cc.has(id)) return cc.get(id); let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(id); } catch (e) {} cc.set(id, c); return c; };
const isCur = c => Object.values(CUR).some(x => x.id === c.id);
// цель для переменной старой версии / удалённой коллекции; null — не трогать, 'unmapped' — в отчёт
const tc = new Map();
const targetOf = async v => { if (tc.has(v.id)) return tc.get(v.id); let r = null; const c = await col(v.variableCollectionId);
  if (c && !isCur(c)) { const k = Object.keys(KEYS).find(x => c.key.startsWith(KEYS[x])); const label = esc(c.name) + '::' + esc(v.name);
    let e = null, how = null;
    if (k) { e = CUR[k].byKey.get(v.key); how = e && 'key'; if (!e) { e = CUR[k].byName.get(v.name) || (k === 'tc' && CUR.tc.byName.get('Font/' + v.name)); how = e && 'name'; } }
    if (!e && !k && /^Typography constants$/.test(c.name)) { e = CUR.tc.byName.get(v.name) || CUR.tc.byName.get('Font/' + v.name); how = e && 'name'; } // старая TC Library (6924cc6910)
    if (!e && MAP[esc(c.name) + '::' + v.name]) { const [mk, mn] = MAP[esc(c.name) + '::' + v.name]; e = CUR[mk].byName.get(mn); how = e && 'map'; }
    if (!e && /^\.?Typography( Theme| Headline)?$|^Constants$/.test(c.name)) { const nm = v.name === 'Font Family' ? (/Headline/.test(c.name) ? 'Font Family/Headline' : 'Font Family/Text') : v.name; e = CUR.prod.byName.get(nm) || CUR.tc.byName.get(nm); how = e && 'removed'; }
    if (k || /^\.?Typography|^Constants$|^\.?Color constants$/.test(c.name)) r = e ? { e, label, how } : { label, how: 'unmapped' }; }
  tc.set(v.id, r); return r; };
const R = { nodes: 0, plan: {}, unmapped: {}, fixed: 0, errors: [], ex: [] };
const note = (t, n) => { const k = t.label + ' -> ' + (t.how === 'unmapped' ? '?' : t.how); if (t.how === 'unmapped') { R.unmapped[t.label] = (R.unmapped[t.label] || 0) + 1; if (R.ex.length < 6) R.ex.push(n.id + ' ' + t.label); } else R.plan[k] = (R.plan[k] || 0) + 1; };
if (MODE === 'fix') for (const f of [['Yango Text','Medium'],['Yango Text','Bold'],['Yango Text','Regular'],['Yango Group Headline','ExtraBold'],['YS Text','Medium'],['YS Text','Bold'],['YS Text','Regular'],['YS Display','Bold']]) { try { await figma.loadFontAsync({ family: f[0], style: f[1] }); } catch (e) {} }
const PAINT = ['fills', 'strokes'];
for (const pg of figma.root.children.slice(RANGE[0], RANGE[1])) { if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync();
  for (const n of pg.findAll(x => NESTED ? x.id.includes(';') : !x.id.includes(';'))) { R.nodes++;
    // краски
    for (const prop of PAINT) { if (!Array.isArray(n[prop])) continue; let ch = false; const arr = [];
      for (const p of n[prop]) { const b = p.boundVariables && p.boundVariables.color; let np = p; if (b) { const v = await figma.variables.getVariableByIdAsync(b.id); const t = v && await targetOf(v); if (t) { note(t, n); if (MODE === 'fix' && t.e) { np = figma.variables.setBoundVariableForPaint(p, 'color', await get(t.e)); if (p.opacity !== undefined) np.opacity = p.opacity; ch = true; } } } arr.push(np); }
      if (ch) { try { n[prop] = arr; R.fixed++; } catch (e) { if (R.errors.length < 8) R.errors.push(n.id + ' ' + prop + ' ' + String(e.message || e).slice(0, 50)); } } }
    // прочие поля (типографика, размеры, отступы, радиусы)
    const bv = n.boundVariables || {};
    for (const f of Object.keys(bv)) { if (PAINT.includes(f) || f === 'effects' || f === 'componentProperties') continue; const refs = Array.isArray(bv[f]) ? bv[f] : [bv[f]]; const ids = [...new Set(refs.filter(x => x && x.id).map(x => x.id))]; if (ids.length !== 1) continue;
      const v = await figma.variables.getVariableByIdAsync(ids[0]); const t = v && await targetOf(v); if (!t) continue; note(t, n);
      if (MODE === 'fix' && t.e) { const fn0 = n.type === 'TEXT' && n.fontName !== figma.mixed ? n.fontName : null; try { if (fn0) { for (const fnt of n.getRangeAllFontNames(0, n.characters.length)) await figma.loadFontAsync(fnt); } n.setBoundVariable(f, await get(t.e)); R.fixed++; } catch (e) { if (R.errors.length < 8) R.errors.push(n.id + ' ' + f + ' ' + String(e.message || e).slice(0, 50)); try { if (fn0 && n.fontName !== figma.mixed && n.fontName.style !== fn0.style) n.fontName = { family: n.fontName.family, style: fn0.style }; } catch (e2) {} } } } } }
return R;
