// 00 — обновить allowlist актуальной ДС. Запускать в файле-источнике (Library, Графика, Органайзер), когда в нём
// появились новые компоненты. Read-only. Ответ вставить в keys/<файл>.txt (строки после комментария-шапки).
// CONFIG: PREFIX — сколько символов ключа хранить (Library и Органайзер — 8, Графика — 10).
//         WHAT — 'keys' (allowlist по ключам) | 'names' (имена сетов → keys/component-names.txt, для поиска
//         отвязанных копий: фрейм с именем компонента ДС, например «header / static», «Badge»).
const PREFIX = 8;
const WHAT = 'keys';
const out = new Set();
for (const p of figma.root.children) {
  await p.loadAsync();
  for (const n of p.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue; // варианты — по сету
    out.add(WHAT === 'names' ? n.name.trim().toLowerCase() : n.key.slice(0, PREFIX));
  }
}
return [...out].join('\n');
