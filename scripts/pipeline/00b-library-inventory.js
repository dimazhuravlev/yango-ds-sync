// 00b — полная опись компонентов ДС Платформа (read-only). Запускать в файле ДС Платформа двумя половинами страниц (лимит ответа
// 20 КБ): PAGES_FROM/PAGES_TO — срез figma.root.children. Результат → keys/library-components.txt
// (имя | полный ключ | число вариантов | страница). Приватные `. /` тоже в описи: на экран не импортируются, но нужны,
// чтобы отличать «хвост мастера» от замены. Сопоставление по имени: убрать ❌, пробелы вокруг «/», регистр, хвостовые числа.
const PAGES_FROM = 0; const PAGES_TO = 22;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const pages = figma.root.children.slice(PAGES_FROM, PAGES_TO); const out = [];
for (const pg of pages) { await pg.loadAsync(); for (const c of pg.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })) { if (c.type === 'COMPONENT' && c.parent && c.parent.type === 'COMPONENT_SET') continue; out.push(esc(c.name.replace(/\s+/g, ' ').trim()) + '|' + c.key + '|' + (c.type === 'COMPONENT_SET' ? c.children.length : 1) + '|' + esc(pg.name.replace(/\s+/g, ' ').trim()).slice(0, 24)); } }
return { n: out.length, items: out };
