// 04d — массовая замена одинаковых по структуре компонентов по ключу сета (❌ status-bar, home-indicator, navbar,
// modal-sheet / header, Fade, text-label / note…). Скан страниц (loadAsync, без переключения) → каждый ВНЕШНИЙ инстанс
// (не внутри другого инстанса; внутри локального мастера — да) из MAP свапается на вариант Library с тем же именем
// (или VARIANT(имя старого) → имя нового / null = пропустить); оверрайды переносятся по именному пути (как 04);
// сверка видимых текстов (кроме lax — статус-бары с другим временем), иконок, размера и позиции; при расхождении —
// обратный свап и повтор оверрайдов: откат поштучно, вызов не падает. Ответ: по страницам и ключам ok / fail / skip.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');                                   // подстрока(и) имён страниц
const MAP = {
  '50094d41': { key: '79c6f5207c4819f4eea0c630063e6ba83475c847', lax: true },                                   // ❌ status-bar / ios (Платформа) → status-bar / ios
  '029cbe14': { key: '79c6f5207c4819f4eea0c630063e6ba83475c847', lax: true, variant: v => { const m = /Device=([\w-]+)/.exec(v); return m ? 'RTL=off, device=' + m[1] : null; } }, // status bar ios (кит Bookmate)
  'fb1859a6': { key: 'e471214d2dffa82acf8217b0a1e935e62b5207b3' },                                              // ❌ home-indicator / ios
  'fcd19e7c': { key: 'c90308b61da1ab53bb2c55f2717667466d41e3fd', variant: v => /Type=large/.test(v) ? null : v }, // ❌ navbar (Type=large в Library нет)
  '18319d19': { key: '933411c8151af902bad8c2f323a3b0002b521210' },                                              // ❌ modal-sheet / header
  'f1b6b517': { key: 'f494f9f93b67cd9462ff9cfe4f0939c93aeecbfd' },                                              // Fade (форк) → Fade
  '7dfd1cca': { key: 'f494f9f93b67cd9462ff9cfe4f0939c93aeecbfd' },                                              // ❌ Fade → Fade
  '3d9483c4': { key: '996538262250dda3917d4c9eef367cfcc73506b5', variant: v => v + ', RTL=off' },               // . / text-label / note (удалённый) → text-label / note
  '21080408': { key: '4ad1547b496b91204d0e91ff154d20f23656a692', lax: true },                                   // ❌ keyboard / iOS → keyboard / iOS
  '92d049e8': { key: 'e471214d2dffa82acf8217b0a1e935e62b5207b3' },                                              // home-indicator / ios других китов
  '0f5986c2': { key: '5ad158ccf6572b12e546e9661aa25f4e8ab36377', lax: true, variant: v => { const m = /Step=(\d+)/.exec(v); return 'Page Count=8+,Step=' + (m ? m[1] : '01'); } }, // pager старый
  '52af2897': { key: '5e410880d68c34a0b9ae6bb52e2d33053423e1d1' },                                              // My Yango Subscription Widget старый: если тексты варианта другие — вернуть свои по порядку видимых
  'ad58e78f': { key: '9fae06ee1eff0d50967cca955943550dbdeb1ceb' },                                              // Family Widget старый
};
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const norm = s => s.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim();
const isVis = (n, root) => { let a = n; while (a && a !== root) { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = X => X.findAll(n => n.type === 'TEXT' && isVis(n, X)).map(t => t.characters);
const visI = X => X.findAll(n => n.type === 'INSTANCE' && isVis(n, X) && n.mainComponent && /^icon/.test(norm(setOf(n.mainComponent).name))).map(n => norm(setOf(n.mainComponent).name)).sort();
function walk(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { const k = norm(c.name); cnt[k] = (cnt[k] || 0) + 1; const p = path + '/' + k + '#' + cnt[k]; m.set(p, c); rec(c, p); } }; rec(root, ''); return m; }
function snap(root) { const out = []; for (const [p, n] of walk(root)) { const r = { p, vis: n.visible, type: n.type }; if (n.type === 'TEXT') r.chars = n.characters; if (n.type === 'INSTANCE' && n.mainComponent) { r.main = n.mainComponent; r.setName = norm(setOf(n.mainComponent).name); try { r.props = Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) { r.props = {}; } } out.push(r); } return out; }
async function loadFonts(t) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); }
async function replay(X, S) {
  let M = walk(X);
  for (const r of S) { let n = M.get(r.p); if (n && n.removed) { M = walk(X); n = M.get(r.p); } if (!n || n.removed || n.type !== r.type) continue;
    if (r.type === 'INSTANCE' && n.mainComponent) { if (r.setName !== norm(setOf(n.mainComponent).name) && /^icon/.test(r.setName)) { try { n.swapComponent(r.main); } catch (e) {} M = walk(X); n = M.get(r.p); if (!n) continue; }
      let defs; try { defs = n.componentProperties; } catch (e) { defs = {}; } const set = {};
      for (const [k, v] of Object.entries(defs)) { const b = k.replace(/#.*/, ''); if (b in r.props && r.props[b] !== v.value && v.type !== 'INSTANCE_SWAP') set[k] = r.props[b]; }
      if (Object.keys(set).length) { try { n.setProperties(set); } catch (e) { for (const [k, v] of Object.entries(set)) try { n.setProperties({ [k]: v }); } catch (e2) {} } } } }
  const M2 = walk(X);
  for (const r of S) { const n = M2.get(r.p); if (!n || n.removed || n.type !== r.type) continue; if (n.visible !== r.vis) { if (n.componentPropertyReferences && n.componentPropertyReferences.visible) continue; n.visible = r.vis; }
    if (r.type === 'TEXT' && n.characters !== r.chars) { if (n.componentPropertyReferences && n.componentPropertyReferences.characters) continue; try { await loadFonts(n); n.characters = r.chars; } catch (e) {} } }
}
const sets = new Map(); async function getSet(k) { if (!sets.has(k)) sets.set(k, await figma.importComponentSetByKeyAsync(k)); return sets.get(k); }
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = {}; out[pg.name.replace(/^[^\wА-Яа-яЁё]+/, '').slice(0, 10)] = R;
  const targets = [];
  for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { const M = i.mainComponent; if (!M || !M.remote) continue; const k8 = setOf(M).key.slice(0, 8); if (!MAP[k8]) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (inInst) continue; targets.push([i, k8]); }
  for (const [X, k8] of targets) { const r = R[k8] || (R[k8] = { ok: 0, fail: [], skip: [] }); try {
    const cfg = MAP[k8]; const set = await getSet(cfg.key); const oldMain = X.mainComponent; const oldName = X.name;
    const vn = cfg.variant ? cfg.variant(oldMain.name, X) : oldMain.name; if (!vn) { r.skip.push(X.id + ' ' + esc(oldMain.name).slice(0, 40)); continue; }
    const tgt = set.type === 'COMPONENT_SET' ? set.children.find(c => c.name === vn) : set; if (!tgt) { r.skip.push(X.id + ' novariant ' + esc(vn).slice(0, 40)); continue; }
    const t0 = visT(X), i0 = visI(X), w = X.width, h = X.height, x = X.x, y = X.y; let sh = null, sv = null; try { sh = X.layoutSizingHorizontal; sv = X.layoutSizingVertical; } catch (e) {}
    const S = snap(X); let rootProps = {}; try { rootProps = Object.fromEntries(Object.entries(X.componentProperties).filter(([k, v]) => v.type === 'BOOLEAN' || v.type === 'TEXT').map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) {}
    const apply = async target => { X.swapComponent(target); const rs = {}; for (const [k, v] of Object.entries(X.componentProperties)) { const b = k.replace(/#.*/, ''); if ((v.type === 'BOOLEAN' || v.type === 'TEXT') && b in rootProps && rootProps[b] !== v.value) rs[k] = rootProps[b]; } if (Object.keys(rs).length) { try { X.setProperties(rs); } catch (e) {} }
      await replay(X, S); await replay(X, S); try { if (sh) X.layoutSizingHorizontal = sh; if (sv) X.layoutSizingVertical = sv; } catch (e) {} if (Math.abs(X.width - w) > .5 || Math.abs(X.height - h) > .5) { try { X.resize(w, h); } catch (e) {} } };
    await apply(tgt); X.name = norm(oldName);
    const t1 = visT(X), i1 = visI(X);
    const ok = (cfg.lax || JSON.stringify(t0) === JSON.stringify(t1)) && JSON.stringify(i0) === JSON.stringify(i1) && Math.abs(X.width - w) < .5 && Math.abs(X.height - h) < .5 && Math.abs(X.x - x) < .5 && Math.abs(X.y - y) < .5;
    if (ok) { r.ok++; if (!r.sample) r.sample = X.id; } else { r.fail.push(X.id + ' t:' + esc(t0.join('|')).slice(0, 40) + '>' + esc(t1.join('|')).slice(0, 40) + ' i:' + i0.length + '>' + i1.length + ' sz:' + Math.round(w) + 'x' + Math.round(h) + '>' + Math.round(X.width) + 'x' + Math.round(X.height)); await apply(oldMain); X.name = oldName; }
  } catch (e) { r.fail.push(X.id + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
