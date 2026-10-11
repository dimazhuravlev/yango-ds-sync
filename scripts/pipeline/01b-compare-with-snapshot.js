// 01b — сверка со слепком 00c и возврат слетевшего (вместо сверки с копией-дублем).
// MODE = 'report'  — по экранам: пары «было → стало», пропавшие тексты без пары, потерянные картинки (и жива ли картинка
//                    в файле), обрезанные тексты (CLIPPED), сменившие размер свои фреймы (FRAME), размер экрана. Read-only.
// MODE = 'restore' — вернуть тексты по парам и картинки. Только на шаге 1 — сразу после принятия обновлений, пока кроме
//                    обновлений ничего не менялось. После миграции — только 'report': тексты меняются намеренно.
// Пара текста: тот же id; иначе тот же внешний инстанс (первый сегмент `I<экз>;…`) и та же позиция (±2 px) — после
// обновления хвост id меняется (`;236:91907;…` → `;7529:8010;…`), а место и экземпляр — нет. Неоднозначное — без пары.
// Одинаковые тексты на экране («Title» в двух карточках) не путаются: сначала сверка по id, потом по тексту.
// Картинка: тот же id или тот же экземпляр + позиция; ставится только если `figma.getImageByHash` её ещё видит (картинка
// без единого носителя исчезает из файла за минуты) — иначе в отчёт: «вернуть из именованной версии».
const PAGE_ID = '0:1'; const MODE = 'report'; const UNITS = null; const PFX = 'sb_'; const MAXLIST = 12;
figma.skipInvisibleInstanceChildren = false;
const NS = 'yango_ds_migration';
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const R = n => { const b = n.absoluteBoundingBox; return b ? [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] : null; };
/*@SNAP*/
const load = id => { const n = +figma.root.getSharedPluginData(NS, PFX + id + '_n'); if (!n) return null; let s = ''; for (let k = 0; k < n; k++) s += figma.root.getSharedPluginData(NS, PFX + id + '_' + k); return JSON.parse(s); };
const outer = id => id.startsWith('I') ? id.slice(1).split(';')[0] : id;
const near = (a, b) => Math.abs(a[3] - b[3]) <= 2 && Math.abs(a[4] - b[4]) <= 2;
// Сопоставление: 1) тот же id и тот же текст — без изменений; 2) тот же id, другой текст — пара; 3) тот же текст+кегль под
// другим id (после обновления id меняются) — без изменений; 4) остаток — пара по экземпляру и месту, иначе «пропал».
function diffTexts(Bt, Ct) { const byId = new Map(Ct.map(x => [x[2], x])); const used = new Set(); const pairs = [];
  const b1 = []; for (const x of Bt) { const c = byId.get(x[2]); if (c && !used.has(c[2]) && c[0] === x[0]) used.add(c[2]); else b1.push(x); }
  const b2 = []; for (const x of b1) { const c = byId.get(x[2]); if (c && !used.has(c[2])) { used.add(c[2]); pairs.push([x, c]); } else b2.push(x); }
  const bag = new Map(); for (const c of Ct) if (!used.has(c[2])) { const k = c[0] + '\u0001' + c[1]; (bag.get(k) || bag.set(k, []).get(k)).push(c); }
  const rem = []; for (const x of b2) { const l = bag.get(x[0] + '\u0001' + x[1]); if (l && l.length) used.add(l.shift()[2]); else rem.push(x); }
  const left = []; for (const r of rem) { const cand = Ct.filter(x => !used.has(x[2]) && outer(x[2]) === outer(r[2]) && near(x, r)); const same = cand.filter(x => x[1] === r[1]);
    const a = cand.length === 1 ? cand[0] : (same.length === 1 ? same[0] : null); if (a) { used.add(a[2]); pairs.push([r, a]); } else left.push(r); }
  return { pairs, left, extra: Ct.filter(x => !used.has(x[2])) }; }
async function findNode(u, id) { return (await figma.getNodeByIdAsync(id)) || u.findOne(x => x.id === id); }
async function setText(t, s) { for (const seg of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters;
  if (ref) { let a = t.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { let pr = null; try { pr = a.componentProperties; } catch (e) {} if (pr && pr[ref]) { a.setProperties({ [ref]: s }); return; } } a = a.parent; } } t.characters = s; }
