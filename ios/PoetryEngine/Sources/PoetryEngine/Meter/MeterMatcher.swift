import Foundation

/// تشابه نصّي بين نمطين رقميين، باستخدام مسافة ليفنشتاين المعيارية (0 = متطابقان تمامًا).
enum PatternSimilarity {
    static func levenshteinDistance(_ a: String, _ b: String) -> Int {
        let aChars = Array(a)
        let bChars = Array(b)
        if aChars.isEmpty { return bChars.count }
        if bChars.isEmpty { return aChars.count }

        var previous = Array(0...bChars.count)
        var current = Array(repeating: 0, count: bChars.count + 1)

        for i in 1...aChars.count {
            current[0] = i
            for j in 1...bChars.count {
                if aChars[i - 1] == bChars[j - 1] {
                    current[j] = previous[j - 1]
                } else {
                    current[j] = 1 + min(previous[j - 1], min(previous[j], current[j - 1]))
                }
            }
            previous = current
        }
        return previous[bChars.count]
    }

    /// درجة تشابه بين 0 و1، حيث 1 يعني تطابقًا تامًا.
    static func similarity(_ a: String, _ b: String) -> Double {
        let maxLen = max(a.count, b.count)
        guard maxLen > 0 else { return 1.0 }
        let distance = levenshteinDistance(a, b)
        return 1.0 - Double(distance) / Double(maxLen)
    }
}

/// يطابق نمطًا رقميًا مُستخرَجًا من بيت المستخدم مقابل كل (بحر، طاروق) في الكتالوج، ويرتّب النتائج
/// حسب درجة التشابه لاختيار أفضل مطابقة وأقرب البدائل.
struct MeterMatcher: Sendable {
    struct MatchOutcome: Sendable {
        let best: MeterMatch?
        let alternatives: [MeterMatch]
        let isExactOrNearMatch: Bool
    }

    let catalog: MeterCatalog

    /// تشابه 0.85 فأعلى يُعدّ "موزونًا" حتى لو لم يكن تطابقًا تامًا (زحاف غير مسجَّل صراحة كطاروق مستقل).
    private let nearMatchThreshold = 0.85

    init(catalog: MeterCatalog) {
        self.catalog = catalog
    }

    func match(pattern: String) -> MatchOutcome {
        guard !pattern.isEmpty, !catalog.flattenedPatterns.isEmpty else {
            return MatchOutcome(best: nil, alternatives: [], isExactOrNearMatch: false)
        }

        var scored: [(meter: Meter, tarooq: Tarooq, similarity: Double)] = []
        for entry in catalog.flattenedPatterns {
            scored.append((entry.meter, entry.tarooq, PatternSimilarity.similarity(pattern, entry.pattern)))
        }
        scored.sort { $0.similarity > $1.similarity }

        guard let bestEntry = scored.first else {
            return MatchOutcome(best: nil, alternatives: [], isExactOrNearMatch: false)
        }
        let best = MeterMatch(meter: bestEntry.meter, matchedTarooq: bestEntry.tarooq, similarity: bestEntry.similarity)

        var seenMeterIDs: Set<String> = [bestEntry.meter.id]
        var alternatives: [MeterMatch] = []
        for entry in scored.dropFirst() {
            guard !seenMeterIDs.contains(entry.meter.id) else { continue }
            seenMeterIDs.insert(entry.meter.id)
            alternatives.append(MeterMatch(meter: entry.meter, matchedTarooq: entry.tarooq, similarity: entry.similarity))
            if alternatives.count >= 3 { break }
        }

        return MatchOutcome(best: best, alternatives: alternatives, isExactOrNearMatch: best.similarity >= nearMatchThreshold)
    }
}
