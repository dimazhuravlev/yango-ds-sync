// Режимы бренда на экраны: Product и Typography (и при желании Theme). Ставить ДО привязки текстовых стилей (06):
// стили Text / Title Library берут семейство из этих коллекций, без режима YS Text превратится в Yango Text. Режим
// меняет и шрифты внутри компонентов Library на экране — ожидаемо. Если экраны лежат во фрейме страницы из
// 08-layout-page.js, режимы уже стоят на нём — этот рецепт не нужен.
// Коллекции находятся через стиль Library (fontFamily → Typography, fontStyle → Product) — так доступны и скрытые
// коллекции с точкой. SCREENS — id экранов; SECTIONS — все фреймы ≥ 300 × 300 внутри секций.
// BRAND: 'YaPS' | 'Yango Play' | 'Allplay'; THEME: 'Dark' | null (не трогать).
const SCREENS = []; const SECTIONS = []; const BRAND = 'YaPS'; const THEME = null;
const STYLE_KEY = '387a510812fba6c11f69c0ddb44124de09d69fa7';     // Library Text M・15/Medium
const THEME_VAR = 'a3049cdb8248b8d0608a4ea23d3d09d2fe7ca4c1';     // Theme Fill/One
const st = await figma.importStyleByKeyAsync(STYLE_KEY); const bv = st.boundVariables || {};
const collOf = async ref => ref ? await figma.variables.getVariableCollectionByIdAsync((await figma.variables.getVariableByIdAsync(ref.id)).variableCollectionId) : null;
const typo = await collOf(bv.fontFamily), prod = await collOf(bv.fontStyle);
if (!typo || !prod) throw new Error('не нашёл коллекции Typography / Product через стиль ' + st.name);
const want = [[prod, BRAND], [typo, BRAND === 'YaPS' ? 'YS Text' : 'Yango']];
if (THEME) { const v = await figma.variables.importVariableByKeyAsync(THEME_VAR); want.push([await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId), THEME]); }
const pairs = want.map(([c, m]) => { const mode = c.modes.find(x => x.name === m); if (!mode) throw new Error('нет режима ' + m + ' в ' + c.name); return [c, mode.modeId]; });
const screens = []; for (const id of SCREENS) { const n = await figma.getNodeByIdAsync(id); if (n) screens.push(n); }
for (const id of SECTIONS) { const s = await figma.getNodeByIdAsync(id); if (s) for (const c of s.children) if (c.type === 'FRAME' && c.width >= 300 && c.height >= 300) screens.push(c); }
const unavailable = new Set(); for (const sc of screens) for (const t of sc.findAllWithCriteria({ types: ['TEXT'] })) { try { for (const f of t.getRangeAllFontNames(0, t.characters.length)) { try { await figma.loadFontAsync(f); } catch (e) { unavailable.add(f.family + ' ' + f.style); } } } catch (e) {} }
const ok = [], fail = [];
for (const sc of screens) { try { for (const [c, m] of pairs) sc.setExplicitVariableModeForCollection(c, m); ok.push(sc.id); } catch (e) { fail.push(sc.id + ' ' + String(e.message || e).slice(0, 60)); } }
return { brand: BRAND, set: ok.length, ids: ok.join(','), fail, unavailableFonts: [...unavailable] };
