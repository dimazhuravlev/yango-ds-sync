// Заглушки в подписях карточек («Title», «Description», «Artist», «Year», «Autor»…) → настоящие названия по обложке.
// Слетевшие и стоявшие в макете изначально — только с разрешения дизайнера (SKILL.md, шаг 4b).
// Смысл строки: 'scan' отдаёт slots — для каждой заглушки карточку (сет компонента), слот (свойство или слой) и примеры
// уже заполненных таких же слотов в файле. Что вписывать — по примерам и references/placeholders.md, не по догадке.
// Вёрстка: 'write' после каждого текста сверяет карточку — её рамку, рамки всех слоёв внутри (кроме обёрток самого
// текста, им можно вырасти) и что текст с обёртками не вылез за карточку;
// что-то сдвинулось — текст возвращается, место в fit (причина: moved / overflow); sample — по карточке каждого сета.
// MODE 'scan'  — read-only: на экранах страницы группирует видимые заглушки по хешу обложки (верхний видимый IMAGE у
//                ближайшего предка с картинкой) и подсказывает подписи, которые уже стоят под той же обложкой в файле.
//                Заглушки за краем экрана помечены clipped.
// MODE 'sheet' — временный фрейм-контакт-лист справа от страницы: обложки HASHES (6 символов) с подписью хеша. Снять
//                один скриншот, прочитать названия глазами, затем MODE 'clean' удаляет фрейм.
// MODE 'write' — MAP { hash6: { T: 'Название', D: 'Описание' } } для заглушек Title / Description и RULES
//                [[ [id экранов] | null, hash6 | '-' (без картинки) | null, 'текущий текст', 'новый' ]] для остальных.
//                Текст, привязанный к свойству, пишется через свойство инстанса-владельца; проверка после записи.
// Неопознанную обложку не выдумывать — в отчёт пользователю со ссылкой. Годы и авторы «по памяти» — помечать в отчёте.
const PAGE_ID = '0:1'; const MODE = 'scan';
const SKIP = new Set([]);          // id секций/экранов, которые не трогать
const PH = /^(Title|Description|Artist|Year|Autor|Author|Caption|Subtitle|Header Title|Название|Описание)$/;
const HASHES = [];                 // для 'sheet'
const MAP = {};                    // для 'write'
const RULES = [];                  // для 'write'
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const p = figma.root.children.find(x => x.id === PAGE_ID); await p.loadAsync();
const effVis = n => { let c = n; while (c && c.type !== 'PAGE') { if (c.visible === false || ('opacity' in c && c.opacity === 0)) return false; c = c.parent; } return true; };
const walk = (n, fn) => { fn(n); if ('children' in n) for (const c of n.children) walk(c, fn); };
const topImg = n => { if (!('fills' in n) || !Array.isArray(n.fills)) return ''; let h = ''; for (const f of n.fills) if (f.type === 'IMAGE' && f.visible !== false && f.imageHash) h = f.imageHash; return h; };
const findImg = root => { let h = ''; walk(root, m => { if (h || !effVis(m)) return; const x = topImg(m); if (x) h = x; }); return h; };
const coverOf = (n, u) => { let a = n.parent; while (a && a.id !== u.id && a.type !== 'PAGE') { const h = findImg(a); if (h) return h.slice(0, 6); a = a.parent; } return ''; };
const setOf = m => m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const cardOf = (n, u) => { let outer = null; for (let a = n.parent; a && a.id !== u.id && a.type !== 'PAGE'; a = a.parent) { if (a.type !== 'INSTANCE') continue; if (a.width >= 60 && a.height >= 40) return a; outer = a; } return outer || n.parent; };
const cardName = c => { if (c.type !== 'INSTANCE') return c.name; let M = null; try { M = c.mainComponent; } catch (e) {} return M ? setOf(M).name.trim() : c.name; };
const slotOf = (n, c) => { const ref = (n.componentPropertyReferences || {}).characters; if (ref) return 'prop ' + ref.replace(/#.*/, ''); const path = []; for (let a = n; a && a.id !== c.id; a = a.parent) path.unshift(a.name.trim()); return 'layer ' + path.join(' / '); };
const units = []; for (const top of p.children) { if (SKIP.has(top.id) || /^tmp covers/.test(top.name)) continue; for (const c of (top.type === 'SECTION' ? top.children : [top])) if (!SKIP.has(c.id) && c.type !== 'COMPONENT' && c.type !== 'COMPONENT_SET') units.push(c); }
if (MODE === 'scan') { const by = {}, hint = {};
  for (const u of units) { const ub = u.absoluteBoundingBox; if (!ub) continue;
    walk(u, n => { if (n.type !== 'TEXT' || !effVis(n)) return; const ch = n.characters.trim(); if (!ch) return; const h = coverOf(n, u);
      if (PH.test(ch)) { const b = n.absoluteBoundingBox; const clipped = b && (b.x >= ub.x + ub.width - 4 || b.x + b.width <= ub.x); const k = ch + (clipped ? ' (clipped)' : ''); const r = by[k] || (by[k] = {}); const kk = (h || '-'); r[kk] = r[kk] || { n: 0, ex: u.id + ' ' + n.id }; r[kk].n++; }
      else if (h && typeof n.fontSize === 'number' && n.fontSize <= 16) { const l = hint[h] || (hint[h] = []); const s = ch.slice(0, 30); if (l.length < 3 && !l.includes(s)) l.push(s); } }); }
  const out = {}; const need = new Set(); for (const [k, r] of Object.entries(by)) { out[esc(k)] = Object.entries(r).map(([h, v]) => h + ' x' + v.n + ' #' + v.ex.split(' ')[1]).slice(0, 40); for (const h of Object.keys(r)) need.add(h); }
  const hints = {}; for (const h of need) if (hint[h]) hints[h] = hint[h].map(esc);
  // смысл: карточка + слот → сколько заглушек и как этот же слот заполнен в других карточках файла
  const slots = {};
  for (const u of units) walk(u, n => { if (n.type !== 'TEXT' || !effVis(n)) return; const ch = n.characters.trim(); if (!ch) return; const c = cardOf(n, u); const k = esc(cardName(c)).slice(0, 40) + ' :: ' + esc(slotOf(n, c)).slice(0, 50);
    const r = slots[k] || (slots[k] = { ph: 0, ex: [] }); if (PH.test(ch)) r.ph++; else if (r.ex.length < 4 && !r.ex.includes(esc(ch).slice(0, 40))) r.ex.push(esc(ch).slice(0, 40)); });
  const slotsOut = {}; for (const [k, r] of Object.entries(slots)) if (r.ph) slotsOut[k] = r;
  return { placeholders: out, hintsFromFile: hints, slots: slotsOut }; }
if (MODE === 'sheet') { await figma.setCurrentPageAsync(p); const want = new Set(HASHES); const full = {};
  walk(p, n => { if ('fills' in n && Array.isArray(n.fills)) for (const f of n.fills) if (f.type === 'IMAGE' && f.imageHash && want.has(f.imageHash.slice(0, 6)) && !full[f.imageHash.slice(0, 6)]) full[f.imageHash.slice(0, 6)] = f.imageHash; });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); let maxX = 0; for (const c of p.children) { const b = c.absoluteBoundingBox; if (b) maxX = Math.max(maxX, b.x + b.width); }
  const fr = figma.createFrame(); fr.name = 'tmp covers (delete me)'; fr.x = maxX + 400; fr.y = 0; fr.fills = [{ type: 'SOLID', color: { r: .1, g: .1, b: .1 } }];
  const COLS = 8, W = 160, H = 220, PAD = 12; fr.resize(COLS * (W + PAD) + PAD, Math.ceil(HASHES.length / COLS) * (H + 40) + PAD);
  HASHES.forEach((k, i) => { const x = PAD + (i % COLS) * (W + PAD), y = PAD + Math.floor(i / COLS) * (H + 40); const r = figma.createRectangle(); r.resize(W, H); r.x = x; r.y = y; r.fills = full[k] ? [{ type: 'IMAGE', imageHash: full[k], scaleMode: 'FIT' }] : [{ type: 'SOLID', color: { r: .3, g: 0, b: 0 } }]; fr.appendChild(r);
    const t = figma.createText(); t.characters = k; t.fontSize = 16; t.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; t.x = x; t.y = y + H + 4; fr.appendChild(t); });
  return { frameId: fr.id, found: Object.keys(full).length, missing: HASHES.filter(h => !full[h]) }; }
if (MODE === 'clean') { let n = 0; for (const c of [...p.children]) if (/^tmp covers/.test(c.name)) { c.remove(); n++; } return { removed: n }; }
if (MODE === 'write') { const targets = []; const hasMap = Object.keys(MAP).length > 0;
  for (const u of units) { const rules = RULES.filter(r => !r[0] || r[0].includes(u.id));
    walk(u, n => { if (n.type !== 'TEXT') return; const ch = n.characters.trim(); const ph = hasMap && (ch === 'Title' || ch === 'Description'); const cand = rules.filter(r => r[2] === ch);
      if (!ph && !cand.length) return; if (!effVis(n)) return; // обложку ищем только для подходящих текстов: поиск дорогой
      const h = (ph || cand.some(r => r[1] !== null)) ? coverOf(n, u) : '';
      const m = ph ? MAP[h] : null; if (m) { const v = m[ch[0]]; if (v) { targets.push([n.id, v, u.id]); return; } }
      const r = cand.find(r => r[1] === null || r[1] === (h || '-')); if (r) targets.push([n.id, r[3], u.id]); }); }
  const done = {}, fail = [], fit = [], sample = {};
  const box = x => { const b = x.absoluteBoundingBox; return b ? [b.x, b.y, b.width, b.height] : null; };
  const same = (a, b) => !!a && !!b && a.every((v, i) => Math.abs(v - b[i]) <= 0.6);
  const setText = async (n, val) => { const ref = (n.componentPropertyReferences || {}).characters;
    if (ref) { for (let a = n.parent; a && a.type !== 'PAGE'; a = a.parent) { if (a.type !== 'INSTANCE') continue; let pr = null; try { pr = a.componentProperties; } catch (e) {} if (pr && pr[ref]) { a.setProperties({ [ref]: val }); return; } } }
    n.characters = val; };
  for (const [id, val, uid] of targets) { try { const u = await figma.getNodeByIdAsync(uid); const n = (await figma.getNodeByIdAsync(id)) || u.findOne(x => x.id === id); if (!n || n.type !== 'TEXT') { fail.push(id + ' gone'); continue; }
      for (const sg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(sg.fontName);
      // вёрстка «до»: карточка, её родитель, всё видимое внутри карточки (кроме самого текста)
      const card = cardOf(n, u); const old = n.characters; const cb0 = box(card), pb0 = card.parent ? box(card.parent) : null;
      const anc = []; for (let a = n.parent; a && a.id !== card.id && a.type !== 'PAGE'; a = a.parent) anc.push(a); const ancIds = new Set(anc.map(a => a.id)); // обёртки текста могут вырасти вместе с ним
      const inside = card.findAll ? card.findAll(x => x.id !== n.id && !ancIds.has(x.id) && x.visible !== false).map(x => [x, box(x)]) : [];
      await setText(n, val);
      const chk = (await figma.getNodeByIdAsync(id)) || u.findOne(x => x.id === id); if (!chk || chk.characters !== val) { fail.push(id + ' verify'); continue; }
      // вёрстка «после»: карточка той же рамки, внутри ничего не сдвинулось, текст в пределах карточки
      const cb1 = box(card), tb = box(chk); let why = '';
      if (!same(cb0, cb1) || (pb0 && !same(pb0, box(card.parent)))) why = 'moved card';
      else { const mv = inside.find(([x, b0]) => !x.removed && b0 && !same(b0, box(x))); if (mv) why = 'moved ' + esc(mv[0].name).slice(0, 16);
        else { const out = b => b && cb1 && (b[0] < cb1[0] - 1 || b[1] < cb1[1] - 1 || b[0] + b[2] > cb1[0] + cb1[2] + 1 || b[1] + b[3] > cb1[1] + cb1[3] + 1); if (out(tb) || anc.some(a => out(box(a)))) why = 'overflow'; } }
      if (why) { await setText(chk, old); fit.push(id + ' ' + why + ' «' + esc(val).slice(0, 24) + '» в ' + esc(cardName(card)).slice(0, 24)); continue; }
      const cn = esc(cardName(card)).slice(0, 30); if (!sample[cn]) sample[cn] = card.id;
      done[esc(val).slice(0, 30)] = (done[esc(val).slice(0, 30)] || 0) + 1; } catch (e) { fail.push(id + ' ' + String(e.message || e).slice(0, 50)); } }
  return { targets: targets.length, written: Object.values(done).reduce((a, b) => a + b, 0), fit: fit.slice(0, 30), sample, fail: fail.slice(0, 20) }; }
throw new Error('MODE: scan | sheet | clean | write');
