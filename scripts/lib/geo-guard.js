// ── geo-guard: защита родителей при замене и снятии обёрток. build.py вставляет вместо /*@GUARD*/ ─────────────────
// Беда, от которой защищает: auto-layout фрейм «по содержимому», у которого все дети ABSOLUTE, держит свой размер.
// insertChild кладёт новый узел потоковым ребёнком — фрейм сжимается под него; потом узлу ставят ABSOLUTE, а размер
// фрейма остаётся сжатым, и всё внутри обрезается. Тексты при этом «видимы» — сверка по текстам этого не ловит.
// Использование: const GG = geoGuard(X) — до insertChild; после переноса геометрии: const mv = GG.moved(N); mv.length →
// замена не принята (N.remove(); GG.repair()). parentsOnly = true — сверять только предков (свои соседи двигаются по
// замыслу, как в bottom bar). Рамка нового узла другого размера (размер по ДС) — перекладка соседей ожидаема, не ошибка.
const __gbox = n => { const b = n.absoluteBoundingBox; return b ? [b.x, b.y, b.width, b.height] : null; };
const __gsame = (a, b, t) => !!a && !!b && a.every((v, i) => Math.abs(v - b[i]) <= t);
const __gnoFlow = f => 'layoutMode' in f && f.layoutMode && f.layoutMode !== 'NONE' && f.children.length > 0 && f.children.every(c => c.layoutPositioning === 'ABSOLUTE' || !c.visible);
function geoGuard(X) {
  const anc = [];
  for (let a = X.parent; a && a.type !== 'PAGE' && a.type !== 'SECTION'; a = a.parent) anc.push({ n: a, b: __gbox(a), w: a.width, h: a.height,
    pm: 'primaryAxisSizingMode' in a ? a.primaryAxisSizingMode : null, cm: 'counterAxisSizingMode' in a ? a.counterAxisSizingMode : null,
    kids: 'children' in a ? new Map(a.children.map(c => [c.id, [c.x, c.y]])) : new Map() });
  const sib = X.parent.children.filter(c => c.id !== X.id).map(c => ({ n: c, b: __gbox(c) }));
  const own = __gbox(X);
  const G = {
    // вернуть размер сжавшимся (или раздувшимся) hug-фреймам без потоковых детей; дети остаются на прежних местах
    repair() { const fixed = [];
      for (const r of anc) { const f = r.n; if (f.removed || f.type === 'GROUP' || !__gnoFlow(f) || (Math.abs(f.width - r.w) < 0.5 && Math.abs(f.height - r.h) < 0.5)) continue;
        const cur = f.children.map(c => [c, c.x, c.y]); f.resize(r.w, r.h);
        try { if (r.pm) f.primaryAxisSizingMode = r.pm; if (r.cm) f.counterAxisSizingMode = r.cm; } catch (e) {}
        if (Math.abs(f.width - r.w) > 0.5 || Math.abs(f.height - r.h) > 0.5) f.resize(r.w, r.h);
        for (const [c, x, y] of cur) { const p = r.kids.get(c.id); c.x = p ? p[0] : x; c.y = p ? p[1] : y; } fixed.push(f.id); }
      return fixed; },
    // что сдвинулось, хотя не должно; старый узел на время замера скрывается (как будто уже удалён)
    moved(N, parentsOnly) { G.repair(); const out = []; let hid = false;
      try { if (X && !X.removed && X.visible) { X.visible = false; hid = true; } } catch (e) {}
      try { const nb = N && !N.removed ? __gbox(N) : null;
        const sameSize = !!nb && !!own && Math.abs(nb[2] - own[2]) <= 1 && Math.abs(nb[3] - own[3]) <= 1;
        if (sameSize && (Math.abs(nb[0] - own[0]) > 1 || Math.abs(nb[1] - own[1]) > 1)) out.push('self ' + N.id);
        if (sameSize || parentsOnly) {
          for (const r of anc) if (!r.n.removed && r.b && !__gsame(__gbox(r.n), r.b, 0.6)) out.push('parent ' + r.n.id);
          if (!parentsOnly) for (const r of sib) if (!r.n.removed && r.b && !__gsame(__gbox(r.n), r.b, 0.6)) out.push('sibling ' + r.n.id); }
      } finally { if (hid) { try { X.visible = true; } catch (e) {} } }
      return out; } };
  return G; }
// ── /geo-guard ─────────────────────────────────────────────────────────────────────────────────────────────────────
