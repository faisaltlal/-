/**
 * سجلّ الأوزان.
 *
 * كل ما يعرفه المحرك عن البحور يأتي من data/*.json عبر هذا الملف.
 * لا يوجد في الكود اسم بحر واحد ولا نمط واحد مكتوب يدويًا — وهذا هو
 * ما يجعل إضافة بحر جديد تعديلًا في البيانات لا في الكود (البند 30).
 */

export function buildRegistry({ tafaeel, variations, meters }) {
  const tafilaById = new Map(tafaeel.tafaeel.map((t) => [t.id, t]));
  const problems = [];

  /** الصور المسموحة لتفعيلة، مع صورتها السالمة أولًا. */
  function variantsOf(tafilaId) {
    const list = variations.variations[tafilaId];
    if (!list) {
      problems.push({ kind: 'missing_variations', tafilaId });
      const t = tafilaById.get(tafilaId);
      return t ? [{ id: 'salim', name: 'سالم', syllables: t.syllables, kind: 'salim', scope: 'any', severity: 1 }] : [];
    }
    return list;
  }

  const built = [];
  for (const m of meters.meters) {
    const entry = {
      id: m.id,
      name: m.name,
      aliases: m.aliases || [],
      enabled: m.enabled !== false,
      status: m.status,
      sourceQuote: m.sourceQuote,
      sourceIndex: m.sourceIndex,
      note: m.note,
      validation: m.validation,
      derivation: m.derivation,
      feet: [],
      pattern: [],
      tafaeelNames: [],
    };

    if (Array.isArray(m.feet)) {
      for (let i = 0; i < m.feet.length; i++) {
        const t = tafilaById.get(m.feet[i]);
        if (!t) {
          problems.push({ kind: 'unknown_tafila', meter: m.id, tafilaId: m.feet[i] });
          continue;
        }
        entry.feet.push({
          index: i,
          tafilaId: t.id,
          plain: t.plain,
          vocalized: t.vocalized,
          salim: t.syllables,
          variants: variantsOf(t.id),
          isLast: i === m.feet.length - 1,
          isFirst: i === 0,
        });
        entry.pattern.push(...t.syllables);
        entry.tafaeelNames.push(t.plain);
      }

      // تحقّق: النمط المشتق يجب أن يوافق العدد المعلن في البيانات.
      if (m.expectedSyllableCount != null && entry.pattern.length !== m.expectedSyllableCount) {
        problems.push({
          kind: 'syllable_count_mismatch',
          meter: m.id,
          declared: m.expectedSyllableCount,
          derived: entry.pattern.length,
        });
      }
    }

    built.push(entry);
  }

  // تحقّق: النمط المقطعي لكل تفعيلة يجب أن يوافق نمطها الحرفي الخليلي.
  for (const t of tafaeel.tafaeel) {
    const derived = lettersFromSyllables(t.syllables);
    if (t.khalilLetters && derived !== t.khalilLetters) {
      problems.push({
        kind: 'tafila_pattern_mismatch',
        tafilaId: t.id,
        fromSyllables: derived,
        declared: t.khalilLetters,
      });
    }
  }

  const byId = new Map(built.map((m) => [m.id, m]));

  return {
    meters: built,
    enabled: built.filter((m) => m.enabled && m.pattern.length > 0),
    byId,
    tafilaById,
    problems,
    notInSource: meters.notInSource || [],

    find(nameOrId) {
      if (byId.has(nameOrId)) return byId.get(nameOrId);
      const needle = String(nameOrId).trim();
      return built.find(
        (m) => m.name === needle || m.aliases.includes(needle)
      ) || null;
    },
  };
}

/**
 * من المقاطع إلى الحروف الخليلية (1 متحرك / 0 ساكن).
 * قصير = متحرك واحد. طويل = متحرك فساكن. مفرط = متحرك فساكنان.
 */
export function lettersFromSyllables(syllables) {
  return syllables
    .map((s) => (s === 'S' ? '1' : s === 'X' ? '100' : '10'))
    .join('');
}
