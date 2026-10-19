// Режим бренда на экраны: Product (и при желании Theme). Ставить ДО привязки текстовых стилей (06): все стили ДС Платформа
// берут семейство и начертание из Product — без режима экран покажет режим по умолчанию (YaPS & Allplay, шрифт ЯПС).
// Режим меняет и шрифты внутри компонентов ДС Платформа на экране — ожидаемо. Если экраны лежат во фрейме страницы из
// 08-layout-page.js или режим стоит на самой странице (06a), этот рецепт не нужен.
// Коллекция Product находится через стиль ДС Платформа (fontFamily → Product «Font Family/Text») — это всегда актуальная
// версия. Режимы удалённых коллекций (Typography / Typography Theme / Typography Headline) и старых версий Product на
// этих экранах снимаются: сначала снять старое, потом ставить актуальное (у версий один ключ — clear снимает обе).
// SCREENS — id экранов; SECTIONS — все фреймы ≥ 300 × 300 внутри секций.
// BRAND: 'YaPS & Allplay' (ЯПС и Allplay) | 'Yango Play EN' | 'Yango Play AR'; THEME: 'Dark' | null (не трогать).
const SCREENS = []; const SECTIONS = []; const BRAND = 'YaPS & Allplay'; const THEME = null;
const STYLE_KEY = '387a510812fba6c11f69c0ddb44124de09d69fa7';     // ДС Платформа Text M・15/Medium
const THEME_VAR = 'a3049cdb8248b8d0608a4ea23d3d09d2fe7ca4c1';     // Theme Fill/One
const st = await figma.importStyleByKeyAsync(STYLE_KEY); const bv = st.boundVariables || {};
const ref = Array.isArray(bv.fontFamily) ? bv.fontFamily[0] : bv.fontFamily;
if (!ref) throw new Error('стиль ' + st.name + ' без привязки fontFamily — проверить ДС Платформа');
const prod = await figma.variables.getVariableCollectionByIdAsync((await figma.variables.getVariableByIdAsync(ref.id)).variableCollectionId);
const want = [[prod, BRAND]];
if (THEME) { const v = await figma.variables.importVariableByKeyAsync(THEME_VAR); want.push([await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId), THEME]); }
const pairs = want.map(([c, m]) => { const mode = c.modes.find(x => x.name === m); if (!mode) throw new Error('нет режима ' + m + ' в ' + c.name + ': ' + c.modes.map(x => x.name).join(' | ')); return [c, mode.modeId]; });
const stale = c => !c || (c.id !== prod.id && (c.name === 'Product' || c.key === prod.key || /^\.?Typography( Theme| Headline)?$/.test(c.name)));
const screens = []; for (const id of SCREENS) { const n = await figma.getNodeByIdAsync(id); if (n) screens.push(n); }
for (const id of SECTIONS) { const s = await figma.getNodeByIdAsync(id); if (s) for (const c of s.children) if (c.type === 'FRAME' && c.width >= 300 && c.height >= 300) screens.push(c); }
const unavailable = new Set(); for (const sc of screens) for (const t of sc.findAllWithCriteria({ types: ['TEXT'] })) { try { for (const f of t.getRangeAllFontNames(0, t.characters.length)) { try { await figma.loadFontAsync(f); } catch (e) { unavailable.add(f.family + ' ' + f.style); } } } catch (e) {} }
for (const f of [['Yango Text','Medium'],['Yango Text','Bold'],['Yango Group Headline','ExtraBold'],['YS Text','Medium'],['YS Text','Bold'],['YS Display','Bold']]) { try { await figma.loadFontAsync({ family: f[0], style: f[1] }); } catch (e) { unavailable.add(f.join(' ')); } }
const ok = [], fail = []; let cleared = 0;
for (const sc of screens) { try {
  for (const cid of Object.keys(sc.explicitVariableModes || {})) { let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(cid); } catch (e) {} if (stale(c)) { sc.clearExplicitVariableModeForCollection(c || cid); cleared++; } }
  for (const [c, m] of pairs) sc.setExplicitVariableModeForCollection(c, m); ok.push(sc.id); } catch (e) { fail.push(sc.id + ' ' + String(e.message || e).slice(0, 60)); } }
return { brand: BRAND, set: ok.length, cleared, ids: ok.join(','), fail, unavailableFonts: [...unavailable] };
