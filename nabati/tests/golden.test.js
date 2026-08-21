/**
 * حالات golden_cases.json — تُقرأ من الملف، فإضافة حالة لا تحتاج كودًا.
 */
import { describe, it, assert, equal } from './harness.js';
import { createEngine } from '../engine/js/index.js';
import { DATA } from '../engine/js/data.generated.js';

const engine = createEngine(DATA);
const G = DATA.goldenCases;

describe('golden — طبقة الأصوات والمقاطع', () => {
  for (const c of G.phonology) {
    it(`${c.id}: ${c.title}`, () => {
      const got = engine.stages.syllabify(c.input).free.syllables.map((s) => s.weight);
      equal(got, c.expectSyllables, `«${c.input}» — ${c.why}`);
    });
  }
});

describe('golden — أبيات كاملة', () => {
  if (!G.verses.length) {
    it('لا أبيات مرجعية بعد — مسجَّل في قسم pending', () => {
      assert(G.pending.items.length > 0, 'يجب بيان ما ينقص');
    });
  }
  for (const c of G.verses) {
    it(`${c.id || c.input.slice(0, 30)}`, () => {
      const r = engine.analyze(c.input, c.options);
      if (c.expectedMeter) {
        equal(r.bestMeter?.id || r.bestMeter?.name, c.expectedMeter, `«${c.input}»`);
      }
      if (c.expectedConfidenceRange) {
        const [lo, hi] = c.expectedConfidenceRange;
        assert(
          r.bestMeter.score >= lo && r.bestMeter.score <= hi,
          `الدرجة ${r.bestMeter.score} خارج [${lo}, ${hi}]`
        );
      }
      if (c.expectedTafaeel?.length) {
        equal(r.tafaeel.map((f) => f.tafila), c.expectedTafaeel);
      }
      if (c.expectedBrokenFeet) {
        equal(r.brokenFeet.map((b) => b.footIndex), c.expectedBrokenFeet);
      }
    });
  }
});

describe('golden — سلامة السجل نفسه', () => {
  it('كل حالة لها مصدر معلوم', () => {
    for (const c of G.phonology) {
      assert(c.source, `${c.id} بلا مصدر`);
      assert(c.why, `${c.id} بلا تعليل`);
    }
  });

  it('قائمة ما ينقص غير فارغة ما دامت أبيات المصدر غائبة', () => {
    if (!G.verses.length) assert(G.pending.items.length >= 1);
  });
});
