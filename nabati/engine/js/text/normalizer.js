/**
 * TextNormalizer — طبقة التطبيع.
 *
 * قاعدة حاكمة: لا يُحذف شيء يؤثر في النطق. كل ما يُحذف يُسجَّل في
 * `removed` حتى يكون القرار مرئيًا في وضع التتبّع.
 *
 * ما لا يفعله هذا الملف عمدًا:
 *  - لا يوحّد صور الهمزة (أ إ آ ؤ ئ) بألف مجرّدة: الهمزة صامت، وحذفها
 *    يغيّر عدد الأصوات ومن ثمّ الوزن. توحيد صور الهمزة يقع في طبقة
 *    الأصوات حيث تُردّ كلها إلى الصامت نفسه دون فقد.
 *  - لا يحذف التشكيل: الحركات هي المعلومة التي يقوم عليها التقطيع كله.
 */

import {
  TATWEEL, QURANIC_MARKS, NON_ARABIC, ALEF_WASLA, ALEF,
  ALEF_MAQSURA, YEH, isDiacritic,
} from '../phonology/letters.js';

/** فواصل الشطرين المعروفة في تدوين الشعر. */
const HEMISTICH_SEPARATORS = /\s*(?:\.{3,}|…|\*+|\|{1,2}|-{2,}|\t| {2,})\s*/;

const PUNCTUATION = /[.,;:!?"'«»()\[\]{}—–،؛؟]/g;

/**
 * @param {string} raw
 * @param {{ unifyYehMaqsura?: boolean }} [options]
 * @returns {{
 *   text: string, words: {text:string, index:number}[],
 *   removed: {what:string, why:string, count:number}[],
 *   hasDiacritics: boolean, vocalizationCoverage: number
 * }}
 */
export function normalize(raw, options = {}) {
  const removed = [];
  const note = (what, why, count) => {
    if (count > 0) removed.push({ what, why, count });
  };

  let text = String(raw ?? '');

  // 1) تطبيع Unicode: يفكّك الصور المركّبة فتصبح الحركات قابلة للفحص.
  text = text.normalize('NFC');

  // 2) التطويل — زخرفة خطية بحتة.
  const tatweelCount = (text.match(new RegExp(TATWEEL, 'g')) || []).length;
  text = text.split(TATWEEL).join('');
  note('التطويل', 'زخرفة خطية لا صوت لها', tatweelCount);

  // 3) العلامات القرآنية وعلامات الوقف.
  const quranic = (text.match(QURANIC_MARKS) || []).length;
  text = text.replace(QURANIC_MARKS, '');
  note('علامات الضبط القرآني', 'علامات تجويد لا تغيّر الكمّية الصوتية', quranic);

  // 4) الترقيم — يُبدَّل بفراغ لئلا تلتصق كلمتان فيُقرآ كلمة واحدة.
  const punct = (text.match(PUNCTUATION) || []).length;
  text = text.replace(PUNCTUATION, ' ');
  note('الترقيم', 'لا أثر له في الوزن، وأُبدل بفراغ حفاظًا على حدود الكلمات', punct);

  // 5) ألف الوصل ٱ ← ا. الصورتان صوت واحد؛ خبر الوصل يُستنتج من السياق
  //    في طبقة الأصوات لا من الرسم.
  const wasla = (text.match(new RegExp(ALEF_WASLA, 'g')) || []).length;
  text = text.split(ALEF_WASLA).join(ALEF);
  note('ألف الوصل ٱ', 'وُحِّدت بالألف؛ حكم الوصل يُشتق من الموضع', wasla);

  // 6) توحيد الياء والألف المقصورة — اختياري وغير مفعَّل افتراضيًا.
  //    السبب: التوحيد محايد عروضيًا أصلًا. ى تُنطق ألفًا طويلة، وي في
  //    آخر الكلمة إما ياء مدّ طويلة وإما صامت؛ والطويل طويل في الحالين،
  //    فكمّية المقطع لا تتغيّر. تركناه اختياريًا لئلا نفقد معلومة بلا مقابل.
  if (options.unifyYehMaqsura) {
    const c = (text.match(new RegExp(ALEF_MAQSURA + '$|' + ALEF_MAQSURA + '(?=\\s)', 'g')) || []).length;
    text = text.replace(new RegExp(ALEF_MAQSURA, 'g'), YEH);
    note('الألف المقصورة', 'وُحِّدت بالياء بطلب صريح — محايد عروضيًا', c);
  }

  // 7) ما تبقّى من رموز أجنبية.
  const foreign = (text.match(NON_ARABIC) || []).length;
  text = text.replace(NON_ARABIC, ' ');
  note('رموز غير عربية', 'لا تمثّل أصواتًا عربية', foreign);

  // 8) ضغط الفراغات.
  text = text.replace(/\s+/g, ' ').trim();

  const words = text.length
    ? text.split(' ').map((w, i) => ({ text: w, index: i }))
    : [];

  const letters = [...text].filter((c) => !isDiacritic(c) && c !== ' ');
  const marks = [...text].filter((c) => isDiacritic(c));
  const coverage = letters.length ? marks.length / letters.length : 0;

  return {
    text,
    words,
    removed,
    hasDiacritics: marks.length > 0,
    vocalizationCoverage: Number(coverage.toFixed(3)),
  };
}

/**
 * يقسم المُدخل إلى أشطر إن وُجد فاصل صريح.
 * لا يخمّن موضع القسمة عند غياب الفاصل — التخمين هناك يقع في المطابق
 * حيث يمكن الحكم عليه بالوزن لا بالحدس.
 */
export function splitHemistichs(raw) {
  const parts = String(raw ?? '')
    .split(HEMISTICH_SEPARATORS)
    .map((p) => p.trim())
    .filter(Boolean);
  return { parts, explicit: parts.length > 1 };
}

/** يقسم قصيدة إلى أبيات على الأسطر. */
export function splitLines(raw) {
  return String(raw ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
