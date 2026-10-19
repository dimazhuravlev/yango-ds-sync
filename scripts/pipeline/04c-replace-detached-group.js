// 04c — отвязанная копия СОСТАВНОГО компонента (карусель = шапка + ряд карточек), внутри которой уже живые
// инстансы того же компонента, что в мастере ДС Платформа (пример: `carousel / Movies` Type=top 10 — шапка `header`,
// карточки `card / poster / top-10`). → новый инстанс варианта ДС Платформа на том же месте, и все правки каждой
// внутренней карточки/шапки переносятся на соответствующий вложенный инстанс параллельным обходом:
// свойства компонента, свап вложенных, видимость, тексты, заливки (в т.ч. картинки), прозрачность.
// Пары внутренних инстансов — по порядку в слоте (01…06) и по совпадению главного компонента; если структура
// копии не совпадает с вариантом (другое число карточек, другие компоненты) — throw, такую копию не трогать.
// Сверка в том же вызове: видимые тексты, хеши видимых картинок, размер. Потом старый фрейм удаляется.
const SET_KEY = '4d1844b63ed905a432c3bb5c545593393d5ff6fe';   // ДС Платформа `carousel / Movies`
const JOBS = [
  // ['2:19013', 'Type=top 10, RTL=off, Size=medium'],
];
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const effVis = (n, root) => { let a = n; while (a && a !== root.parent) { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = X => X.findAll(n => n.type === 'TEXT' && effVis(n, X)).map(t => t.characters).sort();
const visImg = X => X.findAll(n => 'fills' in n && Array.isArray(n.fills) && effVis(n, X)).flatMap(n => n.fills.filter(f => f.type === 'IMAGE' && f.visible !== false).map(f => f.imageHash)).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// inInst: правки копируются только внутри живых инстансов; рамки самой отвязанной копии (её фреймы) не переносятся —
// иначе старые значения копии перекроют актуальный дизайн мастера
async function copyNode(src, dst, inInst = false) {
  if (src.type === 'INSTANCE' && dst.type === 'INSTANCE') { inInst = true;
    if (src.mainComponent.id !== dst.mainComponent.id) dst.swapComponent(src.mainComponent);
    let sp = {}, dp = {}; try { sp = src.componentProperties; dp = dst.componentProperties; } catch (e) {}
    const set = {}; for (const [k, v] of Object.entries(sp)) if (k in dp && v.type !== 'VARIANT' && v.type !== 'INSTANCE_SWAP' && dp[k].value !== v.value) set[k] = v.value; if (Object.keys(set).length) dst.setProperties(set);
  }
  if (inInst) {
  if (dst.visible !== src.visible && !(dst.componentPropertyReferences && dst.componentPropertyReferences.visible)) dst.visible = src.visible;
  if ('opacity' in src && dst.opacity !== src.opacity) dst.opacity = src.opacity;
  if ('fills' in src && Array.isArray(src.fills) && Array.isArray(dst.fills) && !same(src.fills, dst.fills)) { try { dst.fills = JSON.parse(JSON.stringify(src.fills)); } catch (e) {} }
  if (src.type === 'TEXT' && dst.type === 'TEXT' && src.characters !== dst.characters && !(dst.componentPropertyReferences && dst.componentPropertyReferences.characters)) { for (const f of dst.getRangeAllFontNames(0, dst.characters.length)) await figma.loadFontAsync(f); dst.characters = src.characters; }
  }
  if ('children' in src && 'children' in dst) { const sc = src.children, dc = dst.children; if (sc.length !== dc.length) throw new Error('structure differs at ' + esc(src.name) + ' ' + sc.length + '/' + dc.length); for (let i = 0; i < sc.length; i++) await copyNode(sc[i], dst.children[i], inInst); }
}
/*@GUARD*/
const S = await figma.importComponentSetByKeyAsync(SET_KEY);
const res = [];
for (const [id, vname] of JOBS) {
  const X = await figma.getNodeByIdAsync(id); const P = X.parent; const idx = P.children.indexOf(X);
  const t0 = visT(X), i0 = visImg(X), w = X.width, h = X.height, sh = X.layoutSizingHorizontal, sv = X.layoutSizingVertical;
  const V = S.children.find(c => c.name === vname); if (!V) throw new Error('no variant ' + vname);
  const GG = geoGuard(X); const I = V.createInstance(); P.insertChild(idx, I);
  const pAL = !!(P.layoutMode && P.layoutMode !== 'NONE'); try { if (X.layoutPositioning === 'ABSOLUTE' && pAL) I.layoutPositioning = 'ABSOLUTE'; } catch (e) {} if (!pAL || X.layoutPositioning === 'ABSOLUTE') { I.x = X.x; I.y = X.y; } try { I.constraints = X.constraints; } catch (e) {}
  try { I.layoutSizingHorizontal = sh; } catch (e) {} if (sh === 'FIXED') I.resize(w, I.height); try { I.layoutSizingVertical = sv; } catch (e) {}
  // корневые булевы (Header, 01…06) — по видимости соответствующих детей копии
  const props = {}; for (const [k, v] of Object.entries(I.componentProperties)) { if (v.type !== 'BOOLEAN') continue; const base = k.replace(/#.*/, ''); const node = X.findOne(n => n.name === (base === 'Header' ? 'header' : base)); if (node && node.visible !== v.value) props[k] = node.visible; } if (Object.keys(props).length) I.setProperties(props);
  // параллельный обход детей копии и инстанса
  if (X.children.length !== I.children.length) throw new Error('top structure differs ' + id);
  for (let k = 0; k < X.children.length; k++) await copyNode(X.children[k], I.children[k]);
  const t1 = visT(I), i1 = visImg(I); const mv = GG.moved(I);
  res.push({ id, inst: I.id, moved: mv.slice(0, 3), ok: !mv.length && same(t0, t1) && same(i0, i1) && Math.abs(I.width - w) < .5 && Math.abs(I.height - h) < .5, texts: same(t0, t1), imgs: same(i0, i1) + ' ' + i0.length, size: Math.round(w) + 'x' + Math.round(h) + ' -> ' + Math.round(I.width) + 'x' + Math.round(I.height), diff: same(t0, t1) ? '' : esc(JSON.stringify([t0.filter(x => !t1.includes(x)), t1.filter(x => !t0.includes(x))])).slice(0, 300) });
  X.remove();
}
const bad = res.filter(r => !r.ok); if (bad.length) throw new Error('ROLLBACK ' + JSON.stringify(bad));
return res;
