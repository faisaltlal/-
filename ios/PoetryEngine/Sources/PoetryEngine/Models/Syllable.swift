import Foundation

/// تصنيف المقطع العروضي الكلاسيكي (سبب/وتد/فاصلة) المبني من وحدات متحركة/ساكنة متتالية.
public enum SyllableKind: String, Codable, Sendable, Equatable {
    /// سبب خفيف: متحرك + ساكن (١٠)
    case sababKhafif = "سبب_خفيف"
    /// سبب ثقيل: متحرك + متحرك (١١)
    case sababThaqil = "سبب_ثقيل"
    /// وتد مجموع: متحرك + متحرك + ساكن (١١٠)
    case watadMajmoo = "وتد_مجموع"
    /// وتد مفروق: متحرك + ساكن + متحرك (١٠١)
    case watadMafrooq = "وتد_مفروق"
    /// فاصلة صغرى: متحرك×٣ + ساكن (١١١٠)
    case fasilaSughra = "فاصلة_صغرى"
    /// فاصلة كبرى: متحرك×٤ + ساكن (١١١١٠)
    case fasilaKubra = "فاصلة_كبرى"
    /// مقطع مفرد متبقٍّ لا يكتمل به أحد الأنماط أعلاه (يظهر عادة في نهاية الشطر).
    case single = "مقطع_مفرد"

    public var displayName: String {
        switch self {
        case .sababKhafif: return "سبب خفيف"
        case .sababThaqil: return "سبب ثقيل"
        case .watadMajmoo: return "وتد مجموع"
        case .watadMafrooq: return "وتد مفروق"
        case .fasilaSughra: return "فاصلة صغرى"
        case .fasilaKubra: return "فاصلة كبرى"
        case .single: return "مقطع"
        }
    }
}

/// مقطع عروضي: تجميع لوحدة أو أكثر من `ProsodicUnit` وفق أنماط السبب/الوتد/الفاصلة.
public struct Syllable: Equatable, Sendable, Codable {
    public let kind: SyllableKind
    public let display: String
    public let pattern: String

    public init(kind: SyllableKind, display: String, pattern: String) {
        self.kind = kind
        self.display = display
        self.pattern = pattern
    }
}
