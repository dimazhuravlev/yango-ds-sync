// Рецепт: удалённый `title / phone` (6a55e9f3) → ДС Платформа `title` (8f6df4d2) movie/mobile.
// Заменить '__ID__' на id старого инстанса; запускать по одному, после каждого — скриншот. Проверка в вызове: тексты,
// картинки, иконки (кроме скрытых под обложкой и в заглушке навбара), иначе откат.
// Уроки: подписи/иконки внутри подкомпонентов сопоставлять по пути из инстансов (рамки пропускать); глифы иконок
// переносить свапом с сохранением тинта; видимость рамок внутри подкомпонента (строка Top 10) — отдельным проходом;
// описание в ДС Платформа режется до 3 строк — это дизайн компонента, сказать в отчёте.
// Deleted 'title / phone' (6a55e9f3) → ДС Платформа 'title' (8f6df4d2) movie/mobile. Roles: trailer & cover images, partner,
// sub-components by key (logo, meta, disclaimer, buttons-stack, actions, description, divider) — state copied by
// instance-path (frames ignored), incl. icon glyph swaps; inner 'Watch trailer' row hidden (screen has its own).
const OLD = '__ID__';
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const nm = n => { const s = n.name.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim(); return n.type === 'INSTANCE' && /^icon/.test(s) ? 'icon' : s; };
const tp = figma.root.children[1]; await tp.loadAsync();
const effVis = (n, root) => { let a = n; while (a && a !== root.parent) { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = R => R.findAll(n => n.type === 'TEXT' && effVis(n, R)).map(t => t.characters.replace(/\s+/g, ' ').trim()).filter(Boolean).sort();
const visImg = R => R.findAll(n => 'fills' in n && Array.isArray(n.fills) && effVis(n, R)).flatMap(n => n.fills.filter(f => f.type === 'IMAGE' && f.visible !== false).map(f => f.imageHash)).sort();
// icons under the inner navbar placeholder (new) or under the old 'video' frame (covered by the cover image) are not compared
const inNav = n => { let a = n.parent; while (a) { if (/include navbar height/.test(a.name) || (a.name === 'video' && a.type === 'FRAME')) return true; a = a.parent; } return false; };
const visIcons = R => R.findAll(n => n.type === 'INSTANCE' && effVis(n, R) && !inNav(n) && /^icon/.test(setOf(n.mainComponent).name) && !(n.parent && n.parent.type === 'INSTANCE' && /^icon/.test(setOf(n.parent.mainComponent).name))).map(n => setOf(n.mainComponent).name.replace(/^icons? \/ (size\d+ \/ )?/, '').replace(/_outline$/, '')).sort();
function walkI(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { if (c.type === 'INSTANCE' || c.type === 'TEXT' || ('fills' in c && Array.isArray(c.fills) && c.fills.some(f => f.type === 'IMAGE'))) { const k = nm(c); cnt[k] = (cnt[k] || 0) + 1; const p = path + '/' + k + '#' + cnt[k]; m.set(p, c); if (c.type === 'INSTANCE') rec(c, p); } else rec(c, path); } }; rec(root, ''); return m; }
function walkAll(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { const k = c.name; cnt[k] = (cnt[k] || 0) + 1; const p = path + '/' + k + '#' + cnt[k]; m.set(p, c); rec(c, p); } }; rec(root, ''); return m; }
const snapFrames = root => [...walkAll(root)].filter(([p, n]) => n.type === 'FRAME' || n.type === 'GROUP').map(([p, n]) => ({ p, vis: n.visible }));
function snap(root) { const out = []; for (const [p, n] of walkI(root)) { const r = { p, vis: n.visible, type: n.type }; if (n.type === 'TEXT') r.chars = n.characters; if ('fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')) r.fills = JSON.parse(JSON.stringify(n.fills)); if (n.type === 'INSTANCE') { r.main = n.mainComponent; try { r.props = Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) { r.props = {}; } } out.push(r); } return out; }
const firstPaint = n => { const v = n.findOne(x => (x.type === 'VECTOR' || x.type === 'BOOLEAN_OPERATION') && Array.isArray(x.fills) && x.fills.length); return v ? JSON.parse(JSON.stringify(v.fills)) : null; };
async function applyProps(n, props) { let defs; try { defs = n.componentProperties; } catch (e) { return; } for (const [k, v] of Object.entries(defs)) { const b = k.replace(/#.*/, ''); if (!(b in props) || props[b] === v.value || v.type === 'INSTANCE_SWAP') continue; try { n.setProperties({ [k]: props[b] }); } catch (e) {} } }
async function replay(R, S) { for (let pass = 0; pass < 2; pass++) { let M = walkI(R);
  for (const r of S) { let n = M.get(r.p); if (n && n.removed) { M = walkI(R); n = M.get(r.p); } if (!n || n.removed || n.type !== r.type || r.type !== 'INSTANCE') continue;
    if (n.mainComponent.id !== r.main.id && (setOf(n.mainComponent).key === setOf(r.main).key || /^icon/.test(setOf(r.main).name))) { const tint = /^icon/.test(setOf(r.main).name) ? firstPaint(n) : null; n.swapComponent(r.main); M = walkI(R); n = M.get(r.p); if (tint) { const v = n.findOne(x => (x.type === 'VECTOR' || x.type === 'BOOLEAN_OPERATION') && Array.isArray(x.fills) && x.fills.length); if (v) v.fills = tint; } }
    await applyProps(n, r.props); }
  M = walkI(R);
  for (const r of S) { const n = M.get(r.p); if (!n || n.removed || n.type !== r.type) continue;
    if (n.visible !== r.vis && !(n.componentPropertyReferences && n.componentPropertyReferences.visible)) n.visible = r.vis;
    if (r.fills && 'fills' in n) { try { n.fills = r.fills; } catch (e) {} }
    if (r.type === 'TEXT' && n.characters !== r.chars && !(n.componentPropertyReferences && n.componentPropertyReferences.characters)) { for (const f of n.getRangeAllFontNames(0, n.characters.length)) await figma.loadFontAsync(f); n.characters = r.chars; } } } }
/*@GUARD*/
const X = await figma.getNodeByIdAsync(OLD); const P = X.parent; const idx = P.children.findIndex(c => c.id === X.id);
const t0 = visT(X), i0 = visImg(X), ic0 = visIcons(X), h0 = X.height, sh = X.layoutSizingHorizontal, sv = X.layoutSizingVertical;
const oldTrailer = X.findOne(n => n.name === 'cover' && n.parent && n.parent.name === 'video' && 'fills' in n);
const oldCoverImg = (() => { const c = X.findOne(n => n.name === 'cover' && n.type === 'FRAME'); return c ? c.findOne(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')) : null; })();
const oldPartnerFrame = X.findOne(n => n.name === 'partner' && n.type === 'FRAME' && !inNav(n));
const oldPartner = oldPartnerFrame ? oldPartnerFrame.findOne(n => n.type === 'INSTANCE') : null;
const KEYS = ['a9c49d7a', '45eb368d', 'e4f6ef48', '4da90ff1', 'a07568a7', '1b15d45e', '755af8e8'];
const oldSubs = {}; for (const k of KEYS) { const s = X.findOne(n => n.type === 'INSTANCE' && n.mainComponent && setOf(n.mainComponent).key.startsWith(k) && !inNav(n)); if (s) oldSubs[k] = { vis: s.visible, main: s.mainComponent, snap: snap(s), frames: snapFrames(s), props: (() => { try { return Object.fromEntries(Object.entries(s.componentProperties).map(([kk, v]) => [kk.replace(/#.*/, ''), v.value])); } catch (e) { return {}; } })() }; }
const TS = await figma.importComponentSetByKeyAsync('8f6df4d262fe28e200ea5cb8e6a3da752044c37a');
const GG = geoGuard(X); const I = TS.children.find(c => c.name === 'RTL=off, type=movie, platform=mobile').createInstance(); P.insertChild(idx, I);
try { I.layoutSizingHorizontal = sh; } catch (e) {} try { I.layoutSizingVertical = sv; } catch (e) {}
const rp = {}; for (const k of Object.keys(I.componentProperties)) { const b = k.replace(/#.*/, ''); if (b === 'Show partner') rp[k] = !!(oldPartnerFrame && oldPartnerFrame.visible); if (b === 'Cover on / Trailer off') rp[k] = !!(oldCoverImg && effVis(oldCoverImg, X)); if (b === 'Trailer controls') rp[k] = false; } I.setProperties(rp);
const imgNode = R => R ? (('fills' in R && Array.isArray(R.fills) && R.fills.some(f => f.type === 'IMAGE')) ? R : R.findOne(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE'))) : null;
const nt = imgNode(I.findOne(n => n.name === 'trailer 16:9')), nc = imgNode(I.findOne(n => n.name === 'cover 1:1'));
if (oldTrailer && nt) nt.fills = JSON.parse(JSON.stringify(oldTrailer.fills));
if (oldCoverImg && nc) nc.fills = JSON.parse(JSON.stringify(oldCoverImg.fills));
if (oldPartner) { const pf = I.findOne(n => n.name === 'partner' && n.type === 'FRAME'); const pi = pf ? pf.findOne(n => n.type === 'INSTANCE') : null; if (pi && pi.mainComponent.id !== oldPartner.mainComponent.id) pi.swapComponent(oldPartner.mainComponent); }
for (const k of KEYS) { const o = oldSubs[k]; if (!o) continue; let n = I.findOne(x => x.type === 'INSTANCE' && x.mainComponent && setOf(x.mainComponent).key.startsWith(k)); if (!n) continue;
  if (n.mainComponent.id !== o.main.id) n.swapComponent(o.main);
  n = I.findOne(x => x.type === 'INSTANCE' && x.mainComponent && setOf(x.mainComponent).key.startsWith(k));
  await applyProps(n, o.props); n.visible = o.vis; await replay(n, o.snap);
  if (n.mainComponent.id === o.main.id) { const FM = walkAll(n); for (const f of o.frames) { const x = FM.get(f.p); if (x && !x.removed && (x.type === 'FRAME' || x.type === 'GROUP') && x.visible !== f.vis && !(x.componentPropertyReferences && x.componentPropertyReferences.visible)) x.visible = f.vis; } } }
const inner = I.findOne(n => n.name === 'buttons' && n.type === 'FRAME' && n.parent && n.parent.name === 'content'); if (inner) inner.visible = false;
const t1 = visT(I), i1 = visImg(I), ic1 = visIcons(I);
const missing = t0.filter(t => !t1.includes(t)), extra = t1.filter(t => !t0.includes(t));
const icMissing = ic0.filter(t => !ic1.includes(t)), icExtra = ic1.filter(t => !ic0.includes(t));
const imgOk = i0.every(h => i1.includes(h));
const res = { id: OLD, inst: I.id, h: Math.round(h0) + ' -> ' + Math.round(I.height), missing: esc(missing.join(' | ')).slice(0, 300), extra: esc(extra.join(' | ')).slice(0, 200), icMissing, icExtra, imgOk };
const mv = GG.moved(I); // высота может отличаться по ДС — тогда сверяются только сжатые hug-родители
if (missing.length || !imgOk || icMissing.length || icExtra.length || mv.length) throw new Error('ROLLBACK ' + JSON.stringify(res) + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : ''));
X.remove();
return res;
