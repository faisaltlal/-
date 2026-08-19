import Foundation

/// التطبيع وتحويل الرسم إلى أصوات.
///
/// تحذير تنفيذي مهم: في Swift يضمّ `Character` الحرفَ وحركته في عنقود
/// واحد («مَ» حرف واحد لا حرفان)، فالعمل على `Character` يخفي التشكيل
/// كله. لذلك تعمل هذه الطبقة على `Unicode.Scalar` حصرًا.

// MARK: - جدول الحروف

public enum Ar {
    public static let hamza: Unicode.Scalar = "\u{0621}"       // ء
    public static let alefMadda: Unicode.Scalar = "\u{0622}"   // آ
    public static let alefHamzaAbove: Unicode.Scalar = "\u{0623}" // أ
    public static let wawHamza: Unicode.Scalar = "\u{0624}"    // ؤ
    public static let alefHamzaBelow: Unicode.Scalar = "\u{0625}" // إ
    public static let yehHamza: Unicode.Scalar = "\u{0626}"    // ئ
    public static let alef: Unicode.Scalar = "\u{0627}"        // ا
    public static let tehMarbuta: Unicode.Scalar = "\u{0629}"  // ة
    public static let teh: Unicode.Scalar = "\u{062A}"         // ت
    public static let lam: Unicode.Scalar = "\u{0644}"         // ل
    public static let noon: Unicode.Scalar = "\u{0646}"        // ن
    public static let heh: Unicode.Scalar = "\u{0647}"         // ه
    public static let waw: Unicode.Scalar = "\u{0648}"         // و
    public static let alefMaqsura: Unicode.Scalar = "\u{0649}" // ى
    public static let yeh: Unicode.Scalar = "\u{064A}"         // ي
    public static let alefWasla: Unicode.Scalar = "\u{0671}"   // ٱ

    public static let fathatan: Unicode.Scalar = "\u{064B}"
    public static let dammatan: Unicode.Scalar = "\u{064C}"
    public static let kasratan: Unicode.Scalar = "\u{064D}"
    public static let fatha: Unicode.Scalar = "\u{064E}"
    public static let damma: Unicode.Scalar = "\u{064F}"
    public static let kasra: Unicode.Scalar = "\u{0650}"
    public static let shadda: Unicode.Scalar = "\u{0651}"
    public static let sukun: Unicode.Scalar = "\u{0652}"
    public static let superscriptAlef: Unicode.Scalar = "\u{0670}"
    public static let tatweel: Unicode.Scalar = "\u{0640}"

    public static let tanween: Set<Unicode.Scalar> = [fathatan, dammatan, kasratan]
    public static let shortVowels: Set<Unicode.Scalar> = [fatha, damma, kasra]
    public static let diacritics: Set<Unicode.Scalar> = [
        fathatan, dammatan, kasratan, fatha, damma, kasra, shadda, sukun, superscriptAlef,
    ]
    public static let hamzaForms: Set<Unicode.Scalar> = [
        hamza, alefMadda, alefHamzaAbove, wawHamza, alefHamzaBelow, yehHamza,
    ]

    public static func isDiacritic(_ s: Unicode.Scalar) -> Bool { diacritics.contains(s) }

    public static func isArabicLetter(_ s: Unicode.Scalar) -> Bool {
        (s.value >= 0x0621 && s.value <= 0x064A) || s == alefWasla
    }

    public static func vowelQuality(_ s: Unicode.Scalar) -> String? {
        switch s {
        case fatha, fathatan: return "a"
        case damma, dammatan: return "u"
        case kasra, kasratan: return "i"
        default: return nil
        }
    }

    /// كل صور الهمزة صوت واحد؛ الكرسي رسم لا نطق.
    public static func hamzaBase(_ s: Unicode.Scalar) -> Unicode.Scalar {
        hamzaForms.contains(s) ? hamza : s
    }
}

// MARK: - التطبيع

public struct RemovedItem: Sendable {
    public let what: String
    public let why: String
    public let count: Int
}

