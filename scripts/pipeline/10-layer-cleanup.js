// 10 — гигиена слоёв (шаг по умолчанию, после замен и стилей): лишние обёртки и имена слоёв на экранах.
// Обёртка-пустышка (фрейм/группа с одним ребёнком того же размера и места, без заливки, обводки, эффектов, режимов,
// прототипа, скролла) удаляется, ребёнок встаёт на её место с её геометрией. Имена: мусорные (Frame 2147…, Group,
// Rectangle…) → по роли (stack, image, icon, divider, background, shape…); hStack / vStack / контейнеры → `stack`;
// тексты с автоименем или кириллицей → title / description / value / text; всё по-английски. Экран с мусорным именем →
// `screen` (SCREEN_NAMES='all' — все экраны). Не трогает: имена компонентов ДС и всё внутри инстансов, локальных мастеров и
// отвязанных копий с именем компонента ДС (keys/component-names.txt; по их именам работает замена на Library),
// осмысленные латинские имена, подписи на холсте (тексты прямо в секции/на странице), SKIP. Кириллица без перевода в
// TR остаётся и попадает в отчёт cyrLeft.
// Экран: фрейм 300–1400 × ≥ 600 в ряду `*stack*` фрейма страницы, или прямой ребёнок страницы / секции.
// Предохранитель: снимок absoluteBoundingBox всех слоёв экранов до → после; любое смещение > 0.6 px → throw, Figma
// откатывает весь вызов. Одна страница — один вызов. Сначала DRY. Перед этим шагом: recipes/unwrap-wrappers.js
// (навигационные обёртки) и recipes/bottom-bar.js (мини-плеер + таббар).
// ── CONFIG ───────────────────────────────────────────────────────────────────────────────────────────────────
const DRY = true; const PIDS = ['<pageId>']; const SKIP_IDS = new Set([]); const SCREEN_NAMES = 'garbage'; // 'garbage' | 'all'
// Переводы секций/фреймов страниц (точное имя → English); дополнять под проект. Пустые имена фреймов страниц — PAGEFRAME.
const TR = { 'Основные экраны': 'Main screens', 'Главная': 'Home', 'Поиск': 'Search' }; // дополнить под проект
const PAGEFRAME = {};
const DICT = { 'frame for fade': 'fade', 'ellipse light': 'glow', 'descrption': 'description', '2 row': 'row', 'mask group': 'mask', 'плей': 'play', 'детали': 'details', 'спорт': 'sport', 'музыка': 'music', 'кинопоиск': 'kinopoisk', 'книги': 'books', 'плюс': 'plus' };
// ── BODY ─────────────────────────────────────────────────────────────────────────────────────────────────────
const GARBW = /^(frame|group|rectangle|ellipse|vector|line|polygon|star|union|subtract|intersect|exclude|image|img|slice|auto layout|text|section|object|layer|слой|component|instance|untitled|screenshot.*|\d+|)$/;
const STKW = /^(h|v)?stack$|^(container|wrapper|content container|auto layout horizontal|auto layout vertical)$/;
const CYR = /[Ѐ-ӿ]/; const SKIP = ['INSTANCE', 'COMPONENT', 'COMPONENT_SET'];
const DSN = new Set(/*@NAMES*/.map(x => x.toLowerCase())); // отвязанная копия компонента ДС: имя и всё внутри не трогать — по ним работает замена на Library
const isDS = n => /^\.\s*\//.test(n.name) || /\S \/ \S/.test(n.name) || DSN.has(n.name.replace(/❌/g, '').replace(/\s*\/\s*/g, ' / ').trim().toLowerCase()); // + приватные части `. / …` и имена-пути `a / b`
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const vis = p => p.visible !== false;
const hasImg = n => Array.isArray(n.fills) && n.fills.some(p => vis(p) && (p.type === 'IMAGE' || p.type === 'VIDEO'));
const hasGrad = n => Array.isArray(n.fills) && n.fills.some(p => vis(p) && p.type.startsWith('GRADIENT'));
const hasFill = n => Array.isArray(n.fills) && n.fills.some(vis);
const nearParent = n => n.parent && 'width' in n.parent && Math.abs(n.width - n.parent.width) < 2 && Math.abs(n.height - n.parent.height) < 2;
const typeRole = n => { const t = n.type;
  if (t === 'LINE') return 'divider';
  if (['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON'].includes(t)) return Math.max(n.width, n.height) <= 48 ? 'icon' : 'shape';
  if (t === 'RECTANGLE' || t === 'ELLIPSE') return hasImg(n) ? 'image' : hasGrad(n) ? 'gradient' : nearParent(n) ? 'background' : 'shape';
  if ('children' in n && n.children.length) { if (t === 'GROUP' && n.children.some(c => c.isMask)) return 'mask'; return hasImg(n) ? 'image' : 'stack'; }
  return hasImg(n) ? 'image' : hasFill(n) ? (nearParent(n) ? 'background' : 'shape') : 'spacer'; };
