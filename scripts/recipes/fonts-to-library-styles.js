// Шрифты чужого бренда → стили Library бренда экрана (правило: в макете ЯПС не может быть Yango и Graphik, в Yango Play —
// YS Text / Display). BRAND='YaPS': Yango Text / Yango Group Headline / Graphik → YaPS Headline + Text; BRAND='Yango':
// YS Text / YS Display / Graphik → Headline En + Text. Работает по ВСЕМ текстам, включая вложенные в инстансы (чужие киты — как
// переопределение стиля, Library — тоже переопределение, если мастер на чужом/бренд-Yango стиле). Почему так:
// стили Text/Title Library переключают семейство переменными (.Typography = YS Text, Product = YaPS на фрейме страницы),
// а Headline En/Ar держат Yango Group Headline жёстко → только замена на YaPS/Headline.
// Цель: заголовочное семейство (Headline/Display) при кегле ≥ 20 или любой кегль ≥ 28 → YaPS/Headline ближайшего
// кегля (56/48/40/32/28/24); иначе Text ближайшего кегля (24/18/15/13/11), Bold/Semi/Heavy/Black/Extra → Semibold.
// Не трогает: оформление страниц (Органайзер/старое Ядро: design-system, link / editable-pic, ORG-ключи), шрифты
// экспериментальные/логотипные (ML 2, Var), дробные кегли (масштабированные копии), тексты > 250 символов (спеки, книга
// в читалке), SKIP_ROOT (зоны, где работает другой исполнитель).
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"'); const BRAND = 'YaPS'; // 'YaPS' | 'Yango' (Yango Play и Allplay)
const SKIP_ROOT = new Set([]); const DRY = false;
const KEYS = { 'H56': '3c819bca3fb60205e987a9ad3bf22428ca59e6ec', 'H48': 'a760de85f3a04f59bd36740fa5f839a02544debe', 'H40': '5b110814b1df019ddcc6fda5a2fc0bb5f39f646d', 'H32': '31550c134c915f642a1cf5bf2500b0ba7e06bad2', 'H28': '7ebd290e18e3c18a273ed690602bbcb03bc5ea2a', 'H24': '2b1c498082973181cd332b18de394ab66dcef0d8',
  'T24S': 'b3000203712127da50baa30718ca77f5eb868302', 'T24M': '9577f02f058325f4bf0b9e2468ab619b887a4293', 'T18S': 'da62bf16068807437567a53e6b1d8bb4dd5de4e1', 'T18M': 'f364855df83ba280950aa89d0af2f174c045e53f', 'T15S': '976a35888de6837077969051ac5cb0a505f9e561', 'T15M': '387a510812fba6c11f69c0ddb44124de09d69fa7', 'T13S': '5d0b9abd3f247b934ae8c6710385d5418e84575f', 'T13M': '31e64f8e521c013fb5661b40c15ff5e4dff4fb71', 'T11S': '66fcf5cfc1936bc1e9d9958fa6053b97d378f628', 'T11M': 'b9eb84b1eb9779cb19a3342441b7bde46448402f' };
const ORG = new Set("298d220f,48dc1588,0677f3d9,e343e77d,38278503,302d3a70,394b086b,c517f2a9,987d964f,2443175a,45c45811,63a4490f,4f1f51a2,f4bd3385,db6b5d42,1c3f209b,66a794f7,e6ebbb63,7ffcbd3e,6d29525a,615800ff,486f42d1,211a2d21,fc1ef01f,959707c5,dfaf8c31,c7507960,bad2697c,cc58a0a6,a385bbb5".split(','));
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const H = [56, 48, 40, 32, 28, 24], T = [24, 18, 15, 13, 11];
const nearest = (arr, v) => arr.reduce((b, x) => Math.abs(x - v) < Math.abs(b - v) || (Math.abs(x - v) === Math.abs(b - v) && x < b) ? x : b, arr[0]);
const heavy = st => /Bold|Semi|Heavy|Black|Extra/i.test(st);
const targetKey = (fam, style, size) => { if ((/Headline|Display/.test(fam) && size >= 20) || size >= 28) return 'H' + nearest(H, Math.max(24, size)); return 'T' + nearest(T, size) + (heavy(style) ? 'S' : 'M'); };
const BAD = BRAND === 'YaPS' ? /^(Yango Text|Yango Group Headline|Yango Headline|Graphik)/ : /^(YS Text|YS Display|Graphik)/;
if (BRAND !== 'YaPS') Object.assign(KEYS, { H56: '5cab1c529e647bd864acea75293cb0173d8ba5ea', H48: 'a8e19ea286cdd25dcaea4add3e109af27c8307a5', H40: '6bbcf05d3ba26ce9eb4283faf97a209c95ce0d83', H32: '48a2b64e58bc0d8c25e05ea3081d77e2a3a6a829', H28: 'd7aaddb6d051d5341757ca131028ea86762e4bad', H24: 'b6e93ea339b7223957868a302f6a5ff03c9f3c6d' }); const EXP = /ML 2|Var/;
const styles = {}; for (const [k, key] of Object.entries(KEYS)) styles[k] = await figma.importStyleByKeyAsync(key);
for (const s of Object.values(styles)) { try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
for (const f of [{ family: 'YS Text', style: 'Medium' }, { family: 'YS Text', style: 'Bold' }, { family: 'YS Display', style: 'Bold' }]) { try { await figma.loadFontAsync(f); } catch (e) {} }
const out = { applied: 0, segs: 0, skipped: {}, errors: [] }; const sk = k => out.skipped[k] = (out.skipped[k] || 0) + 1;
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync();
  const ids = []; for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) { let a = t.parent, skip = null; while (a && a.type !== 'PAGE') { if (SKIP_ROOT.has(a.id)) { skip = 'zone'; break; } if (a.type === 'INSTANCE') { try { const S = setOf(a.mainComponent); if (ORG.has((S.key || '').slice(0, 8)) || /^(design-system|link \/ editable-pic)$/.test(S.name)) { skip = 'organizer'; break; } } catch (e) {} } a = a.parent; } if (skip) { continue; } let segs; try { segs = t.getStyledTextSegments(['fontName']); } catch (e) { continue; } if (segs.some(s => BAD.test(s.fontName.family))) ids.push(t.id); }
  for (const id of ids) { const t = await figma.getNodeByIdAsync(id); if (!t) continue; if (t.characters.length > 250) { sk('long'); continue; }
    let segs; try { segs = t.getStyledTextSegments(['fontName', 'fontSize']); } catch (e) { continue; }
    for (const s of segs) { if (!BAD.test(s.fontName.family)) continue; if (EXP.test(s.fontName.family)) { sk('experimental'); continue; } if (Math.abs(s.fontSize - Math.round(s.fontSize)) > 0.05) { sk('fractional'); continue; }
      const k = targetKey(s.fontName.family, s.fontName.style, Math.round(s.fontSize)); const st = styles[k]; if (!st) { sk('nostyle ' + k); continue; }
      if (DRY) { out.segs++; continue; }
      try { if (s.start === 0 && s.end === t.characters.length) await t.setTextStyleIdAsync(st.id); else await t.setRangeTextStyleIdAsync(s.start, s.end, st.id); out.segs++; } catch (e) { if (out.errors.length < 8) out.errors.push(id + ' ' + String(e).slice(0, 70)); } }
    out.applied++; } }
return out;
