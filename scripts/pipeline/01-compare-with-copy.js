// 01 — ЗАПАСНОЙ путь (основной — 01b со слепком): сверка видимых текстов (текст + кегль) по экранам: копия «до» ↔ рабочий файл. Read-only.
// В копии версии id узлов те же, поэтому экран сравнивается по id. Три прогона, данные — через ответ:
//   STEP 1 в копии          → COPY  ({ unitId: 'хеш.хеш…' })
//   STEP 2 в рабочем с COPY → по экранам: onlyCur (текстом) и onlyCopy (хешами)
//   STEP 3 в копии с WANT   → раскрыть хеши onlyCopy в тексты с id
// Запускать: сразу после принятия обновлений (что слетело) и в конце (что поменяла миграция).
// Ожидаемые отличия после миграции — в references/verification.md.
const PAGE = 'Mobile';   // часть имени страницы
const STEP = 1;
const COPY = {};
const WANT = {};         // { unitId: [hash, …] }
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const h32 = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
const effVis = n => { let c = n; while (c && c.type !== 'PAGE') { if (!c.visible || ('opacity' in c && c.opacity === 0)) return false; c = c.parent; } return true; };
const p = figma.root.children.find(x => x.name.includes(PAGE)); await p.loadAsync();
// экран = ребёнок секции / фрейма-доски верхнего уровня
const units = []; for (const top of p.children) { if ((top.type === 'SECTION' || top.type === 'FRAME') && 'children' in top && top.children.some(c => c.type === 'FRAME' || c.type === 'INSTANCE')) for (const c of top.children) units.push(c); else units.push(top); }
const items = u => { const L = []; if (!('findAllWithCriteria' in u)) return L; for (const t of u.findAllWithCriteria({ types: ['TEXT'] })) { if (!effVis(t)) continue; const ch = t.characters.replace(/\s+/g, ' ').trim(); if (!ch) continue; L.push({ s: ch + '|' + (typeof t.fontSize === 'number' ? Math.round(t.fontSize) : 'mx'), id: t.id }); } return L; };
const out = {};
for (const u of units) { const L = items(u);
  if (STEP === 1) out[u.id] = L.map(x => h32(x.s)).sort().join('.');
  if (STEP === 2) { const cnt = {}; for (const h of (COPY[u.id] || '').split('.')) if (h) cnt[h] = (cnt[h] || 0) + 1;
    const onlyCur = []; for (const x of L) { const h = h32(x.s); if (cnt[h] > 0) cnt[h]--; else onlyCur.push(esc(x.s).slice(0, 60) + ' #' + x.id); }
    const onlyCopy = []; for (const h in cnt) for (let i = 0; i < cnt[h]; i++) onlyCopy.push(h);
    if (onlyCur.length || onlyCopy.length) out[u.id] = { onlyCur, onlyCopy }; }
  if (STEP === 3 && WANT[u.id]) { const w = new Set(WANT[u.id]); out[u.id] = L.filter(x => w.has(h32(x.s))).map(x => esc(x.s).slice(0, 60) + ' #' + x.id); } }
return out;
