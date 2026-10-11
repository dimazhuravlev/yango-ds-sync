// Отвязанная копия (фрейм) → инстанс компонента Library с полным повтором состояния по именному пути (walkAll: все
// слои, не только инстансы): тексты, заливки IMAGE (VIDEO ставить нельзя — пропускаем), видимость фреймов, свойства и
// свап вложенных инстансов того же сета. Геометрия: родитель/индекс, FILL/HUG или x/y+констрейнты, ширина как была,
// высота — по компоненту. Сверка видимых текстов и хешей картинок; старый удаляется только при совпадении.
// JOBS ниже — проверенный пример; для другого компонента добавить правило отбора и ключ.
// JOBS: правило отбора фреймов → компонент (ключ одиночного компонента или ключ сета + имя варианта).
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const JOBS = [
  { match: f => f.name.trim().toLowerCase() === 'card / music / open playlist', setKey: '5858c3ae5364174c71c80d74dc313505fb835da5', variant: 'Branding Cover=off, RTL=off, Platform=iOS' },
  // { match: f => f.name === '<имя копии>', key: '<ключ одиночного компонента>' },
];
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const inInst = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return true; a = a.parent; } return false; };
const nm = n => { const s = n.name.replace(/❌\s*/g, '').replace(/\s+/g, ' ').trim(); return n.type === 'INSTANCE' && /^icon/.test(s) ? 'icon' : s; };
const effVis = (n, root) => { let a = n; while (a && a.id !== root.parent.id) { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
const visT = R => R.findAll(n => n.type === 'TEXT' && effVis(n, R)).map(t => t.characters.replace(/\s+/g, ' ').trim()).filter(Boolean).sort();
const visImg = R => R.findAll(n => 'fills' in n && Array.isArray(n.fills) && effVis(n, R)).flatMap(n => n.fills.filter(f => f.type === 'IMAGE' && f.visible !== false).map(f => f.imageHash)).sort();
/*@GUARD*/
function walkAll(root) { const m = new Map(); const rec = (n, path) => { if (!('children' in n)) return; const cnt = {}; for (const c of n.children) { const k = nm(c); cnt[k] = (cnt[k] || 0) + 1; const p = path + '/' + k + '#' + cnt[k]; m.set(p, c); rec(c, p); } }; rec(root, ''); return m; }
function snapAll(root) { const out = []; for (const [p, n] of walkAll(root)) { const r = { p, vis: n.visible, type: n.type }; if (n.type === 'TEXT') r.chars = n.characters; if ('fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')) r.fills = JSON.parse(JSON.stringify(n.fills.filter(f => f.type !== 'VIDEO'))); if (n.type === 'INSTANCE') { r.main = n.mainComponent; try { r.props = Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value])); } catch (e) { r.props = {}; } } out.push(r); } return out; }
async function applyProps(n, props) { let defs; try { defs = n.componentProperties; } catch (e) { return; } for (const [k, v] of Object.entries(defs)) { const b = k.replace(/#.*/, ''); if (!(b in props) || props[b] === v.value || v.type === 'INSTANCE_SWAP') continue; try { n.setProperties({ [k]: props[b] }); } catch (e) {} } }
async function replayAll(R, S) { for (let pass = 0; pass < 2; pass++) { let M = walkAll(R);
  for (const r of S) { let n = M.get(r.p); if (!n || n.removed || n.type !== 'INSTANCE' || r.type !== 'INSTANCE') continue; if (n.mainComponent.id !== r.main.id && setOf(n.mainComponent).key === setOf(r.main).key) { try { n.swapComponent(r.main); } catch (e) {} M = walkAll(R); n = M.get(r.p); if (!n) continue; } await applyProps(n, r.props); }
  M = walkAll(R);
  for (const r of S) { const n = M.get(r.p); if (!n || n.removed || n.type !== r.type) continue; if (n.visible !== r.vis && !(n.componentPropertyReferences && n.componentPropertyReferences.visible)) { try { n.visible = r.vis; } catch (e) {} } if (r.fills && 'fills' in n) { try { n.fills = r.fills; } catch (e) {} } if (r.type === 'TEXT' && n.characters !== r.chars && !(n.componentPropertyReferences && n.componentPropertyReferences.characters)) { try { for (const f of n.getRangeAllFontNames(0, n.characters.length)) await figma.loadFontAsync(f); n.characters = r.chars; } catch (e) {} } } } }
async function replaceDetached(G, comp, label) { const P = G.parent; const idx = P.children.findIndex(c => c.id === G.id); const parentAL = P.layoutMode && P.layoutMode !== 'NONE';
  const t0 = visT(G), i0 = visImg(G), g = { x: G.x, y: G.y, w: G.width, h: G.height, lsh: G.layoutSizingHorizontal, lsv: G.layoutSizingVertical, pos: G.layoutPositioning, c: G.constraints };
  const S = snapAll(G); const GG = geoGuard(G); const I = comp.createInstance(); P.insertChild(idx, I);
  if (parentAL && g.pos !== 'ABSOLUTE') { try { I.layoutSizingHorizontal = g.lsh; } catch (e) {} try { I.layoutSizingVertical = g.lsv; } catch (e) {} } else { if (parentAL) { try { I.layoutPositioning = 'ABSOLUTE'; } catch (e) {} } I.x = g.x; I.y = g.y; try { I.constraints = g.c; } catch (e) {} }
  if (Math.abs(I.width - g.w) > 0.5) I.resize(g.w, I.height);
  await replayAll(I, S);
  const t1 = visT(I), i1 = visImg(I); const missing = t0.filter(t => !t1.includes(t)), extra = t1.filter(t => !t0.includes(t)), imgOk = i0.every(h => i1.includes(h)) && i1.every(h => i0.includes(h));
  const res = label + ' ' + G.id + '->' + I.id + ' h=' + Math.round(g.h) + '/' + Math.round(I.height);
  const mv = GG.moved(I);
  if (missing.length || extra.length || !imgOk || mv.length) { I.remove(); GG.repair(); return { ok: false, msg: res + (mv.length ? ' moved:' + mv.slice(0, 3).join(',') : '') + ' missing=' + esc(missing.join('|')).slice(0, 60) + ' extra=' + esc(extra.join('|')).slice(0, 60) + ' img=' + imgOk }; }
  G.remove(); return { ok: true, msg: res }; }
for (const j of JOBS) j.comp = j.key ? await figma.importComponentByKeyAsync(j.key) : (await figma.importComponentSetByKeyAsync(j.setKey)).children.find(c => c.name === j.variant);
const done = [], bad = [];
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync();
  const jobs = []; for (const f of pg.findAllWithCriteria({ types: ['FRAME'] })) { if (inInst(f) || f.parent.type === 'PAGE') continue; const j = JOBS.find(j => j.match(f)); if (j) jobs.push([f.id, j]); }
  for (const [id, j] of jobs) { const G = await figma.getNodeByIdAsync(id); if (!G || G.removed) continue; try { const r = await replaceDetached(G, j.comp, (j.key || j.setKey).slice(0, 8)); (r.ok ? done : bad).push(r.msg); } catch (e) { bad.push(id + ' ERR ' + String(e).slice(0, 80)); } } }
return { doneN: done.length, done, bad };
