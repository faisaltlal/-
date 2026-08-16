import Foundation

/// يجزّئ تسلسل وحدات عروضية إلى مقاطع كلاسيكية (سبب خفيف/ثقيل، وتد مجموع/مفروق، فاصلة صغرى/كبرى)
/// بخوارزمية جشعة (Greedy) تُفضّل أطول نمط معروف عند كل موضع، من اليمين إلى اليسار (اتجاه القراءة العروضية).
enum SyllableSegmenter {
    /// الأنماط مرتّبة من الأطول للأقصر ليُفضَّل الأطول عند التطابق (فاصلة كبرى قبل وتد قبل سبب).
    private static let knownPatterns: [(pattern: String, kind: SyllableKind)] = [
        ("11110", .fasilaKubra),
        ("1110", .fasilaSughra),
        ("110", .watadMajmoo),
        ("101", .watadMafrooq),
        ("11", .sababThaqil),
        ("10", .sababKhafif)
    ]

    static func segment(units: [ProsodicUnit]) -> [Syllable] {
        var syllables: [Syllable] = []
        var index = 0
        let symbols = units.map { $0.symbol }

        while index < units.count {
            var matched = false
            for candidate in knownPatterns {
                let length = candidate.pattern.count
                guard index + length <= symbols.count else { continue }
                let slice = String(symbols[index..<(index + length)])
                if slice == candidate.pattern {
                    let display = units[index..<(index + length)].map(\.display).joined(separator: "")
                    syllables.append(Syllable(kind: candidate.kind, display: display, pattern: slice))
                    index += length
                    matched = true
                    break
                }
            }
            if !matched {
                let unit = units[index]
                syllables.append(Syllable(kind: .single, display: unit.display, pattern: String(unit.symbol)))
                index += 1
            }
        }
        return syllables
    }
}
