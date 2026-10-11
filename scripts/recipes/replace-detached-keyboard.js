// Отвязанные копии клавиатуры (`keyboard / iOS` — фрейм из рядов мёртвых `_Key`, внутри может лежать и таббар) →
// Library `keyboard / iOS` нужного варианта на том же месте (индекс, позиция, ширина); всё лишнее из копии (таббар)
// переезжает в родителя абсолютом на прежнее место (констрейнты низ/растяжение); копия удаляется.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const KEY = '4ad1547b496b91204d0e91ff154d20f23656a692'; const VARIANT = { Type: 'numeric', Tablet: 'false', 'Dark Mode': 'true', Language: 'English' };
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const vpOf = name => { const o = {}; for (const part of String(name).split(',')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); } return o; };
const findVariant = (set, want) => set.children.find(c => { const v = vpOf(c.name); return Object.keys(want).every(k => v[k] === want[k]); });
const ownNode = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return false; a = a.parent; } return true; };
const set = await figma.importComponentSetByKeyAsync(KEY); const tgt = findVariant(set, VARIANT); if (!tgt) throw new Error('no variant');
const out = {};
/*@GUARD*/
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); const R = { ok: 0, moved: 0, fail: [], sample: [] }; out[pg.name.replace(/^[^\wА-Яа-яЁё]+/, '').slice(0, 10)] = R;
  const frames = pg.findAll(n => (n.type === 'FRAME' || n.type === 'GROUP') && /^keyboard \/ ios$/i.test(n.name.trim()) && ownNode(n));
  for (const F of frames) { let N = null, GG = null; try {
    const par = F.parent; const parentAL = !!(par.layoutMode && par.layoutMode !== 'NONE'); const idx = par.children.indexOf(F); const g = { x: F.x, y: F.y, w: F.width, h: F.height, pos: F.layoutPositioning, c: F.constraints, vis: F.visible };
    const extras = F.children.filter(c => !/^row/i.test(c.name) && !(c.type === 'INSTANCE' && c.mainComponent && /_Key/.test(setOf(c.mainComponent).name)));
    GG = geoGuard(F); N = tgt.createInstance(); par.insertChild(idx, N);
    try { if (N.layoutPositioning !== g.pos) N.layoutPositioning = g.pos; } catch (e) {} try { N.constraints = g.c; } catch (e) {}
    if (g.pos === 'ABSOLUTE' || !parentAL) { N.x = g.x; N.y = g.y; }
    try { N.resize(g.w, N.height); } catch (e) {} N.visible = g.vis; N.name = 'keyboard / iOS';
    for (const x of extras) { const ax = g.x + x.x, ay = g.y + x.y; par.appendChild(x); if (parentAL) { try { x.layoutPositioning = 'ABSOLUTE'; } catch (e) {} } x.x = ax; x.y = ay; try { x.constraints = { horizontal: 'STRETCH', vertical: 'MAX' }; } catch (e) {} R.moved++; }
    F.remove(); GG.repair(); R.ok++; if (R.sample.length < 2) R.sample.push(N.id); 
  } catch (e) { if (N && !N.removed) { try { N.remove(); } catch (e2) {} } if (GG) { try { GG.repair(); } catch (e3) {} } R.fail.push(F.id + ' ' + String(e.message || e).slice(0, 60)); } } }
return out;
