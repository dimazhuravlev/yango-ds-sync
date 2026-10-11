// 07 — переменные: найти привязки к неактуальным коллекциям на СВОИХ узлах страницы (не внутри инстансов — там это
// дело мастера) и, если задан REBIND, перепривязать на двойник. Актуальные коллекции — references/sources.md.
// Двойник брать из опубликованных: коллекции с точкой (`.Color constants`, `.Typography`) скрыты от публикации —
// их переменные по ключу не импортируются, берётся семантическая из `Theme` с тем же значением в рабочем режиме
// (пример: `Constants / Monochome/Black` → `Theme / Surface/One`, чёрный в Dark). Если двойник меняет значение
// в другом режиме (Light) — сказать в отчёте.
// ВАЖНО: figma.variables.getVariableByIdAsync, а не figma.getVariableByIdAsync (вернёт null на всё).
const PAGE = 'Mobile';
const ACTUAL = ['498cff0363', '7d07641e1f', 'e8bd5f0ef3', '51357d01b2', '17df014a0d', '0f269755c0', '6924cc6910', 'b935c76824']; // 10 символов ключа коллекции
const REBIND = {};   // { 'Имя коллекции / имя переменной': 'ключ переменной-двойника' } — пусто = только отчёт
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const p = figma.root.children.find(x => x.name.includes(PAGE)); await p.loadAsync();
const vc = new Map(); async function V(id) { if (vc.has(id)) return vc.get(id); let r = null; try { const v = await figma.variables.getVariableByIdAsync(id); if (v) { const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId); r = { label: (c ? c.name : '?') + ' / ' + v.name, ck: c ? (c.key || '').slice(0, 10) : '?' }; } } catch (e) {} vc.set(id, r); return r; }
const own = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return false; a = a.parent; } return true; };
const found = {}, done = [];
const targets = {}; for (const [k, key] of Object.entries(REBIND)) targets[k] = await figma.variables.importVariableByKeyAsync(key);
for (const n of p.findAll(n => own(n) && n.boundVariables && Object.keys(n.boundVariables).length)) {
  for (const [field, v] of Object.entries(n.boundVariables)) { for (const x of (Array.isArray(v) ? v : [v])) { if (!x || !x.id) continue; const r = await V(x.id); if (!r || ACTUAL.includes(r.ck)) continue;
    const k = esc(r.label) + ' (' + field + ')'; const e = found[k] || (found[k] = { n: 0, ex: [] }); e.n++; if (e.ex.length < 3) e.ex.push(n.id);
    const tg = targets[r.label]; if (!tg) continue;
    if (field === 'fills' || field === 'strokes') { n[field] = n[field].map(pt => pt.boundVariables && pt.boundVariables.color && pt.boundVariables.color.id === x.id ? figma.variables.setBoundVariableForPaint(pt, 'color', tg) : pt); done.push(n.id + ' ' + field); }
    else { try { n.setBoundVariable(field, tg); done.push(n.id + ' ' + field); } catch (err) { done.push('FAIL ' + n.id + ' ' + field); } } } } }
return { found, done };