public struct NormalizedText: Sendable {
    public let text: String
    public let words: [String]
    public let removed: [RemovedItem]
    public let hasDiacritics: Bool
    public let vocalizationCoverage: Double
}

/// أدوات نصّية خالصة.
///
/// مكتوبة يدويًا عمدًا بدل `trimmingCharacters` و`components(separatedBy:)`:
/// تلك تعبر جسر NSString في Foundation على لينكس، وقد أسقطت الاختبارات
/// هناك بـ «Constant strings cannot be deallocated» عند تمرير نصّ حرفي.
/// المحرك لا يحتاج Foundation إلا لفكّ ترميز JSON، فأبقيناها هناك وحدها.
enum PureText {
    static func trim(_ s: String) -> String {
        var scalars = Array(s.unicodeScalars)
        while let f = scalars.first, isSpace(f) { scalars.removeFirst() }
        while let l = scalars.last, isSpace(l) { scalars.removeLast() }
        var view = String.UnicodeScalarView()
        for c in scalars { view.append(c) }
        return String(view)
    }

    static func isSpace(_ s: Unicode.Scalar) -> Bool {
        s == " " || s == "\t" || s == "\n" || s == "\r"
    }

    /// تقسيم على فاصل نصّي، بلا Foundation.
    static func split(_ s: String, by separator: String) -> [String] {
        guard !separator.isEmpty else { return [s] }
        let hay = Array(s.unicodeScalars)
        let needle = Array(separator.unicodeScalars)
        var out: [String] = []
        var current = String.UnicodeScalarView()
        var i = 0
        while i < hay.count {
            if i + needle.count <= hay.count,
               Array(hay[i..<(i + needle.count)]) == needle {
                out.append(String(current))
                current = String.UnicodeScalarView()
                i += needle.count
            } else {
                current.append(hay[i])
                i += 1
            }
        }
        out.append(String(current))
        return out
    }

    static func splitLines(_ s: String) -> [String] {
        var out: [String] = []
        var current = String.UnicodeScalarView()
        for c in s.unicodeScalars {
            if c == "\n" || c == "\r" {
                out.append(String(current))
                current = String.UnicodeScalarView()
            } else {
                current.append(c)
            }
        }
        out.append(String(current))
        return out
    }
}

public enum TextNormalizer {
    private static let punctuation: Set<Unicode.Scalar> = [
        ".", ",", ";", ":", "!", "?", "\"", "'", "«", "»", "(", ")",
        "[", "]", "{", "}", "—", "–", "\u{060C}", "\u{061B}", "\u{061F}",
    ]

    public static func normalize(_ raw: String) -> NormalizedText {
        var removed: [RemovedItem] = []
        var tatweelCount = 0
        var punctCount = 0
        var foreignCount = 0
        var waslaCount = 0

        var out = String.UnicodeScalarView()
        for s in raw.unicodeScalars {
            if s == Ar.tatweel { tatweelCount += 1; continue }
            if s == Ar.alefWasla { waslaCount += 1; out.append(Ar.alef); continue }
            if punctuation.contains(s) { punctCount += 1; out.append(" "); continue }
            if s == " " || s == "\n" || s == "\t" { out.append(" "); continue }
            // علامات الضبط القرآني ونحوها
            if s.value >= 0x0653 && s.value <= 0x065F { continue }
            if s.value >= 0x06D6 && s.value <= 0x06ED { continue }
            if Ar.isArabicLetter(s) || Ar.isDiacritic(s) { out.append(s); continue }
            foreignCount += 1
            out.append(" ")
        }

        if tatweelCount > 0 { removed.append(.init(what: "التطويل", why: "زخرفة خطية لا صوت لها", count: tatweelCount)) }
        if waslaCount > 0 { removed.append(.init(what: "ألف الوصل ٱ", why: "وُحِّدت بالألف؛ حكم الوصل يُشتق من الموضع", count: waslaCount)) }
        if punctCount > 0 { removed.append(.init(what: "الترقيم", why: "أُبدل بفراغ حفاظًا على حدود الكلمات", count: punctCount)) }
        if foreignCount > 0 { removed.append(.init(what: "رموز غير عربية", why: "لا تمثّل أصواتًا عربية", count: foreignCount)) }

        let words = String(out)
            .split(separator: " ", omittingEmptySubsequences: true)
            .map(String.init)
        let text = words.joined(separator: " ")

        var letters = 0
        var marks = 0
        for s in text.unicodeScalars {
            if Ar.isDiacritic(s) { marks += 1 } else if s != " " { letters += 1 }
        }
        let coverage = letters > 0 ? Double(marks) / Double(letters) : 0

        return NormalizedText(
            text: text, words: words, removed: removed,
            hasDiacritics: marks > 0,
            vocalizationCoverage: (coverage * 1000).rounded() / 1000
        )
    }

