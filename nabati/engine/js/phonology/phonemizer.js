/**
 * ProsodicNormalizer / Phonemizer — من الرسم الإملائي إلى الأصوات.
 *
 * المخرَج «وحدات» (Units). الوحدة = صامت واحد + وصف الحركة التي تليه.
 * اخترنا هذا التمثيل لأن كل مقطع عربي يبدأ بصامت واحد بلا استثناء،
 * فصار المقطع دائمًا «وحدة + (وحدة ساكنة اختيارية)» — وهذا يجعل التقطيع
 * قابلًا للحساب بلا حالات خاصة.
 *
 * وصف الحركة:
 *   { known: true,  length: 'none'|'short'|'long', quality: 'a'|'i'|'u'|null }
 *   { known: false, options: ['none','short'] | ['none','short','long'] }
 *
 * `known:false` هو موضع الغموض كله: نصّ غير مشكول لا يُعرف فيه أمتحرّك
 * الحرف أم ساكن. لا نخمّن هنا — نترك الاحتمالات مفتوحة ويحسمها المطابق
 * بالوزن، فيبقى القرار قابلًا لإعادة الإنتاج والتفسير.
 */

import {
  HAMZA, ALEF, ALEF_MADDA, ALEF_HAMZA_ABOVE, ALEF_HAMZA_BELOW,
  ALEF_MAQSURA, WAW, YEH, LAM, NOON, TEH, HEH, TEH_MARBUTA,
  FATHA, DAMMA, KASRA, SHADDA, SUKUN, SUPERSCRIPT_ALEF,
  TANWEEN, SHORT_VOWELS, isDiacritic, isSunLetter, vowelQuality, hamzaBase,
  HAMZA_FORMS,
} from './letters.js';

const KNOWN = (length, quality) => ({ known: true, length, quality });
const UNKNOWN = (options) => ({ known: false, options });

/** يفصل الكلمة إلى حروف، كل حرف مع علاماته. */
export function splitLetters(word) {
  const out = [];
  for (const ch of word) {
    if (isDiacritic(ch)) {
      if (out.length) out[out.length - 1].marks.push(ch);
      continue;
    }
    out.push({ ch, marks: [] });
  }
  return out;
}

function markVowel(marks) {
  const tanween = marks.find((m) => TANWEEN.has(m));
  if (tanween) return { kind: 'tanween', quality: vowelQuality(tanween) };
  const short = marks.find((m) => SHORT_VOWELS.has(m));
  if (short) return { kind: 'short', quality: vowelQuality(short) };
  if (marks.includes(SUKUN)) return { kind: 'sukun', quality: null };
  if (marks.includes(SUPERSCRIPT_ALEF)) return { kind: 'long', quality: 'a' };
  return { kind: 'none', quality: null };
}

/**
 * هل هذا الحرف حرف مدّ للصامت الذي قبله؟
 * الألف دائمًا مدّ في غير أول الكلمة. الواو والياء يحتملان المدّ
 * والصموت، ولا يُحسم إلا بحركة ما قبلهما.
 */
function materQuality(ch) {
  if (ch === ALEF || ch === ALEF_MAQSURA) return 'a';
  if (ch === WAW) return 'u';
  if (ch === YEH) return 'i';
  return null;
}

function hasOwnVowel(letter) {
  const v = markVowel(letter.marks);
  return v.kind === 'short' || v.kind === 'tanween' || letter.marks.includes(SHADDA);
}

/**
 * ألف التفريق بعد واو الجماعة: تُكتب ولا تُنطق (كتبوا = katabū).
 * الشرط: آخر الكلمة، وقبلها واو غير متحركة، والكلمة أطول من «وا».
 */
function isSilentAlefOfJamaa(letters, i) {
  return (
    i === letters.length - 1 &&
    letters[i].ch === ALEF &&
    i >= 2 &&
    letters[i - 1].ch === WAW &&
    !hasOwnVowel(letters[i - 1])
  );
}

/**
 * @param {{text:string,index:number}[]} words
 * @param {object} lexicon  محتوى data/lexicon.json
 * @param {{ pausalEnd?: boolean }} [options]
 */
