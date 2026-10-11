// swap-with-geometry.js — замена инстансов одного сета на вариант другого сета с полным сбросом
// оверрайдов и возвратом геометрии. Использовать, когда структура старого и нового компонента
// разная (Mini App → Tabbar, SuperApp → Tabbar). Когда структура совпадает — pipeline/04d-swap-by-key.js.
// CONFIG ниже — пример для старых таббаров (Mini App, SuperApp → Tabbar); под другой случай заменить FROM / NEW_KEY / TARGET / EXP.
// CONFIG.TARGET(inst, vp) → имя целевого варианта или { component } ; null = пропустить.
const CONFIG = {
  FROM: ['f748202c', 'c190b3d4'],
  NEW_KEY: 'd20586bac5ca08a97154b26f9b767420034b166d', NEW_NAME: 'Tabbar',
  TARGET: (i, vp, kind) => {
    const app = (kind === 'c190b3d4' || vp.App === 'Music') ? 'Yango Music' : 'Yango Play';
    const active = app === 'Yango Music' ? (i.__collectionActive ? 'Collection' : 'Discover') : (i.__collectionActive ? 'My Yango' : 'Watch');
    return 'App=' + app + ', Active tab=' + active + ', Platform=' + (vp['Tablet view'] === 'on' ? 'iPad' : 'iOS/Android') + ', RTL=' + (vp.RTL === 'on' ? 'True' : 'False'); },
  // эталон подписей после свапа (по App|RTL) и допустимые подписи активного таба
  EXP: { 'Yango Play|False': 'Music/My Yango/Search/Watch', 'Yango Play|True': 'بحث/حسابي/مشاهدة/موسيقى', 'Yango Music|False': 'Discover/My Collection/Search', 'Yango Music|True': 'اكتشف/بحث/مجموعتي' },
  ACTIVE: { 'Watch': ['Watch', 'مشاهدة'], 'My Yango': ['My Yango', 'حسابي'], 'Discover': ['Discover', 'اكتشف'], 'Collection': ['My Collection', 'مجموعتي'] },
  DRY_RUN: false,
};
const pages = figma.root.children.filter(p => p.type === 'PAGE');
for (const p of pages) await p.loadAsync(); await figma.setCurrentPageAsync(pages[0]);
let set = null; try { set = await figma.importComponentSetByKeyAsync(CONFIG.NEW_KEY) } catch (e) {}
if (!set) for (const p of pages) { for (const i of p.findAllWithCriteria({ types: ['INSTANCE'] })) { let m = null; try { m = await i.getMainComponentAsync() } catch (e) { continue } if (m && m.parent && m.parent.type === 'COMPONENT_SET' && m.parent.key === CONFIG.NEW_KEY) { set = m.parent; break; } } if (set) break; }
if (!set) throw new Error('target set not found');
const V = {}; for (const c of set.children) V[c.name] = c;
const FROM = new Set(CONFIG.FROM);
async function setOf(i) { let m = null; try { m = await i.getMainComponentAsync() } catch (e) { return null } if (!m) return null; const st = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : null; return ((st ? st.key : m.key) || '').slice(0, 8); }
function labelsOf(i) { const master = i.findOne(n => n.type === 'INSTANCE' && /tabbar \/ master/.test(n.name)); if (!master) return null; const tabs = master.findOne(n => n.name === 'tabs'); if (!tabs) return null;
  const all = [], act = []; for (const s of tabs.children) { if (s.type !== 'INSTANCE' || !s.visible) continue; let a = ''; try { a = s.variantProperties.Active } catch (e) {} const t = s.findOne(n => n.type === 'TEXT'); const tx = t ? t.characters : ''; all.push(tx); if (a === 'on') act.push(tx); } return { all: all.sort().join('/'), active: act.join('/') }; }
