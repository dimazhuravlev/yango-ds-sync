// 04 — замена инстанса на двойник актуальной ДС с переносом оверрайдов по ИМЕННОМУ пути.
// Когда: двойник — копия старого компонента (та же структура), но слои переименованы (сняли `❌`, в т.ч. в середине
// имени: `. / ❌ navbar / searchbar`). swapComponent переносит оверрайды только при совпадении имён, поэтому
// после свапа скрипт сам переносит: булевы/текстовые/вариантные свойства (по имени свойства), видимость, тексты,
// глиф иконки — по пути «имя без ❌ + порядковый номер среди тёзок». Индексный путь не годится (ломается при
// другом порядке слоёв).
// Проверка в том же вызове: видимые тексты, видимые иконки, размер и позиция равны «до», иначе throw → откат всего.
// Корень скрытого инстанса проверяется тоже (собственная видимость корня не учитывается).
// JOBS: [[id инстанса, ключ сета | 'via:<ключ публичного родителя>:<8 символов ключа приватного сета>', имя варианта | null]]
//   null — вариант с тем же именем;  'via:' — приватный `. /` мастер не импортируется по ключу: берётся свежий
//   изнутри публичного родителя (так освежают устаревшие приватные компоненты, стоящие на экране).
// Не годится, когда структура разная (Top Navigation из пресета, ряд чипсов из кнопок) — там swap + resetOverrides
// + геометрия (references/twins.md), и для карточек с картинкой — 05-refresh-card.js.
const JOBS = [
  // ['2:26776', 'c90308b61da1ab53bb2c55f2717667466d41e3fd', null],                                   // ❌ navbar → navbar
  // ['2:32812', 'via:77b566d20c18c850b2d7a89f544cbbf63f423c45:6316fcc0', 'Type=action'],              // . / header / right
];
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const norm = s => s.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim(); // ❌ can sit mid-name: '. / ❌ navbar / searchbar'
const isVis = (n, root) => { let a = n; while (a && a !== root) { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
// isVis ignores the root's own visibility, so hidden roots are still verified
const visT = X => X.findAll(n => n.type === 'TEXT' && isVis(n, X)).map(t => t.characters);
const visI = X => X.findAll(n => n.type === 'INSTANCE' && isVis(n, X) && /^icon/.test(norm(setOf(n.mainComponent).name))).map(n => norm(setOf(n.mainComponent).name)).sort();
function walk(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { const k = norm(c.name); cnt[k] = (cnt[k] || 0) + 1; const p = path + '/' + k + '#' + cnt[k]; m.set(p, c); rec(c, p); } }; rec(root, ''); return m; }
function snap(root) { const out = []; for (const [p, n] of walk(root)) { const r = { p, vis: n.visible, type: n.type }; if (n.type === 'TEXT') r.chars = n.characters; if (n.type === 'INSTANCE') { r.main = n.mainComponent; r.setName = norm(setOf(n.mainComponent).name); try { r.props = Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) { r.props = {}; } } out.push(r); } return out; }
async function loadFonts(t) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); }
async function replay(X, S) {
  let M = walk(X);
  for (const r of S) { let n = M.get(r.p); if (n && n.removed) { M = walk(X); n = M.get(r.p); } if (!n || n.removed || n.type !== r.type) continue;
    if (r.type === 'INSTANCE') { if (r.setName !== norm(setOf(n.mainComponent).name) && /^icon/.test(r.setName)) { n.swapComponent(r.main); M = walk(X); n = M.get(r.p); } // icon glyph override; re-walk: swap kills old child nodes
      let defs; try { defs = n.componentProperties; } catch (e) { defs = {}; } const set = {};
      for (const [k, v] of Object.entries(defs)) { const b = k.replace(/#.*/, ''); if (b in r.props && r.props[b] !== v.value && v.type !== 'INSTANCE_SWAP') set[k] = r.props[b]; }
      if (Object.keys(set).length) { try { n.setProperties(set); } catch (e) { for (const [k, v] of Object.entries(set)) try { n.setProperties({ [k]: v }); } catch (e2) {} } } } }
  const M2 = walk(X);
  for (const r of S) { const n = M2.get(r.p); if (!n || n.removed || n.type !== r.type) continue; if (n.visible !== r.vis) { if (n.componentPropertyReferences && n.componentPropertyReferences.visible) continue; n.visible = r.vis; }
    if (r.type === 'TEXT' && n.characters !== r.chars) { if (n.componentPropertyReferences && n.componentPropertyReferences.characters) continue; await loadFonts(n); n.characters = r.chars; } }
}
const res = [];
for (const [id, key, vname] of JOBS) {
  const X = await figma.getNodeByIdAsync(id); let set;
  if (key.startsWith('via:')) { const [, pub, priv] = key.split(':'); const P = await figma.importComponentSetByKeyAsync(pub); let hit = null; for (const v of P.children) { hit = v.findOne(n => n.type === 'INSTANCE' && n.mainComponent && setOf(n.mainComponent).key.startsWith(priv)); if (hit) break; } if (!hit) throw new Error('private not found ' + priv); set = setOf(hit.mainComponent); }
  else set = await figma.importComponentSetByKeyAsync(key);
  const t0 = visT(X), i0 = visI(X), w = X.width, h = X.height, x = X.x, y = X.y, name = X.name, sh = X.layoutSizingHorizontal, sv = X.layoutSizingVertical;
  const S = snap(X); const tgt = set.type === 'COMPONENT_SET' ? set.children.find(c => c.name === (vname || X.mainComponent.name)) : set; if (!tgt) throw new Error('no variant ' + esc(X.mainComponent.name));
  let rootProps = {}; try { rootProps = Object.fromEntries(Object.entries(X.componentProperties).filter(([k, v]) => v.type === 'BOOLEAN').map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) {}
  X.swapComponent(tgt); X.name = norm(name);
  const rs = {}; for (const [k, v] of Object.entries(X.componentProperties)) { const b = k.replace(/#.*/, ''); if (v.type === 'BOOLEAN' && b in rootProps && rootProps[b] !== v.value) rs[k] = rootProps[b]; } if (Object.keys(rs).length) X.setProperties(rs);
  await replay(X, S); await replay(X, S); // second pass: nodes exposed by first-pass booleans
  try { X.layoutSizingHorizontal = sh; X.layoutSizingVertical = sv; } catch (e) {} if (Math.abs(X.width - w) > .5 || Math.abs(X.height - h) > .5) { try { X.resize(w, h); } catch (e) {} }
  const t1 = visT(X), i1 = visI(X);
  res.push({ id, ok: JSON.stringify(t0) === JSON.stringify(t1) && JSON.stringify(i0) === JSON.stringify(i1) && Math.abs(X.width - w) < .5 && Math.abs(X.height - h) < .5 && X.x === x && X.y === y, t0: esc(t0.join('|')), t1: esc(t1.join('|')), i0: i0.join(','), i1: i1.join(','), sz: Math.round(X.width) + 'x' + Math.round(X.height) });
}
const bad = res.filter(r => !r.ok); if (bad.length) throw new Error('ROLLBACK ' + JSON.stringify(bad));
return res;
