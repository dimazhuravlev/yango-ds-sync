// relink-ghost-slots.js — перепривязка вложенных слотов таббара, оставшихся на призраке приватного
// `. / tabbar / default tab` после переноса мастера. Ищет инстансы, чей мастер имеет OLD_KEY или без родителя,
// снимает состояние, свапает на новый вариант с теми же RTL/Direction/Active, возвращает подпись, глиф, имя.
const CONFIG = { OLD_KEYS: ['49bee64f'], NEW_KEY: 'eff460b0fa77780ff1fc2e71846e382926a060c8', ICON_PROP: 'Icon glyph#1269:0', DRY_RUN: false };
const pages = figma.root.children.filter(p => p.type === 'PAGE'); for (const p of pages) await p.loadAsync(); await figma.setCurrentPageAsync(pages[0]);
let newSet = null; for (const p of pages) { for (const i of p.findAllWithCriteria({ types: ['INSTANCE'] })) { for (const n of [i, ...i.findAllWithCriteria({ types: ['INSTANCE'] })]) { let m = null; try { m = await n.getMainComponentAsync() } catch (e) { continue } if (m && m.parent && m.parent.type === 'COMPONENT_SET' && m.parent.key === CONFIG.NEW_KEY) { newSet = m.parent; break } } if (newSet) break } if (newSet) break }
if (!newSet) throw new Error('new default tab set not reachable — приватные не импортируются, нужен живой инстанс в файле');
function bfs(root) { const seen = new Set(), acc = []; let q = root.findAllWithCriteria({ types: ['INSTANCE'] }), g = 0; while (q.length && g++ < 40) { const nx = []; for (const i of q) { if (seen.has(i.id)) continue; seen.add(i.id); acc.push(i); let inn = []; try { inn = i.findAllWithCriteria({ types: ['INSTANCE'] }) } catch (e) {} for (const c of inn) if (!seen.has(c.id)) nx.push(c) } q = nx } return acc }
async function state(i) { let vp = {}; try { vp = i.variantProperties || {} } catch (e) {} let icon = null; try { const cp = i.componentProperties[CONFIG.ICON_PROP]; icon = cp ? cp.value : null } catch (e) {} const t = i.findOne(n => n.type === 'TEXT'); return { vp, icon, label: t ? t.characters : null, name: i.name, visible: i.visible, w: i.width } }
const out = { relinked: [], problems: [] };
for (const p of pages) for (const i of bfs(p)) { let m = null; try { m = await i.getMainComponentAsync() } catch (e) { continue } if (!m) continue; const st = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : null;
  const key = ((st ? st.key : m.key) || '').slice(0, 8); const ghost = !(st ? st.parent : m.parent); if (!CONFIG.OLD_KEYS.includes(key) && !(ghost && /default tab/.test(st ? st.name : m.name))) continue;
  const b = await state(i); const target = newSet.children.find(v => v.name === 'Product=Yango, RTL=' + (b.vp.RTL || 'off') + ', Direction=' + (b.vp.Direction || 'vertical') + ', Active=' + (b.vp.Active || 'off'));
  if (!target) { out.problems.push(p.name.trim() + ' ' + i.id + ' no target for ' + JSON.stringify(b.vp)); continue } if (CONFIG.DRY_RUN) { out.relinked.push(p.name.trim() + ' ' + i.id + ' → ' + target.name); continue }
  try { i.swapComponent(target) } catch (e) { out.problems.push(p.name.trim() + ' ' + i.id + ' swap ERR ' + String(e).slice(0, 80)); continue }
  const fix = []; if (b.label !== null) { const t = i.findOne(n => n.type === 'TEXT'); if (t && t.characters !== b.label) { for (const sg of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(sg.fontName); t.characters = b.label; fix.push('label') } }
  if (b.icon) { try { const cp = i.componentProperties[CONFIG.ICON_PROP]; if (!cp || cp.value !== b.icon) { i.setProperties({ [CONFIG.ICON_PROP]: b.icon }); fix.push('icon') } } catch (e) {} }
  if (i.visible !== b.visible) { i.visible = b.visible; fix.push('visible') } if (i.name !== b.name) { i.name = b.name; fix.push('name') }
  out.relinked.push(p.name.trim() + ' ' + i.id + ' → ' + target.name + (fix.length ? ' (repaired: ' + fix.join(',') + ')' : '')) }
return out;
