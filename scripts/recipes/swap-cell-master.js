// Ячейки форков и старой Платформы `cell / master` (форк 0b6f6c34; копия старой Платформы: title/description — вложенные инстансы, helper/action —
// `cell / action` fe2a44df) → ДС Платформа `cell / master` (2fe06e4e, тексты встроены, `cell / action` b80f60a4 без `value
// weak`). Перед свапом снимаются роли: булевы, текст заголовка/описания, тип и глиф helper, тип/текст/шеврон/глиф action,
// варианты и видимость разделителей, ширина; после свапа (тот же RTL) всё ставится заново; сверка видимых текстов,
// при расхождении — обратный свап с повтором оверрайдов по именному пути.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const FROM = '0b6f6c34'; const KEY = '2fe06e4e9df5ab04cd53ddb719f8e2650836ad67';
const ACTION = { value: 'value strong', text: 'value strong', icon: 'icon', 'icon-in-circle': 'icon-in-circle', counter: 'counter', toggle: 'toggle', spinner: 'spinner', chevron: 'chevron', button: 'button', 'text-button': 'text-button', avatar: 'avatar' };
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const norm = s => s.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim();
const isVis = (n, root) => { let a = n; while (a && a.id !== root.id && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = X => X.findAll(n => n.type === 'TEXT' && isVis(n, X)).map(t => t.characters.trim()).filter(Boolean).sort();
const isIcon = n => n.type === 'INSTANCE' && n.mainComponent && /^icon/i.test(norm(setOf(n.mainComponent).name));
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
const under = (n, name, root) => { let a = n.parent; while (a && a.id !== root.id && a.type !== 'PAGE') { if (a.name === name) return true; a = a.parent; } return false; };
async function setText(t, s) { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters; if (ref) { let a = t.parent; while (a && !(a.type === 'INSTANCE' && ref in a.componentProperties)) a = a.parent; if (a) { a.setProperties({ [ref]: s }); return; } } t.characters = s; }
function walk(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { const k = norm(c.name); cnt[k] = (cnt[k] || 0) + 1; const p = path + '/' + k + '#' + cnt[k]; m.set(p, c); rec(c, p); } }; rec(root, ''); return m; }
function snap(root) { const out = []; for (const [p, n] of walk(root)) { const r = { p, vis: n.visible, type: n.type }; if (n.type === 'TEXT') r.chars = n.characters; if (n.type === 'INSTANCE' && n.mainComponent) { r.main = n.mainComponent; r.setName = norm(setOf(n.mainComponent).name); try { r.props = Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) { r.props = {}; } } out.push(r); } return out; }
async function replay(X, S) { let M = walk(X);
  for (const r of S) { let n = M.get(r.p); if (n && n.removed) { M = walk(X); n = M.get(r.p); } if (!n || n.removed || n.type !== r.type) continue;
    if (r.type === 'INSTANCE' && n.mainComponent) { if (n.mainComponent.id !== r.main.id) { try { n.swapComponent(r.main); } catch (e) {} M = walk(X); n = M.get(r.p); if (!n) continue; } let defs; try { defs = n.componentProperties; } catch (e) { defs = {}; } const set = {}; for (const [k, v] of Object.entries(defs)) { const b = k.replace(/#.*/, ''); if (b in r.props && r.props[b] !== v.value && v.type !== 'INSTANCE_SWAP') set[k] = r.props[b]; } if (Object.keys(set).length) { try { n.setProperties(set); } catch (e) {} } } }
  const M2 = walk(X); for (const r of S) { const n = M2.get(r.p); if (!n || n.removed || n.type !== r.type) continue; if (n.visible !== r.vis && !(n.componentPropertyReferences && n.componentPropertyReferences.visible)) n.visible = r.vis; if (r.type === 'TEXT' && n.characters !== r.chars && !(n.componentPropertyReferences && n.componentPropertyReferences.characters)) { try { await setText(n, r.chars); } catch (e) {} } } }
const set = await figma.importComponentSetByKeyAsync(KEY);
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { ok: 0, fail: [], skip: [], types: {} }; out[pg.name.replace(/^[^\wА-Яа-яЁё]+/, '').slice(0, 10)] = R;
  const targets = [];
  for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { const M = i.mainComponent; if (!M || !M.remote) continue; if (setOf(M).key.slice(0, 8) !== FROM) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (inInst) continue; targets.push(i); }
  for (const X of targets) { const oldMain = X.mainComponent; const S0 = snap(X); const w = X.width, h = X.height; let sh = null; try { sh = X.layoutSizingHorizontal; } catch (e) {}
    try {
    const vp = vpOf(oldMain.name); const tgt = set.children.find(c => vpOf(c.name).RTL === (vp.RTL || 'off')); if (!tgt) { R.skip.push(X.id + ' novariant'); continue; }
    let bools = {}; try { for (const [k, v] of Object.entries(X.componentProperties)) if (v.type === 'BOOLEAN') bools[k.replace(/#.*/, '')] = v.value; } catch (e) {}
    const tN = X.findOne(n => n.type === 'TEXT' && under(n, 'center', X) && (n.name === 'title' || under(n, 'title', X))); const title = tN ? tN.characters : null;
    const dN = X.findOne(n => n.type === 'TEXT' && under(n, 'center', X) && (n.name === 'description' || under(n, 'description', X))); const desc = dN ? dN.characters : null;
    const H = X.findOne(n => n.type === 'INSTANCE' && n.name === 'helper'); const hType = H ? vpOf(H.mainComponent.name).Type : null; const hG = H ? H.findOne(isIcon) : null; const hGlyph = hG ? hG.mainComponent : null; const hVis = H ? H.visible : null;
    const A = X.findOne(n => n.type === 'INSTANCE' && n.parent && n.parent.name === 'action' && n.parent.id !== X.id); const aType = A ? vpOf(A.mainComponent.name).Type : null; const aT = A ? A.findOne(n => n.type === 'TEXT') : null; const aText = aT ? aT.characters : null, aTextVis = aT ? isVis(aT, A) : false; const aCh = A ? A.findOne(n => n.name === 'chevron') : null; const aChev = aCh ? isVis(aCh, A) : null; const aG = A ? A.findOne(isIcon) : null; const aGlyph = aG ? aG.mainComponent : null; const aVis = A ? A.visible : null;
    const divs = {}; for (const nm of ['divider-bottom', 'divider-top']) { const D = X.children.find(c => c.name === nm); if (D && D.type === 'INSTANCE') divs[nm] = { type: vpOf(D.mainComponent.name).Type, vis: D.visible }; }
    const t0 = visT(X); const key = (hType || '-') + '/' + (aType || '-'); R.types[key] = (R.types[key] || 0) + 1;
    X.swapComponent(tgt);
    const rs = {}; for (const [k, v] of Object.entries(X.componentProperties)) { const b = k.replace(/#.*/, ''); if (v.type === 'BOOLEAN' && b in bools && bools[b] !== v.value) rs[k] = bools[b]; } if (Object.keys(rs).length) X.setProperties(rs);
    const nt = X.findOne(n => n.type === 'TEXT' && n.name === 'title' && under(n, 'center', X)); if (nt && title !== null) await setText(nt, title);
    const nd = X.findOne(n => n.type === 'TEXT' && n.name === 'description' && under(n, 'center', X)); if (nd && desc !== null) await setText(nd, desc);
    const H2 = X.findOne(n => n.type === 'INSTANCE' && n.name === 'helper'); if (H2 && hType) { const t = ACTION[hType]; if (t) { try { H2.setProperties({ Type: t }); } catch (e) {} } if (hGlyph) { const slot = H2.findOne(isIcon); if (slot && slot.mainComponent.id !== hGlyph.id) { try { slot.swapComponent(hGlyph); } catch (e) {} } } if (hVis !== null && H2.visible !== hVis && !(H2.componentPropertyReferences && H2.componentPropertyReferences.visible)) H2.visible = hVis; }
    const A2 = X.findOne(n => n.type === 'INSTANCE' && n.parent && n.parent.name === 'action' && n.parent.id !== X.id); if (A2 && aType) { const t = ACTION[aType]; if (t) { try { A2.setProperties({ Type: t }); } catch (e) {} }
      const tk = Object.keys(A2.componentProperties).find(k => /^Text#/.test(k)); if (tk && aText !== null) { try { A2.setProperties({ [tk]: aText }); } catch (e) {} }
      const at = A2.findOne(n => n.type === 'TEXT' && n.name === 'title') || A2.findOne(n => n.type === 'TEXT'); if (at && aText !== null) { try { await setText(at, aText); } catch (e) {} } if (at && at.visible !== aTextVis && !(at.componentPropertyReferences && at.componentPropertyReferences.visible)) at.visible = aTextVis; // Text# у cell / action — для button/text-button; у value strong текст «title» свободный
      if (aChev !== null) { const ck = Object.keys(A2.componentProperties).find(k => /^Show chevron/.test(k)); if (ck) { try { A2.setProperties({ [ck]: aChev }); } catch (e) {} } }
      if (aGlyph) { const slot = A2.findOne(isIcon); if (slot && slot.mainComponent.id !== aGlyph.id) { try { slot.swapComponent(aGlyph); } catch (e) {} } }
      if (aVis !== null && A2.visible !== aVis && !(A2.componentPropertyReferences && A2.componentPropertyReferences.visible)) A2.visible = aVis; }
    for (const [nm, d] of Object.entries(divs)) { const D2 = X.children.find(c => c.name === nm); if (D2 && D2.type === 'INSTANCE') { try { D2.setProperties({ Type: d.type }); } catch (e) {} if (D2.visible !== d.vis && !(D2.componentPropertyReferences && D2.componentPropertyReferences.visible)) D2.visible = d.vis; } }
    try { if (sh === 'FILL') X.layoutSizingHorizontal = 'FILL'; else if (Math.abs(X.width - w) > .5) X.resize(w, X.height); } catch (e) {}
    const t1 = visT(X);
    if (JSON.stringify(t0) === JSON.stringify(t1)) R.ok++; else { R.fail.push(X.id + ' ' + esc(t0.join('|')).slice(0, 40) + '>' + esc(t1.join('|')).slice(0, 40)); X.swapComponent(oldMain); await replay(X, S0); try { X.resize(w, h); } catch (e) {} }
  } catch (e) { R.fail.push(X.id + ' ERR ' + String(e.message || e).slice(0, 60)); try { if (X.mainComponent.id !== oldMain.id) { X.swapComponent(oldMain); await replay(X, S0); } } catch (e2) {} } } }
return out;
