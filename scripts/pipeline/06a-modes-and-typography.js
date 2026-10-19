// 06a — режимы бренда и типографика на актуальных коллекциях. ОБЯЗАТЕЛЬНЫЙ этап в каждом проекте, перед 06.
// Почему: в файлах живут старые версии коллекции Product («Yango Play | YaPS | Allplay») и удалённые коллекции
// Typography / Typography Theme / Typography Headline / .Typography / Constants. Пока на старую версию хоть что-то
// ссылается (старая копия стиля Library, инстанс старой версии мастера, явный режим Allplay), в переключателе режимов
// видны её опции с (!), а тексты на старых стилях и старых переменных не меняются при смене режима Product.
// Id режимов сохранены между версиями: Yango Play 2078:1 = Yango Play EN, YaPS 2078:0 = YaPS & Allplay — такие узлы уже
// на актуальном режиме (sameIdOldVersion, не чинить). Режим Allplay 2078:2 удалён → YaPS & Allplay. Старая версия уходит
// из файла, когда на неё не ссылается ничего: свои слои — этот скрипт, инстансы и копии стилей — принятие обновлений.
// Актуально (🌈 Стили): Product = «YaPS & Allplay» | «Yango Play EN» | «Yango Play AR» + Typography constants;
// 16 стилей 🫟 Library (keys/library-text-styles.txt), все бренды — одни стили, бренд задаёт режим Product.
// MODE 'report' — только чтение. Режимы: старые версии Product и удалённые Typography* на странице, своих слоях и внутри
//   инстансов. Тексты: на актуальном стиле (16 ключей) / на актуальном стиле, но его копия в файле ещё на старых
//   коллекциях (не приняты обновления Library) / на стиле не из 16 / без стиля с прямой привязкой к старым коллекциям.
// MODE 'fix' — страницы и свои слои: старый режим Product → актуальный (Yango Play → Yango Play EN, YaPS и Allplay →
//   YaPS & Allplay; если актуальный режим уже задан — оставить его), режимы удалённых коллекций снять. Внутри
//   инстансов не трогает: это мастер — для Library в отчёт (libTails), правится в Library и приходит обновлением.
//   Свои тексты на старой копии актуального стиля — на свежую (importStyleByKeyAsync). Тексты не из 16 и без стиля
//   переводит 06 (следующий шаг); старые копии внутри инстансов уходят с принятием обновлений.
// Страница без режима Product показывает режим по умолчанию (YaPS & Allplay, шрифт ЯПС) — в файле Yango Play это брак.
// report: pagesNoMode; fix с BRAND: ставит BRAND на такие страницы. Фреймы с другим режимом (RTL-примеры на Yango Play AR,
// ЯПС-экраны в общем файле) не трогает — только перечисляет (otherBrandFrames).
// Запуск: сначала 'report' — можно всем файлом (PAGES=/./); 'fix' — одна страница на вызов (PAGES — подстрока имени),
// страницы параллельно.
const PAGES = null; if (!PAGES) throw new Error('PAGES: задать подстроку имени страницы, например "PAGES=/Настройки/"');
const MODE = 'report';
const BRAND = null; // режим Product бренда файла: 'Yango Play EN' | 'Yango Play AR' | 'YaPS & Allplay' (ЯПС и Allplay)
const STYLE_KEY = '387a510812fba6c11f69c0ddb44124de09d69fa7'; // Library Text M・15/Medium — через него находится актуальный Product
const MAPMODE = { 'Yango Play': 'Yango Play EN', 'YaPS': 'YaPS & Allplay', 'Allplay': 'YaPS & Allplay', 'Yango Play EN': 'Yango Play EN', 'Yango Play AR': 'Yango Play AR', 'YaPS & Allplay': 'YaPS & Allplay' };
const LKEYS = /*@LKEYS*/;
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const CUR = new Set(LKEYS.map(x => x.k.slice(0, 8)));
const st = await figma.importStyleByKeyAsync(STYLE_KEY);
const famRef0 = st.boundVariables && st.boundVariables.fontFamily; const famRef = Array.isArray(famRef0) ? famRef0[0] : famRef0; if (!famRef) throw new Error('стиль Library без привязки fontFamily — проверить Library');
const curProd = await figma.variables.getVariableCollectionByIdAsync((await figma.variables.getVariableByIdAsync(famRef.id)).variableCollectionId);
const cc = new Map(); const col = async id => { if (cc.has(id)) return cc.get(id); let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(id); } catch (e) {} cc.set(id, c); return c; };
const vcache = new Map(); const varCol = async id => { if (vcache.has(id)) return vcache.get(id); let c = null; try { const v = await figma.variables.getVariableByIdAsync(id); c = v ? await col(v.variableCollectionId) : null; } catch (e) {} vcache.set(id, c); return c; };
const kindOf = c => { if (!c) return 'removed'; if (c.id === curProd.id) return 'cur'; if (c.name === 'Product' || c.key === curProd.key) return 'oldProduct'; if (/^\.?Typography( Theme| Headline)?$|^Constants$/.test(c.name)) return 'removed'; return 'other'; };
const TF = ['fontFamily', 'fontStyle', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'paragraphSpacing'];
const oldRefs = async bv => { for (const f of TF) { const refs = (bv || {})[f]; for (const ref of (Array.isArray(refs) ? refs : refs ? [refs] : [])) { if (!ref || !ref.id) continue; const k = kindOf(await varCol(ref.id)); if (k === 'oldProduct' || k === 'removed') return true; } } return false; };
const stale = new Map(); const sc = new Map(); const styleOf = async id => { if (!id || typeof id !== 'string') return null; if (sc.has(id)) return sc.get(id); let s = null; try { s = await figma.getStyleByIdAsync(id); } catch (e) {} sc.set(id, s); return s; };
const inInst = n => n.id.includes(';');
const libLink = async n => { let a = n.parent; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE' && !a.id.includes(';')) break; a = a.parent; } if (!a || a.type !== 'INSTANCE') return '-'; let M = null; try { M = await a.getMainComponentAsync(); } catch (e) {} return M ? esc(setOf(M).name).slice(0, 30) : '-'; };
const out = {};
for (const pg of figma.root.children) { if (!PAGES.test(pg.name)) continue; if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync(); if (!pg.children.length) continue; // пустые страницы-разделители
  const R = { pageMode: null, otherBrandFrames: [], modes: { sameIdOldVersion: 0, oldOwn: 0, oldInInstance: 0, removedOwn: 0, removedInInstance: 0, fixed: 0, cleared: 0 }, texts: { cur: 0, curStale: 0, notCur: 0, noStyle: 0, noStyleOldVars: 0, restyled: 0 }, examples: [], textExamples: [], libTails: {}, errors: [] };
  out[esc(pg.name).slice(0, 30)] = R;
  // шрифты страницы — заранее (setExplicitVariableModeForCollection и смена стиля требуют загруженных шрифтов)
  if (MODE === 'fix') { const fs = new Set(); for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) { try { for (const f of t.getRangeAllFontNames(0, t.characters.length)) fs.add(JSON.stringify(f)); } catch (e) {} }
    for (const f of [['Yango Text','Medium'],['Yango Text','Bold'],['Yango Group Headline','ExtraBold'],['YS Text','Medium'],['YS Text','Bold'],['YS Display','Bold']]) fs.add(JSON.stringify({ family: f[0], style: f[1] }));
    for (const f of fs) { try { await figma.loadFontAsync(JSON.parse(f)); } catch (e) {} } }
  // режимы
  for (const n of [pg, ...pg.findAll(x => x.explicitVariableModes && Object.keys(x.explicitVariableModes).length)]) {
    for (const [cid, mid] of Object.entries(n.explicitVariableModes || {})) { const c = await col(cid); const k = kindOf(c); if (k !== 'oldProduct' && k !== 'removed') continue;
      // режим хранится по ключу коллекции + id режима; id сохраняются между версиями (Yango Play 2078:1 = Yango Play EN,
      // YaPS 2078:0 = YaPS & Allplay) — такой узел уже на актуальном режиме, getter просто отдаёт id старой версии
      if (k === 'oldProduct' && curProd.modes.some(m => m.modeId === mid)) { R.modes.sameIdOldVersion++; continue; }
      const own = !inInst(n); R.modes[(k === 'oldProduct' ? 'old' : 'removed') + (own ? 'Own' : 'InInstance')]++;
      const mname = c ? (c.modes.find(m => m.modeId === mid) || {}).name : '?';
      const hasCur = !!(n.explicitVariableModes || {})[curProd.id];
      if (!own) { const L = await libLink(n); R.libTails[L] = (R.libTails[L] || 0) + 1; continue; }
      if (R.examples.length < 8) R.examples.push((n.type === 'PAGE' ? 'page' : n.id) + ' ' + esc(c ? c.name : '?') + '=' + esc(mname));
      if (MODE !== 'fix') continue;
      try {
        // сначала снять старое, потом ставить актуальное: у версий один ключ, и clear старой версии снимает и актуальную
        const target = k === 'oldProduct' && !hasCur ? curProd.modes.find(m => m.name === (MAPMODE[mname] || '')) : null;
        if (k === 'oldProduct' && !hasCur && !target) { R.errors.push(n.id + ' no map for ' + esc(mname)); continue; }
        const keep = hasCur ? n.explicitVariableModes[curProd.id] : null;
        n.clearExplicitVariableModeForCollection(c || cid); R.modes.cleared++;
        if (target) { n.setExplicitVariableModeForCollection(curProd, target.modeId); R.modes.fixed++; }
        else if (keep && !(n.explicitVariableModes || {})[curProd.id]) n.setExplicitVariableModeForCollection(curProd, keep);
      } catch (e) { R.errors.push(n.id + ' ' + String(e.message || e).slice(0, 60)); } } }
  // режим бренда на самой странице
  const mn = id => (curProd.modes.find(m => m.modeId === id) || {}).name;
  if (MODE === 'fix' && BRAND && !(pg.explicitVariableModes || {})[curProd.id]) { const m = curProd.modes.find(x => x.name === BRAND); if (!m) throw new Error('нет режима ' + BRAND); try { pg.setExplicitVariableModeForCollection(curProd, m.modeId); R.modes.fixed++; } catch (e) { R.errors.push('page mode ' + String(e.message || e).slice(0, 60)); } }
  R.pageMode = (pg.explicitVariableModes || {})[curProd.id] ? mn(pg.explicitVariableModes[curProd.id]) : null;
  if (BRAND) for (const f of pg.findAll(x => !x.id.includes(';') && x.explicitVariableModes && x.explicitVariableModes[curProd.id])) { const m = mn(f.explicitVariableModes[curProd.id]); if (m !== BRAND && R.otherBrandFrames.length < 8) R.otherBrandFrames.push(f.id + ' ' + esc(f.name).slice(0, 20) + '=' + m); }
  // тексты
  for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) {
    const s = await styleOf(typeof t.textStyleId === 'string' ? t.textStyleId : null);
    let kind;
    if (!s) kind = (await oldRefs(t.boundVariables)) ? 'noStyleOldVars' : 'noStyle';
    else if (!CUR.has((s.key || '').slice(0, 8))) kind = 'notCur';
    else { if (!stale.has(s.id)) stale.set(s.id, await oldRefs(s.boundVariables)); kind = stale.get(s.id) ? 'curStale' : 'cur'; }
    R.texts[kind]++;
    if (kind === 'cur' || kind === 'noStyle') continue;
    if (inInst(t)) { if (kind !== 'curStale') { const L = await libLink(t); R.libTails[L] = (R.libTails[L] || 0) + 1; } continue; }
    if (R.textExamples.length < 6) R.textExamples.push(t.id + ' ' + kind + ' ' + esc(s ? s.name : '').slice(0, 30));
    if (MODE === 'fix' && kind === 'curStale') { try { const fresh = await figma.importStyleByKeyAsync(s.key); await t.setTextStyleIdAsync(fresh.id); R.texts.restyled++; } catch (e) { R.errors.push(t.id + ' restyle ' + String(e.message || e).slice(0, 50)); } } }
  R.errors = R.errors.slice(0, 10); }
const staleStyles = []; for (const [id, v] of stale) if (v) staleStyles.push(esc(sc.get(id).name));
const pagesNoMode = Object.entries(out).filter(([, r]) => !r.pageMode).map(([n]) => n);
return { mode: MODE, pagesNoMode, staleStyles, currentProduct: curProd.modes.map(m => m.name).join(' | '), pages: out };
