/**
 * PoemAnalyzer — تحليل قصيدة لا بيتًا واحدًا (البند 16).
 *
 * البحر الغالب يُستنتج من مجموع درجات كل بحر عبر الأبيات لا من عدد
 * الأبيات التي تصدّرها. السبب: بيت واحد يتصدّره بحر بفارق ضئيل لا ينبغي
 * أن يزن مثل بيت يتصدّره بفارق كبير.
 */

import { analyzeLine } from './lineAnalyzer.js';
import { splitLines } from '../text/normalizer.js';

export function analyzePoem(input, engine, options = {}) {
  const lines = Array.isArray(input) ? input : splitLines(input);
  const results = lines.map((line, i) => ({
    index: i,
    ...analyzeLine(line, engine, options),
  }));

  const tally = new Map();
  for (const r of results) {
    if (!r.bestMeter) continue;
    const cur = tally.get(r.bestMeter.id) || {
      id: r.bestMeter.id, name: r.bestMeter.name, lines: 0, scoreSum: 0,
    };
    cur.lines += 1;
    cur.scoreSum += r.bestMeter.score;
    tally.set(r.bestMeter.id, cur);
  }

  const distribution = [...tally.values()]
    .map((t) => ({
      ...t,
      share: round(t.lines / (results.length || 1)),
      averageScore: round(t.scoreSum / t.lines),
    }))
    .sort((a, b) => b.scoreSum - a.scoreSum || a.id.localeCompare(b.id));

  const dominant = distribution[0] || null;

  // بيت خارج عن الوزن الغالب: إما تصدّره بحر آخر، وإما لم يبلغ عتبة القبول.
  const outliers = results
    .map((r) => {
      if (!r.bestMeter) {
        return { index: r.index, input: r.input, reason: 'لم يوافق أي بحر', score: 0 };
      }
      if (dominant && r.bestMeter.id !== dominant.id) {
        const onDominant = r.alternatives.find((a) => a.meterId === dominant.id);
        return {
          index: r.index, input: r.input,
          reason: `تصدّره ${r.bestMeter.name} لا ${dominant.name}`,
          score: r.bestMeter.score,
          scoreOnDominant: onDominant ? onDominant.score : null,
        };
      }
      if (r.verdict === 'broken' || r.verdict === 'unrecognized') {
        return {
          index: r.index, input: r.input,
          reason: `على ${r.bestMeter.name} لكنه مكسور`,
          score: r.bestMeter.score,
          brokenFeet: r.brokenFeet,
        };
      }
      return null;
    })
    .filter(Boolean);

  const unclear = results.filter((r) => !r.bestMeter || r.verdict === 'unrecognized').length;

  return {
    lineCount: results.length,
    distribution,
    dominantMeter: dominant
      ? { id: dominant.id, name: dominant.name, lines: dominant.lines, averageScore: dominant.averageScore }
      : null,
    unclear,
    consistency: dominant ? round(dominant.lines / (results.length || 1)) : 0,
    outliers,
    lines: results.map((r) => ({
      index: r.index,
      input: r.input,
      meter: r.bestMeter?.name || null,
      meterId: r.bestMeter?.id || null,
      score: r.bestMeter?.score ?? 0,
      confidence: r.bestMeter?.confidence ?? 0,
      verdict: r.verdict,
      brokenFeet: r.brokenFeet,
      tafaeel: r.tafaeel,
      numericPattern: r.numericPattern,
    })),
    full: results,
  };
}

const round = (x) => Math.round(x * 1e6) / 1e6;