const p = figma.root.children.find(x => x.id === PAGE_ID); await p.loadAsync();
const meta = JSON.parse(figma.root.getSharedPluginData(NS, PFX + 'page_' + PAGE_ID) || '{"units":[]}');
const ids = UNITS || meta.units; const out = {}; const tot = { units: 0, same: 0, textPairs: 0, textLost: 0, imgLost: 0, clipped: 0, frames: 0, restoredT: 0, restoredI: 0, failed: 0 };
for (const uid of ids) { const B = load(uid); if (!B) continue; tot.units++; const u = await figma.getNodeByIdAsync(uid); if (!u) { out[uid] = 'screen gone'; continue; } const C = snapUnit(u);
  const { pairs, left, extra } = diffTexts(B.t, C.t);
  const now = new Set(C.im.map(x => x[0])); const imLost = []; const seen = {}; for (const x of B.im) { if (now.has(x[0]) || seen[x[0]]) continue; seen[x[0]] = 1; const tgt = C.im.find(y => y[1] === x[1]) || C.im.find(y => outer(y[1]) === outer(x[1]) && near(y, x)); imLost.push({ x, tgt, alive: !!figma.getImageByHash(x[0]) }); }
  const sizeCh = B.bb && C.bb && (B.bb[2] !== C.bb[2] || B.bb[3] !== C.bb[3]) ? B.bb[2] + 'x' + B.bb[3] + '>' + C.bb[2] + 'x' + C.bb[3] : '';
  // обрезка: текст на месте, но его видимая доля упала (сжатый контейнер); фреймы: свои контейнеры сменили размер.
  // Только для слепков с полями va / f (старые слепки — без этих проверок).
  const cById = new Map(C.t.map(x => [x[2], x])); const pairOf = new Map(pairs.map(([r, a]) => [r, a]));
  const clipped = []; for (const x of B.t) { if (x.length < 6) continue; const c = cById.get(x[2]) || pairOf.get(x); if (c && c.length >= 6 && x[5] - c[5] >= 0.25) clipped.push([x, c]); }
  const fNow = new Map((C.f || []).map(x => [x[0], x])); const frames = []; for (const x of (B.f || [])) { const c = fNow.get(x[0]); if (c && (Math.abs(c[1] - x[1]) > 1 || Math.abs(c[2] - x[2]) > 1)) frames.push([x, c]); }
  if (!pairs.length && !left.length && !extra.length && !imLost.length && !sizeCh && !clipped.length && !frames.length) { tot.same++; continue; }
  tot.textPairs += pairs.length; tot.textLost += left.length; tot.imgLost += imLost.length; tot.clipped += clipped.length; tot.frames += frames.length;
  const rep = { pairs: pairs.length, lost: left.length, extra: extra.length, img: imLost.length, clipped: clipped.length, frames: frames.length, size: sizeCh };
  if (MODE === 'restore') { const fail = [];
    for (const [r, a] of pairs) { try { const t = await findNode(u, a[2]); if (!t || t.type !== 'TEXT') { fail.push('gone ' + a[2]); continue; } await setText(t, r[0]); const t2 = await findNode(u, a[2]); if (t2 && t2.characters === r[0]) tot.restoredT++; else fail.push('verify ' + a[2]); } catch (e) { fail.push(a[2] + ' ' + String(e.message || e).slice(0, 40)); } }
    for (const m of imLost) { if (!m.tgt || !m.alive) continue; try { const n = await findNode(u, m.tgt[1]); let done = false; n.fills = n.fills.map(f => { if (!done && f.type === 'IMAGE' && f.imageHash === m.tgt[0]) { done = true; return Object.assign({}, f, { imageHash: m.x[0] }); } return f; }); if (done) tot.restoredI++; } catch (e) { fail.push('img ' + m.tgt[1] + ' ' + String(e.message || e).slice(0, 40)); } }
    tot.failed += fail.length; if (fail.length) rep.fail = fail.slice(0, 5); }
  rep.list = pairs.slice(0, MAXLIST).map(([r, a]) => esc(r[0]).slice(0, 30) + ' > ' + esc(a[0]).slice(0, 30) + ' #' + a[2]).concat(left.slice(0, MAXLIST).map(r => 'LOST ' + esc(r[0]).slice(0, 30) + ' #' + r[2]));
  if (clipped.length) rep.clip = clipped.slice(0, 6).map(([x, c]) => 'CLIPPED ' + esc(x[0]).slice(0, 24) + ' #' + x[2] + ' ' + x[5] + '>' + c[5]);
  if (frames.length) rep.frm = frames.slice(0, 6).map(([x, c]) => 'FRAME ' + esc(x[3]).slice(0, 16) + ' #' + x[0] + ' ' + x[1] + 'x' + x[2] + '>' + c[1] + 'x' + c[2]);
  if (imLost.length) rep.imgs = imLost.slice(0, 6).map(m => m.x[0].slice(0, 8) + ' #' + m.x[1] + (m.tgt ? ' -> #' + m.tgt[1] : ' no-target') + (m.alive ? '' : ' GONE(версия)'));
  out[uid] = rep; }
return { mode: MODE, tot, diff: out };
