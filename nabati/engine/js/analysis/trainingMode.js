/**
 * TrainingMode — وضع التدريب (البند 17).
 *
 * المستخدم يختار بحرًا ويكتب بيتًا، فيُقاس البيت على البحر المختار وحده،
 * ثم يُقارَن بأقرب بحر آخر. الفائدة أن يعرف المتدرّب أمرين معًا:
 * أخطأ في الوزن الذي قصده، أم أصاب وزنًا آخر غير الذي قصده.
 */

import { analyzeLine } from './lineAnalyzer.js';

export const DIFFICULTY = {
  easy: { requiredScore: 0.80, allowVariations: true, hintLevel: 'full' },
  medium: { requiredScore: 0.90, allowVariations: true, hintLevel: 'partial' },
  hard: { requiredScore: 0.97, allowVariations: false, hintLevel: 'minimal' },
};

/**
 * @param {string} input بيت المتدرّب
 * @param {string} targetMeter اسم البحر أو معرّفه
 * @param {object} engine
 * @param {{ difficulty?: 'easy'|'medium'|'hard' }} [options]
 */
export function checkAttempt(input, targetMeter, engine, options = {}) {
  const level = DIFFICULTY[options.difficulty || 'medium'];
  const meter = engine.registry.find(targetMeter);

  if (!meter) {
    return { ok: false, error: `لا يوجد بحر بهذا الاسم: ${targetMeter}`, available: engine.listMeters() };
  }
  if (!meter.enabled) {
    return { ok: false, error: `البحر ${meter.name} غير مفعَّل: ${meter.status}`, reason: meter.derivation?.why_not_implemented };
  }

  const analysis = analyzeLine(input, engine, options);
  const onTarget = [analysis.bestMeter, ...analysis.alternatives]
    .find((m) => m && (m.id || m.meterId) === meter.id);
  const targetScore = onTarget ? onTarget.score : 0;

  const usedLicense = (analysis.tafaeel || []).filter(
    (f) => f.variationKind && f.variationKind !== 'salim'
  );
  const violatesStrictness = !level.allowVariations && usedLicense.length > 0;
  const correct = targetScore >= level.requiredScore && !violatesStrictness;

  const feedback = [];
  if (correct) {
    feedback.push({
      kind: 'success',
      text: `أصبت. البيت على ${meter.name} بدرجة ${pct(targetScore)}.`,
    });
  } else {
    if (targetScore < level.requiredScore) {
      feedback.push({
        kind: 'score',
        text: `درجة البيت على ${meter.name} ${pct(targetScore)}، والمطلوب في هذا المستوى ${pct(level.requiredScore)}.`,
      });
    }
    if (violatesStrictness) {
      feedback.push({
        kind: 'strictness',
        text: `المستوى الصعب يطلب التفعيلات سالمة، وقد دخلت الرخص في: ${usedLicense.map((f) => f.tafila).join('، ')}.`,
      });
    }
    for (const b of analysis.brokenFeet) {
      feedback.push({
        kind: 'broken_foot',
        footIndex: b.footIndex,
        text: `التفعيلة ${b.footIndex + 1} (${b.tafila}): المتوقَّع ${b.expected} والواقع ${b.actual}.`,
        issues: b.issues,
      });
    }
    if (analysis.bestMeter && analysis.bestMeter.id !== meter.id) {
      feedback.push({
        kind: 'other_meter',
        text: `البيت أقرب إلى ${analysis.bestMeter.name} (${pct(analysis.bestMeter.score)}) منه إلى ${meter.name}.`,
      });
    }
  }

  return {
    ok: true,
    correct,
    targetMeter: { id: meter.id, name: meter.name, tafaeel: meter.tafaeelNames },
    difficulty: options.difficulty || 'medium',
    requiredScore: level.requiredScore,
    achievedScore: targetScore,
    expectedPattern: level.hintLevel === 'minimal' ? null : meter.pattern.join(''),
    actualPattern: analysis.internalPattern,
    feedback,
    analysis: level.hintLevel === 'full' ? analysis : undefined,
  };
}

/** تمارين مقترحة: البحور المفعَّلة مع تفعيلاتها. */
export function exercises(engine) {
  return engine.registry.enabled.map((m) => ({
    id: m.id,
    name: m.name,
    aliases: m.aliases,
    tafaeel: m.tafaeelNames,
    pattern: m.pattern.join(''),
    syllableCount: m.pattern.length,
  }));
}

const pct = (x) => `${Math.round(x * 100)}%`;
