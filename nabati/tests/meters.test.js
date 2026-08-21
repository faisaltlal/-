/**
 * قاعدة الأوزان: تناسق البيانات نفسها.
 * تُشتق الاختبارات من meters.json، فإضافة بحر جديد تدخل هذه الفحوص
 * تلقائيًا دون كتابة اختبار جديد (البند 30).
 */
import { describe, it, assert, equal } from './harness.js';
import { createEngine } from '../engine/js/index.js';
import { lettersFromSyllables } from '../engine/js/meters/registry.js';
import { DATA } from '../engine/js/data.generated.js';

const engine = createEngine(DATA);

describe('قاعدة الأوزان — التناسق', () => {
  it('لا مشكلات تناسق في البيانات', () => {
    equal(engine.integrity(), [], 'أي مشكلة هنا تعني تعارض البيانات مع نفسها');
  });

  it('نمط كل تفعيلة المقطعي يوافق نمطها الحرفي الخليلي', () => {
    for (const t of DATA.tafaeel.tafaeel) {
      equal(lettersFromSyllables(t.syllables), t.khalilLetters, `التفعيلة ${t.plain}`);
    }
  });

  it('البحور الثلاثة عشر كلها مسجَّلة', () => {
    equal(engine.listMeters().length, 13);
  });

  it('كل بحر مفعَّل له تفعيلات ونمط غير فارغ', () => {
    for (const m of engine.registry.enabled) {
      assert(m.feet.length > 0, `${m.name} بلا تفعيلات`);
      assert(m.pattern.length > 0, `${m.name} بلا نمط`);
    }
  });

  it('الهلالي الطويل معطَّل وموثَّق سببه — لا نسخ أعمى للمسحوب', () => {
    const h = engine.registry.byId.get('al_hilali_taweel');
    assert(!h.enabled, 'يجب أن يبقى معطَّلًا حتى يصل تحقّق');
    assert(h.derivation?.why_not_implemented, 'السبب موثَّق');
    assert(h.derivation.candidates.length >= 2, 'المرشّحون مسجَّلون لا مُختار منهم');
  });

  it('الصخري منفَّذ كما ورد في المصدر لا كما صُحّح', () => {
    const s = engine.registry.byId.get('al_sakhri');
    equal(s.feet[0].plain, 'مفاعلاتن', 'التفعيلة كما وردت حرفيًا');
    equal(s.status, 'NEEDS_VALIDATION');
    assert(s.validation.candidates.length >= 2, 'البدائل مسجَّلة دون تفعيل');
  });

  it('الحدا نصف الرجز بالضبط — يعضد قراءة الرجز أربع تفعيلات', () => {
    const hada = engine.registry.byId.get('al_hada');
    const rajaz = engine.registry.byId.get('al_rajaz');
    equal(hada.pattern.length * 2, rajaz.pattern.length);
    equal(rajaz.pattern.join('').startsWith(hada.pattern.join('')), true);
  });

  it('أسماء الهزج الثلاثة وزن واحد لا ثلاثة', () => {
    const h = engine.registry.find('الشيباني');
    equal(h.id, 'al_hazaj');
    equal(engine.registry.find('اللويحاني').id, 'al_hazaj');
  });

  it('«الهجيني» المجرَّد يشير إلى البحر الذي سمّاه المصدر به', () => {
    equal(engine.registry.find('الهجيني').id, 'al_hajini');
  });

  it('السامري مسجَّل مفقودًا لا محذوفًا بصمت', () => {
    const missing = engine.registry.notInSource.find((n) => n.name === 'السامري');
    assert(missing, 'يجب أن يبقى مذكورًا مع سبب غيابه');
  });

  it('كل بحر يطابق نمطه هو مطابقة تامة', () => {
    // اختبار مشتق من البيانات: يغطي أي بحر يُضاف مستقبلًا بلا تعديل.
    for (const meter of engine.registry.enabled) {
      const r = engine.stages.matchPattern(meter.pattern, meter);
      equal(r.score, 1, `${meter.name} لا يطابق نفسه`);
      equal(r.brokenFeet.length, 0, `${meter.name} فيه تفعيلة مكسورة في مطابقة ذاته`);
      equal(r.verdict, 'sound');
    }
  });

  it('كل بحر يتصدّر ترتيب نمطه هو', () => {
    for (const meter of engine.registry.enabled) {
      const ranked = engine.stages.rankPattern(meter.pattern);
      const top = ranked.filter((r) => r.score >= ranked[0].score - 1e-9).map((r) => r.meterId);
      assert(
        top.includes(meter.id),
        `${meter.name} لم يتصدّر نمطه؛ تصدّره ${ranked[0].name}`
      );
    }
  });
});
