/**
 * Scoring Engine — معادلة الدرجة، معزولة عمدًا.
 *
 * لا يوجد في هذا الملف رقم مكتوب: كل المعاملات تأتي من data/scoring.json.
 * تعديل الترتيب يتم بتحرير ذلك الملف وحده، دون إعادة بناء المحرك.
 *
 * المعادلة كاملةً في docs/SCORING.md. ملخّصها:
 *
 *   التكلفة = Σ (كلفة صورة التفعيلة + كلفة محاذاة مقاطعها) × معامل الموضع
 *           + كلفة المقاطع الفائضة + كلفة التفعيلات الخاوية
 *
 *   الدرجة = 1 − التكلفة ÷ (عدد مقاطع البحر × كلفة المقطع الواحد)
 *
 * الدرجة حتمية: النصّ نفسه والبيانات نفسها تعطيان الرقم نفسه دائمًا.
 */

export function createScorer(config) {
  const w = config.weights;

  /** كلفة وضع مقطع مكان مقطع. */
  function substitutionCost(actual, expected) {
    if (actual === expected) return 0;
    // الطويل والمفرط في آخر الشطر فرق تدوين أكثر منه فرق سمع.
    const pair = [actual, expected].sort().join('');
    if (pair === 'LX') return w.overlongMismatch;
    return w.substitution;
  }

  /** كلفة استعمال صورة مزاحَفة أو معلولة بدل السالمة. */
  function variationCost(variant, { isArudDarb }) {
    const base = w.variationKind[variant.kind] ?? w.variationKind.zihaf;
    const sev = w.severityMultiplier[String(variant.severity ?? 1)] ?? 1;
    let cost = base * sev;
    // العلة لا تقع إلا في العروض والضرب؛ وقوعها في الحشو مخالفة تُحاسَب.
    if (variant.scope === 'arud_darb' && !isArudDarb) cost += w.scopeViolation;
    return cost;
  }

  function positionMultiplier({ isFirst, isArudDarb }) {
    if (isArudDarb) return w.position.arudDarb;
    if (isFirst) return w.position.first;
    return w.position.hashw;
  }

  const weights = {
    substitution: w.substitution,
    insertion: w.insertion,
    deletion: w.deletion,
    overlongMismatch: w.overlongMismatch,
    unconsumedSyllable: w.unconsumedSyllable,
    unfilledFoot: w.unfilledFoot,
  };

  /** يحوّل التكلفة الخام إلى درجة في [0,1]. */
  function finalize(totalCost, meterSyllableCount, { assumedVocalization } = {}) {
    const n = Math.max(meterSyllableCount, config.normalizer.floor);
    const normalizer = n * config.normalizer.perSyllableCost;
    let score = 1 - totalCost / normalizer;
    score = Math.max(0, Math.min(1, score));

    let confidence = score;
    if (assumedVocalization) {
      confidence *= 1 - config.uncertainty.assumedVocalizationPenalty;
    }
    return {
      score: round(score),
      confidence: round(confidence),
      cost: round(totalCost),
      normalizer: round(normalizer),
    };
  }

  /**
   * الحالات A/B/C/D من البند 15 من المواصفة.
   *
   * الدرجة وحدها لا تكفي: بيت اختلّت كل تفعيلاته بمقطع واحد لكلٍّ منها
   * ينال درجة متوسطة، فيُقال عنه «قريب من البحر» وهو ليس كذلك — القرب
   * من وزن معناه أن أكثره صحيح. لذلك نسبة التفعيلات المختلّة تردّ الحكم
   * وإن لم تردّه الدرجة.
   */
  function classify(score, { brokenFeet = 0, totalFeet = 0 } = {}) {
    const t = config.thresholds;
    if (totalFeet > 0 && brokenFeet / totalFeet > t.maxBrokenFootRatio) {
      return 'unrecognized';
    }
    // تفعيلة لم توافق أي صورة مأذون فيها هي كسر بالتعريف، مهما ارتفعت
    // الدرجة. الزحاف والعلة لا يقعان هنا: كلفتهما في variationCost لا في
    // كلفة المحاذاة، فالبيت المزاحَف يبقى «موزونًا برخصة» لا مكسورًا.
    const byScore =
      score >= t.sound ? 'sound'
      : score >= t.acceptable ? 'acceptable'
      : score >= t.broken ? 'broken'
      : 'unrecognized';
    if (brokenFeet > 0 && (byScore === 'sound' || byScore === 'acceptable')) {
      return 'broken';
    }
    return byScore;
  }

  return {
    substitutionCost,
    variationCost,
    positionMultiplier,
    finalize,
    classify,
    weights,
    thresholds: config.thresholds,
    ranking: config.ranking,
    brokenFootThreshold: config.brokenFoot.minCostToReport,
    config,
  };
}

function round(x) {
  return Math.round(x * 1e6) / 1e6;
}
