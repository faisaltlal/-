import Foundation

/// يحوّل قائمة كلمات مُطبَّعة إلى تسلسل من `ProsodicUnit` (الكتابة العروضية)، مطبِّقًا قواعد علم العروض
/// العربي الكلاسيكية: الشدة، السكون، التنوين، المد (بحروف العلة الثلاثة)، همزة الوصل، اللام الشمسية/القمرية،
/// تاء التأنيث المربوطة، ولفظ الجلالة. راجع `POETRY_ENGINE.md` لشرح كل قاعدة مع مثال.
///
/// **قيد موثَّق:** عند غياب التشكيل عن حرف، يفترض المحرك حركة الفتحة كقيمة افتراضية (لا يوجد نموذج تشكيل تلقائي
/// كامل). هذا يقلّل الدقة، ويُعبَّر عنه بانخفاض حقل `confidence` في النتيجة النهائية، لا بفشل التحليل.
enum ProsodicTranscriber {
    private struct Decomposed {
        let base: Character?
        let shadda: Bool
        let vowel: Harakah?
        let sukun: Bool
        let tanwin: Harakah?
    }

    private static func decompose(_ character: Character) -> Decomposed {
        var base: Unicode.Scalar?
        var shadda = false
        var vowel: Harakah?
        var sukun = false
        var tanwin: Harakah?

        for scalar in character.unicodeScalars {
            switch scalar {
            case Arabic.shadda: shadda = true
            case Arabic.fatha: vowel = .fatha
            case Arabic.damma: vowel = .damma
            case Arabic.kasra: vowel = .kasra
            case Arabic.sukun: sukun = true
            case Arabic.fathatan: tanwin = .fatha
            case Arabic.dammatan: tanwin = .damma
            case Arabic.kasratan: tanwin = .kasra
            case Arabic.maddahAbove, Arabic.superscriptAlef: break
            default: base = scalar
            }
        }
        return Decomposed(base: base.map { Character($0) }, shadda: shadda, vowel: vowel, sukun: sukun, tanwin: tanwin)
    }

    /// يحوّل تسلسل كلمات (شطر واحد عادة) إلى وحدات عروضية، مع النص العروضي المقابل لعرضه.
    static func transcribe(words: [String], isAbsoluteStart: Bool) -> (units: [ProsodicUnit], prosodicText: String) {
        var allUnits: [ProsodicUnit] = []
        for (index, word) in words.enumerated() {
            let isFirst = isAbsoluteStart && index == 0
            let isLastWordOfHemistich = index == words.count - 1
            let wordUnits = expandWord(word, wordIndex: index, isFirstWordOfSequence: isFirst, isLastWordOfHemistich: isLastWordOfHemistich)
            allUnits.append(contentsOf: wordUnits)
        }
        let prosodicText = allUnits.map(\.display).joined(separator: " ")
        return (allUnits, prosodicText)
    }

    // MARK: - معالجة كلمة واحدة

