// 04b — отвязанная копия (фрейм с именем компонента, «Detach instance» в прошлом) → новый инстанс Library на том же
// месте. Перепись: 03-census.js → detached. Свап невозможен (это не инстанс), поэтому: снять роли из фрейма →
// createInstance → тот же родитель и индекс → ширина/высота как были → роли → сверка → старый фрейм удалить.
// Пример ниже — шапки каруселей (`header / static` → Library `header`, type=static|top10).
// Роли для шапки: title (текст), description (текст и видимость), стрелка (видимость `icon` в старом → `action`).
// Для другого компонента — поправить блок «роли» (имена слоёв смотреть дампом обоих).
// НЕЛЬЗЯ, если текст копии на шрифте, недоступном MCP (экспериментальные Var/ML 2): инстанс получит шрифт стиля
// Library, а вернуть исходный нельзя — такие оставить, в отчёт (в интерфейсе — Swap instance руками).
const SET_KEY = '409e75f2a9132b187f7f319c51f086509406d9df';   // Library `header`
const JOBS = [
  // ['2:20340', 'RTL=off, type=top10'],
  // ['2:32893', 'RTL=off, type=static'],
];
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const S = await figma.importComponentSetByKeyAsync(SET_KEY);
const effVis = (n, root) => { let a = n; while (a && a !== root.parent) { if (a.visible === false) return false; a = a.parent; } return true; };
const visT = X => X.findAll(n => n.type === 'TEXT' && effVis(n, X)).map(t => t.characters);
const res = [];
/*@GUARD*/
for (const [id, vname] of JOBS) {
  const X = await figma.getNodeByIdAsync(id); const P = X.parent; const idx = P.children.indexOf(X);
  const t0 = visT(X); const w = X.width, h = X.height, sh = X.layoutSizingHorizontal, sv = X.layoutSizingVertical;
  // роли «до»
  const title = X.findOne(n => n.type === 'TEXT' && n.name === 'title');
  try { await figma.loadFontAsync(title.fontName); } catch (e) { throw new Error('font not available for ' + id + ' — leave it, tell the owner'); }
  const dsc = X.findOne(n => n.type === 'TEXT' && n.name === 'description'); const dscVis = !!dsc && effVis(dsc, X);
  const oldIcon = X.findOne(n => n.type === 'INSTANCE' && n.name === 'icon'); const arrow = !!oldIcon && effVis(oldIcon, X);
  // новый инстанс на том же месте
  const GG = geoGuard(X); const I = S.children.find(c => c.name === vname).createInstance(); P.insertChild(idx, I);
  const pAL = !!(P.layoutMode && P.layoutMode !== 'NONE'); try { if (X.layoutPositioning === 'ABSOLUTE' && pAL) I.layoutPositioning = 'ABSOLUTE'; } catch (e) {} if (!pAL || X.layoutPositioning === 'ABSOLUTE') { I.x = X.x; I.y = X.y; } try { I.constraints = X.constraints; } catch (e) {}
  I.layoutSizingHorizontal = sh; if (sh === 'FIXED') I.resize(w, I.height); try { I.layoutSizingVertical = sv; } catch (e) {}
  // роли «после»
  const tt = I.findOne(n => n.type === 'TEXT' && n.name === 'title'); await figma.loadFontAsync(tt.fontName); tt.characters = title.characters;
  const act = I.findOne(n => n.name === 'action'); if (act && act.visible !== arrow) act.visible = arrow;
  const nd = I.findOne(n => n.name === 'description' && n.type !== 'TEXT'); if (nd) { nd.visible = dscVis; if (dscVis) { const dt = nd.findOne(n => n.type === 'TEXT'); await figma.loadFontAsync(dt.fontName); dt.characters = dsc.characters; } }
  const t1 = visT(I); const mv = GG.moved(I);
  res.push({ id, inst: I.id, moved: mv.slice(0, 3), ok: !mv.length && JSON.stringify(t0) === JSON.stringify(t1) && Math.abs(I.width - w) < .5 && Math.abs(I.height - h) < .5, t0: esc(t0.join('|')), t1: esc(t1.join('|')), size: Math.round(w) + 'x' + Math.round(h) + ' -> ' + Math.round(I.width) + 'x' + Math.round(I.height) });
  X.remove();
}
const bad = res.filter(r => !r.ok); if (bad.length) throw new Error('ROLLBACK ' + JSON.stringify(bad));
return res;
