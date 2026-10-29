// Скелетон (состояние загрузки) экрана: копия экрана рядом с исходным, контент — серые плашки в габаритах загруженных
// блоков, системное (статус-бар, навигация, таббар, мини-плеер, чипсы) — живые инстансы. Правила владельца (2026-10-29):
// заливка Fill/Nine, без обводок и теней, скругления как у загруженных карточек, без анимации, габариты блоков те же
// (после загрузки верстка не сдвигается), мастер-компоненты не нужны — контент отвязывается и переделывается локально.
// Как: инстанс контента → detachInstance → рекурсивно: картинка / обложка / кнопка → плашка (радиус свой, дети убраны,
// размер зафиксирован); текст → рамка того же размера с полосками по строкам (высота полосы от межстрочного); иконки,
// разделители, декор → пустая рамка того же размера (абсолютные — удалить); скрытое — удалить; у контейнеров снять
// заливки, обводки, тени. Проверка в том же вызове: высота каждого блока контента и экрана до/после.
// SCREEN — id экрана; NAME — имя копии. Проверено 2026-10-29 на ЯПС «Общая коллекция».
const SCREEN = ''; const NAME = 'Загрузка';
const KEEP = /^(status-bar|Top Navigation|navbar|Tabbar|mini-player|Fade|chips-row|home-indicator|keyboard|bottom bar)/i;
const DECOR = /^(icon \/|icon$|divider|shader|badge|nameplate|logo|progress|age-rate|explicit)/i;
const PLATE_SET = /^(button|\. \/ card \/ image|image$|cover)/i;
const BAR_R = 0; // скругление полосок текста (в образце Music — 0)
const HEAD_W = 126, HEAD_DESC_W = 180; // заголовки каруселей — одной длины (владелец, 2026-10-29)
const TITLE_K = 0.8, DESC_K = 0.5;    // тексты карточек: одна полоса, ширина от слота текста — одинаково у карточек одного типа
if (!SCREEN) throw new Error('SCREEN: id экрана');
figma.skipInvisibleInstanceChildren = false;
const FILL = await figma.variables.importVariableByKeyAsync('ee4a4e445e813ce7fead17c351a0dcde68da0849'); // Theme · Fill/Nine
const paint = () => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', FILL);
const setOf = m => m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const orig = await figma.getNodeByIdAsync(SCREEN); let pg = orig; while (pg.type !== 'PAGE') pg = pg.parent; await figma.setCurrentPageAsync(pg);
for (const f of await figma.listAvailableFontsAsync()) if (/^(Yango|YS )/.test(f.fontName.family)) { try { await figma.loadFontAsync(f.fontName); } catch (e) {} }
const R = { plates: 0, texts: 0, spacers: 0, removed: 0, detached: 0, errors: [] };
const inAL = n => n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE' && n.layoutPositioning !== 'ABSOLUTE';
const hasImage = n => (Array.isArray(n.fills) && n.fills.some(p => p.type === 'IMAGE' && p.visible !== false)) || ('children' in n && n.children.some(c => c.visible && hasImage(c)));
const hasText = n => n.type === 'TEXT' ? n.visible : ('children' in n && n.children.some(c => c.visible && hasText(c)));
const radius = n => n.cornerRadius === figma.mixed || n.cornerRadius > 0 || n.topLeftRadius > 0;
const replaceWith = (old, nw) => { const p = old.parent; const i = p.children.indexOf(old); p.insertChild(i, nw);
  if (inAL(old)) { nw.layoutPositioning = 'AUTO'; nw.layoutGrow = old.layoutGrow; nw.layoutAlign = old.layoutAlign; } else { nw.x = old.x; nw.y = old.y; if (old.layoutPositioning === 'ABSOLUTE') nw.layoutPositioning = 'ABSOLUTE'; if ('constraints' in old) nw.constraints = old.constraints; }
  const hz = old.layoutSizingHorizontal, vt = old.layoutSizingVertical; nw.resize(Math.max(old.width, 0.01), Math.max(old.height, 0.01));
  if (inAL(old)) { if (hz === 'FILL') nw.layoutSizingHorizontal = 'FILL'; if (vt === 'FILL') nw.layoutSizingVertical = 'FILL'; }
  old.remove(); return nw; };
