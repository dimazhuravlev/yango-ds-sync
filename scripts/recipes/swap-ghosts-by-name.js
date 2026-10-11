// Призраки (mainComponent.remote=false и мастер удалён) с двойником Library того же имени → swapComponent на импорт по
// ключу. Структуры одинаковые (копии), поэтому оверрайды переезжают сами; размер возвращается (resize), сверка видимых
// текстов, числа картинок и bbox. Если инстанс был выше компонента и прижат к низу — вернуть y (Loginwall Text ×3).
// MAP строить из keys/library-components.txt по нормализованному имени; призраки без двойника — в отчёт.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const MAP = {}; // { 'Имя призрака': '<полный ключ двойника из keys/library-components.txt>' }
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const effVis = (n, root) => { let a = n; while (a && a.id !== root.parent.id) { if (a.visible === false) return false; a = a.parent; } return true; };
const visT = R => R.findAll(n => n.type === 'TEXT' && effVis(n, R)).map(t => t.characters.replace(/\s+/g, ' ').trim()).filter(Boolean).sort().join('|');
const imgs = R => R.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')).length;
const abs = n => { const b = n.absoluteBoundingBox; return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
const comps = {}; const done = [], bad = [], skipped = []; const ids = [];
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; await pg.loadAsync(); for (const i of pg.findAllWithCriteria({ types: ['INSTANCE'] })) { let M; try { M = i.mainComponent; } catch (e) { continue; } if (!M || M.remote || !(M.removed || !M.parent)) continue; let a = i.parent, inInst = false; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { inInst = true; break; } a = a.parent; } if (inInst) continue; const nm = setOf(M).name.trim(); if (!MAP[nm]) { skipped.push(esc(nm) + ' ' + i.id); continue; } ids.push([i.id, nm]); } }
for (const [id, nm] of ids) { const i = await figma.getNodeByIdAsync(id); if (!i) continue; if (!comps[nm]) { try { comps[nm] = await figma.importComponentByKeyAsync(MAP[nm]); } catch (e) { bad.push(id + ' import ' + String(e).slice(0, 60)); continue; } }
  const t0 = visT(i), im0 = imgs(i), b0 = abs(i);
  try { i.swapComponent(comps[nm]); } catch (e) { bad.push(id + ' swap ' + String(e).slice(0, 60)); continue; }
  const j = await figma.getNodeByIdAsync(id); if (Math.abs(j.width - b0[2]) > 0.5 || Math.abs(j.height - b0[3]) > 0.5) j.resize(b0[2], b0[3]); const b1 = abs(j); if (b1[0] !== b0[0] || b1[1] !== b0[1]) { j.x += b0[0] - b1[0]; j.y += b0[1] - b1[1]; }
  const ok = visT(j) === t0 && imgs(j) === im0 && abs(j).join() === b0.join(); (ok ? done : bad).push(esc(nm) + ' ' + id + (ok ? '' : ' texts=' + (visT(j) === t0) + ' imgs=' + im0 + '/' + imgs(j))); }
return { doneN: done.length, bad, skipped: [...new Set(skipped.map(s => s.replace(/ \d+:\d+$/, '')))] };
