/**
 * المطابقة والدرجة — مُختبَرتان على أنماط مقطعية مباشرة، معزولتين عن
 * طبقتَي الصوت والمقاطع، حتى يُعرف موضع أي فشل بلا لبس.
 */
import { describe, it, assert, equal, atLeast, close } from './harness.js';
import { createEngine } from '../engine/js/index.js';
import { DATA } from '../engine/js/data.generated.js';

const engine = createEngine(DATA);
const P = (s) => [...s];

describe('المطابقة', () => {
  it('البيت الموزون يبلغ الدرجة التامة', () => {
    const r = engine.stages.matchPattern(P('LLSLLLSLLSLL'), 'المسحوب');
    equal(r.score, 1);
    equal(r.verdict, 'sound');
  });

  it('الزحاف المسموح يُقبل بكلفة صغيرة لا بكسر', () => {
    // مستفعلن ← متفعلن (خبن) في الحشو
    const r = engine.stages.matchPattern(P('SLSLLLSLLSLL'), 'المسحوب');
    atLeast(r.score, 0.9, 'الخبن جائز فلا يُسقط الدرجة');
    assert(r.score < 1, 'وليس مجانًا — السالم يتقدّم عليه');
    equal(r.feet[0].variant.id, 'khabn');
  });

  it('يحدّد التفعيلة المكسورة لا أن البيت مكسور فحسب', () => {
    // التفعيلة الثالثة: فاعلاتن LSLL ← أُفسدت إلى LLLL
    const r = engine.stages.matchPattern(P('LLSLLLSLLLLL'), 'المسحوب');
    assert(r.brokenFeet.length >= 1, 'يجب أن يشير إلى تفعيلة بعينها');
    const b = r.brokenFeet[0];
    equal(b.footIndex, 2, 'الخلل في التفعيلة الثالثة');
    assert(b.issues.length > 0, 'يجب بيان المقطع المختلف');
  });

  it('يميّز الحالات الأربع من البند 15', () => {
    // A: موزون على البحر المطلوب
    equal(engine.stages.matchPattern(P('LLSLLLSLLSLL'), 'المسحوب').verdict, 'sound');
    // B: موزون لكن على بحر آخر
    const onOther = engine.stages.rankPattern(P('SLLLSLLLSLLLSLLL'));
    equal(onOther[0].meterId, 'al_hazaj');
    assert(onOther.find((r) => r.meterId === 'al_maskhub').score < onOther[0].score);
    // C: قريب لكنه مكسور
    const broken = engine.stages.matchPattern(P('LLSLLLSLLLLL'), 'المسحوب');
    assert(['acceptable', 'broken'].includes(broken.verdict), `الواقع ${broken.verdict}`);
    // D: لا وزن قريب — كل تفعيلاته مختلّة، فالحكم يردّه وإن لم تردّه الدرجة
    const noise = engine.stages.rankPattern(P('SSSSSSSSSSSS'));
    equal(noise[0].verdict, 'unrecognized', `أعلى درجة ${noise[0].score} على ${noise[0].name}`);
  });

  it('يرجع ترتيبًا لا إجابة واحدة', () => {
    const ranked = engine.stages.rankPattern(P('LLSLLLSLLSLL'));
    assert(ranked.length > 3, 'الترتيب يشمل كل البحور المطابِقة');
    equal(ranked[0].meterId, 'al_maskhub');
    for (let i = 1; i < ranked.length; i++) {
      assert(ranked[i - 1].score >= ranked[i].score, 'الترتيب تنازلي');
    }
  });

  it('طول البيت يفرّق بين البحور المتداخلة الأنماط', () => {
    // الحدا بادئة حرفية للرجز؛ الطول وحده يحسم.
    const short = engine.stages.rankPattern(P('LLSLLLSL'));
    equal(short[0].meterId, 'al_hada');
    const long = engine.stages.rankPattern(P('LLSLLLSLLLSLLLSL'));
    equal(long[0].meterId, 'al_rajaz');
  });

  it('العلة تُقبل في الضرب وتُغرَّم في الحشو', () => {
    const meter = engine.registry.byId.get('al_maskhub');
    const scorer = engine.scorer;
    const illa = { id: 'x', kind: 'illa', scope: 'arud_darb', severity: 1 };
    const inDarb = scorer.variationCost(illa, { isArudDarb: true });
    const inHashw = scorer.variationCost(illa, { isArudDarb: false });
    assert(inHashw > inDarb, 'وقوع العلة في الحشو أغلى');
    close(inHashw - inDarb, DATA.scoring.weights.scopeViolation, 1e-9);
    void meter;
  });

  it('الخلل في الضرب أغلى منه في الحشو', () => {
    // نفس الإفساد، مرة في التفعيلة الأولى ومرة في الأخيرة.
    const first = engine.stages.matchPattern(P('LSSLLLSLLSLL'), 'المسحوب');
    const last = engine.stages.matchPattern(P('LLSLLLSLLSLS'), 'المسحوب');
    assert(last.score <= first.score, `الحشو ${first.score} والضرب ${last.score}`);
  });

  it('البيت الأقصر من البحر يُحاسب بالنقص لا يُرفض', () => {
    const r = engine.stages.matchPattern(P('LLSLLLSL'), 'المسحوب');
    assert(r.matched, 'لا يُرفض');
    assert(r.score < 1 && r.score > 0, `درجة وسطى، والواقع ${r.score}`);
  });

  it('البيت الأطول يُحاسب بالمقاطع الفائضة', () => {
    const exact = engine.stages.matchPattern(P('LLSLLLSLLSLL'), 'المسحوب');
    const extra = engine.stages.matchPattern(P('LLSLLLSLLSLLLL'), 'المسحوب');
    assert(extra.score < exact.score, 'الفائض يُخفّض الدرجة');
    atLeast(extra.leftoverSyllables, 1, 'الفائض محسوب لا مهمَل');
  });
});