    /// يقسم على الفاصل الصريح فقط — لا تخمين لموضع القسمة.
    public static func splitHemistichs(_ raw: String) -> (parts: [String], explicit: Bool) {
        let markers = ["...", "\u{2026}", "**", "*", "||", "|", "--", "\t"]
        var pieces = [raw]
        for m in markers where raw.contains(m) {
            pieces = pieces.flatMap { PureText.split($0, by: m) }
        }
        let cleaned = pieces.map { PureText.trim($0) }.filter { !$0.isEmpty }
        return (cleaned, cleaned.count > 1)
    }

    public static func splitLines(_ raw: String) -> [String] {
        PureText.splitLines(raw).map { PureText.trim($0) }.filter { !$0.isEmpty }
    }
}

// MARK: - الوحدات الصوتية

/// وصف الحركة التي تلي الصامت.
public enum VowelSpec: Sendable, Equatable {
    case known(length: Length, quality: String?)
    case unknown(options: Set<Length>, longQuality: String?)

    public enum Length: String, Sendable { case none, short, long }

    public var isKnown: Bool { if case .known = self { return true }; return false }

    public var knownLength: Length? {
        if case .known(let l, _) = self { return l }
        return nil
    }

    /// ساكن يقينًا. خاصية مستقلة عمدًا: `knownLength == .none` تلتبس
    /// بـ `Optional.none` فتعني «مجهول» بدل «ساكن»، وهو عكس المراد
    /// تمامًا. المترجم يحذّر منها ولا يمنعها.
    public var isSilent: Bool {
        if case .known(let l, _) = self { return l == .none }
        return false
    }

    public func allows(_ l: Length) -> Bool {
        switch self {
        case .known(let k, _): return k == l
        case .unknown(let opts, _): return opts.contains(l)
        }
    }
}

/// صامت واحد مع حركته. كل مقطع عربي = وحدة + وحدة ساكنة اختيارية.
public struct PhonUnit: Sendable {
    public var consonant: Unicode.Scalar
    public var vowel: VowelSpec
    public var word: Int
    public var suppressNextIfLong: Bool = false
    public var source: String? = nil
}

public struct PhonemizeResult: Sendable {
    public let units: [PhonUnit]
    public let trace: [String]
}

public struct Phonemizer: Sendable {
    let lexicon: Lexicon

    public init(lexicon: Lexicon) { self.lexicon = lexicon }

    private struct Letter { var ch: Unicode.Scalar; var marks: [Unicode.Scalar] }

    private func splitLetters(_ word: String) -> [Letter] {
        var out: [Letter] = []
        for s in word.unicodeScalars {
            if Ar.isDiacritic(s) {
                if !out.isEmpty { out[out.count - 1].marks.append(s) }
                continue
            }
            out.append(Letter(ch: s, marks: []))
        }
        return out
    }

    private enum MarkKind { case tanween, short, sukun, long, none }

