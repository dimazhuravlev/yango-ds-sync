// Старые и мёртвые кнопки → Library `button` (references/twins.md, «Кнопки»). Мастер мёртвый или чужой — swapComponent
// не годится: вариант читается из имени мастера, подпись — из текста, глиф — из вложенной иконки; новый инстанс Library
// того же варианта встаёт на то же место (индекс, позиция / FILL, ширина; высота — Library), подпись через Text#, глиф
// свапом в слот. Сверка подписи и глифа; старый удаляется только при успехе. Внешние инстансы на экранах и в локальных
// мастерах; вложенные в чужие инстансы — хвост мастера, не трогать.
// BRAND_ACCENT: 'auto' — по шрифтам экрана (больше YS → accent YaPS, больше Yango → accent Yango Play) |
//               'accent YaPS' | 'accent Yango Play'. Allplay: своего акцента нет, 'auto' его не узнает (шрифты как у
//               Yango Play) — для Allplay-экранов значение задаёт пользователь, иначе такие экраны в SKIP.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const SKIP = new Set([]);     // id секций/экранов, которые не трогать
const BRAND_ACCENT = 'auto';
const OLD = { // ключ старого сета (8) → карта Type; 'BRAND' = акцент бренда
  '4a588e2a': { primary: 'secondary', secondary: 'secondary', 'extra-2': 'secondary', inverted: 'white', 'extra-1': 'dark', plain: 'plain', 'accent Yango Play': 'accent Yango Play', 'accent YaPS': 'accent YaPS', accent: 'BRAND' },
  'd8b30834': { primary: 'secondary', secondary: 'secondary', 'extra-2': 'secondary', inverted: 'white', 'extra-1': 'dark', plain: 'plain', accent: 'BRAND' },
  '5f513748': { primary: 'secondary', secondary: 'secondary', 'primary-strict': 'dark', inverted: 'dark', 'extra-1': 'white', 'extra-2': 'white', accent: 'BRAND', plain: 'plain' } };
