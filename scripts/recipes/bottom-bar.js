// Нижний блок экрана: каждая пара Tabbar (d20586ba) + mini-player (8b758065) → один вертикальный
// auto-layout фрейм `bottom bar`: mini-player сверху и выше по слоям (itemReverseZIndex), Tabbar снизу, itemSpacing 8, паддинги 0, без заливки, дети FILL по
// ширине, ширина = ширина таббара, прижат к низу (констрейнты STRETCH/MAX; в auto-layout-экране ABSOLUTE). Существующая
// обёртка ровно из этой пары переиспользуется (переименовать, включить auto-layout); одиночные обёртки вокруг T/M
// снимаются. У Tabbar вложенный `underlay gradient` → `with player` = видимость мини-плеера. Скрытый mini-player остаётся
// в блоке (auto-layout его не раскладывает), отступ тогда не проверяется. SKIP_ROOT — секции и экраны вне задачи.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"'); const SKIP_ROOT = new Set([]); const DRY = true; // SKIP_ROOT — id секций/экранов, которые не трогать; сначала DRY
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const inInst = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE' || a.type === 'COMPONENT' || SKIP_ROOT.has(a.id)) return true; a = a.parent; } return false; };
const k8 = n => { try { return n.type === 'INSTANCE' ? setOf(n.mainComponent).key.slice(0, 8) : ''; } catch (e) { return ''; } };
const abs = n => n.absoluteBoundingBox; const idxOf = x => x.parent.children.findIndex(c => c.id === x.id); const isJunk = n => n.type === 'VECTOR' && n.width <= 1 && n.height <= 1;
function setWithPlayer(T, val) { const ug = T.findOne(n => n.type === 'INSTANCE' && /underlay gradient/i.test(n.name)); if (!ug) return 'no-ug'; const key = Object.keys(ug.componentProperties).find(k => k.replace(/#.*/, '') === 'with player'); if (!key) return 'no-prop'; ug.setProperties({ [key]: val }); return String(ug.componentProperties[key].value); }
/*@GUARD*/
const done = [], bad = [];
const fontsOf = async n => { const fs = new Set(); for (const t of n.findAllWithCriteria({ types: ['TEXT'] })) { if (t.fontName !== figma.mixed) fs.add(JSON.stringify(t.fontName)); else for (const g of t.getStyledTextSegments(['fontName'])) fs.add(JSON.stringify(g.fontName)); } for (const f of fs) { try { await figma.loadFontAsync(JSON.parse(f)); } catch (e) {} } }; // перенос слоя требует шрифтов
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync();
  const tabs = pg.findAllWithCriteria({ types: ['INSTANCE'] }).filter(i => k8(i) === 'd20586ba' && !inInst(i)); const players = pg.findAllWithCriteria({ types: ['INSTANCE'] }).filter(i => k8(i) === '8b758065' && !inInst(i));
  for (const T of tabs) { const ta = abs(T); if (!ta) continue;
    const M = players.find(p => { const pa = abs(p); return pa && Math.abs((pa.x + pa.width / 2) - (ta.x + ta.width / 2)) < 50 && ta.y - (pa.y + pa.height) >= -2 && ta.y - (pa.y + pa.height) <= 40; }); if (!M) continue;
    if (DRY) { const W = T.parent; done.push(T.id + (W.name === 'bottom bar' && W.layoutMode === 'VERTICAL' ? ' already' : ' todo') + ' in ' + esc(W.name).slice(0, 20)); continue; }
    await fontsOf(T); await fontsOf(M); const GG = geoGuard(T); let scr = T; while (scr.parent && !/^(SECTION|PAGE)$/.test(scr.parent.type) && !/stack/i.test(scr.parent.name)) scr = scr.parent; const GS = geoGuard(scr); // GG чинит сжатых родителей таббара, GS сверяет экран
    try { for (const n of [T, M]) { const W = n.parent; if (W.type === 'FRAME' && W.parent.type !== 'PAGE' && !W.children.some(c => c.id !== n.id && !isJunk(c))) { const P = W.parent; const b0 = abs(n); P.insertChild(idxOf(W), n); if (P.layoutMode && P.layoutMode !== 'NONE') { try { n.layoutPositioning = 'ABSOLUTE'; } catch (e) {} } const b1 = abs(n); n.x += b0.x - b1.x; n.y += b0.y - b1.y; for (const j of [...W.children]) if (isJunk(j)) j.remove(); if (!W.children.length) W.remove(); } }
      if (M.parent.id !== T.parent.id) { bad.push(T.id + ' different parents'); continue; }
      const P0 = T.parent; const tBottomGap = P0.height - (T.y + T.height); const tAbsBottom = ta.y + ta.height; const tx = T.x; let B;
      const onlyPair = P0.type === 'FRAME' && P0.parent.type !== 'PAGE' && P0.children.every(c => c.id === T.id || c.id === M.id || isJunk(c)) && !(P0.width >= 360 && P0.height >= 600);
      if (onlyPair) { B = P0; for (const j of [...B.children]) if (isJunk(j)) j.remove(); } else { B = figma.createFrame(); P0.insertChild(Math.max(idxOf(T), idxOf(M)) + 1, B); B.x = tx; B.y = T.y; B.resize(T.width, 10); B.appendChild(M); B.appendChild(T); }
      const P = B.parent; const parentAL = P.layoutMode && P.layoutMode !== 'NONE';
      B.name = 'bottom bar'; B.fills = []; B.strokes = []; B.effects = []; B.clipsContent = false; B.layoutMode = 'VERTICAL'; B.itemSpacing = 8; B.paddingTop = B.paddingBottom = B.paddingLeft = B.paddingRight = 0; B.primaryAxisAlignItems = 'MIN'; B.counterAxisAlignItems = 'MIN'; B.primaryAxisSizingMode = 'AUTO'; B.counterAxisSizingMode = 'FIXED'; B.itemReverseZIndex = true; // мини-плеер над таббаром, иначе его накрывает underlay gradient
      if (B.children[0].id !== M.id) B.insertChild(0, M); for (const c of [M, T]) { try { c.layoutPositioning = 'AUTO'; } catch (e) {} }
      if (Math.abs(B.width - T.width) > 0.5) B.resize(T.width, B.height); for (const c of [M, T]) { try { c.layoutSizingHorizontal = 'FILL'; } catch (e) {} }
      if (parentAL) { try { B.layoutPositioning = 'ABSOLUTE'; } catch (e) {} } try { B.constraints = { horizontal: 'STRETCH', vertical: 'MAX' }; } catch (e) {}
      B.x = tx; B.y = P.height - B.height - Math.max(0, Math.round(tBottomGap));
      const wp = setWithPlayer(T, M.visible ? 'true' : 'false');
      const ta2 = abs(T), ma2 = abs(M); const gap = M.visible ? Math.round(ta2.y - (ma2.y + ma2.height)) : 8; GG.repair(); const mv = GS.moved(scr); const ok = gap === 8 && Math.abs((ta2.y + ta2.height) - tAbsBottom) <= 1 && !mv.length; // экран и его предки не должны измениться
      (ok ? done : bad).push(T.id + ' B=' + B.id + ' h=' + Math.round(B.height) + ' wp=' + wp + (onlyPair ? ' reused' : ' new') + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '')); } catch (e) { bad.push(T.id + ' ERR ' + String(e).slice(0, 100)); } } }
return { DRY, doneN: done.length, bad, done: done.slice(0, 90) };
