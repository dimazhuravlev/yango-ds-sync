// Сырые цвета в МАСТЕРАХ ДС Платформа → переменные Theme (правило: только если цвет полностью совпадает с
// переменной; нет переменной — не трогать). Запускать в файле ДС Платформа (b8maDlvYFFs2vagJxwxc4A).
// Совпадение: hex и альфа (%) paint == значение переменной И в контексте самого узла (явные режимы предков), И в тёмной
// теме потребителя (Dark + каждый продукт; переменные, зависящие от продукта, — акцент — исключены). Роль: текст/векторы/
// обводки → Fill/*, фоны → Surface/* (в кнопках сначала Buttons/*). Вложенные инстансы: цвет не переопределён на
// внешнем инстансе (instance.overrides) → пропуск (хвост своего мастера, чинится там); переопределён → привязка.
// Пропуск: варианты/сеты с Light в имени, страница System Elements (копии iOS/Android с фиксированными системными
// цветами), картинки, градиенты, скрытые paint.
// Тяжёлые страницы (Cards, Carousels) рвут соединение MCP → резать по корням: A..B — срез сетов/компонентов страницы.
// Повторный запуск безопасен (привязанные paint пропускаются). После прогона — публикация ДС Платформа.
const DRY = true; const PAGE = /↳ Tabbar/; const A = 0, B = 999;
const KEYS = { 'Surface/Highlight': 'c6c38b142ec43f7ef976c482610bfabfbcfbaf28', 'Surface/Inverted': '2cf65ebf22d638d10bfcb79563a7e98ffa3d77ff', 'System/Hint': '8843fda35b9f1f09ad44e5ca7cbfb97f1010ce42', 'Surface/Three': '8fff1f1ef7d8e11d860ce1be6c6c059a9d7df455', 'Fill/Eight': '33fb16489febe33fcda65a93fe696b19576b3f0e', 'Surface/Two': 'df013d8623c87ce6a3e528985a53ec2bc63583da', 'System/Error': '6456c92cf3806ad8e3adf5eb5f3218930141486a', 'Surface/One': '87e63293ec061298b3d1da584890ffa4de77e9ac', 'Fill/Inverted': 'e7f2fdb15f592032455e93e139b9af7a94ed6893', 'Fill/Ten': 'd1bffc97aadc65b0c030518417d5bf0f5a1e3aac', 'Fill/Nine': 'ee4a4e445e813ce7fead17c351a0dcde68da0849', 'Fill/Seven': '18f8bc09f4281193456c37bac9433dad96154baa', 'Fill/Six': '08ef15ecd098462fece8c05cfe5fa16b98b76ad2', 'Fill/Five': '9cb950892b437ea8f915a4c9dddaa787519c3d3f', 'Fill/Four': '6f96fc6c49a5d30859577747c0a6a8a35bb2adc2', 'Surface/Four': '18efa7cf28b5640abaf0a066130070e026fcc42d', 'Fill/Two': 'f3f6ba352cbeebd05f1b10b6e4c167e928283214', 'Fill/One': 'a3049cdb8248b8d0608a4ea23d3d09d2fe7ca4c1', 'Fill/Three': '210be8ff691e6d492bf0f9634cc739ea098728c8', 'Buttons/Secondary': '735d8c495496e11072b85d0baffaf8ab5c7138d0', 'Buttons/Extra One': 'e115e40f70334d419ebc5fe8d90081f25bba6e69', 'Buttons/Extra Two': '6658734e64904fe8913f3ed08a2d11f1d7b3dd67', 'Buttons/Inverted': '752dbe3d3590b6b1bf07e410b673de6de3c72c04', 'System/Success': 'e5f0ffed0f8326a12055978e08c5c0c59ff350b4', 'System/iOS Navbar One': '79c8ef55233e820fbe220de8fd20103972bee0b4', 'System/Android Navbar One': '9d1274047c636ce59aebfbf02c40af4f1bb14913', 'System/iOS Navbar Two': '79d196d8777e040e0a5df3eeacada9a08eea0ee2', 'System/Bright Red': '72ca8f3efd654b39e399e74c37dd01e693404aa7', 'System/iOS Navbar darkBlur': '45ab2b5a231d136de0d9b6cfe4b0e8e211a3626c', 'Buttons/Extra Three': '7d0d790e3125c2b76c8af8aa250b8aec8bad197a', 'System/So-so': 'a2b71f440d80ac0081018f8d5949ca3523e24b68', 'Surface/Five': 'b8b4ab09cca2a7a709dfed5357ad47ac8bc09642', 'Fill/Subtitle': 'af7aaf043131ad0549367fd4377a19f900bd34bb', 'Accent colors/Primary': '2614253864f5ca1361d329f89c8d6efac6323e06' };
const FGPREF = ['Fill/One', 'Fill/Two', 'Fill/Three', 'Fill/Four', 'Fill/Five', 'Fill/Subtitle', 'Fill/Six', 'Fill/Seven', 'Fill/Eight', 'Fill/Nine', 'Fill/Ten', 'Fill/Inverted', 'Surface/Two', 'Surface/Four', 'Surface/Three', 'Surface/Five', 'System/Hint', 'System/Error', 'System/Success', 'System/Bright Red', 'System/So-so', 'System/iOS Navbar One', 'System/iOS Navbar darkBlur', 'Buttons/Extra Three'];
const BGPREF = ['Surface/One', 'Surface/Two', 'Surface/Four', 'Surface/Three', 'Surface/Five', 'Fill/One', 'Fill/Two', 'Fill/Three', 'Fill/Four', 'Fill/Five', 'Fill/Subtitle', 'Fill/Six', 'Fill/Seven', 'Fill/Eight', 'Fill/Nine', 'Fill/Ten', 'Fill/Inverted', 'System/Hint', 'System/Error', 'System/Success', 'System/Bright Red', 'System/So-so', 'System/iOS Navbar One', 'System/iOS Navbar darkBlur', 'Buttons/Extra Three'];
const BTNPREF = ['Buttons/Secondary', 'Buttons/Extra Two', 'Buttons/Extra One', 'Buttons/Inverted', 'Buttons/Extra Three'];

