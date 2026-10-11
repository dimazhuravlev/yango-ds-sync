// Правило: у иконки Графики вариант `Size` обязан равняться фактическому размеру фрейма иконки
// (20 → Size=20), иначе глиф ломается. Аудит делит расхождения на: inherited — так же в мастере хоста (хвост Library/
// Графики, в макете не чинить, в отчёт), override — расхождение внесено в макете (чинить setProperties
// Size=<ширина>, если такой вариант есть). Путь в мастер — по индексам детей (сравнение узлов только по id!).
// FIX=false — только отчёт. SKIP_HOST — хосты, которые не трогаем (призраки, чужие киты, дробные размеры).
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const SKIP_ROOT = new Set([]); // id секций/экранов, которые не трогать
const FIX = false; const SKIP_HOST = /^(Loginwall Background|icon \/ rating|avatars|card$|cover textbook|Yango Play icon)/;
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const sizeKey = n => { try { const e = Object.entries(n.componentProperties).find(([k, v]) => k.replace(/#.*/, '') === 'Size' && v.type === 'VARIANT'); return e ? e[0] : null; } catch (e) { return null; } };
const sizeOf = n => { const k = sizeKey(n); return k ? parseInt(String(n.componentProperties[k].value)) : null; };
const hostOf = n => { let h = null, a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') h = a; a = a.parent; } return h; };
const idxOf = x => x.parent.children.findIndex(c => c.id === x.id);
const pathFrom = (host, n) => { const p = []; let x = n; while (x && x.id !== host.id) { p.unshift(idxOf(x)); x = x.parent; } return x ? p : null; };
const follow = (root, p) => { let x = root; for (const idx of p) { if (!x || !x.children || idx < 0 || !x.children[idx]) return null; x = x.children[idx]; } return x; };
const cnt = { override: 0, inherited: 0, topLevel: 0, unknown: 0 }; const groups = {}; const todo = [];
const add = (k, id) => { const r = groups[k] || (groups[k] = { n: 0, ex: [] }); r.n++; if (r.ex.length < 2) r.ex.push(id); };
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync();
  for (const n of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { let M; try { M = n.mainComponent; } catch (e) { continue; } if (!M) continue; const S = setOf(M); if (!/^icons? \//i.test(S.name)) continue; const want = sizeOf(n); if (want === null) continue; { let a = n.parent, inIcon = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { let AM = null; try { AM = a.mainComponent; } catch (e) {} if (AM && /^icons? \//i.test(setOf(AM).name)) { inIcon = true; break; } } a = a.parent; } if (inIcon) continue; } // внутренний 48-вариант малой иконки (union) — не ошибка, setProperties на нём даёт cycle const w = Math.round(n.width); if (want === w) continue; { let a = n.parent, sk = false; while (a && a.type !== 'PAGE') { if (SKIP_ROOT.has(a.id)) { sk = true; break; } a = a.parent; } if (sk) continue; }
    const host = hostOf(n); const key = want + '->' + w + ' ' + esc(S.name).slice(0, 22);
    if (!host) { cnt.topLevel++; add('top-level ' + key, n.id); continue; }
    let hm; try { hm = host.mainComponent; } catch (e) { hm = null; } const p = hm ? pathFrom(host, n) : null; const mn = p ? follow(hm, p) : null;
    if (!mn || mn.type !== 'INSTANCE') { cnt.unknown++; add('unknown(variant swapped) ' + key + ' host=' + esc(setOf(hm || M).name).slice(0, 20), n.id); continue; }
    if (sizeOf(mn) === want && Math.round(mn.width) === w) { cnt.inherited++; add('inherited ' + esc(setOf(hm).name).slice(0, 24) + ' :: ' + key, n.id); continue; }
    cnt.override++; add('override ' + esc(setOf(hm).name).slice(0, 24) + ' :: ' + key, n.id);
    if (FIX && !SKIP_HOST.test(setOf(hm).name) && w === Math.round(n.height) && S.type === 'COMPONENT_SET' && S.children.some(c => new RegExp('(^|, )Size=' + w + '(,|$)').test(c.name))) todo.push(n.id); } }
const fixed = [], failed = [];
for (const id of todo) { const n = await figma.getNodeByIdAsync(id); if (!n) continue; const w = Math.round(n.width); try { n.setProperties({ [sizeKey(n)]: String(w) }); const n2 = await figma.getNodeByIdAsync(id); (sizeOf(n2) === w ? fixed : failed).push(id); } catch (e) { failed.push(id + ' ' + String(e).slice(0, 50)); } }
return { cnt, fixedN: fixed.length, failed: failed.slice(0, 10), groups: Object.entries(groups).sort((a, b) => b[1].n - a[1].n).slice(0, 50).map(([k, r]) => k + ' x' + r.n + ' ' + r.ex.join(',')) };
