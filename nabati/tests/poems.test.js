/**
 * تحليل القصيدة ووضع التدريب والنموذج الناتج.
 */
import { describe, it, assert, equal, atLeast } from './harness.js';
import { createEngine } from '../engine/js/index.js';
import { DATA } from '../engine/js/data.generated.js';

const engine = createEngine(DATA);

// أبيات اصطناعية: تفعيلات البحر منطوقةً. تختبر خطّ الأنابيب كاملًا
// من النصّ العربي إلى البحر، دون ادّعاء أنها شعر.
const MASKHUB = 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ';
const HAJINI = 'فَاعِلَاتُنْ فَعُولُنْ فَاعِلَاتُنْ فَعُولُنْ';
const HAZAJ = 'مَفَاعِيلُنْ مَفَاعِيلُنْ مَفَاعِيلُنْ مَفَاعِيلُنْ';

describe('التحليل الكامل — من النصّ إلى البحر', () => {
  it('يتعرّف على المسحوب من نصّ عربي مشكول', () => {
    const r = engine.analyze(MASKHUB);
    equal(r.bestMeter.id, 'al_maskhub');
    equal(r.verdict, 'sound');
    equal(r.vocalization.assumed, false, 'المشكول لا يحتاج افتراضًا');
  });

  it('يربط كل تفعيلة بالكلمات التي وقعت فيها', () => {
    const r = engine.analyze(MASKHUB);
    equal(r.tafaeel.length, 3);
    for (const f of r.tafaeel) {
      assert(f.words.length > 0, `التفعيلة ${f.tafila} بلا كلمات`);
      assert(f.expected, 'النمط المتوقَّع معروض');
      assert(f.actual, 'النمط الفعلي معروض');
    }
  });

  it('النموذج الناتج مستقلّ عن أي واجهة', () => {
    const r = engine.analyze(MASKHUB);
    for (const k of ['input', 'normalized', 'prosodic', 'syllables', 'numericPattern', 'bestMeter', 'tafaeel', 'brokenFeet', 'alternatives']) {
      assert(k in r, `الحقل ${k} مفقود من النموذج`);
    }
    JSON.stringify(r); // يجب أن يكون قابلًا للتسلسل بلا حلقات
  });

  it('النمط الرقمي طبقة عرض: تغييره لا يمسّ النتيجة', () => {
    const r = engine.analyze(MASKHUB);
    equal(r.internalPattern, 'LLSLLLSLLSLL');
    equal(r.numericPatterns.binary_1_2.value, '221222122122');
    equal(r.numericPatterns.khalil_arudi.value, '101011010101101011010');
    equal(r.numericPatterns.nabati_app.value, null, 'ترميز التطبيق غير مثبت فلا يُخترع');
  });

  it('يفصل الشطرين على الفاصل الصريح', () => {
    const r = engine.analyze(`${MASKHUB} ... ${MASKHUB}`);
    equal(r.mode, 'hemistichs');
    equal(r.hemistichCount, 2);
    equal(r.bestMeter.id, 'al_maskhub');
  });
});

describe('تحليل القصيدة', () => {
  const poem = [MASKHUB, MASKHUB, MASKHUB, HAJINI].join('\n');

  it('يستنتج البحر الغالب', () => {
    const r = engine.analyzePoem(poem);
    equal(r.lineCount, 4);
    equal(r.dominantMeter.id, 'al_maskhub');
    equal(r.dominantMeter.lines, 3);
  });

  it('يحسب توزيع البحور', () => {
    const r = engine.analyzePoem(poem);
    const maskhub = r.distribution.find((d) => d.id === 'al_maskhub');
    equal(maskhub.lines, 3);
    equal(maskhub.share, 0.75);
  });

  it('يحدّد الأبيات الخارجة عن الغالب', () => {
    const r = engine.analyzePoem(poem);
    equal(r.outliers.length, 1);
    equal(r.outliers[0].index, 3);
    assert(r.outliers[0].reason.includes('الهجيني'));
  });

  it('يعطي درجة كل بيت على حدة', () => {
    const r = engine.analyzePoem(poem);
    equal(r.lines.length, 4);
    for (const l of r.lines) atLeast(l.score, 0.5);
  });

  it('القصيدة المتّسقة تبلغ اتّساقًا تامًّا', () => {
    const r = engine.analyzePoem([HAZAJ, HAZAJ, HAZAJ].join('\n'));
    equal(r.consistency, 1);
    equal(r.outliers.length, 0);
  });
});

describe('وضع التدريب', () => {
  it('يصحّح المحاولة الصائبة', () => {
    const r = engine.train(MASKHUB, 'المسحوب');
    assert(r.ok && r.correct, JSON.stringify(r.feedback));
  });

  it('يبيّن الخطأ ويعرض النمطين', () => {
    const r = engine.train(HAJINI, 'المسحوب');
    assert(r.ok && !r.correct);
    assert(r.expectedPattern && r.actualPattern, 'النمطان معروضان');
    assert(r.feedback.some((f) => f.kind === 'other_meter'), 'ينبّه أن البيت على بحر آخر');
  });

  it('المستوى الصعب يرفض الرخص', () => {
    const easy = engine.train(MASKHUB, 'المسحوب', { difficulty: 'easy' });
    const hard = engine.train(MASKHUB, 'المسحوب', { difficulty: 'hard' });
    equal(easy.requiredScore, 0.8);
    equal(hard.requiredScore, 0.97);
  });

  it('يرفض بحرًا غير مفعَّل ويشرح السبب', () => {
    const r = engine.train(MASKHUB, 'الهلالي الطويل');
    assert(!r.ok);
    assert(r.reason, 'السبب مبيَّن لا مجرد رفض');
  });

  it('يعرض التمارين المتاحة من البيانات', () => {
    equal(engine.exercises().length, engine.registry.enabled.length);
  });
});

describe('الأسئلة المعلَّقة', () => {
  it('كل ما يحتاج تحقّقًا مُعلَن لا مخفيّ', () => {
    const q = engine.openQuestions();
    atLeast(q.length, 4, 'يجب أن تُعلن البنود غير المحسومة');
    for (const x of q) assert(x.area && (x.issue || x.gaps), `بند ناقص: ${JSON.stringify(x)}`);
    assert(q.some((x) => x.area === 'encoding'), 'ترميز التطبيق الرقمي غير محسوم');
    assert(q.some((x) => x.area === 'missing_meter'), 'السامري مفقود');
  });
});
