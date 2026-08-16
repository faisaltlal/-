import Foundation

/// نتيجة تطبيع النص: النص بعد التنظيف، مقسّمًا إلى كلمات، مع إحصاء التشكيل ورصد أي محتوى غير عربي تم تجاهله.
struct NormalizedText {
    let words: [String]
    let hadNonArabicContent: Bool
    let diacriticCoverageRatio: Double
    let joinedNormalized: String
}

/// يطبّع نص بيت شعري خام: يزيل التطويل والمسافات الزائدة وعلامات الترقيم والمحتوى غير العربي (أرقام/إيموجي/لاتيني)،
/// دون أن يُسقط أي حرف عربي أو تشكيل، ويُبقي بنية الكلمات كما هي لتطبيق قواعد بداية/نهاية الكلمة لاحقًا.
enum TextNormalizer {
    static func normalize(_ raw: String) -> NormalizedText {
        var hadNonArabic = false
        var totalLetters = 0
        var diacriticizedLetters = 0

        // إزالة التطويل أولًا (تشكيل بصري بحت لا يؤثر على النطق).
        let withoutTatweel = String(raw.unicodeScalars.filter { $0 != Arabic.tatweel })

        var currentWord = ""
        var words: [String] = []

        func flushWord() {
            if !currentWord.isEmpty {
                words.append(currentWord)
                currentWord = ""
            }
        }

        for character in withoutTatweel {
            if character.isWhitespace || character.isNewline {
                flushWord()
                continue
            }
            if Arabic.ignorablePunctuation.contains(character) {
                flushWord()
                continue
            }

            // نفحص الحرف الأساس (أول Unicode Scalar غير تشكيلي) لتحديد هل هو حرف عربي معترف به.
            let baseScalar = character.unicodeScalars.first { scalar in
                scalar != Arabic.shadda && scalar != Arabic.fatha && scalar != Arabic.damma
                    && scalar != Arabic.kasra && scalar != Arabic.sukun && scalar != Arabic.fathatan
                    && scalar != Arabic.dammatan && scalar != Arabic.kasratan
                    && scalar != Arabic.maddahAbove && scalar != Arabic.superscriptAlef
            }

            guard let base = baseScalar, Arabic.isArabicBaseLetter(Character(base)) else {
                // رمز غير عربي (رقم، إيموجي، حرف لاتيني...): يُتجاهل تمامًا ولا يُدرج في أي كلمة، بلا أي عطل.
                hadNonArabic = true
                flushWord()
                continue
            }

            totalLetters += 1
            let hasDiacritic = character.unicodeScalars.contains {
                $0 == Arabic.shadda || $0 == Arabic.fatha || $0 == Arabic.damma || $0 == Arabic.kasra
                    || $0 == Arabic.sukun || $0 == Arabic.fathatan || $0 == Arabic.dammatan || $0 == Arabic.kasratan
            }
            if hasDiacritic { diacriticizedLetters += 1 }

            currentWord.append(character)
        }
        flushWord()

        let ratio = totalLetters == 0 ? 0.0 : Double(diacriticizedLetters) / Double(totalLetters)

        return NormalizedText(
            words: words,
            hadNonArabicContent: hadNonArabic,
            diacriticCoverageRatio: ratio,
            joinedNormalized: words.joined(separator: " ")
        )
    }
}
