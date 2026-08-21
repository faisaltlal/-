/**
 * محرك عروض الشعر النبطي — نقطة الدخول الوحيدة.
 *
 * المحرك حتمي بالكامل: لا عشوائية، ولا نموذج لغوي، ولا نسبة مقدَّرة.
 * النصّ نفسه مع البيانات نفسها يعطي النتيجة نفسها في كل تشغيل.
 *
 *   import { createEngine } from './engine/js/index.js';
 *   import { DATA } from './engine/js/data.generated.js';
 *   const engine = createEngine(DATA);
 *   engine.analyze('بيت من الشعر');
 */

import { buildRegistry } from './meters/registry.js';
import { createScorer } from './scoring/scorer.js';
import { createEncoder } from './prosody/digitalPattern.js';
import { analyzeLine } from './analysis/lineAnalyzer.js';
import { analyzePoem } from './analysis/poemAnalyzer.js';
import { checkAttempt, exercises, DIFFICULTY } from './analysis/trainingMode.js';
import { isDebugEnabled, traceReport, dumpDag } from './debug/trace.js';
import { normalize, splitHemistichs, splitLines } from './text/normalizer.js';
import { phonemize } from './phonology/phonemizer.js';
import { buildSyllableDag, freeSyllabify } from './prosody/syllableDag.js';
import { matchMeter, rankMeters } from './matching/meterMatcher.js';

export function createEngine(data) {
  const registry = buildRegistry(data);
  const scorer = createScorer(data.scoring);
  const encoder = createEncoder(data.encodings);

  const engine = {
    registry,
    scorer,
    encoder,
    lexicon: data.lexicon,
    data,

    /** تحليل بيت واحد. */
    analyze(input, options = {}) {
      const debug = isDebugEnabled(options.debug);
      const result = analyzeLine(input, engine, { ...options, debug });
      if (debug) result.trace = traceReport(result);
      return result;
    },

    /** تحليل قصيدة كاملة. */
    analyzePoem(input, options = {}) {
      return analyzePoem(input, engine, options);
    },

    /** وضع التدريب. */
    train(input, targetMeter, options = {}) {
      return checkAttempt(input, targetMeter, engine, options);
    },

    exercises() {
      return exercises(engine);
    },

    /** البحور المفعَّلة وغير المفعَّلة وما ينقصها. */
    listMeters() {
      return registry.meters.map((m) => ({
        id: m.id,
        name: m.name,
        aliases: m.aliases,
        enabled: m.enabled,
        status: m.status,
        sourceQuote: m.sourceQuote,
        tafaeel: m.tafaeelNames,
        pattern: m.pattern.join(''),
        syllableCount: m.pattern.length,
        blockedBy: m.enabled ? null : (m.derivation?.why_not_implemented || m.status),
        needs: m.enabled ? null : (m.derivation?.resolvedBy || m.validation?.resolvedBy),
      }));
    },

    /** كل ما يحتاج تحقّقًا — البند 26. */
    openQuestions() {
      const out = [];
      for (const t of data.tafaeel.tafaeel) {
        if (t.status === 'NEEDS_VALIDATION') {
          out.push({ area: 'tafila', id: t.id, name: t.plain, ...t.validation });
        }
      }
      for (const m of registry.meters) {
        if (m.status === 'NEEDS_VALIDATION') {
          out.push({
            area: 'meter', id: m.id, name: m.name,
            issue: m.validation?.issue || m.derivation?.why_not_implemented,
            resolvedBy: m.validation?.resolvedBy || m.derivation?.resolvedBy,
            enabled: m.enabled,
          });
        }
      }
      for (const s of data.encodings.schemes) {
        if (s.status === 'NEEDS_VALIDATION') {
          out.push({ area: 'encoding', id: s.id, issue: s.note, resolvedBy: s.resolvedBy });
        }
      }
      for (const n of registry.notInSource) {
        out.push({ area: 'missing_meter', name: n.name, issue: n.reason, resolvedBy: 'تفعيلات البحر' });
      }
      if (data.lexicon.nabatiDialect?.status === 'NEEDS_VALIDATION') {
        out.push({
          area: 'dialect', id: 'nabatiDialect',
          issue: data.lexicon.nabatiDialect.note,
          gaps: data.lexicon.nabatiDialect.knownGaps,
        });
      }
      return out;
    },

    /** مشكلات تناسق البيانات — تُفحص في الاختبارات. */
    integrity() {
      return registry.problems;
    },

    /** المراحل الوسيطة مكشوفة للاختبار المنفصل لكل طبقة (البند 19). */
    stages: {
      normalize,
      splitHemistichs,
      splitLines,
      phonemize: (text, options) => {
        const n = normalize(text);
        return phonemize(n.words, data.lexicon, options);
      },
      syllabify: (text, options) => {
        const n = normalize(text);
        const { units } = phonemize(n.words, data.lexicon, options);
        const dag = buildSyllableDag(units, options);
        return { units, dag, free: freeSyllabify(dag) };
      },
      dumpDag,

      /** مطابقة نمط مقطعي معطى مباشرةً — لاختبار المطابق وحده. */
      matchPattern(syllables, meterRef, options = {}) {
        const meter = typeof meterRef === 'string' ? registry.find(meterRef) : meterRef;
        if (!meter) throw new Error(`بحر غير معروف: ${meterRef}`);
        return matchMeter(patternToDag(syllables), meter, scorer, options);
      },

      rankPattern(syllables, options = {}) {
        return rankMeters(patternToDag(syllables), registry, scorer, options);
      },

      patternToDag,
    },
  };

  return engine;
}

/**
 * مخطّط بمسار واحد يمثّل نمطًا مقطعيًا معطى.
 * يُستعمل لاختبار المطابقة والدرجة معزولتين عن طبقتَي الصوت والمقاطع.
 */
export function patternToDag(syllables) {
  const pattern = Array.isArray(syllables) ? syllables : [...String(syllables)];
  const edges = Array.from({ length: pattern.length + 1 }, () => []);
  pattern.forEach((weight, i) => {
    edges[i].push({
      from: i, to: i + 1, weight,
      meta: { shape: null, consumed: [i], onset: null, nucleus: null },
    });
  });
  return { edges, size: pattern.length, assumedVocalization: false };
}

export { normalize, splitHemistichs, splitLines, phonemize, buildSyllableDag, freeSyllabify, DIFFICULTY, traceReport, dumpDag, matchMeter, rankMeters };
