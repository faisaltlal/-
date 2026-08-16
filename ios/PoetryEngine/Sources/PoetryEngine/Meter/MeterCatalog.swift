import Foundation

/// يحمّل قائمة البحور والطواريق من `meters.json` المُضمَّن في حزمة الموارد، ويحسب مسبقًا النمط الرقمي
/// (لكل شطر) لكل طاروق في كل بحر عبر `FootLibrary`، لتسريع المطابقة لاحقًا.
public struct MeterCatalog: Sendable {
    public let meters: [Meter]
    let footLibrary: FootLibrary

    /// (بحر، طاروق، نمط الشطر الرقمي) — قائمة مسطّحة تسهّل المطابقة.
    let flattenedPatterns: [(meter: Meter, tarooq: Tarooq, pattern: String)]

    init(meters: [Meter], footLibrary: FootLibrary) {
        self.meters = meters
        self.footLibrary = footLibrary
        var flattened: [(meter: Meter, tarooq: Tarooq, pattern: String)] = []
        for meter in meters {
            for tarooq in meter.tarooq {
                if let pattern = footLibrary.pattern(forFeet: tarooq.feet) {
                    flattened.append((meter, tarooq, pattern))
                }
            }
        }
        self.flattenedPatterns = flattened
    }

    /// يحمّل الكتالوج المُضمَّن افتراضيًا مع التطبيق (bundled resource). عند فشل نادر (تلف ملف الموارد نفسه،
    /// وهو ما لا يجب أن يحدث في بناء صحيح) يُسجَّل ذلك عبر `assertionFailure` (يوقف التنفيذ في Debug فقط)
    /// ويُعاد كتالوج فارغ بدل تعطّل التطبيق بالكامل في الإصدار النهائي.
    public static let shared: MeterCatalog = {
        do {
            return try MeterCatalog.load()
        } catch {
            assertionFailure("تعذّر تحميل meters.json المُضمَّن: \(error)")
            return MeterCatalog(meters: [], footLibrary: FootLibrary(vocalizedSpellings: [:]))
        }
    }()

    static func load() throws -> MeterCatalog {
        guard let url = Bundle.module.url(forResource: "meters", withExtension: "json") else {
            throw MeterCatalogError.resourceNotFound
        }
        let data = try Data(contentsOf: url)
        let file = try JSONDecoder().decode(MeterCatalogFile.self, from: data)
        let library = FootLibrary(vocalizedSpellings: file.feet)
        return MeterCatalog(meters: file.meters, footLibrary: library)
    }
}

enum MeterCatalogError: Error {
    case resourceNotFound
}