const t0 = Date.now();
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const hx = c => [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
const keyP = p => { const a = Math.round((p.opacity ?? 1) * 100); return hx(p.color) + (a < 100 ? '@' + a : ''); };
const keyV = v => { if (!v || typeof v !== 'object' || !('r' in v)) return null; const a = Math.round((v.a ?? 1) * 100); return hx(v) + (a < 100 ? '@' + a : ''); };
const FGT = new Set(['TEXT', 'VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'STAR', 'POLYGON']);
const VAR = {}; for (const [n, k] of Object.entries(KEYS)) VAR[n] = await figma.variables.importVariableByKeyAsync(k);
const theme = await figma.variables.getVariableCollectionByIdAsync(VAR['Fill/One'].variableCollectionId);
const prod = await figma.variables.getVariableCollectionByIdAsync(VAR['Accent colors/Primary'].variableCollectionId);
const ctxTable = node => { const t = {}; for (const [n, v] of Object.entries(VAR)) { try { t[n] = keyV(v.resolveForConsumer(node).value); } catch (e) { t[n] = null; } } return t; };
// таблицы Dark × каждый продукт на временных фреймах (удаляются сразу)
const tmp = []; const prodTables = [];
for (const m of prod.modes) { const f = figma.createFrame(); f.visible = false; tmp.push(f); f.setExplicitVariableModeForCollection(theme, theme.modes.find(x => x.name === 'Dark').modeId); f.setExplicitVariableModeForCollection(prod, m.modeId); prodTables.push(ctxTable(f)); }
for (const f of tmp) f.remove();
const DARK = prodTables[0];
const STABLE = new Set(Object.keys(VAR).filter(n => n !== 'Accent colors/Primary' && prodTables.every(t => t[n] && t[n] === DARK[n])));
const sigCache = new Map();
const sigOf = n => { const parts = []; let a = n; while (a && a.type !== 'PAGE') { const em = a.explicitVariableModes; if (em) for (const [cid, mid] of Object.entries(em)) if (cid === theme.id || cid === prod.id) parts.push(cid.slice(-6) + mid); a = a.parent; } return parts.join('|'); };
const tableFor = n => { const s = sigOf(n); if (!sigCache.has(s)) sigCache.set(s, s ? ctxTable(n) : DARK); return sigCache.get(s); };
const ovCache = new Map();
const ovOf = inst => { if (!ovCache.has(inst.id)) { const m = new Map(); try { for (const o of inst.overrides) m.set(o.id, new Set(o.overriddenFields)); } catch (e) {} ovCache.set(inst.id, m); } return ovCache.get(inst.id); };
const st = { bind: 0, nestedTail: 0, light: 0, err: 0, unmatched: {}, maps: {}, bySet: {} };

const walk = (n, R, top, S, isBtn) => {
  const ov = top ? ovOf(top).get(n.id) : null;
  for (const field of ['fills', 'strokes']) {
    const arr = n[field]; if (!Array.isArray(arr) || !arr.length) continue;
    if (!arr.some(p => p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color))) continue;
    if (top && !(ov && ov.has(field))) { st.nestedTail++; continue; }
    const ctx = tableFor(n); let changed = false;
    const next = arr.map(p => {
      if (p.type !== 'SOLID' || (p.boundVariables && p.boundVariables.color) || p.visible === false || (p.opacity ?? 1) < 0.01) return p;
      const k = keyP(p);
      const pref = (field === 'strokes' || FGT.has(n.type)) ? FGPREF : (isBtn ? BTNPREF.concat(BGPREF) : BGPREF);
      const vn = pref.find(nm => STABLE.has(nm) && ctx[nm] === k && DARK[nm] === k);
      if (!vn) { st.unmatched[k] = (st.unmatched[k] || 0) + 1; return p; }
      st.bind++; st.maps[k + '->' + vn] = (st.maps[k + '->' + vn] || 0) + 1;
      const tk = esc(S.name).slice(0, 22); st.bySet[tk] = (st.bySet[tk] || 0) + 1;
      if (DRY) return p; changed = true;
      return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: p.color, opacity: 1, visible: true, blendMode: p.blendMode || 'NORMAL' }, 'color', VAR[vn]);
    });
    if (changed) { try { n[field] = next; } catch (e) { st.err++; } }
  }
  if ('children' in n) { const nt = top || (n.type === 'INSTANCE' && n.id !== R.id ? n : null); for (const c of n.children) walk(c, R, nt, S, isBtn); }
};

let roots = [];
for (const pg of figma.root.children.filter(p => PAGE.test(p.name) && !/System Elements/.test(p.name))) {
  await pg.loadAsync();
  roots = roots.concat(pg.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET')));
}
const total = roots.length; roots = roots.slice(A, B);
for (const S of roots) {
  const comps = S.type === 'COMPONENT_SET' ? S.children.filter(c => c.type === 'COMPONENT') : [S];
  if (/light|светл/i.test(S.name)) { st.light += comps.length; continue; }
  const isBtn = /^button$|buttons/.test(S.name);
  for (const R of comps) { if (/light|светл/i.test(R.name)) { st.light++; continue; } walk(R, R, null, S, isBtn); }
}
const topN = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => k + ' x' + v);
return { DRY, ms: Date.now() - t0, total, roots: roots.length, bind: st.bind, nestedTail: st.nestedTail, lightSkipped: st.light, err: st.err,
  maps: topN(st.maps, 12), bySet: topN(st.bySet, 12), unmatched: topN(st.unmatched, 10) };