function geo(i) { const b = i.absoluteBoundingBox; let lsh = null, la = null; try { lsh = i.layoutSizingHorizontal; la = i.layoutAlign } catch (e) {} return { x: i.x, y: i.y, w: i.width, h: i.height, ax: b ? b.x : null, ay: b ? b.y : null, pos: i.layoutPositioning, c: i.constraints, lsh, la, vis: i.visible, op: i.opacity }; }
function restore(i, g) { const err = []; const par = i.parent; const parentAuto = !!(par.layoutMode && par.layoutMode !== 'NONE');
  try { if (i.layoutPositioning !== g.pos) i.layoutPositioning = g.pos } catch (e) { err.push('pos') } try { i.constraints = g.c } catch (e) { err.push('constraints') }
  const absolute = g.pos === 'ABSOLUTE' || !parentAuto; if (absolute) { try { i.x = g.x; i.y = g.y } catch (e) { err.push('xy') } }
  if (parentAuto && !absolute) { try { if (g.la && i.layoutAlign !== g.la) i.layoutAlign = g.la } catch (e) { err.push('align') } try { if (g.lsh === 'FILL' && i.layoutSizingHorizontal !== 'FILL') i.layoutSizingHorizontal = 'FILL' } catch (e) { err.push('lsh') } }
  try { if (Math.abs(i.width - g.w) > 0.5 || Math.abs(i.height - g.h) > 0.5) { let lsh = null; try { lsh = i.layoutSizingHorizontal } catch (e) {} if (lsh === 'FILL') i.resize(i.width, g.h); else i.resize(g.w, g.h); } } catch (e) { err.push('resize') }
  if (i.visible !== g.vis) i.visible = g.vis; if (i.opacity !== g.op) i.opacity = g.op; return err; }
const out = { migrated: 0, byTarget: {}, problems: [], rows: [] };
for (const p of pages) { const pn = p.name.trim();
  for (const i of p.findAllWithCriteria({ types: ['INSTANCE'] })) { if (i.id.indexOf(';') > -1) continue; const k = await setOf(i); if (!FROM.has(k)) continue;
    let vp = {}; try { vp = i.variantProperties || {} } catch (e) {}
    // активный ли таб «коллекция» в старом инстансе
    i.__collectionActive = false; { const master = i.findOne(n => n.type === 'INSTANCE' && /tabbar \/ master/i.test(n.name)); const tabs = master ? master.findOne(n => n.name === 'tabs') : i.findOne(n => n.name === 'tabs');
      if (tabs) for (const s of tabs.children) { if (s.type !== 'INSTANCE' || !s.visible) continue; let a = ''; try { a = s.variantProperties.Active || s.variantProperties.State } catch (e) {} const t = s.findOne ? s.findOne(n => n.type === 'TEXT') : null; if ((a === 'on' || a === 'active') && (/collection|mine/i.test(s.name) || /collection/i.test(t ? t.characters : ''))) i.__collectionActive = true; } }
    const target = CONFIG.TARGET(i, vp, k); if (!target) continue; const tv = typeof target === 'string' ? V[target] : target.component; if (!tv) { out.problems.push(pn + ' ' + i.id + ' no variant ' + target); continue; }
    const g = geo(i); if (CONFIG.DRY_RUN) { out.rows.push(pn + '|' + i.id + '|' + JSON.stringify(vp) + ' → ' + target); continue; }
    try { i.swapComponent(tv) } catch (e) { out.problems.push(pn + ' ' + i.id + ' swap ERR ' + String(e).slice(0, 80)); continue; }
    try { i.resetOverrides() } catch (e) {} const err = restore(i, g); i.name = CONFIG.NEW_NAME;
    const after = labelsOf(i); const b = i.absoluteBoundingBox; const geoOk = b && Math.abs(b.x - g.ax) < 0.5 && Math.abs(b.y - g.ay) < 0.5 && Math.abs(i.width - g.w) < 0.5 && Math.abs(i.height - g.h) < 0.5;
    const m = typeof target === 'string' ? target.match(/App=([^,]+), Active tab=([^,]+), Platform=[^,]+, RTL=(\w+)/) : null;
    const labelsOk = after && m ? (after.all === CONFIG.EXP[m[1] + '|' + m[3]] && CONFIG.ACTIVE[m[2]].includes(after.active)) : null;
    let ov = []; try { ov = i.overrides.map(o => o.overriddenFields.join('+')) } catch (e) {}
    out.migrated++; out.byTarget[target] = (out.byTarget[target] || 0) + 1;
    const row = pn + '|' + i.id + '|' + target + '|geo ' + (geoOk ? 'ok' : 'MISMATCH') + '|labels ' + (after ? (labelsOk ? 'ok' : 'BAD ' + after.all + ' active=' + after.active) : 'unloaded') + '|ov ' + ov.join(';') + (err.length ? '|ERR ' + err.join(' ') : '');
    if (!geoOk || labelsOk === false || err.length) out.problems.push(row); out.rows.push(row); } }
return out;
