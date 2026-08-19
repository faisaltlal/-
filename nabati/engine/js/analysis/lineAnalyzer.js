/**
 * تحليل بيت واحد: من النصّ الخام إلى نتيجة مستقلة عن أي واجهة.
 */

import { normalize, splitHemistichs } from '../text/normalizer.js';
import { phonemize } from '../phonology/phonemizer.js';
import { buildSyllableDag, freeSyllabify, edgeToSyllable } from '../prosody/syllableDag.js';
import { rankMeters } from '../matching/meterMatcher.js';

/** يبني الكتابة العروضية من الوحدات — النصّ كما يُنطق لا كما يُرسم. */
function prosodicSpelling(units) {
  const mark = { a: 'َ', i: 'ِ', u: 'ُ' };
  const mater = { a: 'ا', i: 'ي', u: 'و' };
  let out = '';
  let word = -1;
  for (const u of units) {
    if (u.word !== word) { if (word !== -1) out += ' '; word = u.word; }
    out += u.c;
    const v = u.vowel;
    if (!v.known) out += '؟';
    else if (v.length === 'none') out += 'ْ';
    else if (v.length === 'short') out += mark[v.quality] || '';
    else out += (mark[v.quality] || '') + (mater[v.quality] || '');
  }
  return out;
}

function analyzeUnit(text, engine, options) {
  const norm = normalize(text, options.normalize);
  const { units, trace } = phonemize(norm.words, engine.lexicon, {
    pausalEnd: options.pausalEnd !== false,
  });
  const dag = buildSyllableDag(units, options.dag);
  const free = freeSyllabify(dag);
  const ranking = rankMeters(dag, engine.registry, engine.scorer, {
    repeats: options.repeats || [1],
  });
  return { norm, units, phonTrace: trace, dag, free, ranking };
}

/** يستخرج المقاطع الفعلية التي اختارها البحر الفائز. */
function syllablesFromMatch(match) {
  if (!match || !match.feet) return [];
  return match.feet.flatMap((f) =>
    f.ops.filter((o) => o.edge).map((o) => edgeToSyllable(o.edge))
  );
}

/** يربط كل تفعيلة بالكلمات التي وقعت فيها (البند 11 من المواصفة). */
function linkFeetToWords(match, units, words, brokenThreshold) {
  if (!match || !match.feet) return [];
  return match.feet.map((f) => {
    const [a, b] = f.unitSpan;
    const span = units.slice(a, b);
    const wordIdx = [...new Set(span.map((u) => u.word))];
    return {
      footIndex: f.footIndex,
      hemistich: f.hemistich,
      tafila: f.tafila,
      realized: f.variant.result,
      variation: f.variant.name,
      variationKind: f.variant.kind,
      expected: f.expected.join(''),
      actual: f.actual.join('') || '—',
      sound: f.alignCost < brokenThreshold,
      words: wordIdx.map((i) => words[i]?.text).filter(Boolean),
      text: span.map((u) => u.c).join(''),
    };
  });
}

/**
 * @param {string} input
 * @param {object} engine  ناتج createEngine
 * @param {object} [options]
 */
