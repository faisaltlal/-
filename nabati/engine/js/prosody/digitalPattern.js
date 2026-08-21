/**
 * DigitalPattern — تحويل التمثيل الداخلي إلى ترميز رقمي معروض.
 *
 * البند 10 من المواصفة: «لا تفترض معنى الرقم من عندك… لا تضع
 * hard-coded conversion غير مثبت». لذلك لا يوجد في هذا الملف رقم واحد
 * مكتوب: كل الترميزات تُقرأ من data/encodings.json، والمحرك كله يشتغل
 * على الحروف S/L/X لا على الأرقام.
 *
 * التحويل هنا طبقة عرض فقط. تغيير ترميز الأرقام لا يمسّ المطابقة ولا
 * الدرجة إطلاقًا.
 */

/** المستوى المقطعي: رمز لكل مقطع. */
function encodeSyllables(syllables, scheme) {
  return syllables
    .map((s) => scheme.map[typeof s === 'string' ? s : s.weight] ?? '?')
    .join(scheme.separator ?? '');
}

/**
 * المستوى الحرفي الخليلي: متحرك/ساكن لكل حرف.
 * يُشتق من شكل المقطع لا من النصّ، فيبقى مستقلًا عن الرسم:
 *   CV = متحرك            → 1
 *   CVV = متحرك + ساكن    → 10   (حرف المدّ ساكن)
 *   CVC = متحرك + ساكن    → 10
 *   CVVC = متحرك + ساكنان → 100
 */
function encodeLetters(syllables, scheme) {
  const moving = scheme.map.moving;
  const still = scheme.map.still;
  return syllables
    .map((s) => {
      const shape = typeof s === 'string' ? shapeFromWeight(s) : s.shape || shapeFromWeight(s.weight);
      switch (shape) {
        case 'CV': return moving;
        case 'CVV':
        case 'CVC': return moving + still;
        case 'CVVC':
        case 'CVCC': return moving + still + still;
        default: return moving;
      }
    })
    .join(scheme.separator ?? '');
}

function shapeFromWeight(w) {
  if (w === 'S') return 'CV';
  if (w === 'X') return 'CVVC';
  return 'CVC';
}

export function createEncoder(encodings) {
  const byId = new Map(encodings.schemes.map((s) => [s.id, s]));

  /**
   * @param {Array} syllables  مقاطع أو حروف S/L/X
   * @param {string} [schemeId]
   */
  function encode(syllables, schemeId = encodings.defaultScheme) {
    const scheme = byId.get(schemeId);
    if (!scheme) throw new Error(`ترميز غير معروف: ${schemeId}`);
    if (scheme.enabled === false || !scheme.map) {
      return {
        schemeId,
        status: scheme.status,
        value: null,
        note: scheme.note,
        resolvedBy: scheme.resolvedBy,
      };
    }
    const value = scheme.level === 'letter'
      ? encodeLetters(syllables, scheme)
      : encodeSyllables(syllables, scheme);
    return { schemeId, status: scheme.status, level: scheme.level, value, note: scheme.note };
  }

  /** كل الترميزات المتاحة دفعةً واحدة — مفيد للتحقق المتقاطع في وضع التتبّع. */
  function encodeAll(syllables) {
    const out = {};
    for (const s of encodings.schemes) out[s.id] = encode(syllables, s.id);
    return out;
  }

  return { encode, encodeAll, schemes: encodings.schemes, internal: encodings.internal };
}