const normalize = nm => { let s = nm.trim().replace(/_/g, ' '); for (let i = 0; i < 4; i++) s = s.replace(/\s+\d+$/, ''); s = s.replace(/\b\d{4,}\b/g, '').replace(/\s{2,}/g, ' ').trim().toLowerCase(); s = s.replace(/\bknigi\b/g, 'books'); return s; };
const styleCache = new Map(); const varCache = new Map();
const textRole = async n => { const ch = n.characters.trim(); if (/^[\d\s.,:+%−\-–\/×x₽$€]+$/.test(ch) && ch.length) return 'value';
  let sname = ''; if (typeof n.textStyleId === 'string' && n.textStyleId) { if (!styleCache.has(n.textStyleId)) { let s = null; try { s = await figma.getStyleByIdAsync(n.textStyleId); } catch (e) {} styleCache.set(n.textStyleId, s ? s.name : ''); } sname = styleCache.get(n.textStyleId); }
  if (/headline|title|^h\d/i.test(sname)) return 'title';
  const fs = typeof n.fontSize === 'number' ? n.fontSize : 0; if (fs >= 20) return 'title';
  const p = Array.isArray(n.fills) ? n.fills.find(vis) : null; let vname = '';
  if (p && p.boundVariables && p.boundVariables.color) { const id = p.boundVariables.color.id; if (!varCache.has(id)) { let v = null; try { v = await figma.variables.getVariableByIdAsync(id); } catch (e) {} varCache.set(id, v ? v.name : ''); } vname = varCache.get(id); }
  if (/Four|Five|Six|Seven|Eight|Subtitle/.test(vname) || (p && p.type === 'SOLID' && !vname && (p.opacity ?? 1) < 0.8)) return 'description';
  const fw = typeof n.fontWeight === 'number' ? n.fontWeight : 400; if (fw >= 500 && fs >= 15) return 'title';
  return 'text'; };
const isAutoText = n => n.name.length > 0 && n.characters.startsWith(n.name);
const isRow = n => /stack/i.test(n.name);
const rad = c => typeof c.cornerRadius === 'number' ? c.cornerRadius : (typeof c.topLeftRadius === 'number' ? c.topLeftRadius : 0); // cornerRadius бывает figma.mixed
const isSection = c => rad(c) >= 16 && (typeof c.paddingLeft === 'number' ? c.paddingLeft : 0) >= 40;
const sizeOk = c => c.width >= 300 && c.width <= 1400 && c.height >= 600 && !isSection(c) && !/^arrow$/i.test(c.name);
const holdsScreens = c => 'findOne' in c && !!c.findOne(d => d.type === 'FRAME' && sizeOk(d) && d.parent && isRow(d.parent)); // узкий фрейм страницы (918 и т.п.) — не экран, а каркас с рядами экранов
const isScreen = (c, rowDepth, parent) => sizeOk(c) && ((isRow(parent) && rowDepth >= 2 && (c.type === 'FRAME' || c.type === 'GROUP' || c.type === 'SECTION')) || (/^(PAGE|SECTION)$/.test(parent.type) && c.type === 'FRAME' && !holdsScreens(c)));
const box = n => { const b = n.absoluteBoundingBox; return b ? [b.x, b.y, b.width, b.height] : null; };
const sameBox = (a, b) => a && b && a.every((v, i) => Math.abs(v - b[i]) < 0.6);
const has = (W, k) => k in W; // у GROUP нет overflowDirection/minWidth/strokes — прямое чтение бросает
const plain = W => !hasFill(W) && !(has(W, 'strokes') && W.strokes && W.strokes.some(vis)) && !(W.effects && W.effects.some(e => e.visible)) && W.opacity === 1 && Math.abs(W.rotation || 0) < 0.01 && W.visible && !(W.reactions && W.reactions.length) && !(W.exportSettings && W.exportSettings.length) && !Object.keys(W.explicitVariableModes || {}).length && (W.blendMode === 'PASS_THROUGH' || W.blendMode === 'NORMAL') && !(has(W, 'overflowDirection') && W.overflowDirection !== 'NONE') && !W.isMask && !(has(W, 'minWidth') && (W.minWidth || W.maxWidth || W.minHeight || W.maxHeight));
const insideSkip = (W, S) => { let a = W.parent; while (a && a.id !== S.id) { if (SKIP.includes(a.type) || isDS(a)) return true; a = a.parent; } return false; };
const okWrap = (W, S) => { if (W.id === S.id || !(W.type === 'FRAME' || W.type === 'GROUP') || W.children.length !== 1) return false; if (/^bottom bar$/i.test(W.name) || isDS(W)) return false; const C = W.children[0]; if (C.isMask || !plain(W) || insideSkip(W, S)) return false; if (!sameBox(box(W), box(C))) return false;
  if (W.type === 'FRAME' && W.clipsContent) { if (C.effects && C.effects.some(e => e.visible)) return false; if ('children' in C && C.type !== 'INSTANCE' && !C.clipsContent) return false; if (C.type === 'INSTANCE' && !C.clipsContent) return false; }
  return true; };