    private func markVowel(_ marks: [Unicode.Scalar]) -> (kind: MarkKind, quality: String?) {
        if let t = marks.first(where: { Ar.tanween.contains($0) }) { return (.tanween, Ar.vowelQuality(t)) }
        if let s = marks.first(where: { Ar.shortVowels.contains($0) }) { return (.short, Ar.vowelQuality(s)) }
        if marks.contains(Ar.sukun) { return (.sukun, nil) }
        if marks.contains(Ar.superscriptAlef) { return (.long, "a") }
        return (.none, nil)
    }

    private func hasOwnVowel(_ l: Letter) -> Bool {
        let v = markVowel(l.marks)
        return v.kind == .short || v.kind == .tanween || l.marks.contains(Ar.shadda)
    }

    private func materQuality(_ ch: Unicode.Scalar) -> String? {
        if ch == Ar.alef || ch == Ar.alefMaqsura { return "a" }
        if ch == Ar.waw { return "u" }
        if ch == Ar.yeh { return "i" }
        return nil
    }

    /// ألف التفريق بعد واو الجماعة: تُكتب ولا تُنطق.
    private func isSilentAlefOfJamaa(_ letters: [Letter], _ i: Int) -> Bool {
        i == letters.count - 1 && letters[i].ch == Ar.alef && i >= 2
            && letters[i - 1].ch == Ar.waw && !hasOwnVowel(letters[i - 1])
    }

