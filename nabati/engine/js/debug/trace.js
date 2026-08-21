/**
 * Debug Mode (البند 24).
 *
 * يُفعَّل بمتغيّر البيئة DEBUG_PROSODY=true في Node، أو بالراية
 * `debug: true` في الاستدعاء، أو بالمفتاح `?debug=1` في صفحة المتصفح.
 *
 * يعرض كل مرحلة على حدة: الأصل ← المطبَّع ← العروضي ← الوحدات ←
 * المقاطع ← النمط الرقمي ← المرشّحون ← المطابقة ← الدرجة.
 */

export function isDebugEnabled(explicit) {
  if (explicit !== undefined) return !!explicit;
  if (typeof process !== 'undefined' && process.env) {
    const v = process.env.DEBUG_PROSODY;
    if (v && v !== '0' && v.toLowerCase() !== 'false') return true;
  }
  if (typeof location !== 'undefined' && location.search) {
    return /[?&]debug=1\b/.test(location.search);
  }
  return false;
}

/** تقرير نصّي متسلسل لمراحل التحليل. */
export function traceReport(result) {
  const L = [];
  const line = (label, value) => L.push(`${label.padEnd(22)} ${value}`);

  line('Original', result.input);
  line('Normalized', result.normalized);
  if (result.removed?.length) {
    for (const r of result.removed) {
      line('  removed', `${r.what} ×${r.count} — ${r.why}`);
    }
  }
  line('Prosodic', result.prosodic);
  line('Vocalization', `coverage=${result.vocalization.coverage} assumed=${result.vocalization.assumed}`);

  const int = result.internalPattern || '';
  line('Syllables', result.syllables.map((s) => `${s.weight}(${s.shape})`).join(' '));
  line('Internal pattern', int);
  for (const [id, enc] of Object.entries(result.numericPatterns || {})) {
    line(`  ${id}`, enc.value === null ? `— (${enc.status})` : `${enc.value} [${enc.status}]`);
  }

  if (result.bestMeter) {
    line('Best meter', `${result.bestMeter.name} score=${result.bestMeter.score} conf=${result.bestMeter.confidence} verdict=${result.verdict}`);
    line('Expected pattern', result.tafaeel.map((f) => f.expected).join(' '));
    line('Actual pattern', result.tafaeel.map((f) => f.actual).join(' '));
    for (const f of result.tafaeel) {
      line(`  foot ${f.footIndex + 1}`, `${f.tafila} → ${f.realized} (${f.variation}) ${f.sound === false ? '✗' : '✓'} «${f.words?.join(' ') ?? ''}»`);
    }
  } else {
    line('Best meter', '—');
  }

  for (const b of result.brokenFeet || []) {
    line(`  broken ${b.footIndex + 1}`, `${b.tafila} expected=${b.expected} actual=${b.actual} cost=${b.cost}`);
    for (const i of b.issues || []) line('    issue', i.text);
  }

  for (const a of result.alternatives || []) {
    line('Alternative', `${a.name} ${Math.round(a.score * 100)}%`);
  }

  return L.join('\n');
}

/** المخطّط كله كنصّ — للتشخيص حين يفشل التقطيع. */
export function dumpDag(dag, units) {
  const L = [`DAG: ${dag.size} units, assumed=${dag.assumedVocalization}`];
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const v = u.vowel.known
      ? `${u.vowel.length}${u.vowel.quality ? ':' + u.vowel.quality : ''}`
      : `?[${u.vowel.options.join('|')}]`;
    L.push(`  #${i} ${u.c} ${v} word=${u.word}${u.source ? ' <' + u.source + '>' : ''}`);
    for (const e of dag.edges[i] || []) {
      L.push(`      → ${e.to} ${e.weight} ${e.meta.shape}${e.meta.rule ? ' [' + e.meta.rule + ']' : ''}`);
    }
  }
  return L.join('\n');
}
