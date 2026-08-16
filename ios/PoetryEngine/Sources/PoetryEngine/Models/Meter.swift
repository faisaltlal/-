import Foundation

/// طاروق: صيغة/زحاف مسمّى لبحر معيّن — تسلسل تفعيلات محدد بأسماء التفعيلات (قابلة للبحث في `FootLibrary`).
public struct Tarooq: Codable, Equatable, Sendable, Identifiable {
    public let id: String
    public let name: String
    /// أسماء التفعيلات بالترتيب لِـ"شطر واحد" من البيت.
    public let feet: [String]
    public let description: String?

    public init(id: String, name: String, feet: [String], description: String?) {
        self.id = id
        self.name = name
        self.feet = feet
        self.description = description
    }
}

/// بحر من بحور الشعر النبطي: اسمه، تفعيلاته الأساسية لكل شطر، وقائمة الطواريق (الصيغ/الزحافات) المسجّلة له.
public struct Meter: Codable, Equatable, Sendable, Identifiable {
    public let id: String
    public let name: String
    /// أسماء التفعيلات الأساسية (الصورة التامة) لشطر واحد.
    public let canonicalFeet: [String]
    public let tarooq: [Tarooq]
    public let notes: String?

    public init(id: String, name: String, canonicalFeet: [String], tarooq: [Tarooq], notes: String?) {
        self.id = id
        self.name = name
        self.canonicalFeet = canonicalFeet
        self.tarooq = tarooq
        self.notes = notes
    }

    /// الطاروق التام (الصورة الكاملة بلا زحاف)، إن وُجد صراحة، وإلا طاروق مبني من `canonicalFeet`.
    public var completeTarooq: Tarooq {
        if let exact = tarooq.first(where: { $0.feet == canonicalFeet }) {
            return exact
        }
        return Tarooq(id: id + "-canonical", name: name, feet: canonicalFeet, description: nil)
    }
}

/// حاوية بيانات البحور المحمَّلة من `meters.json`، مع جدول تفعيلات (اسم ← تشكيل صوتي كامل).
struct MeterCatalogFile: Codable {
    let feet: [String: String]
    let meters: [Meter]
}
