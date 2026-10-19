// Тексты, привязанные к переменным типографики НЕ актуальных коллекций, → те же переменные актуальных Product /
// Typography constants (🌈 Стили). Для файлов ДС (Library, Органайзер, Графика, Стили) и своих слоёв проекта.
// Неактуальные: удалённые Typography / Typography Theme / Typography Headline / .Typography, старые версии Product
// и Typography constants (тот же ключ, другой id; старое имя «Constants»). Без этой перепривязки текст не меняется
// при смене режима Product, а в переключателе режимов висят опции с (!).
// Сопоставление по имени: Typography «Font Family» → Product «Font Family/Text»; Typography Headline «Font Family» →
// Product «Font Family/Headline»; «Font Weight/X» из Typography* → Product «Font Weight/X»; «Font/…» из Constants и
// старых Typography constants → Typography constants «Font/…»; старый Product → Product с тем же именем.
// Смысл сохраняется: что переключалось брендом — переключается Product, что было зашито (Font/Font Family/Yango Text,
// Graphik Kinopoisk) — остаётся зашитым. Тексты на стилях не трогает (их переводит 06 или сам стиль), тексты внутри
// инстансов не трогает (чинится в мастере).
// Тексты с разными переменными по диапазонам в одном поле — в mixed (единичные, руками).
// MODE 'report' — что найдено и куда пойдёт, без записи (можно всем файлом, PAGES=null). MODE 'fix' — одна страница
// на вызов (PAGES — подстрока имени), страницы параллельно. После fix — повторный report: unmapped и left = 0.
const PAGES = null;
const MODE = 'report';
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const KEYS = { prod: '17df014a0d4096e0a74b0511d40e53154d2070d4', tc: 'e8bd5f0ef3' };
const TF = ['fontFamily', 'fontStyle', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'paragraphSpacing'];
// актуальные переменные: локальные (в 🌈 Стили) или из подключённой библиотеки Стили
const CUR = { prod: { id: null, byName: new Map() }, tc: { id: null, byName: new Map() } };
const locals = await figma.variables.getLocalVariableCollectionsAsync();
for (const [k, key] of Object.entries(KEYS)) { const lc = locals.find(c => c.key.startsWith(key)); if (lc) { CUR[k].id = lc.id; for (const id of lc.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); CUR[k].byName.set(v.name, { key: v.key, v }); } } }
if (!CUR.prod.id || !CUR.tc.id) { const libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (const [k, key] of Object.entries(KEYS)) { if (CUR[k].id) continue; const lc = libs.find(c => c.key.startsWith(key)); if (!lc) throw new Error('нет доступа к коллекции ' + k + ' из 🌈 Стили — подключить Стили к файлу');
    for (const lv of await figma.teamLibrary.getVariablesInLibraryCollectionAsync(lc.key)) CUR[k].byName.set(lv.name, { key: lv.key, v: null });
    const any = CUR[k].byName.values().next().value; any.v = await figma.variables.importVariableByKeyAsync(any.key); CUR[k].id = any.v.variableCollectionId; } }
const target = async (k, name) => { const e = CUR[k].byName.get(name); if (!e) return null; if (!e.v) e.v = await figma.variables.importVariableByKeyAsync(e.key); return e.v; };
const refsOf = r => (Array.isArray(r) ? r : r ? [r] : []).filter(x => x && x.id).map(x => x.id);
const varOf = async id => { try { return await figma.variables.getVariableByIdAsync(id); } catch (e) { return null; } };
const cc = new Map(); const col = async id => { if (cc.has(id)) return cc.get(id); let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(id); } catch (e) {} cc.set(id, c); return c; };
// куда вести переменную неактуальной коллекции: [коллекция, имя] по порядку
const routes = (c, name) => { const n = c ? c.name : '';
  if (c && (c.id === CUR.prod.id || c.id === CUR.tc.id)) return null;
  if (/^\.?Typography Headline$/.test(n)) return name === 'Font Family' ? [['prod', 'Font Family/Headline']] : [['prod', name], ['tc', name]];
  if (/^\.?Typography( Theme)?$/.test(n)) return name === 'Font Family' ? [['prod', 'Font Family/Text']] : [['prod', name], ['tc', name]];
  if (n === 'Product' || (c && c.key.startsWith(KEYS.prod))) return [['prod', name]];
  if (/^(Typography )?[Cc]onstants$/.test(n) || (c && c.key.startsWith(KEYS.tc))) return [['tc', name]];
  if (!c) return [['prod', name], ['tc', name]];
  return null; };
