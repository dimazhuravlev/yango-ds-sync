// ── snap-unit: что слепок хранит по экрану (общая выборка 00c и 01b). build.py вставляет вместо /*@SNAP*/ ───────────
// t: [текст, кегль, id, x, y, видимая доля 0–1] — доля с учётом обрезки родителями (clipsContent): текст, который
//    остался в дереве, но спрятан сжатым контейнером, сверка увидит как «обрезан», а не как «на месте».
// im: [hash, id, x, y]; i: иконки и бейджи; b: дети экрана [id, имя, видим, bbox]; f: свои фреймы с детьми (не внутри
// инстансов) [id, w, h, имя] — ловит сжатые и раздувшиеся контейнеры. Координаты — от левого верхнего угла экрана.
const __R = n => { const b = n.absoluteBoundingBox; return b ? [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] : null; };
const __ICON = /^\s*(icons?|nameplates|badges?|card \/ rating|card \/ nameplates|logo)\b/i;
const __isect = (a, b) => { if (!a || !b) return a || b; const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y); return { x, y, width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x), height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y) }; };
function snapUnit(u) {
  const ub = u.absoluteBoundingBox || { x: 0, y: 0 }; const r = { n: u.name.slice(0, 60), bb: __R(u), t: [], im: [], i: [], b: [], f: [] };
  const take = (n, v, clip, inInst) => { if (!v) return; const b = n.absoluteBoundingBox; const rx = b ? Math.round(b.x - ub.x) : 0, ry = b ? Math.round(b.y - ub.y) : 0;
    if (n.type === 'TEXT') { const ch = n.characters; if (ch.trim()) { let va = 1; if (b && clip && b.width * b.height > 0) { const s = __isect(b, clip); va = Math.round(s.width * s.height / (b.width * b.height) * 100) / 100; }
      r.t.push([ch.slice(0, 300), typeof n.fontSize === 'number' ? Math.round(n.fontSize * 100) / 100 : 0, n.id, rx, ry, va]); } }
    if ('fills' in n && Array.isArray(n.fills)) for (const f of n.fills) if (f.type === 'IMAGE' && f.visible !== false && f.imageHash) r.im.push([f.imageHash, n.id, rx, ry]);
    if (n.type === 'FRAME' && !inInst && n.children.length) r.f.push([n.id, Math.round(n.width), Math.round(n.height), n.name.slice(0, 20)]);
    if (n.type === 'INSTANCE') { let M = null; try { M = n.mainComponent; } catch (e) {} if (M) { const S = M.parent && M.parent.type === 'COMPONENT_SET' ? M.parent : M; const nm = S.name.trim(); if (__ICON.test(nm)) { let ty = ''; try { ty = (n.variantProperties || {}).Type || ''; } catch (e) {} r.i.push(nm.slice(0, 40) + (ty ? ':' + ty : '')); } } } };
  const rec = (n, vis, clip, inInst) => { const v = vis && n.visible !== false && !('opacity' in n && n.opacity === 0); take(n, v, clip, inInst);
    if ('children' in n) { const c2 = ('clipsContent' in n && n.clipsContent) ? __isect(clip, n.absoluteBoundingBox) : clip; const ii = inInst || n.type === 'INSTANCE'; for (const c of n.children) rec(c, v, c2, ii); } };
  const uclip = ('clipsContent' in u && u.clipsContent) ? u.absoluteBoundingBox : null;
  if ('children' in u) { for (const c of u.children) { r.b.push([c.id, c.name.slice(0, 30), c.visible ? 1 : 0, __R(c)]); rec(c, true, uclip, u.type === 'INSTANCE'); } } else take(u, true, null, false);
  r.i.sort(); return r; }
// ── /snap-unit ─────────────────────────────────────────────────────────────────────────────────────────────────────
