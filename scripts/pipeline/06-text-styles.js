// 06 — тексты на странице → текстовые стили 🫟 Library (16 шт., keys/library-text-styles.txt). Собирать через build.py.
// Три класса текстов: стиль Library — ок; чужой стиль — ближайший стиль Library; без стиля — баг,
// точный двойник (семейство, целый кегль, начертание). Ближайший: семейство → кегль (ничья → меньший) → начертание
// (Bold/Semi/Heavy/Black/Extra → Semibold, иначе Medium); Yango Text ≥ 28 → Title S 24; прочие ≥ 28 → Headline.
// Не трогает: системные (SF Pro, Roboto, iOS-киты), экспериментальные шрифты, тексты внутри
// компонентов не из Library (Графика, удалённые детали), дробные кегли (масштабированные копии), подписи на холсте.
// Чужой стиль внутри инстанса Library меняется только там, где это переопределение (иначе — в мастере Library).
// Стили Library общие для всех брендов: шрифт задаёт режим Product на странице (06a, 08). Прежние Headline En/Ar/YaPS
// и прочие стили не из 16 — чужие: заголовочные шрифты и кегль ≥ 28 → Headline того же кегля.
// BRAND — бренд файла: 'Yango' (Yango Play) | 'YaPS' (ЯПС и Allplay); влияет только на «Yango Text ≥ 28 → Title S 24».
// Сначала DRY = true: ответ maps/skipU (Loose → обычный межстрочный делает бейджи на 2 px ниже — норма).
// ONLY: id экранов — тексты берутся только из них (быстро; страницу целиком гонять пачками по ~10 экранов, иначе обрыв).
// Режимы бренда на ЯПС-экранах ставить ДО этого скрипта (recipes/set-brand-modes.js или 08), иначе YS Text станет Yango Text.
const PAGE = 'Mobile'; const DRY = true; const ONLY = null; const BRAND = 'Yango'; // ONLY: [id фрейма, …]; BRAND: 'Yango' (Yango Play) | 'YaPS' (ЯПС и Allplay)
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const LC = /*@LC*/;
const isSystemStyle = (s) => !s.fontName || /SF Pro|SF Compact|New York|Roboto/.test(s.fontName.family) || /^iOS\//.test(s.name);
const isSystemComp = (name) => /iOS|ios|android|Android|keyboard|status-bar|home-indicator|alerts|action-sheet|pip \//.test(name || '');
const sc = new Map(); async function st(id) { if (!id || typeof id !== 'string') return null; if (sc.has(id)) return sc.get(id); let s = null; try { s = await figma.getStyleByIdAsync(id); } catch (e) {} sc.set(id, s); return s; }
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
function nearestInst(n) { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return a; a = a.parent; } return null; }
function inMaster(n) { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'COMPONENT' || a.type === 'COMPONENT_SET') return true; a = a.parent; } return false; }
function pathFrom(anc, n) { const p = []; let c = n; while (c && c.id !== anc.id) { const par = c.parent; p.unshift(par.children.findIndex(x => x.id === c.id)); c = par; } return p; }
function follow(root, p) { let c = root; for (const i of p) { if (!c || !('children' in c) || !c.children[i]) return null; c = c.children[i]; } return c; }
const mc = new Map(); async function mainOf(i) { if (mc.has(i.id)) return mc.get(i.id); let m = null; try { m = await i.getMainComponentAsync(); } catch (e) {} mc.set(i.id, m); return m; }
async function sysAnc(n) { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { const m = await mainOf(a); if (m && isSystemComp(setOf(m).name)) return true; } if ((a.type === 'COMPONENT' || a.type === 'COMPONENT_SET') && isSystemComp(a.name)) return true; a = a.parent; } return false; }
async function ctxOf(n, kind) { const I = nearestInst(n); if (!I) return inMaster(n) ? 'master' : 'top';
  const M = await mainOf(I); if (!M) return 'missing'; const src = !M.remote ? 'local' : LC.has(setOf(M).key.slice(0, 8)) ? 'L' : 'other';
  if (src === 'other') return 'in-other';
  const mn = follow(M, pathFrom(I, n)); if (!mn) return 'in-' + src + ':nomatch';
  const g = x => kind === 'T' ? (typeof x.textStyleId === 'string' ? x.textStyleId : 'mixed') : x.effectStyleId;
  return 'in-' + src + ':' + (g(mn) === g(n) ? 'follows' : 'override'); }