export function phonemize(words, lexicon, options = {}) {
  const pausalEnd = options.pausalEnd !== false;
  const units = [];
  const trace = [];
  const push = (u) => { units.push({ ...u, unitIndex: units.length }); };
  const log = (rule, detail) => trace.push({ rule, detail });

  const unwritten = lexicon.unwrittenLongVowels?.words || {};
  const knownVocalizations = lexicon.knownVocalizations?.words || {};
  const waslWords = new Set(lexicon.hamzatWasl?.words || []);
  const silentWaw = new Set(
    (lexicon.silentLetters?.rules || [])
      .filter((r) => r.action === 'drop_final_waw')
      .flatMap((r) => r.words || [])
  );

  for (let w = 0; w < words.length; w++) {
    const isLastWord = w === words.length - 1;
    let surface = words[w].text;

    // كلمات تُنطق فيها ألف لا تُكتب (هذا ← هاذا). استبدال صوتي لا إملائي.
    const bare = [...surface].filter((c) => !isDiacritic(c)).join('');
    if (unwritten[bare]) {
      log('unwrittenLongVowel', `${bare} ← ${unwritten[bare]}`);
      surface = unwritten[bare];
    } else if (surface === bare && knownVocalizations[bare]) {
      // نطق مقرَّر لأداة وظيفية. لا يُطبَّق إلا إذا كانت الكلمة مجرّدة
      // من التشكيل أصلًا — تشكيل الشاعر أولى من الجدول دائمًا.
      log('knownVocalization', `${bare} ← ${knownVocalizations[bare]}`);
      surface = knownVocalizations[bare];
    }

    const letters = splitLetters(surface);
    if (!letters.length) continue;

    let i = 0;
    let geminationEmitted = false;
    const atLineStart = units.length === 0;

    // ---- أل التعريف ----
    // الشرط: ألف مجرّدة + لام + حرف ثالث على الأقل.
    // ملاحظة موثّقة: الخلط بين «ال» التعريف وهمزة وصل الفعل (التقى)
    // محايد عروضيًا — القراءتان تعطيان الكمّيات نفسها — فالخطأ هنا
    // لا يُفسد الوزن. انظر docs/PROSODY.md
    const isArticle =
      letters.length >= 3 &&
      letters[0].ch === ALEF &&
      !letters[0].marks.includes(SHADDA) &&
      letters[1].ch === LAM &&
      !hasOwnVowel(letters[1]);

    if (isArticle) {
      const target = letters[2];
      if (atLineStart) {
        // همزة وصل مبتدأ بها: تُنطق همزةً مفتوحة.
        push({ c: HAMZA, vowel: KNOWN('short', 'a'), word: w, wordInitial: true, source: 'hamzat_wasl' });
        log('hamzatWasl', 'أل في أول الشطر — الهمزة منطوقة');
      } else {
        log('hamzatWasl', 'أل موصولة بما قبلها — الهمزة ساقطة');
      }
      if (isSunLetter(target.ch)) {
        // اللام لا تُنطق، والحرف الشمسي مشدّد: ساكن ثم متحرك.
        push({ c: hamzaBase(target.ch), vowel: KNOWN('none', null), word: w, source: 'lam_shamsiyya' });
        geminationEmitted = true;
        log('lamShamsiyya', `اللام مدغمة في ${target.ch}`);
      } else {
        push({ c: LAM, vowel: KNOWN('none', null), word: w, source: 'lam_qamariyya' });
        log('lamQamariyya', `اللام منطوقة قبل ${target.ch}`);
      }
      i = 2;
    } else if (
      letters[0].ch === ALEF && !atLineStart && waslWords.has(bare)
    ) {
      // همزة وصل معجمية (ابن، اسم…) موصولة بما قبلها: تسقط كلها.
      log('hamzatWasl', `${bare} موصولة — الهمزة ساقطة`);
      i = 1;
    }

    for (; i < letters.length; i++) {
      const L = letters[i];
      const next = letters[i + 1];
      const isLastLetter = i === letters.length - 1;
      const atPause = isLastWord && isLastLetter && pausalEnd;

      // واو عمرو الصامتة
      if (L.ch === WAW && isLastLetter && silentWaw.has(bare)) {
        log('silentWaw', `واو ${bare} غير منطوقة`);
        continue;
      }

      // ألف التفريق
      if (isSilentAlefOfJamaa(letters, i)) {
        log('silentAlef', 'ألف التفريق بعد واو الجماعة غير منطوقة');
        continue;
      }

      const marks = L.marks;
      const v = markVowel(marks);

      // ألف لم يستهلكها النظر المسبق. حالتان:
      //  - في أول الكلمة: همزة قطع.
      //  - في وسطها بعد ساكن: رسم شاذ؛ تُلحق مدًّا بما قبلها لئلا تضيع.
      if (L.ch === ALEF || L.ch === ALEF_MAQSURA) {
        if (i > 0 && units.length) {
          const prev = units[units.length - 1];
          if (prev.vowel.known && prev.vowel.length === 'short') {
            prev.vowel = KNOWN('long', 'a');
          } else if (!prev.vowel.known) {
            prev.vowel = KNOWN('long', 'a');
          }
          log('materFallback', `ألف مدّ ألحقت بـ ${prev.c}`);
          continue;
        }
        // أول الكلمة: همزة قطع.
        push({
          c: HAMZA,
          vowel: v.kind === 'short' ? KNOWN('short', v.quality) : UNKNOWN(['none', 'short']),
          word: w,
          wordInitial: true,
          source: 'hamzat_qat',
        });
        log('hamzatQat', 'ألف ابتدائية عوملت همزة قطع — انظر lexicon.hamzatWasl.verbPrefixes');
        continue;
      }

      // ---- الصامت ----
      let consonant = hamzaBase(L.ch);
      let vowel;

      if (L.ch === ALEF_MADDA) {
        // آ = همزة + ألف مدّ
        consonant = HAMZA;
        vowel = KNOWN('long', 'a');
        push({ c: consonant, vowel, word: w, wordInitial: i === 0, letter: L.ch });
        continue;
      }

      if (L.ch === TEH_MARBUTA) {
        // تاء عند الوصل، هاء عند الوقف.
        consonant = atPause ? HEH : TEH;
        log('taMarbuta', atPause ? 'وقف — تُنطق هاءً' : 'وصل — تُنطق تاءً');
      }

      if (marks.includes(SHADDA) && !geminationEmitted) {
        // المشدّد صوتان: الأول ساكن يغلق ما قبله، والثاني متحرك.
        push({ c: consonant, vowel: KNOWN('none', null), word: w, source: 'shadda' });
        log('shadda', `${L.ch} مشدّد — ساكن ثم متحرك`);
      }
      geminationEmitted = false;

      // ---- الحركة ----
      if (v.kind === 'short' || v.kind === 'tanween') {
        vowel = KNOWN('short', v.quality);
      } else if (v.kind === 'sukun') {
        vowel = KNOWN('none', null);
      } else if (v.kind === 'long') {
        vowel = KNOWN('long', 'a'); // ألف خنجرية
      } else if (L.ch === ALEF_HAMZA_BELOW) {
        vowel = KNOWN('short', 'i'); // إ تحمل الكسر بحكم الرسم
      } else {
        vowel = UNKNOWN(['none', 'short']);
      }

      // ---- المدّ: هل الحرف التالي حرف مدّ لهذا الصامت؟ ----
      let suppressNextIfLong = false;
      if (next && !HAMZA_FORMS.has(next.ch) && vowel.length !== 'none') {
        const q = materQuality(next.ch);
        const nextIsSilentAlef = isSilentAlefOfJamaa(letters, i + 1);
        if (q && !hasOwnVowel(next) && !nextIsSilentAlef) {
          if (next.ch === ALEF || next.ch === ALEF_MAQSURA) {
            // الألف لا تكون إلا مدًّا — لا احتمال آخر.
            vowel = KNOWN('long', 'a');
            i++; // استُهلك حرف المدّ
          } else if (vowel.known && vowel.length === 'short') {
            if (vowel.quality === q) {
              vowel = KNOWN('long', q); // ضمة + واو ساكنة = مدّ
              i++;
            }
            // فتحة + واو/ياء ساكنة = لين (بَيْت): الواو/الياء صامت
            // يغلق المقطع، فتُترك لتُعالَج وحدةً مستقلة.
          } else if (!vowel.known) {
            // غير مشكول: يحتمل المدّ ويحتمل الصموت. نفتح البابين
            // ونترك الحسم للمطابقة بالوزن.
            vowel = UNKNOWN(['none', 'short', 'long']);
            vowel.longQuality = q;
            suppressNextIfLong = true;
          }
        }
      }

      push({
        c: consonant,
        vowel,
        word: w,
        wordInitial: i === 0,
        wordFinal: isLastLetter,
        atPause,
        suppressNextIfLong,
        letter: L.ch,
      });

      if (v.kind === 'tanween') {
        // التنوين نون ساكنة في النطق: كتابٌ = كتابن.
        push({ c: NOON, vowel: KNOWN('none', null), word: w, source: 'tanween' });
        log('tanween', 'التنوين نون ساكنة');
      }
    }
  }

  // آخر وحدة في الشطر: لا يقع بعدها إعراب، فاحتمال «متحرك» يبقى
  // قائمًا لأجل الإشباع، ويتكفّل به بناء المقاطع.
  if (units.length) units[units.length - 1].isFinal = true;

  return { units, trace };
}
