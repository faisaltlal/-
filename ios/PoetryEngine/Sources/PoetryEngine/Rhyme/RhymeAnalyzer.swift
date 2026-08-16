import Foundation

/// يحلّل القافية بمقارنة حرف الروي (آخر صامت مسموع، متجاوَزًا حروف المد الساكنة الصرفة في آخر الشطر)
/// بين شطري البيت. يُعيد `nil` إن تعذّر تقسيم البيت إلى شطرين أصلًا (لا معنى لقافية بلا شطرين للمقارنة).
enum RhymeAnalyzer {
    private static let pureMaddMarkers: Set<String> = ["ا", "و", "ي"]

    static func analyze(firstUnits: [ProsodicUnit], secondUnits: [ProsodicUnit]) -> RhymeResult? {
        guard !firstUnits.isEmpty, !secondUnits.isEmpty else { return nil }

        let firstRawi = rawiLetter(in: firstUnits)
        let secondRawi = rawiLetter(in: secondUnits)
        let consistent = firstRawi != nil && firstRawi == secondRawi

        return RhymeResult(
            firstHemistichRawi: firstRawi,
            secondHemistichRawi: secondRawi,
            isConsistent: consistent,
            firstHemistichEnding: lastEnding(of: firstUnits),
            secondHemistichEnding: lastEnding(of: secondUnits)
        )
    }

    private static let diacriticScalars: Set<Unicode.Scalar> = [
        Arabic.shadda, Arabic.fatha, Arabic.damma, Arabic.kasra, Arabic.sukun,
        Arabic.fathatan, Arabic.dammatan, Arabic.kasratan
    ]

    /// يُرجع الحرف الأساس فقط بلا أي حركة (حرف الروي هو هوية الصامت، بمعزل عن حركته).
    private static func baseLetterOnly(_ display: String) -> String {
        let filtered = display.unicodeScalars.filter { !diacriticScalars.contains($0) }
        return String(String.UnicodeScalarView(filtered))
    }

    private static func rawiLetter(in units: [ProsodicUnit]) -> String? {
        for unit in units.reversed() {
            if pureMaddMarkers.contains(unit.display) { continue }
            let base = baseLetterOnly(unit.display)
            guard !base.isEmpty else { continue }
            return base
        }
        return nil
    }

    private static func lastEnding(of units: [ProsodicUnit], count: Int = 3) -> String {
        units.suffix(count).map(\.display).joined(separator: "")
    }
}