const LKEYS = /*@LKEYS*/;
const ALLOWED = ['H', 'YT']; // Headline общий для всех брендов: шрифт задаёт режим Product; прежние Headline En/Ar/YaPS — чужие
const LT = new Set(LKEYS.filter(x => ALLOWED.includes(x.f)).map(x => x.k.slice(0, 8)));

// Text styles on one page → Library styles. Foreign style → nearest Library style; no style → exact twin only.
// Skips: system fonts/kits, experimental fonts (owner: «не трогаем»), texts inside non-Library components, fractional (scaled) sizes.
const EXPERIMENTAL = /Headline ML 2|Headline Var|YS Market/;
const LST = new Map(); async function lstyle(e) { if (!LST.has(e.k)) LST.set(e.k, await figma.importStyleByKeyAsync(e.k)); return LST.get(e.k); }
function nearest(list, size) { let best = null; for (const v of list) { const d = Math.abs(v - size); if (best === null || d < best.d || (d === best.d && v < best.v)) best = { v, d }; } return best.v; }
function nearestFor(s) { const fam = s.fontName.family, size = s.fontSize, heavy = /Bold|Semi|Heavy|Black|Extra/i.test(s.fontName.style);
  const pick = (f, sz, w) => LKEYS.find(x => x.f === f && x.z === sz && (f !== 'YT' || x.w === w));
  const H = 'H'; // one headline family for all brands
  if (/^Yango Group Headline|^YS Display|^Yango Headline$/.test(fam)) return pick(H, nearest([56, 48, 40, 32, 28, 24], size));
  if (BRAND !== 'YaPS' && /^Yango Text/.test(fam) && size >= 28) return pick('YT', 24, heavy ? 'S' : 'M'); // owner: Yango Text >= 28 → Title S 24
  if (size >= 28) return pick(H, nearest([56, 48, 40, 32, 28], size));
  return pick('YT', nearest([24, 18, 15, 13, 11], size), heavy ? 'S' : 'M'); }
const REG = /^(Regular|Light|Book|Thin)$/i, TEXTFAM = /^(Yango Text|YS Text)/; // Regular нигде не используется (Library · Base / Typography)
function scaleFor(z) { const v = nearest([24, 18, 15, 13, 11], z); return LKEYS.find(x => x.f === 'YT' && x.z === v && x.w === (v >= 18 ? 'S' : 'M')); } // 18/24 Semibold, 11/13/15 Medium
function exactFor(fn, size) { const z = Math.round(size); if (Math.abs(size - z) > 0.02) return null; const f = fn.family, st = fn.style; const heavy = /Bold|Semi|Heavy|Black|Extra/i.test(st); let fam;
  if (/^Yango Group Headline|^YS Display|^Yango Headline$/.test(f)) fam = 'H'; else if (/^(Yango Text|Yango Text Display|YS Text|Inter|Graphik)/.test(f)) fam = 'YT'; else return null;
  return LKEYS.find(x => x.f === fam && x.z === z && (fam !== 'YT' || x.w === (heavy ? 'S' : 'M'))) || null; }
