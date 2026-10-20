// Отвязанный ряд чипсов (фрейм «filters» из отдельных инстансов `chips`) → компонент `chips-row` ДС Платформа
// (сет 552e8650d0, 5 слотов, вариант RTL). Переносит тексты, активный чипс (любой «on …» → ACTIVE_ON бренда:
// 'on Yango Play' / 'on YaPS'), Cross / Icon, видимость чипсов (лишние слоты скрыты), прототип-ссылки (невалидные — в
// droppedLinks), ширину (FILL в автолейауте), место в родителе. RTL = True, если у чипсов RTL=on или подписи арабские.
// Тип чипсов становится navigation (как в chips-row), высота ряда 56 вместо 48 — по дизайну ДС.
// Не трогает: ряды внутри инстансов (хвост ДС — в отчёт), ряды с другими слоями (маска, кнопка — вопрос владельцу),
// > 5 видимых чипсов. Локальный мастер — отдельно, с переносом переопределений видимости в инстансах.
// Проверка в том же вызове: видимые тексты + активный до/после, расхождение — откат. Старый фрейм удаляется.
// PAGE — одна страница на вызов. Проверено 2026-10-20 на Music (49 рядов).
const PAGE = null; if (!PAGE) throw new Error('PAGE: подстрока имени страницы'); const MODE = 'fix'; const ACTIVE_ON = 'on Yango Play';
const pg = figma.root.children.find(p => PAGE.test(p.name)); await figma.setCurrentPageAsync(pg);
figma.skipInvisibleInstanceChildren = false;
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const ROW = await figma.importComponentSetByKeyAsync('552e8650d0026a2e71e4e59a022bc4f020df7595');
const R = { page: esc(pg.name), done: [], skipped: [], droppedLinks: [], errors: [] };
const setOf = m => m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const isChip = async c => { if (c.type !== 'INSTANCE') return false; let m = null; try { m = await c.getMainComponentAsync(); } catch (e) {} const s = setOf(m); return !!s && s.key === '3ee666c709ef3cbd1f7d527bc952e226205d8a4b'; };
const IDS = [];
for (const f of pg.findAll(x => (x.type === 'FRAME' || x.type === 'GROUP') && x.children && x.children.length >= 2)) { let ok = true; for (const c of f.children) if (!(await isChip(c))) { ok = false; break; } if (!ok) continue;
  let lm = false; let a = f.parent; while (a && a.type !== 'PAGE') { if (a.type === 'COMPONENT' || a.type === 'COMPONENT_SET') { lm = true; break; } a = a.parent; }
  if (f.id.includes(';') || lm) { R.skipped.push(f.id + (lm ? ' local master' : ' inside instance')); continue; } IDS.push(f.id); }
for (const id of IDS) { const f = await figma.getNodeByIdAsync(id); if (!f) { R.skipped.push(id + ' missing'); continue; } let inst = null;
  try {
    if (f.id.includes(';')) { R.skipped.push(id + ' inside instance'); continue; }
    const kids = f.children.filter(c => c.type === 'INSTANCE');
    const src = (kids.length > 5 ? kids.filter(c => c.visible) : kids).map(c => { const p = c.componentProperties; const t = c.findOne(x => x.type === 'TEXT' && x.name === 'label') || c.findOne(x => x.type === 'TEXT');
      return { text: t ? t.characters : '', visible: c.visible, active: p.Active.value, cross: p.Cross.value, icon: p.Icon.value, rtl: p.RTL.value, reactions: c.reactions || [] }; });
    if (src.length > 5) { R.skipped.push(id + ' >5 chips'); continue; }
    const rtl = src.some(s => s.rtl === 'on' || /[\u0600-\u06ff]/.test(s.text));
    const variant = ROW.children.find(v => v.name === 'RTL=' + (rtl ? 'True' : 'False'));
    const par = f.parent; const idx = par.children.indexOf(f);
    inst = variant.createInstance(); par.insertChild(idx, inst);
    if (par.layoutMode && par.layoutMode !== 'NONE' && f.layoutPositioning !== 'ABSOLUTE') {
      if (f.layoutSizingHorizontal === 'FILL' || f.width >= par.width - (par.paddingLeft || 0) - (par.paddingRight || 0) - 1) inst.layoutSizingHorizontal = 'FILL'; else { inst.resize(f.width, inst.height); }
    } else { inst.x = f.x; inst.y = f.y; inst.resize(f.width, inst.height); }
    inst.visible = f.visible;
    const chips = inst.children;
    for (let i = 0; i < chips.length; i++) { const ch = chips[i]; const s = src[i];
      if (!s) { ch.visible = false; continue; }
      ch.visible = s.visible;
      ch.setProperties({ Active: s.active === 'off' ? 'off' : ACTIVE_ON, Cross: s.cross, Icon: s.icon });
      const t = ch.findOne(x => x.type === 'TEXT');
      if (t && t.characters !== s.text) { for (const fn of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(fn); t.characters = s.text; }
      if (s.reactions.length) { try { await ch.setReactionsAsync(s.reactions); } catch (e) { R.droppedLinks.push(id + ' chip ' + (i + 1)); } } }
    const after = inst.children.filter(c => c.visible).map(c => { const t = c.findOne(x => x.type === 'TEXT'); return (t ? t.characters : '') + (c.componentProperties.Active.value !== 'off' ? '*' : ''); }).join(',');
    const before = src.filter(s => s.visible).map(s => s.text + (s.active !== 'off' ? '*' : '')).join(',');
    if (after !== before) { inst.remove(); R.errors.push(id + ' mismatch ' + esc(before) + ' / ' + esc(after)); continue; }
    f.remove();
    R.done.push(id + ' -> ' + inst.id + (src.some(s => s.reactions.length) ? ' +proto' : ''));
  } catch (e) { if (inst && f.parent) { try { inst.remove(); } catch (x) {} } R.errors.push(id + ' ' + String(e.message || e).slice(0, 80)); } }
R.count = R.done.length;
return R;
