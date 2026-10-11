// usage-before-delete.js — проверка перед удалением компонента/сета/артборда: кто использует.
// CONFIG.TARGET_IDS — ноды (сеты, компоненты или целый артборд) в текущем файле.
// Считает использования по всем страницам файла; отдельно — внутри самих целей (норма) и снаружи (блокер).
// Для макетов запустить pipeline/03-census.js с ключами удаляемых сетов — там ключ, не id.
const CONFIG = { TARGET_IDS: ['174:254'], DELETE_IF_UNUSED: false };
const pages = figma.root.children.filter(p => p.type === 'PAGE');
for (const p of pages) await p.loadAsync();
await figma.setCurrentPageAsync(pages[0]);
const targets = []; for (const id of CONFIG.TARGET_IDS) { const n = await figma.getNodeByIdAsync(id); if (!n) throw new Error('not found ' + id); targets.push(n); }
const comps = []; for (const t of targets) { if (t.type === 'COMPONENT_SET' || t.type === 'COMPONENT') comps.push(t);
  if (t.findAll) comps.push(...t.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && !(n.parent && n.parent.type === 'COMPONENT_SET')))); }
const keys = new Set(); for (const c of comps) { keys.add(c.key); if (c.type === 'COMPONENT_SET') for (const v of c.children) keys.add(v.key); }
const inside = n => { let p = n; while (p) { if (targets.includes(p)) return true; p = p.parent; } return false; };
const out = { components: comps.map(c => c.name + ' [' + c.type + (c.type === 'COMPONENT_SET' ? ' ' + c.children.length : '') + '] key=' + c.key.slice(0, 8)), internalUses: 0, externalUses: [] };
function bfs(root) { const seen = new Set(), acc = []; let q = root.findAll(n => n.type === 'INSTANCE'), g = 0;
  while (q.length && g++ < 40) { const nx = []; for (const i of q) { if (seen.has(i.id)) continue; seen.add(i.id); acc.push(i);
    let inn = []; try { inn = i.findAllWithCriteria({ types: ['INSTANCE'] }) } catch (e) {} for (const c of inn) if (!seen.has(c.id)) nx.push(c); } q = nx; } return acc; }
for (const pg of pages) for (const i of bfs(pg)) { let m = null; try { m = await i.getMainComponentAsync() } catch (e) { continue } if (!m) continue;
  const sk = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.key : null; if (!keys.has(m.key) && !(sk && keys.has(sk))) continue;
  if (inside(i)) out.internalUses++; else { let h = i.parent; while (h && h.type !== 'COMPONENT_SET' && h.type !== 'COMPONENT' && h.type !== 'PAGE') h = h.parent;
    out.externalUses.push(pg.name.trim() + ' › ' + (h ? h.name : '?') + ' › ' + i.name + ' ' + i.id); } }
if (CONFIG.DELETE_IF_UNUSED) { if (out.externalUses.length) throw new Error('external usage found, aborting: ' + out.externalUses.join(' | '));
  for (const t of targets) t.remove(); out.deleted = CONFIG.TARGET_IDS; }
return out;