const res = {}, maps = {}, skipU = {}, fails = []; const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
const p = figma.root.children.find(x => x.name.includes(PAGE)); await p.loadAsync();
const texts = []; if (ONLY) { for (const id of ONLY) { const fr = await figma.getNodeByIdAsync(id); if (fr) texts.push(...fr.findAllWithCriteria({ types: ['TEXT'] })); } } else texts.push(...p.findAllWithCriteria({ types: ['TEXT'] }));
for (const t of texts) { try {
  let fsegs = [], usegs = [];
  if (typeof t.textStyleId === 'string') { if (t.textStyleId) fsegs = [{ whole: true, id: t.textStyleId }]; else usegs = [{ whole: true, s: 0, e: t.characters.length, fn: t.fontName, z: t.fontSize }]; }
  else { try { for (const s of t.getStyledTextSegments(['textStyleId', 'fontName', 'fontSize'])) { if (s.textStyleId) fsegs.push({ whole: false, id: s.textStyleId, start: s.start, end: s.end }); else usegs.push({ whole: false, s: s.start, e: s.end, fn: s.fontName, z: s.fontSize }); } } catch (e) {} }
  if (!fsegs.length && !usegs.length) continue;
  if (await sysAnc(t)) { inc(res, 'skip system kit'); continue; }
  if (/SECTION|PAGE/.test(t.parent.type)) { inc(res, 'skip canvas annotation'); continue; } // labels on the canvas, not screen content
  const c = await ctxOf(t, 'T');
  for (const sg of fsegs) { const s = await st(sg.id); if (!s || LT.has(s.key.slice(0, 8))) continue;
    if (isSystemStyle(s)) { inc(res, 'F skip system'); continue; }
    if (EXPERIMENTAL.test(s.fontName.family)) { inc(res, 'F skip experimental'); continue; }
    const isReg = REG.test(s.fontName.style) && TEXTFAM.test(s.fontName.family); // Regular — и внутри чужих китов: переопределением
    if (!(isReg && c === 'in-other') && !/^(top|master)$|:override$|^in-L:follows$/.test(c)) { inc(res, 'F skip ' + c.replace(/:.*/, '')); continue; }
    const e = isReg ? scaleFor(s.fontSize) : nearestFor(s); if (!e) { fails.push('notarget ' + t.id + ' ' + esc(s.name)); continue; }
    const tg = await lstyle(e); inc(maps, esc(s.name).slice(0, 30) + ' (' + String(s.fontName && s.fontName.family).replace('Yango ', 'Y') + ' ' + s.fontSize + ') -> ' + esc(tg.name).slice(0, 26));
    if (!DRY) { try { await figma.loadFontAsync(tg.fontName); if (sg.whole) await t.setTextStyleIdAsync(tg.id); else await t.setRangeTextStyleIdAsync(sg.start, sg.end, tg.id); inc(res, 'F done'); } catch (err) { fails.push(t.id + ' ' + String(err.message || err).slice(0, 60)); } } else inc(res, 'F would');
  }
  if (usegs.length) { for (const sg of usegs) {
    const isReg = !!sg.fn && sg.fn !== figma.mixed && REG.test(sg.fn.style) && TEXTFAM.test(sg.fn.family);
    if (/^in-other/.test(c) && !isReg) { inc(res, 'U skip in-other'); continue; }
    if (!sg.fn || sg.fn === figma.mixed || /SF Pro|SF Compact|Roboto|New York/.test(sg.fn.family)) { inc(skipU, 'system'); continue; }
    const key = sg.fn.family.replace('Yango ', 'Y') + ' ' + sg.fn.style + ' ' + (Math.round(sg.z * 100) / 100);
    if (EXPERIMENTAL.test(sg.fn.family)) { inc(skipU, 'experimental ' + key); continue; }
    const e = isReg ? (Math.abs(sg.z - Math.round(sg.z)) > 0.02 ? null : scaleFor(sg.z)) : exactFor(sg.fn, sg.z); if (!e) { inc(skipU, key); continue; } // Regular 14 → 13 Medium: шкала 11/13/15/18/24, ничья → меньший
    const tg = await lstyle(e); inc(maps, 'U ' + key + ' -> ' + esc(tg.name).slice(0, 26));
    if (!DRY) { try { await figma.loadFontAsync(tg.fontName); if (sg.whole) await t.setTextStyleIdAsync(tg.id); else await t.setRangeTextStyleIdAsync(sg.s, sg.e, tg.id); inc(res, 'U done'); } catch (err) { fails.push('U ' + t.id + ' ' + String(err.message || err).slice(0, 60)); } } else inc(res, 'U would');
  } }
} catch (err) { fails.push('X ' + t.id + ' ' + String(err.message || err).slice(0, 80)); } }
return { n: texts.length, res, maps, skipU, nFails: fails.length, fails: fails.slice(0, 15) };
