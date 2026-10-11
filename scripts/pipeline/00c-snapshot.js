// 00c — слепок «до» прямо в файле (вместо ручной копии-дубля). Макет не меняет: пишет только sharedPluginData корня.
// По каждому экрану (ребёнок секции или верхний узел страницы) хранит то, что описано в scripts/lib/snap-unit.js:
// тексты с видимой долей (обрезка родителями), картинки, иконки и бейджи, bbox экрана и детей, размеры своих фреймов.
// Ключи (namespace 'yango_ds_migration'): '<PFX><id экрана>_<k>' куски по 90 000 символов, '<PFX><id>_n' число кусков,
// '<PFX>page_<id страницы>' оглавление { date, units }. Лимит записи ~100 КБ — поэтому куски.
// После записи (CHECK_UPDATES) — отчёт «ждут ли обновления библиотек»: публичные компоненты, у которых в файле
// устаревшая копия. Пусто — дизайнеру не нужно принимать обновления. Сама проверка импортирует компоненты по ключу и
// изредка перепривязывает инстансы к свежей версии (как «Update») — слепок к этому моменту уже записан.
// Ложные срабатывания: форк библиотеки с теми же ключами (старый `Top Navigation Master` форка = ключ
// `Top Navigation`) — сверять имя и оси сета, прежде чем просить дизайнера принять обновления.
// Страховка «на всякий случай» — именованная версия в истории Figma (её делает дизайнер, API не умеет).
// Запуск: одна страница на вызов (страницы — параллельно); большие страницы — UNITS пачками по секциям.
// Уже снятый слепок экрана не перезаписывается (OVERWRITE); после «готово» за обновлениями — SNAP = false.
const PAGE_ID = '0:1';
const SKIP = [];            // id секций/экранов вне задачи (обложка, ТВ, Веб)
const UNITS = null;         // null — вся страница; [id секции или экрана, …] — только они
const PFX = 'sb_';
const CHECK_UPDATES = true;
const SNAP = true;          // false — только проверить обновления (повторная проверка после «готово»), слепок не трогать
const OVERWRITE = false;    // true — перезаписать уже снятый слепок экрана (точка отсчёта «до» потеряется); только по просьбе человека
figma.skipInvisibleInstanceChildren = false;
const NS = 'yango_ds_migration';
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const R = n => { const b = n.absoluteBoundingBox; return b ? [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] : null; };
/*@SNAP*/
const p = figma.root.children.find(x => x.id === PAGE_ID); await p.loadAsync();
const pick = UNITS ? new Set(UNITS) : null; const units = [];
for (const top of p.children) { if (SKIP.includes(top.id)) continue; const kids = top.type === 'SECTION' ? top.children : [top];
  if (pick && !pick.has(top.id)) { for (const c of kids) if (pick.has(c.id)) units.push(c); continue; }
  for (const c of kids) if (!SKIP.includes(c.id)) units.push(c); }
let bytes = 0; const done = [], kept = [];
for (const u of (SNAP ? units : [])) { if (!OVERWRITE && figma.root.getSharedPluginData(NS, PFX + u.id + '_n')) { kept.push(u.id); continue; } const s = JSON.stringify(snapUnit(u)); const parts = Math.max(1, Math.ceil(s.length / 90000)); bytes += s.length;
  for (let k = 0; k < parts; k++) figma.root.setSharedPluginData(NS, PFX + u.id + '_' + k, s.slice(k * 90000, (k + 1) * 90000));
  figma.root.setSharedPluginData(NS, PFX + u.id + '_n', String(parts)); done.push(u.id); }
const prev = figma.root.getSharedPluginData(NS, PFX + 'page_' + p.id); const all = new Set(prev ? JSON.parse(prev).units : []); done.forEach(x => all.add(x));
if (done.length) figma.root.setSharedPluginData(NS, PFX + 'page_' + p.id, JSON.stringify({ date: new Date().toISOString().slice(0, 10), units: [...all] }));
let updates = null;
if (CHECK_UPDATES) { const used = {};
  for (const i of p.findAllWithCriteria({ types: ['INSTANCE'] })) { if (i.id.includes(';')) continue; let M = null; try { M = i.mainComponent; } catch (e) {} if (!M || !M.remote) continue; const S = setOf(M); if (!S.key) continue; const r = used[S.key] || (used[S.key] = { name: S.name, ids: new Set(), n: 0 }); r.ids.add(S.id); r.n++; }
  updates = []; for (const [k, r] of Object.entries(used)) { let fresh = null; try { fresh = await figma.importComponentSetByKeyAsync(k); } catch (e) { try { fresh = await figma.importComponentByKeyAsync(k); } catch (e2) {} }
    if (fresh && [...r.ids].some(x => x !== fresh.id)) updates.push(esc(r.name.trim()).slice(0, 30) + ' x' + r.n); } }
return { page: esc(p.name).slice(0, 30), units: done.length, kept: kept.length, kb: Math.round(bytes / 1024), updates }; // kept — экраны с уже снятым слепком (не перезаписаны)
