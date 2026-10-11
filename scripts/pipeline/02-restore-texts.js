// 02 — ЗАПАСНОЙ путь (основной — 01b MODE=restore): вернуть подписи, слетевшие при принятии обновлений библиотек. Пишет только тексты (и при надобности
// показывает скрытого предка, если он скрыт булевым свойством). Ничего другого не трогает.
// Откуда брать WANT: 01-compare-with-copy (STEP 2/3) даёт в копии «текст #I<экз>;<старый путь>», в рабочем —
// заглушку «Title #I<экз>;<новый путь>». После обновления id внутри инстанса меняются: старый суффикс → новый
// (пример: `;236:91907;236:91943` → `;7529:8010;7529:8057`). Карту суффиксов собрать по 1–2 парам и проверить.
// WANT: [[id узла в рабочем файле, нужный текст], …]. Перенос строки U+2028 — только String.fromCharCode(0x2028).
const WANT = [
  // ['I2:33002;205:27506;7529:8010;7529:8057', 'The Assassins'],
];
const esc = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const out = [];
for (const [id, want] of WANT) {
  const t = await figma.getNodeByIdAsync(id); if (!t || t.type !== 'TEXT') { out.push(id + ' NOT FOUND'); continue; }
  const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters;
  let how = 'chars';
  if (ref) { let a = t.parent; while (a && !(a.type === 'INSTANCE' && ref in a.componentProperties)) a = a.parent; if (a) { a.setProperties({ [ref]: want }); how = 'prop'; } }
  if (how === 'chars') { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); t.characters = want; }
  // скрытый предок, управляемый булевым свойством инстанса-владельца, — включить
  let a = t.parent; while (a && a.type !== 'PAGE') { if (a.visible === false && a.componentPropertyReferences && a.componentPropertyReferences.visible) { const r = a.componentPropertyReferences.visible; let o = a.parent; while (o && !(o.type === 'INSTANCE' && r in o.componentProperties)) o = o.parent; if (o) o.setProperties({ [r]: true }); } a = a.parent; }
  const now = (await figma.getNodeByIdAsync(id)).characters;
  out.push((now === want ? 'ok ' : 'MISMATCH ') + how + ' ' + id + ' "' + esc(now).slice(0, 40) + '"');
}
return out;
