import Foundation

/// حركة إعرابية/بنائية قصيرة (short vowel) تُلحق بحرف عربي.
public enum Harakah: String, Codable, Sendable, Equatable {
    case fatha
    case damma
    case kasra

    /// الحرف المستخدم لعرض هذه الحركة فوق حرف عند إعادة بناء النص العروضي.
    var diacriticScalar: Character {
        switch self {
        case .fatha: return "\u{064E}"
        case .damma: return "\u{064F}"
        case .kasra: return "\u{0650}"
        }
    }
}
