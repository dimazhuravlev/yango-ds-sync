// Цвета на удалённой коллекции `.Accents` (Music, Movies, Watch, Games… — по продукту) → `Product` «Accent colors/Primary».
// Почему: коллекции больше нет, вместо продуктовых акцентов один «Accent colors/Primary» с режимами бренда (Yango Play EN/AR
// = #a332ff, YaPS & Allplay = #d88dfc). Слой на `.Accents` не переключается брендом и держит мёртвую коллекцию.
// Сверка значения: старое (по цепочке алиасов) против «Accent colors/Primary» в режиме `Product` самого слоя:
//  same — совпадает → менять; brandShift — совпадает в другом бренде (например, мастер ДС на холсте в YaPS & Allplay,
//  а потребители в Yango Play) → менять только с BRAND_SHIFT = true (решение владельца ДС, как в примере 592:6513 ДС
//  Платформа); differs — не совпадает ни в одном бренде → в предложения со ссылками, не трогать.
// Свои слои — всегда; вложенные — только уже переопределённые свойства (top.overrides), иначе лишние переопределения;
// вложенные из мастера — чинятся в мастере (в файле ДС; в проекте — хвост ДС, в отчёт). Локальные стили заливки — тоже.
// Файлы ДС первыми (ДС Платформа → публикация → проекты «Update all»), потом проекты. MODE 'report' → 'fix', PAGES —
// одна страница на вызов (null в 'report' — весь файл). Проверено 2026-10-20: ДС Платформа, Графика, Movies, Music.
const PAGES = null; const MODE = 'report'; const BRAND_SHIFT = false;
const FILE = ''; // fileKey — для ссылок в отчёте
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') + (c.a !== undefined && c.a < 0.999 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '');
const link = id => 'https://www.figma.com/design/' + FILE + '/?node-id=' + id.replace(/^I/, '').replace(/;.*/, '').replace(/:/g, '-');
const T = await figma.variables.importVariableByKeyAsync('2614253864f5ca1361d329f89c8d6efac6323e06'); // Product · Accent colors/Primary
const TC = await figma.variables.getVariableCollectionByIdAsync(T.variableCollectionId);
const cc = new Map(); const col = async id => { if (cc.has(id)) return cc.get(id); let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(id); } catch (e) {} cc.set(id, c); return c; };
const valOf = async (v, depth = 0) => { if (!v || depth > 6) return null; const c = await col(v.variableCollectionId); const m = c ? c.defaultModeId : Object.keys(v.valuesByMode)[0]; const x = v.valuesByMode[m] || Object.values(v.valuesByMode)[0];
  if (x && x.type === 'VARIABLE_ALIAS') { let a = null; try { a = await figma.variables.getVariableByIdAsync(x.id); } catch (e) {} return valOf(a, depth + 1); } return x && x.r !== undefined ? hex(x) : null; };
const tVals = {}; for (const m of TC.modes) { const x = T.valuesByMode[m.modeId]; tVals[m.name] = x && x.type === 'VARIABLE_ALIAS' ? await valOf(await figma.variables.getVariableByIdAsync(x.id)) : x && x.r !== undefined ? hex(x) : null; }
const vc = new Map(); const oldInfo = async id => { if (vc.has(id)) return vc.get(id); let r = null; try { const v = await figma.variables.getVariableByIdAsync(id); const c = v && await col(v.variableCollectionId);
  if (v && c && (/^\.?Accents$/.test(c.name) || c.key.startsWith('0f269755c0'))) r = { name: esc(c.name) + '::' + esc(v.name), val: await valOf(v) }; } catch (e) {} vc.set(id, r); return r; };
const verdict = (old, node) => { let cur = null; try { cur = hex(T.resolveForConsumer(node).value); } catch (e) {}
  if (old && cur === old) return 'same'; if (old && Object.values(tVals).includes(old)) return 'brandShift'; return 'differs'; };
const R = { target: tVals, same: 0, brandShift: 0, differs: 0, fromMaster: 0, styles: 0, fixed: 0, byVar: {}, proposals: [], brandShiftEx: [], fromMasterEx: [], errors: [] };
const pages = figma.root.children.filter(p => !PAGES || PAGES.test(p.name));
if (MODE === 'fix' && pages.length !== 1) throw new Error('fix — одна страница на вызов (PAGES)');
const ovCache = new Map(); const overridden = (n, prop) => { if (!n.id.includes(';')) return true; let top = null, a = n; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE' && !a.id.includes(';')) top = a; a = a.parent; } if (!top) return true;
  if (!ovCache.has(top.id)) ovCache.set(top.id, top.overrides || []); return ((ovCache.get(top.id).find(o => o.id === n.id) || {}).overriddenFields || []).includes(prop); };
const doPaints = async (owner, prop, node) => { const arr = owner[prop]; if (!Array.isArray(arr)) return; let ch = false; const out = [];
  for (const p of arr) { const b = p.boundVariables && p.boundVariables.color; const info = b ? await oldInfo(b.id) : null; if (!info) { out.push(p); continue; }
    if (node && !overridden(node, prop)) { R.fromMaster++; if (R.fromMasterEx.length < 5) R.fromMasterEx.push(link(node.id)); out.push(p); continue; }
    const vd = verdict(info.val, node || figma.currentPage); R[vd]++; const k = info.name + ' ' + info.val; R.byVar[k] = (R.byVar[k] || 0) + 1;
    if (vd === 'differs' && R.proposals.length < 10) R.proposals.push((node ? link(node.id) : 'style ' + esc(owner.name)) + ' ' + info.name + ' ' + info.val);
    if (vd === 'brandShift' && R.brandShiftEx.length < 5) R.brandShiftEx.push(node ? link(node.id) : 'style ' + esc(owner.name));
    const go = MODE === 'fix' && (vd === 'same' || (vd === 'brandShift' && BRAND_SHIFT));
    if (go) { out.push({ ...figma.variables.setBoundVariableForPaint(p, 'color', T), opacity: p.opacity === undefined ? 1 : p.opacity }); ch = true; } else out.push(p); }
  if (ch) { try { owner[prop] = out; R.fixed++; } catch (e) { if (R.errors.length < 6) R.errors.push((node ? node.id : esc(owner.name)) + ' ' + String(e.message || e).slice(0, 60)); } } };
for (const ps of await figma.getLocalPaintStylesAsync()) { const before = R.same + R.brandShift + R.differs; await doPaints(ps, 'paints', null); R.styles += R.same + R.brandShift + R.differs - before; }
for (const pg of pages) { if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync(); ovCache.clear();
  for (const n of pg.findAll(x => Array.isArray(x.fills) || Array.isArray(x.strokes))) for (const prop of ['fills', 'strokes']) await doPaints(n, prop, n); }
return R;
