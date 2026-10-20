// Все тексты в разделе — на наши стили и переменные (просьба владельца: «везде наши переменные, ближайшие к текущим»).
// Типографика: кегль и начертание точно совпадают со стилем ДС Платформа → стиль; иначе (кегль вне шкалы, старые
// стили iOS / Android-ячеек, чужие ДС) — переменные: семейство и начертание из Product, кегль и межстрочный — ближайшие
// из Typography constants. Цвет текста: точное совпадение с Theme / Product, иначе ближайшая переменная (в режиме
// Theme экрана). Не трогает: системные (SF Pro, статус-бар), оформление Органайзера, мастера ДС Платформа (Top Navigation
// и т. п. — правятся в ДС). ROOTS — id разделов (секция / стек / экран), MODE 'report' → 'fix'. Сдвиги значений —
// в отчёт (sizeMap, nearColors) и на скриншот до/после. Проверено 2026-10-20 на ЯПС «Моя волна».
const ROOTS = []; if (!ROOTS.length) throw new Error('ROOTS: id разделов');
const MODE = 'report';
const MAP_16_TO_18 = false; // владелец ЯПС 2026-10-20: «меняй все 16 на 18 med» — 16 → стиль Text L・18/Medium
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const SKIP_COMP = /^(paragraph|header|design-system|\. \/ top navigation|status-bar|home-indicator|keyboard)/;
// ключи 🌈 Стилей (сверено 2026-10-20)
const K = {"Font/Font Size/100":"767548e00de48cf8ac786160d934deec9ec19a7a","Font/Font Size/72":"1abf5df4303633725d7e2d584296a325bf1e444c","Font/Font Size/64":"e4f1c6325d1daee4bb5d701c1d255cd215f949dc","Font/Font Size/62":"b9e05cf6a71a77d16ebcc528323f21a9cd1ac122","Font/Font Size/56":"2820da22660b963233c5aa00ea88d13f8fcd9506","Font/Font Size/48":"2a8a844ce241d3b931c21381b22fe803e483a3df","Font/Font Size/44":"a8b59f7389af491f54018f54e43503a1cd92324b","Font/Font Size/42":"484ed601517e662797d8703c9e82e081dbf338ec","Font/Font Size/40":"40428ec0fe51aa2e32435ffb120cfea0e655de5d","Font/Font Size/36":"c2c31881f3bb4dc38cc6f9cd0844410fd9abc57f","Font/Font Size/32":"ff202d602c6de108357d2a4b14dd74144a5f7e4e","Font/Font Size/28":"c70a9a79973ed657d29c6ac6dd858aeac878bf3c","Font/Font Size/26":"7ef50d28ad960b918c488a1fcf8be0f25ad19f2d","Font/Font Size/24":"47db82d096d8f7bebcb2c016500c13501801fa8d","Font/Font Size/22":"5081aab5a9d1d6817965ccc8e3fbf456c55d0e1b","Font/Font Size/20":"2cc2705f40681520826551e12846f5ccd38eb331","Font/Font Size/18":"dd7444d1441c08446ea6ab734527294eb5c3dfa9","Font/Font Size/16":"110ba672248986b11f87d4e48534b4ed5921feb9","Font/Font Size/15":"0070b34073ec2a503d3b7045ff150833e676c2de","Font/Font Size/13":"b4c9d942d8780f13c560c6ce8bad9f596dd98b32","Font/Font Size/12":"e29e7b041108fb3eab4474b11faf483957bed566","Font/Font Size/11":"8b7cb3b92403a05add15b98b33303b83afdb9d4a","Font/Font Size/10":"3194450399f19cf12d34ee2556088a03ce6260d9","Font/Line Height/108":"a34753fc3d584bc74e3f5ff6ace48426198ef4f4","Font/Line Height/84":"da69636de8dc75c3cdc076220d5ee8e6cb1fe949","Font/Line Height/72":"4c4e522be31dcc3f958ba4e046f317587558a117","Font/Line Height/64":"a3e8e7f3b5cb22936f9cf31749d53999700a378d","Font/Line Height/56":"dc8223afd4c9f14e3b05c6f95d009bb641dded20","Font/Line Height/54":"8a9a4e1f5fca1c0fcbf58b57815ae07ea86f82e9","Font/Line Height/48":"4eef8218d0a6d975a6eada02ee5b5f4225971128","Font/Line Height/44":"3384df6cb59c6a5379ff813160ce2c0423d25a84","Font/Line Height/42":"959c55087619178863d83ce784f15327985a0795","Font/Line Height/40":"af0b4686e78a6e24e9f808bd810fb3ce4e180208","Font/Line Height/38":"c91d33d876720f327b5a7b97d3883dac7d8857cc","Font/Line Height/36":"552f67ab99021e40a0337a38e9b2d543c011fe9a","Font/Line Height/34":"f84690d8fe05e239d6caad9e4dc80ae41da46e0e","Font/Line Height/32":"832af80ec1efc12a367b24850dceff677ffe4dbd","Font/Line Height/30":"329ea593ae4650945d0767dbad9ebb362215f0c5","Font/Line Height/28":"b3099e0a6c7fd498c492790f45b862fec79879f6","Font/Line Height/26":"36f83323dc00af954fa320aa9e7c1956bcbfcf4b","Font/Line Height/24":"fdca439cd498757122c2814803afb26e5f00fe29","Font/Line Height/22":"88268732a59c2ab32ff0289fb8f4ba4fe2387c3d","Font/Line Height/20":"bc0f5a003b7d907060894e03e093ab52a6d0fe31","Font/Line Height/18":"fc8afccfdce6cb3e5f50894c3ccdb99ec4f5db10","Font/Line Height/16":"e1e1fb848f9ff09f687470cfa2258a510bcf1b97","Font/Line Height/14":"2f41c6370094770292a01a85be9fd9b569ac9a0b","Font/Line Height/12":"571f63a563e907048ea1eea99e3bd39fe981f861","Font Family/Text":"bdab254041e3baa23897abefbdd3e777e1b932de","Font Family/Headline":"9c1e32367c6022d50e4e11571a6c213be3e0878d","Font Weight/Regular":"900119480a5bf7e4fb1b5b377c4de3f8f07cb5cd","Font Weight/Medium":"75b9b0bf914b99b514f2103c27eb0bf99fae9080","Font Weight/Semibold":"412bb2913b76d8857499c9053da36b37c1ddcef2","Font Weight/Bold":"38435ae6460b44dc8d9e11b0ac2a3f7281600480"};
const STY = { H56: '3c819bca3fb60205e987a9ad3bf22428ca59e6ec', H48: 'a760de85f3a04f59bd36740fa5f839a02544debe', H40: '5b110814b1df019ddcc6fda5a2fc0bb5f39f646d', H32: '31550c134c915f642a1cf5bf2500b0ba7e06bad2', H28: '7ebd290e18e3c18a273ed690602bbcb03bc5ea2a', H24: '2b1c498082973181cd332b18de394ab66dcef0d8', T24S: 'b3000203712127da50baa30718ca77f5eb868302', T24M: '9577f02f058325f4bf0b9e2468ab619b887a4293', T18S: 'da62bf16068807437567a53e6b1d8bb4dd5de4e1', T18M: 'f364855df83ba280950aa89d0af2f174c045e53f', T15S: '976a35888de6837077969051ac5cb0a505f9e561', T15M: '387a510812fba6c11f69c0ddb44124de09d69fa7', T13S: '5d0b9abd3f247b934ae8c6710385d5418e84575f', T13M: '31e64f8e521c013fb5661b40c15ff5e4dff4fb71', T11S: '66fcf5cfc1936bc1e9d9958fa6053b97d378f628', T11M: 'b9eb84b1eb9779cb19a3342441b7bde46448402f' };
// цвета текста: [имя, ключ, Dark rgba, Light rgba]; Theme Accent/* не опубликованы — акцент из Product
const COL = [['Accent colors/Primary','2614253864f5ca1361d329f89c8d6efac6323e06',[.847,.553,.988,1],[.847,.553,.988,1]],['Fill/One','a3049cdb8248b8d0608a4ea23d3d09d2fe7ca4c1',[1,1,1,1],[0,0,0,1]],['Fill/Two','f3f6ba352cbeebd05f1b10b6e4c167e928283214',[.949,.949,.949,1],[.078,.078,.078,1]],['Fill/Four','6f96fc6c49a5d30859577747c0a6a8a35bb2adc2',[1,1,1,.8],[0,0,0,.8]],['Fill/Five','9cb950892b437ea8f915a4c9dddaa787519c3d3f',[1,1,1,.6],[0,0,0,.6]],['Fill/Six','08ef15ecd098462fece8c05cfe5fa16b98b76ad2',[1,1,1,.4],[0,0,0,.4]],['Fill/Subtitle','af7aaf043131ad0549367fd4377a19f900bd34bb',[1,1,1,.5],[0,0,0,.5]],['Fill/Inverted','e7f2fdb15f592032455e93e139b9af7a94ed6893',[0,0,0,1],[1,1,1,1]],['System/Error','6456c92cf3806ad8e3adf5eb5f3218930141486a',[.898,.192,.18,1],[.898,.192,.18,1]],['System/Success','e5f0ffed0f8326a12055978e08c5c0c59ff350b4',[.231,.702,.231,1],[.231,.702,.231,1]]];
const vc = new Map(); const V = async key => { if (!vc.has(key)) vc.set(key, await figma.variables.importVariableByKeyAsync(key)); return vc.get(key); };
const sc = new Map(); const S = async k => { if (!sc.has(k)) sc.set(k, await figma.importStyleByKeyAsync(STY[k])); return sc.get(k); };
const CUR = new Set(Object.values(STY).map(k => k.slice(0, 8)));
const sizes = Object.keys(K).filter(k => k.startsWith('Font/Font Size/')).map(k => +k.split('/').pop()), lhs = Object.keys(K).filter(k => k.startsWith('Font/Line Height/')).map(k => +k.split('/').pop());
const near = (arr, v) => arr.reduce((b, x) => Math.abs(x - v) < Math.abs(b - v) || (Math.abs(x - v) === Math.abs(b - v) && x < b) ? x : b, arr[0]);
const curCols = new Set(); for (const c of COL.slice(0, 2)) curCols.add((await V(c[1])).variableCollectionId);
const themeCol = await figma.variables.getVariableCollectionByIdAsync((await V(COL[1][1])).variableCollectionId); const LIGHT = themeCol.modes.find(m => m.name === 'Light').modeId;
const modeOf = n => { let a = n; while (a && a.type !== 'PAGE') { let e = null; try { e = a.explicitVariableModes; } catch (er) {} if (e) for (const [cid, mid] of Object.entries(e)) if (cid.startsWith('VariableCollectionId:7d07641e1f')) return mid === LIGHT ? 3 : 2; a = a.parent; } return 2; };
const R = { toStyle: {}, toVars: 0, sizeMap: {}, colorsExact: 0, nearColors: {}, heightChanged: 0, skipped: {}, failed: [] }; const sk = k => R.skipped[k] = (R.skipped[k] || 0) + 1;
let fontsLoaded = false;
for (const id of ROOTS) { const root = await figma.getNodeByIdAsync(id); if (!root) { sk('no root ' + id); continue; } let pg = root; while (pg.type !== 'PAGE') pg = pg.parent;
  if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync();
  if (MODE === 'fix' && !fontsLoaded) { for (const f of await figma.listAvailableFontsAsync()) if (/^(YS Text|YS Display|Yango Text|Yango Group Headline|YS Text Display)$/.test(f.fontName.family)) { try { await figma.loadFontAsync(f.fontName); } catch (e) {} } fontsLoaded = true; }
  for (const t of root.findAllWithCriteria({ types: ['TEXT'] })) {
    let I = t.parent, comp = null; while (I && I.id !== root.id) { if (I.type === 'INSTANCE') { const M = await I.getMainComponentAsync(); const SS = setOf(M); if (SS && SKIP_COMP.test(SS.name)) { comp = SS.name; break; } } I = I.parent; }
    if (comp) { sk('component ' + esc(comp).slice(0, 20)); continue; }
    if (t.fontName === figma.mixed || t.fontSize === figma.mixed) { sk('mixed'); continue; }
    const fam = t.fontName.family, sty = t.fontName.style; if (!/^(YS Text|YS Display|Yango Text|Yango Group Headline)$/.test(fam)) { sk('font ' + fam); continue; }
    const h0 = t.height;
    try {
      // типографика
      const sid = typeof t.textStyleId === 'string' ? t.textStyleId : null; let st0 = null; if (sid) st0 = await figma.getStyleByIdAsync(sid);
      if (!(st0 && CUR.has(st0.key.slice(0, 8)))) {
        const head = /Display|Headline/.test(fam), heavy = /Bold|Semi|Heavy|Black|Extra/i.test(sty); let z = t.fontSize; const zi = Math.abs(z - Math.round(z)) < 0.01 ? Math.round(z) : null;
        let key = null; if (zi) { if (head && /^(Bold|ExtraBold)$/.test(sty) && [56, 48, 40, 32, 28, 24].includes(zi)) key = 'H' + zi; else if (!head && /^(Medium|Bold|Semibold)$/.test(sty) && [24, 18, 15, 13, 11].includes(zi)) key = 'T' + zi + (heavy ? 'S' : 'M'); else if (!head && MAP_16_TO_18 && zi === 16 && /Medium/.test(sty)) key = 'T18M'; }
        if (key) { if (MODE === 'fix') await t.setTextStyleIdAsync((await S(key)).id); R.toStyle[key] = (R.toStyle[key] || 0) + 1; }
        else { const zn = near(sizes, z); if (Math.abs(zn - z) > 0.01) { const k = Math.round(z * 10) / 10 + '->' + zn; R.sizeMap[k] = (R.sizeMap[k] || 0) + 1; }
          if (MODE === 'fix') { const lh0 = t.lineHeight; if (sid) await t.setTextStyleIdAsync('');
            const w = head ? 'Font Weight/Bold' : (/^(Regular|Light|Book)$/i.test(sty) ? 'Font Weight/Regular' : /Medium/i.test(sty) ? 'Font Weight/Medium' : 'Font Weight/Semibold');
            t.setBoundVariable('fontFamily', await V(K[head ? 'Font Family/Headline' : 'Font Family/Text'])); t.setBoundVariable('fontStyle', await V(K[w])); t.setBoundVariable('fontSize', await V(K['Font/Font Size/' + zn]));
            if (lh0 && lh0.unit === 'PIXELS') t.setBoundVariable('lineHeight', await V(K['Font/Line Height/' + near(lhs, lh0.value)])); }
          R.toVars++; } }
      // цвет
      if (Array.isArray(t.fills)) { const m = modeOf(t); let ch = false; const nf = [];
        for (const p of t.fills) { const b = p.boundVariables && p.boundVariables.color; if (p.type !== 'SOLID') { nf.push(p); continue; }
          if (b) { const v = await figma.variables.getVariableByIdAsync(b.id); if (v && (curCols.has(v.variableCollectionId))) { nf.push(p); continue; } }
          const rgba = [p.color.r, p.color.g, p.color.b, p.opacity === undefined ? 1 : p.opacity]; let best = null, bd = 9;
          for (const c of COL) { const d = Math.hypot(...c[m].map((v, i) => (v - rgba[i]) * (i === 3 ? 1.5 : 1))); if (d < bd) { bd = d; best = c; } }
          if (bd < 0.01) R.colorsExact++; else { const k = rgba.map(x => Math.round(x * 255)).join(',') + ' -> ' + best[0]; R.nearColors[k] = (R.nearColors[k] || 0) + 1; }
          nf.push(MODE === 'fix' ? figma.variables.setBoundVariableForPaint({ ...p, opacity: 1 }, 'color', await V(best[1])) : p); ch = true; }
        if (ch && MODE === 'fix') t.fills = nf; }
      if (MODE === 'fix' && Math.abs(t.height - h0) > 0.5) R.heightChanged++;
    } catch (e) { if (R.failed.length < 8) R.failed.push(t.id + ' ' + String(e.message || e).slice(0, 60)); } } }
return R;
