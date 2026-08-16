import Foundation

/// وحدة عروضية واحدة: حرف واحد بعد التحويل العروضي، مع تحديد حركته (متحرك) أو سكونه (ساكن).
/// هذه هي اللَّبِنة الأساسية التي يُبنى منها النمط الرقمي والمقاطع والتفعيلات.
public struct ProsodicUnit: Equatable, Sendable, Codable {
    /// الشكل الظاهر لهذه الوحدة عند إعادة بناء الكتابة العروضية (حرف أو حرفان في حالة إدغام الشدة).
    public let display: String

    /// هل الحرف متحرك (له حركة قصيرة) أم ساكن؟
    public let isMutaharrik: Bool

    /// الحركة إن كان الحرف متحركًا (nil إذا كان ساكنًا).
    public let harakah: Harakah?

    /// فهرس الكلمة (بعد التطبيع) التي أنتجت هذه الوحدة، لأغراض التتبع وربط النتيجة بالنص الأصلي.
    public let wordIndex: Int

    public init(display: String, isMutaharrik: Bool, harakah: Harakah?, wordIndex: Int) {
        self.display = display
        self.isMutaharrik = isMutaharrik
        self.harakah = harakah
        self.wordIndex = wordIndex
    }

    /// الرمز الثنائي المستخدم في النمط الرقمي: "1" للمتحرك و"0" للساكن.
    public var symbol: Character { isMutaharrik ? "1" : "0" }
}
