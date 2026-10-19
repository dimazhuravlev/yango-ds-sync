// Проверка файла ДС (🫟 Library, 🦄 Органайзер, 🦄 Графика, 🌈 Стили) на старую типографику — только чтение.
// По сетам компонентов: тексты на стилях не из 16 актуальных Library (oldStyle), тексты без стиля с привязкой к удалённым
// коллекциям Typography* / Constants или к старой версии Product (noStyleOldVars), свои стили на старых переменных
// (ownStyleOldVars), старые копии актуальных стилей (staleCopy), режимы старых коллекций внутри компонентов (mode:…).
// Найденное чинится в самом файле ДС: режимы — 06a (MODE 'fix'), привязки — recipes/rebind-typography-vars.js, стили —
// 06; потом владелец публикует файл. Системные киты (iOS: Body/Regular, Callout…) — не наши, не трогать.
// OWN_OK = true для Органайзера и Графики (у них свои стили допустимы, если не на старых переменных); false для Library.
const PAGES = null; const OWN_OK = false;
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const CURK = new Set(["3c819bca","a760de85","5b110814","31550c13","7ebd290e","2b1c4980","b3000203","9577f02f","da62bf16","f364855d","976a3588","387a5108","5d0b9abd","31e64f8e","66fcf5cf","b9eb84b1"]);
const OWN_STYLES_OK = OWN_OK;
const cc = new Map(); const col = async id => { if (cc.has(id)) return cc.get(id); let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(id); } catch (e) {} cc.set(id, c); return c; };
const vc = new Map(); const varCol = async id => { if (vc.has(id)) return vc.get(id); let c = null; try { const v = await figma.variables.getVariableByIdAsync(id); c = v ? await col(v.variableCollectionId) : null; } catch (e) {} vc.set(id, c); return c; };
const kindOf = c => { if (!c) return 'removed'; if (c.name === 'Product' || (c.key || '').startsWith('17df014a0d')) return c.modes.some(m => m.name === 'Yango Play EN') ? 'cur' : 'oldProduct'; if (/^\.?Typography( Theme| Headline)?$|^Constants$/.test(c.name)) return 'removed'; return 'other'; };
const TF = ['fontFamily', 'fontStyle', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing'];
const oldRefs = async bv => { for (const f of TF) { const r = (bv || {})[f]; for (const ref of (Array.isArray(r) ? r : r ? [r] : [])) { if (!ref || !ref.id) continue; const k = kindOf(await varCol(ref.id)); if (k === 'oldProduct' || k === 'removed') return true; } } return false; };
const sc = new Map(); const styleOf = async id => { if (!id || typeof id !== 'string') return null; if (sc.has(id)) return sc.get(id); let s = null; try { s = await figma.getStyleByIdAsync(id); } catch (e) {} sc.set(id, s); return s; };
const stale = new Map();
const kindText = async t => { const s = await styleOf(typeof t.textStyleId === 'string' ? t.textStyleId : null); if (!s) return (await oldRefs(t.boundVariables)) ? 'noStyleOldVars' : null; if (!CURK.has((s.key || '').slice(0, 8))) { if (!s.remote && OWN_STYLES_OK) return (await oldRefs(s.boundVariables)) ? 'ownStyleOldVars:' + esc(s.name).slice(0, 22) : null; return 'oldStyle:' + esc(s.name).slice(0, 22); } if (!stale.has(s.id)) stale.set(s.id, await oldRefs(s.boundVariables)); return stale.get(s.id) ? 'staleCopy' : null; };
const G = {};
const add = (pg, comp, kind, nodeId) => { const S = comp.parent && comp.parent.type === 'COMPONENT_SET' ? comp.parent : comp; const key = esc(S.name).slice(0, 40); const g = G[key] || (G[key] = { page: esc(pg.name).slice(0, 24), id: S.id, n: 0, kinds: {}, ex: [] }); g.n++; g.kinds[kind] = (g.kinds[kind] || 0) + 1; if (g.ex.length < 3 && !g.ex.includes(nodeId)) g.ex.push(nodeId); };
const compOf = n => { let a = n; while (a && a.type !== 'COMPONENT' && a.type !== 'PAGE') a = a.parent; return a && a.type === 'COMPONENT' ? a : null; };
let pagesDone = 0;
for (const pg of figma.root.children) { if (PAGES && !PAGES.test(pg.name)) continue; await pg.loadAsync(); pagesDone++;
  for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) { if (t.id.includes(';')) continue; const c = compOf(t); if (!c) continue; const k = await kindText(t); if (k) add(pg, c, k, t.id); }
  for (const n of pg.findAll(x => !x.id.includes(';') && x.explicitVariableModes && Object.keys(x.explicitVariableModes).length)) { const c = compOf(n); if (!c) continue; for (const [cid, mid] of Object.entries(n.explicitVariableModes)) { const cl = await col(cid); const k = kindOf(cl); if (k === 'oldProduct' || k === 'removed') add(pg, c, 'mode:' + esc(cl ? cl.name : '?') + '=' + esc(cl ? (cl.modes.find(m => m.modeId === mid) || {}).name : mid), n.id); } } }
return { pagesDone, sets: Object.keys(G).length, G };