    public func phonemize(words: [String], pausalEnd: Bool = true) -> PhonemizeResult {
        var units: [PhonUnit] = []
        var trace: [String] = []
        let unwritten = lexicon.unwrittenLongVowels?.words ?? [:]
        let knownVoc = lexicon.knownVocalizations?.words ?? [:]
        let waslWords = Set(lexicon.hamzatWasl?.words ?? [])
        let sunLetters = Set(lexicon.sunLetters.compactMap { $0.unicodeScalars.first })
        let silentWawWords = Set(
            (lexicon.silentLetters?.rules ?? [])
                .filter { $0.action == "drop_final_waw" }
                .flatMap { $0.words ?? [] }
        )

        for (w, original) in words.enumerated() {
            let isLastWord = w == words.count - 1
            var surface = original
            var bareView = String.UnicodeScalarView()
            for c in original.unicodeScalars where !Ar.isDiacritic(c) { bareView.append(c) }
            let bare = String(bareView)

            if let rep = unwritten[bare] {
                trace.append("unwrittenLongVowel: \(bare) ← \(rep)")
                surface = rep
            } else if surface == bare, let rep = knownVoc[bare] {
                trace.append("knownVocalization: \(bare) ← \(rep)")
                surface = rep
            }

            let letters = splitLetters(surface)
            if letters.isEmpty { continue }

            var i = 0
            var geminationEmitted = false
            let atLineStart = units.isEmpty

            // أل التعريف
            let isArticle = letters.count >= 3 && letters[0].ch == Ar.alef
                && !letters[0].marks.contains(Ar.shadda)
                && letters[1].ch == Ar.lam && !hasOwnVowel(letters[1])

            if isArticle {
                let target = letters[2]
                if atLineStart {
                    units.append(PhonUnit(consonant: Ar.hamza, vowel: .known(length: .short, quality: "a"), word: w, source: "hamzat_wasl"))
                    trace.append("hamzatWasl: أل في أول الشطر — الهمزة منطوقة")
                } else {
                    trace.append("hamzatWasl: أل موصولة — الهمزة ساقطة")
                }
                if sunLetters.contains(target.ch) {
                    units.append(PhonUnit(consonant: Ar.hamzaBase(target.ch), vowel: .known(length: .none, quality: nil), word: w, source: "lam_shamsiyya"))
                    geminationEmitted = true
                    trace.append("lamShamsiyya: اللام مدغمة")
                } else {
                    units.append(PhonUnit(consonant: Ar.lam, vowel: .known(length: .none, quality: nil), word: w, source: "lam_qamariyya"))
                    trace.append("lamQamariyya: اللام منطوقة")
                }
                i = 2
            } else if letters[0].ch == Ar.alef && !atLineStart && waslWords.contains(bare) {
                trace.append("hamzatWasl: \(bare) موصولة — الهمزة ساقطة")
                i = 1
            }

            while i < letters.count {
                let L = letters[i]
                let isLastLetter = i == letters.count - 1
                let atPause = isLastWord && isLastLetter && pausalEnd

                if L.ch == Ar.waw && isLastLetter && silentWawWords.contains(bare) {
                    trace.append("silentWaw: واو \(bare) غير منطوقة")
                    i += 1; continue
                }
                if isSilentAlefOfJamaa(letters, i) {
                    trace.append("silentAlef: ألف التفريق غير منطوقة")
                    i += 1; continue
                }

                let v = markVowel(L.marks)

                // ألف لم يستهلكها النظر المسبق
                if L.ch == Ar.alef || L.ch == Ar.alefMaqsura {
                    if i > 0, !units.isEmpty {
                        units[units.count - 1].vowel = .known(length: .long, quality: "a")
                        trace.append("materFallback: ألف مدّ ألحقت بما قبلها")
                        i += 1; continue
                    }
                    let vowel: VowelSpec = v.kind == .short
                        ? .known(length: .short, quality: v.quality)
                        : .unknown(options: [.none, .short], longQuality: nil)
                    units.append(PhonUnit(consonant: Ar.hamza, vowel: vowel, word: w, source: "hamzat_qat"))
                    i += 1; continue
                }

                var consonant = Ar.hamzaBase(L.ch)
                var vowel: VowelSpec

                if L.ch == Ar.alefMadda {
                    units.append(PhonUnit(consonant: Ar.hamza, vowel: .known(length: .long, quality: "a"), word: w))
                    i += 1; continue
                }
                if L.ch == Ar.tehMarbuta {
                    consonant = atPause ? Ar.heh : Ar.teh
                    trace.append("taMarbuta: \(atPause ? "وقف — هاء" : "وصل — تاء")")
                }

                if L.marks.contains(Ar.shadda) && !geminationEmitted {
                    units.append(PhonUnit(consonant: consonant, vowel: .known(length: .none, quality: nil), word: w, source: "shadda"))
                    trace.append("shadda: ساكن ثم متحرك")
                }
                geminationEmitted = false

                switch v.kind {
                case .short, .tanween: vowel = .known(length: .short, quality: v.quality)
                case .sukun: vowel = .known(length: .none, quality: nil)
                case .long: vowel = .known(length: .long, quality: "a")
                case .none:
                    if L.ch == Ar.alefHamzaBelow {
                        vowel = .known(length: .short, quality: "i")
                    } else {
                        vowel = .unknown(options: [.none, .short], longQuality: nil)
                    }
                }

                // المدّ
                var suppressNext = false
                var consumedMater = false
                if i + 1 < letters.count, !vowel.isSilent {
                    let next = letters[i + 1]
                    if !Ar.hamzaForms.contains(next.ch), let q = materQuality(next.ch),
                       !hasOwnVowel(next), !isSilentAlefOfJamaa(letters, i + 1) {
                        if next.ch == Ar.alef || next.ch == Ar.alefMaqsura {
                            vowel = .known(length: .long, quality: "a")
                            consumedMater = true
                        } else if case .known(let len, let quality) = vowel, len == .short, quality == q {
                            vowel = .known(length: .long, quality: q)
                            consumedMater = true
                        } else if case .unknown = vowel {
                            vowel = .unknown(options: [.none, .short, .long], longQuality: q)
                            suppressNext = true
                        }
                    }
                }

                units.append(PhonUnit(consonant: consonant, vowel: vowel, word: w, suppressNextIfLong: suppressNext))

                if v.kind == .tanween {
                    units.append(PhonUnit(consonant: Ar.noon, vowel: .known(length: .none, quality: nil), word: w, source: "tanween"))
                    trace.append("tanween: نون ساكنة")
                }

                i += consumedMater ? 2 : 1
            }
        }

        return PhonemizeResult(units: units, trace: trace)
    }
}