export function analyzeLine(input, engine, options = {}) {
  const opts = { ...options };
  const split = splitHemistichs(input);
  const scorer = engine.scorer;

  let mode;
  let unitsAnalysis;
  let ranking;
  let hemistichRuns = null;

  if (split.explicit && split.parts.length >= 2) {
    // شطران مفصولان: يُقطَّع كلٌّ منهما وحده ثم تُجمع الدرجتان.
    mode = 'hemistichs';
    hemistichRuns = split.parts.map((p) =>
      analyzeUnit(p, engine, { ...opts, repeats: [1] })
    );
    const merged = new Map();
    for (const run of hemistichRuns) {
      for (const r of run.ranking) {
        const cur = merged.get(r.meterId) || { sum: 0, n: 0, sample: r };
        cur.sum += r.score;
        cur.n += 1;
        merged.set(r.meterId, cur);
      }
    }
    ranking = [...merged.entries()]
      .map(([meterId, v]) => ({
        ...v.sample,
        meterId,
        score: round(v.sum / hemistichRuns.length),
        confidence: round((v.sum / hemistichRuns.length) *
          (hemistichRuns.some((h) => h.dag.assumedVocalization)
            ? 1 - scorer.config.uncertainty.assumedVocalizationPenalty : 1)),
        perHemistich: hemistichRuns.map(
          (h) => h.ranking.find((x) => x.meterId === meterId)?.score ?? 0
        ),
      }))
      .sort((a, b) => b.score - a.score || a.meterId.localeCompare(b.meterId));
    unitsAnalysis = hemistichRuns[0];
  } else {
    // بلا فاصل: نجرّب أن يكون شطرًا واحدًا وأن يكون بيتًا كاملًا،
    // ونترك الوزن نفسه يحسم أيّهما، بدل تخمين موضع القسمة.
    mode = 'single';
    unitsAnalysis = analyzeUnit(input, engine, { ...opts, repeats: opts.repeats || [1, 2] });
    ranking = unitsAnalysis.ranking;
  }

  const best = ranking[0] || null;

  // بحور تعادل الأول ضمن فارق لا يُعتدّ به. الإفصاح عنها ضروري:
  // نصّ غير مشكول يقبل قراءات كثيرة، فقد يوافق أكثر من بحر بالدرجة
  // نفسها، وإخفاء ذلك خلف «الأول في الترتيب» ادّعاءُ يقين لا نملكه.
  const { tieDelta, ambiguityPenalty } = scorer.config.uncertainty;
  const tied = best
    ? ranking.filter((r) => r !== best && best.score - r.score <= tieDelta)
    : [];
  const ambiguous = tied.length > 0;
  if (ambiguous && best) {
    best.confidence = round(best.confidence * (1 - ambiguityPenalty));
  }

  const alternatives = ranking
    .slice(1, 1 + scorer.ranking.maxAlternatives)
    .filter((r) => r.score >= scorer.ranking.minScoreToList)
    .map((r) => ({
      meterId: r.meterId, name: r.name, score: r.score,
      confidence: r.confidence, verdict: r.verdict, repeat: r.repeat,
    }));

  const { norm, units, dag, free, phonTrace } = unitsAnalysis;
  const chosenSyllables = mode === 'single' && best
    ? syllablesFromMatch(best)
    : free.syllables;
  const displaySyllables = chosenSyllables.length ? chosenSyllables : free.syllables;

  const verdict = best ? best.verdict : 'unrecognized';

  return {
    input,
    mode,
    hemistichCount: split.explicit ? split.parts.length : (best?.repeat || 1),
    normalized: norm.text,
    removed: norm.removed,
    vocalization: {
      hasDiacritics: norm.hasDiacritics,
      coverage: norm.vocalizationCoverage,
      assumed: dag.assumedVocalization,
      note: dag.assumedVocalization
        ? 'النصّ غير مشكول بالكامل، فالتقطيع المعروض هو القراءة التي يقبلها الوزن الفائز، لا قراءة يقينية.'
        : 'النصّ مشكول بما يكفي لتقطيع قاطع.',
    },
    prosodic: prosodicSpelling(units),
    syllables: displaySyllables.map((s) => ({
      weight: s.weight, shape: s.shape, onset: s.onset,
      coda: s.coda, rule: s.rule, ishbaa: s.ishbaa, assumed: s.assumed,
    })),
    numericPattern: engine.encoder.encode(displaySyllables).value,
    numericPatterns: engine.encoder.encodeAll(displaySyllables),
    internalPattern: displaySyllables.map((s) => s.weight).join(''),
    bestMeter: best
      ? {
          id: best.meterId, name: best.name, aliases: best.aliases,
          score: best.score, confidence: best.confidence,
          verdict: best.verdict, repeat: best.repeat, status: best.status,
        }
      : null,
    verdict,
    tafaeel: mode === 'single' ? linkFeetToWords(best, units, norm.words, scorer.brokenFootThreshold) : (best?.feet || []).map((f) => ({
      footIndex: f.footIndex, hemistich: f.hemistich, tafila: f.tafila,
      realized: f.variant.result, variation: f.variant.name,
      expected: f.expected.join(''), actual: f.actual.join('') || '—',
    })),
    brokenFeet: best?.brokenFeet || [],
    alternatives,
    ambiguity: ambiguous
      ? {
          tiedWith: tied.map((r) => ({ id: r.meterId, name: r.name, score: r.score })),
          delta: tieDelta,
          reason: dag.assumedVocalization
            ? 'النصّ غير مشكول، فيقبل أكثر من تقطيع، وكل تقطيع يوافق بحرًا. لا يمكن الترجيح بين هذه البحور من النصّ وحده.'
            : 'أكثر من بحر يوافق هذا النمط المقطعي بالدرجة نفسها — وهو تداخل بين البحور لا نقص في النصّ.',
          advice: dag.assumedVocalization
            ? 'اكتب البيت مشكولًا (ولو تشكيلًا جزئيًا على مواضع الخلاف) ليحسم المحرك الوزن.'
            : 'الفرق بين هذه البحور لا يظهر في بيت واحد؛ حلّل القصيدة كاملة ليترجّح الغالب.',
        }
      : null,
    explanation: explain(best, verdict, scorer),
    _internal: options.debug ? { units, dag, free, phonTrace, ranking } : undefined,
  };
}

