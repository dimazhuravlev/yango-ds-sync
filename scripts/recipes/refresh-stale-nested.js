// Вложенные инстансы на СТАРЫХ версиях компонентов ДС → тот же вариант свежей версии (swapComponent).
// Почему: «Update all» обновляет инстанс верхнего уровня, но вложенный, у которого в проекте выбран другой вариант
// (поиск в состоянии typing, вариант плашки, кнопки внутри title), остаётся копией старой публикации — со старыми
// стилями и переменными. Это держит старые версии коллекций (опции с (i) в режимах Product) и старый вид.
// Свежая версия: публичный компонент — importComponentSetByKeyAsync; приватный («. / …») — сет из свежего мастера
// верхнего уровня. Вариант — по имени, иначе по совпадению свойств. Берёт только вложенные, чья старая версия тянет
// старые Product / Typography (ONLY_OLD_REFS) — остальное не трогает. Снаружи внутрь, до 3 проходов.
// Проверка на каждой замене: тексты (мультимножество) и видимость, размер; расхождение — откат на старый мастер.
// Запуск: одна страница на вызов (PAGES), MODE 'report' → 'fix'. Проверено 2026-10-19 на Movies.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Search/"');
const MODE = 'report'; const ONLY_OLD_REFS = true;
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const curProd = (await figma.variables.importVariableByKeyAsync('2614253864f5ca1361d329f89c8d6efac6323e06')).variableCollectionId;
const cc = new Map(); const col = async id => { if (cc.has(id)) return cc.get(id); let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(id); } catch (e) {} cc.set(id, c); return c; };
const isOld = c => !!c && ((c.key.startsWith('17df014a0d') && c.id !== curProd) || /^\.?Typography( Theme| Headline)?$|^Constants$/.test(c.name));
const refsIn = o => { const ids = []; const walk = x => { if (!x || typeof x !== 'object') return; if (Array.isArray(x)) { x.forEach(walk); return; } if (x.type === 'VARIABLE_ALIAS' && x.id) { ids.push(x.id); return; } for (const k of Object.keys(x)) walk(x[k]); }; walk(o); return ids; };
const vc = new Map(); const varOld = async id => { if (vc.has(id)) return vc.get(id); let r = false; try { const v = await figma.variables.getVariableByIdAsync(id); r = !!v && isOld(await col(v.variableCollectionId)); } catch (e) {} vc.set(id, r); return r; };
const sc = new Map(); const styleOld = async id => { if (!id || typeof id !== 'string') return false; if (sc.has(id)) return sc.get(id); let r = false; try { const s = await figma.getStyleByIdAsync(id); if (s) for (const i of refsIn(s.boundVariables || {})) if (await varOld(i)) { r = true; break; } } catch (e) {} sc.set(id, r); return r; };
const oc = new Map(); const hasOld = async M => { if (oc.has(M.id)) return oc.get(M.id); let r = false;
  for (const t of [M, ...M.findAll(() => true)]) { if (t.type === 'TEXT') { const sid = t.textStyleId; if (typeof sid === 'string' && await styleOld(sid)) { r = true; break; } } for (const i of refsIn(t.boundVariables || {})) if (await varOld(i)) { r = true; break; } if (r) break; }
  oc.set(M.id, r); return r; };
const pg = figma.root.children.find(p => PAGES.test(p.name)); if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync();
const mc = new Map(); const mainOf = async i => { if (mc.has(i.id)) return mc.get(i.id); let m = null; try { m = await i.getMainComponentAsync(); } catch (e) {} mc.set(i.id, m); return m; };
// свежие сеты
const fresh = new Map(); const tried = new Set();
const indexNested = async F => { for (const i of F.findAllWithCriteria({ types: ['INSTANCE'] })) { const m = await mainOf(i); if (m && m.remote) { const s = setOf(m); if (s.key && !fresh.has(s.key)) fresh.set(s.key, s); } } };
const freshOf = async M => { const S = setOf(M); const k = S.key; if (fresh.has(k)) return fresh.get(k); if (tried.has(k)) return null; tried.add(k); let F = null;
  try { F = S.type === 'COMPONENT_SET' ? await figma.importComponentSetByKeyAsync(k) : await figma.importComponentByKeyAsync(k); } catch (e) {}
  if (F) { fresh.set(k, F); await indexNested(F); } return F; };
for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { if (i.id.includes(';')) continue; const M = await mainOf(i); if (M && M.remote) await freshOf(M); }
const propsOf = name => Object.fromEntries(name.split(',').map(x => x.trim().split('=')).filter(x => x.length === 2).map(([a, b]) => [a.trim(), b.trim()]));
const pickVariant = (F, M) => { if (F.type !== 'COMPONENT_SET') return F; const same = F.children.find(c => c.name === M.name); if (same) return same; const p = propsOf(M.name); const keys = Object.keys(F.children[0] ? propsOf(F.children[0].name) : {}); const cand = F.children.filter(c => { const q = propsOf(c.name); return keys.every(k => !(k in p) || q[k] === p[k]); }); return cand.length === 1 ? cand[0] : null; };
const textsOf = n => n.findAll(t => t.type === 'TEXT').map(t => t.characters + '|' + t.visible).sort().join('\n');
const R = { stale: 0, swapped: 0, rolledBack: 0, noVariant: {}, groups: {}, errors: [] };
for (let pass = 0; pass < 3; pass++) { let changed = 0; mc.clear();
  const nested = pg.findAllWithCriteria({ types: ['INSTANCE'] }).filter(i => i.id.includes(';')).sort((a, b) => a.id.split(';').length - b.id.split(';').length);
  const done = new Set();
  for (const n of nested) { if ([...done].some(d => n.id.startsWith(d + ';'))) continue; const M = await mainOf(n); if (!M || !M.remote) continue;
    const F = await freshOf(M); const S = setOf(M); if (!F || F.id === S.id) continue;
    if (ONLY_OLD_REFS && !(await hasOld(M))) continue;
    R.stale++; const gk = esc(S.name).slice(0, 28); R.groups[gk] = (R.groups[gk] || 0) + 1;
    const T = pickVariant(F, M); if (!T) { R.noVariant[gk + ' :: ' + esc(M.name).slice(0, 30)] = (R.noVariant[gk + ' :: ' + esc(M.name).slice(0, 30)] || 0) + 1; continue; }
    if (MODE !== 'fix') { done.add(n.id); continue; }
    try { const fonts = new Set(); for (const x of [n, T]) for (const t of x.findAll(y => y.type === 'TEXT')) for (const f of t.getRangeAllFontNames(0, t.characters.length)) fonts.add(JSON.stringify(f)); for (const f of fonts) { try { await figma.loadFontAsync(JSON.parse(f)); } catch (e) {} }
      const b = { t: textsOf(n), w: n.width, h: n.height };
      n.swapComponent(T);
      const n2 = await figma.getNodeByIdAsync(n.id); const a = { t: textsOf(n2), w: n2.width, h: n2.height };
      if (a.t !== b.t || Math.abs(a.w - b.w) > 0.5 || Math.abs(a.h - b.h) > 0.5) { n2.swapComponent(M); R.rolledBack++; if (R.errors.length < 6) R.errors.push(n.id + ' rollback ' + (a.t !== b.t ? 'texts' : 'size ' + b.w + 'x' + b.h + '->' + a.w + 'x' + a.h)); }
      else { R.swapped++; changed++; done.add(n.id); }
    } catch (e) { if (R.errors.length < 6) R.errors.push(n.id + ' ' + String(e.message || e).slice(0, 60)); } }
  if (MODE !== 'fix' || !changed) break; }
return R;