const R = { pages: 0, texts: 0, bindings: 0, rebound: 0, unmapped: {}, plan: {}, mixed: 0, mixedEx: [], ex: [], errors: [], left: 0 };
for (const pg of figma.root.children) { if (PAGES && !PAGES.test(pg.name)) continue; if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync(); R.pages++;
  const todo = [];
  for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) { if (t.id.includes(';')) continue; if (typeof t.textStyleId === 'string' && t.textStyleId) continue;
    // у TEXT привязки типографики — массив (по сегментам); разные переменные в одном тексте — по диапазонам
    const bv = t.boundVariables || {}; const items = [];
    for (const f of TF) { const ids = [...new Set(refsOf(bv[f]))]; if (!ids.length) continue;
      if (ids.length > 1) { for (const id of ids) { const v = await varOf(id); if (v && routes(await col(v.variableCollectionId), v.name)) { R.mixed++; if (R.mixedEx.length < 5) R.mixedEx.push(t.id + ' ' + f); break; } } continue; }
      const v = await varOf(ids[0]);
      const c = v ? await col(v.variableCollectionId) : null; const rs = routes(c, v ? v.name : ''); if (!rs) continue;
      const label = (c ? esc(c.name) : '?') + '::' + (v ? esc(v.name) : '?');
      let tv = null, how = null; for (const [k, nm] of rs) { if (CUR[k].byName.has(nm)) { tv = [k, nm]; how = k + '::' + esc(nm); break; } }
      if (!tv) { R.unmapped[f + ' ' + label] = (R.unmapped[f + ' ' + label] || 0) + 1; continue; }
      R.plan[label + ' -> ' + how] = (R.plan[label + ' -> ' + how] || 0) + 1; items.push([f, tv]); }
    if (items.length) { todo.push([t, items]); R.texts++; R.bindings += items.length; if (R.ex.length < 6) R.ex.push(t.id); } }
  if (MODE !== 'fix' || !todo.length) continue;
  const fonts = new Set(); for (const [t] of todo) { try { for (const f of t.getRangeAllFontNames(0, t.characters.length)) fonts.add(JSON.stringify(f)); } catch (e) {} }
  // fontFamily из Product требует шрифты всех режимов в начертании текста; Figma подбирает и родственные семейства
  // (YS Text + Regular → «YS Text Display Regular»), поэтому грузим все доступные варианты брендовых семейств
  const styles = new Set(['Medium', 'Bold', 'Semibold', 'Regular', 'ExtraBold']); for (const f of fonts) styles.add(JSON.parse(f).style);
  for (const f of await figma.listAvailableFontsAsync()) if (/^(Yango Text|Yango Group Headline|YS Text|YS Text Display|YS Display)$/.test(f.fontName.family) && styles.has(f.fontName.style)) fonts.add(JSON.stringify(f.fontName));
  for (const f of fonts) { try { await figma.loadFontAsync(JSON.parse(f)); } catch (e) {} }
  // при ошибке Figma может уже сменить начертание — вернуть исходное
  for (const [t, items] of todo) { const fn0 = t.fontName; for (const [f, [k, nm]] of items) { try { t.setBoundVariable(f, await target(k, nm)); R.rebound++; } catch (e) { if (R.errors.length < 10) R.errors.push(t.id + ' ' + f + ' ' + String(e.message || e).slice(0, 60)); try { if (fn0 !== figma.mixed && t.fontName !== figma.mixed && t.fontName.style !== fn0.style) t.fontName = { family: t.fontName.family, style: fn0.style }; } catch (e2) {} } } }
  for (const [t] of todo) { const bv = t.boundVariables || {}; for (const f of TF) for (const id of new Set(refsOf(bv[f]))) { const v = await varOf(id); if (v && routes(await col(v.variableCollectionId), v.name)) R.left++; } } }
return R;