function explain(best, verdict, scorer) {
  if (!best) {
    return {
      case: 'D',
      title: 'لا وزن قريب',
      text: 'لم يوافق البيت أي بحر في القاعدة بدرجة تُعتدّ. قد يكون خارج البحور الثلاثة عشر المسجَّلة، أو يحتاج تشكيلًا ليُقرأ قراءة صحيحة.',
    };
  }
  const t = scorer.thresholds;
  if (verdict === 'sound') {
    return {
      case: 'A',
      title: `موزون على ${best.name}`,
      text: `طابق البيت تفعيلات ${best.name} كاملةً بدرجة ${pct(best.score)}.`,
    };
  }
  if (verdict === 'acceptable') {
    const licensed = (best.feet || []).filter((f) => f.variant.kind === 'zihaf' || f.variant.kind === 'illa');
    return {
      case: 'A',
      title: `موزون على ${best.name} مع رخص`,
      text: licensed.length
        ? `البيت موزون على ${best.name}؛ ودخلت ${licensed.length} من تفعيلاته صورٌ مزاحَفة أو معلولة وكلها جائزة: ${licensed.map((f) => `${f.tafila} ← ${f.variant.name}`).join('، ')}.`
        : `البيت موزون على ${best.name} بدرجة ${pct(best.score)}.`,
    };
  }
  if (verdict === 'broken') {
    const b = best.brokenFeet[0];
    return {
      case: 'C',
      title: `قريب من ${best.name} مع كسر`,
      text: b
        ? `أقرب البحور ${best.name} بدرجة ${pct(best.score)}. موضع الخلل التفعيلة ${b.footIndex + 1} (${b.tafila}): البحر يطلب ${b.expected} والبيت أعطى ${b.actual}.`
        : `أقرب البحور ${best.name} بدرجة ${pct(best.score)}، والخلل موزّع لا محصور في تفعيلة واحدة.`,
    };
  }
  return {
    case: 'D',
    title: 'لا وزن مقنع',
    text: `أعلى درجة بلغها البيت ${pct(best.score)} على ${best.name}، وهي دون عتبة القبول (${pct(t.broken)}).`,
  };
}

const pct = (x) => `${Math.round(x * 100)}%`;
const round = (x) => Math.round(x * 1e6) / 1e6;
