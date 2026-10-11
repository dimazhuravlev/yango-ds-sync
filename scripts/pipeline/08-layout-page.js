// 08 — собрать страницу по каркасу (references/layout.md): фрейм страницы → шапка design-system →
// на каждую группу подзаголовок design-system и ряд секций → в секции заголовок h5 (если есть имя), ряд подписей
// paragraph p3 и ряд экранов. Экраны переносятся ОРИГИНАЛАМИ (не клонами), размеры не меняются. Компоненты —
// 🦄 Органайзер по ключам. Режимы бренда ставятся на фрейм страницы (BRAND). Старые обёртки не удаляются сами:
// после сборки пустые старые фреймы перечислены в ответе (удалять отдельно, глазами).
// SPEC: { page: id, name: 'Настройки', crumb: '<Проект>', brand: 'YAPS_DARK' | 'YANGO_DARK' | null,
//         groups: [{ title: 'Форсапдейт', sections: [{ name: null|'Contact Support', captions: ['..'|null], screens: ['id', …] }] }] }
// Одна группа без заголовка (title: null) — подзаголовок не ставится. captions[i] = подпись над screens[i] (null — пусто).
const SPEC = { page: '', name: '', crumb: '', brand: null, groups: [] };
const BRAND = { YAPS_DARK: [['7d07641e1f', 'Dark'], ['17df014a0d', 'YaPS'], ['51357d01b2', 'YS Text']], YANGO_DARK: [['7d07641e1f', 'Dark'], ['17df014a0d', 'Yango Play'], ['51357d01b2', 'Yango']], ALLPLAY_DARK: [['7d07641e1f', 'Dark'], ['17df014a0d', 'Allplay'], ['51357d01b2', 'Yango']] }; // [ключ коллекции (10), имя режима]
const K = { ds: '48dc15885e3de930d86ef4ed4f7fde505d84f16f', h5: '0677f3d961bd58028982ce615b1c28367b98c28c', p3: '38278503f49f54ffda3c12b3b32b559017fc2790' };
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const page = await figma.getNodeByIdAsync(SPEC.page); await figma.setCurrentPageAsync(page);
const DS = await figma.importComponentSetByKeyAsync(K.ds), H5 = await figma.importComponentSetByKeyAsync(K.h5), P3 = await figma.importComponentSetByKeyAsync(K.p3);
const vHeader = DS.children.find(c => c.name === 'type=header'), vSub = DS.children.find(c => c.name === 'type=subheader'), vH5 = H5.children.find(c => c.name === 'Type=h5'), vP3 = P3.children.find(c => c.name === 'Type=p3');
// appendChild инстанса падает на незагруженном шрифте любого текста шаблона (YS Text Display Regular в крошках) — грузим все заранее
{ const fonts = new Map(); for (const v of [vHeader, vSub, vH5, vP3]) for (const t of v.findAllWithCriteria({ types: ['TEXT'] })) { try { for (const f of t.getRangeAllFontNames(0, t.characters.length)) fonts.set(f.family + '|' + f.style, f); } catch (e) {} } for (const f of fonts.values()) { try { await figma.loadFontAsync(f); } catch (e) {} } }
// Text# у design-system лежит на вложенном header; у h5/paragraph — на самом инстансе. Без свойства — самый крупный текст.
async function setText(inst, text) { const own = Object.keys(inst.componentProperties).find(p => /^Text#/.test(p)); const holder = own ? inst : inst.findOne(n => n.type === 'INSTANCE' && Object.keys(n.componentProperties).some(p => /^Text#/.test(p)));
  const t = (holder || inst).findAll(n => n.type === 'TEXT').sort((a, b) => (typeof b.fontSize === 'number' ? b.fontSize : 0) - (typeof a.fontSize === 'number' ? a.fontSize : 0))[0]; if (t) for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f);
  if (holder) { const k = Object.keys(holder.componentProperties).find(p => /^Text#/.test(p)); holder.setProperties({ [k]: text }); } else if (t) t.characters = text; }
const al = (f, dir, gap, pad) => { f.layoutMode = dir; f.itemSpacing = gap; f.paddingTop = f.paddingRight = f.paddingBottom = f.paddingLeft = pad; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.fills = []; f.clipsContent = false; return f; };
// фрейм страницы
const P = al(figma.createFrame(), 'VERTICAL', 8, 0); P.name = SPEC.name; page.appendChild(P);
const H = vHeader.createInstance(); P.appendChild(H); await setText(H, SPEC.name);
const crumb = H.findOne(n => n.type === 'TEXT' && n.name === 'label' && n.parent && n.parent.name === 'section'); if (crumb) { for (const f of crumb.getRangeAllFontNames(0, crumb.characters.length)) await figma.loadFontAsync(f); crumb.characters = SPEC.crumb; }
const crumb2 = H.findOne(n => n.type === 'TEXT' && n.parent && n.parent.name === 'page'); if (crumb2) { for (const f of crumb2.getRangeAllFontNames(0, crumb2.characters.length)) await figma.loadFontAsync(f); crumb2.characters = SPEC.name; }
H.layoutSizingHorizontal = 'FILL';
const emptied = [];
for (const g of SPEC.groups) {
  if (g.title) { const S = vSub.createInstance(); P.appendChild(S); await setText(S, g.title); S.layoutSizingHorizontal = 'FILL'; }
  const row = al(figma.createFrame(), 'HORIZONTAL', 8, 0); row.name = 'hStack'; P.appendChild(row);
  for (const sec of g.sections) {
    const F = al(figma.createFrame(), 'VERTICAL', 32, 60); F.name = sec.name || g.title || SPEC.name; F.fills = [{ type: 'SOLID', color: { r: 0x14 / 255, g: 0x14 / 255, b: 0x14 / 255 } }]; F.cornerRadius = 24; row.appendChild(F);
    if (sec.name) { const h = vH5.createInstance(); F.appendChild(h); await setText(h, sec.name); }
    const screens = []; for (const id of sec.screens) { const s = await figma.getNodeByIdAsync(id); if (!s) throw new Error('screen missing ' + id); screens.push(s); }
    if (sec.captions && sec.captions.some(Boolean)) { const caps = al(figma.createFrame(), 'HORIZONTAL', 48, 0); caps.name = 'hStack'; F.appendChild(caps);
      for (let i = 0; i < screens.length; i++) { const c = vP3.createInstance(); caps.appendChild(c); c.resize(screens[i].width, c.height); try { c.layoutSizingVertical = 'HUG'; } catch (e) {} if (sec.captions[i]) await setText(c, sec.captions[i]); else c.opacity = 0; } } // HUG: многострочная подпись не режется
    const scr = al(figma.createFrame(), 'HORIZONTAL', 48, 0); scr.name = 'hStack'; F.appendChild(scr);
    for (const s of screens) { const old = s.parent; const w = s.width, h = s.height; scr.appendChild(s); if (Math.abs(s.width - w) > .5 || Math.abs(s.height - h) > .5) s.resize(w, h); if (old && old.type !== 'PAGE' && 'children' in old && old.children.length === 0) emptied.push(old.id + ' ' + esc(old.name)); }
    F.layoutSizingVertical = 'FILL';
  }
}
// режимы бренда на фрейме страницы
const modes = [];
async function collectionByKey(ck) { try { const libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync(); const lc = libs.find(c => c.key.startsWith(ck)); if (lc) { const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(lc.key); if (vars.length) { const v = await figma.variables.importVariableByKeyAsync(vars[0].key); return await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId); } } } catch (e) {}
  for (const pg of figma.root.children) { try { await pg.loadAsync(); for (const f of pg.children) { const em = f.explicitVariableModes || {}; for (const cid of Object.keys(em)) { const c = await figma.variables.getVariableCollectionByIdAsync(cid); if (c && (c.key || '').startsWith(ck)) return c; } } } catch (e) {} } return null; } // точечные коллекции (.Typography) не в teamLibrary — берём с фрейма, где режим уже стоит
if (SPEC.brand && BRAND[SPEC.brand]) { const colls = new Map(); const seen = new Set();
  for (const [ck] of BRAND[SPEC.brand]) { const c = await collectionByKey(ck); if (c) colls.set(ck, c); }
  if (colls.size < BRAND[SPEC.brand].length) for (const n of page.findAll(x => x.boundVariables && Object.keys(x.boundVariables).length).slice(0, 3000)) { for (const [f, v] of Object.entries(n.boundVariables)) for (const x of (Array.isArray(v) ? v : [v])) { if (!x || !x.id || seen.has(x.id)) continue; seen.add(x.id); try { const vr = await figma.variables.getVariableByIdAsync(x.id); const c = vr && await figma.variables.getVariableCollectionByIdAsync(vr.variableCollectionId); if (c && c.key) colls.set(c.key.slice(0, 10), c); } catch (e) {} } if (BRAND[SPEC.brand].every(([ck]) => colls.has(ck))) break; }
  for (const [ck, modeName] of BRAND[SPEC.brand]) { const c = colls.get(ck); if (!c) { modes.push(ck + ' not found'); continue; } const m = c.modes.find(x => x.name === modeName); if (!m) { modes.push(ck + ' no mode ' + modeName); continue; } P.setExplicitVariableModeForCollection(c, m.modeId); modes.push(c.name + '=' + modeName); } }
// положить фрейм страницы левее всего
const others = page.children.filter(c => c !== P); if (others.length) { P.x = Math.min(...others.map(c => c.x)) - P.width - 400; P.y = Math.min(...others.map(c => c.y)); }
return { pageFrame: P.id, size: Math.round(P.width) + 'x' + Math.round(P.height), modes, emptied };