const fontsOf = async n => { const fs = new Set(); for (const t of (n.type === 'TEXT' ? [n] : n.findAllWithCriteria({ types: ['TEXT'] }))) { if (t.fontName !== figma.mixed) fs.add(JSON.stringify(t.fontName)); else for (const g of t.getStyledTextSegments(['fontName'])) fs.add(JSON.stringify(g.fontName)); } for (const f of fs) { try { await figma.loadFontAsync(JSON.parse(f)); } catch (e) {} } }; // insertChild требует шрифтов
/*@GUARD*/
const out = {};
for (const PID of PIDS) {
const pg = await figma.getNodeByIdAsync(PID); await pg.loadAsync();
const screenNodes = []; const scafNodes = [];
const findS = (n, depth) => { if (SKIP.includes(n.type) || SKIP_IDS.has(n.id)) return; scafNodes.push([n, depth]); if (!('children' in n)) return; for (const c of n.children) { if (SKIP_IDS.has(c.id)) continue; if (isScreen(c, depth, n)) { screenNodes.push(c); continue; } findS(c, depth + 1); } };
for (const n of pg.children) { if (SKIP_IDS.has(n.id)) continue; if (n.type === 'FRAME' && isScreen(n, 0, pg)) { screenNodes.push(n); continue; } findS(n, 0); }
const before = new Map(); const snap = n => { before.set(n.id, [n, box(n)]); if (SKIP.includes(n.type) || !('children' in n)) return; for (const c of n.children) snap(c); };
for (const S of screenNodes) snap(S);
const unwrapped = []; const uerr = [];
const unwrap = W => { const GG = geoGuard(W); const P = W.parent; const C = W.children[0]; const idx = P.children.findIndex(x => x.id === W.id); const b0 = box(C);
  const pAL = P.type !== 'GROUP' && P.layoutMode && P.layoutMode !== 'NONE';
  const g = { x: W.x, y: W.y, c: W.type === 'FRAME' ? W.constraints : null, pos: W.layoutPositioning, lsh: W.layoutSizingHorizontal, lsv: W.layoutSizingVertical, name: W.name };
  P.insertChild(idx, C); if (C.type !== 'INSTANCE' && GARBW.test(normalize(C.name)) && !GARBW.test(normalize(g.name)) && !CYR.test(g.name)) C.name = g.name; // имя обёртки осмысленнее
  if (pAL) { if (g.pos === 'ABSOLUTE') { C.layoutPositioning = 'ABSOLUTE'; C.x = g.x; C.y = g.y; if (g.c) try { C.constraints = g.c; } catch (e) {} }
    else { try { if (C.layoutPositioning === 'ABSOLUTE') C.layoutPositioning = 'AUTO'; } catch (e) {}
      for (const [ax, gv] of [['layoutSizingHorizontal', g.lsh], ['layoutSizingVertical', g.lsv]]) { try { if (gv === 'FILL') C[ax] = 'FILL'; else if (gv === 'FIXED') C[ax] = 'FIXED'; else if (C[ax] === 'FILL') C[ax] = 'FIXED'; } catch (e) {} } } }
  else { C.x = g.x; C.y = g.y; if (g.c) try { C.constraints = g.c; } catch (e) {} }
  let b1 = box(C); if (!sameBox(b0, b1) && (Math.abs(b0[2] - b1[2]) > 0.5 || Math.abs(b0[3] - b1[3]) > 0.5)) { try { if (pAL && C.layoutPositioning !== 'ABSOLUTE') { if (C.layoutSizingHorizontal !== 'FILL') C.layoutSizingHorizontal = 'FIXED'; if (C.layoutSizingVertical !== 'FILL') C.layoutSizingVertical = 'FIXED'; } C.resize(b0[2], b0[3]); } catch (e) {} }
  if (!W.removed) W.remove(); GG.repair(); unwrapped.push(esc(g.name).slice(0, 18) + '>' + C.type); }; // repair: hug-родитель без потоковых детей не должен сжаться // группа без детей удаляется сама
for (const S of screenNodes) { for (let pass = 0; pass < 4; pass++) { const ws = S.findAll(n => (n.type === 'FRAME' || n.type === 'GROUP') && n.children && n.children.length === 1).filter(W => okWrap(W, S)); if (!ws.length) break; ws.sort((a, b) => { let da = 0, db = 0, x = a; while (x.parent) { da++; x = x.parent; } x = b; while (x.parent) { db++; x = x.parent; } return db - da; }); for (const W of ws) { if (W.removed || !okWrap(W, S)) continue; try { if (!DRY) { await fontsOf(W); unwrap(W); } else unwrapped.push(esc(W.name).slice(0, 18) + '>' + W.children[0].type + ' ' + W.id); } catch (e) { uerr.push(W.id + ' ' + String(e).slice(0, 60)); } } if (DRY) break; } }
const ren = new Map(); const stat = { maps: {}, cyrLeft: [] };
const plan = (n, name) => { if (name && name !== n.name) { ren.set(n.id, [n, name]); const k = esc(n.name).slice(0, 26) + ' -> ' + name; stat.maps[k] = (stat.maps[k] || 0) + 1; } };
const texts = [];
for (const [n, depth] of scafNodes) { if (n.removed) continue; if (n.type === 'TEXT') { texts.push([n, false]); continue; }
  if (depth === 0 && PAGEFRAME[PID] && !n.name.trim()) plan(n, PAGEFRAME[PID]);
  else if (TR[n.name]) plan(n, TR[n.name]);
  else if (isRow(n) && /^(h|v)?stack$/i.test(n.name)) plan(n, 'stack');
  else if (CYR.test(n.name)) stat.cyrLeft.push('S:' + esc(n.name).slice(0, 40));
  else { const b = normalize(n.name); if (GARBW.test(b)) plan(n, typeRole(n)); } }
const inner = n => { if (SKIP.includes(n.type) || isDS(n)) return; if (n.type === 'TEXT') { texts.push([n, true]); return; }
  const nm = n.name; let b = DICT[nm] || DICT[normalize(nm)] || normalize(nm);
  if (b.includes(' / ')) b = b.split(' / ')[0].trim().replace(/^\.\s*/, '');
  let o; if (GARBW.test(b)) o = typeRole(n); else if (STKW.test(b)) o = 'stack'; else if (CYR.test(b)) { o = typeRole(n); stat.cyrLeft.push('I:' + esc(nm).slice(0, 30) + '->' + o); } else o = b;
  plan(n, o); if ('children' in n) for (const c of n.children) inner(c); };
const screenName = S => { if (SCREEN_NAMES === 'all') return 'screen'; if (TR[S.name]) return TR[S.name]; const b = normalize(S.name); if (GARBW.test(b) || /^(screen|frame|group)\b/.test(b) || /^[\s|.\-–_]*$/.test(S.name)) return 'screen'; if (CYR.test(S.name)) stat.cyrLeft.push('screen:' + esc(S.name).slice(0, 30)); return null; };
for (const S of screenNodes) { plan(S, screenName(S)); if ('children' in S) for (const c of S.children) inner(c); }
for (const [t, inS] of texts) { if (/^(PAGE|SECTION)$/.test(t.parent.type)) continue; if (isAutoText(t) || CYR.test(t.name) || GARBW.test(normalize(t.name))) plan(t, await textRole(t)); else if (inS) { const b = normalize(t.name); plan(t, STKW.test(b) ? 'text' : b); } }
if (!DRY) for (const [n, name] of ren.values()) n.name = name;
const moved = []; if (!DRY) for (const [id, [n, b0]] of before) { if (n.removed) continue; const b1 = box(n); if (b0 && b1 && !sameBox(b0, b1)) moved.push(id + ' ' + esc(n.name).slice(0, 16) + ' ' + b0.map(Math.round).join(',') + '->' + b1.map(Math.round).join(',')); }
if (moved.length) throw new Error(PID + ' GEOMETRY SHIFT, rolled back: ' + moved.slice(0, 8).join(' | '));
const topN = (o, k) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([a, b]) => a + ' x' + b);
out[PID] = { screens: screenNodes.length, renames: ren.size, unwrapped: unwrapped.length, uerr, checked: before.size, maps: topN(stat.maps, 30), unwrapS: unwrapped.slice(0, 10), cyrLeft: stat.cyrLeft.slice(0, 12) }; }
return out;
// После прогона — аудит остатков (кириллица / Frame N / hStack / заглавные) и точечный словарь: Header→header,
// Arrow N→arrow, bg→background, ico→icon, baraban→wheel, вложенный полноразмерный фрейм в screen → content (не screen).
