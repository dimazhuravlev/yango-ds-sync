// Начертания текстов Yango Text / YS Text: Regular и Bold не используются нигде (ДС Платформа · Base / Typography) →
// Medium и Semibold. Закрывает то, что не берёт 06:
//  1) текст привязан к переменной начертания `Product` «Font Weight/Regular» → «Font Weight/Medium»,
//     «Font Weight/Bold» → «Font Weight/Semibold» (только семейство Text; у Headline Bold — норма);
//  2) текст без стиля и без переменной начертания на Regular / Light / Book → привязать семейство «Font Family/Text» и
//     «Font Weight/Medium»; на Bold → «Font Family/Text» + «Font Weight/Semibold» (Semibold в ДС = файл Bold, вид тот же).
//  Кегль и межстрочный не трогает. Тексты на стилях — 06 (чужой стиль Regular / Bold → стиль ДС; если кегль сдвинется —
//  предложением). Вес Regular → Medium меняет вид (текст плотнее) — это правило ДС, но в отчёте показать примеры.
// Свои слои и переопределения; внутри мастеров чужих ДС — переопределением (как 06 для Regular). Системные (SF Pro),
// оформление Органайзера — не трогает. PAGES — одна страница на вызов; MODE 'report' → 'fix'. Проверено 2026-10-20.
const PAGES = null; if (!PAGES) throw new Error('PAGES: подстрока имени страницы');
const MODE = 'report';
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const setOf = m => m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const K = { text: 'bdab254041e3baa23897abefbdd3e777e1b932de', regular: '900119480a5bf7e4fb1b5b377c4de3f8f07cb5cd', medium: '75b9b0bf914b99b514f2103c27eb0bf99fae9080', semibold: '412bb2913b76d8857499c9053da36b37c1ddcef2', bold: '38435ae6460b44dc8d9e11b0ac2a3f7281600480' };
const V = {}; for (const [k, key] of Object.entries(K)) V[k] = await figma.variables.importVariableByKeyAsync(key);
const SKIP_COMP = /^(paragraph|header|design-system|status-bar|home-indicator|keyboard|alerts|action-sheet)/;
const pg = figma.root.children.find(p => PAGES.test(p.name)); if (MODE === 'fix') await figma.setCurrentPageAsync(pg); else await pg.loadAsync();
if (MODE === 'fix') for (const f of await figma.listAvailableFontsAsync()) if (/^(Yango Text|YS Text|YS Text Display)$/.test(f.fontName.family)) { try { await figma.loadFontAsync(f.fontName); } catch (e) {} }
const R = { varRegular: 0, varBold: 0, rawRegular: 0, rawBold: 0, skipped: {}, ex: [], failed: [] }; const sk = k => R.skipped[k] = (R.skipped[k] || 0) + 1;
const mc = new Map(); const mainOf = async i => { if (mc.has(i.id)) return mc.get(i.id); let m = null; try { m = await i.getMainComponentAsync(); } catch (e) {} mc.set(i.id, m); return m; };
for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) {
  if (typeof t.textStyleId === 'string' && t.textStyleId) continue; // на стилях — 06
  if (t.fontName === figma.mixed) { sk('mixed'); continue; }
  const fam = t.fontName.family, sty = t.fontName.style; if (!/^(Yango Text|YS Text)$/.test(fam)) continue;
  let a = t.parent, skip = null; while (a && a.type !== 'PAGE') { if (a.type === 'INSTANCE') { const M = await mainOf(a); const S = setOf(M); if (S && SKIP_COMP.test(S.name)) { skip = S.name; break; } } a = a.parent; }
  if (skip) { sk('component ' + esc(skip).slice(0, 20)); continue; }
  const bv = t.boundVariables || {}; const ws = bv.fontStyle ? (Array.isArray(bv.fontStyle) ? bv.fontStyle : [bv.fontStyle]) : [];
  let kind = null;
  if (ws.length) { const v = await figma.variables.getVariableByIdAsync(ws[0].id); if (v && v.name === 'Font Weight/Regular') kind = 'varRegular'; else if (v && v.name === 'Font Weight/Bold') kind = 'varBold'; }
  else if (/^(Regular|Light|Book|Thin)$/i.test(sty)) kind = 'rawRegular'; else if (/^Bold$/i.test(sty)) kind = 'rawBold';
  if (!kind) continue; R[kind]++; if (R.ex.length < 8) R.ex.push(t.id + ' ' + kind + ' ' + fam + ' ' + sty + ' ' + t.fontSize + ' «' + esc(t.characters).slice(0, 16) + '»');
  if (MODE !== 'fix') continue;
  try { const target = /Regular/.test(kind) ? V.medium : V.semibold;
    if (!bv.fontFamily) t.setBoundVariable('fontFamily', V.text);
    t.setBoundVariable('fontStyle', target);
  } catch (e) { if (R.failed.length < 6) R.failed.push(t.id + ' ' + String(e.message || e).slice(0, 60)); } }
return R;
