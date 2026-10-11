// 07b — сырые цвета → переменные (шаг по умолчанию; правило: если цвет есть в переменных — использовать переменную).
// Корни: экраны (фреймы 320–1440 × ≥ 400 — в рядах hStack/vStack фрейма страницы или прямые дети страницы и секций) и
// локальные мастера. Сплошные заливки и обводки без привязки → переменная Theme / Product с тем же hex и альфой (таблица
// FG/BG по роли: fg — текст, векторы, обводки; bg — фреймы, прямоугольники, эллипсы). Привязка: paint.opacity = 1, альфа
// берётся из переменной. Свои слои — привязать; внутри чужих инстансов — переопределением; внутри инстанса Library —
// только если цвет отличается от мастера (иначе хвост мастера — в отчёт). Пропуск: картинки, градиенты, цвета без
// переменной, кит оформления, фон секций и подписи на холсте, SKIP_ROOT. Сначала DRY. Тяжёлые страницы — пачками: ONLY = id экранов,
// мастеров или секций, они берутся корнями напрямую (быстро, без обхода страницы). После обрыва — повторить с DRY.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const SKIP_ROOT = new Set([]); const DRY = true;
const ONLY = null;   // [id экранов, мастеров, секций] — корни напрямую (пачки по 6–8 экранов для тяжёлых страниц)
const KEYS = { 'Surface/One': '87e63293ec061298b3d1da584890ffa4de77e9ac', 'Surface/Two': 'df013d8623c87ce6a3e528985a53ec2bc63583da', 'Surface/Three': '8fff1f1ef7d8e11d860ce1be6c6c059a9d7df455', 'Surface/Four': '18efa7cf28b5640abaf0a066130070e026fcc42d', 'Surface/Five': 'b8b4ab09cca2a7a709dfed5357ad47ac8bc09642', 'Fill/One': 'a3049cdb8248b8d0608a4ea23d3d09d2fe7ca4c1', 'Fill/Two': 'f3f6ba352cbeebd05f1b10b6e4c167e928283214', 'Fill/Three': '210be8ff691e6d492bf0f9634cc739ea098728c8', 'Fill/Four': '6f96fc6c49a5d30859577747c0a6a8a35bb2adc2', 'Fill/Five': '9cb950892b437ea8f915a4c9dddaa787519c3d3f', 'Fill/Subtitle': 'af7aaf043131ad0549367fd4377a19f900bd34bb', 'Fill/Six': '08ef15ecd098462fece8c05cfe5fa16b98b76ad2', 'Fill/Seven': '18f8bc09f4281193456c37bac9433dad96154baa', 'Fill/Eight': '33fb16489febe33fcda65a93fe696b19576b3f0e', 'Fill/Nine': 'ee4a4e445e813ce7fead17c351a0dcde68da0849', 'Fill/Ten': 'd1bffc97aadc65b0c030518417d5bf0f5a1e3aac', 'Fill/Inverted': 'e7f2fdb15f592032455e93e139b9af7a94ed6893', 'System/Hint': '8843fda35b9f1f09ad44e5ca7cbfb97f1010ce42', 'System/Error': '6456c92cf3806ad8e3adf5eb5f3218930141486a', 'System/Success': 'e5f0ffed0f8326a12055978e08c5c0c59ff350b4', 'System/Bright Red': '72ca8f3efd654b39e399e74c37dd01e693404aa7', 'System/So-so': 'a2b71f440d80ac0081018f8d5949ca3523e24b68', 'System/iOS Navbar One': '79c8ef55233e820fbe220de8fd20103972bee0b4', 'System/iOS Navbar darkBlur': '45ab2b5a231d136de0d9b6cfe4b0e8e211a3626c', 'Buttons/Extra Three': '7d0d790e3125c2b76c8af8aa250b8aec8bad197a', 'Accent colors/Primary': '2614253864f5ca1361d329f89c8d6efac6323e06' };
const FG = { 'ffffff': 'Fill/One', 'ffffff@80': 'Fill/Four', 'ffffff@60': 'Fill/Five', 'ffffff@50': 'Fill/Subtitle', 'ffffff@40': 'Fill/Six', 'ffffff@30': 'Fill/Seven', 'ffffff@15': 'Fill/Eight', 'ffffff@8': 'Fill/Nine', 'ffffff@6': 'Fill/Ten', '000000': 'Fill/Inverted', 'f2f2f2': 'Fill/Two', 'e6e6e6': 'Fill/Three', '141414': 'Surface/Two', '1f1f1f': 'Surface/Four', '333333': 'Surface/Three', '333333@50': 'Surface/Five', '3a71f9': 'System/Hint', 'e5312e': 'System/Error', '3bb33b': 'System/Success', 'ff0000': 'System/Bright Red', '777777': 'System/So-so', 'd88dfc': 'Accent colors/Primary', '141414@90': 'System/iOS Navbar One', '141414@70': 'System/iOS Navbar darkBlur', '1f1f1f@95': 'Buttons/Extra Three' };
const BG = Object.assign({}, FG, { '000000': 'Surface/One' });
const ORG = new Set("298d220f,48dc1588,0677f3d9,e343e77d,38278503,302d3a70,394b086b,c517f2a9,987d964f,2443175a,45c45811,63a4490f,4f1f51a2,f4bd3385,db6b5d42,1c3f209b,66a794f7,e6ebbb63,7ffcbd3e,6d29525a,615800ff,486f42d1,211a2d21,fc1ef01f,959707c5,dfaf8c31,c7507960,bad2697c,cc58a0a6,a385bbb5".split(','));

