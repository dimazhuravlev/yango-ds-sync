// 00a — предполётная проверка: можно ли начинать и что попросить у человека. Первый вызов в любой задаче.
// Макет не меняет: пишет и сразу стирает один служебный ключ sharedPluginData (проверка прав на запись).
// Проверяет то, что видно через API:
//   write    — права на редактирование файла;
//   library  — доступ к 🧩 Mobile · Library (импорт `button` по ключу). Подключены ли к файлу все четыре ДС, Plugin API
//              не видит — это инструмент Figma MCP `get_libraries` (gates.md, Ш2);
//   fonts    — шрифты брендов, которые есть на страницах файла, доступны MCP (иначе тексты на них не трогаются);
//   snapshot — есть ли уже слепок «до» этого скилла в файле, его дата и формат;
//   lost     — заглушки мастера на видимых местах внутри инстансов (Title, Description, Label…): слетевшие раньше или
//              стоявшие в макете изначально. Не шлагбаум — повод для вопроса дизайнеру, заполнять ли (SKILL.md, 4b).
// Чего API не видит: сохранена ли версия в истории Figma и приняты ли обновления до этой проверки. Это подтверждает
// человек; ожидающие обновления покажет 00c (CHECK_UPDATES) — уже после слепка.
// Ответ: gates — список шлагбаумов { id, ok, ask }. Человеку передать только непройденные, по шаблонам SKILL.md.
// Запуск: PAGE_ID = id мобильной страницы — одна страница на вызов (страницы параллельно); null — только общие проверки.
const PAGE_ID = null;
const SKIP = [];            // id секций/экранов вне задачи
const LIB_KEY = '2781fb17aa9a7986b89626d2e769efad4c8ade7c'; // Library `button`
const BRAND_FONTS = ['Yango Text', 'Yango Group Headline', 'YS Text', 'YS Display', 'Graphik'];
const PLACEHOLDER = /^(title|subtitle|description|label|text|button|caption|header|name|value|название|описание|заголовок|подзаголовок|текст|кнопка|подпись|lorem ipsum.*)$/i;
figma.skipInvisibleInstanceChildren = false; // true в MCP прячет ВСЕ тексты внутри инстансов, а не только скрытые
const NS = 'yango_ds_migration';
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const gates = [];
// write
let write = false; try { figma.root.setSharedPluginData(NS, 'preflight', '1'); write = figma.root.getSharedPluginData(NS, 'preflight') === '1'; figma.root.setSharedPluginData(NS, 'preflight', ''); } catch (e) {}
gates.push({ id: 'write', ok: write, ask: write ? '' : 'edit-access' });
// library
let lib = false; try { const s = await figma.importComponentSetByKeyAsync(LIB_KEY); lib = !!s; } catch (e) {}
gates.push({ id: 'library', ok: lib, ask: lib ? '' : 'libraries-add' }); // доступ к Library; что все четыре ДС подключены к файлу — get_libraries (gates.md, Ш2)
// snapshot
const keys = figma.root.getSharedPluginDataKeys(NS); const units = keys.filter(k => /^sb_.*_n$/.test(k) && !/^sb_page_/.test(k)).length;
const pages = keys.filter(k => /^sb_page_/.test(k)).map(k => { let m = {}; try { m = JSON.parse(figma.root.getSharedPluginData(NS, k)); } catch (e) {} return { page: k.slice(8), date: m.date || '?', units: (m.units || []).length }; });
let format = '-'; const anyUnit = keys.find(k => /^sb_.*_0$/.test(k)); if (anyUnit) { try { const u = JSON.parse(figma.root.getSharedPluginData(NS, anyUnit)); format = Array.isArray(u.f) ? 'new' : 'old'; } catch (e) { format = 'unreadable'; } }
gates.push({ id: 'snapshot', ok: true, units, pages, format }); // units = 0 — слепка нет; format 'old' — без проверки обрезки
// fonts: какие семейства бренда реально стоят в файле и какие из них MCP не видит
const avail = new Set((await figma.listAvailableFontsAsync()).map(f => f.fontName.family));
const used = {}; let lost = null;
if (PAGE_ID) { const pg = figma.root.children.find(p => p.id === PAGE_ID); await pg.loadAsync();
  const inSkip = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (SKIP.includes(a.id)) return true; a = a.parent; } return false; };
  const effVis = n => { let a = n; while (a && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
  const inInst = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return a; a = a.parent; } return null; };
  const hits = []; let texts = 0;
  for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) { if (inSkip(t) || !effVis(t)) continue; texts++;
    const fam = t.fontName === figma.mixed ? (t.getStyledTextSegments(['fontName'])[0] || { fontName: { family: '' } }).fontName.family : t.fontName.family; if (BRAND_FONTS.includes(fam)) used[fam] = (used[fam] || 0) + 1;
    const ch = t.characters.trim(); if (!PLACEHOLDER.test(ch)) continue; const host = inInst(t); if (!host) continue;
    let scr = t; while (scr.parent && !/^(SECTION|PAGE)$/.test(scr.parent.type)) scr = scr.parent; hits.push([t.id, esc(ch).slice(0, 16), scr.id]); }
  const byScreen = {}; for (const h of hits) byScreen[h[2]] = (byScreen[h[2]] || 0) + 1;
  lost = { placeholders: hits.length, texts, screens: Object.entries(byScreen).sort((a, b) => b[1] - a[1]).slice(0, 12), sample: hits.slice(0, 8).map(h => h[0] + ' ' + h[1]) }; }
const missing = Object.keys(used).filter(f => !avail.has(f));
gates.push({ id: 'fonts', ok: !missing.length, ask: missing.length ? 'upload-fonts' : '', used, missing, available: BRAND_FONTS.filter(f => avail.has(f)) });
if (lost) gates.push({ id: 'lost', ok: true, ask: lost.placeholders ? 'placeholders-found' : '', ...lost }); // не шлагбаум: вопрос дизайнеру, заполнять ли (SKILL.md, 4b)
return { page: PAGE_ID, gates, blocked: gates.filter(g => g.ok === false).map(g => g.id) };