const spacer = n => { if (n.layoutPositioning === 'ABSOLUTE' || !inAL(n)) { n.remove(); R.removed++; return; } const f = figma.createFrame(); f.name = 'space'; f.fills = []; replaceWith(n, f); R.spacers++; };
// плашка — всегда НОВАЯ рамка на месте узла: у отвязанного узла привязка Fill/Nine может не подхватить прозрачность
// переменной (paint.opacity остаётся 1 — белая плашка; пойман на `card / music / user playlist`)
const plate = n => { const f = figma.createFrame(); f.name = 'skeleton'; f.fills = [paint()]; f.clipsContent = true;
  if (n.type === 'ELLIPSE') f.cornerRadius = Math.max(n.width, n.height) / 2;
  else if (n.cornerRadius === figma.mixed) { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) f[k] = n[k] || 0; } else f.cornerRadius = n.cornerRadius || 0;
  replaceWith(n, f); R.plates++; };
const bars = t => { const w = t.width, h = t.height, fs = t.fontSize === figma.mixed ? 15 : t.fontSize; const lhv = t.lineHeight && t.lineHeight.unit === 'PIXELS' ? t.lineHeight.value : fs * 1.3;
  const lines = Math.max(1, Math.round(h / lhv)); const bh = lhv >= 24 ? 16 : lhv >= 18 ? 12 : 10; const right = t.textAlignHorizontal === 'RIGHT';
  const est = t.textAutoResize === 'WIDTH_AND_HEIGHT' ? w : Math.min(w, Math.max(24, t.characters.length * fs * 0.55));
  const f = figma.createFrame(); f.name = 'skeleton text'; f.fills = []; f.clipsContent = false; const name = t.name;
  const align = t.textAlignHorizontal; replaceWith(t, f); f.name = 'skeleton ' + name; f.setPluginData('align', align);
  for (let i = 0; i < lines; i++) { const bw = Math.round(lines === 1 ? est : i === lines - 1 ? w * 0.6 : w); const r = figma.createRectangle(); r.name = 'line'; f.appendChild(r);
    r.resize(Math.max(bw, 8), bh); r.x = right ? f.width - r.width : 0; r.y = Math.round(i * lhv + (lhv - bh) / 2); r.fills = [paint()]; r.cornerRadius = BAR_R; }
  R.texts++; };
