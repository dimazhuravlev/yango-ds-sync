// 05 — освежить устаревшие карточки-постеры `. / card / poster` (приватный компонент ДС Платформа, стоящий на экране сам
// по себе: «принять обновления» его не обновляет). Перенос по РОЛЯМ, не по слоям: картинка, заголовок, булевы
// свойства, размер, бейджи.
// Почему не 04: у свежей версии другие слои (`text-label / title` вместо `title`, бейджи собраны в `badges`),
// перенос по имени теряет заголовок и включает лишние бейджи.
// Порядок для каждого: снять видимые тексты, заливку картинки, размер и булевы → swapComponent на тот же вариант
// свежего сета → булевы по имени → размер → картинка → заголовок через свойство Text# → бейджи по свойствам
// постера → если видимых текстов стало на один больше/меньше — подставить → сверка (тексты, хеш картинки, размер),
// иначе throw (откат всего вызова).
// БЕЙДЖИ: тексты их не ловят. После прогона — скриншоты 3–5 постеров против копии, особенно с Rating / Nameplates /
// Top 10: старый «замок» (monetization) мог стоять в слоте рейтинга — тогда `Show upsale` = true, `Show rating` = false.
const PARENT_KEY = '28f153dd72f25c59976542084c60544ee32a2f89'; // публичный `card / poster / default`, внутри — свежий приватный
const PRIVATE = 'd2146131';                                      // `. / card / poster`
const PAGE = 'Mobile';   // подстрока имени страницы
const ONLY = null;                                               // [id, …] — ограничить (сначала 1–2 штуки)
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const p = figma.root.children.find(x => x.name.includes(PAGE)); await p.loadAsync();
const fresh = (await figma.importComponentSetByKeyAsync(PARENT_KEY)).children[0].findOne(n => n.type === 'INSTANCE' && n.mainComponent && setOf(n.mainComponent).key.startsWith(PRIVATE)).mainComponent; const FS = setOf(fresh);
const visTN = n => { const o = []; const w = (x, v) => { const vv = v && x.visible !== false && !('opacity' in x && x.opacity === 0); if (x.type === 'TEXT') { if (vv) o.push(x); return; } if ('children' in x) for (const c of x.children) w(c, vv); }; w(n, true); return o; };
const visTexts = n => visTN(n).map(t => t.characters);
const imgOf = X => { const c = X.findOne(n => n.name === 'card' && n.type === 'INSTANCE'); return c ? c.findOne(n => n.name === 'image' && 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')) : null; };
const titleInst = X => X.findOne(n => n.type === 'INSTANCE' && n.mainComponent && /text-label \/ title|^title$/.test(setOf(n.mainComponent).name.trim()));
async function setText(t, s) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters; if (ref) { let a = t.parent; while (a && !(a.type === 'INSTANCE' && ref in a.componentProperties)) a = a.parent; if (a) { a.setProperties({ [ref]: s }); return; } } t.characters = s; }
function reveal(t, root) { let a = t; while (a && a.id !== root.id) { if (a.visible === false) { const ref = a.componentPropertyReferences && a.componentPropertyReferences.visible; let done = false; if (ref) { let o = a.parent; while (o && o.id !== root.parent.id) { if (o.type === 'INSTANCE') { let pr = null; try { pr = o.componentProperties; } catch (e) {} if (pr && pr[ref]) { o.setProperties({ [ref]: true }); done = true; break; } } o = o.parent; } } if (!done) a.visible = true; } a = a.parent; } }
async function migrate(X) {
  const t0 = visTexts(X); const im0 = imgOf(X); const fills = im0 ? JSON.parse(JSON.stringify(im0.fills)) : null; const h0 = im0 ? im0.fills.filter(f => f.type === 'IMAGE').map(f => f.imageHash).join() : '';
  const w = X.width, h = X.height, lsh = X.layoutSizingHorizontal, lsv = X.layoutSizingVertical, sp = X.itemSpacing; const props = {}; for (const [k, v] of Object.entries(X.componentProperties)) if (v.type === 'BOOLEAN') props[k.replace(/#.*/, '')] = v.value;
  const ti0 = titleInst(X); const tt0 = ti0 ? ti0.findOne(n => n.type === 'TEXT' && n.parent.name === 'text') || ti0.findOne(n => n.type === 'TEXT') : null; const titleText = tt0 ? tt0.characters : null;
  X.swapComponent(FS.children.find(c => c.name === X.mainComponent.name));
  const set = {}; for (const [k, v] of Object.entries(X.componentProperties)) { const b = k.replace(/#.*/, ''); if (v.type === 'BOOLEAN' && b in props && v.value !== props[b]) set[k] = props[b]; } if (Object.keys(set).length) X.setProperties(set);
  try { X.layoutSizingHorizontal = lsh; X.layoutSizingVertical = lsv; } catch (e) {} if (Math.abs(X.width - w) > 0.01 || Math.abs(X.height - h) > 0.01) { try { X.resize(w, h); } catch (e) {} } if (typeof sp === 'number') try { X.itemSpacing = sp; } catch (e) {}
  const im1 = imgOf(X); if (im1 && fills) im1.fills = fills;
  const ti1 = titleInst(X); if (ti1 && titleText != null) { const ntt = ti1.findOne(n => n.type === 'TEXT'); const tp = Object.keys(ti1.componentProperties).find(k => /^Text#/.test(k)); for (const f of ntt.getRangeAllFontNames(0, ntt.characters.length)) await figma.loadFontAsync(f); if (tp) ti1.setProperties({ [tp]: titleText }); else ntt.characters = titleText; }
  const b = X.findOne(n => n.type === 'INSTANCE' && n.name === 'badges'); if (b) { const want = { 'Show bookmark': false, 'Show anounce': false, 'Show upsale': !!props.Nameplates, 'Show rating': !!props.Rating, 'Show top-10': !!props['Top 10'] }; const bs = {}; for (const [k, v] of Object.entries(b.componentProperties)) { const base = k.replace(/#.*/, ''); if (base in want && v.value !== want[base]) bs[k] = want[base]; } if (Object.keys(bs).length) b.setProperties(bs); }
  let missing = t0.filter(t => !visTexts(X).includes(t)); const extra = visTN(X).filter(t => !t0.includes(t.characters));
  if (missing.length === 1 && extra.length === 1) { await setText(extra[0], missing[0]); missing = t0.filter(t => !visTexts(X).includes(t)); }
  // у свежего постера вторая подпись (описание, роль актёра) скрыта — включить слот и вписать
  if (missing.length === 1) { const descI = X.findOne(n => n.type === 'INSTANCE' && n.mainComponent && /text-label \/ description/.test(setOf(n.mainComponent).name)); if (descI) { reveal(descI, X); const dt = descI.findOne(n => n.type === 'TEXT' && n.name === 'label' && n.visible) || descI.findOne(n => n.type === 'TEXT'); if (dt) { reveal(dt, X); await setText(dt, missing[0]); } } }
  const t1 = visTexts(X); const h1 = im1 ? im1.fills.filter(f => f.type === 'IMAGE').map(f => f.imageHash).join() : '';
  return { id: X.id, ok: JSON.stringify([...t0].sort()) === JSON.stringify([...t1].sort()) && h0 === h1 && Math.abs(X.width - w) < 0.5 && Math.abs(X.height - h) < 0.5, t0: esc(t0.join('|')), t1: esc(t1.join('|')), img: h0 === h1 };
}
const xs = p.findAllWithCriteria({ types: ['INSTANCE'] }).filter(i => { if (ONLY && !ONLY.includes(i.id)) return false; const m = i.mainComponent; if (!m || !m.remote || !setOf(m).key.startsWith(PRIVATE) || setOf(m).id === FS.id) return false; let a = i.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return false; a = a.parent; } return true; });
const res = []; for (const X of xs) res.push(await migrate(X));
const bad = res.filter(r => !r.ok); if (bad.length) throw new Error('ROLLBACK ' + bad.length + '/' + res.length + ' ' + JSON.stringify(bad.slice(0, 3)));
return { n: res.length, ids: res.map(r => r.id) };
