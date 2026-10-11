// Старые и чужие таббары → Library `Tabbar` (references/twins.md, «Таббар»): форки (`93ac8e5d`), удалённые `Tabbar YaPS`
// (`f9c1d940`) и `❌ Tabbar Mini App` (`f748202c`), SuperApp `tabbar` (`c190b3d4`). Структура разная → swap +
// resetOverrides + возврат геометрии. APP — бренд результата; активный таб — из имени старого варианта (карта TAB),
// иначе DEFAULT_TAB; платформа и RTL — один в один. Сверка: размер и позиция прежние, все видимые подписи непустые и
// не плейсхолдеры; иначе обратный свап. Смешанные бренды в файле — запускать отдельно с FROM нужных инстансов.
// После — fix-tabbar-overrides.js и tabbar-tint-audit.js.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const APP = 'YaPS';           // 'YaPS' | 'Yango Play' | 'Yango Music'; варианта Allplay нет — спросить пользователя
const FROM = new Set(['93ac8e5d', 'f9c1d940', 'f748202c', 'c190b3d4']);
const KEY = 'd20586bac5ca08a97154b26f9b767420034b166d';
const DEFAULT_TAB = { 'YaPS': 'Home', 'Yango Play': 'Watch', 'Yango Music': 'Discover' };
const TAB = { 'Home': 'Home', 'Главная': 'Home', 'Кинопоиск': 'Kinopoisk', 'Kinopoisk': 'Kinopoisk', 'Музыка': 'Music', 'Music': 'Music', 'Книги': 'Books', 'Books': 'Books', 'Профиль': 'Profile', 'Profile': 'Profile',
  'Watch': 'Watch', 'Search': 'Search', 'My Yango': 'My Yango', 'My Collection': APP === 'Yango Music' ? 'Collection' : 'My Yango', 'Discover': APP === 'YaPS' ? 'Music' : 'Discover', 'Collection': APP === 'YaPS' ? 'Music' : 'Collection' };
const PLACEHOLDER = /^(tab|таб|супер ?таб|super ?tab|label)$/i;
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const isVis = (n, root) => { let a = n; while (a && a.id !== root.id && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
function geoOf(X) { const par = X.parent; const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE'); let lsh = null, lsv = null; try { lsh = X.layoutSizingHorizontal; lsv = X.layoutSizingVertical; } catch (e) {} return { x: X.x, y: X.y, w: X.width, h: X.height, pos: X.layoutPositioning, c: X.constraints, lsh, lsv, vis: X.visible, op: X.opacity, name: X.name, parentAL }; }
function geoApply(N, g) { try { if (N.layoutPositioning !== g.pos) N.layoutPositioning = g.pos; } catch (e) {} try { N.constraints = g.c; } catch (e) {} if (g.pos === 'ABSOLUTE' || !g.parentAL) { N.x = g.x; N.y = g.y; } try { if (g.lsh === 'FILL') { N.layoutSizingHorizontal = 'FILL'; if (Math.abs(N.height - g.h) > .5) N.resize(N.width, g.h); } else N.resize(g.w, g.h); } catch (e) { try { N.resize(g.w, g.h); } catch (e2) {} } N.visible = g.vis; N.opacity = g.op; }
const set = await figma.importComponentSetByKeyAsync(KEY);
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { ok: 0, fail: [], skip: [], sample: [] }; out[esc(pg.name).slice(0, 20)] = R;
  const ids = []; for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { const M = i.mainComponent; if (!M || !M.remote || !FROM.has(setOf(M).key.slice(0, 8))) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (!inInst) ids.push(i.id); }
  for (const id of ids) { const X = await figma.getNodeByIdAsync(id); if (!X) continue; try {
    const oldMain = X.mainComponent; const vp = vpOf(oldMain.name);
    const tab = TAB[vp['Active tab']] || DEFAULT_TAB[APP]; const platform = (vp.Platform === 'iPad' || vp['Tablet view'] === 'on') ? 'iPad' : 'iOS/Android'; const rtl = /^(on|True)$/.test(vp.RTL || '') ? 'True' : 'False';
    const vn = 'App=' + APP + ', Active tab=' + tab + ', Platform=' + platform + ', RTL=' + rtl; const tgt = set.children.find(c => c.name === vn); if (!tgt) { R.skip.push(id + ' novariant ' + esc(vn)); continue; }
    const g = geoOf(X);
    X.swapComponent(tgt); try { X.resetOverrides(); } catch (e) {} geoApply(X, g); X.name = 'Tabbar';
    const labels = X.findAll(n => n.type === 'TEXT' && isVis(n, X)).map(t => t.characters.trim());
    const ok = labels.length >= 3 && labels.every(l => l && !PLACEHOLDER.test(l)) && Math.abs(X.width - g.w) < .5 && Math.abs(X.height - g.h) < .5;
    if (ok) { R.ok++; if (R.sample.length < 2) R.sample.push(X.id); } else { R.fail.push(id + ' labels:' + esc(labels.join('|')).slice(0, 60) + ' sz:' + Math.round(X.width) + 'x' + Math.round(X.height)); X.swapComponent(oldMain); try { X.resetOverrides(); } catch (e) {} geoApply(X, g); X.name = g.name; }
  } catch (e) { R.fail.push(id + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
