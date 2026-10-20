// «Стало» до решения: изменение применяется к ВРЕМЕННОЙ копии, оригинал не трогается.
// MODE 'make': клон узла NODE (экран или ряд целиком — мелкое не клонировать отдельно) ставится справа от исходного
// экрана на холсте с теми же режимами переменных (explicitVariableModes предков), к клону применяется CHANGE(clone,
// orig). Вернёт id клона → get_screenshot исходного узла (было) и клона (стало) → scripts/shot.sh → две картинки подряд
// в вопросе. MODE 'clean': удалить клон CLONE (обязательно сразу после снимка, даже если вопрос не задан).
// В файлах ДС клонировать мастер нельзя (клон компонента = новый компонент) — клонировать его инстанс на холсте или
// показать только «было» + описание. Проверено 2026-10-20 на Music (First Experience).
const MODE = 'make'; const NODE = ''; const CLONE = '';
const CHANGE = async (clone, orig) => { /* пример: clone.findOne(n => n.name === 'chips' && ...).visible = false; */ };
figma.skipInvisibleInstanceChildren = false;
if (MODE === 'clean') { const c = await figma.getNodeByIdAsync(CLONE); if (c && /^\[preview\]/.test(c.name)) c.remove(); return { removed: !!c }; }
const orig = await figma.getNodeByIdAsync(NODE); if (!orig) throw new Error('NODE не найден');
let pg = orig; while (pg.type !== 'PAGE') pg = pg.parent; await figma.setCurrentPageAsync(pg);
if (orig.type === 'COMPONENT' || orig.type === 'COMPONENT_SET') throw new Error('мастер не клонировать — взять инстанс');
const modes = {}; for (let a = orig; a && a.type !== 'PAGE'; a = a.parent) for (const [k, v] of Object.entries(a.explicitVariableModes || {})) if (!(k in modes)) modes[k] = v;
let top = orig; while (top.parent && top.parent.type !== 'PAGE') top = top.parent;
// подложка: фон ближайшего предка с заливкой (у ряда своего фона нет — иначе снимок на прозрачном)
let bg = []; for (let a = orig; a && a.type !== 'PAGE'; a = a.parent) if (Array.isArray(a.fills) && a.fills.some(f => f.visible !== false)) { bg = a.fills; break; }
const box = orig.absoluteBoundingBox; const holder = figma.createFrame(); figma.currentPage.appendChild(holder);
holder.name = '[preview] ' + orig.name; holder.fills = bg; holder.resize(orig.width, orig.height); holder.clipsContent = true;
holder.x = top.absoluteBoundingBox.x + top.absoluteBoundingBox.width + 400; holder.y = box.y;
for (const [k, v] of Object.entries(modes)) { try { const c = await figma.variables.getVariableCollectionByIdAsync(k); if (c) holder.setExplicitVariableModeForCollection(c, v); } catch (e) {} }
const clone = orig.clone(); holder.appendChild(clone); clone.x = 0; clone.y = 0;
await CHANGE(clone, orig);
return { clone: holder.id, orig: orig.id, note: 'снять orig (было) и clone (стало), потом MODE clean с CLONE = clone' };
