// swap-variant-verified.js — перевести инстансы варианта ДС на другой вариант с той же раскладкой слоёв (например,
// локальная копия атома в мастере → инстанс атома) без потери правок: swapComponent переносит оверрайды по именам слоёв,
// в том числе через границу «фрейм → инстанс». Каждый инстанс сверяется до/после по всем слоям (тексты, стиль текста,
// шрифт, видимость, заливки и обводки, подмены иконок, экспорт, геометрия), корень — по размеру, отступам, выравниванию,
// месту в родителе, соседям, прототипу. Любое расхождение — throw: страница откатывается целиком (всё или ничего).
// Вложенные в другие инстансы (компоненты форка ДС хранят те же ключи) не трогаются — возвращаются списком.
// Новый вариант берётся из опубликованной ДС по ключу: «Update all» в макете не нужен.
// Запуск: одна страница на вызов (страницы параллельно); сначала ONLY с 1–2 id и скриншоты до/после.
const PAGE_ID = '';          // id страницы макета
const ONLY = null;           // null или [id инстансов] — пилот
const LIMIT = 0;             // 0 — все
const MAP = {};              // { 'ключ старого варианта': 'ключ нового варианта', … } (RTL=off → RTL=off и т. д.)
const ROOT_CHILD = 'player'; // слой, от которого сверяются пути (заменённый фрейм / атом)
const TN = 'player/stack/track info/track name'; // под этим путём допускается другая ширина и x (тексты FILL + обрезка вместо HUG)
if (!PAGE_ID || !Object.keys(MAP).length) throw new Error('CONFIG: PAGE_ID и MAP обязательны');
figma.skipInvisibleInstanceChildren = false;
const page = figma.root.children.find(p => p.id === PAGE_ID);
await figma.setCurrentPageAsync(page);
const targets = [], nested = [];
for (const i of page.findAllWithCriteria({ types: ['INSTANCE'] })) { let mc; try { mc = i.mainComponent; } catch (e) { continue; } if (mc && MAP[mc.key] && (!ONLY || ONLY.includes(i.id))) { let a = i.parent, nest = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { nest = true; break; } a = a.parent; } if (nest) nested.push(i.id); else targets.push(i.id); } }
const ids = LIMIT ? targets.slice(0, LIMIT) : targets;
const fresh = {}; for (const [o, n] of Object.entries(MAP)) fresh[o] = await figma.importComponentByKeyAsync(n);
const fontsDone = new Set();
async function loadFonts(root) { for (const t of root.findAll(x => x.type === 'TEXT')) { let segs = []; try { segs = t.getStyledTextSegments(['fontName']); } catch (e) {} for (const s of segs) { const k = s.fontName.family + '|' + s.fontName.style; if (fontsDone.has(k)) continue; fontsDone.add(k); try { await figma.loadFontAsync(s.fontName); } catch (e) {} } } }
for (const v of Object.values(fresh)) await loadFonts(v);
const pd = ps => !Array.isArray(ps) ? String(ps) : ps.map(f => f.type + (f.visible === false ? '-' : '') + (f.imageHash || '') + (f.color ? [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255)).join(',') : '') + (f.opacity !== undefined ? '@' + Math.round(f.opacity * 100) : '') + (f.boundVariables && f.boundVariables.color ? '#' + f.boundVariables.color.id.split('/')[0].slice(-10) : '')).join('|');
const R = n => { const b = n.absoluteBoundingBox; return b ? [b.x, b.y, b.width, b.height].map(v => Math.round(v * 2) / 2) : null; };
function state(root) {
  const B = root.absoluteBoundingBox; const acc = {};
  const st = { name: root.name, vis: root.visible, box: R(root), op: root.opacity, lp: root.layoutPositioning, sz: [root.layoutSizingHorizontal, root.layoutSizingVertical].join(), pad: [root.paddingTop, root.paddingRight, root.paddingBottom, root.paddingLeft].join(), al: [root.primaryAxisAlignItems, root.counterAxisAlignItems].join(), react: JSON.stringify(root.reactions).length, parent: root.parent.id, pbox: R(root.parent), idx: root.parent.children.findIndex(c => c.id === root.id), sib: root.parent.children.map(c => R(c) + '').join(';') };
  (function walk(n, path) {
    const b = n.absoluteBoundingBox; const o = {};
    o.v = n.visible; o.op = n.opacity;
    if (b && B) o.g = [b.x - B.x, b.y - B.y, b.width, b.height].map(v => Math.round(v * 2) / 2);
    if (n.type === 'TEXT') { o.t = n.characters; o.ts = n.textStyleId; try { o.fn = JSON.stringify(n.getStyledTextSegments(['fontName', 'fontSize']).map(s => [s.fontName.family, s.fontName.style, s.fontSize])); } catch (e) {} }
    if ('fills' in n) o.f = pd(n.fills);
    if ('strokes' in n) o.s = pd(n.strokes);
    if ('fillStyleId' in n) o.fs = String(n.fillStyleId);
    if (n.type === 'INSTANCE' && path !== ROOT_CHILD) { try { const m = n.mainComponent; o.m = m.key; } catch (e) {} }
    if (n.exportSettings) o.ex = n.exportSettings.length;
    acc[path] = o;
    if ('children' in n) { const cnt = {}; for (const c of n.children) { cnt[c.name] = (cnt[c.name] || 0) + 1; walk(c, path + '/' + c.name + (cnt[c.name] > 1 ? '#' + cnt[c.name] : '')); } }
  })(root.children.find(c => c.name === ROOT_CHILD) || root, ROOT_CHILD);
  return { st, acc };
}
const bad = [], trunc = [], done = [];
for (const id of ids) {
  const i = await figma.getNodeByIdAsync(id); if (!i) { bad.push(id + ' gone'); continue; }
  await loadFonts(i);
  const nv = fresh[i.mainComponent.key];
  const A = state(i);
  i.swapComponent(nv);
  if (i.name !== A.st.name) i.name = A.st.name;
  const Bs = state(i);
  const d = [];
  for (const k of Object.keys(A.st)) if (JSON.stringify(A.st[k]) !== JSON.stringify(Bs.st[k])) d.push('root.' + k + ' ' + String(A.st[k]).slice(0, 60) + '→' + String(Bs.st[k]).slice(0, 60));
  for (const p of new Set([...Object.keys(A.acc), ...Object.keys(Bs.acc)])) {
    const a = A.acc[p], b = Bs.acc[p];
    if (!a || !b) { d.push(p + (a ? ' lost' : ' new')); continue; }
    for (const f of Object.keys(a)) {
      if (f === 'g' && p.startsWith(TN + '/')) { if (a.g[1] !== b.g[1] || a.g[3] !== b.g[3]) d.push(p + ' g ' + a.g + '→' + b.g); if (a.v && (p.endsWith('/title') || p.endsWith('/description')) && b.g[2] + 0.5 < a.g[2]) trunc.push(id + ' ' + p.split('/').pop() + ' ' + a.g[2] + '>' + b.g[2]); continue; }
      if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) d.push(p + ' ' + f + ' ' + String(JSON.stringify(a[f])).slice(0, 80) + '→' + String(JSON.stringify(b[f])).slice(0, 80));
    }
  }
  if (d.length) bad.push({ id, d: d.slice(0, 8), n: d.length }); else done.push(id);
}
if (bad.length) throw new Error('MISMATCH ' + JSON.stringify({ page: page.name, bad: bad.slice(0, 4), nbad: bad.length, ok: done.length }).slice(0, 4000));
return { page: page.name, nested: nested.slice(0, 5), nNested: nested.length, found: targets.length, swapped: done.length, trunc, sample: done.slice(0, 3) };
