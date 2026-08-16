import Foundation

/// يحسب النمط الرقمي المعياري لتفعيلة معيّنة من تشكيلها الكامل (مثل "مُسْتَفْعِلُنْ")، مستخدمًا نفس محرك
/// النطق المستخدم لتحليل بيت المستخدم — بهذا يبقى تعريف "صحة" أي نمط تفعيلة متّسقًا مع نفس القواعد دائمًا،
/// دون الاعتماد على حفظ سلاسل أرقام جاهزة قد تحتوي خطأ نسخ يدوي.
struct FootLibrary: Sendable {
    /// اسم التفعيلة ← تشكيلها الكامل، كما تُحمَّل من `meters.json`.
    let vocalizedSpellings: [String: String]

    private var cachedPatterns: [String: String] = [:]

    init(vocalizedSpellings: [String: String]) {
        self.vocalizedSpellings = vocalizedSpellings
        var cache: [String: String] = [:]
        for (name, spelling) in vocalizedSpellings {
            let (units, _) = ProsodicTranscriber.transcribe(words: [spelling], isAbsoluteStart: true)
            cache[name] = NumericPatternBuilder.pattern(from: units)
        }
        cachedPatterns = cache
    }

    func pattern(forFootNamed name: String) -> String? {
        cachedPatterns[name]
    }

    /// نمط سلسلة من أسماء تفعيلات (شطر كامل)، بدمج أنماطها بالترتيب. يُعيد nil إن كان أي اسم تفعيلة غير معروف.
    func pattern(forFeet feet: [String]) -> String? {
        var combined = ""
        for name in feet {
            guard let p = pattern(forFootNamed: name) else { return nil }
            combined += p
        }
        return combined
    }
}