describe('الدرجة', () => {
  it('حتمية: التشغيل نفسه يعطي الرقم نفسه', () => {
    const a = engine.stages.matchPattern(P('LLSLLLSLLSLL'), 'المسحوب');
    const b = engine.stages.matchPattern(P('LLSLLLSLLSLL'), 'المسحوب');
    equal(a.score, b.score);
    equal(a.cost, b.cost);
  });

  it('محصورة بين صفر وواحد', () => {
    for (const p of ['SSSSSSSSSSSSSSSSSSSS', 'LLLLLLLLLLLL', 'LLSLLLSLLSLL', 'S']) {
      const r = engine.stages.rankPattern(P(p));
      for (const x of r) {
        assert(x.score >= 0 && x.score <= 1, `${p} أعطى ${x.score}`);
      }
    }
  });

  it('المقام يساوي عدد مقاطع البحر (بحدّ أدنى)', () => {
    const r = engine.stages.matchPattern(P('LLSLLLSLLSLL'), 'المسحوب');
    equal(r.normalizer, Math.max(12, DATA.scoring.normalizer.floor) * DATA.scoring.normalizer.perSyllableCost);
  });

  it('الدرجة تنخفض كلما زاد الخلل — لا قفزات', () => {
    const scores = [
      engine.stages.matchPattern(P('LLSLLLSLLSLL'), 'المسحوب').score,
      engine.stages.matchPattern(P('LLSLLLSLLSLS'), 'المسحوب').score,
      engine.stages.matchPattern(P('LLSLLLSLLSSS'), 'المسحوب').score,
      engine.stages.matchPattern(P('LLSLLLSSSSSS'), 'المسحوب').score,
    ];
    for (let i = 1; i < scores.length; i++) {
      assert(scores[i] <= scores[i - 1], `الدرجات: ${scores.join(' > ')}`);
    }
  });

  it('كل المعاملات تأتي من الملف لا من الكود', () => {
    equal(engine.scorer.weights.substitution, DATA.scoring.weights.substitution);
    equal(engine.scorer.thresholds, DATA.scoring.thresholds);
  });
});
