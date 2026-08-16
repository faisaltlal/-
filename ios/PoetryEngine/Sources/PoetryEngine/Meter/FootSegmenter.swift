import Foundation

/// يقسّم تسلسل وحدات عروضية (شطر واحد عادة) إلى تفعيلات مسمّاة وفق طاروق مطابَق، بمطابقة كل جزء
/// بطول التفعيلة المتوقَّع من `FootLibrary`. أي جزء لا يطابق نمط اسمه المتوقَّع يُعاد بلا اسم (`footName == nil`)
/// حتى تعرضه الواجهة كـ"غير مؤكَّد" بدل إخفائه أو التظاهر بمطابقته.
enum FootSegmenter {
    static func segment(units: [ProsodicUnit], tarooq: Tarooq, footLibrary: FootLibrary) -> [ScannedFoot] {
        guard !units.isEmpty else { return [] }
        var result: [ScannedFoot] = []
        var cursor = 0

        for footName in tarooq.feet {
            guard cursor < units.count else { break }
            guard let expectedPattern = footLibrary.pattern(forFootNamed: footName) else { continue }
            let length = expectedPattern.count
            let end = min(cursor + length, units.count)
            let slice = Array(units[cursor..<end])
            let actualPattern = NumericPatternBuilder.pattern(from: slice)
            let displayText = slice.map(\.display).joined(separator: "")
            let matchedName = (actualPattern == expectedPattern) ? footName : nil
            result.append(ScannedFoot(footName: matchedName, pattern: actualPattern, prosodicText: displayText))
            cursor = end
        }

        if cursor < units.count {
            let remaining = Array(units[cursor...])
            let pattern = NumericPatternBuilder.pattern(from: remaining)
            let text = remaining.map(\.display).joined(separator: "")
            result.append(ScannedFoot(footName: nil, pattern: pattern, prosodicText: text))
        }

        return result
    }
}