// --- тело. Одна страница за вызов; тяжёлые идут 60–110 с. Собирать через build.py (подставит ключи Library).
figma.skipInvisibleInstanceChildren = false;
const LC = /*@LC*/;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const hx = c => [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
const keyOf = p => { const a = Math.round((p.opacity ?? 1) * 100); return hx(p.color) + (a < 100 ? '@' + a : ''); };
const FGT = new Set(['TEXT', 'VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'STAR', 'POLYGON']);
const idxOf = x => x.parent.children.findIndex(c => c.id === x.id);
const pathFrom = (h, n) => { const p = []; let x = n; while (x && x.id !== h.id) { p.unshift(idxOf(x)); x = x.parent; } return p; };
const follow = (root, p) => { let x = root; for (const i of p) { if (!x || !x.children || !x.children[i]) return null; x = x.children[i]; } return x; };
const VAR = {}; for (const [n, k] of Object.entries(KEYS)) VAR[n] = await figma.variables.importVariableByKeyAsync(k);
const isScreen = n => n.type === 'FRAME' && n.width >= 320 && n.width <= 1440 && n.height >= 400;
const st = { own: 0, foreign: 0, libOverride: 0, libTail: 0, err: 0, unmatched: {}, tails: {} };
for (const pg of figma.root.children.filter(p => PAGES.test(p.name))) { await pg.loadAsync();
  const roots = ONLY ? (await Promise.all(ONLY.map(id => figma.getNodeByIdAsync(id)))).filter(n => n && !SKIP_ROOT.has(n.id)) : pg.findAll(n => { if (n.type === 'COMPONENT' && !(n.parent && n.parent.type === 'COMPONENT_SET')) return true; if (n.type === 'COMPONENT_SET') return true; if (!isScreen(n) || !n.parent || !(/hStack|vStack/.test(n.parent.name) || /^(PAGE|SECTION)$/.test(n.parent.type))) return false; let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE' || a.type === 'COMPONENT') return false; a = a.parent; } return true; }).filter(n => { let a = n; while (a && a.type !== 'PAGE') { if (SKIP_ROOT.has(a.id)) return false; a = a.parent; } return true; });
  for (const R of roots) for (const n of [R, ...R.findAll(() => true)]) {
    if (n.type === 'SECTION' || (/^(SECTION|PAGE)$/.test(n.parent.type) && !/^(FRAME|COMPONENT|COMPONENT_SET|INSTANCE|GROUP)$/.test(n.type))) continue; // фон секции и подписи на холсте — не макет
    let top = null; let b = n.type === 'INSTANCE' ? n : n.parent; while (b && b.id !== R.parent.id) { if (b.type === 'INSTANCE') top = b; b = b.parent; }
    let M = null, kind = 'own'; if (top) { try { M = top.mainComponent; } catch (e) {} if (!M) continue; const sk = (setOf(M).key || '').slice(0, 8); if (ORG.has(sk)) continue; kind = !M.remote ? 'local' : (LC.has(sk) ? 'lib' : 'foreign'); }
    if (kind === 'local') continue; // локальные мастера — корни этого же прохода
    for (const field of ['fills', 'strokes']) { const arr = n[field]; if (!Array.isArray(arr) || !arr.length) continue; let changed = false;
      const next = arr.map((p, i) => { if (p.type !== 'SOLID' || (p.boundVariables && p.boundVariables.color) || p.visible === false || (p.opacity ?? 1) < 0.01) return p; const k = keyOf(p); const vn = ((field === 'strokes' || FGT.has(n.type)) ? FG : BG)[k]; if (!vn) { st.unmatched[k] = (st.unmatched[k] || 0) + 1; return p; }
        if (kind === 'lib') { const mn = follow(M, pathFrom(top, n)); const mp = mn && Array.isArray(mn[field]) ? mn[field][i] : null; if (mp && mp.type === 'SOLID' && !(mp.boundVariables && mp.boundVariables.color) && keyOf(mp) === k) { st.libTail++; const tk = esc(setOf(M).name).slice(0, 24); st.tails[tk] = (st.tails[tk] || 0) + 1; return p; } st.libOverride++; } else st[kind]++;
        if (DRY) return p; changed = true; return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: p.color, opacity: 1, visible: true, blendMode: p.blendMode || 'NORMAL' }, 'color', VAR[vn]); });
      if (changed) { try { n[field] = next; } catch (e) { st.err++; } } } } }
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => k + ' x' + v);
return { own: st.own, foreign: st.foreign, libOverride: st.libOverride, libTail: st.libTail, err: st.err, unmatched: top(st.unmatched, 12), tails: top(st.tails, 12) };