const SIZE = { 'sm • 32px': 'S • 32px', 'md • 40px': 'M • 40px', 'lg • 44px': 'M • 40px', 'xl • 48px': 'L • 48px', '2xl • 52px': 'XL • 52px' };
const KEY = '2781fb17aa9a7986b89626d2e769efad4c8ade7c';
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const norm = s => s.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim();
const isVis = (n, root) => { let a = n; while (a && a.id !== root.id && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const isIcon = n => n.type === 'INSTANCE' && n.mainComponent && /^icon/i.test(norm(setOf(n.mainComponent).name));
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
/*@GUARD*/
function geoOf(X) { const par = X.parent; const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE'); let lsh = null, lsv = null, la = null, lg = null; try { lsh = X.layoutSizingHorizontal; lsv = X.layoutSizingVertical; la = X.layoutAlign; lg = X.layoutGrow; } catch (e) {} return { x: X.x, y: X.y, w: X.width, h: X.height, pos: X.layoutPositioning, c: X.constraints, lsh, lsv, la, lg, vis: X.visible, op: X.opacity, idx: par.children.findIndex(c => c.id === X.id), parentAL }; }
function geoApply(N, g) { try { if (N.layoutPositioning !== g.pos) N.layoutPositioning = g.pos; } catch (e) {} try { N.constraints = g.c; } catch (e) {} if (g.pos === 'ABSOLUTE' || !g.parentAL) { N.x = g.x; N.y = g.y; } else { try { if (g.la) N.layoutAlign = g.la; if (g.lg) N.layoutGrow = g.lg; } catch (e) {} } try { if (g.lsh === 'FILL') N.layoutSizingHorizontal = 'FILL'; else N.resize(g.w, N.height); if (g.lsv === 'FILL') N.layoutSizingVertical = 'FILL'; } catch (e) { try { N.resize(g.w, N.height); } catch (e2) {} } N.visible = g.vis; N.opacity = g.op; }
const brandCache = {}; const brandOf = unit => { if (brandCache[unit.id]) return brandCache[unit.id]; let y = 0, ys = 0; for (const t of unit.findAllWithCriteria({ types: ['TEXT'] })) { const f = t.fontName === figma.mixed ? '' : t.fontName.family; if (/^Yango/.test(f)) y++; else if (/^YS/.test(f)) ys++; } return brandCache[unit.id] = y > ys ? 'accent Yango Play' : 'accent YaPS'; };
const set = await figma.importComponentSetByKeyAsync(KEY);
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { ok: 0, fail: [], skip: [], map: {}, sample: {} }; out[esc(pg.name).slice(0, 20)] = R;
  const targets = [];
  for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { const M = i.mainComponent; if (!M || !M.remote) continue; const k8 = setOf(M).key.slice(0, 8); if (!OLD[k8]) continue;
    let a = i.parent, inInst = false, skip = false, unit = i; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } if (SKIP.has(a.id)) skip = true; if (a.type !== 'SECTION') unit = a; a = a.parent; } if (inInst || skip) continue; targets.push([i.id, k8, unit.id]); }
  for (const [xid, k8, uid] of targets) { let N = null, GG = null; const X = await figma.getNodeByIdAsync(xid); if (!X || X.removed) continue; try {
    const vp = vpOf(X.mainComponent.name); let type = OLD[k8][vp.Type]; if (type === 'BRAND') type = BRAND_ACCENT === 'auto' ? brandOf(await figma.getNodeByIdAsync(uid)) : BRAND_ACCENT;
    const size = SIZE[vp.Size] || vp.Size, icon = vp.Icon || 'false', state = vp.State || 'default';
    if (!type) { R.skip.push(xid + ' type ' + esc(vp.Type || X.mainComponent.name).slice(0, 30)); continue; }
    const vn = 'Size=' + size + ', Type=' + type + ', Icon=' + icon + ', State=' + state; const tgt = set.children.find(c => c.name === vn); if (!tgt) { R.skip.push(xid + ' novariant ' + esc(vn)); continue; }
    const labelNode = X.findOne(n => n.type === 'TEXT'); const label = labelNode ? labelNode.characters : null;
    const glyph = X.findOne(isIcon); const glyphMain = glyph ? glyph.mainComponent : null; const glyphKey = glyphMain ? setOf(glyphMain).key : null;
    const g = geoOf(X); const par = X.parent; GG = geoGuard(X);
    N = tgt.createInstance(); for (const t of N.findAll(n => n.type === 'TEXT')) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); }
    par.insertChild(g.idx, N);
    const tk = Object.keys(N.componentProperties).find(k => /^Text#/.test(k)); if (tk && label !== null && icon !== 'only') N.setProperties({ [tk]: label });
    if (glyphMain && icon !== 'false') { const slot = N.findOne(isIcon); if (slot && slot.mainComponent.id !== glyphMain.id) { try { slot.swapComponent(glyphMain); } catch (e) {} } }
    geoApply(N, g); N.name = 'button';
    const nl = N.findOne(n => n.type === 'TEXT' && isVis(n, N)); const okText = icon === 'only' || label === null || (nl ? nl.characters === label : state !== 'default');
    const ns = N.findOne(n => isIcon(n) && isVis(n, N)); const okIcon = !glyphMain || icon === 'false' || (ns && setOf(ns.mainComponent).key === glyphKey);
    const mv = GG.moved(N);
    if (okText && okIcon && !mv.length) { X.remove(); R.ok++; const mk = esc(vp.Size + '/' + vp.Type) + ' -> ' + esc(size + '/' + type); R.map[mk] = (R.map[mk] || 0) + 1; if (!R.sample[mk]) R.sample[mk] = N.id; }
    else { N.remove(); N = null; GG.repair(); R.fail.push(xid + (okText ? '' : ' text') + (okIcon ? '' : ' icon') + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '')); }
  } catch (e) { if (N && !N.removed) { try { N.remove(); } catch (e2) {} } if (GG) { try { GG.repair(); } catch (e3) {} } R.fail.push(xid + ' ERR ' + String(e.message || e).slice(0, 60)); } } }
return out;
