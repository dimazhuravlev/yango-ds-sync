// 03 — перепись неактуальных компонентов на странице. Read-only. Собирать через build.py (подставит ключи).
// Актуально: 🫟 Library, 🦄 Графика, 🦄 Органайзер (keys/*.txt). Всё остальное — кандидат на замену, в том числе
// системные компоненты из неактуальных ДС (❌ status-bar / ios Платформы → Library status-bar / ios): помечены [sys].
// Считается внешний неактуальный инстанс (вложенные в него не считаются). Контекст:
//   screen  — стоит на экране;  master — внутри локального мастера;  inLocal — внутри инстанса локального компонента;
//   inLib   — внутри инстанса Library (хвост мастера ДС — чинится в Library, не в проекте).
// Отдельно: stalePrivate — приватные `. /` компоненты Library, стоящие на экране сами по себе: при «принять
// обновления» не обновляются, их освежают через публичного родителя (04-swap-namepath, ключ `via:`).
// dead — ключ не импортируется (мастер удалён): заменить можно только с согласия пользователя.
// detached — фреймы с именем компонента ДС (отвязанные копии: «header / static», «Badge», «carousel / Movies»,
//   «icon / like»). Свап невозможен — заменить новым инстансом на том же месте (references/twins.md, «Отвязанные копии»).
const PAGES = ['Mobile']; // подстроки имён страниц; несколько страниц — один вызов (loadAsync не переключает страницу)
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const LC = /*@LC*/, GR = /*@GR*/, ORG = /*@ORG*/;
const NAMES = new Set(/*@NAMES*/); const GR_NAME = /^(icon|nameplates|graphics|movies|logo|partner|channel|userpics|yango play icon) ?\//;
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const isSysName = name => /iOS|ios|android|Android|keyboard|status-bar|home-indicator|alerts|action-sheet|pip \/|Dynamic Island|Status Bar/.test(name || '');
// ❌ в имени = легаси, даже если компонент лежит в Library.
const actual = S => { const k = S.key || ''; if (/❌/.test(S.name)) return false; return LC.has(k.slice(0, 8)) || GR.has(k.slice(0, 10)) || ORG.has(k.slice(0, 8)); };
const ALL = {}; for (const PAGE of PAGES) { ALL[PAGE] = await (async () => {
const p = figma.root.children.find(x => x.name.includes(PAGE)); await p.loadAsync();
const src = {}, stale = {}, nestedMains = {}; // nestedMains: свежие версии приватных мастеров (внутри инстансов Library)
for (const i of p.findAllWithCriteria({ types: ['INSTANCE'] })) {
  const M = i.mainComponent; if (!M || !M.remote) continue; const S = setOf(M);
  let a = i.parent, host = 'screen', skip = false, inInst = false;
  while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; const H = a.mainComponent; if (H && H.remote && !actual(setOf(H))) { skip = true; break; } if (host === 'screen') host = H && H.remote ? 'inLib' : 'inLocal'; } if (a.type === 'COMPONENT' && host === 'screen') host = 'master'; a = a.parent; }
  if (skip) continue;
  if (actual(S)) { const priv = /^\s*\.\s*\//.test(S.name) && LC.has(S.key.slice(0, 8)); if (priv && inInst && host === 'inLib') (nestedMains[S.key] = nestedMains[S.key] || new Set()).add(S.id); // сравниваем узел сета: у устаревшей копии он другой
    if (priv && !inInst) { const r = stale[S.key] || (stale[S.key] = { name: esc(S.name.trim()).slice(0, 36), list: [] }); r.list.push([i.id, S.id]); } continue; }
  const k = S.key.slice(0, 8) + ' ' + esc(S.name.trim()).slice(0, 36) + (isSysName(S.name) ? ' [sys]' : '');
  const r = src[k] || (src[k] = { key: S.key, n: 0, w: {}, ids: [] }); r.n++; r.w[host] = (r.w[host] || 0) + 1; if (r.ids.length < 4) r.ids.push(i.id + (i.visible ? '' : '(h)'));
}
// отвязанные копии: свои фреймы/группы с именем компонента ДС; inCopy — сколько из них внутри другой копии (ложные
// срабатывания возможны: слой «header» с тем же именем — смотреть глазами)
const norm = s => s.replace(/❌/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const det = {}; const ownNode = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return false; a = a.parent; } return true; };
const isCopy = n => (n.type === 'FRAME' || n.type === 'GROUP') && (NAMES.has(norm(n.name)) || GR_NAME.test(norm(n.name)));
for (const n of p.findAll(n => isCopy(n) && ownNode(n))) { let a = n.parent, inner = false; while (a && a.type !== 'PAGE') { if (isCopy(a)) { inner = true; break; } a = a.parent; }
  const k = norm(n.name); const r = det[k] || (det[k] = { n: 0, inCopy: 0, ids: [] }); r.n++; if (inner) r.inCopy++; if (r.ids.length < 4) r.ids.push(n.id + (n.visible ? '' : '(h)')); }
const rows = [];
for (const [k, r] of Object.entries(src).sort((a, b) => b[1].n - a[1].n)) {
  let alive = 'dead'; try { await figma.importComponentSetByKeyAsync(r.key); alive = 'alive'; } catch (e) { try { await figma.importComponentByKeyAsync(r.key); alive = 'alive'; } catch (e2) {} }
  rows.push(k + ' x' + r.n + ' ' + alive + ' ' + JSON.stringify(r.w) + ' ' + r.ids.join(','));
}
// приватный на экране: stale — его мастер не совпадает со свежим (из инстансов Library на странице); unknown — сравнить не с чем
const stalePrivate = Object.entries(stale).map(([k, r]) => { const fresh = nestedMains[k]; const st = fresh ? r.list.filter(([, m]) => !fresh.has(m)) : null;
  return k.slice(0, 8) + ' ' + r.name + ' x' + r.list.length + (st ? ' stale=' + st.length + ' ' + st.slice(0, 4).map(x => x[0]).join(',') : ' unknown ' + r.list.slice(0, 4).map(x => x[0]).join(',')); });
return { foreign: rows, stalePrivate, detached: Object.entries(det).sort((a, b) => b[1].n - a[1].n).map(([k, r]) => esc(k) + ' x' + r.n + (r.inCopy ? ' (inCopy ' + r.inCopy + ')' : '') + ' ' + r.ids.join(',')) };
})(); }
return PAGES.length === 1 ? ALL[PAGES[0]] : ALL;
