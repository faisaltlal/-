/**
 * جدول الحروف والحركات. لا منطق هنا — تصنيف فقط.
 *
 * البند 6 من المواصفة: «لا تربط منطق المحرك مباشرة بحروف Unicode».
 * لذلك هذا الملف هو الموضع الوحيد الذي يعرف نقاط Unicode العربية،
 * وكل ما بعده يتعامل مع تصنيفات مجرّدة.
 */

export const HAMZA = 'ء'; // ء
export const ALEF_MADDA = 'آ'; // آ
export const ALEF_HAMZA_ABOVE = 'أ'; // أ
export const WAW_HAMZA = 'ؤ'; // ؤ
export const ALEF_HAMZA_BELOW = 'إ'; // إ
export const YEH_HAMZA = 'ئ'; // ئ
export const ALEF = 'ا'; // ا
export const TEH_MARBUTA = 'ة'; // ة
export const ALEF_MAQSURA = 'ى'; // ى
export const WAW = 'و'; // و
export const YEH = 'ي'; // ي
export const LAM = 'ل'; // ل
export const NOON = 'ن'; // ن
export const TEH = 'ت'; // ت
export const HEH = 'ه'; // ه
export const ALEF_WASLA = 'ٱ'; // ٱ

export const FATHATAN = 'ً'; // ً
export const DAMMATAN = 'ٌ'; // ٌ
export const KASRATAN = 'ٍ'; // ٍ
export const FATHA = 'َ'; // َ
export const DAMMA = 'ُ'; // ُ
export const KASRA = 'ِ'; // ِ
export const SHADDA = 'ّ'; // ّ
export const SUKUN = 'ْ'; // ْ
export const SUPERSCRIPT_ALEF = 'ٰ'; // ٰ
export const TATWEEL = 'ـ'; // ـ

export const SHORT_VOWELS = new Set([FATHA, DAMMA, KASRA]);
export const TANWEEN = new Set([FATHATAN, DAMMATAN, KASRATAN]);
export const DIACRITICS = new Set([
  FATHATAN, DAMMATAN, KASRATAN, FATHA, DAMMA, KASRA, SHADDA, SUKUN,
  SUPERSCRIPT_ALEF,
]);

/** علامات قرآنية وزخرفية لا أثر لها في الوزن. */
export const QURANIC_MARKS = /[ۖ-ۭٓ-ٟـ]/g;

/** كل ما ليس حرفًا عربيًا ولا حركة ولا فراغًا. */
export const NON_ARABIC = /[^ء-يٰٱً-ْ\s]/g;

export const CONSONANT_LETTERS = new Set([
  HAMZA, ALEF_MADDA, ALEF_HAMZA_ABOVE, WAW_HAMZA, ALEF_HAMZA_BELOW, YEH_HAMZA,
  'ب', TEH_MARBUTA, TEH, 'ث', 'ج', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق',
  'ك', LAM, 'م', NOON, HEH, WAW, YEH, ALEF, ALEF_MAQSURA,
  ALEF_WASLA,
]);

/** الحروف التي تُدغم فيها لام التعريف فلا تُنطق اللام. */
export const SUN_LETTERS = new Set([
  TEH, 'ث', 'د', 'ذ', 'ر', 'ز', 'س',
  'ش', 'ص', 'ض', 'ط', 'ظ', LAM, NOON,
]);

export const HAMZA_FORMS = new Set([
  HAMZA, ALEF_MADDA, ALEF_HAMZA_ABOVE, WAW_HAMZA, ALEF_HAMZA_BELOW, YEH_HAMZA,
]);

export function isArabicLetter(ch) {
  return CONSONANT_LETTERS.has(ch);
}

export function isDiacritic(ch) {
  return DIACRITICS.has(ch);
}

export function isSunLetter(ch) {
  return SUN_LETTERS.has(ch);
}

/** جودة الحركة القصيرة التي تحملها العلامة. */
export function vowelQuality(mark) {
  switch (mark) {
    case FATHA:
    case FATHATAN:
      return 'a';
    case DAMMA:
    case DAMMATAN:
      return 'u';
    case KASRA:
    case KASRATAN:
      return 'i';
    default:
      return null;
  }
}

/**
 * الصامت الذي تمثّله صورة الهمزة. كل صور الهمزة صوتها واحد؛
 * الكرسي رسم لا نطق، فلا أثر له في الوزن.
 */
export function hamzaBase(ch) {
  return HAMZA_FORMS.has(ch) ? HAMZA : ch;
}
