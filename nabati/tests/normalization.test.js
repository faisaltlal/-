import { describe, it, assert, equal } from './harness.js';
import { normalize, splitHemistichs, splitLines } from '../engine/js/index.js';

describe('التطبيع', () => {
  it('يحذف التطويل ولا يمسّ الحروف', () => {
    const r = normalize('الــــسلام');
    equal(r.text, 'السلام');
    assert(r.removed.some((x) => x.what === 'التطويل'), 'يجب تسجيل ما حُذف');
  });

  it('يبدّل الترقيم بفراغ ولا يلصق الكلمتين', () => {
    const r = normalize('يا صاحبي، قم');
    equal(r.words.map((w) => w.text), ['يا', 'صاحبي', 'قم']);
  });

  it('يحفظ التشكيل كاملًا — الحركات هي أساس التقطيع', () => {
    const r = normalize('مُسْتَفْعِلُنْ');
    equal(r.text, 'مُسْتَفْعِلُنْ');
    assert(r.hasDiacritics);
  });

  it('لا يوحّد صور الهمزة، لأن الهمزة صامت يُحسب', () => {
    const r = normalize('أمل إمل آمل');
    assert(r.text.includes('أ') && r.text.includes('إ') && r.text.includes('آ'));
  });

  it('يوحّد ألف الوصل ٱ بالألف', () => {
    const r = normalize('ٱلحمد');
    equal(r.text, 'الحمد');
  });

  it('يقيس نسبة التشكيل', () => {
    assert(normalize('مُسْتَفْعِلُنْ').vocalizationCoverage > 0.8);
    equal(normalize('مستفعلن').vocalizationCoverage, 0);
  });

  it('يزيل الرموز الأجنبية دون فقد كلمة', () => {
    const r = normalize('قال (2024) لي');
    equal(r.words.map((w) => w.text), ['قال', 'لي']);
  });

  it('يقسم الشطرين على الفاصل الصريح', () => {
    const a = splitHemistichs('صدر البيت ... عجز البيت');
    equal(a.parts.length, 2);
    assert(a.explicit);
    const b = splitHemistichs('بيت بلا فاصل');
    assert(!b.explicit, 'بلا فاصل لا يُقسم بالتخمين');
  });

  it('يقسم القصيدة على الأسطر ويهمل الفارغة', () => {
    equal(splitLines('بيت أول\n\nبيت ثانٍ\n').length, 2);
  });
});
