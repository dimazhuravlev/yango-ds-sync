// 09 — привести экраны к формату: ширина 375, высота 812 у «телефонных» экранов (если высота ≤ MAX_PHONE —
// лента остаётся своей длины), верхние элементы (статус-бар, навбар, Top Navigation) прибиты к верху, нижние
// (таббар, мини-плеер, home indicator, шторки, нижний ряд кнопок) — к низу. Экран без auto-layout: дети
// получают констрейнты; экран с auto-layout: прибитые элементы становятся ABSOLUTE с констрейнтами.
// Ширина: дети с левым и правым краем у границ экрана → STRETCH; остальные остаются как есть. Отчёт по каждому экрану:
// что изменилось и что надо проверить глазами (элементы шире 375 после ужатия, переполнение).
const IDS = [];           // id экранов
const WIDTH = 375, PHONE_H = 812, MAX_PHONE = 1000; const PIN_IN_AL = false;
const TOP = /status|navbar|navigation|top nav|header/i, BOTTOM = /tabbar|tab bar|mini-player|home.?indicator|bottom sheet|sheet|toast/i;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const out = [];
for (const id of IDS) { const S = await figma.getNodeByIdAsync(id); if (!S) { out.push(id + ' missing'); continue; }
  const w0 = S.width, h0 = S.height; const log = [];
  const phone = h0 <= MAX_PHONE; const targetH = phone ? PHONE_H : h0;
  const kids = 'children' in S ? [...S.children] : [];
  // классификация детей по положению до ресайза; EDGE — зона у края, в которой элемент считается прибитым к краю
  const EDGE = 24;
  const classify = (F, w, h, depth) => { const AL = F.layoutMode && F.layoutMode !== 'NONE';
    for (const c of F.children) { if (!('constraints' in c)) continue;
      const top = c.y <= 1 || TOP.test(c.name), bottom = Math.abs(c.y + c.height - h) <= 2 || BOTTOM.test(c.name); // контент ниже края экрана — не «низ», а лента
      // прибитый к краю элемент чуть уже экрана (таббар 390 в экране 440) — дотянуть до ширины, иначе после ужатия вылезет
      if ((TOP.test(c.name) || BOTTOM.test(c.name) || c.width >= w - 2) && c.x <= 2 && c.width < w - 0.5 && c.width >= w * 0.8 && 'resize' in c) { try { c.resize(w, c.height); log.push('widen:' + esc(c.name).slice(0, 14)); } catch (e) {} }
      const full = c.x <= 2 && c.x + c.width >= w - 2, fullV = c.y <= 2 && Math.abs(c.y + c.height - h) <= 2;
      const right = !full && c.width <= 64 && c.x + c.width >= w - 1 - EDGE && c.x > EDGE, center = !full && Math.abs(c.x + c.width / 2 - w / 2) <= 1 && c.width < w - 2 * EDGE; // right — только мелкие кнопки у края: карточка карусели у края не «прибита» (лепестки «Моей волны»)
      // в экране с auto-layout прибитые элементы НЕ выводим из потока: вынутый из потока статус-бар схлопывает поток, контент
      // уезжает под шапку; таббар/шапка в потоке и так стоят у краёв. PIN_IN_AL=true — старое поведение.
      if (PIN_IN_AL && AL && (top || bottom) && c.layoutPositioning !== 'ABSOLUTE') { const x0 = c.x, y0 = c.y; c.layoutPositioning = 'ABSOLUTE'; c.x = x0; c.y = y0; log.push('abs:' + esc(c.name).slice(0, 14)); }
      if (!AL || c.layoutPositioning === 'ABSOLUTE') { const hc = full ? 'STRETCH' : right ? 'MAX' : center ? 'CENTER' : c.constraints.horizontal; const vc = fullV ? 'STRETCH' : bottom ? 'MAX' : top ? 'MIN' : c.constraints.vertical;
        if (hc !== c.constraints.horizontal || vc !== c.constraints.vertical) { c.constraints = { horizontal: hc, vertical: vc }; log.push((depth ? '>' : '') + esc(c.name).slice(0, 14) + ':' + hc[0] + vc[0]); } }
      // свой фрейм без auto-layout на всю ширину: его абсолютные дети тоже должны следовать за шириной
      if (depth < 2 && full && c.type === 'FRAME' && (!c.layoutMode || c.layoutMode === 'NONE') && c.children.length) classify(c, c.width, c.height, depth + 1);
      // свой auto-layout контейнер на всю ширину: его поточные дети с фиксированной шириной экрана → FILL (иначе после ужатия торчат)
      if (depth < 3 && full && c.type === 'FRAME' && c.layoutMode && c.layoutMode !== 'NONE' && c.children.length) fillKids(c, w, depth + 1); }
    if (!depth && AL) { F.primaryAxisSizingMode = 'FIXED'; F.counterAxisSizingMode = 'FIXED'; } };
  // абсолютный ребёнок auto-layout контейнера во всю ширину (Fade в шапке) — растянуть; поточные FIXED шириной экрана → FILL
  // (заметно шире экрана, например hero 480 в 440, — намеренно: не трогать)
  const fillKids = (F, w, depth) => { if (F.visible === false) return; w = F.width; /* сравнивать с шириной контейнера, не экрана: FIXED 375 в скрытом контейнере 440 иначе станет 440 (Книги) */ for (const k of F.children) { if (!('layoutSizingHorizontal' in k)) continue;
      if (k.layoutPositioning === 'ABSOLUTE') { if (k.x <= 2 && k.width >= w - 2 && k.width <= w + 8 && 'resize' in k) { try { k.resize(w, k.height); k.constraints = { horizontal: 'STRETCH', vertical: k.constraints.vertical }; log.push('absfill:' + esc(k.name).slice(0, 14)); } catch (e) {} } continue; } try { if (k.width >= w - 2 && k.layoutSizingHorizontal === 'FIXED') { k.layoutSizingHorizontal = 'FILL'; log.push('fill:' + esc(k.name).slice(0, 14)); } } catch (e) {} if (depth < 3 && k.type === 'FRAME' && k.width >= w - 2 && 'children' in k && k.children.length) { if (k.layoutMode && k.layoutMode !== 'NONE') fillKids(k, w, depth + 1); else classify(k, k.width, k.height, depth + 1); } } };
  classify(S, w0, h0, 0); if (S.layoutMode && S.layoutMode !== 'NONE') fillKids(S, w0, 0);
  if (Math.abs(w0 - WIDTH) > .5 || Math.abs(h0 - targetH) > .5) { S.resize(WIDTH, targetH); log.push('resize ' + Math.round(w0) + 'x' + Math.round(h0) + '->' + WIDTH + 'x' + targetH); }
  // что проверить глазами
  const wide = S.findAll(n => n.width > WIDTH + 1 && n.visible && !(n.type === 'RECTANGLE' && n.fills && n.fills.some(f => f.type === 'IMAGE'))).slice(0, 5).map(n => esc(n.name).slice(0, 14) + ' ' + Math.round(n.width));
  out.push(id + ' ' + log.join(' ') + (wide.length ? ' | WIDE: ' + wide.join(', ') : '')); }
return out;
