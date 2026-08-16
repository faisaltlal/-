import Foundation

/// تفعيلة مستخرَجة فعليًا من البيت المُدخَل (وليست تفعيلة معيارية من قاعدة البيانات).
public struct ScannedFoot: Equatable, Sendable, Codable {
    /// اسم التفعيلة المطابقة (مثل "مستفعلن")، أو nil إن لم تُطابق أي تفعيلة معروفة.
    public let footName: String?
    /// النمط الثنائي الفعلي لهذه التفعيلة كما استُخرج من البيت.
    public let pattern: String
    /// الجزء المقابل من الكتابة العروضية.
    public let prosodicText: String

    public init(footName: String?, pattern: String, prosodicText: String) {
        self.footName = footName
        self.pattern = pattern
        self.prosodicText = prosodicText
    }
}

/// نتيجة مطابقة بحر واحد (تام أو عبر طاروق) مع درجة تشابهه بالبيت المُدخَل.
public struct MeterMatch: Equatable, Sendable, Codable {
    public let meter: Meter
    public let matchedTarooq: Tarooq
    /// درجة التشابه بين النمط الرقمي للبيت ونمط هذا البحر/الطاروق (0...1)، حيث 1 يعني تطابقًا تامًا.
    public let similarity: Double

    public init(meter: Meter, matchedTarooq: Tarooq, similarity: Double) {
        self.meter = meter
        self.matchedTarooq = matchedTarooq
        self.similarity = similarity
    }
}

/// نتيجة تحليل القافية والروي بمقارنة نهاية الشطرين.
public struct RhymeResult: Equatable, Sendable, Codable {
    /// حرف الروي (آخر صامت يتكرر) في الشطر الأول.
    public let firstHemistichRawi: String?
    /// حرف الروي في الشطر الثاني.
    public let secondHemistichRawi: String?
    /// هل تطابق حرف الروي بين الشطرين؟
    public let isConsistent: Bool
    /// المقطع الأخير (الكتابة العروضية) من كل شطر، لعرضه للمستخدم.
    public let firstHemistichEnding: String
    public let secondHemistichEnding: String

    public init(
        firstHemistichRawi: String?,
        secondHemistichRawi: String?,
        isConsistent: Bool,
        firstHemistichEnding: String,
        secondHemistichEnding: String
    ) {
        self.firstHemistichRawi = firstHemistichRawi
        self.secondHemistichRawi = secondHemistichRawi
        self.isConsistent = isConsistent
        self.firstHemistichEnding = firstHemistichEnding
        self.secondHemistichEnding = secondHemistichEnding
    }
}

/// بيانات وسيطة خام لأغراض التطوير والتشخيص (Debug Mode) — لا تُعرض للمستخدم النهائي.
public struct RawAnalysis: Equatable, Sendable, Codable {
    public let normalizedText: String
    public let hemistichSplit: [String]
    public let hadExplicitDiacritics: Bool
    public let diacriticCoverageRatio: Double
    public let analysisDurationMs: Double

    public init(
        normalizedText: String,
        hemistichSplit: [String],
        hadExplicitDiacritics: Bool,
        diacriticCoverageRatio: Double,
        analysisDurationMs: Double
    ) {
        self.normalizedText = normalizedText
        self.hemistichSplit = hemistichSplit
        self.hadExplicitDiacritics = hadExplicitDiacritics
        self.diacriticCoverageRatio = diacriticCoverageRatio
        self.analysisDurationMs = analysisDurationMs
    }
}

/// أخطاء/تنبيهات غير قاتلة يرصدها المحرك أثناء التحليل (المحرك لا "يفشل" أبدًا بخطأ غير مُلتقَط — بل يُعيد نتيجة تحمل هذه القائمة).
public enum AnalysisError: String, Codable, Sendable, Equatable, Hashable {
    case emptyInput
    case noRecognizableArabicText
    case textTooLong
    case missingDiacriticsReducesAccuracy
    case couldNotSplitHemistichs
    case inputContainsNonArabicCharacters

    public var localizedDescriptionAr: String {
        switch self {
        case .emptyInput:
            return "لم يتم إدخال أي نص."
        case .noRecognizableArabicText:
            return "لم يتم العثور على نص عربي يمكن تحليله."
        case .textTooLong:
            return "النص طويل جدًا؛ يُفضَّل تحليل بيت واحد في كل مرة."
        case .missingDiacriticsReducesAccuracy:
            return "البيت غير مُشكَّل بالكامل؛ النتيجة تقريبية وقد تختلف بإضافة التشكيل."
        case .couldNotSplitHemistichs:
            return "تعذّر تقسيم البيت إلى شطرين بثقة؛ حُلِّل كوحدة واحدة."
        case .inputContainsNonArabicCharacters:
            return "تجاهل المحرك رموزًا غير عربية (أرقام/رموز/حروف لاتينية) أثناء التحليل."
        }
    }
}

/// نتيجة تحليل بيت شعري كاملة — القيمة المُعادة من `PoetryEngine.analyze(_:)`.
public struct AnalysisResult: Equatable, Sendable, Codable {
    /// هل البيت موزون (طابق بحرًا معروفًا بثقة كافية)؟
    public let isMetered: Bool
    /// أفضل مطابقة بحر/طاروق، إن وُجدت.
    public let meter: MeterMatch?
    /// الطاروق المطابق (نفس المُشار إليه داخل `meter`، مكرّر هنا كحقل مستقل لسهولة الوصول من الواجهة).
    public let tarooq: Tarooq?
    /// درجة الثقة الكلية في النتيجة (0...1) — تنخفض مع غياب التشكيل أو ضعف التطابق.
    public let confidence: Double
    /// الكتابة العروضية الكاملة للبيت بعد تطبيق كل قواعد التحويل.
    public let prosodicText: String
    /// التفعيلات المستخرَجة فعليًا من البيت.
    public let feet: [ScannedFoot]
    /// النمط الرقمي الكامل (سلسلة من 1 و0).
    public let numericPattern: String
    /// المقاطع العروضية (سبب/وتد/فاصلة).
    public let syllables: [Syllable]
    /// تحليل القافية/الروي بين شطري البيت، إن أمكن تقسيمه.
    public let rhyme: RhymeResult?
    /// بيانات تشخيصية خام (لوضع التطوير فقط).
    public let rawAnalysis: RawAnalysis
    /// أقرب البحور المحتملة عند عدم التطابق التام أو انعدامه (الأعلى تشابهًا أولًا).
    public let alternatives: [MeterMatch]
    /// أخطاء/تنبيهات غير قاتلة.
    public let errors: [AnalysisError]

    public init(
        isMetered: Bool,
        meter: MeterMatch?,
        tarooq: Tarooq?,
        confidence: Double,
        prosodicText: String,
        feet: [ScannedFoot],
        numericPattern: String,
        syllables: [Syllable],
        rhyme: RhymeResult?,
        rawAnalysis: RawAnalysis,
        alternatives: [MeterMatch],
        errors: [AnalysisError]
    ) {
        self.isMetered = isMetered
        self.meter = meter
        self.tarooq = tarooq
        self.confidence = confidence
        self.prosodicText = prosodicText
        self.feet = feet
        self.numericPattern = numericPattern
        self.syllables = syllables
        self.rhyme = rhyme
        self.rawAnalysis = rawAnalysis
        self.alternatives = alternatives
        self.errors = errors
    }
}