    private static func expandWord(
        _ word: String, wordIndex: Int, isFirstWordOfSequence: Bool, isLastWordOfHemistich: Bool
    ) -> [ProsodicUnit] {
        let chars = Array(word)
        guard !chars.isEmpty else { return [] }

        let strippedForm = String(chars.compactMap { decompose($0).base })
        if let jalala = jalalaSpecialCase(strippedForm: strippedForm, wordIndex: wordIndex, isFirstWordOfSequence: isFirstWordOfSequence) {
            return jalala
        }

        var units: [ProsodicUnit] = []
        var lastVowel: Harakah?
        var i = 0

        i = handleDefiniteArticleIfPresent(
            chars: chars, wordIndex: wordIndex, isFirstWordOfSequence: isFirstWordOfSequence,
            units: &units, lastVowel: &lastVowel
        )

        while i < chars.count {
            let character = chars[i]
            let d = decompose(character)
            guard let base = d.base else { i += 1; continue }

            if base == Arabic.taMarbuta {
                if isLastWordOfHemistich {
                    units.append(ProsodicUnit(display: "هْ", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
                    lastVowel = nil
                } else {
                    let vowel = d.vowel ?? .fatha
                    units.append(ProsodicUnit(display: "تَ", isMutaharrik: true, harakah: vowel, wordIndex: wordIndex))
                    lastVowel = vowel
                }
                i += 1
                continue
            }

            if base == Arabic.alefMadda {
                units.append(ProsodicUnit(display: "أَ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex))
                units.append(ProsodicUnit(display: "ا", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
                lastVowel = nil
                i += 1
                continue
            }

            if (base == Arabic.alef || base == Arabic.alefMaqsura), d.vowel == nil, d.sukun == false, d.tanwin == nil {
                let previousWasFathatan = i > 0 && decompose(chars[i - 1]).tanwin == .fatha
                if previousWasFathatan {
                    // الألف الفارقة الزائدة كتابيًا بعد تنوين الفتح (مثل "كتابًا"): تُهمَل كليًا، لا تُنطق.
                    i += 1
                    continue
                }
                if lastVowel == .fatha || i > 0 {
                    units.append(ProsodicUnit(display: "ا", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
                    lastVowel = nil
                } else {
                    // ألف في أول كلمة بلا همزة ظاهرة ولا سياق مدّ: حالة نادرة، افتراض فتحة قصيرة.
                    units.append(ProsodicUnit(display: "اَ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex))
                    lastVowel = .fatha
                }
                i += 1
                continue
            }

            let produced = expandConsonant(d, wordIndex: wordIndex, lastVowel: &lastVowel)
            units.append(contentsOf: produced)
            i += 1
        }

        return units
    }

    /// يكتشف "أل" التعريف (وحدها أو مسبوقة بحرف جر/عطف واحد متصل مثل و/ف/ب/ك/ل) ويطبّق قاعدة
    /// اللام الشمسية (إدغام + تشديد الحرف التالي) أو القمرية (إبقاء اللام ساكنة)، بالإضافة إلى همزة الوصل
    /// (تُنطق فتحًا عند الابتداء المطلق بالبيت، وتُحذف عروضيًا في الوصل). يُعيد الفهرس التالي الواجب متابعة المسح منه.
    private static func handleDefiniteArticleIfPresent(
        chars: [Character], wordIndex: Int, isFirstWordOfSequence: Bool,
        units: inout [ProsodicUnit], lastVowel: inout Harakah?
    ) -> Int {
        let attachablePrefixes: Set<Character> = ["و", "ف", "ب", "ك", "ل"]

        var alIndex: Int?
        var prefixChar: Character?

        if chars.count >= 2 {
            let d0 = decompose(chars[0])
            let d1 = decompose(chars[1])
            if d0.base == Arabic.alef, d0.vowel == nil, d0.sukun == false, d0.tanwin == nil, d1.base == Arabic.lam {
                alIndex = 0
            }
        }
        if alIndex == nil, chars.count >= 3, let p0 = decompose(chars[0]).base, attachablePrefixes.contains(p0) {
            let d1 = decompose(chars[1])
            let d2 = decompose(chars[2])
            if d1.base == Arabic.alef, d1.vowel == nil, d1.sukun == false, d1.tanwin == nil, d2.base == Arabic.lam {
                alIndex = 1
                prefixChar = p0
            }
        }

        guard let definiteArticleIndex = alIndex else { return 0 }

        if let prefix = prefixChar {
            units.append(ProsodicUnit(display: String(prefix) + "َ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex))
            lastVowel = .fatha
        }

        let isAbsoluteStartOfArticle = isFirstWordOfSequence && definiteArticleIndex == 0
        if isAbsoluteStartOfArticle {
            // همزة الوصل الخاصة بـ"أل" التعريف تُنطق دائمًا بالفتح عند الابتداء بها (خلافًا لهمزات الوصل الأخرى).
            units.append(ProsodicUnit(display: "اَ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex))
            lastVowel = .fatha
        }
        // في غير حالة الابتداء المطلق، همزة الوصل تُحذف عروضيًا تمامًا (توصَل بما قبلها) ولا تُضاف لها وحدة.

        let sunLetterIndex = definiteArticleIndex + 2
        let sunLetterFollows: Bool = {
            guard sunLetterIndex < chars.count, let b = decompose(chars[sunLetterIndex]).base else { return false }
            return Arabic.isSunLetter(b)
        }()

        if sunLetterFollows {
            // الحرف الشمسي يُستهلَك هنا مباشرة (مضعَّفًا)، فنتخطاه في المسح الرئيسي.
            var shamsi = decompose(chars[sunLetterIndex])
            shamsi = Decomposed(base: shamsi.base, shadda: true, vowel: shamsi.vowel, sukun: shamsi.sukun, tanwin: shamsi.tanwin)
            units.append(contentsOf: expandConsonant(shamsi, wordIndex: wordIndex, lastVowel: &lastVowel))
            return sunLetterIndex + 1
        } else {
            // الحرف القمري لم يُعالَج بعد (فقط تأكَّدنا أنه ليس شمسيًا)؛ يبقى للمسح الرئيسي معالجته بنفسه.
            units.append(ProsodicUnit(display: "لْ", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
            lastVowel = nil
            return sunLetterIndex
        }
    }

    /// يوسّع حرفًا صامتًا (بما فيها الحرف المضعَّف بالشدة) إلى وحدة أو أكثر، مطبِّقًا قاعدتَي الشدة والتنوين،
    /// وقاعدة مدّ الواو/الياء (تُعامَلان كامتداد ساكن حين تردان بلا تشكيل بعد ضمة/كسرة مجانسة على التوالي).
    private static func expandConsonant(_ d: Decomposed, wordIndex: Int, lastVowel: inout Harakah?) -> [ProsodicUnit] {
        guard let base = d.base else { return [] }
        var result: [ProsodicUnit] = []

        if d.shadda {
            result.append(ProsodicUnit(display: String(base), isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
            if let tanwin = d.tanwin {
                result.append(ProsodicUnit(display: String(base) + String(tanwin.diacriticScalar), isMutaharrik: true, harakah: tanwin, wordIndex: wordIndex))
                result.append(ProsodicUnit(display: "نْ", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
                lastVowel = nil
            } else {
                let vowel = d.vowel ?? .fatha
                result.append(ProsodicUnit(display: String(base) + String(vowel.diacriticScalar), isMutaharrik: true, harakah: vowel, wordIndex: wordIndex))
                lastVowel = vowel
            }
            return result
        }

        if let tanwin = d.tanwin {
            result.append(ProsodicUnit(display: String(base) + String(tanwin.diacriticScalar), isMutaharrik: true, harakah: tanwin, wordIndex: wordIndex))
            result.append(ProsodicUnit(display: "نْ", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
            lastVowel = nil
            return result
        }

        if let vowel = d.vowel {
            result.append(ProsodicUnit(display: String(base) + String(vowel.diacriticScalar), isMutaharrik: true, harakah: vowel, wordIndex: wordIndex))
            lastVowel = vowel
            return result
        }

        if d.sukun {
            result.append(ProsodicUnit(display: String(base) + "ْ", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
            lastVowel = nil
            return result
        }

        if base == Arabic.waw, lastVowel == .damma {
            result.append(ProsodicUnit(display: "و", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
            lastVowel = nil
            return result
        }
        if base == Arabic.ya, lastVowel == .kasra {
            result.append(ProsodicUnit(display: "ي", isMutaharrik: false, harakah: nil, wordIndex: wordIndex))
            lastVowel = nil
            return result
        }

        // حرف بلا أي تشكيل مكتوب: افتراض موثَّق بالفتحة (يُخفَّض `confidence` الكلي عند حدوث هذا كثيرًا).
        result.append(ProsodicUnit(display: String(base) + "َ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex))
        lastVowel = .fatha
        return result
    }

    // MARK: - لفظ الجلالة

    /// حالة خاصة صريحة للفظ الجلالة وصوره المتصلة الشائعة، لأن نطقه الفعلي (بمدّ غير مكتوب بعد اللام المشددة)
    /// يخرج عن القواعد العامة أعلاه، وهو من أكثر الكلمات ورودًا في الشعر النبطي.
    private static func jalalaSpecialCase(
        strippedForm: String, wordIndex: Int, isFirstWordOfSequence: Bool
    ) -> [ProsodicUnit]? {
        func lillahCore() -> [ProsodicUnit] {
            [
                ProsodicUnit(display: "لّ", isMutaharrik: false, harakah: nil, wordIndex: wordIndex),
                ProsodicUnit(display: "لَ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex),
                ProsodicUnit(display: "ا", isMutaharrik: false, harakah: nil, wordIndex: wordIndex),
                ProsodicUnit(display: "هْ", isMutaharrik: false, harakah: nil, wordIndex: wordIndex)
            ]
        }

        switch strippedForm {
        case "الله":
            if isFirstWordOfSequence {
                return [ProsodicUnit(display: "اَ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex)] + lillahCore()
            }
            return lillahCore()
        case "لله":
            return [ProsodicUnit(display: "لِ", isMutaharrik: true, harakah: .kasra, wordIndex: wordIndex)] + lillahCore()
        case "والله", "فالله", "بالله", "كالله", "تالله":
            let prefix = strippedForm.first!
            return [ProsodicUnit(display: String(prefix) + "َ", isMutaharrik: true, harakah: .fatha, wordIndex: wordIndex)] + lillahCore()
        default:
            return nil
        }
    }
}
