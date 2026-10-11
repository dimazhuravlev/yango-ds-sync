// tabbar-tint-audit.js — аудит цвета подписей и иконок в слотах Tabbar (Yango Play / Yango Music).
// Ожидание: неактивный слот → Fill/Five; активный → Accent colors/Primary (Play) или Fill/One (Music).
// Чинит только: сырой цвет без переменной и переменные из FAMILY, стоящие не на месте.
// Любая другая переменная (например Accent/Sugar Grape) — намеренная, пропускается. FIX=false — только отчёт.
const CONFIG = { SET_KEY: 'd20586ba', FIX: true, FAMILY: ['Fill/Five', 'Fill/One', 'Accent colors/Primary'],
  SLOT: { '7330:50217': 'tab1', '7330:50218': 'tab2', '7330:50219': 'tab3', '7330:50223': 'tab3', '7330:50224': 'tab2', '7330:50225': 'tab1', '7330:50229': 'tab1', '7330:50230': 'tab2', '7330:50231': 'tab3', '7330:50235': 'tab1', '7330:50236': 'tab2', '7330:50237': 'tab3', '7330:50238': 'tab4', '7330:50239': 'tab5', '7330:50240': 'tab6', '7330:50244': 'tab6', '7330:50245': 'tab5', '7330:50246': 'tab4', '7330:50247': 'tab3', '7330:50248': 'tab2', '7330:50249': 'tab1', '7330:50253': 'tab1', '7330:50254': 'tab2', '7330:50255': 'tab3', '7330:50256': 'tab4', '7330:50257': 'tab5', '7330:50258': 'tab6', '7330:50262': 'tab6', '7330:50263': 'tab5', '7330:50264': 'tab4', '7330:50265': 'tab3', '7330:50266': 'tab2', '7330:50267': 'tab1' },
  SLOT_ICON: { tab1: 'trailer', tab2: 'search', tab4: 'music-new', tab5: 'profile-bg' } }; // ожидаемые иконки Yango Play по слотам мастера
const pages = figma.root.children.filter(p => p.type === 'PAGE'); for (const p of pages) await p.loadAsync(); await figma.setCurrentPageAsync(pages[0]);
const SHAPES = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'ELLIPSE', 'RECTANGLE', 'POLYGON', 'STAR', 'LINE']);
function shapes(root) { const r = []; (function w(n) { if (n.visible === false || n.isMask) return; if (SHAPES.has(n.type)) { r.push(n); return } if (n.children) for (const c of n.children) w(c) })(root); return r; }
const vc = {}; async function varOf(paint) { try { const id = paint.boundVariables && paint.boundVariables.color && paint.boundVariables.color.id; if (!id) return null; if (!vc[id]) vc[id] = await figma.variables.getVariableByIdAsync(id); return vc[id] } catch (e) { return null } }
const byName = {}; const out = { instances: 0, slots: 0, iconMismatch: [], fixed: [], remaining: [] };
for (const p of pages) { const pn = p.name.trim();
  for (const i of p.findAllWithCriteria({ types: ['INSTANCE'] })) { if (i.id.indexOf(';') > -1) continue; let m = null; try { m = await i.getMainComponentAsync() } catch (e) { continue } if (!m || !m.parent || m.parent.type !== 'COMPONENT_SET' || m.parent.key.slice(0, 8) !== CONFIG.SET_KEY) continue;
    let vp = {}; try { vp = i.variantProperties } catch (e) { continue } if (vp.App === 'YaPS') continue; out.instances++;
    const master = i.findOne(n => n.type === 'INSTANCE' && /tabbar \/ master/.test(n.name)); if (!master) continue; const tabs = master.findOne(n => n.name === 'tabs'); if (!tabs) continue;
    for (const s of tabs.children) { if (s.type !== 'INSTANCE' || !s.visible) continue; const sn = CONFIG.SLOT[s.id.split(';').pop()]; out.slots++;
      let svp = {}; try { svp = s.variantProperties || {} } catch (e) {} const active = svp.Active === 'on'; const expected = active ? (vp.App === 'Yango Music' ? 'Fill/One' : 'Accent colors/Primary') : 'Fill/Five';
      const label = s.findOne(n => n.type === 'TEXT'); const icon = s.findOne(n => n.name === 'icon' && n.type === 'FRAME'); const g = icon ? icon.findOne(n => n.type === 'INSTANCE' && n.visible) : null;
      if (vp.App === 'Yango Play' && g && sn && CONFIG.SLOT_ICON[sn]) { try { const gm = await g.getMainComponentAsync(); const nm = (gm.parent && gm.parent.type === 'COMPONENT_SET' ? gm.parent.name : gm.name).replace(/^icon \/ /, ''); const gt = (g.variantProperties || {}).Type; if (nm !== CONFIG.SLOT_ICON[sn] || gt !== (active ? 'fill' : 'outline')) out.iconMismatch.push(pn + ' ' + i.id + ' ' + sn + ' has ' + nm + '/' + gt) } catch (e) {} }
      const nodes = g ? shapes(g).map(x => ['icon', x]) : []; if (label) nodes.push(['label', label]);
      for (const [what, node] of nodes) { let fills; try { fills = Array.isArray(node.fills) ? node.fills : null } catch (e) { fills = null } if (!fills) continue; const vis = fills.filter(f => f.visible !== false); if (!vis.length) continue; const f = vis[0]; if (f.type !== 'SOLID') continue;
        const vv = await varOf(f); const cur = vv ? vv.name : 'RAW'; if (vv && !byName[cur]) byName[cur] = vv; if (cur === expected) continue; if (vv && !CONFIG.FAMILY.includes(cur)) continue; // чужая переменная — намеренно
        const tag = pn + ' ' + i.id + ' ' + sn + ' ' + (active ? 'on' : 'off') + ' ' + what + ': ' + cur + ' → ' + expected;
        if (!CONFIG.FIX) { out.remaining.push(tag); continue } const v = byName[expected]; if (!v) { out.remaining.push(tag + ' (variable not seen yet — rerun)'); continue }
        node.fills = fills.map(x => x === f ? figma.variables.setBoundVariableForPaint(Object.assign({}, x, { opacity: 1 }), 'color', v) : x); out.fixed.push(tag); } } } }
return out;