const sk = async n => { if (n.removed) return; if (!n.visible) { n.remove(); R.removed++; return; }
  if (n.type === 'INSTANCE') { let m = null; try { m = await n.getMainComponentAsync(); } catch (e) {} const nm = m ? setOf(m).name : '';
    if (DECOR.test(nm)) return spacer(n);
    const isPlate = PLATE_SET.test(nm) && !hasText(n); n = n.detachInstance(); R.detached++; if (isPlate) return plate(n); }
  if (n.type === 'TEXT') return bars(n);
  if (['VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'STAR', 'POLYGON'].includes(n.type)) return spacer(n);
  if (n.type === 'RECTANGLE' || n.type === 'ELLIPSE') { if (hasImage(n)) return plate(n); if (n.layoutPositioning === 'ABSOLUTE') { n.remove(); R.removed++; return; } n.fills = []; n.strokes = []; n.effects = []; return; }
  if ((hasImage(n) && !hasText(n)) && (radius(n) || n.clipsContent || (Array.isArray(n.fills) && n.fills.some(p => p.type === 'IMAGE')))) return plate(n);
  if ('fills' in n) n.fills = []; if ('strokes' in n) n.strokes = []; if ('effects' in n) n.effects = [];
  if ('children' in n) for (const c of [...n.children]) await sk(c); };
const walk = async n => { if (n.type === 'INSTANCE') { let m = null; try { m = await n.getMainComponentAsync(); } catch (e) {} if (KEEP.test(m ? setOf(m).name : '')) return; return sk(n); }
  if (n.type === 'TEXT') return sk(n); if ('children' in n) for (const c of [...n.children]) await walk(c); };
// копия рядом
const par = orig.parent; const clone = orig.clone(); par.insertChild(par.children.indexOf(orig) + 1, clone); if (!par.layoutMode || par.layoutMode === 'NONE') { clone.x = orig.x + orig.width + 48; clone.y = orig.y; }
clone.name = NAME;
const snap = c => { const m = {}; const rec = (n, path, d) => { m[path] = Math.round(n.height) + 'x' + Math.round(n.width); if (d < 4 && 'children' in n && n.type !== 'INSTANCE') n.children.filter(k => k.visible).forEach((k, i) => rec(k, path + '/' + i, d + 1)); }; rec(c, '', 0); return m; };
const s0 = snap(clone);
for (const c of [...clone.children]) { try { await walk(c); } catch (e) { R.errors.push(String(e.message || e).slice(0, 90)); } }
// единообразие: заголовки секций — HEAD_W; в каждой карточке первый текст — TITLE_K слота, остальные — DESC_K, одна полоса
const tx = clone.findAll(n => n.type === 'FRAME' && /^skeleton /.test(n.name) && n.children.length && n.children.every(c => c.name === 'line'));
// выравнивание полосы — как у текста: по центру (подписи под круглыми карточками) — точно по центру слота, справа — к краю
const one = (f, w) => { for (const l of f.children.slice(1)) l.remove(); const l = f.children[0]; const al = f.getPluginData('align');
  let bw = Math.max(8, Math.round(w)); if (al === 'CENTER' && (Math.round(f.width) - bw) % 2) bw -= 1; l.resize(bw, l.height);
  l.x = al === 'CENTER' ? (f.width - bw) / 2 : al === 'RIGHT' ? f.width - bw : 0; };
const headerOf = n => { for (let a = n.parent; a && a.id !== clone.id; a = a.parent) if (a.name === 'header') return a; return null; };
const cardOf = n => { for (let a = n; a && a.parent && a.id !== clone.id; a = a.parent) if (/^(carousel|track stack|stack|list|grid)$/.test(a.parent.name) && a.parent.layoutMode !== 'NONE' && a.parent.children.length > 1) return a; return null; };
const slotOf = (f, c) => { for (let a = f.parent; a && a.id !== c.id; a = a.parent) if (a.layoutSizingHorizontal === 'FILL') return a.width; return c.width; };
const byCard = new Map();
for (const f of tx) { const h = headerOf(f); if (h) { const i = h.findAll(x => tx.includes(x)).indexOf(f); one(f, i === 0 ? HEAD_W : HEAD_DESC_W); continue; }
  const c = cardOf(f); if (!c) continue; if (!byCard.has(c.id)) byCard.set(c.id, { c, t: [] }); byCard.get(c.id).t.push(f); }
for (const { c, t } of byCard.values()) t.forEach((f, i) => one(f, slotOf(f, c) * (i === 0 ? TITLE_K : DESC_K)));
const s1 = snap(clone); R.shifted = Object.keys(s0).filter(k => k.split('/').length <= 3 && s1[k] && s1[k] !== s0[k]).map(k => k + ' ' + s0[k] + '->' + s1[k]).slice(0, 12);
R.screen = clone.id; R.size = s0[''] + ' -> ' + s1[''];
R.badFill = clone.findAll(x => /^(skeleton|line)$/.test(x.name) && Array.isArray(x.fills) && x.fills[0] && x.fills[0].opacity >= 0.99).map(x => x.id).slice(0, 10); // должно быть пусто
return R;
