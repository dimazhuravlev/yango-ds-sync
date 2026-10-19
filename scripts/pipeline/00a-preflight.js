// 00a — предполётная проверка: можно ли начинать и что попросить у человека. Первый вызов в любой задаче.
// Макет не меняет: пишет и сразу стирает один служебный ключ sharedPluginData (проверка прав на запись).
// Проверяет то, что видно через API:
//   write    — права на редактирование файла;
//   library  — доступ к 🫟 Платформа / Мобайл (импорт `button` по ключу). Подключены ли к файлу все четыре ДС, Plugin API
//              не видит — это инструмент Figma MCP `get_libraries` (start-checklist.md, П2);
//   fonts    — шрифты брендов на страницах файла доступны MCP по точному файлу (семейство + начертание): missingFiles
//              называет файлы как Figma («Yango Text Bold» — в стилях макета это Semibold) (иначе тексты на них не трогаются);
//   snapshot — есть ли уже слепок «до» этого скилла в файле, его дата и формат;
//   lost     — заглушки мастера на видимых местах внутри инстансов (Title, Description, Label…): слетевшие раньше или
//              стоявшие в макете изначально. Не пункт чек-листа — повод для вопроса дизайнеру, заполнять ли (SKILL.md, 4b).
// Чего API не видит: сохранена ли версия в истории Figma и приняты ли обновления до этой проверки. Это подтверждает
// человек; ожидающие обновления покажет 00c (CHECK_UPDATES) — уже после слепка.
// Ответ: gates — список пунктов чек-листа { id, ok, ask }. Человеку передать только непройденные, по шаблонам SKILL.md.
// Запуск: PAGE_ID = id мобильной страницы — одна страница на вызов (страницы параллельно); null — только общие проверки.
const PAGE_ID = null;
const SKIP = [];            // id секций/экранов вне задачи
const LIB_KEY = '2781fb17aa9a7986b89626d2e769efad4c8ade7c'; // ДС Платформа `button`
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
gates.push({ id: 'library', ok: lib, ask: lib ? '' : 'libraries-add' }); // доступ к ДС Платформа; что все четыре ДС подключены к файлу — get_libraries (start-checklist.md, П2)
// snapshot
const keys = figma.root.getSharedPluginDataKeys(NS); const units = keys.filter(k => /^sb_.*_n$/.test(k) && !/^sb_page_/.test(k)).length;
const pages = keys.filter(k => /^sb_page_/.test(k)).map(k => { let m = {}; try { m = JSON.parse(figma.root.getSharedPluginData(NS, k)); } catch (e) {} return { page: k.slice(8), date: m.date || '?', units: (m.units || []).length }; });
let format = '-'; const anyUnit = keys.find(k => /^sb_.*_0$/.test(k)); if (anyUnit) { try { const u = JSON.parse(figma.root.getSharedPluginData(NS, anyUnit)); format = Array.isArray(u.f) ? 'new' : 'old'; } catch (e) { format = 'unreadable'; } }
gates.push({ id: 'snapshot', ok: true, units, pages, format }); // units = 0 — слепка нет; format 'old' — без проверки обрезки
// fonts: какие семейства бренда реально стоят в файле и какие из них MCP не видит
const availList = (await figma.listAvailableFontsAsync()).map(f => f.fontName); const avail = new Set(availList.map(f => f.family));
const availFile = new Set(availList.map(f => f.family + ' ' + f.style)); const files = {}; // нужные файлы: семейство + начертание
// В стилях ДС Платформа «Semibold» — это файл Bold (Yango Text Bold, YS Text Bold); человеку называть оба имени
const asStyle = file => /^(Yango Text|YS Text) Bold$/.test(file) ? file + ' (в стилях макета — Semibold)' : file;
// файлы за стилями ДС Платформа: без них стили не работают — только их просить загрузить; прочие начертания (Yango Group
// Headline Bold и т.п.) не из ДС — тексты на них уходят на стили ДС Платформа (06), привязка стиля файла не требует
const LIB_FILE = /^(Yango Text (Medium|Bold)|Yango Group Headline ExtraBold|Yango Group Headline AR .+|YS Text (Medium|Bold)|YS Display Bold)$/;
const used = {}; let lost = null;
if (PAGE_ID) { const pg = figma.root.children.find(p => p.id === PAGE_ID); await pg.loadAsync();
  const inSkip = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (SKIP.includes(a.id)) return true; a = a.parent; } return false; };
  const effVis = n => { let a = n; while (a && a.type !== 'PAGE') { if (a.visible === false || ('opacity' in a && a.opacity === 0)) return false; a = a.parent; } return true; };
  const inInst = n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') return a; a = a.parent; } return null; };
  const hits = []; let texts = 0;
  for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) { if (inSkip(t) || !effVis(t)) continue; texts++;
    const fam = t.fontName === figma.mixed ? (t.getStyledTextSegments(['fontName'])[0] || { fontName: { family: '' } }).fontName.family : t.fontName.family; if (BRAND_FONTS.includes(fam)) { used[fam] = (used[fam] || 0) + 1; const segs = t.fontName === figma.mixed ? t.getStyledTextSegments(['fontName']).map(g => g.fontName) : [t.fontName]; for (const f of segs) if (BRAND_FONTS.includes(f.family)) files[f.family + ' ' + f.style] = (files[f.family + ' ' + f.style] || 0) + 1; }
    const ch = t.characters.trim(); if (!PLACEHOLDER.test(ch)) continue; const host = inInst(t); if (!host) continue;
    let scr = t; while (scr.parent && !/^(SECTION|PAGE)$/.test(scr.parent.type)) scr = scr.parent; hits.push([t.id, esc(ch).slice(0, 16), scr.id]); }
  const byScreen = {}; for (const h of hits) byScreen[h[2]] = (byScreen[h[2]] || 0) + 1;
  lost = { placeholders: hits.length, texts, screens: Object.entries(byScreen).sort((a, b) => b[1] - a[1]).slice(0, 12), sample: hits.slice(0, 8).map(h => h[0] + ' ' + h[1]) }; }
const absent = Object.keys(files).filter(f => !availFile.has(f)); // точные файлы, которых нет у MCP
const missingFiles = absent.filter(f => LIB_FILE.test(f)).map(asStyle);   // нужны стилям ДС Платформа — просить загрузить
const notLibFiles = absent.filter(f => !LIB_FILE.test(f));                // не из ДС — в отчёт, загружать не нужно
const missing = Object.keys(used).filter(f => !avail.has(f));
gates.push({ id: 'fonts', ok: !missingFiles.length, ask: missingFiles.length ? 'upload-fonts' : '', used, missing, missingFiles, notLibFiles, available: BRAND_FONTS.filter(f => avail.has(f)) });
if (lost) gates.push({ id: 'lost', ok: true, ask: lost.placeholders ? 'placeholders-found' : '', ...lost }); // не пункт чек-листа: вопрос дизайнеру, заполнять ли (SKILL.md, 4b)
return { page: PAGE_ID, gates, blocked: gates.filter(g => g.ok === false).map(g => g.id) };
